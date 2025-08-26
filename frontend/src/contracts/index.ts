// CreatorHub.Brave - Smart Contract Configuration
// Contract addresses, ABIs, and network configurations

export const SUPPORTED_NETWORKS = {
  421614: {
    name: 'Arbitrum Sepolia',
    shortName: 'arb-sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    }
  },
  11155420: {
    name: 'Optimism Sepolia',
    shortName: 'opt-sepolia', 
    rpcUrl: 'https://sepolia.optimism.io',
    blockExplorer: 'https://sepolia-optimism.etherscan.io',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    }
  },
  31337: {
    name: 'Local Anvil',
    shortName: 'anvil',
    rpcUrl: 'http://localhost:8545',
    blockExplorer: 'http://localhost:8545',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    }
  }
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_NETWORKS;

// Contract addresses (will be populated during deployment)
export const CONTRACT_ADDRESSES = {
  421614: {
    VaultFactory: process.env.VAULT_FACTORY_ARBITRUM_SEPOLIA || '',
    ChildVaultImplementation: process.env.CHILD_VAULT_IMPL_ARBITRUM_SEPOLIA || ''
  },
  11155420: {
    VaultFactory: process.env.VAULT_FACTORY_OPTIMISM_SEPOLIA || '',
    ChildVaultImplementation: process.env.CHILD_VAULT_IMPL_OPTIMISM_SEPOLIA || ''
  },
  31337: {
    VaultFactory: process.env.VAULT_FACTORY_ANVIL || '',
    ChildVaultImplementation: process.env.CHILD_VAULT_IMPL_ANVIL || ''
  }
} as const;

