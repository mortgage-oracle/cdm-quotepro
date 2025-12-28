// ============================================================================
// SUPABASE CLIENT CONFIGURATION V7
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
  console.log('Saving quote for LO:', loanOfficerId);
  
  const quotePayload = {
    loan_officer_id: loanOfficerId,
    client_name: quoteData.clientInfo?.name || 'Unknown Client',
    client_email: quoteData.clientInfo?.email || null,
    client_phone: quoteData.clientInfo?.phone || null,
    property_address: quoteData.clientInfo?.address || null,
    label: quoteData.label || null,
    quote_type: quoteData.quoteType || 'mortgage',
    quote_data: quoteData,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  // Use REST API for Edge compatibility
  const token = await getAuthToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/quotes`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(quotePayload),
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errText = await response.text();
      console.error('Save quote error:', response.status, errText);
      throw new Error(`Failed to save quote: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Quote saved:', data);
    
    // Response is an array, return first item
    return Array.isArray(data) ? data[0] : data;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Error saving quote:', err);
    throw err;
  }
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

// ============================================================================
// REST API HELPER (for Edge browser compatibility)
// ============================================================================

async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function restQuery(table, queryParams = '', options = {}) {
  const token = await getAuthToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}${queryParams}`,
      {
        method: options.method || 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': options.prefer || 'return=representation'
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`REST API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('REST query error:', err);
    return { data: null, error: err };
  }
}

/**
 * Get all quotes for a loan officer
 */
export async function getQuotesForLO(loanOfficerId) {
  console.log('Fetching quotes for LO:', loanOfficerId);
  
  // Try REST API first (Edge-compatible)
  const { data, error } = await restQuery(
    'quotes',
    `?loan_officer_id=eq.${loanOfficerId}&order=created_at.desc`
  );
  
  if (error) {
    console.error('Error fetching quotes:', error);
    // Return empty array instead of throwing to prevent UI hang
    return [];
  }

  console.log('Quotes loaded:', data?.length || 0);
  return data || [];
}

/**
 * Delete a quote
 */
export async function deleteQuote(quoteId) {
  console.log('Deleting quote:', quoteId);
  
  const token = await getAuthToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/quotes?id=eq.${quoteId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to delete quote: ${response.status}`);
    }
    
    console.log('Quote deleted');
    return true;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Error deleting quote:', err);
    throw err;
  }
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
  console.log('Fetching unread notifications for LO:', loanOfficerId);
  
  // Use REST API for Edge compatibility
  const { data, error } = await restQuery(
    'notifications',
    `?loan_officer_id=eq.${loanOfficerId}&is_read=eq.false&order=created_at.desc&select=*,quotes(id,share_id,client_name,label,quote_type,quote_data)`
  );

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Get ALL notifications for a loan officer (for Notifications page)
 */
export async function getAllNotifications(loanOfficerId, limit = 100) {
  console.log('Fetching all notifications for LO:', loanOfficerId);
  
  // Use REST API for Edge compatibility
  const { data, error } = await restQuery(
    'notifications',
    `?loan_officer_id=eq.${loanOfficerId}&order=created_at.desc&limit=${limit}&select=*,quotes(id,share_id,client_name,label,quote_type,quote_data,created_at)`
  );

  if (error) {
    console.error('Error fetching all notifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Mark a notification as read (dismissed from bell)
 */
export async function markNotificationRead(notificationId) {
  const token = await getAuthToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?id=eq.${notificationId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        }),
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to mark notification read: ${response.status}`);
    }
    
    return true;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Error marking notification read:', err);
    return false;
  }
}

/**
 * Mark a notification as reviewed (user has followed up)
 */
export async function markNotificationReviewed(notificationId, reviewed = true) {
  const token = await getAuthToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?id=eq.${notificationId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ 
          reviewed: reviewed,
          reviewed_at: reviewed ? new Date().toISOString() : null
        }),
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to mark notification reviewed: ${response.status}`);
    }
    
    return true;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Error marking notification reviewed:', err);
    return false;
  }
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
