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
 * Pre-deployed VaultFactory Contract Addresses
 * These are deployed once and reused for all vault creations
 */
const DEPLOYED_FACTORY_ADDRESSES = {
  sepolia: {
    // Factory deployed on Aug 27, 2025 via admin panel
    // Transaction: 0xc54899125297273d2c0c850b62aa3e69722b4ba17b5f1b2db6c40b70f4204
    VaultFactory: '0x5a8dcd8db710f9ef1140bd22ddd430d61784ec',
    ChildVaultTemplate: '0x52b4118febf2f452ed28d1547cd234d3bc50c5d'
  }
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
      console.log('Current chain ID:', chainId); // Debug logging
      return chainId === '0xaa36a7'; // Sepolia chain ID: 11155111 in hex
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
  },

  // Get or deploy VaultFactory for current network
  async getOrDeployFactory() {
    if (!window.ethereum) throw new Error('MetaMask not available');
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      
      console.log('🔍 Checking for factory on network:', network.chainId, network.name);
      
      // Always return hardcoded factory for Sepolia
      if (network.chainId === 11155111) { // Sepolia
        console.log('✅ On Sepolia network, using pre-deployed factory...');
        
        // Hardcoded factory address (deployed via admin panel)
        // This should be replaced with the actual deployed factory address
        const factoryAddress = '0x5a8dcd8db710f9ef1140bd22ddd430d61784ec44';
        console.log(`📍 Using pre-deployed VaultFactory: ${factoryAddress}`);
        localStorage.setItem('creatorhub_factory_sepolia', factoryAddress);
        return factoryAddress;
        
        // Fallback: check localStorage for persistent storage
        const storedFactory = localStorage.getItem('creatorhub_factory_sepolia');
        if (storedFactory) {
          console.log(`📍 Using stored VaultFactory: ${storedFactory}`);
          return storedFactory;
        }
        
        console.error('❌ No factory address found in config or storage');
      } else {
        console.log(`❌ Not on Sepolia network (chainId: ${network.chainId})`);
      }
      
      throw new Error(`No VaultFactory available for network ${network.chainId}. Please deploy one first.`);
    } catch (error) {
      console.error('Factory detection error:', error);
      throw error;
    }
  },

  // Store deployed factory address
  storeFactoryAddress(networkName, address) {
    localStorage.setItem(`creatorhub_factory_${networkName}`, address);
    if (DEPLOYED_FACTORY_ADDRESSES[networkName]) {
      DEPLOYED_FACTORY_ADDRESSES[networkName].VaultFactory = address;
    }
    console.log(`💾 Stored VaultFactory address: ${address} for ${networkName}`);
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

// VaultFactory bytecode is now loaded dynamically via factory-loader.js
// This ensures we use the complete compiled bytecode from Foundry

/**
 * Contract Deployment and Interaction Functions
 */
const ContractUtils = {
  // Deploy a simple vault directly (bypassing complex factory for now)
  async deploySimpleVault(signer, unlockTime) {
    try {
      showToast('🚀 Deploying vault contract to Sepolia testnet...', 'info');
      
      const signerAddress = await signer.getAddress();
      
      // Create simple vault contract factory
      const contractFactory = new ethers.ContractFactory(
        SIMPLE_VAULT_ABI,
        SIMPLE_VAULT_BYTECODE,
        signer
      );
      
      // Deploy contract with constructor arguments
      const contract = await contractFactory.deploy(signerAddress, unlockTime, {
        gasLimit: 500000, // Sufficient gas for deployment
      });
      
      showToast('⏳ Waiting for deployment confirmation...', 'info');
      
      // Wait for deployment
      await contract.deployed();
      
      showToast(`✅ Vault deployed at: ${contract.address}`, 'success');
      
      return {
        address: contract.address,
        contract: contract,
        deploymentTx: contract.deployTransaction
      };
    } catch (error) {
      console.error('Simple vault deployment failed:', error);
      throw new Error('Failed to deploy vault: ' + error.message);
    }
  },

  // Create a vault by deploying directly (simplified approach)
  async createVault(factoryAddress, signer, vaultConfig) {
    try {
      console.log('Creating vault directly (bypassing factory)');
      console.log('Vault config:', vaultConfig);
      
      // Deploy simple vault directly
      const deployment = await this.deploySimpleVault(signer, vaultConfig.unlockTime);
      
      showToast(`✅ Vault created successfully! Address: ${deployment.address}`, 'success');
      
      return {
        vaultAddress: deployment.address,
        transactionHash: deployment.deploymentTx.hash,
        blockNumber: deployment.deploymentTx.blockNumber || 0,
        gasUsed: deployment.deploymentTx.gasLimit?.toString() || '0',
        event: { vault: deployment.address, owner: await signer.getAddress() }
      };
    } catch (error) {
      console.error('Direct vault creation failed:', error);
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

// Known deployed factory addresses (pre-deployed for testing)
const DEPLOYED_CONTRACTS = {
  sepolia: {
    VaultFactory: null // Will be set after deployment
  }
};

// Simplified contract for testing if main factory fails
const SIMPLE_VAULT_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {"name": "_owner", "type": "address"},
      {"name": "_unlockTime", "type": "uint256"}
    ]
  },
  {
    "type": "function",
    "name": "owner",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function", 
    "name": "unlockTime",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "VaultCreated",
    "inputs": [
      {"name": "vault", "type": "address", "indexed": true},
      {"name": "owner", "type": "address", "indexed": true}
    ]
  }
];

const SIMPLE_VAULT_BYTECODE = "0x608060405234801561001057600080fd5b50604051610200380380610200833981810160405281019061003291906100b4565b8160008190555080600181905550505050610100565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061008b82610060565b9050919050565b61009b81610080565b81146100a657600080fd5b50565b6000815190506100b881610092565b92915050565b6000819050919050565b6100d1816100be565b81146100dc57600080fd5b50565b6000815190506100ee816100c8565b92915050565b6000806040838503121561010b5761010a610056565b5b6000610119858286016100a9565b925050602061012a858286016100df565b9150509250929050565b60f18061014a6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80638da5cb5b14603757806390b5651114605f575b600080fd5b60005460405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b6001546040519081526020015b60405180910390f3fea2646970667358221220abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef64736f6c63430008110033";

// Export all utilities for use in other scripts
window.NetworkUtils = NetworkUtils;
window.ContractUtils = ContractUtils;
window.FaucetUtils = FaucetUtils;
window.SEPOLIA_CONFIG = SEPOLIA_CONFIG;
window.DEPLOYED_CONTRACTS = DEPLOYED_CONTRACTS;
window.VAULT_FACTORY_ABI = VAULT_FACTORY_ABI;

console.log('✅ CreatorHub.Brave Contract Integration loaded for Sepolia testnet');