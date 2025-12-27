// ============================================================================
// CDM QUOTE PRO - MAIN APP
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

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoanOfficer(null);
      } else if (event === 'SIGNED_IN' && session) {
        await loadLoanOfficer(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await loadLoanOfficer(session.user.email);
        setUser(session.user);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLoanOfficer = async (email) => {
    const { data: lo, error } = await supabase
      .from('loan_officers')
      .select('*')
      .eq('email', email)
      .single();

    if (!error && lo && lo.is_active) {
      setLoanOfficer(lo);
      setUser({ email });
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
