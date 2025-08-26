// CreatorHub.Brave - Form Validation Utilities
// Client-side validation for vault creation wizard

// Validation constants
const VALIDATION_RULES = {
  MIN_UNLOCK_DAYS: 1, // Minimum 1 day in the future
  MAX_UNLOCK_YEARS: 10, // Maximum 10 years in the future
  MIN_DEPOSIT_ETH: 0, // Minimum deposit amount (0 = no minimum)
  MAX_DEPOSIT_ETH: 1000, // Maximum deposit amount (safety limit)
  MAX_GUARDIANS: 10, // Maximum number of guardians
  MIN_GUARDIANS: 0, // Minimum number of guardians (optional)
  MIN_THRESHOLD: 1 // Minimum guardian threshold
};

// Validation error messages
const VALIDATION_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INVALID_UNLOCK_DATE: 'Unlock date must be at least 1 day in the future',
  UNLOCK_DATE_TOO_FAR: 'Unlock date cannot be more than 10 years in the future',
  INVALID_DEPOSIT_AMOUNT: 'Deposit amount must be a valid number',
  DEPOSIT_TOO_LOW: 'Deposit amount cannot be negative',
  DEPOSIT_TOO_HIGH: 'Deposit amount is too high (maximum 1000 ETH)',
  INVALID_GUARDIAN_ADDRESS: 'Guardian address is not a valid Ethereum address',
  DUPLICATE_GUARDIAN: 'Duplicate guardian addresses are not allowed',
  TOO_MANY_GUARDIANS: `Maximum ${VALIDATION_RULES.MAX_GUARDIANS} guardians allowed`,
  INVALID_THRESHOLD: 'Guardian threshold must be between 1 and the number of guardians',
  SELF_AS_GUARDIAN: 'You cannot add yourself as a guardian'
};

// Utility functions for validation
const isValidEthereumAddress = (address) => {
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
};

const isValidNumber = (value) => {
  return !isNaN(value) && isFinite(value);
};

const normalizeAddress = (address) => {
  try {
    return ethers.utils.getAddress(address);
  } catch {
    return address;
  }
};

// Individual field validators
const validateUnlockDate = (unlockDate, unlockTime = '12:00') => {
  const errors = [];
  
  if (!unlockDate) {
    errors.push('Unlock date is required');
    return { isValid: false, errors };
  }
  
  const [hours, minutes] = unlockTime.split(':');
  const unlockDateTime = new Date(unlockDate);
  unlockDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const now = new Date();
  const minDate = new Date(now);
  minDate.setDate(minDate.getDate() + VALIDATION_RULES.MIN_UNLOCK_DAYS);
  
  const maxDate = new Date(now);
  maxDate.setFullYear(maxDate.getFullYear() + VALIDATION_RULES.MAX_UNLOCK_YEARS);
  
  if (unlockDateTime <= minDate) {
    errors.push(VALIDATION_MESSAGES.INVALID_UNLOCK_DATE);
  }
  
  if (unlockDateTime > maxDate) {
    errors.push(VALIDATION_MESSAGES.UNLOCK_DATE_TOO_FAR);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    unlockTimestamp: Math.floor(unlockDateTime.getTime() / 1000)
  };
};

const validateDepositAmount = (depositAmount) => {
  const errors = [];
  
  if (depositAmount === '' || depositAmount === undefined) {
    return { isValid: true, errors }; // Optional field
  }
  
  const amount = parseFloat(depositAmount);
  
  if (!isValidNumber(amount)) {
    errors.push(VALIDATION_MESSAGES.INVALID_DEPOSIT_AMOUNT);
    return { isValid: false, errors };
  }
  
  if (amount < VALIDATION_RULES.MIN_DEPOSIT_ETH) {
    errors.push(VALIDATION_MESSAGES.DEPOSIT_TOO_LOW);
  }
  
  if (amount > VALIDATION_RULES.MAX_DEPOSIT_ETH) {
    errors.push(VALIDATION_MESSAGES.DEPOSIT_TOO_HIGH);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    amount
  };
};

