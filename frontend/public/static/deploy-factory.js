// CreatorHub.Brave - One-time VaultFactory Deployment Script
// This script should be run once to deploy the VaultFactory that will be reused by all users

/**
 * Deploy VaultFactory Contract (Admin Function)
 * This should be called once by the app administrator
 */
async function deployFactoryForProduction() {
  if (!window.ethereum) {
    throw new Error('MetaMask not available');
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const signerAddress = await signer.getAddress();
  const network = await provider.getNetwork();

  // Verify we're on Sepolia
  if (network.chainId !== 11155111) {
    throw new Error('Factory deployment only supported on Sepolia testnet');
  }

  console.log('🏭 Deploying VaultFactory for production use...');
  console.log(`📍 Network: ${network.name} (${network.chainId})`);
  console.log(`👤 Deployer: ${signerAddress}`);

  try {
    // Use existing factory deployment utilities
    if (typeof FactoryContractUtils === 'undefined') {
      throw new Error('Factory utilities not loaded. Please refresh the page.');
    }

    const deployment = await FactoryContractUtils.deployVaultFactory(
      signer,
      signerAddress, // Owner of the factory
      '0.001' // Platform fee: 0.001 ETH
    );

    const factoryAddress = deployment.address;
    
    // Store permanently in localStorage and global config
    NetworkUtils.storeFactoryAddress('sepolia', factoryAddress);
    
    console.log(`✅ VaultFactory deployed successfully!`);
    console.log(`📍 Factory Address: ${factoryAddress}`);
    console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${factoryAddress}`);
    
    // Show success message to user
    if (typeof showToast === 'function') {
      showToast(`✅ VaultFactory deployed at ${factoryAddress.slice(0,8)}...`, 'success');
    }
    
    return {
      address: factoryAddress,
      network: 'sepolia',
      deployer: signerAddress,
      transactionHash: deployment.transactionHash
    };

  } catch (error) {
    console.error('❌ Factory deployment failed:', error);
    throw error;
  }
}

/**
 * Get Factory Address (User Function)
 * This is what regular users call to get the factory for vault creation
 */
async function getExistingFactory() {
  try {
    const factoryAddress = await NetworkUtils.getOrDeployFactory();
    
    console.log(`📍 Using existing VaultFactory: ${factoryAddress}`);
    
    if (typeof showToast === 'function') {
      showToast(`📍 Using VaultFactory: ${factoryAddress.slice(0,8)}...`, 'info');
    }
    
    return factoryAddress;
  } catch (error) {
    console.error('❌ No factory available:', error);
    
    // If no factory exists, show deployment instructions
    if (typeof showToast === 'function') {
      showToast('⚠️ No VaultFactory deployed. Contact admin to deploy factory.', 'error');
    }
    
    throw new Error('VaultFactory not deployed. Contact app administrator.');
  }
}

// Make functions globally available
window.deployFactoryForProduction = deployFactoryForProduction;
window.getExistingFactory = getExistingFactory;

console.log('🏭 Factory deployment utilities loaded');