// VaultFactory Contract ABI
export const VAULT_FACTORY_ABI = [
  // Constructor
  {
    "type": "constructor",
    "inputs": [
      { "name": "_initialOwner", "type": "address" },
      { "name": "_platformFee", "type": "uint256" }
    ]
  },
  // Receive function
  { "type": "receive", "stateMutability": "payable" },
  
  // View functions
  {
    "type": "function",
    "name": "MAX_GUARDIANS",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_LOCK_DURATION", 
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_LOCK_DURATION",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "platformFee",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVaultCreationFee",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserVaultCount",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserVault",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "index", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAllVaultsCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "calculateVaultCreationCost",
    "inputs": [{ "name": "gasPrice", "type": "uint256" }],
    "outputs": [{ "name": "totalCost", "type": "uint256" }],
    "stateMutability": "view"
  },
  
  // Main vault creation functions
  {
    "type": "function",
    "name": "createVault",
    "inputs": [
      { "name": "unlockTime", "type": "uint256" },
      { "name": "allowedTokens", "type": "address[]" },
      { "name": "guardians", "type": "address[]" },
      { "name": "guardianThreshold", "type": "uint256" }
    ],
    "outputs": [{ "name": "vault", "type": "address" }],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "createVaultFor",
    "inputs": [
      { "name": "beneficiary", "type": "address" },
      { "name": "unlockTime", "type": "uint256" },
      { "name": "allowedTokens", "type": "address[]" },
      { "name": "guardians", "type": "address[]" },
      { "name": "guardianThreshold", "type": "uint256" }
    ],
    "outputs": [{ "name": "vault", "type": "address" }],
    "stateMutability": "payable"
  },
  
  // Events
  {
    "type": "event",
    "name": "VaultCreated",
    "inputs": [
      { "name": "vault", "type": "address", "indexed": true },
      { "name": "beneficiary", "type": "address", "indexed": true },
      { "name": "unlockTime", "type": "uint256", "indexed": false },
      { "name": "creator", "type": "address", "indexed": true }
    ]
  },
  {
    "type": "event", 
    "name": "PlatformFeesWithdrawn",
    "inputs": [
      { "name": "owner", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  }
] as const;

// ChildVault Contract ABI  
export const CHILD_VAULT_ABI = [
  // Constructor
  {
    "type": "constructor",
    "inputs": [
      { "name": "_factory", "type": "address" },
      { "name": "_unlockTime", "type": "uint256" }
    ]
  },
  // Receive function
  { "type": "receive", "stateMutability": "payable" },
  
  // Constants
  {
    "type": "function",
    "name": "RECOVERY_TIMELOCK",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  
  // State view functions
  {
    "type": "function",
    "name": "beneficiary", 
    "inputs": [],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "unlockTime",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "factory",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEthBalance",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTokenBalance",
    "inputs": [{ "name": "token", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", 
    "name": "getAllowedTokens",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getGuardians",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "guardianThreshold",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  
  // Core deposit/withdrawal functions
  {
    "type": "function",
    "name": "depositEth",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "depositToken",
    "inputs": [
      { "name": "token", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdrawEth",
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdrawToken",
    "inputs": [
      { "name": "token", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  
  // Social recovery functions
  {
    "type": "function",
    "name": "initiateSocialRecovery",
    "inputs": [{ "name": "newBeneficiary", "type": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "approveSocialRecovery",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "executeSocialRecovery", 
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelSocialRecovery",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  
  // Emergency functions
  {
    "type": "function",
    "name": "emergencyPause",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  
  // Initialize function (for proxy pattern)
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      { "name": "_beneficiary", "type": "address" },
      { "name": "_unlockTime", "type": "uint256" },
      { "name": "_allowedTokens", "type": "address[]" },
      { "name": "_guardians", "type": "address[]" },
      { "name": "_guardianThreshold", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  
  // Events
  {
    "type": "event",
    "name": "EthDeposited",
    "inputs": [
      { "name": "depositor", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "TokenDeposited", 
    "inputs": [
      { "name": "depositor", "type": "address", "indexed": true },
      { "name": "token", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "EthWithdrawn",
    "inputs": [
      { "name": "beneficiary", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "TokenWithdrawn",
    "inputs": [
      { "name": "beneficiary", "type": "address", "indexed": true },
      { "name": "token", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "SocialRecoveryInitiated",
    "inputs": [
      { "name": "guardian", "type": "address", "indexed": true },
      { "name": "newBeneficiary", "type": "address", "indexed": true },
      { "name": "executeTime", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "SocialRecoveryApproved", 
    "inputs": [
      { "name": "guardian", "type": "address", "indexed": true },
      { "name": "approvalCount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "SocialRecoveryExecuted",
    "inputs": [
      { "name": "oldBeneficiary", "type": "address", "indexed": true },
      { "name": "newBeneficiary", "type": "address", "indexed": true }
    ]
  }
] as const;

// Contract deployment constants
export const DEPLOYMENT_CONSTANTS = {
  MAX_GUARDIANS: 10,
  MIN_LOCK_DURATION: 24 * 60 * 60, // 1 day in seconds
  MAX_LOCK_DURATION: 10 * 365 * 24 * 60 * 60, // 10 years in seconds
  RECOVERY_TIMELOCK: 7 * 24 * 60 * 60, // 7 days in seconds
  DEFAULT_PLATFORM_FEE: '0.001' // ETH
} as const;

// Gas estimates for common operations
export const GAS_ESTIMATES = {
  VAULT_CREATION: 300_000,
  ETH_DEPOSIT: 50_000,
  TOKEN_DEPOSIT: 70_000,
  ETH_WITHDRAWAL: 60_000,
  TOKEN_WITHDRAWAL: 80_000,
  SOCIAL_RECOVERY_INITIATE: 100_000,
  SOCIAL_RECOVERY_APPROVE: 50_000,
  SOCIAL_RECOVERY_EXECUTE: 150_000
} as const;

// Utility functions
export const getContractAddress = (chainId: SupportedChainId, contractName: keyof typeof CONTRACT_ADDRESSES[SupportedChainId]) => {
  return CONTRACT_ADDRESSES[chainId]?.[contractName] || '';
};

export const getNetworkConfig = (chainId: SupportedChainId) => {
  return SUPPORTED_NETWORKS[chainId];
};

export const isNetworkSupported = (chainId: number): chainId is SupportedChainId => {
  return chainId in SUPPORTED_NETWORKS;
};

// Contract interaction helpers
export const formatVaultAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString();
};

export const calculateTimeUntilUnlock = (unlockTime: number) => {
  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = unlockTime - now;
  
  if (timeRemaining <= 0) return 'Unlocked';
  
  const days = Math.floor(timeRemaining / (24 * 60 * 60));
  const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((timeRemaining % (60 * 60)) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Error handling
export const parseContractError = (error: any) => {
  // Common contract error patterns
  if (error?.data?.message) {
    return error.data.message;
  }
  if (error?.message) {
    // Extract custom error messages
    if (error.message.includes('VaultStillLocked')) {
      return 'Your vault is still locked and cannot be accessed yet.';
    }
    if (error.message.includes('OnlyBeneficiary')) {
      return 'Only the vault beneficiary can perform this action.';
    }
    if (error.message.includes('OnlyGuardian')) {
      return 'Only vault guardians can perform this action.';
    }
    if (error.message.includes('InsufficientBalance')) {
      return 'Insufficient balance for this operation.';
    }
    if (error.message.includes('InvalidUnlockTime')) {
      return 'Invalid unlock time. Must be in the future.';
    }
    if (error.message.includes('TooManyGuardians')) {
      return `Maximum ${DEPLOYMENT_CONSTANTS.MAX_GUARDIANS} guardians allowed.`;
    }
    return error.message;
  }
  return 'An unknown error occurred. Please try again.';
};

export default {
  SUPPORTED_NETWORKS,
  CONTRACT_ADDRESSES,
  VAULT_FACTORY_ABI,
  CHILD_VAULT_ABI,
  DEPLOYMENT_CONSTANTS,
  GAS_ESTIMATES,
  getContractAddress,
  getNetworkConfig,
  isNetworkSupported,
  formatVaultAddress,
  formatTimestamp,
  calculateTimeUntilUnlock,
  parseContractError
};