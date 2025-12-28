// ============================================================================
// RESET PASSWORD PAGE
// Handles password reset from email link
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase will automatically pick up the recovery token from the URL
    // and establish a session. We need to wait for that.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        // Listen for auth state change (recovery token processing)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            setSessionReady(true);
          }
        });
        
        // Cleanup
        return () => subscription.unsubscribe();
      }
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      setSuccess(true);
      
      // Sign out and redirect to login after 2 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      padding: '20px',
      fontFamily: "'Outfit', -apple-system, sans-serif"
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <svg width="60" height="60" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7B2CBF" />
                <stop offset="100%" stopColor="#9D4EDD" />
              </linearGradient>
            </defs>
            <rect x="47" y="5" width="6" height="25" fill="url(#logoGrad)" transform="rotate(0, 50, 50)" />
            <rect x="47" y="5" width="6" height="22" fill="url(#logoGrad)" transform="rotate(-25, 50, 50)" />
            <rect x="47" y="5" width="6" height="22" fill="url(#logoGrad)" transform="rotate(25, 50, 50)" />
            <rect x="47" y="5" width="6" height="18" fill="url(#logoGrad)" transform="rotate(-50, 50, 50)" />
            <rect x="47" y="5" width="6" height="18" fill="url(#logoGrad)" transform="rotate(50, 50, 50)" />
            <rect x="47" y="5" width="6" height="14" fill="url(#logoGrad)" transform="rotate(-75, 50, 50)" />
            <rect x="47" y="5" width="6" height="14" fill="url(#logoGrad)" transform="rotate(75, 50, 50)" />
            <rect x="47" y="5" width="6" height="10" fill="url(#logoGrad)" transform="rotate(-100, 50, 50)" />
            <rect x="47" y="5" width="6" height="10" fill="url(#logoGrad)" transform="rotate(100, 50, 50)" />
            <rect x="47" y="5" width="6" height="6" fill="url(#logoGrad)" transform="rotate(-125, 50, 50)" />
            <rect x="47" y="5" width="6" height="6" fill="url(#logoGrad)" transform="rotate(125, 50, 50)" />
          </svg>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginTop: '16px', color: '#1a1a1a' }}>
            Reset Password
          </h1>
          <p style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>
            Enter your new password below
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <div style={{ color: '#166534', fontSize: '16px', fontWeight: '600' }}>
              Password Reset Successfully!
            </div>
            <div style={{ color: '#166534', fontSize: '14px', marginTop: '4px' }}>
              Redirecting to login...
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Not Ready Message */}
        {!sessionReady && !success && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center',
            color: '#92400e',
            fontSize: '14px'
          }}>
            <div style={{ marginBottom: '8px' }}>⏳</div>
            Verifying reset link...
          </div>
        )}

        {/* Reset Form */}
        {sessionReady && !success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '6px' }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '6px' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginTop: '8px'
              }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a 
            href="/"
            style={{
              color: '#7B2CBF',
              fontSize: '14px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            ← Back to Sign In
          </a>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#888' }}>
          <p>Client Direct Mortgage</p>
          <p style={{ marginTop: '4px', fontSize: '11px', color: '#aaa' }}>
            Equal Housing Lender
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