const validateGuardians = (guardians, guardianThreshold, userAccount) => {
  const errors = [];
  
  // Filter out empty guardian addresses
  const filledGuardians = guardians.filter(g => g && g.trim() !== '');
  
  if (filledGuardians.length === 0) {
    return { isValid: true, errors, validGuardians: [] }; // Optional field
  }
  
  const validGuardians = [];
  const seenAddresses = new Set();
  
  for (let i = 0; i < filledGuardians.length; i++) {
    const guardian = filledGuardians[i].trim();
    
    if (!isValidEthereumAddress(guardian)) {
      errors.push(`Guardian ${i + 1}: ${VALIDATION_MESSAGES.INVALID_GUARDIAN_ADDRESS}`);
      continue;
    }
    
    const normalizedAddress = normalizeAddress(guardian);
    
    // Check for self as guardian
    if (userAccount && normalizedAddress.toLowerCase() === userAccount.toLowerCase()) {
      errors.push(`Guardian ${i + 1}: ${VALIDATION_MESSAGES.SELF_AS_GUARDIAN}`);
      continue;
    }
    
    // Check for duplicates
    if (seenAddresses.has(normalizedAddress.toLowerCase())) {
      errors.push(`Guardian ${i + 1}: ${VALIDATION_MESSAGES.DUPLICATE_GUARDIAN}`);
      continue;
    }
    
    seenAddresses.add(normalizedAddress.toLowerCase());
    validGuardians.push(normalizedAddress);
  }
  
  // Check total count
  if (validGuardians.length > VALIDATION_RULES.MAX_GUARDIANS) {
    errors.push(VALIDATION_MESSAGES.TOO_MANY_GUARDIANS);
  }
  
  // Validate threshold
  if (validGuardians.length > 0) {
    if (guardianThreshold < VALIDATION_RULES.MIN_THRESHOLD || guardianThreshold > validGuardians.length) {
      errors.push(VALIDATION_MESSAGES.INVALID_THRESHOLD);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    validGuardians,
    effectiveThreshold: Math.min(guardianThreshold, validGuardians.length)
  };
};

const validateWalletConnection = (wallet) => {
  const errors = [];
  
  if (!wallet.isConnected || !wallet.account) {
    errors.push(VALIDATION_MESSAGES.WALLET_NOT_CONNECTED);
  }
  
  if (wallet.error) {
    errors.push(wallet.error);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Comprehensive form validation
const validateVaultForm = (formData, wallet) => {
  const validation = {
    isValid: true,
    errors: {},
    warnings: {},
    summary: {
      errorCount: 0,
      warningCount: 0
    }
  };
  
  // Validate wallet connection
  const walletValidation = validateWalletConnection(wallet);
  if (!walletValidation.isValid) {
    validation.errors.wallet = walletValidation.errors;
    validation.isValid = false;
  }
  
  // Validate unlock date
  const dateValidation = validateUnlockDate(formData.unlockDate, formData.unlockTime);
  if (!dateValidation.isValid) {
    validation.errors.unlockDate = dateValidation.errors;
    validation.isValid = false;
  }
  
  // Validate deposit amount
  const depositValidation = validateDepositAmount(formData.depositAmount);
  if (!depositValidation.isValid) {
    validation.errors.deposit = depositValidation.errors;
    validation.isValid = false;
  }
  
  // Add warning for zero deposit
  if (depositValidation.isValid && (!formData.depositAmount || parseFloat(formData.depositAmount) === 0)) {
    validation.warnings.deposit = ['You can add funds to your vault later, but starting with a deposit is recommended'];
  }
  
  // Validate guardians
  const guardiansValidation = validateGuardians(formData.guardians, formData.guardianThreshold, wallet.account);
  if (!guardiansValidation.isValid) {
    validation.errors.guardians = guardiansValidation.errors;
    validation.isValid = false;
  }
  
  // Add warning for no guardians
  if (guardiansValidation.isValid && guardiansValidation.validGuardians.length === 0) {
    validation.warnings.guardians = ['Without guardians, you cannot recover your vault if you lose access to your wallet'];
  }
  
  // Count errors and warnings
  validation.summary.errorCount = Object.keys(validation.errors).length;
  validation.summary.warningCount = Object.keys(validation.warnings).length;
  
  return validation;
};

// Real-time field validation for UI
const validateField = (fieldName, value, formData, wallet) => {
  switch (fieldName) {
    case 'unlockDate':
    case 'unlockTime':
      return validateUnlockDate(formData.unlockDate, formData.unlockTime);
    
    case 'depositAmount':
      return validateDepositAmount(value);
    
    case 'guardians':
    case 'guardianThreshold':
      return validateGuardians(formData.guardians, formData.guardianThreshold, wallet.account);
    
    case 'wallet':
      return validateWalletConnection(wallet);
    
    default:
      return { isValid: true, errors: [] };
  }
};

// Gas estimation validation
const validateGasEstimation = (estimatedGas, userBalance, gasPrice) => {
  const errors = [];
  const warnings = [];
  
  if (!estimatedGas) {
    warnings.push('Gas estimation not available - proceed with caution');
    return { isValid: true, errors, warnings };
  }
  
  try {
    const gasCost = estimatedGas.mul(gasPrice || ethers.utils.parseUnits('20', 'gwei'));
    
    if (userBalance && gasCost.gt(userBalance)) {
      errors.push('Insufficient balance for gas fees');
    }
    
    if (gasCost.gt(ethers.utils.parseEther('0.1'))) {
      warnings.push('Gas cost is unusually high - check network conditions');
    }
  } catch (error) {
    warnings.push('Could not validate gas costs');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Export validation functions for use in the main app
window.VaultValidation = {
  validateVaultForm,
  validateField,
  validateUnlockDate,
  validateDepositAmount,
  validateGuardians,
  validateWalletConnection,
  validateGasEstimation,
  VALIDATION_RULES,
  VALIDATION_MESSAGES
};