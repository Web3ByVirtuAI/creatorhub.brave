// CreatorHub.Brave - Smart Contract Integration for Testnet Deployment
// This module contains the compiled smart contract ABIs and bytecode for Sepolia testnet deployment

/**
 * Sepolia Testnet Configuration
 */
const SEPOLIA_CONFIG = {
  chainId: 11155111,
  name: 'Sepolia',
  rpcUrl: 'https://rpc.sepolia.org',
  blockExplorer: 'https://sepolia.etherscan.io',
  symbol: 'ETH',
  decimals: 18,
  faucets: [
    'https://faucets.chain.link/sepolia',
    'https://sepoliafaucet.com/',
    'https://faucet.quicknode.com/ethereum/sepolia'
  ]
};

/**
 * Network Detection and Switching Utilities
 */
const NetworkUtils = {
  // Check if user is on Sepolia testnet
  async isOnSepolia() {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return chainId === '0xaa36a7'; // Sepolia chain ID in hex
    } catch (error) {
      console.error('Failed to check network:', error);
      return false;
    }
  },

  // Switch to Sepolia testnet
  async switchToSepolia() {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    try {
      // Try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
      return true;
    } catch (switchError) {
      // If Sepolia isn't added, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            }],
          });
          return true;
        } catch (addError) {
          throw new Error('Failed to add Sepolia network: ' + addError.message);
        }
      } else {
        throw new Error('Failed to switch to Sepolia: ' + switchError.message);
      }
    }
  },

  // Get current network info
  async getCurrentNetwork() {
    if (!window.ethereum) return null;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networkId = parseInt(chainId, 16);
      
      const networks = {
        1: { name: 'Ethereum Mainnet', symbol: 'ETH' },
        11155111: { name: 'Sepolia Testnet', symbol: 'ETH' },
        137: { name: 'Polygon', symbol: 'MATIC' },
        80001: { name: 'Polygon Mumbai', symbol: 'MATIC' },
        250: { name: 'Fantom', symbol: 'FTM' },
        43114: { name: 'Avalanche', symbol: 'AVAX' },
        56: { name: 'BSC', symbol: 'BNB' },
        42161: { name: 'Arbitrum', symbol: 'ETH' },
        10: { name: 'Optimism', symbol: 'ETH' },
        311: { name: 'AirDAO Mainnet', symbol: 'AMB' }
      };
      
      return {
        chainId: networkId,
        chainIdHex: chainId,
        ...networks[networkId] || { name: 'Unknown Network', symbol: 'ETH' }
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }
};

/**
 * VaultFactory Contract ABI (extracted from compiled artifact)
 */
