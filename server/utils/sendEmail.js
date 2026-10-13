const { createClient } = require('@supabase/supabase-js');

// Lazy initialization of Supabase client
let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rfmyrqzrwamygvyibdbs.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required. Please set it in your server/.env file. See LOCAL_SETUP.md for instructions.');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * Send email using Resend with suppression checking and delivery tracking
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} [options.emailType] - Type of email (confirmation, marketing, transactional, notification)
 * @param {string} [options.recipientType] - Type of recipient (lead, customer, registration)
 * @param {string} [options.recipientId] - ID of the recipient record
 */
const sendEmail = async (options) => {
  const { email, subject, html, emailType = 'transactional', recipientType, recipientId } = options;

  try {
    const supabaseClient = getSupabaseClient();
    
    // Step 1: Check if email is suppressed
    const { data: suppression, error: suppressionError } = await supabaseClient
      .from('email_suppressions')
      .select('email, suppression_type, reason')
      .eq('email', email)
      .maybeSingle();

    if (suppressionError) {
      console.error('Error checking email suppression:', suppressionError);
      // Continue with sending if we can't check (fail open)
    }

    if (suppression) {
      console.warn(`Email suppressed: ${email} (${suppression.suppression_type})`);
      throw new Error(`Cannot send to ${email}: ${suppression.suppression_type} - ${suppression.reason || 'No reason provided'}`);
    }

    // Step 2: Check if email is marked as invalid in leads table
    const { data: lead } = await supabaseClient
      .from('leads')
      .select('email_valid')
      .eq('email', email)
      .maybeSingle();

    if (lead && lead.email_valid === false) {
      console.warn(`Email marked invalid in leads: ${email}`);
      throw new Error(`Cannot send to ${email}: marked as invalid`);
    }

    // Step 3: Call Supabase Edge Function to send email via Resend
    const { data: functionResponse, error: functionError } = await supabaseClient.functions.invoke(
      'send-confirmation-email',
      {
        body: {
          email: email,
          programType: emailType,
          registrationDetails: {
            subject: subject
          }
        }
      }
    );

    if (functionError) {
      throw new Error(`Edge function error: ${functionError.message}`);
    }

    if (!functionResponse.success) {
      throw new Error(`Email send failed: ${functionResponse.error || 'Unknown error'}`);
    }

    const messageId = functionResponse.messageId || `resend-${Date.now()}`;
    console.log('Email sent via Resend:', messageId);

    return { MessageID: messageId, provider: 'resend' };

  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
};

module.exports = sendEmail;
