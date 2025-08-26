// CreatorHub.Brave - Web3 Utility Functions
// Helper functions for Web3 interactions and wallet management

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      selectedAddress?: string;
      on: (event: string, callback: (data: any) => void) => void;
      removeListener: (event: string, callback: (data: any) => void) => void;
    };
  }
}

export interface WalletState {
  account: string | null;
  provider: any;
  signer: any;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  isConnected: boolean;
}

export interface VaultFormData {
  unlockDate: string;
  unlockTime: string;
  depositAmount: string;
  guardians: string[];
  guardianThreshold: number;
  allowedTokens: string[];
}

export interface CreatedVault {
  address: string;
  beneficiary: string;
  unlockTime: number;
  transactionHash: string;
}

// Supported networks configuration
export const NETWORKS = {
  421614: {
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io'
  },
  11155420: {
    name: 'Optimism Sepolia',
    rpcUrl: 'https://sepolia.optimism.io',
    blockExplorer: 'https://sepolia-optimism.etherscan.io'
  }
} as const;

// Smart Contract ABIs (simplified for frontend use)
export const VAULT_FACTORY_ABI = [
  "function createVaultFor(address beneficiary, uint256 unlockTime, address[] memory allowedTokens, address[] memory guardians, uint256 guardianThreshold) external payable returns (address)",
  "function getVaultCreationFee() external view returns (uint256)",
  "function getUserVaultCount(address user) external view returns (uint256)",
  "function calculateVaultCreationCost(uint256 gasPrice) external view returns (uint256)",
  "function platformFee() external view returns (uint256)",
  "event VaultCreated(address indexed vault, address indexed beneficiary, uint256 unlockTime, address indexed creator)"
];

export const CHILD_VAULT_ABI = [
  "function depositEth() external payable",
  "function withdrawEth(uint256 amount) external",
  "function beneficiary() external view returns (address)",
  "function unlockTime() external view returns (uint256)",
  "function getEthBalance() external view returns (uint256)",
  "function getGuardians() external view returns (address[])",
  "function guardianThreshold() external view returns (uint256)",
  "function factory() external view returns (address)"
];

// Contract addresses (placeholder - will be set via environment variables)
export const CONTRACT_ADDRESSES = {
  421614: {
    VaultFactory: process.env.VAULT_FACTORY_ARBITRUM_SEPOLIA || '0x1234567890123456789012345678901234567890'
  },
  11155420: {
    VaultFactory: process.env.VAULT_FACTORY_OPTIMISM_SEPOLIA || '0x1234567890123456789012345678901234567890'
  }
} as const;

// Utility functions
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatEther = (value: any): string => {
  if (!value) return '0';
  try {
    // Use ethers v5 formatting
    return parseFloat((window as any).ethers.utils.formatEther(value)).toFixed(6);
  } catch {
    return '0';
  }
};

export const isValidAddress = (address: string): boolean => {
  try {
    return (window as any).ethers.utils.isAddress(address);
  } catch {
    return false;
  }
};

export const parseEther = (value: string) => {
  try {
    return (window as any).ethers.utils.parseEther(value);
  } catch {
    return (window as any).ethers.BigNumber.from(0);
  }
};

// Wallet connection utilities
export const connectWallet = async (): Promise<Partial<WalletState>> => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    const provider = new (window as any).ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);

    const signer = provider.getSigner();
    const account = await signer.getAddress();
    const network = await provider.getNetwork();

    if (!NETWORKS[network.chainId as keyof typeof NETWORKS]) {
      throw new Error('Unsupported network. Please switch to Arbitrum Sepolia or Optimism Sepolia.');
    }

    return {
      provider,
      signer,
      account,
      chainId: network.chainId,
      isConnected: true,
      error: null
    };
  } catch (error: any) {
    return {
      error: error.message,
      isConnected: false
    };
  }
};

// Gas estimation utilities
export const estimateVaultCreationGas = async (
  signer: any,
  beneficiary: string,
  unlockTime: number,
  guardians: string[],
  guardianThreshold: number,
  chainId: number
): Promise<any> => {
  try {
    const factoryAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.VaultFactory;
    if (!factoryAddress) throw new Error('Contract not deployed on this network');

    const factory = new (window as any).ethers.Contract(factoryAddress, VAULT_FACTORY_ABI, signer);
    
    const cleanGuardians = guardians.filter(g => isValidAddress(g));
    const gasEstimate = await factory.estimateGas.createVaultFor(
      beneficiary,
      unlockTime,
      [], // No token allowlist for now
      cleanGuardians,
      guardianThreshold
    );

    return gasEstimate;
  } catch (error) {
    console.error('Gas estimation error:', error);
    return (window as any).ethers.BigNumber.from(300000); // Fallback estimate
  }
};

// Vault creation function
export const createVault = async (
  signer: any,
  beneficiary: string,
  unlockTime: number,
  depositAmount: string,
  guardians: string[],
  guardianThreshold: number,
  chainId: number
): Promise<CreatedVault> => {
  try {
    const factoryAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.VaultFactory;
    if (!factoryAddress) throw new Error('Contract not deployed on this network');

    const factory = new (window as any).ethers.Contract(factoryAddress, VAULT_FACTORY_ABI, signer);
    
    const cleanGuardians = guardians.filter(g => isValidAddress(g));
    const depositValue = parseEther(depositAmount || '0');

    const tx = await factory.createVaultFor(
      beneficiary,
      unlockTime,
      [], // No token allowlist for now  
      cleanGuardians,
      guardianThreshold,
      { value: depositValue }
    );

    const receipt = await tx.wait();
    const vaultCreatedEvent = receipt.events?.find((e: any) => e.event === 'VaultCreated');
    
    if (!vaultCreatedEvent) {
      throw new Error('Vault creation event not found in transaction receipt');
    }

    return {
      address: vaultCreatedEvent.args.vault,
      beneficiary: vaultCreatedEvent.args.beneficiary,
      unlockTime: vaultCreatedEvent.args.unlockTime.toNumber(),
      transactionHash: receipt.transactionHash
    };
  } catch (error: any) {
    console.error('Vault creation error:', error);
    throw new Error(parseContractError(error));
  }
};

// Error parsing utility
export const parseContractError = (error: any): string => {
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
      return 'Maximum 10 guardians allowed.';
    }
    if (error.message.includes('user rejected transaction')) {
      return 'Transaction was cancelled by user.';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds to complete transaction.';
    }
    return error.message;
  }
  return 'An unknown error occurred. Please try again.';
};

// Network utilities
export const getNetworkName = (chainId: number): string => {
  return NETWORKS[chainId as keyof typeof NETWORKS]?.name || 'Unknown Network';
};

export const getBlockExplorer = (chainId: number): string => {
  return NETWORKS[chainId as keyof typeof NETWORKS]?.blockExplorer || '';
};

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

// Time utilities
export const calculateTimeUntilUnlock = (unlockTime: number): string => {
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

export const getMinUnlockDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

export const getMaxUnlockDate = (): string => {
  const tenYearsFromNow = new Date();
  tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);
  return tenYearsFromNow.toISOString().split('T')[0];
};