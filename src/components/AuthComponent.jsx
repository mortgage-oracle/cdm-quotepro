// ============================================================================
// AUTHENTICATION COMPONENT
// Login / Sign Up for Loan Officers
// ============================================================================

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthComponent = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nmlsNumber, setNmlsNumber] = useState('');

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
    setError(null);

    try {
      console.log('Attempting login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      console.log('Auth successful, fetching LO profile...');

      // Add timeout for LO query
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      );

      const loQueryPromise = supabase
        .from('loan_officers')
        .select('*')
        .eq('email', email)
        .single();

      const { data: lo, error: loError } = await Promise.race([loQueryPromise, timeoutPromise]);

      console.log('LO query result:', lo, loError);

      if (loError || !lo) {
        setError('No loan officer profile found. Please contact your administrator.');
        await supabase.auth.signOut();
        return;
      }

      if (!lo.is_active) {
        setError('Your account has been deactivated.');
        await supabase.auth.signOut();
        return;
      }

      console.log('Login complete, calling onAuthSuccess');
      onAuthSuccess(data.user, lo);

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          email,
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
            <path d="M 15 55 Q 15 85 50 85 Q 85 85 85 55 L 80 55 Q 80 80 50 80 Q 20 80 20 55 Z" fill="url(#logoGrad)" />
            <path d="M 25 55 Q 25 75 50 75 Q 75 75 75 55 L 70 55 Q 70 70 50 70 Q 30 70 30 55 Z" fill="#3C096C" />
          </svg>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginTop: '12px'
          }}>CDM Quote Pro</div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            Loan Officer Portal
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          background: '#f0f0f0',
          borderRadius: '12px',
          padding: '4px'
        }}>
          <button 
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '10px',
              background: mode === 'login' ? 'white' : 'transparent',
              color: mode === 'login' ? '#7B2CBF' : '#666',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setMode('signup'); setError(null); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '10px',
              background: mode === 'signup' ? 'white' : 'transparent',
              color: mode === 'signup' ? '#7B2CBF' : '#666',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#DC2626',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            {error}
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
                placeholder="you@cdmortgage.com"
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
          </form>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                placeholder="you@cdmortgage.com"
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
