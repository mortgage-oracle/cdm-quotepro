// ============================================================================
// CONSUMER QUOTE VIEW PAGE V10
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
    if (shareId) {
      loadQuote();
    } else {
      setError('Invalid quote link.');
      setLoading(false);
    }
  }, [shareId]);

  const loadQuote = async () => {
    console.log('Loading quote for shareId:', shareId);
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Quote load timeout');
      setError('Quote is taking too long to load. Please refresh the page.');
      setLoading(false);
    }, 15000);
    
    try {
      const data = await getQuoteByShareId(shareId);
      clearTimeout(timeout);
      
      console.log('Quote loaded:', data);
      
      if (!data) {
        setError('Quote not found.');
        setLoading(false);
        return;
      }
      
      setQuote(data);
      
      // Record the view (don't let this block the UI)
      try {
        const view = await recordQuoteView(data.id);
        if (view?.id) setViewId(view.id);
      } catch (viewErr) {
        console.warn('Could not record view:', viewErr);
      }
      
      setLoading(false);
    } catch (err) {
      clearTimeout(timeout);
      console.error('Error loading quote:', err);
      setError('Quote not found or has expired.');
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
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '24px',
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid #ccc',
              borderRadius: '8px',
              color: '#888',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Taking too long? Click to refresh
          </button>
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
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              background: '#7B2CBF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Safety check - if no quote data yet
  if (!quote || !quote.quote_data) {
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
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Quote Not Available</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Unable to load quote data. Please contact your loan officer.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              background: '#7B2CBF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const lo = quote.loan_officers;
  const quoteData = quote.quote_data;
  const clientName = quote.client_name || 'there';
  
  // Determine if this is a Home Equity quote
  const isHomeEquity = quoteData.quoteType === 'home_equity' || quote.quote_type === 'home_equity';
  const isHELOC = isHomeEquity && quoteData.secondMortgageType === 'heloc';
  
  // Get options array - works for both quote types
  const options = quoteData.calculations || [];
  
  // Get loan details based on quote type
  const loanAmount = isHomeEquity 
    ? (quoteData.secondMortgageDetails?.drawAmount || quoteData.secondMortgageDetails?.lineAmount || 0)
    : (quoteData.baseLoanAmount || 0);
  
  const programLabel = isHomeEquity
    ? (isHELOC ? 'HELOC' : 'HELOAN')
    : (quoteData.loanProgram === 'fha' ? 'FHA' : 
       quoteData.loanProgram === 'va' ? 'VA' : 
       quoteData.loanProgram === 'conventional' ? 'Conventional' :
       quoteData.loanProgram || 'Conventional');
  
  // Helper to get monthly payment from option
  const getMonthlyPayment = (option) => {
    if (isHomeEquity) {
      return isHELOC ? option.interestOnlyPayment : option.monthlyPayment;
    }
    return option.totalMonthlyPayment || option.monthlyPI || 0;
  };
  
  // Helper to get closing costs from option
  const getClosingCosts = (option) => {
    if (isHomeEquity) {
      return option.fees || option.totalClosingCosts || 0;
    }
    return option.totalClosingCosts || 0;
  };
  
  // Helper to get cash figure label and value
  const getCashInfo = (option) => {
    if (isHomeEquity) {
      return {
        label: 'Cash to Borrower',
        value: option.netProceeds || 0
      };
    }
    return {
      label: 'Est. Cash to Close',
      value: option.feeBreakdown?.cashToClose || option.totalSettlement || option.totalClosingCosts || 0
    };
  };

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          {/* CDM Logo - matches main app */}
          <svg width="40" height="40" viewBox="0 0 100 100" style={{ borderRadius: '8px' }}>
            <defs>
              <linearGradient id="purpleGradConsumer" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7B2CBF" />
                <stop offset="100%" stopColor="#3C096C" />
              </linearGradient>
            </defs>
            {/* Sun rays */}
            <rect x="47" y="5" width="6" height="25" fill="url(#purpleGradConsumer)" transform="rotate(0, 50, 50)" />
            <rect x="47" y="5" width="6" height="22" fill="url(#purpleGradConsumer)" transform="rotate(-25, 50, 50)" />
            <rect x="47" y="5" width="6" height="22" fill="url(#purpleGradConsumer)" transform="rotate(25, 50, 50)" />
            <rect x="47" y="5" width="6" height="18" fill="url(#purpleGradConsumer)" transform="rotate(-50, 50, 50)" />
            <rect x="47" y="5" width="6" height="18" fill="url(#purpleGradConsumer)" transform="rotate(50, 50, 50)" />
            <rect x="47" y="5" width="5" height="14" fill="#9D4EDD" transform="rotate(-70, 50, 50)" />
            <rect x="47" y="5" width="5" height="14" fill="#9D4EDD" transform="rotate(70, 50, 50)" />
            {/* Bowl/cup shape */}
            <path d="M 15 55 Q 15 85 50 85 Q 85 85 85 55 L 80 55 Q 80 80 50 80 Q 20 80 20 55 Z" fill="url(#purpleGradConsumer)" />
            <path d="M 25 55 Q 25 75 50 75 Q 75 75 75 55 L 70 55 Q 70 70 50 70 Q 30 70 30 55 Z" fill="#3C096C" />
          </svg>
          <div>
            <h1 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0 }}>
              CDM Quote Pro
            </h1>
            <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>Your Personalized Loan Options</p>
          </div>
        </div>
      </div>
      
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 16px 40px' }}>
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
            gridTemplateColumns: isHomeEquity ? '1fr 1fr 1fr' : '1fr 1fr',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>
                {isHomeEquity ? 'Draw Amount' : 'Base Loan Amount'}
              </div>
              <div style={{ fontWeight: '600' }}>{formatCurrency(loanAmount)}</div>
              {/* Show financed fee note for FHA/VA */}
              {!isHomeEquity && options[0]?.feeBreakdown?.upfrontFee > 0 && options[0]?.feeBreakdown?.upfrontFeeFinanced && (
                <div style={{ fontSize: '10px', color: '#7B2CBF', marginTop: '2px' }}>
                  + {formatCurrency(options[0].feeBreakdown.upfrontFee)} {options[0].feeBreakdown.upfrontFeeLabel} financed
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Program</div>
              <div style={{ fontWeight: '600' }}>{programLabel}</div>
            </div>
            {isHomeEquity && (
              <div>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>CLTV</div>
                <div style={{ fontWeight: '600' }}>{((quoteData.secondMortgageDetails?.cltv || options[0]?.cltv || 0) * 100).toFixed(1)}%</div>
              </div>
            )}
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
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{(option.rate < 1 ? option.rate * 100 : option.rate)?.toFixed(3)}%</div>
                <div style={{ fontSize: '12px', color: '#666' }}>APR: {(option.apr < 1 ? option.apr * 100 : option.apr)?.toFixed(3)}%</div>
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
                {isHELOC ? 'Interest-Only Payment' : 'Monthly Payment'}
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>
                {formatCurrencyWithCents(getMonthlyPayment(option))}
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                {isHomeEquity 
                  ? (isHELOC ? 'During Draw Period' : 'Principal & Interest')
                  : 'Principal, Interest, Taxes & Insurance'}
              </div>
            </div>
            
            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#f8f8f8', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>
                  {isHomeEquity ? 'Term' : 'P&I'}
                </div>
                <div style={{ fontWeight: '600' }}>
                  {isHomeEquity 
                    ? (isHELOC ? `${option.drawPeriod}+${option.repayPeriod} yrs` : `${option.term} years`)
                    : formatCurrencyWithCents(option.monthlyPI || 0)}
                </div>
              </div>
              <div style={{ padding: '10px', background: '#f8f8f8', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Closing Costs</div>
                <div style={{ fontWeight: '600' }}>{formatCurrency(getClosingCosts(option))}</div>
              </div>
            </div>
            
            {/* Cash to Close / Cash to Borrower Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #7B2CBF 0%, #9D4EDD 100%)',
              borderRadius: '12px',
              padding: '16px',
              marginTop: '16px',
              textAlign: 'center',
              color: 'white'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.9, marginBottom: '4px' }}>
                {getCashInfo(option).label}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>
                {formatCurrency(getCashInfo(option).value)}
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
            {expandedOption === index && (
              <div style={{
                marginTop: '0',
                border: '2px solid #7B2CBF',
                borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                padding: '20px',
                background: 'linear-gradient(180deg, #7B2CBF08 0%, #ffffff 20%)'
              }}>
                {isHomeEquity ? (
                  /* HOME EQUITY FEE BREAKDOWN */
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ background: '#7B2CBF', color: 'white', padding: '8px 12px', borderRadius: '6px', fontWeight: '600', marginBottom: '16px' }}>
                      Closing Costs Breakdown
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {option.feeBreakdown?.underwriting > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span>Underwriting Fee</span>
                          <span style={{ fontWeight: '600' }}>{formatCurrency(option.feeBreakdown.underwriting)}</span>
                        </div>
                      )}
                      {option.feeBreakdown?.loComp > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span>Origination Fee</span>
                          <span style={{ fontWeight: '600' }}>{formatCurrency(option.feeBreakdown.loComp)}</span>
                        </div>
                      )}
                      {!option.feeBreakdown?.appraisalWaived && option.feeBreakdown?.appraisal > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span>Appraisal Fee</span>
                          <span style={{ fontWeight: '600' }}>{formatCurrency(option.feeBreakdown.appraisal)}</span>
                        </div>
                      )}
                      {option.feeBreakdown?.appraisalWaived && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0', color: '#16a34a' }}>
                          <span>Appraisal Fee</span>
                          <span style={{ fontWeight: '600' }}>Waived ✓</span>
                        </div>
                      )}
                      {option.feeBreakdown?.title > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span>Title / Settlement Fee</span>
                          <span style={{ fontWeight: '600' }}>{formatCurrency(option.feeBreakdown.title)}</span>
                        </div>
                      )}
                      {option.feeBreakdown?.recording > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span>Recording Fee</span>
                          <span style={{ fontWeight: '600' }}>{formatCurrency(option.feeBreakdown.recording)}</span>
                        </div>
                      )}
                      {option.feeBreakdown?.credit > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span>Credit Report</span>
                          <span style={{ fontWeight: '600' }}>{formatCurrency(option.feeBreakdown.credit)}</span>
                        </div>
                      )}
                      {option.feeBreakdown?.flood > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span>Flood Certification</span>
                          <span style={{ fontWeight: '600' }}>{formatCurrency(option.feeBreakdown.flood)}</span>
                        </div>
                      )}
                      {option.feeBreakdown?.processing > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span>Processing Fee</span>
                          <span style={{ fontWeight: '600' }}>{formatCurrency(option.feeBreakdown.processing)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Points/Credits for HELOAN */}
                    {!isHELOC && (option.pointsCost > 0 || option.lenderCredit > 0) && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
                        {option.pointsCost > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span>Discount Points</span>
                            <span style={{ fontWeight: '600' }}>{formatCurrency(option.pointsCost)}</span>
                          </div>
                        )}
                        {option.lenderCredit > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16a34a' }}>
                            <span>Lender Credit</span>
                            <span style={{ fontWeight: '600' }}>-{formatCurrency(option.lenderCredit)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Total */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '12px', 
                      marginTop: '16px',
                      background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)', 
                      borderRadius: '8px',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '16px'
                    }}>
                      <span>Total Closing Costs</span>
                      <span>{formatCurrency(getClosingCosts(option))}</span>
                    </div>
                    
                    {/* Cash to Borrower Calculation */}
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #7B2CBF' }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '12px' }}>Your Proceeds</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                        <span>{isHELOC ? 'Draw Amount' : 'Loan Amount'}</span>
                        <span style={{ fontWeight: '600' }}>{formatCurrency(option.drawAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                        <span>Less: Closing Costs</span>
                        <span style={{ fontWeight: '600', color: '#dc2626' }}>-{formatCurrency(getClosingCosts(option))}</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '12px', 
                        marginTop: '8px',
                        background: 'linear-gradient(135deg, #7B2CBF15, #9D4EDD15)', 
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '18px'
                      }}>
                        <span>Cash to You</span>
                        <span style={{ color: '#7B2CBF' }}>{formatCurrency(option.netProceeds)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* PURCHASE/REFI FEE BREAKDOWN */
                  <>
                    {/* Two Column Layout */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '13px' }}>
                      {/* Left Column - Loan Costs */}
                      <div>
                        <div style={{ background: '#7B2CBF', color: 'white', padding: '8px 12px', borderRadius: '6px', fontWeight: '600', marginBottom: '12px' }}>
                          Loan Costs
                        </div>
                        
                        {/* Section A */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>A. Origination Charges</span>
                            <span>{formatCurrency(option.feeBreakdown?.sectionA?.total || 0)}</span>
                          </div>
                          <div style={{ paddingLeft: '12px', color: '#666' }}>
                            {option.feeBreakdown?.sectionA?.pointsCost > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                <span>Points ({((option.feeBreakdown.sectionA.pointsCost / option.baseLoanAmount) * 100).toFixed(2)}%)</span>
                                <span>{formatCurrency(option.feeBreakdown.sectionA.pointsCost)}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Administration Fee</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionA?.adminFee || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Underwriting Fee</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionA?.underwritingFee || 0)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Section B */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>B. Services You Cannot Shop For</span>
                            <span>{formatCurrency(option.feeBreakdown?.sectionB?.total || 0)}</span>
                          </div>
                          <div style={{ paddingLeft: '12px', color: '#666' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Appraisal Fee</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionB?.appraisal || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Credit Report</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionB?.creditReport || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Flood Determination Fee</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionB?.floodCert || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Processing Fee</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionB?.processing || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Tax Service Fee</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionB?.taxService || 0)}</span>
                            </div>
                            {/* Upfront Government Fee (FHA UFMIP or VA Funding Fee) - show in both cases */}
                            {option.feeBreakdown?.upfrontFee > 0 && (
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '4px 0', 
                                marginTop: '4px',
                                borderTop: '1px dashed #ddd',
                                color: option.feeBreakdown?.upfrontFeeFinanced ? '#7B2CBF' : '#333',
                                fontWeight: '600'
                              }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {option.feeBreakdown?.upfrontFeeLabel || 'Gov\'t Fee'}
                                  {option.feeBreakdown?.upfrontFeeFinanced && (
                                    <span style={{ 
                                      background: '#7B2CBF', 
                                      color: 'white', 
                                      padding: '1px 5px', 
                                      borderRadius: '3px', 
                                      fontSize: '8px',
                                      textTransform: 'uppercase'
                                    }}>
                                      Financed
                                    </span>
                                  )}
                                </span>
                                <span>
                                  {option.feeBreakdown?.upfrontFeeFinanced ? (
                                    <span style={{ color: '#888', fontSize: '11px' }}>
                                      {formatCurrency(option.feeBreakdown.upfrontFee)} → Loan
                                    </span>
                                  ) : (
                                    formatCurrency(option.feeBreakdown.upfrontFee)
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Section C */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>C. Services You Can Shop For</span>
                            <span>{formatCurrency(option.feeBreakdown?.sectionC?.total || 0)}</span>
                          </div>
                          <div style={{ paddingLeft: '12px', color: '#666' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Title - Lender's Title Policy</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionC?.lendersTitle || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Title - Notary Fees</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionC?.notaryFee || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Title - Recording Service</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionC?.recordingServiceFee || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Title - Settlement or Closing Fee</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionC?.settlementFee || 0)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Section D Total */}
                        <div style={{ background: '#f0f0f0', padding: '8px 12px', borderRadius: '6px', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
                          <span>D. TOTAL LOAN COSTS (A + B + C)</span>
                          <span>{formatCurrency(option.feeBreakdown?.totalLoanCosts || 0)}</span>
                        </div>
                      </div>
                      
                      {/* Right Column - Other Costs */}
                      <div>
                        <div style={{ background: '#9D4EDD', color: 'white', padding: '8px 12px', borderRadius: '6px', fontWeight: '600', marginBottom: '12px' }}>
                          Other Costs
                        </div>
                        
                        {/* Section E */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>E. Taxes and Other Government Fees</span>
                            <span>{formatCurrency(option.feeBreakdown?.sectionE?.total || 0)}</span>
                          </div>
                          <div style={{ paddingLeft: '12px', color: '#666' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Recording Fees</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionE?.recordingFee || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Transfer Taxes</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionE?.transferTax || 0)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Section F */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>F. Prepaids</span>
                            <span>{formatCurrency(option.feeBreakdown?.sectionF?.total || 0)}</span>
                          </div>
                          <div style={{ paddingLeft: '12px', color: '#666' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Homeowner's Insurance Premium</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionF?.prepaidHOI || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Prepaid Interest</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionF?.prepaidInterest || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>Property Taxes</span>
                              <span>{formatCurrency(option.feeBreakdown?.sectionF?.prepaidTax || 0)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Section G */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#333', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>G. Initial Escrow Payment at Closing</span>
                            <span>{formatCurrency(option.feeBreakdown?.sectionG?.total || 0)}</span>
                          </div>
                          {option.feeBreakdown?.sectionG?.waived ? (
                            <div style={{ paddingLeft: '12px', color: '#888', fontStyle: 'italic' }}>Escrow Waived</div>
                          ) : (
                            <div style={{ paddingLeft: '12px', color: '#666' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                <span>Homeowner's Insurance</span>
                                <span>{formatCurrency(option.feeBreakdown?.sectionG?.escrowHOI || 0)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                <span>Property Taxes</span>
                                <span>{formatCurrency(option.feeBreakdown?.sectionG?.escrowTax || 0)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Section I Total */}
                        <div style={{ background: '#f0f0f0', padding: '8px 12px', borderRadius: '6px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span>I. TOTAL OTHER COSTS (E + F + G)</span>
                          <span>{formatCurrency(option.feeBreakdown?.totalOtherCosts || 0)}</span>
                        </div>
                        
                        {/* Section J Total */}
                        <div style={{ background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)', color: 'white', padding: '10px 12px', borderRadius: '6px', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
                          <span>J. TOTAL CLOSING COSTS</span>
                          <span>{formatCurrency(option.feeBreakdown?.totalClosingCosts || 0)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Cash to Close Calculation */}
                    <div style={{ marginTop: '20px', borderTop: '2px solid #7B2CBF', paddingTop: '16px' }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '12px' }}>Calculating Cash to Close</div>
                      <div style={{ fontSize: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                          <span>Total Closing Costs (J)</span>
                          <span style={{ fontWeight: '600' }}>{formatCurrency(option.feeBreakdown?.totalClosingCosts || 0)}</span>
                        </div>
                        {option.feeBreakdown?.downPayment > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                            <span>Down Payment</span>
                            <span style={{ fontWeight: '600' }}>{formatCurrency(option.feeBreakdown.downPayment)}</span>
                          </div>
                        )}
                        {option.lenderCredit > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#16a34a' }}>
                            <span>Lender Credit</span>
                            <span style={{ fontWeight: '600' }}>-{formatCurrency(option.lenderCredit)}</span>
                          </div>
                        )}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          padding: '12px', 
                          marginTop: '8px',
                          background: 'linear-gradient(135deg, #7B2CBF15, #9D4EDD15)', 
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '18px'
                        }}>
                          <span>Estimated Cash to Close</span>
                          <span style={{ color: '#7B2CBF' }}>{formatCurrency(option.feeBreakdown?.cashToClose || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
