import React, { useState, useMemo, useEffect } from 'react';
import { saveQuote, getQuotesForLO, deleteQuote, getShareableQuoteUrl, getUnreadNotifications, getAllNotifications, subscribeToNotifications, markNotificationRead, markNotificationReviewed, updateLoanOfficerProfile, updateLoanOfficerByEmail } from '../supabaseClient';
import ShareQuoteModal from '../components/ShareQuoteModal';

// ============================================================================
// CDM QUOTE PRO - Main Application V20
// ============================================================================

// ============================================================================
// DEFAULT DATA TABLES - These are the original values that can be reset to
// ============================================================================

const defaultPropertyTaxRates = {
  'AL': 0.0041, 'AK': 0.0121, 'AZ': 0.0064, 'AR': 0.0062, 'CA': 0.0074,
  'CO': 0.0051, 'CT': 0.0213, 'DE': 0.0057, 'FL': 0.0086, 'GA': 0.0091,
  'HI': 0.0028, 'ID': 0.0066, 'IL': 0.0224, 'IN': 0.0083, 'IA': 0.0156,
  'KS': 0.0141, 'KY': 0.0085, 'LA': 0.0055, 'ME': 0.0132, 'MD': 0.0108,
  'MA': 0.0121, 'MI': 0.0150, 'MN': 0.0111, 'MS': 0.0080, 'MO': 0.0096,
  'MT': 0.0083, 'NE': 0.0168, 'NV': 0.0057, 'NH': 0.0213, 'NJ': 0.0247,
  'NM': 0.0080, 'NY': 0.0172, 'NC': 0.0082, 'ND': 0.0099, 'OH': 0.0153,
  'OK': 0.0089, 'OR': 0.0094, 'PA': 0.0156, 'RI': 0.0157, 'SC': 0.0057,
  'SD': 0.0129, 'TN': 0.0069, 'TX': 0.0175, 'UT': 0.0060, 'VT': 0.0190,
  'VA': 0.0081, 'WA': 0.0096, 'WV': 0.0058, 'WI': 0.0178, 'WY': 0.0061, 'DC': 0.0056
};

const stateNames = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'Washington DC'
};

// PMI rates by credit score (annual rate for LTV 80.01-85%)
const defaultPmiRates = {
  620: 0.0094, 640: 0.0091, 660: 0.0089, 680: 0.0046,
  700: 0.0036, 720: 0.0031, 740: 0.0026, 760: 0.0018, 780: 0.0016, 800: 0.0015
};

// Base title fees by state (simplified - covers title insurance + settlement fees)
const defaultBaseTitleFees = {
  'AL': 1100, 'AK': 1450, 'AZ': 1350, 'AR': 1500, 'CA': 1150, 'CO': 1150, 'CT': 1750,
  'DE': 1100, 'FL': 1200, 'GA': 1300, 'HI': 1400, 'ID': 1100, 'IL': 1350, 'IN': 1100,
  'IA': 1200, 'KS': 1200, 'KY': 1150, 'LA': 1100, 'ME': 1300, 'MD': 1400, 'MA': 1350,
  'MI': 1250, 'MN': 1200, 'MS': 1100, 'MO': 1150, 'MT': 1200, 'NE': 1150, 'NV': 1300,
  'NH': 1400, 'NJ': 1600, 'NM': 1150, 'NY': 1800, 'NC': 1200, 'ND': 1100, 'OH': 1250,
  'OK': 1150, 'OR': 1300, 'PA': 1400, 'RI': 1350, 'SC': 1100, 'SD': 1150, 'TN': 1150,
  'TX': 1500, 'UT': 1200, 'VT': 1300, 'VA': 1250, 'WA': 1350, 'WV': 1400, 'WI': 1000,
  'WY': 1100, 'DC': 1500
};

// Title insurance rate per $1000 of loan amount (varies by state)
const defaultTitleInsuranceRates = {
  'AL': 2.5, 'AK': 4.0, 'AZ': 3.0, 'AR': 1.8, 'CA': 1.3, 'CO': 2.5, 'CT': 2.0,
  'DE': 2.2, 'FL': 3.0, 'GA': 2.8, 'HI': 3.5, 'ID': 2.5, 'IL': 2.8, 'IN': 2.2,
  'IA': 2.0, 'KS': 2.0, 'KY': 2.5, 'LA': 2.8, 'ME': 2.5, 'MD': 2.2, 'MA': 2.0,
  'MI': 3.0, 'MN': 2.2, 'MS': 2.5, 'MO': 2.3, 'MT': 3.0, 'NE': 2.0, 'NV': 2.5,
  'NH': 2.0, 'NJ': 3.5, 'NM': 3.0, 'NY': 4.5, 'NC': 2.0, 'ND': 2.5, 'OH': 2.5,
  'OK': 2.8, 'OR': 3.0, 'PA': 2.5, 'RI': 2.2, 'SC': 2.0, 'SD': 2.5, 'TN': 2.5,
  'TX': 3.5, 'UT': 2.5, 'VT': 2.5, 'VA': 2.0, 'WA': 2.8, 'WV': 2.5, 'WI': 1.8,
  'WY': 2.5, 'DC': 3.0
};

// Transfer tax rates per $1000 of sale price (varies significantly by state)
const defaultTransferTaxRates = {
  'AL': 0.50, 'AK': 0.00, 'AZ': 0.00, 'AR': 3.30, 'CA': 1.10, 'CO': 0.01, 'CT': 7.50,
  'DE': 4.00, 'FL': 7.00, 'GA': 1.00, 'HI': 0.10, 'ID': 0.00, 'IL': 1.50, 'IN': 0.00,
  'IA': 1.60, 'KS': 0.00, 'KY': 0.50, 'LA': 0.00, 'ME': 4.40, 'MD': 5.00, 'MA': 4.56,
  'MI': 8.60, 'MN': 3.30, 'MS': 0.00, 'MO': 0.00, 'MT': 0.00, 'NE': 2.25, 'NV': 3.90,
  'NH': 7.50, 'NJ': 5.85, 'NM': 0.00, 'NY': 4.00, 'NC': 2.00, 'ND': 0.00, 'OH': 1.00,
  'OK': 0.75, 'OR': 1.00, 'PA': 10.00, 'RI': 4.60, 'SC': 1.85, 'SD': 0.00, 'TN': 3.70,
  'TX': 0.00, 'UT': 0.00, 'VT': 6.00, 'VA': 2.50, 'WA': 1.78, 'WV': 3.30, 'WI': 3.00,
  'WY': 0.00, 'DC': 11.00
};

// Recording fee defaults by state (flat fees)
const defaultRecordingFees = {
  'AL': 120, 'AK': 100, 'AZ': 115, 'AR': 85, 'CA': 115, 'CO': 130, 'CT': 150,
  'DE': 100, 'FL': 110, 'GA': 95, 'HI': 140, 'ID': 85, 'IL': 130, 'IN': 90,
  'IA': 95, 'KS': 90, 'KY': 100, 'LA': 110, 'ME': 110, 'MD': 125, 'MA': 135,
  'MI': 100, 'MN': 120, 'MS': 80, 'MO': 95, 'MT': 90, 'NE': 85, 'NV': 105,
  'NH': 110, 'NJ': 140, 'NM': 100, 'NY': 175, 'NC': 105, 'ND': 85, 'OH': 110,
  'OK': 90, 'OR': 125, 'PA': 130, 'RI': 115, 'SC': 95, 'SD': 80, 'TN': 95,
  'TX': 120, 'UT': 95, 'VT': 100, 'VA': 110, 'WA': 140, 'WV': 95, 'WI': 100,
  'WY': 85, 'DC': 150
};

// ============================================================================
// CALCULATION UTILITIES
// ============================================================================

const calculateMonthlyPayment = (principal, annualRate, termYears) => {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) return 0;
  const monthlyRate = annualRate / 12;
  const numPayments = termYears * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
};

const calculateAPR = (principal, monthlyPayment, termYears, totalFinanceCharges) => {
  if (monthlyPayment <= 0 || principal <= 0) return 0;
  const amountFinanced = principal - totalFinanceCharges;
  if (amountFinanced <= 0) return 0;
  
  let low = 0, high = 0.5, apr = 0;
  for (let i = 0; i < 100; i++) {
    apr = (low + high) / 2;
    const testPayment = calculateMonthlyPayment(amountFinanced, apr, termYears);
    if (Math.abs(testPayment - monthlyPayment) < 0.01) break;
    if (testPayment < monthlyPayment) low = apr;
    else high = apr;
  }
  return apr;
};

// Calculate ARM APR using composite rate method per Reg Z
// Uses initial rate for fixed period, then fully indexed rate for remaining term
const calculateArmAPR = (principal, initialRate, fullyIndexedRate, fixedYears, totalTermYears, totalFinanceCharges) => {
  if (principal <= 0) return 0;
  const amountFinanced = principal - totalFinanceCharges;
  if (amountFinanced <= 0) return 0;
  
  const fixedMonths = Math.round(fixedYears * 12);
  const totalMonths = totalTermYears * 12;
  const remainingMonths = totalMonths - fixedMonths;
  
  // Calculate the actual payment stream
  // First: payment during fixed period (based on initial rate, but amortized over full term)
  const initialMonthlyRate = initialRate / 12;
  const initialPayment = (principal * initialMonthlyRate * Math.pow(1 + initialMonthlyRate, totalMonths)) / 
                         (Math.pow(1 + initialMonthlyRate, totalMonths) - 1);
  
  // Calculate balance at end of fixed period
  let balance = principal;
  for (let i = 0; i < fixedMonths; i++) {
    const interestPortion = balance * initialMonthlyRate;
    const principalPortion = initialPayment - interestPortion;
    balance -= principalPortion;
  }
  
  // Payment during adjustable period (re-amortized at fully indexed rate over remaining term)
  const adjustedMonthlyRate = fullyIndexedRate / 12;
  const adjustedPayment = remainingMonths > 0 ? 
    (balance * adjustedMonthlyRate * Math.pow(1 + adjustedMonthlyRate, remainingMonths)) / 
    (Math.pow(1 + adjustedMonthlyRate, remainingMonths) - 1) : 0;
  
  // Now find the APR that makes PV of all payments = amountFinanced
  // Using binary search / Newton's method
  let low = 0, high = 0.5, apr = 0;
  
  for (let iter = 0; iter < 100; iter++) {
    apr = (low + high) / 2;
    const monthlyApr = apr / 12;
    
    // Calculate present value of payment stream
    let pv = 0;
    
    // PV of fixed period payments
    for (let i = 1; i <= fixedMonths; i++) {
      pv += initialPayment / Math.pow(1 + monthlyApr, i);
    }
    
    // PV of adjustable period payments (discounted back from their position)
    for (let i = 1; i <= remainingMonths; i++) {
      pv += adjustedPayment / Math.pow(1 + monthlyApr, fixedMonths + i);
    }
    
    if (Math.abs(pv - amountFinanced) < 1) break; // Close enough (within $1)
    
    if (pv > amountFinanced) low = apr;  // APR too low, payments worth too much
    else high = apr;                      // APR too high, payments worth too little
  }
  
  return apr;
};

// Get PMI rate based on credit score
const getPMIRate = (creditScore, rates = defaultPmiRates) => {
  if (creditScore >= 800) return rates[800];
  if (creditScore >= 780) return rates[780];
  if (creditScore >= 760) return rates[760];
  if (creditScore >= 740) return rates[740];
  if (creditScore >= 720) return rates[720];
  if (creditScore >= 700) return rates[700];
  if (creditScore >= 680) return rates[680];
  if (creditScore >= 660) return rates[660];
  if (creditScore >= 640) return rates[640];
  return rates[620];
};

// Format phone number as (xxx) xxx-xxxx
const formatPhoneNumber = (value) => {
  // Strip all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = numbers.slice(0, 10);
  
  // Format based on length
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
};

// Calculate monthly property tax
const calculateMonthlyTax = (propertyValue, state, rates = defaultPropertyTaxRates) => {
  const rate = rates[state] || 0.01;
  return (propertyValue * rate) / 12;
};

// Calculate monthly HOI (homeowners insurance)
const calculateMonthlyHOI = (propertyValue) => {
  // Base $600/year + $3.50 per $1000 of value
  const annualHOI = 600 + (propertyValue / 1000) * 3.50;
  return annualHOI / 12;
};

// Calculate title fees based on state and loan amount
const calculateTitleFees = (loanAmount, state, baseFeesTable = defaultBaseTitleFees, insuranceRatesTable = defaultTitleInsuranceRates) => {
  const baseFee = baseFeesTable[state] || 1200;
  const insuranceRate = insuranceRatesTable[state] || 2.5;
  const titleInsurance = (loanAmount / 1000) * insuranceRate;
  return Math.round(baseFee + titleInsurance);
};

// Calculate monthly PMI
const calculateMonthlyPMI = (loanAmount, creditScore, ltv, loanProgram, rates = defaultPmiRates) => {
  // FHA has MIP instead of PMI
  if (loanProgram === 'fha') {
    return (loanAmount * 0.0055) / 12; // 0.55% annual MIP
  }
  // VA has no PMI
  if (loanProgram === 'va') return 0;
  // Conventional - no PMI if LTV <= 80%
  if (ltv <= 0.80) return 0;
  const pmiRate = getPMIRate(creditScore, rates);
  return (loanAmount * pmiRate) / 12;
};

// Calculate upfront MIP/Funding Fee
// Calculate VA Funding Fee based on down payment and usage type
const calculateVAFundingFee = (loanAmount, downPaymentPercent, isFirstUse = true) => {
  // VA Funding Fee table (as of 2024)
  // First use rates:
  // - 0% down: 2.15%
  // - 5%+ down: 1.5%
  // - 10%+ down: 1.25%
  // Subsequent use rates:
  // - 0% down: 3.3%
  // - 5%+ down: 1.5%
  // - 10%+ down: 1.25%
  
  let rate;
  if (downPaymentPercent >= 10) {
    rate = 0.0125;
  } else if (downPaymentPercent >= 5) {
    rate = 0.015;
  } else {
    rate = isFirstUse ? 0.0215 : 0.033;
  }
  
  return loanAmount * rate;
};

// Calculate FHA Upfront MIP
const calculateFHAUpfrontMIP = (loanAmount) => {
  return loanAmount * 0.0175; // 1.75% UFMIP
};

// Legacy function - kept for backward compatibility
const calculateUpfrontMIP = (loanAmount, loanProgram, isVeteran, vaUsageType) => {
  if (loanProgram === 'fha') {
    return loanAmount * 0.0175; // 1.75% UFMIP
  }
  if (loanProgram === 'va' && isVeteran) {
    // Simplified VA funding fee - would vary by down payment and usage
    return loanAmount * 0.0215; // 2.15% first use, 0 down
  }
  return 0;
};

// Calculate points cost/credit from rate pricing (including LO compensation)
const calculatePointsCost = (loanAmount, ratePrice, loComp = 0) => {
  // ratePrice of 100 = par (no points)
  // ratePrice of 99 = 1 point cost (borrower pays 1%)
  // ratePrice of 101 = 1 point credit (lender credit 1%)
  // loComp is deducted from any credit, or added to borrower's cost
  // Net = (100 - ratePrice + loComp) as a percentage
  return (100 - ratePrice + loComp) * loanAmount / 100;
};

const generateAmortizationSchedule = (principal, annualRate, termYears) => {
  const schedule = [];
  const monthlyRate = annualRate / 12;
  const numPayments = termYears * 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  
  let balance = principal;
  let totalInterest = 0;
  let totalPrincipal = 0;
  
  for (let month = 1; month <= numPayments; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
    totalInterest += interestPayment;
    totalPrincipal += principalPayment;
    
    schedule.push({
      month, year: Math.ceil(month / 12), payment: monthlyPayment,
      principal: principalPayment, interest: interestPayment,
      totalInterest, totalPrincipal, balance: Math.max(0, balance)
    });
  }
  return schedule;
};

const getYearlySummary = (schedule) => {
  const years = {};
  schedule.forEach(row => {
    if (!years[row.year]) years[row.year] = { payments: 0, principal: 0, interest: 0, endBalance: 0 };
    years[row.year].payments += row.payment;
    years[row.year].principal += row.principal;
    years[row.year].interest += row.interest;
    years[row.year].endBalance = row.balance;
  });
  return Object.entries(years).map(([year, data]) => ({ year: parseInt(year), ...data }));
};

const formatCurrency = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
const formatCurrencyDecimal = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
const formatPercent = (num) => (num * 100).toFixed(3) + '%';

// Currency Input Component
const CurrencyInput = ({ value, onChange, style = {} }) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value.toString());
  
  React.useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString());
    }
  }, [value, isFocused]);
  
  const handleFocus = () => {
    setIsFocused(true);
    setInputValue(value.toString());
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(inputValue.replace(/[^0-9.-]/g, '')) || 0;
    onChange(parsed);
  };
  
  const handleChange = (e) => {
    setInputValue(e.target.value);
  };
  
  const displayValue = isFocused ? inputValue : formatCurrency(value);
  
  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{ fontFamily: "'JetBrains Mono', monospace", ...style }}
    />
  );
};

