// ============================================================================
// CDM QUOTE PRO - MAIN APP V9
// Routes between LO tool and consumer quote view
// Fixed: Login loop issue in Edge browser
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase, setAccessToken, clearAccessToken } from './supabaseClient';
import AuthComponent from './components/AuthComponent';
import QuotePro from './pages/QuotePro';
import ConsumerQuoteView from './pages/ConsumerQuoteView';
import ResetPassword from './pages/ResetPassword';

function App() {
  const [user, setUser] = useState(null);
  const [loanOfficer, setLoanOfficer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Check if we're on a consumer quote page or reset password (public, no auth needed)
  const isPublicPage = window.location.pathname.startsWith('/q/') || 
                       window.location.pathname === '/reset-password';

  // Check for recovery token in URL hash on initial load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      console.log('Recovery token detected in URL');
      setIsRecoveryMode(true);
      setLoading(false);
    }
  }, []);

  // Clear all Supabase auth storage
  const clearAllAuthStorage = () => {
    console.log('Clearing all auth storage...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      console.log('Removing:', key);
      localStorage.removeItem(key);
    });
    
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
  };

  useEffect(() => {
    // Skip if recovery mode
    if (isRecoveryMode) {
      return;
    }

    // Skip auth checking entirely on consumer quote pages
    if (isPublicPage) {
      console.log('Public page - skipping auth check');
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    // FAILSAFE: Force loading to false after 5 seconds no matter what
    const failsafeTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('Failsafe timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    const init = async () => {
      try {
        await checkSession();
      } finally {
        if (isMounted) {
          clearTimeout(failsafeTimeout);
          setLoading(false);
        }
      }
    };
    
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY event - entering recovery mode');
        setIsRecoveryMode(true);
        setLoading(false);
        return;
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        clearAccessToken(); // Clear cached token
        setUser(null);
        setLoanOfficer(null);
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, loading loan officer...');
        // Cache the access token for Edge browser compatibility
        if (session.access_token) {
          setAccessToken(session.access_token);
        }
        // Set user immediately so we don't stay stuck
        setUser(session.user);
        // Then try to load loan officer
        const lo = await loadLoanOfficerWithTimeout(session.user.email);
        if (lo) {
          console.log('Loan officer loaded successfully:', lo.full_name);
          setLoanOfficer(lo);
        } else {
          console.error('Failed to load loan officer - user may not be authorized');
          // Don't clear user - let the UI show an error
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(failsafeTimeout);
      subscription.unsubscribe();
    };
  }, [isRecoveryMode]);

  const checkSession = async () => {
    try {
      console.log('Checking session...');
      
      // Wrap getSession in a timeout promise
      const getSessionWithTimeout = () => {
        return new Promise(async (resolve) => {
          const timeout = setTimeout(() => {
            console.log('getSession timed out');
            resolve({ data: { session: null }, error: new Error('Timeout') });
          }, 8000);
          
          try {
            const result = await supabase.auth.getSession();
            clearTimeout(timeout);
            resolve(result);
          } catch (err) {
            clearTimeout(timeout);
            resolve({ data: { session: null }, error: err });
          }
        });
      };
      
      const { data: { session }, error } = await getSessionWithTimeout();
      
      if (error && error.message !== 'Timeout') {
        console.log('Session check error:', error.message);
        clearAllAuthStorage();
        return;
      }
      
      if (error?.message === 'Timeout') {
        console.log('Session check timed out - showing login screen');
        return;
      }
      
      console.log('Session result:', session ? 'Found' : 'None');
      
      if (session?.user) {
        // Cache the access token for Edge browser compatibility
        if (session.access_token) {
          setAccessToken(session.access_token);
        }
        setUser(session.user);
        const lo = await loadLoanOfficerWithTimeout(session.user.email);
        if (lo) {
          setLoanOfficer(lo);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      if (error.message?.includes('auth') || error.message?.includes('token')) {
        clearAllAuthStorage();
      }
    }
  };

  // Load loan officer with timeout protection
  const loadLoanOfficerWithTimeout = async (email) => {
    console.log('Loading loan officer for:', email);
    
    return new Promise(async (resolve) => {
      const timeout = setTimeout(() => {
        console.error('loadLoanOfficer timed out');
        resolve(null);
      }, 10000); // 10 second timeout
      
      try {
        const { data: lo, error } = await supabase
          .from('loan_officers')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();

        clearTimeout(timeout);

        if (error) {
          console.error('Error loading loan officer:', error);
          resolve(null);
          return;
        }

        if (!lo) {
          console.error('No loan officer found for email:', email);
          resolve(null);
          return;
        }

        if (!lo.is_active) {
          console.error('Loan officer is not active:', email);
          resolve(null);
          return;
        }

        console.log('Loan officer loaded:', lo.full_name);
        resolve(lo);
      } catch (err) {
        clearTimeout(timeout);
        console.error('Exception loading loan officer:', err);
        resolve(null);
      }
    });
  };

  const handleAuthSuccess = (authUser, lo) => {
    console.log('handleAuthSuccess called:', authUser?.email, lo?.full_name);
    setUser(authUser);
    setLoanOfficer(lo);
  };

  const handleSignOut = async () => {
    clearAccessToken(); // Clear cached token
    await supabase.auth.signOut();
    setUser(null);
    setLoanOfficer(null);
  };

  // If recovery mode, show reset password page directly
  if (isRecoveryMode) {
    return <ResetPassword />;
  }

  // Loading state - but skip for consumer quote pages
  if (loading && !isPublicPage) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: 'white',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '3px solid rgba(255,255,255,0.3)', 
            borderTopColor: '#7B2CBF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div>Loading...</div>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            style={{
              marginTop: '24px',
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Having trouble? Click to reset
          </button>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Consumer Quote View - Public, no auth required */}
      <Route path="/q/:shareId" element={<ConsumerQuoteView />} />
      
      {/* Password Reset - Public, no auth required */}
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Login Page */}
      <Route 
        path="/login" 
        element={
          user && loanOfficer ? (
            <Navigate to="/" replace />
          ) : (
            <AuthComponent onAuthSuccess={handleAuthSuccess} />
          )
        } 
      />
      
      {/* Main App - Requires auth */}
      <Route 
        path="/*" 
        element={
          user && loanOfficer ? (
            <QuotePro 
              user={user} 
              loanOfficer={loanOfficer} 
              onSignOut={handleSignOut}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  );
}

export default App;
