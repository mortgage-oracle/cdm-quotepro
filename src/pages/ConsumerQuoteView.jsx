// ============================================================================
// CONSUMER QUOTE VIEW PAGE
// What borrowers see when they click their unique quote link
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getQuoteByShareId, recordQuoteView, recordApplyClick } from '../supabaseClient';

const ConsumerQuoteView = () => {
  const { shareId } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [expandedOption, setExpandedOption] = useState(null);

  useEffect(() => {
    loadQuote();
  }, [shareId]);

  const loadQuote = async () => {
    try {
      const data = await getQuoteByShareId(shareId);
      setQuote(data);
      
      // Record the view
      const view = await recordQuoteView(data.id);
      setViewId(view.id);
    } catch (err) {
      console.error('Error loading quote:', err);
      setError('Quote not found or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = async () => {
    if (viewId) {
      await recordApplyClick(viewId);
    }
    // Navigate to application URL
    const appUrl = quote?.loan_officers?.application_url || '#';
    window.open(appUrl, '_blank');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const formatCurrencyWithCents = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const toggleDetails = (index) => {
    setExpandedOption(expandedOption === index ? null : index);
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%)',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '3px solid rgba(123,44,191,0.3)', 
            borderTopColor: '#7B2CBF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ color: '#666' }}>Loading your quote...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%)',
        fontFamily: "'Outfit', sans-serif",
        padding: '20px'
      }}>
        <div style={{ 
          textAlign: 'center', 
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          maxWidth: '400px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Quote Not Found</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            This quote may have expired or the link is invalid. Please contact your loan officer for a new quote.
          </p>
        </div>
      </div>
    );
  }

  const lo = quote.loan_officers;
  const quoteData = quote.quote_data;
  const options = quoteData.calculations || [];
  const clientName = quote.client_name || 'there';
  const daysUntilExpiry = quote.expires_at ? 
    Math.ceil((new Date(quote.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : 7;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%)',
      fontFamily: "'Outfit', -apple-system, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '20px',
        textAlign: 'center',
        borderRadius: '0 0 24px 24px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>
          CDM Quote Pro
        </h1>
        <p style={{ color: '#999', fontSize: '12px' }}>Your Personalized Loan Options</p>
      </div>
      
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 16px 40px' }}>
        {/* Expiry Notice */}
        {daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
          <div style={{
            background: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#92400E',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⏰</span>
            <span>This quote expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}.</span>
          </div>
        )}
        
        {/* LO Card */}
        {lo && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: '600',
              flexShrink: 0
            }}>
              {lo.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'LO'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>{lo.full_name}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>{lo.title || 'Loan Officer'}</div>
              <div style={{ fontSize: '11px', color: '#999' }}>NMLS# {lo.nmls_number}</div>
            </div>
          </div>
        )}
        
        {/* Greeting */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
            Hi {clientName.split(' ')[0]}! 👋
          </h2>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
            Here are your personalized loan options
            {quote.property_address && ` for ${quote.property_address}`}.
          </p>
          
          {/* Loan Summary */}
          <div style={{
            background: '#f8f8f8',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Loan Amount</div>
              <div style={{ fontWeight: '600' }}>{formatCurrency(quoteData.baseLoanAmount || 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Program</div>
              <div style={{ fontWeight: '600' }}>{quoteData.loanProgram || 'Conventional'}</div>
            </div>
          </div>
        </div>
        
        {/* Options */}
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Your Options</h3>
        
        {options.map((option, index) => (
          <div key={index} style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: option.isRecommended ? '2px solid #7B2CBF' : 'none',
            position: 'relative'
          }}>
            {option.isRecommended && (
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)',
                color: 'white',
                fontSize: '10px',
                fontWeight: '600',
                padding: '6px 12px',
                borderRadius: '0 14px 0 12px'
              }}>
                ★ Recommended
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{option.optionName || `Option ${index + 1}`}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Rate</div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{option.rate?.toFixed(3)}%</div>
                <div style={{ fontSize: '12px', color: '#666' }}>APR: {option.apr?.toFixed(3)}%</div>
              </div>
            </div>
            
            {/* Monthly Payment */}
            <div style={{
              background: 'linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>
                Estimated Monthly Payment
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>
                {formatCurrencyWithCents(option.totalMonthlyPayment || option.monthlyPI || 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                Principal, Interest, Taxes & Insurance
              </div>
            </div>
            
            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#f8f8f8', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>P&I</div>
                <div style={{ fontWeight: '600' }}>{formatCurrencyWithCents(option.monthlyPI || 0)}</div>
              </div>
              <div style={{ padding: '10px', background: '#f8f8f8', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Closing Costs</div>
                <div style={{ fontWeight: '600' }}>{formatCurrency(option.totalClosingCosts || 0)}</div>
              </div>
            </div>
            
            {/* View Details Button */}
            <button 
              onClick={() => toggleDetails(index)}
              style={{
                width: '100%',
                padding: '14px 20px',
                marginTop: '16px',
                border: '2px solid #7B2CBF',
                borderRadius: '10px',
                background: expandedOption === index ? 'linear-gradient(135deg, #7B2CBF, #9D4EDD)' : 'linear-gradient(135deg, #7B2CBF15 0%, #9D4EDD15 100%)',
                color: expandedOption === index ? 'white' : '#7B2CBF',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📋</span>
                <span>{expandedOption === index ? 'Hide' : 'See'} Full Fee Breakdown</span>
              </span>
              <span style={{ transform: expandedOption === index ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>▼</span>
            </button>
            
            {/* Expanded Details */}
            {expandedOption === index && option.fees && (
              <div style={{
                marginTop: '0',
                border: '2px solid #7B2CBF',
                borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                padding: '20px',
                background: 'linear-gradient(180deg, #7B2CBF08 0%, #ffffff 20%)'
              }}>
                {/* Fee sections would go here - simplified for now */}
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span>Total Loan Costs</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(option.totalLoanCosts || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span>Prepaids & Escrows</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(option.totalPrepaidsEscrows || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: '700', fontSize: '16px' }}>
                    <span>Total Closing Costs</span>
                    <span>{formatCurrency(option.totalClosingCosts || 0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Apply CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #7B2CBF 0%, #9D4EDD 100%)',
          borderRadius: '20px',
          padding: '32px 24px',
          marginTop: '24px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(123, 44, 191, 0.25)'
        }}>
          <h3 style={{ color: 'white', fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
            Ready to Move Forward?
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', marginBottom: '20px' }}>
            Lock in your rate by starting your application today.
          </p>
          <button
            onClick={handleApplyClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: 'white',
              color: '#7B2CBF',
              padding: '16px 48px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
            }}
          >
            <span>🚀</span>
            Start My Application
          </button>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '20px', flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>✓ Takes about 15 minutes</span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>✓ Safe & Secure</span>
          </div>
        </div>
        
        {/* Contact */}
        {lo && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            marginTop: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Have questions first?</h4>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>I'm happy to walk you through your options.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href={`tel:${lo.phone?.replace(/\D/g, '') || ''}`} style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                borderRadius: '10px',
                background: '#f0f0f0',
                color: '#1a1a1a',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '13px'
              }}>
                📞 Call
              </a>
              <a href={`sms:${lo.phone?.replace(/\D/g, '') || ''}`} style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                borderRadius: '10px',
                background: '#f0f0f0',
                color: '#1a1a1a',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '13px'
              }}>
                💬 Text
              </a>
              <a href={`mailto:${lo.email || ''}`} style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                borderRadius: '10px',
                background: '#f0f0f0',
                color: '#1a1a1a',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '13px'
              }}>
                ✉️ Email
              </a>
            </div>
          </div>
        )}
        
        {/* Disclaimer */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          background: '#f0f0f0',
          borderRadius: '12px',
          fontSize: '11px',
          color: '#888',
          lineHeight: '1.6'
        }}>
          <div style={{ fontWeight: '600', color: '#666', marginBottom: '8px' }}>Important Information</div>
          <p>
            These estimates are provided for informational purposes only and do not constitute a loan commitment. 
            Actual rates, payments, and costs may vary based on final underwriting and appraisal.
          </p>
        </div>
        
        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px', color: '#999', fontSize: '12px' }}>
          <p>Prepared by {lo?.full_name} • NMLS# {lo?.nmls_number}</p>
          <p style={{ marginTop: '4px' }}>Client Direct Mortgage • Equal Housing Lender</p>
        </div>
      </div>
    </div>
  );
};

export default ConsumerQuoteView;
