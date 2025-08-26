// VaultFactory Loader - Loads complete compiled contracts
// This module loads the full ABI and bytecode for proper factory deployment

let VAULT_FACTORY_FULL_ABI = null;
let VAULT_FACTORY_FULL_BYTECODE = null;

/**
 * Load the complete VaultFactory ABI and bytecode
 */
async function loadFactoryContracts() {
  try {
    console.log('Loading VaultFactory ABI and bytecode...');
    
    // Load ABI
    const abiResponse = await fetch('/static/factory_abi.json');
    if (!abiResponse.ok) {
      throw new Error('Failed to load factory ABI');
    }
    VAULT_FACTORY_FULL_ABI = await abiResponse.json();
    
    // Load bytecode
    const bytecodeResponse = await fetch('/static/factory_bytecode.txt');
    if (!bytecodeResponse.ok) {
      throw new Error('Failed to load factory bytecode');
    }
    const bytecodeText = await bytecodeResponse.text();
    VAULT_FACTORY_FULL_BYTECODE = bytecodeText.trim().replace(/"/g, ''); // Remove quotes
    
    console.log('✅ VaultFactory contracts loaded successfully');
    console.log('ABI functions:', VAULT_FACTORY_FULL_ABI.filter(item => item.type === 'function').length);
    console.log('Bytecode length:', VAULT_FACTORY_FULL_BYTECODE.length);
    
    return { abi: VAULT_FACTORY_FULL_ABI, bytecode: VAULT_FACTORY_FULL_BYTECODE };
  } catch (error) {
    console.error('Failed to load factory contracts:', error);
    throw new Error('Could not load VaultFactory contracts: ' + error.message);
  }
}

/**
 * Enhanced ContractUtils with proper factory deployment
 */
const FactoryContractUtils = {
  // Deploy the complete VaultFactory with full bytecode
  async deployVaultFactory(signer, initialOwner, platformFee = '0.001') {
    try {
      showToast('🏭 Deploying VaultFactory with full bytecode...', 'info');
      
      // Ensure contracts are loaded
      if (!VAULT_FACTORY_FULL_ABI || !VAULT_FACTORY_FULL_BYTECODE) {
        await loadFactoryContracts();
      }
      
      // Convert platform fee to wei
      const platformFeeWei = ethers.utils.parseEther(platformFee);
      
      console.log('Deploying VaultFactory with:', {
        initialOwner,
        platformFee: platformFeeWei.toString(),
        abiLength: VAULT_FACTORY_FULL_ABI.length,
        bytecodeLength: VAULT_FACTORY_FULL_BYTECODE.length
      });
      
      // Create contract factory with full ABI and bytecode
      const contractFactory = new ethers.ContractFactory(
        VAULT_FACTORY_FULL_ABI,
        VAULT_FACTORY_FULL_BYTECODE,
        signer
      );
      
      // Deploy contract with constructor arguments
      const contract = await contractFactory.deploy(initialOwner, platformFeeWei, {
        gasLimit: 6000000, // Increased gas limit for complex contract
      });
      
      showToast('⏳ Waiting for VaultFactory deployment...', 'info');
      
      // Wait for deployment
      await contract.deployed();
      
      showToast(`✅ VaultFactory deployed at: ${contract.address}`, 'success');
      console.log('VaultFactory deployed successfully at:', contract.address);
      
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

  // Create vault using the deployed factory
  async createVaultWithFactory(factoryAddress, signer, vaultConfig) {
    try {
      console.log('Creating vault using factory at:', factoryAddress);
      
      // Ensure contracts are loaded
      if (!VAULT_FACTORY_FULL_ABI) {
        await loadFactoryContracts();
      }
      
      // Connect to deployed factory contract
      const factory = new ethers.Contract(factoryAddress, VAULT_FACTORY_FULL_ABI, signer);
      
      // Get platform fee
      const platformFee = await factory.platformFee();
      console.log('Factory platform fee:', ethers.utils.formatEther(platformFee), 'ETH');
      
      showToast('🏭 Creating vault through VaultFactory...', 'info');
      
      // Prepare parameters
      const {
        unlockTime,
        allowedTokens = [], // Empty array allows all tokens
        guardians = [],
        guardianThreshold = 0
      } = vaultConfig;
      
      console.log('Factory call parameters:', { unlockTime, allowedTokens, guardians, guardianThreshold });
      
      // Call createVault function on factory
      const tx = await factory.createVault(
        unlockTime,
        allowedTokens,
        guardians,
        guardianThreshold,
        {
          value: platformFee,
          gasLimit: 1000000 // Gas for vault creation through factory
        }
      );
      
      console.log('Factory transaction sent:', tx.hash);
      showToast('⏳ Waiting for vault creation confirmation...', 'info');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Factory transaction receipt:', receipt);
      
      // Find VaultCreated event
      const vaultCreatedEvent = receipt.events?.find(
        event => event.event === 'VaultCreated'
      );
      
      if (!vaultCreatedEvent) {
        console.warn('No VaultCreated event found. Receipt events:', receipt.events);
        throw new Error('VaultCreated event not found - factory may have failed');
      }
      
      const vaultAddress = vaultCreatedEvent.args.vault;
      console.log('✅ Vault created through factory at address:', vaultAddress);
      
      showToast(`✅ Vault created by factory! Address: ${vaultAddress}`, 'success');
      
      return {
        vaultAddress,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        event: vaultCreatedEvent.args,
        factoryUsed: true
      };
    } catch (error) {
      console.error('Factory vault creation failed:', error);
      throw new Error('Failed to create vault through factory: ' + error.message);
    }
  }
};

// Initialize factory loading when script loads
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    loadFactoryContracts().catch(error => {
      console.warn('Could not preload factory contracts:', error);
    });
  }, 1000);
});

// Export for use by vault wizard
window.FactoryContractUtils = FactoryContractUtils;
window.loadFactoryContracts = loadFactoryContracts;

console.log('✅ Factory loader script initialized');