// ============================================================================
// SUPABASE CLIENT CONFIGURATION V5
// CDM Quote Pro - Database Connection
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = 'https://exghqseevcxdlckzqskc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Z2hxc2VldmN4ZGxja3pxc2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTY0MDksImV4cCI6MjA4MjM5MjQwOX0.Om4FYmM_YIvSf7bFVxPQTFU2EFjK2CpY7B6F7Uka3mU';

// Create Supabase client with explicit options
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// ============================================================================
// QUOTE FUNCTIONS
// ============================================================================

/**
 * Save a quote to the database
 * Returns the quote with its shareable link ID
 */
export async function saveQuote(loanOfficerId, quoteData) {
  const { data, error } = await supabase
    .from('quotes')
    .insert({
      loan_officer_id: loanOfficerId,
      client_name: quoteData.clientInfo?.name || 'Unknown Client',
      client_email: quoteData.clientInfo?.email || null,
      client_phone: quoteData.clientInfo?.phone || null,
      property_address: quoteData.clientInfo?.address || null,
      label: quoteData.label || null,
      quote_type: quoteData.quoteType || 'mortgage',
      quote_data: quoteData,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving quote:', error);
    throw error;
  }

  return data;
}

/**
 * Get a quote by its shareable ID (for consumer view)
 */
export async function getQuoteByShareId(shareId) {
  console.log('Fetching quote with shareId:', shareId);
  
  const fetchWithTimeout = async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Quote fetch timeout'));
      }, 10000);
      
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select(`
            *,
            loan_officers (
              id,
              full_name,
              email,
              phone,
              nmls_number,
              title,
              photo_url,
              application_url
            )
          `)
          .eq('share_id', shareId)
          .single();
        
        clearTimeout(timeout);
        
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  };
  
  try {
    const data = await fetchWithTimeout();
    console.log('Quote fetched successfully:', data?.id);
    return data;
  } catch (err) {
    console.error('getQuoteByShareId error:', err);
    throw err;
  }
}

/**
 * Get all quotes for a loan officer
 */
export async function getQuotesForLO(loanOfficerId) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('loan_officer_id', loanOfficerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching quotes:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a quote
 */
export async function deleteQuote(quoteId) {
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', quoteId);

  if (error) {
    console.error('Error deleting quote:', error);
    throw error;
  }

  return true;
}

/**
 * Update a quote
 */
export async function updateQuote(quoteId, updates) {
  const { data, error } = await supabase
    .from('quotes')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId)
    .select()
    .single();

  if (error) {
    console.error('Error updating quote:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// QUOTE VIEW TRACKING
// ============================================================================

/**
 * Record a quote view (called when consumer opens their link)
 */
export async function recordQuoteView(quoteId, viewData = {}) {
  const { data, error } = await supabase
    .from('quote_views')
    .insert({
      quote_id: quoteId,
      ip_address: viewData.ipAddress || null,
      user_agent: viewData.userAgent || navigator.userAgent,
      device_type: viewData.deviceType || detectDeviceType(),
      clicked_apply: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording view:', error);
    throw error;
  }

  return data;
}

/**
 * Update view when user clicks apply
 */
export async function recordApplyClick(viewId) {
  const { error } = await supabase
    .from('quote_views')
    .update({ clicked_apply: true })
    .eq('id', viewId);

  if (error) {
    console.error('Error recording apply click:', error);
    throw error;
  }

  return true;
}

/**
 * Detect device type from user agent
 */
function detectDeviceType() {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Get unread notifications for a loan officer
 */
export async function getUnreadNotifications(loanOfficerId) {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      quotes (
        id,
        share_id,
        client_name,
        label,
        quote_type,
        quote_data
      )
    `)
    .eq('loan_officer_id', loanOfficerId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data;
}

/**
 * Get ALL notifications for a loan officer (for Notifications page)
 */
export async function getAllNotifications(loanOfficerId, limit = 100) {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      quotes (
        id,
        share_id,
        client_name,
        label,
        quote_type,
        quote_data,
        created_at
      ),
      quote_views (
        id,
        clicked_apply,
        device_type,
        created_at
      )
    `)
    .eq('loan_officer_id', loanOfficerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching all notifications:', error);
    throw error;
  }

  return data;
}

/**
 * Mark a notification as read (dismissed from bell)
 */
export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification read:', error);
    throw error;
  }

  return true;
}

/**
 * Mark a notification as reviewed (user has followed up)
 */
export async function markNotificationReviewed(notificationId, reviewed = true) {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      reviewed: reviewed,
      reviewed_at: reviewed ? new Date().toISOString() : null
    })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification reviewed:', error);
    throw error;
  }

  return true;
}

/**
 * Mark all notifications as read for a loan officer
 */
export async function markAllNotificationsRead(loanOfficerId) {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('loan_officer_id', loanOfficerId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications read:', error);
    throw error;
  }

  return true;
}

// ============================================================================
// LOAN OFFICER FUNCTIONS
// ============================================================================

/**
 * Get loan officer by email
 */
export async function getLoanOfficerByEmail(email) {
  const { data, error } = await supabase
    .from('loan_officers')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching loan officer:', error);
    throw error;
  }

  return data;
}

/**
 * Get loan officer by ID
 */
export async function getLoanOfficerById(id) {
  const { data, error } = await supabase
    .from('loan_officers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching loan officer:', error);
    throw error;
  }

  return data;
}

/**
 * Update loan officer profile
 */
export async function updateLoanOfficerProfile(id, updates) {
  const { data, error } = await supabase
    .from('loan_officers')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating loan officer:', error);
    throw error;
  }

  return data;
}

/**
 * Update a loan officer by email (for admin bulk updates)
 */
export async function updateLoanOfficerByEmail(email, updates) {
  const { data, error } = await supabase
    .from('loan_officers')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('email', email.toLowerCase())
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found - email not in database
      console.warn('Loan officer not found:', email);
      return null;
    }
    console.error('Error updating loan officer by email:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to new notifications for a loan officer
 * Returns unsubscribe function
 */
export function subscribeToNotifications(loanOfficerId, callback) {
  const subscription = supabase
    .channel(`notifications:${loanOfficerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `loan_officer_id=eq.${loanOfficerId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate the shareable quote URL
 */
export function getShareableQuoteUrl(shareId) {
  const BASE_URL = window.location.origin;
  return `${BASE_URL}/q/${shareId}`;
}

/**
 * Check if a quote has expired
 */
export function isQuoteExpired(quote) {
  if (!quote.expires_at) return false;
  return new Date(quote.expires_at) < new Date();
}

/**
 * Get days until quote expires
 */
export function getDaysUntilExpiry(quote) {
  if (!quote.expires_at) return null;
  const expiryDate = new Date(quote.expires_at);
  const now = new Date();
  const diffTime = expiryDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default supabase;
