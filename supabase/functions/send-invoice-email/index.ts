import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const handler = async (req: Request): Promise<Response> => {
  console.log('🧾 send-invoice-email function started');

  if (req.method === "OPTIONS") {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  // Step 1: Extract bearer token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('❌ No valid authorization header found');
    return jsonResponse({ error: 'No authorization token provided' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Step 2: Check required env vars
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY is not set');
      return jsonResponse({ error: 'Server configuration error: missing email provider key' }, 500);
    }
    if (!supabaseUrl) {
      console.error('❌ SUPABASE_URL is not set');
      return jsonResponse({ error: 'Server configuration error: missing database URL' }, 500);
    }
    if (!serviceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
      return jsonResponse({ error: 'Server configuration error: missing service key' }, 500);
    }

    console.log('✅ All env vars present');

    // Step 3: Create admin client (bypasses RLS) and verify user token
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ Token validation failed:', userError?.message ?? 'No user returned');
      return jsonResponse({ error: 'Invalid or expired authentication token' }, 401);
    }

    const userId = user.id;
    console.log('✅ User authenticated:', userId, user.email);

    // Step 4: Check user roles (using admin client — no RLS issues)
    const { data: roles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) {
      console.error('❌ Failed to read user roles:', JSON.stringify(rolesError));
      return jsonResponse({ error: 'Unable to verify user permissions' }, 500);
    }

    console.log('📋 User roles found:', JSON.stringify(roles));

    const allowedRoles = ['admin', 'accounts', 'ceo'];
    const userRoles = roles?.map((r: any) => r.role) ?? [];
    if (!userRoles.some((role: string) => allowedRoles.includes(role))) {
      console.error('❌ User lacks required role. Has:', userRoles.join(', '), '| Needs one of:', allowedRoles.join(', '));
      return jsonResponse({ error: `Forbidden - you need one of these roles: ${allowedRoles.join(', ')}` }, 403);
    }

    console.log('✅ User authorized with role:', userRoles.join(', '));

    // Step 5: Parse request body
    const requestBody = await req.json();
    const invoiceId = requestBody.invoiceId;
    const email = requestBody.email?.trim().toLowerCase();
    const invoiceNumber = requestBody.invoiceNumber;
    const customerName = requestBody.customerName;
    const totalAmount = Number(requestBody.totalAmount ?? 0);
    const dueDate = requestBody.dueDate;
    const items: InvoiceItem[] = Array.isArray(requestBody.items) ? requestBody.items : [];
    const subtotal = Number(requestBody.subtotal ?? 0);
    const discountAmount = Number(requestBody.discountAmount ?? 0);
    const taxAmount = Number(requestBody.taxAmount ?? 0);
    const notes = requestBody.notes;
    const paymentTerms = requestBody.paymentTerms ?? 'Due on Receipt';
    const documentType: 'invoice' | 'quotation' = requestBody.documentType === 'quotation' ? 'quotation' : 'invoice';
    const isQuotation = documentType === 'quotation';
    const docLabel = isQuotation ? 'QUOTATION' : 'INVOICE';
    const docLabelLower = isQuotation ? 'Quotation' : 'Invoice';
    const dueLabel = isQuotation ? 'Valid Until' : 'Due Date';

    if (!email || !invoiceNumber || !customerName || !dueDate || (!isQuotation && !invoiceId)) {
      console.error('❌ Missing fields:', { invoiceId: !!invoiceId, email: !!email, invoiceNumber: !!invoiceNumber, customerName: !!customerName, dueDate: !!dueDate, documentType });
      return jsonResponse({ error: `Missing required ${docLabelLower.toLowerCase()} email fields` }, 400);
    }

    console.log('📧 Sending invoice to:', email, 'Invoice:', invoiceNumber);

    // Step 6: Check email suppression
    const { data: suppression } = await adminClient
      .from('email_suppressions')
      .select('email, suppression_type')
      .eq('email', email)
      .maybeSingle();

    if (suppression) {
      console.warn(`⚠️ Email suppressed: ${email} (${suppression.suppression_type})`);
      return jsonResponse({ error: `Email suppressed: ${suppression.suppression_type}` }, 400);
    }

    // Step 7: Build email HTML
    const itemsHtml = items.length > 0
      ? items.map((item) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.description}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">KES ${Number(item.unit_price ?? 0).toLocaleString()}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${Number(item.discount_percent ?? 0) > 0 ? `${item.discount_percent}%` : '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">KES ${Number(item.line_total ?? 0).toLocaleString()}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="5" style="padding: 12px; text-align: center;">Service charges as agreed</td></tr>`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #2d5016; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">${docLabel}</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${invoiceNumber}</p>
          </div>
          <div style="background-color: white; padding: 30px; border: 1px solid #ddd; border-top: none;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
              <div>
                <h3 style="color: #2d5016; margin: 0 0 10px 0;">From:</h3>
                <p style="margin: 0;">Amuse Kenya</p>
                <p style="margin: 0; color: #666;">Karura Forest, Gate F</p>
                <p style="margin: 0; color: #666;">Thigiri Ridge, Nairobi</p>
                <p style="margin: 0; color: #666;">info@amusekenya.co.ke</p>
              </div>
              <div style="text-align: right;">
                <h3 style="color: #2d5016; margin: 0 0 10px 0;">Bill To:</h3>
                <p style="margin: 0; font-weight: bold;">${customerName}</p>
                <p style="margin: 0; color: #666;">${email}</p>
              </div>
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0;"><strong>${dueLabel}:</strong> ${new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p style="margin: 5px 0 0 0;"><strong>Payment Terms:</strong> ${paymentTerms}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #2d5016; color: white;">
                  <th style="padding: 12px; text-align: left;">Description</th>
                  <th style="padding: 12px; text-align: center;">Qty</th>
                  <th style="padding: 12px; text-align: right;">Unit Price</th>
                  <th style="padding: 12px; text-align: center;">Discount</th>
                  <th style="padding: 12px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div style="text-align: right; margin-top: 20px;">
              <p style="margin: 5px 0;"><strong>Subtotal:</strong> KES ${subtotal.toLocaleString()}</p>
              ${discountAmount > 0 ? `<p style="margin: 5px 0; color: #28a745;"><strong>Discount:</strong> -KES ${discountAmount.toLocaleString()}</p>` : ''}
              ${taxAmount > 0 ? `<p style="margin: 5px 0;"><strong>Tax:</strong> KES ${taxAmount.toLocaleString()}</p>` : ''}
              <p style="margin: 15px 0 0 0; font-size: 20px; color: #2d5016;"><strong>${isQuotation ? 'Estimated Total' : 'Total Due'}: KES ${totalAmount.toLocaleString()}</strong></p>
            </div>
            ${notes ? `
              <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <strong>Notes:</strong> ${notes}
              </div>
            ` : ''}
            <div style="margin-top: 30px; padding: 20px; background-color: #e8f5e9; border-radius: 8px; border-left: 4px solid #2d5016;">
              <h3 style="margin-top: 0; color: #2d5016;">Payment Options</h3>
              <p style="margin: 5px 0;"><strong>M-Pesa:</strong> Pay Bill 247247, Account: AMUSE</p>
              <p style="margin: 5px 0;"><strong>Bank Transfer:</strong> Contact us for details</p>
              <p style="margin: 5px 0;"><strong>Cash:</strong> Pay on arrival</p>
            </div>
          </div>
          <div style="padding: 12px 30px; text-align: center; background-color: white; border-left: 1px solid #ddd; border-right: 1px solid #ddd;">
            <p style="color: #dc2626; font-size: 12px; margin: 0;"><strong>Refund Policy:</strong> 7+ days before: full refund minus 10% admin fee | 3–6 days before: 50% refund | Less than 3 days: non-refundable | No-shows: non-refundable</p>
          </div>
          <div style="background-color: #2d5016; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="margin: 0;">Questions? Contact us at info@amusekenya.co.ke or +254 114 705 763</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">&copy; 2025 Amuse Kenya. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    // Step 8: Send email via Resend
    const resend = new Resend(resendApiKey);
    const emailResponse = await resend.emails.send({
      from: 'Amuse Kenya <info@amusekenya.co.ke>',
      to: [email],
      subject: `${docLabelLower} ${invoiceNumber} from Amuse Kenya`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error('❌ Resend API error:', JSON.stringify(emailResponse.error));
      throw new Error(emailResponse.error.message);
    }

    console.log(`✅ ${docLabelLower} email sent successfully. Resend ID:`, emailResponse.data?.id);

    // Step 9: Post-send DB updates (non-fatal warnings)
    const warnings: string[] = [];

    if (!isQuotation && invoiceId) {
      const { error: invoiceUpdateError } = await adminClient
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId);

      if (invoiceUpdateError) {
        console.error('⚠️ Failed to update invoice status:', JSON.stringify(invoiceUpdateError));
        warnings.push('Invoice sent, but the invoice status could not be updated.');
      }
    }

    const { error: deliveryError } = await adminClient
      .from('email_deliveries')
      .insert({
        email,
        message_id: emailResponse.data?.id || `resend-${Date.now()}`,
        recipient_type: 'customer',
        email_type: 'transactional',
        subject: `${docLabelLower} ${invoiceNumber} from Amuse Kenya`,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    if (deliveryError) {
      console.error('⚠️ Failed to track email delivery:', JSON.stringify(deliveryError));
      warnings.push('Invoice sent, but delivery tracking could not be saved.');
    }

    return jsonResponse({ success: true, data: emailResponse, warnings });
  } catch (error: any) {
    console.error('❌ Error sending invoice email:', error?.message ?? error);
    return jsonResponse(
      { error: error?.message || 'Failed to send invoice email. Please try again.' },
      500,
    );
  }
};

serve(handler);