// Editable Fee Row Component for Fee Details Modal
const EditableFeeRow = ({ label, feeKey, defaultValue, autoValue, overrides, setOverrides, tableButton }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  
  // Determine the effective value: override > auto > default
  const isOverridden = overrides[feeKey] !== undefined;
  const effectiveValue = isOverridden ? overrides[feeKey] : (autoValue !== undefined ? autoValue : defaultValue);
  const isAuto = autoValue !== undefined && !isOverridden;
  
  const handleStartEdit = () => {
    setInputValue(effectiveValue.toString());
    setIsEditing(true);
  };
  
  const handleSave = () => {
    const parsed = parseFloat(inputValue.replace(/[^0-9.-]/g, '')) || 0;
    // Only save override if different from default/auto value
    const baseValue = autoValue !== undefined ? autoValue : defaultValue;
    if (Math.abs(parsed - baseValue) > 0.01) {
      setOverrides(prev => ({ ...prev, [feeKey]: parsed }));
    } else {
      // Remove override if same as base
      setOverrides(prev => {
        const newOverrides = { ...prev };
        delete newOverrides[feeKey];
        return newOverrides;
      });
    }
    setIsEditing(false);
  };
  
  const handleReset = (e) => {
    e.stopPropagation();
    setOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[feeKey];
      return newOverrides;
    });
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setIsEditing(false);
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '4px 0', 
      color: isOverridden ? '#7B2CBF' : '#555',
      background: isOverridden ? 'rgba(123, 44, 191, 0.05)' : 'transparent',
      borderRadius: '4px'
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {tableButton}
        {isAuto && <span style={{ fontSize: '10px', color: '#888', marginLeft: '4px' }}>🔄</span>}
        {isOverridden && (
          <button onClick={handleReset} style={{ 
            background: 'none', border: 'none', color: '#999', cursor: 'pointer', 
            fontSize: '10px', marginLeft: '4px', padding: '2px 4px'
          }} title="Reset to default">↺</button>
        )}
      </span>
      {isEditing ? (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            width: '100px',
            padding: '2px 6px',
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', monospace",
            textAlign: 'right',
            border: '1px solid #7B2CBF',
            borderRadius: '4px',
            outline: 'none'
          }}
        />
      ) : (
        <span 
          className="mono" 
          onClick={handleStartEdit}
          style={{ 
            cursor: 'pointer', 
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: isOverridden ? '600' : '400',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
          onMouseOut={(e) => e.target.style.background = 'transparent'}
          title="Click to edit"
        >
          {formatCurrency(effectiveValue)}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// DEFAULT RATE OPTIONS (can be overridden by user)
// ============================================================================

const defaultRateOptions = [
  { name: 'Buy Down', rate: 6.250, price: 99.00, description: 'Pay points for lowest rate' },
  { name: 'No Points', rate: 6.500, price: 100.00, description: 'Par pricing - no points, no credit' },
  { name: 'No Cost', rate: 7.000, price: 101.00, description: 'Lender credit covers costs' }
];

const termOptions = [
  { value: 30, label: '30 Year Fixed' },
  { value: 20, label: '20 Year Fixed' },
  { value: 15, label: '15 Year Fixed' },
  { value: 10, label: '10 Year Fixed' }
];

const armProducts = [
  { value: '6/6', label: '6/6 ARM', fixedYears: 0.5, adjustFrequency: 0.5, fullTerm: 30, fixedLabel: '6 mo' }, // 6 months fixed
  { value: '1/6', label: '1/6 ARM', fixedYears: 1, adjustFrequency: 0.5, fullTerm: 30, fixedLabel: '1 yr' },   // 1 year fixed
  { value: '5/6', label: '5/6 ARM', fixedYears: 5, adjustFrequency: 0.5, fullTerm: 30 }, // 6-month adjustments
  { value: '7/6', label: '7/6 ARM', fixedYears: 7, adjustFrequency: 0.5, fullTerm: 30 },
  { value: '5/1', label: '5/1 ARM', fixedYears: 5, adjustFrequency: 1, fullTerm: 30 },
  { value: '7/1', label: '7/1 ARM', fixedYears: 7, adjustFrequency: 1, fullTerm: 30 },
  { value: '10/1', label: '10/1 ARM', fixedYears: 10, adjustFrequency: 1, fullTerm: 30 }
];

const helocPresets = [
  { name: 'Prime + 0', rate: 0.085, fees: 1500, term: 30, drawPeriod: 10, description: 'Best HELOC rate' },
  { name: 'Prime + 1', rate: 0.095, fees: 999, term: 30, drawPeriod: 10, description: 'Low fee option' },
  { name: 'Prime + 2', rate: 0.105, fees: 0, term: 30, drawPeriod: 10, description: 'No closing cost' }
];

const heloanPresets = [
  { name: '20 Year Fixed', rate: 0.0825, fees: 2500, term: 20, description: 'Shorter term, lower rate' },
  { name: '30 Year Fixed', rate: 0.0875, fees: 2500, term: 30, description: 'Standard fixed rate' },
  { name: '15 Year Fixed', rate: 0.0775, fees: 2500, term: 15, description: 'Fastest payoff' }
];

// ============================================================================
// STYLES
// ============================================================================

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  input, select, textarea {
    font-family: inherit;
    font-size: 14px;
    padding: 10px 14px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fafafa;
    color: #1a1a1a;
    width: 100%;
    transition: all 0.2s ease;
  }
  
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #333;
    background: white;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
  }
  
  input::placeholder, textarea::placeholder { color: #999; }
  select option { background: white; color: #1a1a1a; }
  
  .card {
    background: white;
    border: none;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08);
  }
  
  .quote-card {
    background: white;
    border: none;
    border-radius: 16px;
    padding: 24px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 10px 40px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08);
  }
  
  .quote-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .quote-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #7B2CBF, #3C096C);
  }
  
  .btn-primary {
    background: #1a1a1a;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  
  .btn-primary:hover {
    background: #333;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .btn-secondary {
    background: white;
    color: #444;
    border: 1px solid #ddd;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-secondary:hover { background: #f5f5f5; border-color: #ccc; }
  .btn-secondary.active {
    background: #1a1a1a !important;
    color: white !important;
    border-color: #1a1a1a !important;
  }
  
  .label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #666;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .stat-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 28px;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
    margin: 16px 0;
  }
  
  .table-container {
    overflow-x: auto;
    border-radius: 14px;
    border: none;
    background: white;
    box-shadow: 0 8px 30px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06);
  }
  
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  
  th, td {
    padding: 12px 16px;
    text-align: right;
    border-bottom: 1px solid #f0f0f0;
  }
  
  th {
    background: #f8f8f8;
    font-weight: 600;
    color: #444;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.5px;
  }
  
  th:first-child, td:first-child { text-align: left; }
  tr:hover td { background: rgba(0, 0, 0, 0.02); }
  
  .mono { font-family: 'JetBrains Mono', monospace; }
  
  .income-section {
    background: white;
    border-radius: 14px;
    padding: 20px;
    margin-bottom: 16px;
    border: none;
    box-shadow: 0 8px 30px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06);
  }
  
  .rate-input-row {
    display: grid;
    grid-template-columns: 1fr 80px 80px;
    gap: 8px;
    align-items: end;
    padding: 12px;
    background: #f8f8f8;
    border-radius: 10px;
    margin-bottom: 8px;
  }
  
  .rate-input-row input {
    padding: 8px 10px;
    font-size: 13px;
  }
  
  .cost-breakdown {
    background: #f8f8f8;
    border-radius: 10px;
    padding: 16px;
    margin-top: 16px;
  }
  
  .cost-line {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 13px;
    border-bottom: 1px solid #eee;
  }
  
  .cost-line:last-child { border-bottom: none; font-weight: 600; }
  .cost-line .label { color: #666; }
  .cost-line .value { font-family: 'JetBrains Mono', monospace; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes bounceDown {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(3px); }
  }
  
  .animate-in { animation: fadeIn 0.4s ease forwards; }
  .bounce-arrow { animation: bounceDown 1.5s ease-in-out infinite; display: inline-block; }
  
  @media print {
    body { background: white !important; color: black !important; }
    .no-print { display: none !important; }
    .card, .quote-card { 
      background: white !important; 
      border: 1px solid #ddd !important;
      box-shadow: none !important;
      page-break-inside: avoid;
    }
  }
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LoanQuotePro({ user, loanOfficer, onSignOut }) {
  // Navigation
  const [activeTab, setActiveTab] = useState('quote');
  
  // Share Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareQuoteData, setShareQuoteData] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [notificationFilter, setNotificationFilter] = useState('all'); // 'all', 'unread', 'applied', 'reviewed'
  const [loadingAllNotifications, setLoadingAllNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Database quotes
  const [dbQuotes, setDbQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  
  // Client Info
  const [clientInfo, setClientInfo] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', state: 'CA', zip: ''
  });
  
  // Loan Configuration
  const [loanPurpose, setLoanPurpose] = useState('purchase');
  const [loanProgram, setLoanProgram] = useState('conventional');
  const [term, setTerm] = useState(30);
  const [creditScore, setCreditScore] = useState(740);
  const [isVeteran, setIsVeteran] = useState(false);
  const [vaFundingFeeExempt, setVaFundingFeeExempt] = useState(false); // Disabled veteran exemption
  const [vaFundingFeeFinanced, setVaFundingFeeFinanced] = useState(true); // Finance vs pay at closing
  const [fhaMIPFinanced, setFhaMIPFinanced] = useState(true); // Finance vs pay at closing
  const [baseLoanAmount, setBaseLoanAmount] = useState(400000);
  
  // ARM Configuration
  const [rateType, setRateType] = useState('fixed'); // 'fixed' or 'arm'
  const [armConfig, setArmConfig] = useState({
    product: '5/1',      // 5/1, 7/1, 10/1, 6mo, 1yr
    index: 'SOFR',       // Current index (display only)
    indexRate: 4.50,     // Current index rate
    margin: 2.75,        // Added to index after fixed period
    initialCap: 2.0,     // Max first adjustment
    periodicCap: 2.0,    // Max per adjustment after first
    lifetimeCap: 5.0,    // Max over life of loan
    floorRate: 2.0       // Rate can't go below this
  });
  
  // Property Details
  const [propertyDetails, setPropertyDetails] = useState({
    purchasePrice: 500000,
    downPaymentPercent: 20,
    homeValue: 500000,
    currentBalance: 300000,
    desiredCash: 50000,
    propertyType: 'single',
    propertyUse: 'primary'
  });
  
  // Rate Options (user can edit these)
  const [rateOptions, setRateOptions] = useState([
    { name: 'Buy Down', rate: 6.250, price: 99.00 },
    { name: 'No Points', rate: 6.500, price: 100.00 },
    { name: 'No Cost', rate: 7.000, price: 101.00 }
  ]);
  
  // Loan Officer Compensation (percentage of loan amount)
  const [loCompensation, setLoCompensation] = useState(0); // e.g., 2.0 = 2%
  const [loCompensationHE, setLoCompensationHE] = useState(0); // Home Equity LO comp
  
  // ============================================================================
  // FEE TEMPLATES (Admin-level defaults)
  // ============================================================================
  const [feeTemplates, setFeeTemplates] = useState({
    // Section A - Origination
    adminFee: 1895,
    underwritingFee: 995,
    
    // Section B - Services You Cannot Shop For
    appraisal: 675,
    floodCert: 8,
    creditReport: 50,
    processing: 995,
    taxService: 85,
    
    // Section C - Title & Settlement (defaults, can use state tables)
    notaryFee: 225,
    settlementFee: 1950,
    recordingServiceFee: 13,
    
    // Section E - Government Fees
    recordingFee: 115,
    
    // Section F - Prepaids (defaults)
    prepaidMonthsInsurance: 12,
    prepaidMonthsTax: 12,
    prepaidDaysInterest: 15,
    
    // Section G - Initial Escrow (defaults)
    escrowMonthsInsurance: 3,
    escrowMonthsTax: 6,
    escrowWaived: false,
    
    // Section H - Other
    ownersTitlePercent: 0.00225, // Roughly same as lender's title
    
    // ============================================
    // HOME EQUITY (HELOC/HELOAN) Fee Defaults
    // ============================================
    heUnderwritingFee: 995,
    heAppraisalFee: 550, // Default when not waived
    heAppraisalWaived: true,
    heTitleFee: 500,
    heRecordingFee: 115,
    heCreditReport: 50,
    heFloodCert: 8,
    heProcessingFee: 0
  });
  
  // Quote-level fee overrides (null = use template/auto value)
  const [feeOverrides, setFeeOverrides] = useState({});
  
  // Fee detail modal state
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [feeModalQuoteIndex, setFeeModalQuoteIndex] = useState(0);
  
  // Table viewer modal
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableModalType, setTableModalType] = useState(null); // 'propertyTax', 'titleInsurance', 'transferTax', 'pmi', 'recordingFees'
  const [editingTableCell, setEditingTableCell] = useState(null); // { state: 'CA', value: '0.0074' }
  
  // Editable State Lookup Tables (initialized from defaults)
  const [propertyTaxRates, setPropertyTaxRates] = useState({ ...defaultPropertyTaxRates });
  const [titleInsuranceRates, setTitleInsuranceRates] = useState({ ...defaultTitleInsuranceRates });
  const [transferTaxRates, setTransferTaxRates] = useState({ ...defaultTransferTaxRates });
  const [recordingFees, setRecordingFees] = useState({ ...defaultRecordingFees });
  const [pmiRates, setPmiRates] = useState({ ...defaultPmiRates });
  const [baseTitleFees, setBaseTitleFees] = useState({ ...defaultBaseTitleFees });
  
  // Deal-level Prepaid & Escrow Settings (initialized from Admin defaults, can override per-deal)
  const [prepaidSettings, setPrepaidSettings] = useState({
    prepaidMonthsInsurance: 12,
    prepaidMonthsTax: 12,
    prepaidDaysInterest: 15,
    escrowMonthsInsurance: 3,
    escrowMonthsTax: 6,
    escrowWaived: false,
    isModified: false // Track if user has modified from defaults
  });
  
  // Get effective prepaid settings
  const effectivePrepaidSettings = prepaidSettings.isModified ? prepaidSettings : {
    prepaidMonthsInsurance: feeTemplates.prepaidMonthsInsurance,
    prepaidMonthsTax: feeTemplates.prepaidMonthsTax,
    prepaidDaysInterest: feeTemplates.prepaidDaysInterest,
    escrowMonthsInsurance: feeTemplates.escrowMonthsInsurance,
    escrowMonthsTax: feeTemplates.escrowMonthsTax,
    escrowWaived: feeTemplates.escrowWaived
  };
  
  // Reset prepaid settings to use admin defaults
  const resetPrepaidToDefaults = () => {
    setPrepaidSettings({
      prepaidMonthsInsurance: feeTemplates.prepaidMonthsInsurance,
      prepaidMonthsTax: feeTemplates.prepaidMonthsTax,
      prepaidDaysInterest: feeTemplates.prepaidDaysInterest,
      escrowMonthsInsurance: feeTemplates.escrowMonthsInsurance,
      escrowMonthsTax: feeTemplates.escrowMonthsTax,
      escrowWaived: feeTemplates.escrowWaived,
      isModified: false
    });
  };
  
  // Update a prepaid setting (creates deal-level override)
  const updatePrepaidSetting = (key, value) => {
    setPrepaidSettings(prev => ({
      ...prev,
      [key]: value,
      isModified: true
    }));
  };
  
  // Amortization
  const [selectedQuoteForAmort, setSelectedQuoteForAmort] = useState(0);
  const [amortViewMode, setAmortViewMode] = useState('yearly');
  const [heAmortViewMode, setHeAmortViewMode] = useState('yearly'); // Home Equity amortization view mode
  
  // Section view modes (quotes vs amortization)
  const [purchaseRefiView, setPurchaseRefiView] = useState('quotes'); // 'quotes' or 'amortization'
  const [homeEquityView, setHomeEquityView] = useState('quotes'); // 'quotes' or 'amortization' or 'editRates'
  const [selectedHomeEquityForAmort, setSelectedHomeEquityForAmort] = useState(0);
  
  // Recommended/Best Deal selection
  const [recommendedQuote, setRecommendedQuote] = useState(null); // index of recommended quote (0, 1, 2, or null)
  const [recommendedSecondMortgage, setRecommendedSecondMortgage] = useState(null); // index for 2nd mortgage
  
  // Saved Quotes
  const [savedQuotes, setSavedQuotes] = useState([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [quoteLabel, setQuoteLabel] = useState('');
  const [saveStatus, setSaveStatus] = useState(null); // null, 'saving', 'saved'
  const [savedQuotesSearch, setSavedQuotesSearch] = useState('');
  
  // Second Mortgage (HELOC/HELOAN) - HELOAN is more common, default first
  const [secondMortgageType, setSecondMortgageType] = useState('heloan');
  const [secondMortgageDetails, setSecondMortgageDetails] = useState({
    lineAmount: 50000,
    drawAmount: 50000,
    propertyValue: 500000,
    firstMortgageBalance: 300000,
    creditScore: 740,
    propertyType: 'single',
    propertyUse: 'primary'
  });
  
  // Home Equity Fee Overrides (null = use template value)
  const [heOverrides, setHeOverrides] = useState({});
  
  // Home Equity Fee Modal
  const [heFeeModalOpen, setHeFeeModalOpen] = useState(false);
  const [heFeeModalQuoteIndex, setHeFeeModalQuoteIndex] = useState(0);
  
  // Editable HELOAN rate options (shown first as more common) - matches Purchase/Refi structure
  const [heloanRateOptions, setHeloanRateOptions] = useState([
    { name: 'Buy Down', rate: 7.250, price: 99.00, term: 30 },
    { name: 'No Points', rate: 7.500, price: 100.00, term: 30 },
    { name: 'No Cost', rate: 8.000, price: 101.50, term: 30 }
  ]);
  
  // Editable HELOC rate options (variable rate - different structure)
  const [helocRateOptions, setHelocRateOptions] = useState([
    { name: 'Low Rate', rate: 8.50, margin: 0, drawPeriod: 10, repayPeriod: 20 },
    { name: 'Standard', rate: 9.00, margin: 0.5, drawPeriod: 10, repayPeriod: 20 },
    { name: 'No Cost', rate: 9.50, margin: 1, drawPeriod: 10, repayPeriod: 20 }
  ]);
  
  // Income Calculator
  const [incomeInputs, setIncomeInputs] = useState({
    w2: { base: '', overtime: '', bonus: '', commission: '' },
    scheduleC: { grossReceipts: '', expenses: '', depreciation: '', miles: '' },
    sCorp: { w2Wages: '', distributions: '', ordinaryIncome: '' },
    rental: { grossRents: '', expenses: '', depreciation: '', mortgageInterest: '' }
  });

  // ============================================================================
  // DATABASE INTEGRATION EFFECTS
  // ============================================================================
  
  // Load quotes from database on mount
  useEffect(() => {
    if (loanOfficer?.id) {
      loadQuotesFromDB();
      loadNotifications();
      
      // Subscribe to real-time notifications
      const unsubscribe = subscribeToNotifications(loanOfficer.id, (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
      });
      
      return () => unsubscribe();
    }
  }, [loanOfficer?.id]);
  
  const loadQuotesFromDB = async () => {
    if (!loanOfficer?.id) {
      console.log('No loanOfficer.id, skipping quote load');
      return;
    }
    console.log('Loading quotes for LO:', loanOfficer.id);
    setLoadingQuotes(true);
    try {
      const quotes = await getQuotesForLO(loanOfficer.id);
      console.log('Loaded quotes:', quotes?.length || 0, quotes);
      setDbQuotes(quotes || []);
    } catch (err) {
      console.error('Error loading quotes:', err);
    } finally {
      setLoadingQuotes(false);
    }
  };
  
  const handleDeleteQuote = async (quoteId) => {
    if (!confirm('Are you sure you want to delete this quote? This cannot be undone.')) {
      return;
    }
    try {
      await deleteQuote(quoteId);
      // Remove from local state immediately for instant feedback
      setDbQuotes(prev => prev.filter(q => q.id !== quoteId));
    } catch (err) {
      console.error('Error deleting quote:', err);
      alert('Failed to delete quote. Please try again.');
    }
  };
  
  const loadNotifications = async () => {
    if (!loanOfficer?.id) return;
    try {
      const notifs = await getUnreadNotifications(loanOfficer.id);
      setNotifications(notifs || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };
  
  const loadAllNotifications = async () => {
    if (!loanOfficer?.id) return;
    setLoadingAllNotifications(true);
    try {
      const notifs = await getAllNotifications(loanOfficer.id);
      setAllNotifications(notifs || []);
    } catch (err) {
      console.error('Error loading all notifications:', err);
    } finally {
      setLoadingAllNotifications(false);
    }
  };
  
  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Also update in allNotifications
      setAllNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };
  
  const handleMarkNotificationReviewed = async (notificationId, reviewed = true) => {
    try {
      await markNotificationReviewed(notificationId, reviewed);
      setAllNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, reviewed, reviewed_at: reviewed ? new Date().toISOString() : null } : n
      ));
    } catch (err) {
      console.error('Error marking notification reviewed:', err);
    }
  };
  
  // Load all notifications when switching to notifications tab
  useEffect(() => {
    if (activeTab === 'notifications' && loanOfficer?.id) {
      loadAllNotifications();
    }
  }, [activeTab, loanOfficer?.id]);
  
  // Share quote handler
  const handleShareQuote = async (quoteData) => {
    // Validate client name is entered
    if (!clientInfo.name || clientInfo.name.trim() === '') {
      alert('Please enter a client name before sharing the quote.');
      return;
    }
    
    try {
      // Save to database first
      const savedQuote = await saveQuote(loanOfficer.id, {
        ...quoteData,
        clientInfo,
        quoteType: quoteData.quoteType || 'mortgage'
      });
      
      // Generate shareable URL
      const url = getShareableQuoteUrl(savedQuote.share_id);
      setShareUrl(url);
      setShareQuoteData(savedQuote);
      setShowShareModal(true);
      
      // Refresh quotes list
      loadQuotesFromDB();
    } catch (err) {
      console.error('Error sharing quote:', err);
      alert('Failed to share quote. Please try again.');
    }
  };

  // Handlers
  const handleClientChange = (field, value) => setClientInfo(prev => ({ ...prev, [field]: value }));
  
  // Profile editing state
  const [profileEdits, setProfileEdits] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  
  // CSV Upload state (Admin tools)
  const [csvUploadData, setCsvUploadData] = useState([]);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvUploadResults, setCsvUploadResults] = useState(null);
  
  // Handle CSV file upload
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row if present
      const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;
      
      const data = [];
      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2 && parts[0] && parts[1]) {
          data.push({
            email: parts[0],
            application_url: parts[1]
          });
        }
      }
      
      setCsvUploadData(data);
      setCsvUploadResults(null);
    };
    reader.readAsText(file);
    
    // Reset input so same file can be uploaded again
    e.target.value = '';
  };
  
  // Apply CSV updates to database
  const applyCsvUpdates = async () => {
    if (csvUploadData.length === 0) return;
    
    setCsvUploading(true);
    setCsvUploadResults(null);
    
    let success = 0;
    let errors = 0;
    let notFound = 0;
    
    for (const row of csvUploadData) {
      try {
        const result = await updateLoanOfficerByEmail(row.email, { application_url: row.application_url });
        if (result) {
          success++;
        } else {
          notFound++;
        }
      } catch (err) {
        console.error('Error updating', row.email, err);
        errors++;
      }
    }
    
    setCsvUploading(false);
    setCsvUploadResults({ success, errors, notFound });
    
    if (success > 0) {
      setCsvUploadData([]);
    }
  };
  
  // Download sample CSV
  const downloadSampleCsv = () => {
    const sample = 'email,application_url\njohn@example.com,https://apply.yoursite.com/john\nsarah@example.com,https://apply.yoursite.com/sarah';
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lo_application_urls_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Get current profile value (edited or original)
  const getProfileValue = (field) => {
    if (profileEdits[field] !== undefined) return profileEdits[field];
    return loanOfficer?.[field] || '';
  };
  
  // Handle profile field changes
  const handleProfileUpdate = (field, value) => {
    setProfileEdits(prev => ({ ...prev, [field]: value }));
  };
  
  // Save profile to database
  const saveProfile = async () => {
    if (!loanOfficer?.id || Object.keys(profileEdits).length === 0) return;
    
    setSavingProfile(true);
    try {
      await updateLoanOfficerProfile(loanOfficer.id, profileEdits);
      // Update local state by merging edits
      Object.assign(loanOfficer, profileEdits);
      setProfileEdits({});
      alert('Profile saved successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };
  const handlePropertyChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    setPropertyDetails(prev => ({ ...prev, [field]: numValue }));
  };
  
  const handleRateOptionChange = (index, field, value) => {
    setRateOptions(prev => {
      const updated = [...prev];
      // Only parse as number for rate and price fields, keep name as string
      const newValue = field === 'name' ? value : (parseFloat(value) || 0);
      updated[index] = { ...updated[index], [field]: newValue };
      return updated;
    });
  };
  
  const addRateOption = () => {
    if (rateOptions.length < 3) {
      const lastRate = rateOptions[rateOptions.length - 1];
      setRateOptions(prev => [...prev, {
        name: prev.length === 1 ? 'No Points' : 'No Cost',
        rate: lastRate.rate + 0.25,
        price: lastRate.price + 0.5
      }]);
    }
  };
  
  const removeRateOption = (index) => {
    if (rateOptions.length > 1) {
      setRateOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Property value for calculations
  const propertyValue = loanPurpose === 'purchase' ? propertyDetails.purchasePrice : propertyDetails.homeValue;
  
  // LTV
  const baseLTV = baseLoanAmount / propertyValue;

  // Monthly escrow components (using state-based rates)
  const monthlyTax = calculateMonthlyTax(propertyValue, clientInfo.state, propertyTaxRates);
  const monthlyHOI = calculateMonthlyHOI(propertyValue);
  const monthlyEscrow = monthlyTax + monthlyHOI;

  // Title fees (using state-based rates)
  const titleFees = calculateTitleFees(baseLoanAmount, clientInfo.state, baseTitleFees, titleInsuranceRates);

  // Calculate all quote options
  const calculations = useMemo(() => {
    return rateOptions.map((option, index) => {
      const rate = option.rate / 100;
      const ratePrice = option.price;
      
      // Calculate upfront government fees (FHA UFMIP or VA Funding Fee)
      let upfrontFee = 0;
      let upfrontFeeFinanced = true;
      let upfrontFeeLabel = '';
      
      if (loanProgram === 'fha') {
        upfrontFee = calculateFHAUpfrontMIP(baseLoanAmount);
        upfrontFeeFinanced = fhaMIPFinanced;
        upfrontFeeLabel = 'FHA Upfront MIP';
      } else if (loanProgram === 'va' && !vaFundingFeeExempt) {
        const dpPercent = loanPurpose === 'purchase' ? (propertyDetails.downPaymentPercent || 0) : 0;
        upfrontFee = calculateVAFundingFee(baseLoanAmount, dpPercent);
        upfrontFeeFinanced = vaFundingFeeFinanced;
        upfrontFeeLabel = 'VA Funding Fee';
      }
      
      // Amount added to loan (if financed)
      const financedUpfrontFee = upfrontFeeFinanced ? upfrontFee : 0;
      // Amount added to closing costs (if not financed)
      const closingUpfrontFee = upfrontFeeFinanced ? 0 : upfrontFee;
      
      // Total loan amount (base + financed upfront fee if applicable)
      const totalLoanAmount = baseLoanAmount + financedUpfrontFee;
      
      // LTV based on total loan
      const ltv = totalLoanAmount / propertyValue;
      
      // Monthly P&I
      const monthlyPI = calculateMonthlyPayment(totalLoanAmount, rate, term);
      
      // Monthly PMI/MIP (using state-based rates)
      const monthlyMI = calculateMonthlyPMI(baseLoanAmount, creditScore, baseLTV, loanProgram, pmiRates);
      
      // Points cost (positive = borrower pays, negative = lender credit)
      // Includes LO compensation - deducted from lender credit or added to borrower cost
      const pointsCost = calculatePointsCost(baseLoanAmount, ratePrice, loCompensation);
      
      // Fixed third-party fees (Section B) - add upfront fee here if not financed
      const thirdPartyFees = feeTemplates.appraisal + feeTemplates.creditReport + 
                            feeTemplates.processing + feeTemplates.floodCert + feeTemplates.taxService +
                            closingUpfrontFee;
      
      // Origination fees (Section A - excluding points)
      const originationFees = feeTemplates.adminFee + feeTemplates.underwritingFee;
      
      // Prepaid interest (part of Section F)
      const dailyInterest = (totalLoanAmount * rate) / 365;
      const prepaidInterest = dailyInterest * effectivePrepaidSettings.prepaidDaysInterest;
      
      // Prepaid HOI and Taxes (rest of Section F)
      const prepaidHOI = monthlyHOI * effectivePrepaidSettings.prepaidMonthsInsurance;
      const prepaidTax = monthlyTax * effectivePrepaidSettings.prepaidMonthsTax;
      const totalPrepaids = prepaidHOI + prepaidInterest + prepaidTax;
      
      // Escrow reserves - Section G (0 if waived)
      const escrowHOI = effectivePrepaidSettings.escrowWaived ? 0 : monthlyHOI * effectivePrepaidSettings.escrowMonthsInsurance;
      const escrowTax = effectivePrepaidSettings.escrowWaived ? 0 : monthlyTax * effectivePrepaidSettings.escrowMonthsTax;
      const escrowReserves = escrowHOI + escrowTax;
      
      // Section E - Government Fees (Recording + Transfer Tax)
      const recordingFee = recordingFees[clientInfo.state] || 115;
      const transferTax = (transferTaxRates[clientInfo.state] || 0) * (propertyValue / 1000);
      const governmentFees = recordingFee + transferTax;
      
      // D. Total Loan Costs (A + B + C)
      const sectionA = (pointsCost > 0 ? pointsCost : 0) + originationFees;
      const sectionB = thirdPartyFees;
      const sectionC = titleFees;
      const totalLoanCosts = sectionA + sectionB + sectionC;
      
      // I. Total Other Costs (E + F + G)
      const totalOtherCosts = governmentFees + totalPrepaids + escrowReserves;
      
      // J. Total Closing Costs (D + I)
      const totalClosingCosts = totalLoanCosts + totalOtherCosts;
      
      // Lender credit (if points are negative)
      const lenderCredit = Math.max(0, -pointsCost);
      
      // Total due at closing (J - lender credit)
      const totalSettlement = totalClosingCosts - lenderCredit;
      
      // Cash to close (for purchase) or cash out (for refi)
      let cashFlow;
      if (loanPurpose === 'purchase') {
        const downPayment = propertyDetails.purchasePrice * (propertyDetails.downPaymentPercent / 100);
        cashFlow = downPayment + totalSettlement; // Cash needed
      } else {
        cashFlow = baseLoanAmount - propertyDetails.currentBalance - totalSettlement; // Cash out
      }
      
      // Total monthly payment
      const totalMonthlyPayment = monthlyPI + monthlyEscrow + monthlyMI;
      
      // Total of all payments
      const totalPayment = monthlyPI * term * 12;
      
      // APR calculation - different for ARM vs Fixed
      const financeCharges = pointsCost > 0 ? pointsCost + prepaidInterest : prepaidInterest;
      let apr;
      
      if (rateType === 'arm') {
        // ARM APR: Uses composite rate method per Reg Z
        const armProduct = armProducts.find(p => p.value === armConfig.product);
        const fixedYears = armProduct?.fixedYears || 5;
        const fullTerm = armProduct?.fullTerm || 30;
        const fullyIndexedRate = (armConfig.indexRate + armConfig.margin) / 100;
        
        apr = calculateArmAPR(
          totalLoanAmount,
          rate,                    // Initial rate
          fullyIndexedRate,        // Fully indexed rate (index + margin)
          fixedYears,              // Fixed period in years
          fullTerm,                // Total term in years
          financeCharges
        );
      } else {
        // Fixed rate APR
        apr = calculateAPR(totalLoanAmount, monthlyPI, term, financeCharges);
      }
      
      return {
        name: option.name,
        rate,
        ratePrice,
        apr,
        baseLoanAmount,
        totalLoanAmount,
        ltv,
        monthlyPI,
        monthlyTax,
        monthlyHOI,
        monthlyEscrow,
        monthlyMI,
        totalMonthlyPayment,
        pointsCost,
        lenderCredit,
        titleFees,
        thirdPartyFees,
        // Upfront government fee details
        upfrontFee,
        upfrontFeeFinanced,
        upfrontFeeLabel,
        financedUpfrontFee,
        closingUpfrontFee,
        // Section E - Government Fees
        recordingFee,
        transferTax,
        governmentFees,
        // Section F - Prepaids
        prepaidHOI,
        prepaidInterest,
        prepaidTax,
        totalPrepaids,
        // Section G - Escrow
        escrowHOI,
        escrowTax,
        escrowReserves,
        // Totals
        totalLoanCosts,    // D = A + B + C
        totalOtherCosts,   // I = E + F + G
        totalClosingCosts, // J = D + I
        totalSettlement,   // J - lender credit
        cashFlow,
        totalPayment,
        loCompPercent: loCompensation,
        description: pointsCost > 0 ? `${(pointsCost/baseLoanAmount*100).toFixed(2)} points` : 
                     pointsCost < 0 ? `${formatCurrency(-pointsCost)} credit` : 'Par pricing',
        // ARM Details (populated if rateType === 'arm')
        rateType,
        armDetails: rateType === 'arm' ? (() => {
          const product = armProducts.find(p => p.value === armConfig.product);
          const fixedYears = product?.fixedYears || 5;
          const fullyIndexedRate = armConfig.indexRate + armConfig.margin;
          return {
            product: armConfig.product,
            fixedPeriod: fixedYears,
            fixedLabel: product?.fixedLabel || (fixedYears >= 1 ? `${fixedYears} yrs` : `${fixedYears * 12} mo`),
            index: armConfig.index,
            indexRate: armConfig.indexRate,
            margin: armConfig.margin,
            fullyIndexedRate: fullyIndexedRate,
            initialCap: armConfig.initialCap,
            periodicCap: armConfig.periodicCap,
            lifetimeCap: armConfig.lifetimeCap,
            maxFirstAdjustment: option.rate + armConfig.initialCap,
            maxLifetimeRate: option.rate + armConfig.lifetimeCap,
            adjustFrequency: product?.adjustFrequency || 1
          };
        })() : null,
        term: rateType === 'arm' ? (armProducts.find(p => p.value === armConfig.product)?.fullTerm || 30) : term
      };
    });
  }, [rateOptions, baseLoanAmount, propertyValue, term, loanProgram, creditScore, 
      clientInfo.state, feeTemplates, effectivePrepaidSettings, baseLTV, 
      loanPurpose, propertyDetails, monthlyEscrow, titleFees, loCompensation, monthlyTax, monthlyHOI,
      propertyTaxRates, titleInsuranceRates, baseTitleFees, pmiRates, recordingFees, transferTaxRates,
      rateType, armConfig, vaFundingFeeExempt, vaFundingFeeFinanced, fhaMIPFinanced]);

  // Amortization schedule
  const amortSchedule = useMemo(() => {
    if (calculations.length === 0) return [];
    const calc = calculations[selectedQuoteForAmort];
    // Use calc.term which has the effective term (30 for ARM, user-selected for fixed)
    return generateAmortizationSchedule(calc.totalLoanAmount, calc.rate, calc.term || term);
  }, [calculations, selectedQuoteForAmort, term]);

  const yearlySummary = useMemo(() => getYearlySummary(amortSchedule), [amortSchedule]);

  // Second Mortgage - CLTV calculation
  const secondMortgageCLTV = useMemo(() => {
    const totalDebt = secondMortgageDetails.firstMortgageBalance + secondMortgageDetails.lineAmount;
    return totalDebt / secondMortgageDetails.propertyValue;
  }, [secondMortgageDetails]);

  // Calculate Home Equity total fees (from templates + overrides)
  const getHEFees = (drawAmount) => {
    const underwriting = heOverrides.heUnderwritingFee !== undefined ? heOverrides.heUnderwritingFee : feeTemplates.heUnderwritingFee;
    const appraisalWaived = heOverrides.heAppraisalWaived !== undefined ? heOverrides.heAppraisalWaived : feeTemplates.heAppraisalWaived;
    const appraisal = appraisalWaived ? 0 : (heOverrides.heAppraisalFee !== undefined ? heOverrides.heAppraisalFee : feeTemplates.heAppraisalFee);
    const title = heOverrides.heTitleFee !== undefined ? heOverrides.heTitleFee : feeTemplates.heTitleFee;
    const recording = heOverrides.heRecordingFee !== undefined ? heOverrides.heRecordingFee : (recordingFees[clientInfo.state] || feeTemplates.heRecordingFee);
    const credit = heOverrides.heCreditReport !== undefined ? heOverrides.heCreditReport : feeTemplates.heCreditReport;
    const flood = heOverrides.heFloodCert !== undefined ? heOverrides.heFloodCert : feeTemplates.heFloodCert;
    const processing = heOverrides.heProcessingFee !== undefined ? heOverrides.heProcessingFee : feeTemplates.heProcessingFee;
    
    // LO Compensation based on draw amount
    const loComp = (drawAmount || secondMortgageDetails.drawAmount) * (loCompensationHE / 100);
    
    return {
      underwriting,
      loComp,
      appraisal,
      appraisalWaived,
      title,
      recording,
      credit,
      flood,
      processing,
      total: underwriting + loComp + appraisal + title + recording + credit + flood + processing
    };
  };

  // Second Mortgage calculations
  const secondMortgageCalcs = useMemo(() => {
    const options = secondMortgageType === 'heloc' ? helocRateOptions : heloanRateOptions;
    const drawAmount = secondMortgageDetails.drawAmount;
    const lineAmount = secondMortgageDetails.lineAmount;
    const heFees = getHEFees(drawAmount);
    
    return options.map((option, index) => {
      const rate = option.rate / 100;
      
      if (secondMortgageType === 'heloc') {
        // HELOC - variable rate, no points/price structure
        const totalClosingCosts = heFees.total;
        const netProceeds = drawAmount - totalClosingCosts;
        
        const interestOnlyPayment = drawAmount * (rate / 12);
        const totalTerm = option.drawPeriod + option.repayPeriod;
        const fullyAmortized = calculateMonthlyPayment(drawAmount, rate, option.repayPeriod);
        
        // Total interest during draw period (interest only)
        const drawPeriodInterest = interestOnlyPayment * option.drawPeriod * 12;
        // Total payments during repayment period
        const repayPeriodPayments = fullyAmortized * option.repayPeriod * 12;
        // Total of all payments
        const totalPayments = (interestOnlyPayment * option.drawPeriod * 12) + repayPeriodPayments;
        // Total interest paid
        const totalInterest = totalPayments - drawAmount;
        
        return {
          ...option,
          index,
          lineAmount,
          drawAmount,
          fees: totalClosingCosts,
          feeBreakdown: heFees,
          netProceeds,
          pointsCost: 0,
          lenderCredit: 0,
          interestOnlyPayment,
          fullyAmortizedPayment: fullyAmortized,
          totalTerm,
          totalPayments,
          totalInterest,
          apr: rate + 0.00125,
          cltv: secondMortgageCLTV
        };
      } else {
        // HELOAN - fixed rate with price/points structure (like Purchase/Refi)
        const ratePrice = option.price || 100;
        
        // Calculate points cost/credit using same logic as Purchase/Refi
        const pointsCost = calculatePointsCost(drawAmount, ratePrice, loCompensationHE);
        const lenderCredit = Math.max(0, -pointsCost);
        const borrowerPoints = Math.max(0, pointsCost);
        
        // Total closing costs: base fees + points - lender credit (can't go below 0)
        const totalClosingCosts = Math.max(0, heFees.total + borrowerPoints - lenderCredit);
        
        // Net proceeds = draw amount - total closing costs
        const netProceeds = drawAmount - totalClosingCosts;
        
        const monthlyPayment = calculateMonthlyPayment(drawAmount, rate, option.term);
        const totalPayments = monthlyPayment * option.term * 12;
        const totalInterest = totalPayments - drawAmount;
        const apr = calculateAPR(drawAmount, monthlyPayment, option.term, totalClosingCosts);
        
        return { 
          ...option, 
          index,
          lineAmount,
          drawAmount,
          fees: totalClosingCosts,
          baseFees: heFees.total,
          feeBreakdown: heFees,
          pointsCost,
          lenderCredit,
          netProceeds,
          monthlyPayment,
          totalPayments,
          totalInterest,
          apr,
          cltv: secondMortgageCLTV,
          loCompPercent: loCompensationHE,
          description: pointsCost > 0 ? `${(pointsCost/drawAmount*100).toFixed(2)} points` : 
                       pointsCost < 0 ? `${formatCurrency(-pointsCost)} credit` : 'Par pricing'
        };
      }
    });
  }, [secondMortgageType, secondMortgageDetails, helocRateOptions, heloanRateOptions, secondMortgageCLTV, feeTemplates, heOverrides, clientInfo.state, recordingFees, loCompensationHE]);

  // Home Equity amortization schedule (for HELOAN)
  const heAmortSchedule = useMemo(() => {
    if (secondMortgageCalcs.length === 0 || secondMortgageType !== 'heloan') return [];
    const calc = secondMortgageCalcs[selectedHomeEquityForAmort];
    if (!calc) return [];
    return generateAmortizationSchedule(calc.drawAmount, calc.rate / 100, calc.term);
  }, [secondMortgageCalcs, selectedHomeEquityForAmort, secondMortgageType]);

  const heYearlySummary = useMemo(() => getYearlySummary(heAmortSchedule), [heAmortSchedule]);

  // Handlers for second mortgage rate options
  const handleHelocRateChange = (index, field, value) => {
    setHelocRateOptions(prev => {
      const updated = [...prev];
      const newValue = field === 'name' ? value : (parseFloat(value) || 0);
      updated[index] = { ...updated[index], [field]: newValue };
      return updated;
    });
  };
  
  const handleHeloanRateChange = (index, field, value) => {
    setHeloanRateOptions(prev => {
      const updated = [...prev];
      const newValue = field === 'name' ? value : (parseFloat(value) || 0);
      updated[index] = { ...updated[index], [field]: newValue };
      return updated;
    });
  };
  
  const addHeloanOption = () => {
    if (heloanRateOptions.length < 3) {
      const lastOption = heloanRateOptions[heloanRateOptions.length - 1];
      setHeloanRateOptions(prev => [...prev, {
        name: prev.length === 1 ? 'No Points' : 'No Cost',
        rate: lastOption.rate + 0.25,
        price: lastOption.price + 0.5,
        term: lastOption.term
      }]);
    }
  };
  
  const removeHeloanOption = (index) => {
    if (heloanRateOptions.length > 1) {
      setHeloanRateOptions(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const addHelocOption = () => {
    if (helocRateOptions.length < 3) {
      const lastOption = helocRateOptions[helocRateOptions.length - 1];
      setHelocRateOptions(prev => [...prev, {
        name: prev.length === 1 ? 'Standard' : 'No Cost',
        rate: lastOption.rate + 0.5,
        margin: lastOption.margin + 0.5,
        drawPeriod: lastOption.drawPeriod,
        repayPeriod: lastOption.repayPeriod
      }]);
    }
  };
  
  const removeHelocOption = (index) => {
    if (helocRateOptions.length > 1) {
      setHelocRateOptions(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const handleSecondMortgageDetailChange = (field, value) => {
    setSecondMortgageDetails(prev => ({ ...prev, [field]: value }));
  };

  // Income calculations
  const incomeCalculations = useMemo(() => {
    const w2 = incomeInputs.w2;
    const w2Total = (parseFloat(w2.base) || 0) + (parseFloat(w2.overtime) || 0) * 0.5 + 
                   (parseFloat(w2.bonus) || 0) / 24 + (parseFloat(w2.commission) || 0) / 24;
    
    const sc = incomeInputs.scheduleC;
    const scNet = (parseFloat(sc.grossReceipts) || 0) - (parseFloat(sc.expenses) || 0);
    const scAdjusted = scNet + (parseFloat(sc.depreciation) || 0) + (parseFloat(sc.miles) || 0) * 0.655;
    
    const sCorp = incomeInputs.sCorp;
    const sCorpTotal = (parseFloat(sCorp.w2Wages) || 0) + (parseFloat(sCorp.ordinaryIncome) || 0);
    
    const rental = incomeInputs.rental;
    const rentalNet = (parseFloat(rental.grossRents) || 0) - (parseFloat(rental.expenses) || 0);
    const rentalAdjusted = rentalNet + (parseFloat(rental.depreciation) || 0) - (parseFloat(rental.mortgageInterest) || 0) * 0.25;
    
    return {
      w2: { total: w2Total / 12, annual: w2Total },
      scheduleC: { net: scNet, adjusted: scAdjusted, monthly: scAdjusted / 12 },
      sCorp: { total: sCorpTotal, monthly: sCorpTotal / 12 },
      rental: { net: rentalNet, adjusted: rentalAdjusted, monthly: rentalAdjusted / 12 },
      grandTotal: w2Total / 12 + scAdjusted / 12 + sCorpTotal / 12 + rentalAdjusted / 12
    };
  }, [incomeInputs]);

  // Save quote - opens modal for label
  const openSaveModal = () => {
    // Generate default label based on active tab
    const clientName = clientInfo.name || 'Client';
    let defaultLabel;
    
    if (activeTab === 'second') {
      defaultLabel = `${clientName} - ${secondMortgageType.toUpperCase()} ${formatCurrency(secondMortgageDetails.drawAmount)}`;
    } else {
      defaultLabel = `${clientName} - ${term}yr ${loanPurpose === 'purchase' ? 'Purchase' : 'Refinance'}`;
    }
    setQuoteLabel(defaultLabel);
    setSaveModalOpen(true);
  };
  
  // Perform the actual save
  const saveCurrentQuote = () => {
    setSaveStatus('saving');
    
    let quote;
    
    if (activeTab === 'second') {
      // Save Home Equity quote
      quote = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
        label: quoteLabel || `Quote ${Date.now()}`,
        quoteType: 'homeEquity',
        productType: secondMortgageType,
        clientInfo,
        secondMortgageDetails: { ...secondMortgageDetails },
        calculations: secondMortgageCalcs.slice(0, 3),
        heloanRateOptions: secondMortgageType === 'heloan' ? [...heloanRateOptions] : null,
        helocRateOptions: secondMortgageType === 'heloc' ? [...helocRateOptions] : null,
        heOverrides: { ...heOverrides },
        loCompensationHE,
        recommendedIndex: recommendedSecondMortgage,
        state: clientInfo.state
      };
    } else {
      // Save Purchase/Refi quote
      quote = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
        label: quoteLabel || `Quote ${Date.now()}`,
        quoteType: 'mortgage',
        clientInfo,
        loanPurpose,
        loanProgram,
        term,
        creditScore,
        baseLoanAmount,
        isVeteran,
        vaFundingFeeExempt,
        vaFundingFeeFinanced,
        fhaMIPFinanced,
        rateType,
        armConfig: rateType === 'arm' ? { ...armConfig } : null,
        propertyDetails,
        calculations: calculations.slice(0, 3),
        rateOptions: [...rateOptions],
        loCompensation,
        prepaidSettings: { ...effectivePrepaidSettings },
        feeOverrides: { ...feeOverrides },
        recommendedIndex: recommendedQuote,
        state: clientInfo.state
      };
    }
    
    // Simulate brief delay for UX feedback
    setTimeout(() => {
      setSavedQuotes(prev => [quote, ...prev]);
      setSaveStatus('saved');
      
      // Close modal after showing success
      setTimeout(() => {
        setSaveModalOpen(false);
        setSaveStatus(null);
        setQuoteLabel('');
      }, 1000);
    }, 300);
  };

  // Load saved quote
  const loadSavedQuote = (quote) => {
    // Database quotes have data in quote_data, local quotes don't
    const data = quote.quote_data || quote;
    
    // Always restore client info
    if (data.clientInfo) {
      setClientInfo(data.clientInfo);
    } else if (quote.client_name) {
      // Fallback to top-level fields from database
      setClientInfo({
        name: quote.client_name || '',
        email: quote.client_email || '',
        phone: quote.client_phone || '',
        address: quote.property_address || '',
        city: '',
        state: 'CA',
        zip: ''
      });
    }
    
    if (data.quoteType === 'home_equity' || quote.quote_type === 'home_equity') {
      // Load Home Equity quote
      setSecondMortgageType(data.secondMortgageType || data.productType || 'heloan');
      if (data.secondMortgageDetails) setSecondMortgageDetails(data.secondMortgageDetails);
      if (data.heloanRateOptions) setHeloanRateOptions(data.heloanRateOptions);
      if (data.helocRateOptions) setHelocRateOptions(data.helocRateOptions);
      if (data.heOverrides) setHeOverrides(data.heOverrides);
      if (data.loCompensationHE !== undefined) setLoCompensationHE(data.loCompensationHE);
      if (data.recommendedIndex !== undefined) setRecommendedSecondMortgage(data.recommendedIndex);
      setActiveTab('second');
    } else {
      // Load Purchase/Refi quote
      if (data.loanPurpose) setLoanPurpose(data.loanPurpose);
      if (data.loanProgram) setLoanProgram(data.loanProgram);
      if (data.term) setTerm(data.term);
      setCreditScore(data.creditScore || 740);
      if (data.baseLoanAmount !== undefined) setBaseLoanAmount(data.baseLoanAmount);
      if (data.isVeteran !== undefined) setIsVeteran(data.isVeteran);
      // FHA/VA fee settings
      if (data.vaFundingFeeExempt !== undefined) setVaFundingFeeExempt(data.vaFundingFeeExempt);
      if (data.vaFundingFeeFinanced !== undefined) setVaFundingFeeFinanced(data.vaFundingFeeFinanced);
      if (data.fhaMIPFinanced !== undefined) setFhaMIPFinanced(data.fhaMIPFinanced);
      if (data.rateType) setRateType(data.rateType);
      if (data.armConfig) setArmConfig(data.armConfig);
      if (data.propertyDetails) setPropertyDetails(data.propertyDetails);
      if (data.rateOptions) setRateOptions(data.rateOptions);
      if (data.loCompensation !== undefined) setLoCompensation(data.loCompensation);
      if (data.prepaidSettings) setPrepaidSettings({ ...data.prepaidSettings, isModified: true });
      if (data.feeOverrides) setFeeOverrides(data.feeOverrides);
      if (data.recommendedIndex !== undefined) setRecommendedQuote(data.recommendedIndex);
      setActiveTab('quote');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#e8e8e8',
      fontFamily: "'Outfit', -apple-system, sans-serif",
      color: '#1a1a1a'
    }}>
      <style>{styles}</style>
      
      {/* Share Quote Modal */}
      <ShareQuoteModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        quote={shareQuoteData}
        loanOfficer={loanOfficer}
        shareUrl={shareUrl}
      />

      {/* Header */}
      <header style={{
        background: '#1a1a1a',
        borderBottom: '3px solid #7B2CBF',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: '20px'
      }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          {/* CDM Logo */}
          <svg width="44" height="44" viewBox="0 0 100 100" style={{ borderRadius: '8px' }}>
            <defs>
              <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7B2CBF" />
                <stop offset="100%" stopColor="#3C096C" />
              </linearGradient>
            </defs>
            {/* Sun rays */}
            <rect x="47" y="5" width="6" height="25" fill="url(#purpleGrad)" transform="rotate(0, 50, 50)" />
            <rect x="47" y="5" width="6" height="22" fill="url(#purpleGrad)" transform="rotate(-25, 50, 50)" />
            <rect x="47" y="5" width="6" height="22" fill="url(#purpleGrad)" transform="rotate(25, 50, 50)" />
            <rect x="47" y="5" width="6" height="18" fill="url(#purpleGrad)" transform="rotate(-50, 50, 50)" />
            <rect x="47" y="5" width="6" height="18" fill="url(#purpleGrad)" transform="rotate(50, 50, 50)" />
            <rect x="47" y="5" width="5" height="14" fill="#9D4EDD" transform="rotate(-70, 50, 50)" />
            <rect x="47" y="5" width="5" height="14" fill="#9D4EDD" transform="rotate(70, 50, 50)" />
            {/* Bowl/cup shape */}
            <path d="M 15 55 Q 15 85 50 85 Q 85 85 85 55 L 80 55 Q 80 80 50 80 Q 20 80 20 55 Z" fill="url(#purpleGrad)" />
            <path d="M 25 55 Q 25 75 50 75 Q 75 75 75 55 L 70 55 Q 70 70 50 70 Q 30 70 30 55 Z" fill="#3C096C" />
          </svg>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', color: 'white' }}>CDM Quote Pro</h1>
            <p style={{ fontSize: '12px', color: '#999' }}>Client Direct Mortgage</p>
          </div>
        </div>
        
        <nav style={{ display: 'flex', gap: '4px', flex: '1', justifyContent: 'center' }}>
          {[
            { id: 'quote', label: 'Purchase/Refi' },
            { id: 'second', label: 'Home Equity' },
            { id: 'income', label: 'Income' },
            { id: 'saved', label: 'Saved' },
            { id: 'notifications', label: '🔔 Activity' },
            { id: 'admin', label: '⚙ Admin' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: '500',
                border: activeTab === tab.id ? 'none' : '1px solid #444',
                borderRadius: '6px',
                background: activeTab === tab.id ? '#1a1a1a' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#ccc',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        
        {/* User Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                background: notifications.length > 0 ? '#7B2CBF' : '#333',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'white',
                fontSize: '14px',
                zIndex: 101
              }}
            >
              🔔 {notifications.length > 0 && <span style={{ fontWeight: '600' }}>{notifications.length}</span>}
            </button>
            
            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                width: '320px',
                maxHeight: '400px',
                overflow: 'auto',
                zIndex: 1000
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '14px' }}>Notifications</strong>
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#888' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                    <div style={{ fontSize: '14px' }}>No new notifications</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>You'll be notified when clients view their quotes</div>
                    <button
                      onClick={() => {
                        setActiveTab('notifications');
                        setShowNotifications(false);
                      }}
                      style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        background: '#7B2CBF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      View All Activity
                    </button>
                  </div>
                ) : (
                  <>
                    {notifications.slice(0, 5).map(notif => (
                      <div 
                        key={notif.id} 
                        style={{ 
                          padding: '12px 16px', 
                          borderBottom: '1px solid #eee',
                          background: '#fafafa'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>
                            {notif.quotes?.client_name || 'Client'}
                          </div>
                          <span style={{ fontSize: '10px', color: '#888' }}>
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                          Viewed: {notif.quotes?.label || 'Quote'}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {notif.quotes?.share_id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Load the quote
                                const quote = dbQuotes.find(q => q.id === notif.quotes.id);
                                if (quote) {
                                  loadSavedQuote(quote);
                                  setShowNotifications(false);
                                }
                              }}
                              style={{
                                padding: '4px 8px',
                                fontSize: '10px',
                                background: '#7B2CBF',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              View Quote
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkNotificationRead(notif.id);
                            }}
                            style={{
                              padding: '4px 8px',
                              fontSize: '10px',
                              background: '#e0e0e0',
                              color: '#666',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* View All Button */}
                    <div 
                      style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center',
                        borderTop: '1px solid #eee',
                        cursor: 'pointer',
                        color: '#7B2CBF',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}
                      onClick={() => {
                        setActiveTab('notifications');
                        setShowNotifications(false);
                      }}
                    >
                      View All Activity →
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* User Profile */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              onClick={() => setActiveTab('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {loanOfficer?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </div>
              <div style={{ color: 'white' }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{loanOfficer?.full_name || 'User'}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>NMLS# {loanOfficer?.nmls_number || ''}</div>
              </div>
            </div>
            <button
              onClick={onSignOut}
              style={{
                background: '#333',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#999',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={{ padding: '32px', maxWidth: '1800px', margin: '0 auto' }}>
        
        {/* ================================================================ */}
        {/* QUOTE BUILDER TAB */}
        {/* ================================================================ */}
        {activeTab === 'quote' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '28px' }}>
            {/* Left Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Client Info */}
              <div className="card animate-in">
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Client Information</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label className="label">Client Name</label>
                    <input placeholder="John Smith" value={clientInfo.name} onChange={(e) => handleClientChange('name', e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Email</label>
                      <input type="email" placeholder="john@example.com" value={clientInfo.email} onChange={(e) => handleClientChange('email', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input type="tel" placeholder="(555) 123-4567" value={clientInfo.phone} onChange={(e) => handleClientChange('phone', formatPhoneNumber(e.target.value))} />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <label className="label">Property Address</label>
                  <input placeholder="123 Main Street" value={clientInfo.address} onChange={(e) => handleClientChange('address', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <label className="label">City</label>
                    <input placeholder="City" value={clientInfo.city} onChange={(e) => handleClientChange('city', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <select value={clientInfo.state} onChange={(e) => handleClientChange('state', e.target.value)}>
                      {Object.entries(stateNames).map(([abbrev, name]) => (
                        <option key={abbrev} value={abbrev}>{abbrev}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">ZIP</label>
                    <input placeholder="90210" value={clientInfo.zip} onChange={(e) => handleClientChange('zip', e.target.value)} />
                  </div>
                </div>
                
                {/* Tax Rate Display */}
                <div style={{ marginTop: '12px', padding: '10px', background: '#f0f0f0', borderRadius: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>{stateNames[clientInfo.state]} Tax Rate:</span>
                    <span style={{ fontWeight: '600' }}>{(propertyTaxRates[clientInfo.state] * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Loan Config */}
              <div className="card animate-in" style={{ animationDelay: '0.1s' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Loan Configuration</h3>
                
                <div>
                  <label className="label">Loan Purpose</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {[
                      { value: 'purchase', label: 'Purchase' },
                      { value: 'rateTerm', label: 'Rate/Term' },
                      { value: 'cashOut', label: 'Cash-Out' }
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setLoanPurpose(opt.value)} 
                        className={`btn-secondary ${loanPurpose === opt.value ? 'active' : ''}`} 
                        style={{ padding: '10px 8px', fontSize: '12px' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ marginTop: '14px' }}>
                  <label className="label">Loan Program</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {[
                      { value: 'conventional', label: 'Conv' },
                      { value: 'fha', label: 'FHA' },
                      { value: 'va', label: 'VA' }
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setLoanProgram(opt.value)} 
                        className={`btn-secondary ${loanProgram === opt.value ? 'active' : ''}`} 
                        style={{ padding: '10px 8px', fontSize: '12px' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {loanProgram === 'va' && (
                  <div style={{ marginTop: '12px', background: '#f8f8f8', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>VA Funding Fee</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={vaFundingFeeExempt} 
                        onChange={(e) => setVaFundingFeeExempt(e.target.checked)} 
                      />
                      <span style={{ fontSize: '13px' }}>Exempt (10%+ disability)</span>
                    </label>
                    {!vaFundingFeeExempt && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                          <button 
                            onClick={() => setVaFundingFeeFinanced(true)}
                            className={`btn-secondary ${vaFundingFeeFinanced ? 'active' : ''}`}
                            style={{ padding: '8px', fontSize: '11px' }}
                          >
                            Finance
                          </button>
                          <button 
                            onClick={() => setVaFundingFeeFinanced(false)}
                            className={`btn-secondary ${!vaFundingFeeFinanced ? 'active' : ''}`}
                            style={{ padding: '8px', fontSize: '11px' }}
                          >
                            Pay at Closing
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#7B2CBF', marginTop: '6px', fontWeight: '600' }}>
                          Fee: {formatCurrency(calculateVAFundingFee(baseLoanAmount, loanPurpose === 'purchase' ? (propertyDetails.downPaymentPercent || 0) : 0))}
                          {vaFundingFeeFinanced ? ' (Added to loan)' : ' (Section B)'}
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {loanProgram === 'fha' && (
                  <div style={{ marginTop: '12px', background: '#f8f8f8', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>Upfront MIP (1.75%)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button 
                        onClick={() => setFhaMIPFinanced(true)}
                        className={`btn-secondary ${fhaMIPFinanced ? 'active' : ''}`}
                        style={{ padding: '8px', fontSize: '11px' }}
                      >
                        Finance
                      </button>
                      <button 
                        onClick={() => setFhaMIPFinanced(false)}
                        className={`btn-secondary ${!fhaMIPFinanced ? 'active' : ''}`}
                        style={{ padding: '8px', fontSize: '11px' }}
                      >
                        Pay at Closing
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: '#7B2CBF', marginTop: '6px', fontWeight: '600' }}>
                      Fee: {formatCurrency(calculateFHAUpfrontMIP(baseLoanAmount))}
                      {fhaMIPFinanced ? ' (Added to loan)' : ' (Section B)'}
                    </div>
                  </div>
                )}
                
                {/* Rate Type Toggle */}
                <div style={{ marginTop: '14px' }}>
                  <label className="label">Rate Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button 
                      onClick={() => setRateType('fixed')} 
                      className={`btn-secondary ${rateType === 'fixed' ? 'active' : ''}`}
                      style={{ padding: '10px 8px', fontSize: '12px' }}
                    >
                      Fixed Rate
                    </button>
                    <button 
                      onClick={() => setRateType('arm')} 
                      className={`btn-secondary ${rateType === 'arm' ? 'active' : ''}`}
                      style={{ padding: '10px 8px', fontSize: '12px' }}
                    >
                      ARM
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                  <div>
                    <label className="label">{rateType === 'arm' ? 'ARM Product' : 'Term'}</label>
                    {rateType === 'fixed' ? (
                      <select value={term} onChange={(e) => setTerm(parseInt(e.target.value))}>
                        {termOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    ) : (
                      <select 
                        value={armConfig.product} 
                        onChange={(e) => setArmConfig(prev => ({ ...prev, product: e.target.value }))}
                      >
                        {armProducts.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="label">Credit Score</label>
                    <input type="number" min="500" max="850" value={creditScore} 
                      onChange={(e) => setCreditScore(parseInt(e.target.value) || 740)} />
                  </div>
                </div>
                
                {/* ARM Configuration Fields */}
                {rateType === 'arm' && (
                  <div style={{ marginTop: '14px', padding: '14px', background: '#f8f8f8', borderRadius: '10px', border: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#444' }}>ARM Parameters</div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <div style={{ flex: '0 0 auto' }}>
                        <label className="label" style={{ fontSize: '11px' }}>Index</label>
                        <select 
                          value={armConfig.index}
                          onChange={(e) => setArmConfig(prev => ({ ...prev, index: e.target.value }))}
                          style={{ padding: '8px 6px', fontSize: '12px', width: '90px' }}
                        >
                          <option value="SOFR">SOFR</option>
                          <option value="1YR_TREASURY">1-Yr T</option>
                          <option value="PRIME">Prime</option>
                        </select>
                      </div>
                      <div style={{ flex: '0 0 auto' }}>
                        <label className="label" style={{ fontSize: '11px' }}>Index %</label>
                        <input 
                          type="number" 
                          step="0.125" 
                          value={armConfig.indexRate}
                          onChange={(e) => setArmConfig(prev => ({ ...prev, indexRate: parseFloat(e.target.value) || 0 }))}
                          style={{ padding: '8px 6px', fontSize: '12px', width: '65px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ flex: '0 0 auto' }}>
                        <label className="label" style={{ fontSize: '11px' }}>Margin %</label>
                        <input 
                          type="number" 
                          step="0.125" 
                          value={armConfig.margin}
                          onChange={(e) => setArmConfig(prev => ({ ...prev, margin: parseFloat(e.target.value) || 0 }))}
                          style={{ padding: '8px 6px', fontSize: '12px', width: '65px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ flex: '1 1 auto', padding: '8px 10px', background: '#e8e8e8', borderRadius: '6px', textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', color: '#666' }}>Fully Indexed: </span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#7B2CBF' }}>{(armConfig.indexRate + armConfig.margin).toFixed(2)}%</span>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '10px' }}>
                      <label className="label" style={{ fontSize: '11px' }}>Rate Caps (Initial / Periodic / Lifetime)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <input 
                          type="number" 
                          step="0.5" 
                          value={armConfig.initialCap}
                          onChange={(e) => setArmConfig(prev => ({ ...prev, initialCap: parseFloat(e.target.value) || 0 }))}
                          placeholder="Initial"
                          style={{ padding: '8px', fontSize: '12px', textAlign: 'center' }}
                        />
                        <input 
                          type="number" 
                          step="0.5" 
                          value={armConfig.periodicCap}
                          onChange={(e) => setArmConfig(prev => ({ ...prev, periodicCap: parseFloat(e.target.value) || 0 }))}
                          placeholder="Periodic"
                          style={{ padding: '8px', fontSize: '12px', textAlign: 'center' }}
                        />
                        <input 
                          type="number" 
                          step="0.5" 
                          value={armConfig.lifetimeCap}
                          onChange={(e) => setArmConfig(prev => ({ ...prev, lifetimeCap: parseFloat(e.target.value) || 0 }))}
                          placeholder="Lifetime"
                          style={{ padding: '8px', fontSize: '12px', textAlign: 'center' }}
                        />
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#666', lineHeight: '1.5' }}>
                      {(() => {
                        const product = armProducts.find(p => p.value === armConfig.product);
                        const startRate = rateOptions[0]?.rate || 6.5;
                        const fixedPeriodText = product?.fixedLabel || (product?.fixedYears >= 1 ? `${product?.fixedYears} years` : `${product?.fixedYears * 12} months`);
                        const fullyIndexedRate = armConfig.indexRate + armConfig.margin;
                        return (
                          <>
                            <strong>Summary:</strong> Fixed at start rate for {fixedPeriodText}, then adjusts 
                            {product?.adjustFrequency === 1 ? ' annually' : ' every 6 months'} based on {armConfig.index}. 
                            After fixed period, rate adjusts to fully indexed rate ({fullyIndexedRate.toFixed(3)}% today).
                            <br />
                            <strong>Caps:</strong> First adjustment ±{armConfig.initialCap}%, 
                            subsequent ±{armConfig.periodicCap}%, lifetime ±{armConfig.lifetimeCap}%.
                            <br />
                            <strong>APR Note:</strong> APR reflects blended rate (start rate during fixed period, fully indexed rate thereafter).
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
                
                <div style={{ marginTop: '14px' }}>
                  <label className="label">Loan Amount</label>
                  <CurrencyInput 
                    value={baseLoanAmount} 
                    onChange={setBaseLoanAmount}
                    style={{ fontSize: '16px', fontWeight: '600' }}
                  />
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                    <span>LTV: {(baseLTV * 100).toFixed(1)}%</span>
                    <span>Property: {formatCurrency(propertyValue)}</span>
                  </div>
                </div>
                
                {/* PMI Rate Display */}
                {loanProgram === 'conventional' && baseLTV > 0.8 && (
                  <div style={{ marginTop: '12px', padding: '10px', background: '#f5f5f5', borderRadius: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>PMI Rate (Score {creditScore}):</span>
                      <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{(getPMIRate(creditScore) * 100).toFixed(2)}% annual</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="card animate-in" style={{ animationDelay: '0.2s' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Property Details</h3>
                
                {(loanPurpose === 'cashOut' || loanPurpose === 'rateTerm') ? (
                  <>
                    <div>
                      <label className="label">Home Value</label>
                      <CurrencyInput value={propertyDetails.homeValue} onChange={(val) => handlePropertyChange('homeValue', val)} />
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <label className="label">Current Balance</label>
                      <CurrencyInput value={propertyDetails.currentBalance} onChange={(val) => handlePropertyChange('currentBalance', val)} />
                    </div>
                    {loanPurpose === 'cashOut' && (
                      <div style={{ marginTop: '12px' }}>
                        <label className="label">Desired Cash Out</label>
                        <CurrencyInput value={propertyDetails.desiredCash} onChange={(val) => handlePropertyChange('desiredCash', val)} />
                      </div>
                    )}
                    <div style={{ marginTop: '14px', padding: '14px', background: '#f5f5f5', borderRadius: '10px', border: '1px solid #e0e0e0' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Available Equity</div>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatCurrency(propertyDetails.homeValue - propertyDetails.currentBalance)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="label">Purchase Price</label>
                      <CurrencyInput value={propertyDetails.purchasePrice} onChange={(val) => handlePropertyChange('purchasePrice', val)} />
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <label className="label">Down Payment %</label>
                      <input type="number" value={propertyDetails.downPaymentPercent} onChange={(e) => handlePropertyChange('downPaymentPercent', e.target.value)} />
                    </div>
                    <div style={{ marginTop: '14px', padding: '14px', background: '#f5f5f5', borderRadius: '10px', border: '1px solid #e0e0e0' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Down Payment</div>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatCurrency(propertyDetails.purchasePrice * (propertyDetails.downPaymentPercent / 100))}
                      </div>
                    </div>
                  </>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                  <div>
                    <label className="label">Property Type</label>
                    <select value={propertyDetails.propertyType} onChange={(e) => setPropertyDetails(p => ({ ...p, propertyType: e.target.value }))}>
                      <option value="single">Single Family</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="multi">Multi-Family</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Property Use</label>
                    <select value={propertyDetails.propertyUse} onChange={(e) => setPropertyDetails(p => ({ ...p, propertyUse: e.target.value }))}>
                      <option value="primary">Primary</option>
                      <option value="secondary">Second Home</option>
                      <option value="investment">Investment</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Monthly Escrow Breakdown */}
              <div className="card animate-in" style={{ animationDelay: '0.3s' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Monthly Escrow</h3>
                <div className="cost-breakdown" style={{ background: 'transparent', padding: 0 }}>
                  <div className="cost-line">
                    <span className="label">Property Taxes</span>
                    <span className="value">{formatCurrency(monthlyTax)}</span>
                  </div>
                  <div className="cost-line">
                    <span className="label">Homeowners Insurance</span>
                    <span className="value">{formatCurrency(monthlyHOI)}</span>
                  </div>
                  <div className="cost-line" style={{ borderTop: '2px solid #ddd', paddingTop: '10px' }}>
                    <span className="label">Total Monthly Escrow</span>
                    <span className="value" style={{ color: '#1a1a1a' }}>{formatCurrency(monthlyEscrow)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Quotes */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700' }}>
                    Loan Options
                    {rateType === 'arm' && (
                      <span style={{ 
                        marginLeft: '10px', 
                        padding: '4px 10px', 
                        background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)', 
                        color: 'white', 
                        borderRadius: '12px', 
                        fontSize: '11px', 
                        fontWeight: '600',
                        verticalAlign: 'middle'
                      }}>
                        {armConfig.product} ARM
                      </span>
                    )}
                  </h2>
                  {/* View Toggle */}
                  <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: '8px', padding: '4px' }}>
                    <button 
                      onClick={() => setPurchaseRefiView('quotes')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '6px',
                        background: purchaseRefiView === 'quotes' ? '#1a1a1a' : 'transparent',
                        color: purchaseRefiView === 'quotes' ? 'white' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Quotes
                    </button>
                    <button 
                      onClick={() => setPurchaseRefiView('amortization')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '6px',
                        background: purchaseRefiView === 'amortization' ? '#1a1a1a' : 'transparent',
                        color: purchaseRefiView === 'amortization' ? 'white' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Amortization
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-secondary" onClick={openSaveModal}>Save Quote</button>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      // Calculate detailed fees for each option
                      const detailedCalcs = calculations.slice(0, 3).map((calc, i) => {
                        const lendersTitle = (titleInsuranceRates[clientInfo.state] || 2.5) * (calc.totalLoanAmount / 1000);
                        const recordingFee = recordingFees[clientInfo.state] || 115;
                        const transferTax = (transferTaxRates[clientInfo.state] || 0) * (propertyValue / 1000);
                        
                        // Section A
                        const sectionA = {
                          pointsCost: calc.pointsCost > 0 ? calc.pointsCost : 0,
                          adminFee: feeTemplates.adminFee,
                          underwritingFee: feeTemplates.underwritingFee,
                          total: (calc.pointsCost > 0 ? calc.pointsCost : 0) + feeTemplates.adminFee + feeTemplates.underwritingFee
                        };
                        
                        // Section B - includes upfront government fees if not financed
                        const sectionB = {
                          appraisal: feeTemplates.appraisal,
                          creditReport: feeTemplates.creditReport,
                          floodCert: feeTemplates.floodCert,
                          processing: feeTemplates.processing,
                          taxService: feeTemplates.taxService,
                          // Upfront government fee (if paid at closing, not financed)
                          upfrontFee: calc.closingUpfrontFee || 0,
                          upfrontFeeLabel: calc.upfrontFeeLabel || '',
                          upfrontFeeFinanced: calc.upfrontFeeFinanced,
                          total: feeTemplates.appraisal + feeTemplates.creditReport + feeTemplates.floodCert + 
                                 feeTemplates.processing + feeTemplates.taxService + (calc.closingUpfrontFee || 0)
                        };
                        
                        // Section C
                        const sectionC = {
                          lendersTitle,
                          notaryFee: feeTemplates.notaryFee,
                          recordingServiceFee: feeTemplates.recordingServiceFee,
                          settlementFee: feeTemplates.settlementFee,
                          total: lendersTitle + feeTemplates.notaryFee + feeTemplates.recordingServiceFee + feeTemplates.settlementFee
                        };
                        
                        // Section D (Total Loan Costs)
                        const totalLoanCosts = sectionA.total + sectionB.total + sectionC.total;
                        
                        // Section E
                        const sectionE = {
                          recordingFee,
                          transferTax,
                          total: recordingFee + transferTax
                        };
                        
                        // Section F
                        const sectionF = {
                          prepaidHOI: calc.monthlyHOI * effectivePrepaidSettings.prepaidMonthsInsurance,
                          prepaidInterest: calc.prepaidInterest,
                          prepaidTax: calc.monthlyTax * effectivePrepaidSettings.prepaidMonthsTax,
                          total: (calc.monthlyHOI * effectivePrepaidSettings.prepaidMonthsInsurance) + calc.prepaidInterest + (calc.monthlyTax * effectivePrepaidSettings.prepaidMonthsTax)
                        };
                        
                        // Section G
                        const sectionG = effectivePrepaidSettings.escrowWaived ? {
                          escrowHOI: 0,
                          escrowTax: 0,
                          total: 0,
                          waived: true
                        } : {
                          escrowHOI: calc.monthlyHOI * effectivePrepaidSettings.escrowMonthsInsurance,
                          escrowTax: calc.monthlyTax * effectivePrepaidSettings.escrowMonthsTax,
                          total: (calc.monthlyHOI * effectivePrepaidSettings.escrowMonthsInsurance) + (calc.monthlyTax * effectivePrepaidSettings.escrowMonthsTax),
                          waived: false
                        };
                        
                        // Section I (Total Other Costs)
                        const totalOtherCosts = sectionE.total + sectionF.total + sectionG.total;
                        
                        // Section J (Total Closing Costs)
                        const totalClosingCosts = totalLoanCosts + totalOtherCosts;
                        
                        // Cash to Close / Cash Out calculation
                        const downPayment = loanPurpose === 'purchase' ? propertyValue - baseLoanAmount : 0;
                        const netClosingCosts = totalClosingCosts - calc.lenderCredit;
                        
                        let cashToClose;
                        if (loanPurpose === 'purchase') {
                          // Purchase: Down payment + closing costs
                          cashToClose = downPayment + netClosingCosts;
                        } else {
                          // Refinance: New loan - payoff - closing costs = cash out
                          const currentBalance = propertyDetails.currentBalance || 0;
                          cashToClose = baseLoanAmount - currentBalance - netClosingCosts;
                        }
                        
                        return {
                          ...calc,
                          isRecommended: recommendedQuote === i,
                          cashFlow: cashToClose, // For consumer view cash out display
                          feeBreakdown: {
                            sectionA,
                            sectionB,
                            sectionC,
                            totalLoanCosts,
                            sectionE,
                            sectionF,
                            sectionG,
                            totalOtherCosts,
                            totalClosingCosts,
                            lenderCredit: calc.lenderCredit,
                            downPayment,
                            cashToClose,
                            // Upfront government fee info for display
                            upfrontFee: calc.upfrontFee || 0,
                            upfrontFeeFinanced: calc.upfrontFeeFinanced,
                            upfrontFeeLabel: calc.upfrontFeeLabel || '',
                            financedUpfrontFee: calc.financedUpfrontFee || 0
                          }
                        };
                      });
                      
                      handleShareQuote({
                        label: quoteLabel || `Quote for ${clientInfo.name || 'Client'}`,
                        baseLoanAmount,
                        loanProgram,
                        loanPurpose,
                        term,
                        creditScore,
                        rateType,
                        armConfig,
                        propertyDetails,
                        propertyValue,
                        // Include FHA/VA fee settings
                        vaFundingFeeExempt,
                        vaFundingFeeFinanced,
                        fhaMIPFinanced,
                        calculations: detailedCalcs
                      });
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>📤</span> Share Quote
                  </button>
                  <button className="btn-secondary" onClick={() => setActiveTab('rates')}>Edit Rates</button>
                </div>
              </div>
              
              {/* Quotes View */}
              {purchaseRefiView === 'quotes' && (
              <>
              {/* Quote Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(calculations.length, 3)}, 1fr)`, gap: '20px', marginTop: '20px' }}>
                {calculations.slice(0, 3).map((calc, index) => (
                  <div key={index} style={{ position: 'relative', paddingTop: recommendedQuote === index ? '36px' : '0' }}>
                    {/* Recommended Banner - extends above card */}
                    {recommendedQuote === index && (
                      <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #7B2CBF, #3C096C)',
                        color: 'white',
                        padding: '8px 20px',
                        borderRadius: '20px 20px 0 0',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        boxShadow: '0 -4px 15px rgba(123, 44, 191, 0.3)',
                        zIndex: 10
                      }}>
                        ★ Recommended
                      </div>
                    )}
                    
                    <div className="quote-card animate-in" style={{ 
                      animationDelay: `${index * 0.1}s`,
                      border: recommendedQuote === index ? '2px solid #7B2CBF' : 'none',
                      boxShadow: recommendedQuote === index 
                        ? '0 15px 50px rgba(123, 44, 191, 0.25), 0 4px 12px rgba(0,0,0,0.1)' 
                        : '0 10px 40px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '4px' }}>
                            Option {index + 1}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: '700' }}>{calc.name}</div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{calc.description}</div>
                        </div>
                        {/* Recommend Checkbox */}
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          cursor: 'pointer',
                          background: recommendedQuote === index ? 'linear-gradient(135deg, #7B2CBF, #3C096C)' : '#f0f0f0',
                          color: recommendedQuote === index ? 'white' : '#555',
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontSize: '11px', 
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}>
                          <input 
                            type="checkbox" 
                            checked={recommendedQuote === index}
                            onChange={() => setRecommendedQuote(recommendedQuote === index ? null : index)}
                            style={{ display: 'none' }}
                          />
                          {recommendedQuote === index ? '★ Best' : 'Mark Best'}
                        </label>
                      </div>
                    
                    <div style={{ background: '#f0f0f0', borderRadius: '14px', padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Total Monthly Payment</div>
                      <div className="stat-value" style={{ fontSize: '32px' }}>{formatCurrency(calc.totalMonthlyPayment)}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>P&I: {formatCurrency(calc.monthlyPI)}</div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                          {calc.rateType === 'arm' ? 'Start Rate' : 'Rate'}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }} className="mono">{formatPercent(calc.rate)}</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>APR</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#555' }} className="mono">{formatPercent(calc.apr)}</div>
                      </div>
                    </div>
                    
                    {/* ARM Details Banner */}
                    {calc.rateType === 'arm' && calc.armDetails && (
                      <div style={{ 
                        marginBottom: '16px', 
                        padding: '12px', 
                        background: 'linear-gradient(135deg, #7B2CBF15 0%, #9D4EDD15 100%)',
                        borderRadius: '10px',
                        border: '1px solid #7B2CBF30'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#7B2CBF' }}>
                            {calc.armDetails.product} ARM
                          </span>
                          <span style={{ fontSize: '11px', color: '#666' }}>
                            {calc.armDetails.index}: {calc.armDetails.indexRate}% + {calc.armDetails.margin}% margin
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', fontSize: '11px' }}>
                          <div style={{ textAlign: 'center', padding: '6px', background: 'white', borderRadius: '6px' }}>
                            <div style={{ color: '#888' }}>Fixed</div>
                            <div style={{ fontWeight: '600' }}>{calc.armDetails.fixedLabel}</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '6px', background: 'white', borderRadius: '6px' }}>
                            <div style={{ color: '#888' }}>Fully Indexed</div>
                            <div style={{ fontWeight: '600' }}>{calc.armDetails.fullyIndexedRate.toFixed(2)}%</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '6px', background: 'white', borderRadius: '6px' }}>
                            <div style={{ color: '#888' }}>Caps</div>
                            <div style={{ fontWeight: '600' }}>{calc.armDetails.initialCap}/{calc.armDetails.periodicCap}/{calc.armDetails.lifetimeCap}</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '6px', background: 'white', borderRadius: '6px' }}>
                            <div style={{ color: '#888' }}>Max Rate</div>
                            <div style={{ fontWeight: '600' }}>{calc.armDetails.maxLifetimeRate.toFixed(2)}%</div>
                          </div>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '10px', color: '#888', textAlign: 'center' }}>
                          APR based on start rate for fixed period, then fully indexed rate
                        </div>
                      </div>
                    )}
                    
                    <div className="divider" />
                    
                    {/* Payment Breakdown */}
                    <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: '#444' }}>Monthly Payment</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: '#666' }}>Principal & Interest</span>
                        <span className="mono" style={{ fontWeight: '500' }}>{formatCurrency(calc.monthlyPI)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: '#666' }}>Property Taxes</span>
                        <span className="mono" style={{ fontWeight: '500' }}>{formatCurrency(calc.monthlyTax)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: '#666' }}>Insurance</span>
                        <span className="mono" style={{ fontWeight: '500' }}>{formatCurrency(calc.monthlyHOI)}</span>
                      </div>
                      {calc.monthlyMI > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span style={{ color: '#666' }}>{loanProgram === 'fha' ? 'MIP' : 'PMI'}</span>
                          <span className="mono" style={{ fontWeight: '500' }}>{formatCurrency(calc.monthlyMI)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="divider" />
                    
                    {/* Closing Costs Breakdown - Reorganized */}
                    <div style={{ fontSize: '13px' }}>
                      
                      {/* Points or Lender Credit Section (always shown for consistent layout) */}
                      <div style={{ marginBottom: '12px' }}>
                        {calc.pointsCost > 0 ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f0f0f0', borderRadius: '8px' }}>
                            <span style={{ fontWeight: '600', color: '#1a1a1a' }}>Discount Points</span>
                            <span className="mono" style={{ fontWeight: '600', color: '#1a1a1a' }}>{formatCurrency(calc.pointsCost)}</span>
                          </div>
                        ) : calc.lenderCredit > 0 ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f0f0f0', borderRadius: '8px' }}>
                            <span style={{ fontWeight: '600', color: '#1a1a1a' }}>Lender Credit</span>
                            <span className="mono" style={{ fontWeight: '600', color: '#1a1a1a' }}>-{formatCurrency(calc.lenderCredit)}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f5f5f5', borderRadius: '8px' }}>
                            <span style={{ fontWeight: '600', color: '#888' }}>Points / Credits</span>
                            <span className="mono" style={{ fontWeight: '600', color: '#888' }}>$0</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Closing Costs Summary */}
                      <div style={{ background: '#f8f8f8', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span style={{ color: '#666', fontSize: '13px' }}>Closing Costs</span>
                          <span className="mono" style={{ fontWeight: '500' }}>{formatCurrency(calc.totalLoanCosts + calc.governmentFees)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span style={{ color: '#666', fontSize: '13px' }}>Prepaids & Escrow</span>
                          <span className="mono" style={{ fontWeight: '500' }}>{formatCurrency(calc.totalPrepaids + calc.escrowReserves)}</span>
                        </div>
                        {calc.lenderCredit > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16a34a' }}>
                            <span style={{ fontSize: '13px' }}>Lender Credit</span>
                            <span className="mono" style={{ fontWeight: '500' }}>-{formatCurrency(calc.lenderCredit)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: '8px', borderTop: '1px solid #ddd' }}>
                          <span style={{ fontWeight: '600', color: '#333' }}>Total Closing Costs</span>
                          <span className="mono" style={{ fontWeight: '700' }}>{formatCurrency(calc.totalClosingCosts)}</span>
                        </div>
                      </div>
                      
                    </div>
                    
                    {/* Cash to Close / Cash Out - Clickable */}
                    <div 
                      onClick={() => { setFeeModalQuoteIndex(index); setFeeModalOpen(true); }}
                      className="cash-to-close-btn"
                      style={{ 
                        background: 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)', 
                        borderRadius: '12px', 
                        marginTop: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                      onMouseOver={(e) => { 
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
                      }}
                      onMouseOut={(e) => { 
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                      }}
                    >
                      {/* Main Content */}
                      <div style={{ padding: '14px 14px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {loanPurpose === 'purchase' ? 'Est. Cash to Close' : 'Est. Cash Out'}
                        </div>
                        <div style={{ fontSize: '26px', fontWeight: '700', 
                                      color: 'white', fontFamily: "'JetBrains Mono', monospace" }}>
                          {formatCurrency(Math.abs(calc.cashFlow))}
                        </div>
                      </div>
                      {/* Expand Footer */}
                      <div style={{ 
                        background: 'rgba(123, 44, 191, 0.9)', 
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'white',
                        letterSpacing: '0.5px'
                      }}>
                        <span>VIEW FULL BREAKDOWN</span>
                        <span className="bounce-arrow" style={{ fontSize: '14px' }}>↓</span>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '12px', fontSize: '11px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                      <span>LTV: {(calc.ltv * 100).toFixed(1)}%</span>
                      <span>
                        Loan: {formatCurrency(calc.totalLoanAmount)}
                        {calc.financedUpfrontFee > 0 && (
                          <span style={{ color: '#7B2CBF' }}> (incl. {loanProgram === 'fha' ? 'UFMIP' : 'FF'})</span>
                        )}
                      </span>
                    </div>
                  </div>
                  </div>
                ))}
              </div>
              </>
              )}
              
              {/* Amortization View */}
              {purchaseRefiView === 'amortization' && calculations.length > 0 && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <select value={selectedQuoteForAmort} onChange={(e) => setSelectedQuoteForAmort(parseInt(e.target.value))}
                        style={{ width: 'auto', padding: '8px 16px', fontWeight: '600' }}>
                        {calculations.map((calc, i) => (
                          <option key={i} value={i}>Option {i + 1}: {calc.name} @ {formatPercent(calc.rate)}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className={`btn-secondary ${amortViewMode === 'yearly' ? 'active' : ''}`} 
                        onClick={() => setAmortViewMode('yearly')}>Yearly</button>
                      <button className={`btn-secondary ${amortViewMode === 'monthly' ? 'active' : ''}`} 
                        onClick={() => setAmortViewMode('monthly')}>Monthly</button>
                    </div>
                  </div>
                  
                  {/* Loan Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#888' }}>Loan Amount</div>
                      <div className="mono" style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>{formatCurrency(calculations[selectedQuoteForAmort].totalLoanAmount)}</div>
                    </div>
                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#888' }}>Interest Rate</div>
                      <div className="mono" style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>{formatPercent(calculations[selectedQuoteForAmort].rate)}</div>
                    </div>
                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#888' }}>Monthly P&I</div>
                      <div className="mono" style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>{formatCurrency(calculations[selectedQuoteForAmort].monthlyPI)}</div>
                    </div>
                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#888' }}>Total Interest</div>
                      <div className="mono" style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>{formatCurrency(amortSchedule.reduce((sum, p) => sum + p.interest, 0))}</div>
                    </div>
                  </div>
                  
                  {/* Schedule Table */}
                  <div style={{ maxHeight: '500px', overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f8f8f8' }}>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>
                            {amortViewMode === 'yearly' ? 'Year' : 'Month'}
                          </th>
                          <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Payment</th>
                          <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Principal</th>
                          <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Interest</th>
                          <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(amortViewMode === 'yearly' ? yearlySummary : amortSchedule).map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px 12px', fontWeight: '500' }}>{amortViewMode === 'yearly' ? row.year : row.month}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                              {formatCurrency(amortViewMode === 'yearly' ? row.payments : row.payment)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: '#1a1a1a' }}>
                              {formatCurrency(row.principal)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: '#888' }}>
                              {formatCurrency(row.interest)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600' }}>
                              {formatCurrency(amortViewMode === 'yearly' ? row.endBalance : row.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* RATE INPUT TAB */}
        {/* ================================================================ */}
        {activeTab === 'rates' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Rate & Pricing Input</h2>
                  <p style={{ color: '#666', marginTop: '4px' }}>
                    Enter rates and pricing from your lender rate sheet
                    {rateType === 'arm' && (
                      <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#7B2CBF20', color: '#7B2CBF', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                        {armConfig.product} ARM
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* LO Compensation */}
              <div style={{ 
                background: 'linear-gradient(135deg, #7B2CBF15 0%, #9D4EDD15 100%)', 
                borderRadius: '12px', 
                padding: '20px', 
                marginBottom: '24px',
                border: '1px solid #7B2CBF30'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#7B2CBF', marginBottom: '4px' }}>
                      Loan Officer Compensation
                    </h3>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      Your comp % is deducted from lender credit or added to borrower's points
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      step="0.125"
                      min="0"
                      max="5"
                      value={loCompensation}
                      onChange={(e) => setLoCompensation(parseFloat(e.target.value) || 0)}
                      style={{ 
                        width: '80px', 
                        padding: '10px 12px', 
                        fontSize: '16px', 
                        fontWeight: '600',
                        textAlign: 'center',
                        borderRadius: '8px',
                        border: '2px solid #7B2CBF',
                        background: 'white'
                      }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#7B2CBF' }}>%</span>
                  </div>
                </div>
                {loCompensation > 0 && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: 'white', borderRadius: '8px', fontSize: '12px' }}>
                    <strong>Example:</strong> If price = 102, you take {loCompensation}%, borrower gets {(2 - loCompensation).toFixed(3)}% credit
                    {2 - loCompensation < 0 && <span style={{ color: '#dc2626' }}> (borrower pays {Math.abs(2 - loCompensation).toFixed(3)}% points)</span>}
                  </div>
                )}
              </div>
              
              {/* Rate Options Grid */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 40px', gap: '8px', marginBottom: '8px', padding: '0 12px' }}>
                  <div className="label">Option Name</div>
                  <div className="label">Rate %</div>
                  <div className="label">Price</div>
                  <div></div>
                </div>
                
                {rateOptions.map((option, index) => (
                  <div key={index} className="rate-input-row">
                    <input 
                      value={option.name} 
                      onChange={(e) => handleRateOptionChange(index, 'name', e.target.value)}
                      placeholder="Option name"
                    />
                    <input 
                      type="number" 
                      step="0.125"
                      value={option.rate} 
                      onChange={(e) => handleRateOptionChange(index, 'rate', e.target.value)}
                      placeholder="6.500"
                    />
                    <input 
                      type="number" 
                      step="0.125"
                      value={option.price} 
                      onChange={(e) => handleRateOptionChange(index, 'price', e.target.value)}
                      placeholder="100.00"
                    />
                    {rateOptions.length > 1 && (
                      <button 
                        onClick={() => removeRateOption(index)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', 
                                 padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                
                {rateOptions.length < 3 && (
                  <button className="btn-secondary" onClick={addRateOption} style={{ marginTop: '12px' }}>+ Add Option</button>
                )}
              </div>
              
              <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Pricing Guide</h3>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                  <p><strong>Price = 100.00</strong> → Par (no points, no credit)</p>
                  <p><strong>Price &lt; 100</strong> → Borrower pays points (e.g., 99.00 = 1 point = 1% of loan)</p>
                  <p><strong>Price &gt; 100</strong> → Lender credit (e.g., 101.00 = 1% lender credit)</p>
                </div>
              </div>
              
              {/* Prepaids & Escrow Settings - Deal Specific */}
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Prepaids & Escrow Settings</h3>
                    {prepaidSettings.isModified && (
                      <span style={{ fontSize: '11px', color: '#7B2CBF' }}>● Modified from Admin defaults</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {prepaidSettings.isModified && (
                      <button 
                        onClick={resetPrepaidToDefaults}
                        style={{ 
                          background: '#fff3cd', 
                          border: '1px solid #ffc107', 
                          borderRadius: '6px', 
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#856404',
                          cursor: 'pointer'
                        }}
                      >
                        ↺ Reset to Defaults
                      </button>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={effectivePrepaidSettings.escrowWaived}
                        onChange={(e) => updatePrepaidSetting('escrowWaived', e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#7B2CBF' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: '500', color: effectivePrepaidSettings.escrowWaived ? '#7B2CBF' : '#666' }}>
                        Waive Escrows
                      </span>
                    </label>
                  </div>
                </div>
                
                {/* Prepaids Row */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    F. Prepaids
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div>
                      <label className="label">Insurance (months)</label>
                      <input type="number" min="0" max="14" value={effectivePrepaidSettings.prepaidMonthsInsurance} 
                        onChange={(e) => updatePrepaidSetting('prepaidMonthsInsurance', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="label">Taxes (months)</label>
                      <input type="number" min="0" max="12" value={effectivePrepaidSettings.prepaidMonthsTax} 
                        onChange={(e) => updatePrepaidSetting('prepaidMonthsTax', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="label">Interest (days)</label>
                      <input type="number" min="1" max="30" value={effectivePrepaidSettings.prepaidDaysInterest} 
                        onChange={(e) => updatePrepaidSetting('prepaidDaysInterest', parseInt(e.target.value) || 15)} />
                    </div>
                  </div>
                </div>
                
                {/* Escrow Row */}
                <div style={{ opacity: effectivePrepaidSettings.escrowWaived ? 0.4 : 1, pointerEvents: effectivePrepaidSettings.escrowWaived ? 'none' : 'auto' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    G. Initial Escrow {effectivePrepaidSettings.escrowWaived && <span style={{ color: '#7B2CBF', fontWeight: '600' }}>(WAIVED)</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div>
                      <label className="label">Insurance (months)</label>
                      <input type="number" min="0" max="6" value={effectivePrepaidSettings.escrowMonthsInsurance} 
                        onChange={(e) => updatePrepaidSetting('escrowMonthsInsurance', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="label">Taxes (months)</label>
                      <input type="number" min="0" max="6" value={effectivePrepaidSettings.escrowMonthsTax} 
                        onChange={(e) => updatePrepaidSetting('escrowMonthsTax', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button className="btn-primary" onClick={() => setActiveTab('quote')}>
                  View Updated Quotes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* SECOND MORTGAGE TAB */}
        {/* ================================================================ */}
        {activeTab === 'second' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '28px' }}>
            {/* Left Panel - Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Client Information - Shared with Purchase/Refi */}
              <div className="card animate-in">
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>👤</span> Client Information
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label className="label">Client Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter client name"
                      value={clientInfo.name}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Email</label>
                      <input 
                        type="email" 
                        placeholder="email@example.com"
                        value={clientInfo.email}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input 
                        type="tel" 
                        placeholder="(555) 123-4567"
                        value={clientInfo.phone}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Property Address</label>
                    <input 
                      type="text" 
                      placeholder="123 Main Street"
                      value={clientInfo.address}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">City</label>
                      <input 
                        type="text" 
                        placeholder="City"
                        value={clientInfo.city}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">State</label>
                      <select 
                        value={clientInfo.state}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, state: e.target.value }))}
                      >
                        {Object.entries(stateNames).map(([abbrev, name]) => (
                          <option key={abbrev} value={abbrev}>{abbrev}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">ZIP</label>
                      <input 
                        type="text" 
                        placeholder="12345"
                        value={clientInfo.zip}
                        onChange={(e) => setClientInfo(prev => ({ ...prev, zip: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Product Type Toggle */}
              <div className="card animate-in" style={{ animationDelay: '0.05s' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Product Type</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button onClick={() => setSecondMortgageType('heloan')} 
                    className={`btn-secondary ${secondMortgageType === 'heloan' ? 'active' : ''}`}
                    style={{ padding: '12px', fontSize: '13px' }}>
                    HELOAN
                  </button>
                  <button onClick={() => setSecondMortgageType('heloc')} 
                    className={`btn-secondary ${secondMortgageType === 'heloc' ? 'active' : ''}`}
                    style={{ padding: '12px', fontSize: '13px' }}>
                    HELOC
                  </button>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                  {secondMortgageType === 'heloan' ? 'Home Equity Loan (Fixed Rate)' : 'Home Equity Line of Credit (Variable)'}
                </div>
              </div>
              
              {/* Loan Details */}
              <div className="card animate-in" style={{ animationDelay: '0.1s' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Loan Details</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label">Line/Loan Amount</label>
                    <CurrencyInput 
                      value={secondMortgageDetails.lineAmount} 
                      onChange={(val) => handleSecondMortgageDetailChange('lineAmount', val)} 
                    />
                  </div>
                  <div>
                    <label className="label">Draw Amount</label>
                    <CurrencyInput 
                      value={secondMortgageDetails.drawAmount} 
                      onChange={(val) => handleSecondMortgageDetailChange('drawAmount', val)} 
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <label className="label">Property Value</label>
                    <CurrencyInput 
                      value={secondMortgageDetails.propertyValue} 
                      onChange={(val) => handleSecondMortgageDetailChange('propertyValue', val)} 
                    />
                  </div>
                  <div>
                    <label className="label">1st Mortgage Balance</label>
                    <CurrencyInput 
                      value={secondMortgageDetails.firstMortgageBalance} 
                      onChange={(val) => handleSecondMortgageDetailChange('firstMortgageBalance', val)} 
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: '12px' }}>
                  <label className="label">Credit Score</label>
                  <input 
                    type="number" 
                    min="500" 
                    max="850" 
                    value={secondMortgageDetails.creditScore} 
                    onChange={(e) => handleSecondMortgageDetailChange('creditScore', parseInt(e.target.value) || 740)} 
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <label className="label">Property Type</label>
                    <select value={secondMortgageDetails.propertyType} onChange={(e) => handleSecondMortgageDetailChange('propertyType', e.target.value)}>
                      <option value="single">Single Family</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="multi">Multi-Family</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Property Use</label>
                    <select value={secondMortgageDetails.propertyUse} onChange={(e) => handleSecondMortgageDetailChange('propertyUse', e.target.value)}>
                      <option value="primary">Primary</option>
                      <option value="secondary">Second Home</option>
                      <option value="investment">Investment</option>
                    </select>
                  </div>
                </div>
                
                {/* CLTV Display */}
                <div style={{ marginTop: '16px', padding: '14px', background: '#f5f5f5', borderRadius: '10px', border: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Combined LTV (CLTV)</div>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', fontFamily: "'JetBrains Mono', monospace" }}>
                        {(secondMortgageCLTV * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#888' }}>Available Equity</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }} className="mono">
                        {formatCurrency(secondMortgageDetails.propertyValue - secondMortgageDetails.firstMortgageBalance)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Quote Cards */}
            <div>
              {/* Header - matches Purchase/Refi structure */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700' }}>
                    {secondMortgageType === 'heloan' ? 'HELOAN Options' : 'HELOC Options'}
                  </h2>
                  {/* View Toggle - Quotes / Amortization only */}
                  <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: '8px', padding: '4px' }}>
                    <button 
                      onClick={() => setHomeEquityView('quotes')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '6px',
                        background: homeEquityView === 'quotes' ? '#1a1a1a' : 'transparent',
                        color: homeEquityView === 'quotes' ? 'white' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Quotes
                    </button>
                    <button 
                      onClick={() => setHomeEquityView('amortization')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '6px',
                        background: homeEquityView === 'amortization' ? '#1a1a1a' : 'transparent',
                        color: homeEquityView === 'amortization' ? 'white' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Amortization
                    </button>
                  </div>
                </div>
                {/* Buttons - matches Purchase/Refi */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-secondary" onClick={openSaveModal}>Save Quote</button>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      handleShareQuote({
                        label: quoteLabel || `Home Equity Quote for ${clientInfo.name || 'Client'}`,
                        quoteType: 'home_equity',
                        secondMortgageType,
                        secondMortgageDetails,
                        calculations: secondMortgageCalcs.map((calc, i) => ({
                          ...calc,
                          isRecommended: recommendedSecondMortgage === i
                        }))
                      });
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>📤</span> Share Quote
                  </button>
                  <button className="btn-secondary" onClick={() => setHomeEquityView('editRates')}>Edit Rates</button>
                </div>
              </div>
              
              {/* Quotes View */}
              {homeEquityView === 'quotes' && (
              <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
                {secondMortgageCalcs.map((calc, index) => (
                  <div key={index} style={{ position: 'relative', paddingTop: recommendedSecondMortgage === index ? '36px' : '0' }}>
                    {/* Recommended Banner - extends above card */}
                    {recommendedSecondMortgage === index && (
                      <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #7B2CBF, #3C096C)',
                        color: 'white',
                        padding: '8px 20px',
                        borderRadius: '20px 20px 0 0',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        boxShadow: '0 -4px 15px rgba(123, 44, 191, 0.3)',
                        zIndex: 10
                      }}>
                        ★ Recommended
                      </div>
                    )}
                    
                    <div className="quote-card animate-in" style={{ 
                      animationDelay: `${index * 0.1}s`,
                      border: recommendedSecondMortgage === index ? '2px solid #7B2CBF' : 'none',
                      boxShadow: recommendedSecondMortgage === index 
                        ? '0 15px 50px rgba(123, 44, 191, 0.25), 0 4px 12px rgba(0,0,0,0.1)' 
                        : '0 10px 40px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '4px' }}>
                            Option {index + 1}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: '700' }}>{calc.name}</div>
                        </div>
                        {/* Recommend Checkbox */}
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          cursor: 'pointer',
                          background: recommendedSecondMortgage === index ? 'linear-gradient(135deg, #7B2CBF, #3C096C)' : '#f0f0f0',
                          color: recommendedSecondMortgage === index ? 'white' : '#555',
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontSize: '11px', 
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}>
                          <input 
                            type="checkbox" 
                            checked={recommendedSecondMortgage === index}
                            onChange={() => setRecommendedSecondMortgage(recommendedSecondMortgage === index ? null : index)}
                            style={{ display: 'none' }}
                          />
                          {recommendedSecondMortgage === index ? '★ Best' : 'Mark Best'}
                        </label>
                      </div>
                    
                    {/* Monthly Payment Display */}
                    {secondMortgageType === 'heloc' ? (
                      <div style={{ background: '#f0f0f0', borderRadius: '14px', padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Interest-Only Payment</div>
                        <div className="stat-value" style={{ fontSize: '32px' }}>{formatCurrency(calc.interestOnlyPayment)}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                          After draw period: {formatCurrency(calc.fullyAmortizedPayment)}/mo
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#f0f0f0', borderRadius: '14px', padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Monthly Payment</div>
                        <div className="stat-value" style={{ fontSize: '32px' }}>{formatCurrency(calc.monthlyPayment)}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                          Principal & Interest
                        </div>
                      </div>
                    )}
                    
                    {/* Rate, APR & CLTV Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ textAlign: 'center', padding: '12px 8px', background: '#f5f5f5', borderRadius: '10px' }}>
                        <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Rate</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }} className="mono">{calc.rate.toFixed(3)}%</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px 8px', background: '#f5f5f5', borderRadius: '10px' }}>
                        <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>APR</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#555' }} className="mono">{(calc.apr * 100).toFixed(3)}%</div>
                      </div>
                    </div>
                    
                    <div className="divider" />
                    
                    {/* Loan Details */}
                    <div style={{ fontSize: '13px' }}>
                      {secondMortgageType === 'heloc' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span style={{ color: '#666' }}>Credit Line</span>
                          <span className="mono" style={{ fontWeight: '500' }}>{formatCurrency(calc.lineAmount)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: '#666' }}>{secondMortgageType === 'heloc' ? 'Initial Draw' : 'Loan Amount'}</span>
                        <span className="mono" style={{ fontWeight: '500' }}>{formatCurrency(calc.drawAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: '#666' }}>Closing Costs</span>
                        <span className="mono" style={{ fontWeight: '500' }}>{formatCurrency(calc.fees)}</span>
                      </div>
                      {secondMortgageType === 'heloc' ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#666' }}>Draw Period</span>
                            <span className="mono" style={{ fontWeight: '500' }}>{calc.drawPeriod} years</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: '#666' }}>Repayment Period</span>
                            <span className="mono" style={{ fontWeight: '500' }}>{calc.repayPeriod} years</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span style={{ color: '#666' }}>Term</span>
                          <span className="mono" style={{ fontWeight: '500' }}>{calc.term} years</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: '#666' }}>CLTV</span>
                        <span className="mono" style={{ fontWeight: '500' }}>{(calc.cltv * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    {/* Cash to Borrower - Clickable to open fee modal */}
                    <div 
                      onClick={() => { setHeFeeModalQuoteIndex(index); setHeFeeModalOpen(true); }}
                      style={{ 
                        background: 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)', 
                        borderRadius: '12px', 
                        marginTop: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                      onMouseOver={(e) => { 
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
                      }}
                      onMouseOut={(e) => { 
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                      }}
                    >
                      <div style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                          Cash to Borrower
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: 'white', fontFamily: "'JetBrains Mono', monospace" }}>
                          {formatCurrency(calc.netProceeds)}
                        </div>
                      </div>
                      <div style={{ 
                        background: '#7B2CBF', 
                        padding: '10px', 
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        View Full Breakdown ↓
                      </div>
                    </div>
                  </div>
                  </div>
                ))}
              </div>
              
              {/* Info Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
                <div className="card">
                  <h4 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>
                    {secondMortgageType === 'heloc' ? 'About HELOCs' : 'About HELOANs'}
                  </h4>
                  {secondMortgageType === 'heloc' ? (
                    <ul style={{ fontSize: '13px', color: '#666', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                      <li>Variable rate (typically Prime + margin)</li>
                      <li>Draw funds as needed during draw period</li>
                      <li>Interest-only payments during draw</li>
                      <li>P&I payments during repayment period</li>
                      <li>Great for ongoing or uncertain expenses</li>
                    </ul>
                  ) : (
                    <ul style={{ fontSize: '13px', color: '#666', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                      <li>Fixed rate for life of loan</li>
                      <li>Lump sum disbursement at closing</li>
                      <li>Fixed monthly P&I payments</li>
                      <li>Predictable payment schedule</li>
                      <li>Great for one-time large expenses</li>
                    </ul>
                  )}
                </div>
                <div className="card">
                  <h4 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>Qualification Summary</h4>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                      <span style={{ color: '#666' }}>Credit Score</span>
                      <span style={{ fontWeight: '600' }}>{secondMortgageDetails.creditScore}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                      <span style={{ color: '#666' }}>CLTV</span>
                      <span style={{ fontWeight: '600' }}>{(secondMortgageCLTV * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span style={{ color: '#666' }}>State</span>
                      <span style={{ fontWeight: '600' }}>{clientInfo.state}</span>
                    </div>
                  </div>
                </div>
              </div>
              </>
              )}
              
              {/* Edit Rates View */}
              {homeEquityView === 'editRates' && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Rate & Pricing Input</h2>
                      <p style={{ color: '#666', marginTop: '4px' }}>Enter rates and pricing from your lender rate sheet</p>
                    </div>
                  </div>
                  
                  {/* LO Compensation - matches Purchase/Refi */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #7B2CBF15 0%, #9D4EDD15 100%)', 
                    borderRadius: '12px', 
                    padding: '20px', 
                    marginBottom: '24px',
                    border: '1px solid #7B2CBF30'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#7B2CBF', marginBottom: '4px' }}>
                          Loan Officer Compensation
                        </h3>
                        <p style={{ fontSize: '12px', color: '#666' }}>
                          Your comp % is deducted from lender credit or added to borrower's points
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          step="0.125"
                          min="0"
                          max="5"
                          value={loCompensationHE}
                          onChange={(e) => setLoCompensationHE(parseFloat(e.target.value) || 0)}
                          style={{ 
                            width: '80px', 
                            padding: '10px 12px', 
                            fontSize: '16px', 
                            fontWeight: '600',
                            textAlign: 'center',
                            borderRadius: '8px',
                            border: '2px solid #7B2CBF',
                            background: 'white'
                          }}
                        />
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#7B2CBF' }}>%</span>
                      </div>
                    </div>
                    {loCompensationHE > 0 && (
                      <div style={{ marginTop: '12px', padding: '10px 12px', background: 'white', borderRadius: '8px', fontSize: '12px' }}>
                        <strong>Example:</strong> If price = 102, you take {loCompensationHE}%, borrower gets {(2 - loCompensationHE).toFixed(3)}% credit
                        {2 - loCompensationHE < 0 && <span style={{ color: '#dc2626' }}> (borrower pays {Math.abs(2 - loCompensationHE).toFixed(3)}% points)</span>}
                      </div>
                    )}
                  </div>
                  
                  {/* Rate Options Grid - matches Purchase/Refi */}
                  {secondMortgageType === 'heloan' ? (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 40px', gap: '8px', marginBottom: '8px', padding: '0 12px' }}>
                        <div className="label">Option Name</div>
                        <div className="label">Rate %</div>
                        <div className="label">Price</div>
                        <div className="label">Term (yrs)</div>
                        <div></div>
                      </div>
                      
                      {heloanRateOptions.map((option, index) => (
                        <div key={index} className="rate-input-row">
                          <input 
                            value={option.name} 
                            onChange={(e) => handleHeloanRateChange(index, 'name', e.target.value)}
                            placeholder="Option name"
                          />
                          <input 
                            type="number" 
                            step="0.125"
                            value={option.rate} 
                            onChange={(e) => handleHeloanRateChange(index, 'rate', e.target.value)}
                            placeholder="7.500"
                          />
                          <input 
                            type="number" 
                            step="0.125"
                            value={option.price} 
                            onChange={(e) => handleHeloanRateChange(index, 'price', e.target.value)}
                            placeholder="100.00"
                          />
                          <input 
                            type="number" 
                            value={option.term} 
                            onChange={(e) => handleHeloanRateChange(index, 'term', e.target.value)}
                            placeholder="30"
                          />
                          {heloanRateOptions.length > 1 && (
                            <button 
                              onClick={() => removeHeloanOption(index)}
                              style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', 
                                       padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {heloanRateOptions.length < 3 && (
                        <button 
                          className="btn-secondary" 
                          onClick={addHeloanOption}
                          style={{ marginTop: '12px' }}
                        >
                          + Add Option
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 40px', gap: '8px', marginBottom: '8px', padding: '0 12px' }}>
                        <div className="label">Option Name</div>
                        <div className="label">Rate %</div>
                        <div className="label">Draw (yrs)</div>
                        <div className="label">Repay (yrs)</div>
                        <div></div>
                      </div>
                      
                      {helocRateOptions.map((option, index) => (
                        <div key={index} className="rate-input-row">
                          <input 
                            value={option.name} 
                            onChange={(e) => handleHelocRateChange(index, 'name', e.target.value)}
                            placeholder="Option name"
                          />
                          <input 
                            type="number" 
                            step="0.125"
                            value={option.rate} 
                            onChange={(e) => handleHelocRateChange(index, 'rate', e.target.value)}
                            placeholder="8.500"
                          />
                          <input 
                            type="number" 
                            value={option.drawPeriod} 
                            onChange={(e) => handleHelocRateChange(index, 'drawPeriod', e.target.value)}
                            placeholder="10"
                          />
                          <input 
                            type="number" 
                            value={option.repayPeriod} 
                            onChange={(e) => handleHelocRateChange(index, 'repayPeriod', e.target.value)}
                            placeholder="20"
                          />
                          {helocRateOptions.length > 1 && (
                            <button 
                              onClick={() => removeHelocOption(index)}
                              style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', 
                                       padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {helocRateOptions.length < 3 && (
                        <button 
                          className="btn-secondary" 
                          onClick={addHelocOption}
                          style={{ marginTop: '12px' }}
                        >
                          + Add Option
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Pricing Guide */}
                  <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Pricing Guide</h3>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                      <p><strong>Price = 100.00</strong> → Par (no points, no credit)</p>
                      <p><strong>Price &lt; 100</strong> → Borrower pays points (e.g., 99.00 = 1 point = 1% of loan)</p>
                      <p><strong>Price &gt; 100</strong> → Lender credit (e.g., 101.00 = 1% lender credit)</p>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <button className="btn-primary" onClick={() => setHomeEquityView('quotes')}>
                      View Updated Quotes
                    </button>
                  </div>
                </div>
              )}
              
              {/* Amortization View */}
              {homeEquityView === 'amortization' && secondMortgageCalcs.length > 0 && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <select value={selectedHomeEquityForAmort} onChange={(e) => setSelectedHomeEquityForAmort(parseInt(e.target.value))}
                        style={{ width: 'auto', padding: '8px 16px', fontWeight: '600' }}>
                        {secondMortgageCalcs.map((calc, i) => (
                          <option key={i} value={i}>Option {i + 1}: {calc.name} @ {calc.rate.toFixed(3)}%</option>
                        ))}
                      </select>
                    </div>
                    {secondMortgageType === 'heloan' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className={`btn-secondary ${heAmortViewMode === 'yearly' ? 'active' : ''}`} 
                          onClick={() => setHeAmortViewMode('yearly')}>Yearly</button>
                        <button className={`btn-secondary ${heAmortViewMode === 'monthly' ? 'active' : ''}`} 
                          onClick={() => setHeAmortViewMode('monthly')}>Monthly</button>
                      </div>
                    )}
                  </div>
                  
                  {/* Loan Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#888' }}>{secondMortgageType === 'heloc' ? 'Draw Amount' : 'Loan Amount'}</div>
                      <div className="mono" style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>{formatCurrency(secondMortgageCalcs[selectedHomeEquityForAmort].drawAmount)}</div>
                    </div>
                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#888' }}>Interest Rate</div>
                      <div className="mono" style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>{secondMortgageCalcs[selectedHomeEquityForAmort].rate.toFixed(3)}%</div>
                    </div>
                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#888' }}>{secondMortgageType === 'heloc' ? 'I/O Payment' : 'Monthly P&I'}</div>
                      <div className="mono" style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                        {formatCurrency(secondMortgageType === 'heloc' ? secondMortgageCalcs[selectedHomeEquityForAmort].interestOnlyPayment : secondMortgageCalcs[selectedHomeEquityForAmort].monthlyPayment)}
                      </div>
                    </div>
                    <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#888' }}>Total Interest</div>
                      <div className="mono" style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>{formatCurrency(secondMortgageCalcs[selectedHomeEquityForAmort].totalInterest)}</div>
                    </div>
                  </div>
                  
                  {secondMortgageType === 'heloan' ? (
                    /* HELOAN - Full Amortization Table like Purchase/Refi */
                    <div style={{ maxHeight: '500px', overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '10px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#f8f8f8' }}>
                          <tr>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>
                              {heAmortViewMode === 'yearly' ? 'Year' : 'Month'}
                            </th>
                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Payment</th>
                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Principal</th>
                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Interest</th>
                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(heAmortViewMode === 'yearly' ? heYearlySummary : heAmortSchedule).map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '500' }}>{heAmortViewMode === 'yearly' ? row.year : row.month}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                                {formatCurrency(heAmortViewMode === 'yearly' ? row.payments : row.payment)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: '#1a1a1a' }}>
                                {formatCurrency(row.principal)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: '#888' }}>
                                {formatCurrency(row.interest)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600' }}>
                                {formatCurrency(heAmortViewMode === 'yearly' ? row.endBalance : row.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* HELOC - Payment Summary (Draw Period + Repayment Period) */
                    <div style={{ padding: '20px', background: '#f8f8f8', borderRadius: '12px' }}>
                      <h4 style={{ fontWeight: '600', marginBottom: '16px' }}>Payment Schedule Summary</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Draw Period ({secondMortgageCalcs[selectedHomeEquityForAmort].drawPeriod} years)</div>
                          <div style={{ fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                              <span>Payment Type:</span>
                              <span style={{ fontWeight: '600' }}>Interest Only</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                              <span>Monthly Payment:</span>
                              <span className="mono" style={{ fontWeight: '600' }}>{formatCurrency(secondMortgageCalcs[selectedHomeEquityForAmort].interestOnlyPayment)}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Repayment Period ({secondMortgageCalcs[selectedHomeEquityForAmort].repayPeriod} years)</div>
                          <div style={{ fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                              <span>Payment Type:</span>
                              <span style={{ fontWeight: '600' }}>Principal & Interest</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                              <span>Monthly Payment:</span>
                              <span className="mono" style={{ fontWeight: '600' }}>{formatCurrency(secondMortgageCalcs[selectedHomeEquityForAmort].fullyAmortizedPayment)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* INCOME CALCULATOR TAB */}
        {/* ================================================================ */}
        {activeTab === 'income' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <div className="card" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>Income Calculator</h2>
                
                <div className="income-section">
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>W-2 / Employment Income</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Base Annual Salary</label>
                      <input type="number" placeholder="75000" value={incomeInputs.w2.base}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, w2: { ...prev.w2, base: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Annual Overtime</label>
                      <input type="number" placeholder="5000" value={incomeInputs.w2.overtime}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, w2: { ...prev.w2, overtime: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Annual Bonus (2yr avg)</label>
                      <input type="number" placeholder="10000" value={incomeInputs.w2.bonus}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, w2: { ...prev.w2, bonus: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Annual Commission (2yr avg)</label>
                      <input type="number" placeholder="0" value={incomeInputs.w2.commission}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, w2: { ...prev.w2, commission: e.target.value } }))} />
                    </div>
                  </div>
                  <div style={{ background: '#f5f5f5', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                    <span>W-2 Monthly Income</span>
                    <span className="mono" style={{ fontWeight: '700', color: '#1a1a1a' }}>{formatCurrency(incomeCalculations.w2.total)}</span>
                  </div>
                </div>

                <div className="income-section">
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Schedule C (Sole Proprietor)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Gross Receipts (2yr avg)</label>
                      <input type="number" placeholder="150000" value={incomeInputs.scheduleC.grossReceipts}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, scheduleC: { ...prev.scheduleC, grossReceipts: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Total Expenses</label>
                      <input type="number" placeholder="50000" value={incomeInputs.scheduleC.expenses}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, scheduleC: { ...prev.scheduleC, expenses: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Depreciation (add back)</label>
                      <input type="number" placeholder="5000" value={incomeInputs.scheduleC.depreciation}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, scheduleC: { ...prev.scheduleC, depreciation: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Business Miles</label>
                      <input type="number" placeholder="10000" value={incomeInputs.scheduleC.miles}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, scheduleC: { ...prev.scheduleC, miles: e.target.value } }))} />
                    </div>
                  </div>
                  <div style={{ background: '#f5f5f5', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                    <span>Schedule C Monthly</span>
                    <span className="mono" style={{ fontWeight: '700', color: '#1a1a1a' }}>{formatCurrency(incomeCalculations.scheduleC.monthly)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="card">
                <div className="income-section">
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>S-Corporation</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">W-2 Wages from S-Corp</label>
                      <input type="number" placeholder="60000" value={incomeInputs.sCorp.w2Wages}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, sCorp: { ...prev.sCorp, w2Wages: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Ordinary Income (K-1)</label>
                      <input type="number" placeholder="40000" value={incomeInputs.sCorp.ordinaryIncome}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, sCorp: { ...prev.sCorp, ordinaryIncome: e.target.value } }))} />
                    </div>
                  </div>
                  <div style={{ background: '#f5f5f5', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                    <span>S-Corp Monthly</span>
                    <span className="mono" style={{ fontWeight: '700', color: '#1a1a1a' }}>{formatCurrency(incomeCalculations.sCorp.monthly)}</span>
                  </div>
                </div>

                <div className="income-section">
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Rental Income (Schedule E)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Gross Annual Rents</label>
                      <input type="number" placeholder="24000" value={incomeInputs.rental.grossRents}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, rental: { ...prev.rental, grossRents: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Total Expenses</label>
                      <input type="number" placeholder="8000" value={incomeInputs.rental.expenses}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, rental: { ...prev.rental, expenses: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Depreciation (add back)</label>
                      <input type="number" placeholder="3000" value={incomeInputs.rental.depreciation}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, rental: { ...prev.rental, depreciation: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Mortgage Interest</label>
                      <input type="number" placeholder="6000" value={incomeInputs.rental.mortgageInterest}
                        onChange={(e) => setIncomeInputs(prev => ({ ...prev, rental: { ...prev.rental, mortgageInterest: e.target.value } }))} />
                    </div>
                  </div>
                  <div style={{ background: '#f5f5f5', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                    <span>Rental Monthly</span>
                    <span className="mono" style={{ fontWeight: '700', color: '#1a1a1a' }}>{formatCurrency(incomeCalculations.rental.monthly)}</span>
                  </div>
                </div>

                <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '8px' }}>Total Qualifying Monthly Income</div>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: 'white' }} className="mono">
                    {formatCurrency(incomeCalculations.grandTotal)}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '8px' }}>
                    Annual: {formatCurrency(incomeCalculations.grandTotal * 12)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* SAVED QUOTES TAB */}
        {/* ================================================================ */}
        {activeTab === 'saved' && (
          <div className="card">
            {console.log('Rendering Saved tab, dbQuotes:', dbQuotes?.length, dbQuotes)}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Saved Quotes</h2>
                <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                  {dbQuotes.length} quote{dbQuotes.length !== 1 ? 's' : ''} saved
                </p>
              </div>
              {dbQuotes.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text"
                    value={savedQuotesSearch}
                    onChange={(e) => setSavedQuotesSearch(e.target.value)}
                    placeholder="Search by name, email, phone..."
                    style={{ 
                      width: '300px', 
                      paddingLeft: '36px',
                      background: '#f5f5f5',
                      border: '1px solid #e0e0e0'
                    }}
                  />
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔍</span>
                </div>
              )}
            </div>
            
            {loadingQuotes ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
                <p>Loading quotes...</p>
              </div>
            ) : dbQuotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📋</div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No Saved Quotes</h3>
                <p>Save a quote from the Quotes tab to see it here.</p>
              </div>
            ) : (
              <>
                {/* Filter quotes based on search */}
                {(() => {
                  const filteredQuotes = dbQuotes.filter(quote => {
                    if (!savedQuotesSearch) return true;
                    const search = savedQuotesSearch.toLowerCase();
                    const clientName = (quote.client_name || '').toLowerCase();
                    const email = (quote.client_email || '').toLowerCase();
                    const phone = (quote.client_phone || '').toLowerCase();
                    const label = (quote.label || '').toLowerCase();
                    return clientName.includes(search) || email.includes(search) || phone.includes(search) || label.includes(search);
                  });
                  
                  if (filteredQuotes.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        <p>No quotes match "{savedQuotesSearch}"</p>
                        <button 
                          onClick={() => setSavedQuotesSearch('')}
                          className="btn-secondary"
                          style={{ marginTop: '12px' }}
                        >
                          Clear Search
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                      {filteredQuotes.map(quote => (
                        <div key={quote.id} className="quote-card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => loadSavedQuote(quote)}>
                          {/* Type Badge */}
                          <div style={{ 
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            fontSize: '10px', 
                            fontWeight: '600', 
                            color: 'white', 
                            background: quote.quoteType === 'homeEquity' ? '#059669' : '#7B2CBF',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {quote.quote_data?.quoteType === 'homeEquity' 
                              ? (quote.quote_data?.productType === 'heloc' ? 'HELOC' : 'HELOAN')
                              : (quote.quote_data?.loanPurpose === 'purchase' ? 'Purchase' : 'Refi')}
                          </div>
                          
                          {/* Label Badge */}
                          {quote.label && (
                            <div style={{ 
                              fontSize: '11px', 
                              fontWeight: '600', 
                              color: '#7B2CBF', 
                              background: 'rgba(123, 44, 191, 0.1)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              marginBottom: '10px',
                              display: 'inline-block',
                              maxWidth: 'calc(100% - 80px)'
                            }}>
                              {quote.label}
                            </div>
                          )}
                          
                          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                            {new Date(quote.created_at).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '2px' }}>
                            {quote.client_name || 'No Client Name'}
                          </div>
                          {quote.client_email && (
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              {quote.client_email}
                            </div>
                          )}
                          
                          {/* Different display based on quote type */}
                          {quote.quote_type === 'home_equity' ? (
                            <>
                              <div style={{ fontSize: '13px', color: '#555' }}>
                                {formatCurrency(quote.quote_data?.secondMortgageDetails?.drawAmount || 0)}
                              </div>
                              <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                                Property: {formatCurrency(quote.quote_data?.secondMortgageDetails?.propertyValue || 0)}
                              </div>
                              <div style={{ marginTop: '12px', fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }} className="mono">
                                {formatCurrency(quote.quote_data?.calculations?.[0]?.monthlyPayment || quote.quote_data?.calculations?.[0]?.interestOnlyPayment || 0)}/mo
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: '13px', color: '#555' }}>
                                {(quote.quote_data?.loanProgram || 'conv').toUpperCase()} • {quote.quote_data?.term || 30}yr
                              </div>
                              <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                                Loan: {formatCurrency(quote.quote_data?.baseLoanAmount || 0)}
                              </div>
                              <div style={{ marginTop: '12px', fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }} className="mono">
                                {formatCurrency(quote.quote_data?.calculations?.[0]?.totalMonthlyPayment || 0)}/mo
                              </div>
                            </>
                          )}
                          
                          {/* Actions */}
                          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); loadSavedQuote(quote); }}
                              style={{ 
                                flex: 1, 
                                background: '#1a1a1a', 
                                border: 'none', 
                                color: 'white', 
                                padding: '8px 12px', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                              Load Quote
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteQuote(quote.id); }}
                              style={{ 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: 'none', 
                                color: '#ef4444', 
                                padding: '8px 12px', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontSize: '12px'
                              }}>
                              🗑
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* NOTIFICATIONS TAB - Activity History */}
        {/* ================================================================ */}
        {activeTab === 'notifications' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>🔔 Client Activity</h2>
                <p style={{ color: '#666', fontSize: '13px' }}>
                  Track when clients view your quotes and click Apply
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'unread', 'applied', 'reviewed'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setNotificationFilter(filter)}
                    className={`btn-secondary ${notificationFilter === filter ? 'active' : ''}`}
                    style={{ padding: '8px 16px', fontSize: '12px', textTransform: 'capitalize' }}
                  >
                    {filter === 'applied' ? '🎯 Applied' : filter}
                  </button>
                ))}
              </div>
            </div>
            
            {loadingAllNotifications ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                Loading activity...
              </div>
            ) : allNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No activity yet</div>
                <div style={{ fontSize: '13px' }}>
                  When clients view your shared quotes, you'll see their activity here
                </div>
              </div>
            ) : (
              <div style={{ border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Table Header */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1.5fr 120px 100px 100px 140px',
                  background: '#f8f8f8',
                  padding: '12px 16px',
                  fontWeight: '600',
                  fontSize: '12px',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  <div>Client</div>
                  <div>Quote</div>
                  <div>Action</div>
                  <div>Date</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                
                {/* Table Body */}
                {allNotifications
                  .filter(notif => {
                    if (notificationFilter === 'all') return true;
                    if (notificationFilter === 'unread') return !notif.is_read;
                    if (notificationFilter === 'applied') return notif.notification_type === 'apply_click';
                    if (notificationFilter === 'reviewed') return notif.reviewed;
                    return true;
                  })
                  .map(notif => {
                    const isApplied = notif.notification_type === 'apply_click';
                    const isNew = !notif.is_read;
                    
                    return (
                      <div 
                        key={notif.id}
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1.5fr 120px 100px 100px 140px',
                          padding: '14px 16px',
                          borderBottom: '1px solid #f0f0f0',
                          alignItems: 'center',
                          background: isNew ? '#faf5ff' : isApplied ? '#f0fdf4' : 'white',
                          transition: 'background 0.2s'
                        }}
                      >
                        {/* Client Name */}
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>
                            {notif.quotes?.client_name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#888' }}>
                            {notif.notification_type === 'apply_click' ? 'Applied!' : 'Viewed quote'}
                          </div>
                        </div>
                        
                        {/* Quote Label */}
                        <div>
                          <div style={{ fontSize: '13px', color: '#333' }}>
                            {notif.quotes?.label || 'Quote'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#888' }}>
                            {notif.quotes?.quote_type === 'home_equity' ? 'Home Equity' : 'Purchase/Refi'}
                          </div>
                        </div>
                        
                        {/* Action Type */}
                        <div>
                          {isApplied ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                              color: 'white',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              🎯 Applied!
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              background: '#e0e7ff',
                              color: '#4338ca',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              👁 Viewed
                            </span>
                          )}
                        </div>
                        
                        {/* Date */}
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {new Date(notif.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                        
                        {/* Status */}
                        <div>
                          {notif.reviewed ? (
                            <span style={{
                              padding: '4px 8px',
                              background: '#f0f0f0',
                              color: '#666',
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}>
                              ✓ Reviewed
                            </span>
                          ) : isNew ? (
                            <span style={{
                              padding: '4px 8px',
                              background: '#7B2CBF',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              NEW
                            </span>
                          ) : (
                            <span style={{
                              padding: '4px 8px',
                              background: '#fef3c7',
                              color: '#92400e',
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}>
                              Pending
                            </span>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              const quote = dbQuotes.find(q => q.id === notif.quotes?.id);
                              if (quote) {
                                loadSavedQuote(quote);
                              } else {
                                alert('Quote not found in saved quotes');
                              }
                            }}
                            style={{
                              padding: '6px 10px',
                              fontSize: '11px',
                              background: '#7B2CBF',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleMarkNotificationReviewed(notif.id, !notif.reviewed)}
                            style={{
                              padding: '6px 10px',
                              fontSize: '11px',
                              background: notif.reviewed ? '#f0f0f0' : '#e0e7ff',
                              color: notif.reviewed ? '#666' : '#4338ca',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {notif.reviewed ? 'Unmark' : '✓ Mark'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                
                {/* Empty State for Filtered Results */}
                {allNotifications.filter(notif => {
                  if (notificationFilter === 'all') return true;
                  if (notificationFilter === 'unread') return !notif.is_read;
                  if (notificationFilter === 'applied') return notif.notification_type === 'apply_click';
                  if (notificationFilter === 'reviewed') return notif.reviewed;
                  return true;
                }).length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                    No {notificationFilter} notifications
                  </div>
                )}
              </div>
            )}
            
            {/* Summary Stats */}
            {allNotifications.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '16px', 
                marginTop: '24px' 
              }}>
                <div style={{ background: '#f8f8f8', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#7B2CBF' }}>
                    {allNotifications.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Total Views</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                    {allNotifications.filter(n => n.notification_type === 'apply_click').length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Applied</div>
                </div>
                <div style={{ background: '#faf5ff', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#7B2CBF' }}>
                    {allNotifications.filter(n => !n.is_read).length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>New</div>
                </div>
                <div style={{ background: '#f8f8f8', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#666' }}>
                    {allNotifications.filter(n => n.reviewed).length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Reviewed</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* ADMIN TAB - Fee Templates */}
        {/* ================================================================ */}
        {activeTab === 'admin' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Left Column - Profile + Default Fees */}
            <div>
              {/* LO Profile Section */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
                  👤 Loan Officer Profile
                </h2>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                  Your profile information appears on consumer quote pages.
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label className="label">Full Name</label>
                    <input 
                      type="text"
                      value={getProfileValue('full_name')}
                      onChange={(e) => handleProfileUpdate('full_name', e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="label">Title</label>
                    <input 
                      type="text"
                      value={getProfileValue('title')}
                      onChange={(e) => handleProfileUpdate('title', e.target.value)}
                      placeholder="e.g., Senior Loan Officer"
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label className="label">Email</label>
                    <input 
                      type="email"
                      value={getProfileValue('email')}
                      onChange={(e) => handleProfileUpdate('email', e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input 
                      type="tel"
                      value={getProfileValue('phone')}
                      onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label className="label">NMLS Number</label>
                    <input 
                      type="text"
                      value={getProfileValue('nmls_number')}
                      onChange={(e) => handleProfileUpdate('nmls_number', e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                  <div>
                    <label className="label">Photo URL (optional)</label>
                    <input 
                      type="url"
                      value={getProfileValue('photo_url')}
                      onChange={(e) => handleProfileUpdate('photo_url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Application URL
                    <span style={{ 
                      background: '#666', 
                      color: 'white', 
                      fontSize: '10px', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontWeight: '600'
                    }}>
                      MANAGED BY ADMIN
                    </span>
                  </label>
                  <input 
                    type="url"
                    value={loanOfficer?.application_url || ''}
                    readOnly
                    disabled
                    placeholder="Not set - contact admin"
                    style={{ 
                      background: '#f5f5f5', 
                      color: '#666',
                      cursor: 'not-allowed',
                      borderColor: loanOfficer?.application_url ? '#22c55e' : '#e0e0e0'
                    }}
                  />
                  <p style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
                    {loanOfficer?.application_url 
                      ? '✅ Your application link is configured and active.'
                      : '⚠️ Application link not configured yet. Contact your administrator.'}
                  </p>
                </div>
                
                <button 
                  onClick={saveProfile}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={savingProfile || Object.keys(profileEdits).length === 0}
                >
                  {savingProfile ? '⏳ Saving...' : '💾 Save Profile'}
                </button>
                {Object.keys(profileEdits).length > 0 && (
                  <p style={{ fontSize: '11px', color: '#7B2CBF', marginTop: '8px', textAlign: 'center' }}>
                    You have unsaved changes
                  </p>
                )}
              </div>
              
              <div className="card" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Fee Templates</h2>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                  These defaults populate each new quote. Individual quotes can override any value.
                </p>
                
                {/* Purchase/Refi Section Header */}
                <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #7B2CBF' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#7B2CBF' }}>
                    🏦 Purchase / Refinance Defaults
                  </h2>
                </div>
                
                {/* Section A - Origination */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    A. Origination Charges
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Admin Fee</label>
                      <CurrencyInput value={feeTemplates.adminFee} onChange={(val) => setFeeTemplates(prev => ({ ...prev, adminFee: val }))} />
                    </div>
                    <div>
                      <label className="label">Underwriting Fee</label>
                      <CurrencyInput value={feeTemplates.underwritingFee} onChange={(val) => setFeeTemplates(prev => ({ ...prev, underwritingFee: val }))} />
                    </div>
                  </div>
                </div>
                
                {/* Section B - Services You Cannot Shop For */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    B. Services You Cannot Shop For
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Appraisal</label>
                      <CurrencyInput value={feeTemplates.appraisal} onChange={(val) => setFeeTemplates(prev => ({ ...prev, appraisal: val }))} />
                    </div>
                    <div>
                      <label className="label">Credit Report</label>
                      <CurrencyInput value={feeTemplates.creditReport} onChange={(val) => setFeeTemplates(prev => ({ ...prev, creditReport: val }))} />
                    </div>
                    <div>
                      <label className="label">Processing</label>
                      <CurrencyInput value={feeTemplates.processing} onChange={(val) => setFeeTemplates(prev => ({ ...prev, processing: val }))} />
                    </div>
                    <div>
                      <label className="label">Flood Cert</label>
                      <CurrencyInput value={feeTemplates.floodCert} onChange={(val) => setFeeTemplates(prev => ({ ...prev, floodCert: val }))} />
                    </div>
                    <div>
                      <label className="label">Tax Service</label>
                      <CurrencyInput value={feeTemplates.taxService} onChange={(val) => setFeeTemplates(prev => ({ ...prev, taxService: val }))} />
                    </div>
                  </div>
                </div>
                
                {/* Section C - Title & Settlement */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    C. Title & Settlement (Defaults)
                  </h3>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                    Lender's Title uses state lookup table. These are additional flat fees.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Notary Fee</label>
                      <CurrencyInput value={feeTemplates.notaryFee} onChange={(val) => setFeeTemplates(prev => ({ ...prev, notaryFee: val }))} />
                    </div>
                    <div>
                      <label className="label">Settlement Fee</label>
                      <CurrencyInput value={feeTemplates.settlementFee} onChange={(val) => setFeeTemplates(prev => ({ ...prev, settlementFee: val }))} />
                    </div>
                    <div>
                      <label className="label">Recording Service</label>
                      <CurrencyInput value={feeTemplates.recordingServiceFee} onChange={(val) => setFeeTemplates(prev => ({ ...prev, recordingServiceFee: val }))} />
                    </div>
                  </div>
                </div>
                
                {/* Section E - Government */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    E. Government Fees (Defaults)
                  </h3>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                    Transfer Tax uses state lookup table. Recording fee default:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Recording Fee (default)</label>
                      <CurrencyInput value={feeTemplates.recordingFee} onChange={(val) => setFeeTemplates(prev => ({ ...prev, recordingFee: val }))} />
                    </div>
                  </div>
                </div>
                
                {/* Section F - Prepaids (Defaults) */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#444', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    F. Prepaids (Defaults)
                  </h3>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                    Default values for new quotes. Can override per-deal in Edit Rates.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Insurance (months)</label>
                      <input type="number" min="0" max="14" value={feeTemplates.prepaidMonthsInsurance} 
                        onChange={(e) => setFeeTemplates(prev => ({ ...prev, prepaidMonthsInsurance: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label className="label">Taxes (months)</label>
                      <input type="number" min="0" max="12" value={feeTemplates.prepaidMonthsTax} 
                        onChange={(e) => setFeeTemplates(prev => ({ ...prev, prepaidMonthsTax: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label className="label">Interest (days)</label>
                      <input type="number" min="1" max="30" value={feeTemplates.prepaidDaysInterest} 
                        onChange={(e) => setFeeTemplates(prev => ({ ...prev, prepaidDaysInterest: parseInt(e.target.value) || 15 }))} />
                    </div>
                  </div>
                </div>
                
                {/* Section G - Initial Escrow (Defaults) */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#444' }}>
                      G. Initial Escrow (Defaults)
                    </h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={feeTemplates.escrowWaived}
                        onChange={(e) => setFeeTemplates(prev => ({ ...prev, escrowWaived: e.target.checked }))}
                        style={{ width: '16px', height: '16px', accentColor: '#7B2CBF' }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: '500', color: feeTemplates.escrowWaived ? '#7B2CBF' : '#666' }}>
                        Waive Escrows by Default
                      </span>
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', opacity: feeTemplates.escrowWaived ? 0.4 : 1 }}>
                    <div>
                      <label className="label">Insurance (months)</label>
                      <input type="number" min="0" max="6" value={feeTemplates.escrowMonthsInsurance} 
                        onChange={(e) => setFeeTemplates(prev => ({ ...prev, escrowMonthsInsurance: parseInt(e.target.value) || 0 }))}
                        disabled={feeTemplates.escrowWaived} />
                    </div>
                    <div>
                      <label className="label">Taxes (months)</label>
                      <input type="number" min="0" max="6" value={feeTemplates.escrowMonthsTax} 
                        onChange={(e) => setFeeTemplates(prev => ({ ...prev, escrowMonthsTax: parseInt(e.target.value) || 0 }))}
                        disabled={feeTemplates.escrowWaived} />
                    </div>
                  </div>
                  {feeTemplates.escrowWaived && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(123, 44, 191, 0.1)', borderRadius: '6px', fontSize: '12px', color: '#7B2CBF' }}>
                      All new quotes will default to waived escrows
                    </div>
                  )}
                </div>
                
                {/* Home Equity Section */}
                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #e0e0e0' }}>
                  <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #7B2CBF' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#7B2CBF' }}>
                      🏠 Home Equity (HELOAN/HELOC) Defaults
                    </h2>
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
                    Default fees for Home Equity products. LO Compensation is set per-quote in Edit Rates.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label className="label">Underwriting Fee</label>
                      <input type="number" value={feeTemplates.heUnderwritingFee} 
                        onChange={(e) => setFeeTemplates(prev => ({ ...prev, heUnderwritingFee: parseFloat(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label className="label">Title / Settlement Fee</label>
                      <input type="number" value={feeTemplates.heTitleFee} 
                        onChange={(e) => setFeeTemplates(prev => ({ ...prev, heTitleFee: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label className="label">Credit Report</label>
                      <input type="number" value={feeTemplates.heCreditReport} 
                        onChange={(e) => setFeeTemplates(prev => ({ ...prev, heCreditReport: parseFloat(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label className="label">Flood Cert</label>
                      <input type="number" value={feeTemplates.heFloodCert} 
                        onChange={(e) => setFeeTemplates(prev => ({ ...prev, heFloodCert: parseFloat(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label className="label">Recording Fee</label>
                      <input type="number" value={feeTemplates.heRecordingFee} 
                        onChange={(e) => setFeeTemplates(prev => ({ ...prev, heRecordingFee: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  </div>
                  
                  {/* Appraisal with waive option */}
                  <div style={{ padding: '12px', background: '#f8f8f8', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label className="label" style={{ marginBottom: 0 }}>Appraisal Fee</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={feeTemplates.heAppraisalWaived}
                          onChange={(e) => setFeeTemplates(prev => ({ ...prev, heAppraisalWaived: e.target.checked }))}
                          style={{ width: '16px', height: '16px', accentColor: '#7B2CBF' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: '500', color: feeTemplates.heAppraisalWaived ? '#7B2CBF' : '#666' }}>
                          Waive by Default
                        </span>
                      </label>
                    </div>
                    <input 
                      type="number" 
                      value={feeTemplates.heAppraisalFee} 
                      onChange={(e) => setFeeTemplates(prev => ({ ...prev, heAppraisalFee: parseFloat(e.target.value) || 0 }))}
                      disabled={feeTemplates.heAppraisalWaived}
                      style={{ opacity: feeTemplates.heAppraisalWaived ? 0.4 : 1 }}
                    />
                    {feeTemplates.heAppraisalWaived && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#7B2CBF' }}>
                        ✓ Appraisal will default to $0 (waived) for all Home Equity quotes
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Admin Tools + State Lookup Tables */}
            <div>
              {/* Admin Tools - LO Management (Only visible to admin) */}
              {loanOfficer?.email === 'ramon@clientdirectmtg.com' && (
              <div className="card" style={{ marginBottom: '20px', border: '2px solid #7B2CBF' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  🔧 Admin Tools
                  <span style={{ 
                    background: '#7B2CBF', 
                    color: 'white', 
                    fontSize: '10px', 
                    padding: '3px 8px', 
                    borderRadius: '4px',
                    fontWeight: '600'
                  }}>
                    ADMIN ONLY
                  </span>
                </h2>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                  Bulk manage loan officer settings.
                </p>
                
                {/* CSV Upload Section */}
                <div style={{ 
                  border: '2px dashed #7B2CBF', 
                  borderRadius: '12px', 
                  padding: '24px', 
                  textAlign: 'center',
                  background: csvUploadData.length > 0 ? '#7B2CBF08' : '#f9f9f9',
                  marginBottom: '16px'
                }}>
                  <input 
                    type="file" 
                    accept=".csv"
                    id="csv-upload"
                    style={{ display: 'none' }}
                    onChange={handleCsvUpload}
                  />
                  <label 
                    htmlFor="csv-upload" 
                    style={{ cursor: 'pointer', display: 'block' }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📤</div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {csvUploadData.length > 0 
                        ? `${csvUploadData.length} records loaded`
                        : 'Upload LO Application URLs'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      CSV format: email, application_url
                    </div>
                  </label>
                </div>
                
                {/* CSV Preview */}
                {csvUploadData.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      maxHeight: '200px', 
                      overflow: 'auto', 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f5f5f5', position: 'sticky', top: 0 }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Email</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Application URL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvUploadData.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '8px 12px' }}>{row.email}</td>
                              <td style={{ padding: '8px 12px', color: '#7B2CBF', wordBreak: 'break-all' }}>
                                {row.application_url?.substring(0, 40)}{row.application_url?.length > 40 ? '...' : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <button 
                        onClick={applyCsvUpdates}
                        className="btn-primary"
                        style={{ flex: 1 }}
                        disabled={csvUploading}
                      >
                        {csvUploading ? '⏳ Updating...' : `✅ Apply ${csvUploadData.length} Updates`}
                      </button>
                      <button 
                        onClick={() => setCsvUploadData([])}
                        className="btn-secondary"
                      >
                        ✕ Clear
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Upload Results */}
                {csvUploadResults && (
                  <div style={{ 
                    padding: '12px', 
                    borderRadius: '8px', 
                    background: csvUploadResults.errors > 0 ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${csvUploadResults.errors > 0 ? '#fecaca' : '#bbf7d0'}`,
                    fontSize: '13px'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {csvUploadResults.errors > 0 ? '⚠️ Completed with errors' : '✅ Update complete!'}
                    </div>
                    <div>✓ {csvUploadResults.success} updated successfully</div>
                    {csvUploadResults.errors > 0 && (
                      <div style={{ color: '#dc2626' }}>✕ {csvUploadResults.errors} failed</div>
                    )}
                    {csvUploadResults.notFound > 0 && (
                      <div style={{ color: '#f59e0b' }}>? {csvUploadResults.notFound} emails not found</div>
                    )}
                  </div>
                )}
                
                {/* Sample CSV Download */}
                <button 
                  onClick={downloadSampleCsv}
                  style={{ 
                    width: '100%', 
                    marginTop: '16px',
                    padding: '10px',
                    background: 'transparent',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#666'
                  }}
                >
                  📥 Download Sample CSV Template
                </button>
              </div>
              )}
              
              <div className="card">
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>State Lookup Tables</h2>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                  These tables automatically populate fees based on the selected state. Click to view/edit.
                </p>
                
                {/* Table Buttons */}
                <div style={{ display: 'grid', gap: '12px' }}>
                  <button 
                    onClick={() => { setTableModalType('propertyTax'); setTableModalOpen(true); }}
                    className="btn-secondary" style={{ justifyContent: 'space-between', display: 'flex', padding: '16px' }}>
                    <span>🏠 Property Tax Rates</span>
                    <span style={{ color: '#888' }}>50 states + DC →</span>
                  </button>
                  <button 
                    onClick={() => { setTableModalType('titleInsurance'); setTableModalOpen(true); }}
                    className="btn-secondary" style={{ justifyContent: 'space-between', display: 'flex', padding: '16px' }}>
                    <span>📜 Title Insurance Rates</span>
                    <span style={{ color: '#888' }}>50 states + DC →</span>
                  </button>
                  <button 
                    onClick={() => { setTableModalType('transferTax'); setTableModalOpen(true); }}
                    className="btn-secondary" style={{ justifyContent: 'space-between', display: 'flex', padding: '16px' }}>
                    <span>💰 Transfer Tax Rates</span>
                    <span style={{ color: '#888' }}>50 states + DC →</span>
                  </button>
                  <button 
                    onClick={() => { setTableModalType('pmi'); setTableModalOpen(true); }}
                    className="btn-secondary" style={{ justifyContent: 'space-between', display: 'flex', padding: '16px' }}>
                    <span>🛡️ PMI Rates by Credit Score</span>
                    <span style={{ color: '#888' }}>620-800 →</span>
                  </button>
                  <button 
                    onClick={() => { setTableModalType('recording'); setTableModalOpen(true); }}
                    className="btn-secondary" style={{ justifyContent: 'space-between', display: 'flex', padding: '16px' }}>
                    <span>📝 Recording Fees</span>
                    <span style={{ color: '#888' }}>50 states + DC →</span>
                  </button>
                </div>
                
                {/* Current State Preview */}
                <div style={{ marginTop: '24px', padding: '16px', background: '#f8f8f8', borderRadius: '10px' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '12px' }}>Current Quote State: {clientInfo.state}</h4>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e0e0e0' }}>
                      <span>Property Tax Rate</span>
                      <span className="mono" style={{ fontWeight: '600' }}>{((propertyTaxRates[clientInfo.state] || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e0e0e0' }}>
                      <span>Title Insurance (per $1k)</span>
                      <span className="mono" style={{ fontWeight: '600' }}>${(titleInsuranceRates[clientInfo.state] || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e0e0e0' }}>
                      <span>Transfer Tax (per $1k)</span>
                      <span className="mono" style={{ fontWeight: '600' }}>${(transferTaxRates[clientInfo.state] || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span>Recording Fee</span>
                      <span className="mono" style={{ fontWeight: '600' }}>${recordingFees[clientInfo.state] || 115}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================================================================ */}
      {/* FEE DETAILS MODAL */}
      {/* ================================================================ */}
      {feeModalOpen && calculations[feeModalQuoteIndex] && (() => {
        // Calculate totals with fee overrides for this modal
        const calc = calculations[feeModalQuoteIndex];
        const totalD = (calc.pointsCost > 0 ? calc.pointsCost : 0) + 
          (feeOverrides.adminFee !== undefined ? feeOverrides.adminFee : feeTemplates.adminFee) +
          (feeOverrides.underwritingFee !== undefined ? feeOverrides.underwritingFee : feeTemplates.underwritingFee) +
          (feeOverrides.appraisal !== undefined ? feeOverrides.appraisal : feeTemplates.appraisal) +
          (feeOverrides.creditReport !== undefined ? feeOverrides.creditReport : feeTemplates.creditReport) +
          (feeOverrides.floodCert !== undefined ? feeOverrides.floodCert : feeTemplates.floodCert) +
          (feeOverrides.processing !== undefined ? feeOverrides.processing : feeTemplates.processing) +
          (feeOverrides.taxService !== undefined ? feeOverrides.taxService : feeTemplates.taxService) +
          (calc.closingUpfrontFee || 0) +
          (feeOverrides.lendersTitle !== undefined ? feeOverrides.lendersTitle : (titleInsuranceRates[clientInfo.state] || 2.5) * (calc.totalLoanAmount / 1000)) +
          (feeOverrides.notaryFee !== undefined ? feeOverrides.notaryFee : feeTemplates.notaryFee) +
          (feeOverrides.recordingServiceFee !== undefined ? feeOverrides.recordingServiceFee : feeTemplates.recordingServiceFee) +
          (feeOverrides.settlementFee !== undefined ? feeOverrides.settlementFee : feeTemplates.settlementFee);
        const totalI = (feeOverrides.recordingFee !== undefined ? feeOverrides.recordingFee : (recordingFees[clientInfo.state] || 115)) + 
          (feeOverrides.transferTax !== undefined ? feeOverrides.transferTax : (transferTaxRates[clientInfo.state] || 0) * (propertyValue / 1000)) +
          calc.prepaidInterest + 
          (feeOverrides.prepaidHOI !== undefined ? feeOverrides.prepaidHOI : calc.monthlyHOI * effectivePrepaidSettings.prepaidMonthsInsurance) +
          (feeOverrides.prepaidTax !== undefined ? feeOverrides.prepaidTax : calc.monthlyTax * effectivePrepaidSettings.prepaidMonthsTax) +
          (effectivePrepaidSettings.escrowWaived ? 0 : (
            (feeOverrides.escrowHOI !== undefined ? feeOverrides.escrowHOI : calc.monthlyHOI * effectivePrepaidSettings.escrowMonthsInsurance) +
            (feeOverrides.escrowTax !== undefined ? feeOverrides.escrowTax : calc.monthlyTax * effectivePrepaidSettings.escrowMonthsTax)
          ));
        const totalJ = totalD + totalI;
        const totalWithCredits = totalJ - calc.lenderCredit;
        const downPayment = propertyValue - baseLoanAmount;
        const cashToClose = loanPurpose === 'purchase' ? downPayment + totalWithCredits : baseLoanAmount - propertyDetails.currentBalance - totalWithCredits;
        
        return (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }} onClick={() => setFeeModalOpen(false)}>
          <div style={{
            background: 'white', borderRadius: '16px', maxWidth: '900px', width: '100%', maxHeight: '90vh',
            overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Fee Breakdown - {calc.name}</h2>
                  <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>Loan Estimate Style View • {formatPercent(calc.rate)} Rate</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.keys(feeOverrides).length > 0 && (
                    <button onClick={() => setFeeOverrides({})} style={{
                      background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '8px 16px',
                      cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#856404'
                    }}>↺ Reset All ({Object.keys(feeOverrides).length})</button>
                  )}
                  <button onClick={() => setFeeModalOpen(false)} style={{
                    background: '#f0f0f0', border: 'none', borderRadius: '8px', padding: '8px 16px',
                    cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                  }}>✕ Close</button>
                </div>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#888', padding: '8px 12px', background: '#f8f8f8', borderRadius: '6px', flexWrap: 'wrap' }}>
                <span>🔄 Auto-calculated</span>
                <span style={{ color: '#7B2CBF' }}>● Purple = Overridden</span>
                <span>↺ Reset individual fee</span>
                <span>📊 View lookup table</span>
                <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>Click any value to edit</span>
              </div>
            </div>
            
            {/* Modal Content - Two Columns like LE */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column - Loan Costs */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', padding: '8px 12px', background: '#1a1a1a', color: 'white', borderRadius: '6px' }}>
                  Loan Costs
                </h3>
                
                {/* Section A */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                    <span>A. Origination Charges</span>
                    <span className="mono">{formatCurrency(
                      (calc.pointsCost > 0 ? calc.pointsCost : 0) + 
                      (feeOverrides.adminFee !== undefined ? feeOverrides.adminFee : feeTemplates.adminFee) +
                      (feeOverrides.underwritingFee !== undefined ? feeOverrides.underwritingFee : feeTemplates.underwritingFee)
                    )}</span>
                  </div>
                  <div style={{ paddingLeft: '12px', fontSize: '13px' }}>
                    {calc.pointsCost > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', color: '#555' }}>
                        <span>Points ({((calc.pointsCost / calc.totalLoanAmount) * 100).toFixed(2)}%)</span>
                        <span className="mono" style={{ padding: '2px 6px' }}>{formatCurrency(calc.pointsCost)}</span>
                      </div>
                    )}
                    <EditableFeeRow 
                      label="Administration Fee" 
                      feeKey="adminFee" 
                      defaultValue={feeTemplates.adminFee}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                    />
                    <EditableFeeRow 
                      label="Underwriting Fee" 
                      feeKey="underwritingFee" 
                      defaultValue={feeTemplates.underwritingFee}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                    />
                  </div>
                </div>
                
                {/* Section B */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                    <span>B. Services You Cannot Shop For</span>
                    <span className="mono">{formatCurrency(
                      (feeOverrides.appraisal !== undefined ? feeOverrides.appraisal : feeTemplates.appraisal) +
                      (feeOverrides.creditReport !== undefined ? feeOverrides.creditReport : feeTemplates.creditReport) +
                      (feeOverrides.floodCert !== undefined ? feeOverrides.floodCert : feeTemplates.floodCert) +
                      (feeOverrides.processing !== undefined ? feeOverrides.processing : feeTemplates.processing) +
                      (feeOverrides.taxService !== undefined ? feeOverrides.taxService : feeTemplates.taxService) +
                      (calc.closingUpfrontFee || 0)
                    )}</span>
                  </div>
                  <div style={{ paddingLeft: '12px', fontSize: '13px' }}>
                    <EditableFeeRow 
                      label="Appraisal Fee" 
                      feeKey="appraisal" 
                      defaultValue={feeTemplates.appraisal}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                    />
                    <EditableFeeRow 
                      label="Credit Report" 
                      feeKey="creditReport" 
                      defaultValue={feeTemplates.creditReport}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                    />
                    <EditableFeeRow 
                      label="Flood Determination Fee" 
                      feeKey="floodCert" 
                      defaultValue={feeTemplates.floodCert}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                    />
                    <EditableFeeRow 
                      label="Processing Fee" 
                      feeKey="processing" 
                      defaultValue={feeTemplates.processing}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                    />
                    <EditableFeeRow 
                      label="Tax Service Fee" 
                      feeKey="taxService" 
                      defaultValue={feeTemplates.taxService}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                    />
                    {/* VA Funding Fee or FHA UFMIP - show in Section B */}
                    {calc.upfrontFee > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '6px 0', 
                        marginTop: '4px',
                        borderTop: '1px dashed #ddd',
                        color: calc.upfrontFeeFinanced ? '#7B2CBF' : '#1a1a1a',
                        fontWeight: '600'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {calc.upfrontFeeLabel}
                          {calc.upfrontFeeFinanced && (
                            <span style={{ 
                              background: '#7B2CBF', 
                              color: 'white', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '9px',
                              textTransform: 'uppercase'
                            }}>
                              Financed
                            </span>
                          )}
                        </span>
                        <span className="mono">
                          {calc.upfrontFeeFinanced ? (
                            <span style={{ color: '#888', fontStyle: 'italic' }}>
                              {formatCurrency(calc.upfrontFee)} → Loan
                            </span>
                          ) : (
                            formatCurrency(calc.upfrontFee)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Section C */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                    <span>C. Services You Can Shop For</span>
                    <span className="mono">{formatCurrency(
                      (feeOverrides.lendersTitle !== undefined ? feeOverrides.lendersTitle : (titleInsuranceRates[clientInfo.state] || 2.5) * (calc.totalLoanAmount / 1000)) +
                      (feeOverrides.notaryFee !== undefined ? feeOverrides.notaryFee : feeTemplates.notaryFee) +
                      (feeOverrides.recordingServiceFee !== undefined ? feeOverrides.recordingServiceFee : feeTemplates.recordingServiceFee) +
                      (feeOverrides.settlementFee !== undefined ? feeOverrides.settlementFee : feeTemplates.settlementFee)
                    )}</span>
                  </div>
                  <div style={{ paddingLeft: '12px', fontSize: '13px' }}>
                    <EditableFeeRow 
                      label="Title–Lender's Title Policy" 
                      feeKey="lendersTitle" 
                      defaultValue={feeTemplates.settlementFee}
                      autoValue={(titleInsuranceRates[clientInfo.state] || 2.5) * (calc.totalLoanAmount / 1000)}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                      tableButton={
                        <button onClick={() => { setTableModalType('titleInsurance'); setTableModalOpen(true); }} 
                          style={{ background: 'none', border: 'none', color: '#7B2CBF', cursor: 'pointer', fontSize: '11px', marginLeft: '4px' }}>📊</button>
                      }
                    />
                    <EditableFeeRow 
                      label="Title–Notary Fees" 
                      feeKey="notaryFee" 
                      defaultValue={feeTemplates.notaryFee}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                    />
                    <EditableFeeRow 
                      label="Title–Recording Service" 
                      feeKey="recordingServiceFee" 
                      defaultValue={feeTemplates.recordingServiceFee}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                    />
                    <EditableFeeRow 
                      label="Title–Settlement or Closing Fee" 
                      feeKey="settlementFee" 
                      defaultValue={feeTemplates.settlementFee}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                    />
                  </div>
                </div>
                
                {/* Section D Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', padding: '12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '14px' }}>
                  <span>D. TOTAL LOAN COSTS (A + B + C)</span>
                  <span className="mono">{formatCurrency(
                    (calc.pointsCost > 0 ? calc.pointsCost : 0) + 
                    (feeOverrides.adminFee !== undefined ? feeOverrides.adminFee : feeTemplates.adminFee) +
                    (feeOverrides.underwritingFee !== undefined ? feeOverrides.underwritingFee : feeTemplates.underwritingFee) +
                    (feeOverrides.appraisal !== undefined ? feeOverrides.appraisal : feeTemplates.appraisal) +
                    (feeOverrides.creditReport !== undefined ? feeOverrides.creditReport : feeTemplates.creditReport) +
                    (feeOverrides.floodCert !== undefined ? feeOverrides.floodCert : feeTemplates.floodCert) +
                    (feeOverrides.processing !== undefined ? feeOverrides.processing : feeTemplates.processing) +
                    (feeOverrides.taxService !== undefined ? feeOverrides.taxService : feeTemplates.taxService) +
                    (calc.closingUpfrontFee || 0) +
                    (feeOverrides.lendersTitle !== undefined ? feeOverrides.lendersTitle : (titleInsuranceRates[clientInfo.state] || 2.5) * (calc.totalLoanAmount / 1000)) +
                    (feeOverrides.notaryFee !== undefined ? feeOverrides.notaryFee : feeTemplates.notaryFee) +
                    (feeOverrides.recordingServiceFee !== undefined ? feeOverrides.recordingServiceFee : feeTemplates.recordingServiceFee) +
                    (feeOverrides.settlementFee !== undefined ? feeOverrides.settlementFee : feeTemplates.settlementFee)
                  )}</span>
                </div>
              </div>
              
              {/* Right Column - Other Costs */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', padding: '8px 12px', background: '#1a1a1a', color: 'white', borderRadius: '6px' }}>
                  Other Costs
                </h3>
                
                {/* Section E */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                    <span>E. Taxes and Other Government Fees</span>
                    <span className="mono">{formatCurrency(
                      (feeOverrides.recordingFee !== undefined ? feeOverrides.recordingFee : (recordingFees[clientInfo.state] || 115)) +
                      (feeOverrides.transferTax !== undefined ? feeOverrides.transferTax : (transferTaxRates[clientInfo.state] || 0) * (propertyValue / 1000))
                    )}</span>
                  </div>
                  <div style={{ paddingLeft: '12px', fontSize: '13px' }}>
                    <EditableFeeRow 
                      label="Recording Fees" 
                      feeKey="recordingFee" 
                      defaultValue={115}
                      autoValue={recordingFees[clientInfo.state] || 115}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                      tableButton={
                        <button onClick={() => { setTableModalType('recording'); setTableModalOpen(true); }} 
                          style={{ background: 'none', border: 'none', color: '#7B2CBF', cursor: 'pointer', fontSize: '11px', marginLeft: '4px' }}>📊</button>
                      }
                    />
                    <EditableFeeRow 
                      label="Transfer Taxes" 
                      feeKey="transferTax" 
                      defaultValue={0}
                      autoValue={(transferTaxRates[clientInfo.state] || 0) * (propertyValue / 1000)}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                      tableButton={
                        <button onClick={() => { setTableModalType('transferTax'); setTableModalOpen(true); }} 
                          style={{ background: 'none', border: 'none', color: '#7B2CBF', cursor: 'pointer', fontSize: '11px', marginLeft: '4px' }}>📊</button>
                      }
                    />
                  </div>
                </div>
                
                {/* Section F */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                    <span>F. Prepaids</span>
                    <span className="mono">{formatCurrency(
                      (feeOverrides.prepaidHOI !== undefined ? feeOverrides.prepaidHOI : calc.monthlyHOI * effectivePrepaidSettings.prepaidMonthsInsurance) +
                      calc.prepaidInterest +
                      (feeOverrides.prepaidTax !== undefined ? feeOverrides.prepaidTax : calc.monthlyTax * effectivePrepaidSettings.prepaidMonthsTax)
                    )}</span>
                  </div>
                  <div style={{ paddingLeft: '12px', fontSize: '13px' }}>
                    <EditableFeeRow 
                      label={`Homeowner's Insurance Premium (${effectivePrepaidSettings.prepaidMonthsInsurance} mo)`}
                      feeKey="prepaidHOI" 
                      defaultValue={calc.monthlyHOI * effectivePrepaidSettings.prepaidMonthsInsurance}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', color: '#555' }}>
                      <span>Prepaid Interest ({effectivePrepaidSettings.prepaidDaysInterest} days @ {formatPercent(calc.rate)})</span>
                      <span className="mono" style={{ padding: '2px 6px' }}>{formatCurrency(calc.prepaidInterest)}</span>
                    </div>
                    <EditableFeeRow 
                      label={`Property Taxes (${effectivePrepaidSettings.prepaidMonthsTax} mo)`}
                      feeKey="prepaidTax" 
                      defaultValue={calc.monthlyTax * effectivePrepaidSettings.prepaidMonthsTax}
                      autoValue={calc.monthlyTax * effectivePrepaidSettings.prepaidMonthsTax}
                      overrides={feeOverrides}
                      setOverrides={setFeeOverrides}
                      tableButton={
                        <button onClick={() => { setTableModalType('propertyTax'); setTableModalOpen(true); }} 
                          style={{ background: 'none', border: 'none', color: '#7B2CBF', cursor: 'pointer', fontSize: '11px', marginLeft: '4px' }}>📊</button>
                      }
                    />
                  </div>
                </div>
                
                {/* Section G */}
                <div style={{ marginBottom: '16px', opacity: effectivePrepaidSettings.escrowWaived ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                    <span>
                      G. Initial Escrow Payment at Closing
                      {effectivePrepaidSettings.escrowWaived && <span style={{ color: '#7B2CBF', marginLeft: '8px', fontSize: '12px' }}>(WAIVED)</span>}
                    </span>
                    <span className="mono">{effectivePrepaidSettings.escrowWaived ? '$0' : formatCurrency(
                      (feeOverrides.escrowHOI !== undefined ? feeOverrides.escrowHOI : calc.monthlyHOI * effectivePrepaidSettings.escrowMonthsInsurance) +
                      (feeOverrides.escrowTax !== undefined ? feeOverrides.escrowTax : calc.monthlyTax * effectivePrepaidSettings.escrowMonthsTax)
                    )}</span>
                  </div>
                  {!effectivePrepaidSettings.escrowWaived && (
                    <div style={{ paddingLeft: '12px', fontSize: '13px' }}>
                      <EditableFeeRow 
                        label={`Homeowner's Insurance (${effectivePrepaidSettings.escrowMonthsInsurance} mo)`}
                        feeKey="escrowHOI" 
                        defaultValue={calc.monthlyHOI * effectivePrepaidSettings.escrowMonthsInsurance}
                        overrides={feeOverrides}
                        setOverrides={setFeeOverrides}
                      />
                      <EditableFeeRow 
                        label={`Property Taxes (${effectivePrepaidSettings.escrowMonthsTax} mo)`}
                        feeKey="escrowTax" 
                        defaultValue={calc.monthlyTax * effectivePrepaidSettings.escrowMonthsTax}
                        overrides={feeOverrides}
                        setOverrides={setFeeOverrides}
                      />
                    </div>
                  )}
                </div>
                
                {/* Section I Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', padding: '12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>
                  <span>I. TOTAL OTHER COSTS (E + F + G)</span>
                  <span className="mono">{formatCurrency(
                    (feeOverrides.recordingFee !== undefined ? feeOverrides.recordingFee : (recordingFees[clientInfo.state] || 115)) + 
                    (feeOverrides.transferTax !== undefined ? feeOverrides.transferTax : (transferTaxRates[clientInfo.state] || 0) * (propertyValue / 1000)) +
                    calc.prepaidInterest + 
                    (feeOverrides.prepaidHOI !== undefined ? feeOverrides.prepaidHOI : calc.monthlyHOI * effectivePrepaidSettings.prepaidMonthsInsurance) +
                    (feeOverrides.prepaidTax !== undefined ? feeOverrides.prepaidTax : calc.monthlyTax * effectivePrepaidSettings.prepaidMonthsTax) +
                    (effectivePrepaidSettings.escrowWaived ? 0 : (
                      (feeOverrides.escrowHOI !== undefined ? feeOverrides.escrowHOI : calc.monthlyHOI * effectivePrepaidSettings.escrowMonthsInsurance) +
                      (feeOverrides.escrowTax !== undefined ? feeOverrides.escrowTax : calc.monthlyTax * effectivePrepaidSettings.escrowMonthsTax)
                    ))
                  )}</span>
                </div>
                
                {/* Section J Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', padding: '16px', background: '#1a1a1a', color: 'white', borderRadius: '8px', fontSize: '16px' }}>
                  <span>J. TOTAL CLOSING COSTS</span>
                  <span className="mono">{formatCurrency(totalJ)}</span>
                </div>
                
                {/* Lender Credit */}
                {calc.lenderCredit > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', marginTop: '8px', background: '#f0fff0', borderRadius: '8px', color: '#166534' }}>
                    <span style={{ fontWeight: '600' }}>Lender Credits</span>
                    <span className="mono" style={{ fontWeight: '600' }}>-{formatCurrency(calc.lenderCredit)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Cash to Close Section */}
            <div style={{ padding: '24px', borderTop: '1px solid #e0e0e0', background: '#f8f8f8' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Calculating Cash to Close</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: '8px', fontSize: '14px' }}>
                <span>Total Closing Costs (J)</span>
                <span className="mono" style={{ textAlign: 'right' }}>{formatCurrency(totalJ)}</span>
                
                {calc.lenderCredit > 0 && <>
                  <span>Lender Credits</span>
                  <span className="mono" style={{ textAlign: 'right', color: '#166534' }}>-{formatCurrency(calc.lenderCredit)}</span>
                </>}
                
                {loanPurpose === 'purchase' && <>
                  <span>Down Payment</span>
                  <span className="mono" style={{ textAlign: 'right' }}>{formatCurrency(downPayment)}</span>
                </>}
                
                <div style={{ gridColumn: '1 / -1', borderTop: '2px solid #333', marginTop: '8px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px' }}>
                  <span>{loanPurpose === 'purchase' ? 'Estimated Cash to Close' : 'Estimated Cash Out'}</span>
                  <span className="mono">{formatCurrency(Math.abs(cashToClose))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ================================================================ */}
      {/* HOME EQUITY FEE BREAKDOWN MODAL */}
      {/* ================================================================ */}
      {heFeeModalOpen && secondMortgageCalcs[heFeeModalQuoteIndex] && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }} onClick={() => setHeFeeModalOpen(false)}>
          <div style={{
            background: 'white', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh',
            overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>
                    Fee Breakdown - {secondMortgageCalcs[heFeeModalQuoteIndex].name}
                  </h2>
                  <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                    {secondMortgageType === 'heloan' ? 'HELOAN' : 'HELOC'} • {secondMortgageCalcs[heFeeModalQuoteIndex].rate.toFixed(3)}% Rate
                  </p>
                </div>
                <button onClick={() => setHeFeeModalOpen(false)} style={{
                  background: '#f0f0f0', border: 'none', borderRadius: '8px',
                  padding: '8px 16px', cursor: 'pointer', fontSize: '14px'
                }}>✕ Close</button>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '11px', color: '#666' }}>
                <span style={{ color: '#7B2CBF', fontWeight: '600' }}>● Purple = Overridden</span>
                <span>Click any value to edit</span>
                {Object.keys(heOverrides).length > 0 && (
                  <button 
                    onClick={() => setHeOverrides({})}
                    style={{ 
                      background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px',
                      padding: '2px 8px', cursor: 'pointer', fontSize: '11px', color: '#856404'
                    }}
                  >↺ Reset All to Defaults</button>
                )}
              </div>
            </div>
            
            {/* Fee Content */}
            <div style={{ padding: '24px' }}>
              {/* Section A - Origination */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '12px', fontSize: '15px' }}>
                  <span>A. Origination Charges</span>
                  <span className="mono">{formatCurrency(
                    (heOverrides.heUnderwritingFee !== undefined ? heOverrides.heUnderwritingFee : feeTemplates.heUnderwritingFee) +
                    (secondMortgageType === 'heloan' ? Math.max(0, secondMortgageCalcs[heFeeModalQuoteIndex].pointsCost || 0) : (secondMortgageCalcs[heFeeModalQuoteIndex].drawAmount * loCompensationHE / 100))
                  )}</span>
                </div>
                <div style={{ paddingLeft: '12px', fontSize: '13px' }}>
                  <EditableFeeRow 
                    label="Underwriting Fee" 
                    feeKey="heUnderwritingFee" 
                    defaultValue={feeTemplates.heUnderwritingFee}
                    overrides={heOverrides}
                    setOverrides={setHeOverrides}
                  />
                  
                  {secondMortgageType === 'heloan' ? (
                    /* HELOAN - Show points/credit like Purchase/Refi */
                    <>
                      {secondMortgageCalcs[heFeeModalQuoteIndex].pointsCost > 0 ? (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '6px 0',
                          color: '#555'
                        }}>
                          <span>
                            Points ({((secondMortgageCalcs[heFeeModalQuoteIndex].pointsCost / secondMortgageCalcs[heFeeModalQuoteIndex].drawAmount) * 100).toFixed(3)}%)
                          </span>
                          <span className="mono" style={{ padding: '2px 6px' }}>
                            {formatCurrency(secondMortgageCalcs[heFeeModalQuoteIndex].pointsCost)}
                          </span>
                        </div>
                      ) : secondMortgageCalcs[heFeeModalQuoteIndex].lenderCredit > 0 ? (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '6px 0',
                          color: '#16a34a'
                        }}>
                          <span>Lender Credit</span>
                          <span className="mono" style={{ padding: '2px 6px' }}>
                            -{formatCurrency(secondMortgageCalcs[heFeeModalQuoteIndex].lenderCredit)}
                          </span>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    /* HELOC - Show LO Comp as line item */
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '6px 0',
                      color: '#555'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        LO Compensation ({loCompensationHE}%)
                        <span style={{ fontSize: '10px', color: '#888' }}>(Edit in Edit Rates)</span>
                      </span>
                      <span className="mono" style={{ padding: '2px 6px' }}>
                        {formatCurrency(secondMortgageCalcs[heFeeModalQuoteIndex].drawAmount * loCompensationHE / 100)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Section B - Third Party */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '12px', fontSize: '15px' }}>
                  <span>B. Services You Cannot Shop For</span>
                  <span className="mono">{formatCurrency(
                    ((heOverrides.heAppraisalWaived !== undefined ? heOverrides.heAppraisalWaived : feeTemplates.heAppraisalWaived) 
                      ? 0 
                      : (heOverrides.heAppraisalFee !== undefined ? heOverrides.heAppraisalFee : feeTemplates.heAppraisalFee)) +
                    (heOverrides.heCreditReport !== undefined ? heOverrides.heCreditReport : feeTemplates.heCreditReport) +
                    (heOverrides.heFloodCert !== undefined ? heOverrides.heFloodCert : feeTemplates.heFloodCert)
                  )}</span>
                </div>
                <div style={{ paddingLeft: '12px', fontSize: '13px' }}>
                  {/* Appraisal with Waive toggle - editable when not waived */}
                  {(heOverrides.heAppraisalWaived !== undefined ? heOverrides.heAppraisalWaived : feeTemplates.heAppraisalWaived) ? (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '6px 0', 
                      color: heOverrides.heAppraisalWaived !== undefined ? '#7B2CBF' : '#555',
                      background: heOverrides.heAppraisalWaived !== undefined ? 'rgba(123, 44, 191, 0.05)' : 'transparent',
                      borderRadius: '4px'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Appraisal Fee
                        <label style={{ 
                          display: 'flex', alignItems: 'center', gap: '4px', 
                          background: '#7B2CBF',
                          color: 'white',
                          padding: '2px 8px', borderRadius: '10px', fontSize: '10px', cursor: 'pointer'
                        }}>
                          <input 
                            type="checkbox" 
                            checked={true}
                            onChange={() => setHeOverrides(prev => ({ ...prev, heAppraisalWaived: false }))}
                            style={{ display: 'none' }}
                          />
                          ✓ Waived
                        </label>
                      </span>
                      <span className="mono" style={{ padding: '2px 6px' }}>$0</span>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '2px 0', 
                      color: heOverrides.heAppraisalFee !== undefined ? '#7B2CBF' : '#555',
                      background: heOverrides.heAppraisalFee !== undefined ? 'rgba(123, 44, 191, 0.05)' : 'transparent',
                      borderRadius: '4px'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Appraisal Fee
                        <label style={{ 
                          display: 'flex', alignItems: 'center', gap: '4px', 
                          background: '#e0e0e0',
                          color: '#666',
                          padding: '2px 8px', borderRadius: '10px', fontSize: '10px', cursor: 'pointer'
                        }}>
                          <input 
                            type="checkbox" 
                            checked={false}
                            onChange={() => setHeOverrides(prev => ({ ...prev, heAppraisalWaived: true }))}
                            style={{ display: 'none' }}
                          />
                          Waive
                        </label>
                      </span>
                      <input
                        type="number"
                        value={heOverrides.heAppraisalFee !== undefined ? heOverrides.heAppraisalFee : feeTemplates.heAppraisalFee}
                        onChange={(e) => setHeOverrides(prev => ({ ...prev, heAppraisalFee: parseFloat(e.target.value) || 0 }))}
                        style={{
                          width: '90px',
                          textAlign: 'right',
                          padding: '4px 8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  )}
                  <EditableFeeRow 
                    label="Credit Report" 
                    feeKey="heCreditReport" 
                    defaultValue={feeTemplates.heCreditReport}
                    overrides={heOverrides}
                    setOverrides={setHeOverrides}
                  />
                  <EditableFeeRow 
                    label="Flood Determination Fee" 
                    feeKey="heFloodCert" 
                    defaultValue={feeTemplates.heFloodCert}
                    overrides={heOverrides}
                    setOverrides={setHeOverrides}
                  />
                </div>
              </div>
              
              {/* Section C - Title & Recording */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '12px', fontSize: '15px' }}>
                  <span>C. Title & Recording</span>
                  <span className="mono">{formatCurrency(
                    (heOverrides.heTitleFee !== undefined ? heOverrides.heTitleFee : feeTemplates.heTitleFee) +
                    (heOverrides.heRecordingFee !== undefined ? heOverrides.heRecordingFee : (recordingFees[clientInfo.state] || feeTemplates.heRecordingFee))
                  )}</span>
                </div>
                <div style={{ paddingLeft: '12px', fontSize: '13px' }}>
                  <EditableFeeRow 
                    label="Title / Settlement Fee" 
                    feeKey="heTitleFee" 
                    defaultValue={feeTemplates.heTitleFee}
                    overrides={heOverrides}
                    setOverrides={setHeOverrides}
                  />
                  <EditableFeeRow 
                    label="Recording Fee" 
                    feeKey="heRecordingFee" 
                    defaultValue={recordingFees[clientInfo.state] || feeTemplates.heRecordingFee}
                    overrides={heOverrides}
                    setOverrides={setHeOverrides}
                  />
                </div>
              </div>
              
              {/* Total Closing Costs */}
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', fontWeight: '700', 
                padding: '16px', background: '#1a1a1a', color: 'white', borderRadius: '8px', 
                fontSize: '16px', marginBottom: '20px' 
              }}>
                <span>TOTAL CLOSING COSTS</span>
                <span className="mono">{formatCurrency(secondMortgageCalcs[heFeeModalQuoteIndex].fees)}</span>
              </div>
              
              {/* Net Proceeds Calculation */}
              <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Cash to Borrower Calculation</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', fontSize: '14px' }}>
                  <span>{secondMortgageType === 'heloc' ? 'Initial Draw Amount' : 'Loan Amount'}</span>
                  <span className="mono" style={{ textAlign: 'right' }}>{formatCurrency(secondMortgageCalcs[heFeeModalQuoteIndex].drawAmount)}</span>
                  
                  <span>Less: Closing Costs</span>
                  <span className="mono" style={{ textAlign: 'right', color: '#dc2626' }}>-{formatCurrency(secondMortgageCalcs[heFeeModalQuoteIndex].fees)}</span>
                  
                  <div style={{ gridColumn: '1 / -1', borderTop: '2px solid #333', marginTop: '8px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px' }}>
                    <span>Cash to Borrower</span>
                    <span className="mono" style={{ color: '#16a34a' }}>{formatCurrency(secondMortgageCalcs[heFeeModalQuoteIndex].netProceeds)}</span>
                  </div>
                </div>
              </div>
              
              {/* Loan Summary */}
              <div style={{ marginTop: '20px', padding: '16px', background: '#f0f0f0', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Rate</div>
                    <div style={{ fontSize: '16px', fontWeight: '700' }} className="mono">{secondMortgageCalcs[heFeeModalQuoteIndex].rate.toFixed(3)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>APR</div>
                    <div style={{ fontSize: '16px', fontWeight: '700' }} className="mono">{(secondMortgageCalcs[heFeeModalQuoteIndex].apr * 100).toFixed(3)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>CLTV</div>
                    <div style={{ fontSize: '16px', fontWeight: '700' }} className="mono">{(secondMortgageCalcs[heFeeModalQuoteIndex].cltv * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{secondMortgageType === 'heloc' ? 'Draw Period' : 'Term'}</div>
                    <div style={{ fontSize: '16px', fontWeight: '700' }} className="mono">
                      {secondMortgageType === 'heloc' ? secondMortgageCalcs[heFeeModalQuoteIndex].drawPeriod : secondMortgageCalcs[heFeeModalQuoteIndex].term} yrs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TABLE VIEWER MODAL - EDITABLE */}
      {/* ================================================================ */}
      {tableModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1001, padding: '20px'
        }} onClick={() => { setTableModalOpen(false); setEditingTableCell(null); }}>
          <div style={{
            background: 'white', borderRadius: '16px', maxWidth: '750px', width: '100%', maxHeight: '85vh',
            overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>
                  {tableModalType === 'propertyTax' && '🏠 Property Tax Rates by State'}
                  {tableModalType === 'titleInsurance' && '📜 Title Insurance Rates by State'}
                  {tableModalType === 'transferTax' && '💰 Transfer Tax Rates by State'}
                  {tableModalType === 'pmi' && '🛡️ PMI Rates by Credit Score'}
                  {tableModalType === 'recording' && '📝 Recording Fees by State'}
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      if (tableModalType === 'propertyTax') setPropertyTaxRates({ ...defaultPropertyTaxRates });
                      else if (tableModalType === 'titleInsurance') setTitleInsuranceRates({ ...defaultTitleInsuranceRates });
                      else if (tableModalType === 'transferTax') setTransferTaxRates({ ...defaultTransferTaxRates });
                      else if (tableModalType === 'pmi') setPmiRates({ ...defaultPmiRates });
                      else if (tableModalType === 'recording') setRecordingFees({ ...defaultRecordingFees });
                    }}
                    style={{
                      background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '8px 16px',
                      cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#856404'
                    }}>
                    ↺ Reset to Defaults
                  </button>
                  <button onClick={() => { setTableModalOpen(false); setEditingTableCell(null); }} style={{
                    background: '#f0f0f0', border: 'none', borderRadius: '8px', padding: '8px 16px',
                    cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                  }}>✕ Close</button>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#666' }}>
                Click any value to edit. Modified values shown in <span style={{ color: '#7B2CBF', fontWeight: '600' }}>purple</span>.
              </p>
            </div>
            <div style={{ padding: '24px', maxHeight: '60vh', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8f8f8' }}>
                  <tr>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>
                      {tableModalType === 'pmi' ? 'Credit Score' : 'State'}
                    </th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>
                      {tableModalType === 'propertyTax' && 'Annual Rate'}
                      {tableModalType === 'titleInsurance' && 'Per $1,000'}
                      {tableModalType === 'transferTax' && 'Per $1,000'}
                      {tableModalType === 'pmi' && 'Annual Rate'}
                      {tableModalType === 'recording' && 'Fee'}
                    </th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>
                      Example ($500k)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableModalType === 'pmi' ? (
                    Object.entries(pmiRates).map(([score, rate]) => {
                      const isModified = rate !== defaultPmiRates[score];
                      const isEditing = editingTableCell?.key === score;
                      return (
                        <tr key={score} style={{ borderBottom: '1px solid #eee', background: parseInt(score) === Math.floor(creditScore / 20) * 20 ? '#f0f7ff' : isModified ? 'rgba(123, 44, 191, 0.05)' : 'transparent' }}>
                          <td style={{ padding: '10px' }}>{score}+</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                autoFocus
                                defaultValue={(rate * 100).toFixed(2)}
                                onBlur={(e) => {
                                  const newRate = parseFloat(e.target.value) / 100;
                                  if (!isNaN(newRate)) {
                                    setPmiRates(prev => ({ ...prev, [score]: newRate }));
                                  }
                                  setEditingTableCell(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') e.target.blur();
                                  if (e.key === 'Escape') setEditingTableCell(null);
                                }}
                                style={{ width: '80px', padding: '4px 8px', textAlign: 'right', border: '2px solid #7B2CBF', borderRadius: '4px' }}
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingTableCell({ key: score })}
                                className="mono" 
                                style={{ 
                                  cursor: 'pointer', 
                                  padding: '4px 8px', 
                                  borderRadius: '4px',
                                  color: isModified ? '#7B2CBF' : 'inherit',
                                  fontWeight: isModified ? '600' : '400'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
                                onMouseOut={(e) => e.target.style.background = 'transparent'}
                              >
                                {(rate * 100).toFixed(2)}%
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }} className="mono">{formatCurrency(500000 * rate / 12)}/mo</td>
                        </tr>
                      );
                    })
                  ) : (
                    Object.entries(stateNames).map(([abbrev, name]) => {
                      const currentValue = tableModalType === 'propertyTax' ? propertyTaxRates[abbrev] :
                                   tableModalType === 'titleInsurance' ? titleInsuranceRates[abbrev] :
                                   tableModalType === 'transferTax' ? transferTaxRates[abbrev] :
                                   recordingFees[abbrev];
                      const defaultValue = tableModalType === 'propertyTax' ? defaultPropertyTaxRates[abbrev] :
                                   tableModalType === 'titleInsurance' ? defaultTitleInsuranceRates[abbrev] :
                                   tableModalType === 'transferTax' ? defaultTransferTaxRates[abbrev] :
                                   defaultRecordingFees[abbrev];
                      const isModified = currentValue !== defaultValue;
                      const isEditing = editingTableCell?.key === abbrev;
                      const example = tableModalType === 'propertyTax' ? 500000 * currentValue :
                                     tableModalType === 'titleInsurance' ? 500 * currentValue :
                                     tableModalType === 'transferTax' ? 500 * currentValue :
                                     currentValue;
                      
                      const handleSave = (e) => {
                        let newValue = parseFloat(e.target.value);
                        if (isNaN(newValue)) {
                          setEditingTableCell(null);
                          return;
                        }
                        // Convert percentage input back to decimal for property tax
                        if (tableModalType === 'propertyTax') newValue = newValue / 100;
                        
                        if (tableModalType === 'propertyTax') setPropertyTaxRates(prev => ({ ...prev, [abbrev]: newValue }));
                        else if (tableModalType === 'titleInsurance') setTitleInsuranceRates(prev => ({ ...prev, [abbrev]: newValue }));
                        else if (tableModalType === 'transferTax') setTransferTaxRates(prev => ({ ...prev, [abbrev]: newValue }));
                        else if (tableModalType === 'recording') setRecordingFees(prev => ({ ...prev, [abbrev]: newValue }));
                        setEditingTableCell(null);
                      };
                      
                      return (
                        <tr key={abbrev} style={{ borderBottom: '1px solid #eee', background: abbrev === clientInfo.state ? '#f0f7ff' : isModified ? 'rgba(123, 44, 191, 0.05)' : 'transparent' }}>
                          <td style={{ padding: '10px' }}>
                            {abbrev} - {name}
                            {abbrev === clientInfo.state && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#7B2CBF' }}>● Current</span>}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            {isEditing ? (
                              <input
                                type="number"
                                step={tableModalType === 'propertyTax' ? '0.01' : tableModalType === 'recording' ? '1' : '0.1'}
                                autoFocus
                                defaultValue={tableModalType === 'propertyTax' ? (currentValue * 100).toFixed(2) : 
                                            tableModalType === 'recording' ? currentValue : currentValue.toFixed(2)}
                                onBlur={handleSave}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') e.target.blur();
                                  if (e.key === 'Escape') setEditingTableCell(null);
                                }}
                                style={{ width: '80px', padding: '4px 8px', textAlign: 'right', border: '2px solid #7B2CBF', borderRadius: '4px' }}
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingTableCell({ key: abbrev })}
                                className="mono" 
                                style={{ 
                                  cursor: 'pointer', 
                                  padding: '4px 8px', 
                                  borderRadius: '4px',
                                  color: isModified ? '#7B2CBF' : 'inherit',
                                  fontWeight: isModified ? '600' : '400'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
                                onMouseOut={(e) => e.target.style.background = 'transparent'}
                              >
                                {tableModalType === 'propertyTax' ? `${(currentValue * 100).toFixed(2)}%` :
                                 tableModalType === 'recording' ? formatCurrency(currentValue) :
                                 `$${currentValue.toFixed(2)}`}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }} className="mono">
                            {tableModalType === 'propertyTax' ? `${formatCurrency(example)}/yr` : formatCurrency(example)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Save Quote Modal */}
      {saveModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '450px', maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e0e0e0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Save Quote</h2>
              <p style={{ color: '#666', fontSize: '13px' }}>
                {clientInfo.name 
                  ? `For ${clientInfo.name}`
                  : 'Enter a label to identify this quote'}
              </p>
            </div>
            
            <div style={{ padding: '24px' }}>
              <label className="label">Quote Label</label>
              <input 
                type="text"
                value={quoteLabel}
                onChange={(e) => setQuoteLabel(e.target.value)}
                placeholder="e.g., John Smith - 30yr Purchase"
                style={{ marginBottom: '16px' }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveStatus === null && saveCurrentQuote()}
              />
              
              <div style={{ background: '#f8f8f8', borderRadius: '10px', padding: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Loan Amount</span>
                  <span className="mono" style={{ fontWeight: '600' }}>{formatCurrency(baseLoanAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Program</span>
                  <span style={{ fontWeight: '600' }}>{loanProgram.toUpperCase()} • {term}yr</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Options</span>
                  <span style={{ fontWeight: '600' }}>{rateOptions.length} rate options</span>
                </div>
              </div>
            </div>
            
            <div style={{ padding: '16px 24px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setSaveModalOpen(false); setSaveStatus(null); setQuoteLabel(''); }}
                className="btn-secondary"
                disabled={saveStatus === 'saving'}
              >
                Cancel
              </button>
              <button 
                onClick={saveCurrentQuote}
                className="btn-primary"
                disabled={saveStatus !== null}
                style={{ minWidth: '140px' }}
              >
                {saveStatus === 'saving' ? (
                  <span>Saving...</span>
                ) : saveStatus === 'saved' ? (
                  <span style={{ color: '#10b981' }}>✓ Saved!</span>
                ) : (
                  <span>Save Quote</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '12px', borderTop: '1px solid #e0e0e0' }}>
        CDM Quote Pro • Client Direct Mortgage
      </footer>
    </div>
  );
}