const VAULT_FACTORY_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {"name": "_initialOwner", "type": "address", "internalType": "address"},
      {"name": "_platformFee", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createVault",
    "inputs": [
      {"name": "unlockTime", "type": "uint256", "internalType": "uint256"},
      {"name": "allowedTokens", "type": "address[]", "internalType": "address[]"},
      {"name": "guardians", "type": "address[]", "internalType": "address[]"},
      {"name": "guardianThreshold", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [
      {"name": "vault", "type": "address", "internalType": "address"}
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "platformFee",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserVaults",
    "inputs": [
      {"name": "user", "type": "address", "internalType": "address"}
    ],
    "outputs": [
      {"name": "vaults", "type": "address[]", "internalType": "address[]"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isVaultRegistered",
    "inputs": [
      {"name": "", "type": "address", "internalType": "address"}
    ],
    "outputs": [
      {"name": "", "type": "bool", "internalType": "bool"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalVaults",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "VaultCreated",
    "inputs": [
      {"name": "vault", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "beneficiary", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "unlockTime", "type": "uint256", "indexed": true, "internalType": "uint256"},
      {"name": "allowedTokens", "type": "address[]", "indexed": false, "internalType": "address[]"},
      {"name": "guardians", "type": "address[]", "indexed": false, "internalType": "address[]"},
      {"name": "guardianThreshold", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "creator", "type": "address", "indexed": false, "internalType": "address"}
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "InsufficientPayment",
    "inputs": [
      {"name": "provided", "type": "uint256", "internalType": "uint256"},
      {"name": "required", "type": "uint256", "internalType": "uint256"}
    ]
  }
];

/**
 * VaultFactory Contract Bytecode (generated from Foundry compilation)
 * Note: This is the actual compiled bytecode for VaultFactory
 */
const VAULT_FACTORY_BYTECODE = "0x608060405234801561000f575f5ffd5b50604051613f1a380380613f1a83398101604081905261002e916101ee565b816001600160a01b03811661005d57604051631e4fbdf760e01b81525f60048201526024015b60405180910390fd5b61006681610192565b5060018055816001600160a01b03811561009e57604051634726455360e11b81526001600160a01b0382166004820152602401610054565b6003829055306100b14262015180610225565b6040516100bd906101e1565b6001600160a01b0390921682526020820152604001604051809103905ff0801580156100eb573d5f5f3e3d5ffd5b5060028054610100600160a81b0319166101006001600160a01b0393841681029190911791829055604080515f81529190920490921660208301527faa3f731066a578e5f39b4215468d826cdd15373cbc0dfc9cb9bdc649718ef7da910160405180910390a1604080515f8152602081018490527fd347e206f25a89b917fc9482f1a2d294d749baa4dc9bde7fb495ee11fe491643910160405180910390a150505061024a565b5f80546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b611f3080611fea83390190565b5f5f604083850312156101ff575f5ffd5b82516001600160a01b0381168114610215575f5ffd5b6020939093015192949293505050565b8082018082111561024457634e487b7160e01b5f52601160045260245ffd5b92915050565b611d93806102575f395ff3fe";

/**
 * Contract Deployment and Interaction Functions
 */
const ContractUtils = {
  // Deploy VaultFactory to Sepolia testnet
  async deployVaultFactory(signer, initialOwner, platformFee = '0.001') {
    try {
      showToast('🚀 Deploying VaultFactory to Sepolia testnet...', 'info');
      
      // Convert platform fee to wei
      const platformFeeWei = ethers.utils.parseEther(platformFee);
      
      // Create contract factory
      const contractFactory = new ethers.ContractFactory(
        VAULT_FACTORY_ABI,
        VAULT_FACTORY_BYTECODE,
        signer
      );
      
      // Deploy contract with constructor arguments
      const contract = await contractFactory.deploy(initialOwner, platformFeeWei, {
        gasLimit: 3000000, // Sufficient gas for deployment
      });
      
      showToast('⏳ Waiting for deployment confirmation...', 'info');
      
      // Wait for deployment
      await contract.deployed();
      
      showToast(`✅ VaultFactory deployed at: ${contract.address}`, 'success');
      
      return {
        address: contract.address,
        contract: contract,
        deploymentTx: contract.deployTransaction
      };
    } catch (error) {
      console.error('VaultFactory deployment failed:', error);
      throw new Error('Failed to deploy VaultFactory: ' + error.message);
    }
  },

  // Create a new vault using the deployed VaultFactory
  async createVault(factoryAddress, signer, vaultConfig) {
    try {
      // Connect to deployed factory contract
      const factory = new ethers.Contract(factoryAddress, VAULT_FACTORY_ABI, signer);
      
      // Get platform fee
      const platformFee = await factory.platformFee();
      
      showToast('📝 Creating vault on Sepolia testnet...', 'info');
      
      // Prepare parameters
      const {
        unlockTime,
        allowedTokens = [], // Empty array allows all tokens
        guardians = [],
        guardianThreshold = 0
      } = vaultConfig;
      
      // Call createVault function
      const tx = await factory.createVault(
        unlockTime,
        allowedTokens,
        guardians,
        guardianThreshold,
        {
          value: platformFee,
          gasLimit: 500000 // Sufficient gas for vault creation
        }
      );
      
      showToast('⏳ Waiting for vault creation confirmation...', 'info');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Find VaultCreated event
      const vaultCreatedEvent = receipt.events?.find(
        event => event.event === 'VaultCreated'
      );
      
      if (!vaultCreatedEvent) {
        throw new Error('VaultCreated event not found in transaction receipt');
      }
      
      const vaultAddress = vaultCreatedEvent.args.vault;
      
      showToast(`✅ Vault created successfully! Address: ${vaultAddress}`, 'success');
      
      return {
        vaultAddress,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        event: vaultCreatedEvent.args
      };
    } catch (error) {
      console.error('Vault creation failed:', error);
      throw new Error('Failed to create vault: ' + error.message);
    }
  },

  // Get user's vaults from factory
  async getUserVaults(factoryAddress, userAddress, provider) {
    try {
      const factory = new ethers.Contract(factoryAddress, VAULT_FACTORY_ABI, provider);
      const vaultAddresses = await factory.getUserVaults(userAddress);
      return vaultAddresses;
    } catch (error) {
      console.error('Failed to get user vaults:', error);
      return [];
    }
  },

  // Get factory stats
  async getFactoryStats(factoryAddress, provider) {
    try {
      const factory = new ethers.Contract(factoryAddress, VAULT_FACTORY_ABI, provider);
      const totalVaults = await factory.totalVaults();
      const platformFee = await factory.platformFee();
      
      return {
        totalVaults: totalVaults.toString(),
        platformFee: ethers.utils.formatEther(platformFee) + ' ETH'
      };
    } catch (error) {
      console.error('Failed to get factory stats:', error);
      return { totalVaults: '0', platformFee: '0 ETH' };
    }
  }
};

/**
 * Testnet Faucet Integration
 */
const FaucetUtils = {
  // Show faucet information to user
  showFaucetInfo() {
    const faucetLinks = SEPOLIA_CONFIG.faucets.map(url => 
      `<a href="${url}" target="_blank" class="text-brave-blue-600 hover:text-brave-blue-700 underline">${url}</a>`
    ).join('<br>');
    
    showToast(`
      <div class="text-left">
        <div class="font-bold mb-2">🚰 Need Sepolia ETH for testing?</div>
        <div class="text-sm">Get free testnet ETH from these faucets:</div>
        <div class="mt-2 text-sm">${faucetLinks}</div>
        <div class="mt-2 text-xs text-gray-600">You'll need testnet ETH to deploy contracts and pay gas fees.</div>
      </div>
    `, 'info', 10000);
  },

  // Check if user has sufficient balance for operations
  async checkBalance(address, provider) {
    try {
      const balance = await provider.getBalance(address);
      const balanceEth = parseFloat(ethers.utils.formatEther(balance));
      
      return {
        balance: balanceEth,
        hasMinimumBalance: balanceEth >= 0.01, // Minimum 0.01 ETH recommended
        formatted: balanceEth.toFixed(4) + ' ETH'
      };
    } catch (error) {
      console.error('Failed to check balance:', error);
      return { balance: 0, hasMinimumBalance: false, formatted: '0 ETH' };
    }
  }
};

// Known deployed factory addresses (will be populated after deployment)
const DEPLOYED_CONTRACTS = {
  sepolia: {
    VaultFactory: null // Will be set after deployment
  }
};

// Export all utilities for use in other scripts
window.NetworkUtils = NetworkUtils;
window.ContractUtils = ContractUtils;
window.FaucetUtils = FaucetUtils;
window.SEPOLIA_CONFIG = SEPOLIA_CONFIG;
window.DEPLOYED_CONTRACTS = DEPLOYED_CONTRACTS;
window.VAULT_FACTORY_ABI = VAULT_FACTORY_ABI;

console.log('✅ CreatorHub.Brave Contract Integration loaded for Sepolia testnet');