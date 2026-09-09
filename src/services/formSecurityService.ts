/**
 * Form Security Service
 * Provides client-side duplicate submission prevention and server-side rate limiting
 */

import { getVisitorId } from './siteAnalyticsService';
import { supabase } from '@/integrations/supabase/client';

// Configuration
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'amuse_form_submissions';
const MAX_STORED_HASHES = 50;

interface SubmissionRecord {
  hash: string;
  formType: string;
  timestamp: number;
}

interface RateLimitResponse {
  allowed: boolean;
  retryAfter?: number;
  error?: string;
}

/**
 * Generate SHA-256 hash of form data for duplicate detection
 */
async function generateSubmissionHash(data: Record<string, unknown>): Promise<string> {
  // Extract key identifying fields
  const email = (data.email as string)?.toLowerCase().trim() || '';
  const phone = (data.phone as string)?.replace(/\D/g, '') || '';
  const parentName = (data.parentName as string)?.toLowerCase().trim() || '';
  const schoolName = (data.schoolName as string)?.toLowerCase().trim() || '';
  
  // Build hash key from identifiable data
  const keyParts = [email, phone, parentName, schoolName].filter(Boolean);
  const key = keyParts.join('|');
  
  if (!key) {
    // If no identifiable data, generate random hash to allow submission
    return crypto.randomUUID();
  }
  
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(key));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get stored submission records from localStorage
 */
function getStoredSubmissions(): SubmissionRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const records: SubmissionRecord[] = JSON.parse(stored);
    const now = Date.now();
    
    // Filter out expired records
    return records.filter(r => now - r.timestamp < DUPLICATE_WINDOW_MS);
  } catch {
    return [];
  }
}

/**
 * Save submission records to localStorage
 */
function saveSubmissions(records: SubmissionRecord[]): void {
  try {
    // Keep only the most recent records to prevent localStorage bloat
    const trimmed = records.slice(-MAX_STORED_HASHES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if form submission is allowed (client-side duplicate check)
 * @returns Object with allowed status and optional message
 */
export async function canSubmit(
  formData: Record<string, unknown>,
  formType: string
): Promise<{ allowed: boolean; message?: string }> {
  try {
    const hash = await generateSubmissionHash(formData);
    const submissions = getStoredSubmissions();
    
    // Check for recent duplicate
    const duplicate = submissions.find(
      s => s.hash === hash && s.formType === formType
    );
    
    if (duplicate) {
      const minutesAgo = Math.ceil((Date.now() - duplicate.timestamp) / 60000);
      return {
        allowed: false,
        message: `You've already submitted this registration ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago. Please wait a few minutes or contact us if you need to make changes.`
      };
    }
    
    return { allowed: true };
  } catch {
    // Fail open - allow submission if check fails
    return { allowed: true };
  }
}

/**
 * Record a successful submission for duplicate prevention
 */
export async function recordSubmission(
  formData: Record<string, unknown>,
  formType: string
): Promise<void> {
  try {
    const hash = await generateSubmissionHash(formData);
    const submissions = getStoredSubmissions();
    
    submissions.push({
      hash,
      formType,
      timestamp: Date.now()
    });
    
    saveSubmissions(submissions);
  } catch {
    // Ignore errors - this is a best-effort operation
  }
}

/**
 * Check server-side rate limit via Edge Function
 * @returns Rate limit status with retry information
 */
export async function checkServerRateLimit(
  formType: string
): Promise<RateLimitResponse> {
  try {
    const visitorId = getVisitorId();
    
    const { data, error } = await supabase.functions.invoke('rate-limit-check', {
      body: {
        visitorId,
        formType
      }
    });
    
    if (error) {
      console.warn('Rate limit check failed:', error);
      // Fail open - allow submission if rate limit check fails
      return { allowed: true };
    }
    
    return data as RateLimitResponse;
  } catch (err) {
    console.warn('Rate limit check error:', err);
    // Fail open - allow submission if rate limit check fails
    return { allowed: true };
  }
}

/**
 * Combined security check - runs both client and server checks
 * @returns Object with allowed status and optional message
 */
export async function performSecurityChecks(
  formData: Record<string, unknown>,
  formType: string
): Promise<{ allowed: boolean; message?: string }> {
  // First check client-side duplicate
  const duplicateCheck = await canSubmit(formData, formType);
  if (!duplicateCheck.allowed) {
    return duplicateCheck;
  }
  
  // Then check server-side rate limit
  const rateLimit = await checkServerRateLimit(formType);
  if (!rateLimit.allowed) {
    const retryMessage = rateLimit.retryAfter 
      ? ` Please try again in ${rateLimit.retryAfter} seconds.`
      : ' Please try again later.';
    return {
      allowed: false,
      message: `Too many submission attempts.${retryMessage}`
    };
  }
  
  return { allowed: true };
}

/**
 * Helper to wrap form submission with security checks
 * Use this in form onSubmit handlers
 */
export async function withSecurityChecks<T>(
  formData: Record<string, unknown>,
  formType: string,
  onSubmit: () => Promise<T>,
  onBlocked: (message: string) => void
): Promise<T | null> {
  const check = await performSecurityChecks(formData, formType);
  
  if (!check.allowed) {
    onBlocked(check.message || 'Submission blocked. Please try again later.');
    return null;
  }
  
  try {
    const result = await onSubmit();
    // Record successful submission
    await recordSubmission(formData, formType);
    return result;
  } catch (error) {
    throw error;
  }
}
