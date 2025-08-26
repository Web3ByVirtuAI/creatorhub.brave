// CreatorHub.Brave - Frontend Validation Tests
// Test suite for form validation and utility functions

// Mock ethers for testing (browser-compatible)
if (typeof window !== 'undefined') {
  window.ethers = window.ethers || {
    utils: {
      isAddress: (address) => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      },
      getAddress: (address) => {
        if (window.ethers.utils.isAddress(address)) {
          return address.toLowerCase(); // Simplified checksum
        }
        throw new Error('Invalid address');
      }
    }
  };
}

// Test data
const validAddress1 = '0x742d35Cc6634C0532925a3b8D55B4E52Eb1b4870';
const validAddress2 = '0x1234567890123456789012345678901234567890';
const invalidAddress = '0xinvalid';
const userAccount = '0x5678901234567890123456789012345678901234';

// Test helper function
const runTest = (testName, testFunction) => {
  try {
    testFunction();
    console.log(`✅ ${testName}: PASSED`);
    return true;
  } catch (error) {
    console.error(`❌ ${testName}: FAILED - ${error.message}`);
    return false;
  }
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

// Load validation functions (assuming they're available globally)
// In a real environment, you'd import these properly
if (typeof window !== 'undefined' && window.VaultValidation) {
  const {
    validateUnlockDate,
    validateDepositAmount,
    validateGuardians,
    validateWalletConnection,
    validateVaultForm
  } = window.VaultValidation;

  // Test Suite
  console.log('🧪 Running CreatorHub.Brave Frontend Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Unlock Date Validation Tests
  console.log('📅 Testing Unlock Date Validation:');
  
  totalTests++;
  if (runTest('Valid future date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const dateString = tomorrow.toISOString().split('T')[0];
    const result = validateUnlockDate(dateString, '12:00');
    assert(result.isValid, 'Valid future date should pass');
    assert(result.unlockTimestamp > Date.now() / 1000, 'Timestamp should be in future');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Past date rejection', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];
    const result = validateUnlockDate(dateString, '12:00');
    assert(!result.isValid, 'Past date should fail');
    assert(result.errors.length > 0, 'Should have error messages');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Empty date rejection', () => {
    const result = validateUnlockDate('', '12:00');
    assert(!result.isValid, 'Empty date should fail');
    assert(result.errors.some(err => err.includes('required')), 'Should require date');
  })) passedTests++;
  
  // Deposit Amount Validation Tests
  console.log('\n💰 Testing Deposit Amount Validation:');
  
  totalTests++;
  if (runTest('Valid deposit amount', () => {
    const result = validateDepositAmount('0.1');
    assert(result.isValid, 'Valid amount should pass');
    assert(result.amount === 0.1, 'Should parse amount correctly');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Empty deposit (optional)', () => {
    const result = validateDepositAmount('');
    assert(result.isValid, 'Empty deposit should be allowed');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Invalid deposit amount', () => {
    const result = validateDepositAmount('not-a-number');
    assert(!result.isValid, 'Invalid number should fail');
    assert(result.errors.some(err => err.includes('valid number')), 'Should have number validation error');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Negative deposit amount', () => {
    const result = validateDepositAmount('-1');
    assert(!result.isValid, 'Negative amount should fail');
    assert(result.errors.some(err => err.includes('negative')), 'Should reject negative amounts');
  })) passedTests++;
  
  // Guardian Validation Tests
  console.log('\n🛡️ Testing Guardian Validation:');
  
  totalTests++;
  if (runTest('Valid guardians', () => {
    const result = validateGuardians([validAddress1, validAddress2], 2, userAccount);
    assert(result.isValid, 'Valid guardians should pass');
    assert(result.validGuardians.length === 2, 'Should have 2 valid guardians');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Empty guardians (optional)', () => {
    const result = validateGuardians([], 1, userAccount);
    assert(result.isValid, 'Empty guardians should be allowed');
    assert(result.validGuardians.length === 0, 'Should have no guardians');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Invalid guardian address', () => {
    const result = validateGuardians([invalidAddress], 1, userAccount);
    assert(!result.isValid, 'Invalid address should fail');
    assert(result.errors.some(err => err.includes('valid Ethereum address')), 'Should have address validation error');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Duplicate guardian addresses', () => {
    const result = validateGuardians([validAddress1, validAddress1], 2, userAccount);
    assert(!result.isValid, 'Duplicate guardians should fail');
    assert(result.errors.some(err => err.includes('Duplicate')), 'Should have duplicate error');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Self as guardian rejection', () => {
    const result = validateGuardians([userAccount], 1, userAccount);
    assert(!result.isValid, 'Self as guardian should fail');
    assert(result.errors.some(err => err.includes('yourself')), 'Should reject self as guardian');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Invalid threshold', () => {
    const result = validateGuardians([validAddress1], 2, userAccount);
    assert(!result.isValid, 'Threshold > guardians should fail');
    assert(result.errors.some(err => err.includes('threshold')), 'Should have threshold error');
  })) passedTests++;
  
  // Wallet Connection Validation Tests
  console.log('\n🔗 Testing Wallet Connection Validation:');
  
  totalTests++;
  if (runTest('Connected wallet', () => {
    const mockWallet = { isConnected: true, account: validAddress1, error: null };
    const result = validateWalletConnection(mockWallet);
    assert(result.isValid, 'Connected wallet should pass');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Disconnected wallet', () => {
    const mockWallet = { isConnected: false, account: null, error: null };
    const result = validateWalletConnection(mockWallet);
    assert(!result.isValid, 'Disconnected wallet should fail');
    assert(result.errors.some(err => err.includes('connect')), 'Should have connection error');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Wallet with error', () => {
    const mockWallet = { isConnected: false, account: null, error: 'Network error' };
    const result = validateWalletConnection(mockWallet);
    assert(!result.isValid, 'Wallet with error should fail');
    assert(result.errors.some(err => err.includes('Network error')), 'Should include error message');
  })) passedTests++;
  
  // Comprehensive Form Validation Tests
  console.log('\n📋 Testing Complete Form Validation:');
  
  totalTests++;
  if (runTest('Complete valid form', () => {
    const mockWallet = { isConnected: true, account: userAccount, error: null };
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const formData = {
      unlockDate: tomorrow.toISOString().split('T')[0],
      unlockTime: '12:00',
      depositAmount: '0.1',
      guardians: [validAddress1],
      guardianThreshold: 1
    };
    
    const result = validateVaultForm(formData, mockWallet);
    assert(result.isValid, 'Complete valid form should pass');
    assert(result.summary.errorCount === 0, 'Should have no errors');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Form with warnings', () => {
    const mockWallet = { isConnected: true, account: userAccount, error: null };
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const formData = {
      unlockDate: tomorrow.toISOString().split('T')[0],
      unlockTime: '12:00',
      depositAmount: '0', // This should trigger a warning
      guardians: [], // This should trigger a warning
      guardianThreshold: 1
    };
    
    const result = validateVaultForm(formData, mockWallet);
    assert(result.isValid, 'Form with warnings should still be valid');
    assert(result.summary.warningCount > 0, 'Should have warnings');
  })) passedTests++;
  
  totalTests++;
  if (runTest('Invalid form with multiple errors', () => {
    const mockWallet = { isConnected: false, account: null, error: null };
    const formData = {
      unlockDate: '', // Invalid
      unlockTime: '12:00',
      depositAmount: 'invalid', // Invalid
      guardians: [invalidAddress], // Invalid
      guardianThreshold: 1
    };
    
    const result = validateVaultForm(formData, mockWallet);
    assert(!result.isValid, 'Invalid form should fail');
    assert(result.summary.errorCount > 2, 'Should have multiple errors');
  })) passedTests++;
  
  // Print test results
  console.log('\n📊 Test Results:');
  console.log(`Passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Frontend validation is working correctly.');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) failed. Please review the validation logic.`);
  }
  
  // Export test results for external use
  if (typeof window !== 'undefined') {
    window.testResults = {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests
    };
  }
  
} else {
  console.error('❌ Validation functions not available. Make sure validation.js is loaded first.');
}