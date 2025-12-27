// ============================================================================
// CDM QUOTE PRO - MAIN APP V3
// Routes between LO tool and consumer quote view
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import AuthComponent from './components/AuthComponent';
import QuotePro from './pages/QuotePro';
import ConsumerQuoteView from './pages/ConsumerQuoteView';

function App() {
  const [user, setUser] = useState(null);
  const [loanOfficer, setLoanOfficer] = useState(null);
  const [loading, setLoading] = useState(true);

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
    let isMounted = true;
    
    // FAILSAFE: Force loading to false after 3 seconds no matter what
    const failsafeTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('Failsafe timeout - clearing storage and forcing loading to false');
        clearAllAuthStorage();
        setLoading(false);
      }
    }, 3000);

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
      console.log('Auth state change:', event);
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoanOfficer(null);
      } else if (event === 'SIGNED_IN' && session) {
        await loadLoanOfficer(session.user.email);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(failsafeTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      console.log('Checking session...');
      
      // Wrap getSession in a timeout promise
      const getSessionWithTimeout = () => {
        return new Promise(async (resolve) => {
          const timeout = setTimeout(() => {
            console.log('getSession timed out');
            resolve({ data: { session: null }, error: new Error('Timeout') });
          }, 2000);
          
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
      
      if (error) {
        console.log('Session check error or timeout, clearing storage:', error.message);
        clearAllAuthStorage();
        return;
      }
      
      console.log('Session result:', session ? 'Found' : 'None');
      
      if (session?.user) {
        await loadLoanOfficer(session.user.email);
        setUser(session.user);
      }
    } catch (error) {
      console.error('Session check error:', error);
      clearAllAuthStorage();
    }
  };

  const loadLoanOfficer = async (email) => {
    try {
      const { data: lo, error } = await supabase
        .from('loan_officers')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (!error && lo && lo.is_active) {
        setLoanOfficer(lo);
        setUser({ email });
      }
    } catch (err) {
      console.error('Error loading loan officer:', err);
    }
  };

  const handleAuthSuccess = (authUser, lo) => {
    setUser(authUser);
    setLoanOfficer(lo);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLoanOfficer(null);
  };

  // Loading state
  if (loading) {
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
