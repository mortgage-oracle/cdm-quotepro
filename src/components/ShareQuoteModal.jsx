// ============================================================================
// SHARE QUOTE MODAL
// Modal for loan officers to share quotes with consumers
// ============================================================================

import React, { useState } from 'react';

const ShareQuoteModal = ({ 
  isOpen, 
  onClose, 
  quote,
  loanOfficer,
  shareUrl,
  onShare
}) => {
  const [activeTab, setActiveTab] = useState('link');
  const [copied, setCopied] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  
  const clientName = quote?.clientInfo?.name || 'Client';
  const clientFirstName = clientName.split(' ')[0];
  const loFirstName = loanOfficer?.full_name?.split(' ')[0] || 'Your Loan Officer';
  
  const textMessage = `Hi ${clientFirstName}! Here are the loan options we discussed. Click to view your personalized quote: ${shareUrl}

- ${loFirstName}, ${loanOfficer?.title || 'Loan Officer'}
NMLS# ${loanOfficer?.nmls_number || ''}`;

  const emailSubject = `Your Loan Options from ${loanOfficer?.full_name || 'CDM Mortgage'}`;
  
  const emailBody = `Hi ${clientFirstName},

Thank you for giving me the opportunity to help with your home financing needs!

I've put together some loan options for you to review. Click the link below to see your personalized quote:

${shareUrl}

This link will be active for ${expiryDays} days. Feel free to reach out if you have any questions - I'm here to help!

Best regards,
${loanOfficer?.full_name || 'Your Loan Officer'}
${loanOfficer?.title || 'Loan Officer'}
${loanOfficer?.phone || ''}
NMLS# ${loanOfficer?.nmls_number || ''}`;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const openEmailClient = () => {
    const mailtoLink = `mailto:${quote?.clientInfo?.email || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
  };
  
  const openSMS = () => {
    const phone = quote?.clientInfo?.phone?.replace(/\D/g, '') || '';
    const smsLink = `sms:${phone}?body=${encodeURIComponent(textMessage)}`;
    window.location.href = smsLink;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
              Share Quote
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Send to {clientName}
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Shareable Link */}
        <div style={{ padding: '20px 24px 0' }}>
          <label style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#666', 
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px',
            display: 'block'
          }}>
            Shareable Link
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              readOnly
              value={shareUrl}
              style={{
                flex: 1,
                padding: '12px 14px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '14px',
                background: '#f8f8f8',
                color: '#666'
              }}
            />
            <button
              onClick={() => copyToClipboard(shareUrl)}
              style={{
                padding: '12px 20px',
                background: copied ? '#10b981' : 'linear-gradient(135deg, #7B2CBF, #9D4EDD)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '20px 24px 0',
          borderBottom: '1px solid #eee',
          marginBottom: '16px'
        }}>
          {[
            { id: 'link', label: '🔗 Link Only' },
            { id: 'text', label: '💬 Text Message' },
            { id: 'email', label: '✉️ Email' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                border: 'none',
                background: 'none',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                color: activeTab === tab.id ? '#7B2CBF' : '#666',
                borderBottom: activeTab === tab.id ? '3px solid #7B2CBF' : '3px solid transparent',
                cursor: 'pointer',
                marginBottom: '-1px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div style={{ padding: '0 24px 24px' }}>
          {activeTab === 'link' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔗</div>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                Copy the link above and paste it anywhere
              </p>
              <button
                onClick={() => copyToClipboard(shareUrl)}
                style={{
                  padding: '14px 32px',
                  background: copied ? '#10b981' : 'linear-gradient(135deg, #7B2CBF, #9D4EDD)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {copied ? '✓ Link Copied!' : 'Copy Link'}
              </button>
            </div>
          )}
          
          {activeTab === 'text' && (
            <div>
              <textarea
                defaultValue={textMessage}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  minHeight: '140px',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  onClick={() => copyToClipboard(textMessage)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#f0f0f0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy Text
                </button>
                <button
                  onClick={openSMS}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  💬 Open Messages
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'email' && (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>
                  Subject:
                </label>
                <input
                  type="text"
                  defaultValue={emailSubject}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>
                  Message:
                </label>
                <textarea
                  defaultValue={emailBody}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    minHeight: '180px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  onClick={() => copyToClipboard(emailBody)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#f0f0f0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy Email
                </button>
                <button
                  onClick={openEmailClient}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✉️ Open Email App
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: '#f8f8f8',
          borderRadius: '0 0 20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '14px' }}>🔔</span>
          <span style={{ fontSize: '13px', color: '#666' }}>
            You'll be notified when {clientFirstName} views this quote
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShareQuoteModal;
