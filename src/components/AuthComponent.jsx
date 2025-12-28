// ============================================================================
// AUTHENTICATION COMPONENT V4
// Login / Sign Up for Loan Officers
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

// Allowed email domains for signup
const ALLOWED_DOMAINS = ['clientdirectmtg.com'];

const AuthComponent = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [loading, setLoading] = useState(false);
  const [loginStuck, setLoginStuck] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const stuckTimerRef = useRef(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nmlsNumber, setNmlsNumber] = useState('');

  // Cleanup stuck timer on unmount
  useEffect(() => {
    return () => {
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    };
  }, []);

  // Clear messages when switching modes
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [mode]);

  // Check if email domain is allowed
  const isAllowedDomain = (email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return ALLOWED_DOMAINS.includes(domain);
  };

  // Handle reset when login is stuck (Edge browser issue)
  const handleReset = () => {
    console.log('Resetting auth state...');
    
    // Clear all localStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.log('Storage clear error:', e);
    }
    
    // Force sign out
    supabase.auth.signOut().catch(() => {});
    
    // Reload page
    window.location.reload();
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      let formatted = '';
      if (match[1]) formatted = `(${match[1]}`;
      if (match[1]?.length === 3) formatted += ') ';
      if (match[2]) formatted += match[2];
      if (match[2]?.length === 3) formatted += '-';
      if (match[3]) formatted += match[3];
      return formatted;
    }
    return value;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginStuck(false);
    setError(null);

    // Start stuck detection timer - shows reset option after 8 seconds
    stuckTimerRef.current = setTimeout(() => {
      console.log('Login appears stuck, showing reset option');
      setLoginStuck(true);
    }, 8000);

    try {
      console.log('Attempting login for:', email);
      
      // Step 1: Sign in with Supabase Auth - with timeout
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login request timed out')), 15000)
      );
      
      let authResult;
      try {
        authResult = await Promise.race([authPromise, timeoutPromise]);
      } catch (timeoutErr) {
        clearTimeout(stuckTimerRef.current);
        setError('Login timed out. Please click "Reset & Try Again" below.');
        setLoginStuck(true);
        setLoading(false);
        return;
      }
      
      const { data, error: authError } = authResult;
      
      if (authError) {
        clearTimeout(stuckTimerRef.current);
        console.error('Auth error:', authError);
        setError(authError.message);
        setLoading(false);
        return;
      }
      
      if (!data?.user) {
        clearTimeout(stuckTimerRef.current);
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }
      
      console.log('Auth successful, user:', data.user.email);
      
      // Step 2: Fetch loan officer profile
      console.log('Fetching LO profile...');
      const { data: lo, error: loError } = await supabase
        .from('loan_officers')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      clearTimeout(stuckTimerRef.current);

      if (loError) {
        console.error('LO fetch error:', loError);
        setError('No loan officer profile found. Please contact your administrator.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      
      if (!lo) {
        setError('No loan officer profile found. Please contact your administrator.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!lo.is_active) {
        setError('Your account has been deactivated.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      console.log('Login complete!');
      onAuthSuccess(data.user, lo);

    } catch (err) {
      clearTimeout(stuckTimerRef.current);
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check email domain
    if (!isAllowedDomain(email)) {
      setError('Sign up is restricted to @clientdirectmtg.com email addresses.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      const { data: lo, error: loError } = await supabase
        .from('loan_officers')
        .insert({
          email: email.toLowerCase(),
          full_name: fullName,
          phone: phone || null,
          nmls_number: nmlsNumber || null,
          title: 'Loan Officer',
          is_active: true,
          is_admin: false
        })
        .select()
        .single();

      if (loError) throw loError;

      onAuthSuccess(data.user, lo);

    } catch (err) {
      setError(err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      setSuccess('Password reset email sent! Check your inbox.');
      
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
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
            CDM Quote Pro
          </h1>
          <p style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>
            {mode === 'login' && 'Sign in to your account'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
          </p>
        </div>

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

        {/* Success Message */}
        {success && (
          <div style={{
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#166534',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clientdirectmtg.com"
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
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            
            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
              <button
                type="button"
                onClick={() => setMode('forgot')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7B2CBF',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Forgot password?
              </button>
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            
            {/* Reset button - appears when login is stuck (Edge browser issue) */}
            {loginStuck && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '2px solid #fecaca',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>🔄</span> Reset & Try Again
              </button>
            )}
            
            {/* Sign Up Link */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span style={{ color: '#888', fontSize: '14px' }}>Don't have an account? </span>
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7B2CBF',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Form */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clientdirectmtg.com"
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            {/* Back to Login */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7B2CBF',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Domain Notice */}
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#0369a1',
              fontSize: '13px'
            }}>
              🔒 Sign up is restricted to <strong>@clientdirectmtg.com</strong> email addresses.
            </div>
            
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
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
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clientdirectmtg.com"
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '6px' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  placeholder="(555) 000-0000"
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
                  NMLS #
                </label>
                <input
                  type="text"
                  value={nmlsNumber}
                  onChange={(e) => setNmlsNumber(e.target.value)}
                  placeholder="123456"
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
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '6px' }}>
                Password *
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
                Confirm Password *
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            
            {/* Back to Login */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span style={{ color: '#888', fontSize: '14px' }}>Already have an account? </span>
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7B2CBF',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Sign in
              </button>
            </div>
          </form>
        )}

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

export default AuthComponent;
