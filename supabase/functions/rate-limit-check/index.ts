import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration per form type
const RATE_LIMITS: Record<string, { maxRequests: number; windowSeconds: number }> = {
  'holiday-camp': { maxRequests: 3, windowSeconds: 300 },
  'day-camps': { maxRequests: 3, windowSeconds: 300 },
  'little-forest': { maxRequests: 3, windowSeconds: 300 },
  'kenyan-experiences': { maxRequests: 3, windowSeconds: 300 },
  'homeschooling': { maxRequests: 3, windowSeconds: 300 },
  'school-experience': { maxRequests: 3, windowSeconds: 300 },
  'team-building': { maxRequests: 3, windowSeconds: 300 },
  'parties': { maxRequests: 3, windowSeconds: 300 },
  'ground-registration': { maxRequests: 10, windowSeconds: 300 }, // Higher limit for admin
  'default': { maxRequests: 3, windowSeconds: 300 },
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { visitorId, formType } = await req.json();

    if (!visitorId || !formType) {
      return new Response(
        JSON.stringify({ allowed: false, error: 'Missing visitorId or formType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get rate limit config for this form type
    const config = RATE_LIMITS[formType] || RATE_LIMITS['default'];
    const { maxRequests, windowSeconds } = config;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client IP from headers (behind load balancer)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown';

    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

    // Count recent submissions from this visitor for this form type
    const { count, error: countError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('visitor_id', visitorId)
      .eq('form_type', formType)
      .gte('submitted_at', windowStart);

    if (countError) {
      console.error('Rate limit count error:', countError);
      // Fail open - allow submission if we can't check
      return new Response(
        JSON.stringify({ allowed: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentCount = count || 0;

    if (currentCount >= maxRequests) {
      // Calculate retry time
      const { data: oldestRecord } = await supabase
        .from('rate_limits')
        .select('submitted_at')
        .eq('visitor_id', visitorId)
        .eq('form_type', formType)
        .gte('submitted_at', windowStart)
        .order('submitted_at', { ascending: true })
        .limit(1)
        .single();

      let retryAfter = windowSeconds;
      if (oldestRecord) {
        const oldestTime = new Date(oldestRecord.submitted_at).getTime();
        const expiresAt = oldestTime + windowSeconds * 1000;
        retryAfter = Math.ceil((expiresAt - Date.now()) / 1000);
      }

      console.log(`Rate limit exceeded for visitor ${visitorId} on ${formType}: ${currentCount}/${maxRequests}`);

      return new Response(
        JSON.stringify({ 
          allowed: false, 
          retryAfter: Math.max(1, retryAfter),
          message: 'Rate limit exceeded'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record this submission attempt
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        visitor_id: visitorId,
        form_type: formType,
        ip_address: clientIp,
      });

    if (insertError) {
      console.error('Rate limit insert error:', insertError);
      // Still allow submission even if we can't record it
    }

    console.log(`Rate limit check passed for visitor ${visitorId} on ${formType}: ${currentCount + 1}/${maxRequests}`);

    return new Response(
      JSON.stringify({ allowed: true, remaining: maxRequests - currentCount - 1 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow submission if check fails
    return new Response(
      JSON.stringify({ allowed: true, error: 'Check failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
