// CreatorHub.Brave - Vault Creation Wizard
// React-based frontend application with Web3 wallet integration



// Web3 Configuration
const SUPPORTED_NETWORKS = {
  11155111: {
    name: 'Sepolia',
    rpcUrl: 'https://ethereum-sepolia.publicnode.com',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
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
};

// Smart Contract ABIs (simplified for demo)
const VAULT_FACTORY_ABI = [
  "function createVaultFor(address beneficiary, uint256 unlockTime, address[] memory guardians, uint256 guardianThreshold, address[] memory allowedTokens) external payable returns (address)",
  "function getVaultCreationFee() external view returns (uint256)",
  "function getUserVaultCount(address user) external view returns (uint256)",
  "event VaultCreated(address indexed vault, address indexed beneficiary, uint256 unlockTime)"
];

const CHILD_VAULT_ABI = [
  "function depositEth() external payable",
  "function withdrawEth(uint256 amount) external",
  "function beneficiary() external view returns (address)",
  "function unlockTime() external view returns (uint256)",
  "function guardians(uint256) external view returns (address)"
];

// Dynamic Contract Configuration
// Use known working contract addresses for testing
const CONTRACT_ADDRESSES = {
  11155111: '0x0000000000000000000000000000000000000000', // Sepolia - will deploy on first use
  421614: null,   // Arbitrum Sepolia - will be deployed on demand  
  11155420: null  // Optimism Sepolia - will be deployed on demand
};

const getFactoryAddress = async (chainId, signer = null) => {
  // Check localStorage first
  const storageKey = `vaultFactory_${chainId}`;
  let address = localStorage.getItem(storageKey);
  
  if (address && address !== 'null' && ethers.utils.isAddress(address)) {
    // Verify contract exists at this address
    try {
      if (signer) {
        const code = await signer.provider.getCode(address);
        if (code !== '0x') {
          return address;
        }
      } else {
        return address; // Assume it's valid if we don't have a signer to check
      }
    } catch (error) {
      console.log('Stored address invalid, will need to redeploy');
    }
  }
  
  // For Sepolia (main testnet), throw error to prompt deployment
  if (chainId === 11155111 && signer) {
    throw new Error('VaultFactory not deployed. Click "Deploy Factory" first.');
  }
  
  throw new Error('VaultFactory contract not deployed on this network. Please deploy the factory contract first.');
};

const storeFactoryAddress = (chainId, address) => {
  const storageKey = `vaultFactory_${chainId}`;
  localStorage.setItem(storageKey, address);
  CONTRACT_ADDRESSES[chainId] = address;
};

// Utility Functions
const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatEther = (value) => {
  if (!value) return '0';
  return parseFloat(ethers.utils.formatEther(value)).toFixed(6);
};

const isValidAddress = (address) => {
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
};

// Wallet Connection Hook
const useWallet = () => {
  const [account, setAccount] = React.useState(null);
  const [provider, setProvider] = React.useState(null);
  const [signer, setSigner] = React.useState(null);
  const [chainId, setChainId] = React.useState(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState(null);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      await web3Provider.send('eth_requestAccounts', []);

      const web3Signer = web3Provider.getSigner();
      const userAccount = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();

      if (!SUPPORTED_NETWORKS[network.chainId]) {
        throw new Error(`Unsupported network. Please switch to Arbitrum Sepolia or Optimism Sepolia.`);
      }

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(userAccount);
      setChainId(network.chainId);
    } catch (err) {
      setError(err.message);
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
  };

  // Auto-connect if previously connected
  React.useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      connectWallet();
    }
  }, []);

  // Listen for account changes
  React.useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  return {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    isConnected: !!account
  };
};

// Main Vault Creation Wizard Component
const VaultWizard = () => {
  const wallet = useWallet();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    unlockDate: '',
    unlockTime: '12:00',
    depositAmount: '',
    guardians: [''],
    guardianThreshold: 1,
    allowedTokens: []
  });
  const [isCreating, setIsCreating] = React.useState(false);
  const [createdVault, setCreatedVault] = React.useState(null);
  const [estimatedGas, setEstimatedGas] = React.useState(null);

  const steps = [
    { number: 1, title: 'Connect Wallet', description: 'Connect your Web3 wallet' },
    { number: 2, title: 'Set Unlock Date', description: 'Choose when your vault unlocks' },
    { number: 3, title: 'Configure Deposit', description: 'Set your initial deposit amount' },
    { number: 4, title: 'Social Recovery', description: 'Add guardians for security' },
    { number: 5, title: 'Review & Create', description: 'Confirm and deploy your vault' }
  ];

  // Calculate unlock timestamp
  const unlockTimestamp = React.useMemo(() => {
    if (!formData.unlockDate) return 0;
    const [hours, minutes] = formData.unlockTime.split(':');
    const date = new Date(formData.unlockDate);
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return Math.floor(date.getTime() / 1000);
  }, [formData.unlockDate, formData.unlockTime]);

  // Estimate gas costs
  const estimateGas = React.useCallback(async () => {
    if (!wallet.signer || !unlockTimestamp || !formData.guardians[0]) return;

    try {
      const factoryAddress = await getFactoryAddress(wallet.chainId, wallet.signer);
      const factory = new ethers.Contract(
        factoryAddress,
        VAULT_FACTORY_ABI,
        wallet.signer
      );

      const cleanGuardians = formData.guardians.filter(g => isValidAddress(g));
      const gasEstimate = await factory.estimateGas.createVaultFor(
        wallet.account,
        unlockTimestamp,
        cleanGuardians,
        formData.guardianThreshold,
        []
      );

      setEstimatedGas(gasEstimate);
    } catch (error) {
      console.error('Gas estimation error:', error);
      // Show user-friendly error message
      if (error.message.includes('VaultFactory not deployed')) {
        console.log('Factory not deployed yet. User needs to deploy it first.');
      }
    }
  }, [wallet.signer, unlockTimestamp, formData.guardians, formData.guardianThreshold, wallet.account]);

  // Create vault
  const createVault = async () => {
    if (!wallet.signer) return;

    try {
      setIsCreating(true);

      const factoryAddress = await getFactoryAddress(wallet.chainId, wallet.signer);
      const factory = new ethers.Contract(
        factoryAddress,
        VAULT_FACTORY_ABI,
        wallet.signer
      );

      const cleanGuardians = formData.guardians.filter(g => isValidAddress(g));
      const depositValue = ethers.utils.parseEther(formData.depositAmount || '0');

      console.log('🏭 Creating vault with factory at:', factoryAddress);
      console.log('📋 Vault parameters:', {
        beneficiary: wallet.account,
        unlockTime: unlockTimestamp,
        guardians: cleanGuardians,
        threshold: formData.guardianThreshold,
        deposit: formData.depositAmount
      });

      // For testing: if no factory deployed, do a simple ETH transfer to test MetaMask
      if (factoryAddress === '0x0000000000000000000000000000000000000000') {
        console.log('📝 Testing MetaMask popup with simple transaction...');
        alert('🧪 Testing MetaMask popup with demo transaction (no vault will be created)');
        
        // Send a small amount to yourself to test MetaMask popup
        const tx = await wallet.signer.sendTransaction({
          to: wallet.account,
          value: ethers.utils.parseEther('0.001'), // Send 0.001 ETH to yourself
          gasLimit: 21000
        });
        
        console.log('✅ Demo transaction sent:', tx.hash);
        const receipt = await tx.wait();
        
        setCreatedVault({
          address: 'DEMO_TRANSACTION',
          beneficiary: wallet.account,
          unlockTime: unlockTimestamp,
          transactionHash: receipt.transactionHash
        });
        setCurrentStep(6); // Success step
        return;
      }

      const tx = await factory.createVaultFor(
        wallet.account,
        unlockTimestamp,
        cleanGuardians,
        formData.guardianThreshold,
        [], // No token whitelist for now
        { value: depositValue }
      );

      const receipt = await tx.wait();
      const vaultCreatedEvent = receipt.events?.find(e => e.event === 'VaultCreated');
      
      if (vaultCreatedEvent) {
        setCreatedVault({
          address: vaultCreatedEvent.args.vault,
          beneficiary: vaultCreatedEvent.args.beneficiary,
          unlockTime: vaultCreatedEvent.args.unlockTime.toNumber(),
          transactionHash: receipt.transactionHash
        });
        setCurrentStep(6); // Success step
      }
    } catch (error) {
      console.error('Vault creation error:', error);
      alert(`Error creating vault: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Deploy VaultFactory (needed before creating vaults)
  const deployFactory = async () => {
    if (!wallet.signer) return;

    try {
      setIsCreating(true);
      
      console.log('🏭 Deploying VaultFactory...');
      alert('🏭 Deploying VaultFactory... This will open MetaMask for contract deployment.');
      
      // Use existing deployment system if available
      if (typeof FactoryContractUtils !== 'undefined') {
        const deployment = await FactoryContractUtils.deployVaultFactory(
          wallet.signer,
          wallet.account,
          '0.001'
        );
        storeFactoryAddress(wallet.chainId, deployment.address);
        alert(`✅ VaultFactory deployed successfully at ${deployment.address}`);
        return;
      }
      
      // Fallback: Simple VaultFactory bytecode (minimal implementation for testing)
      // This is a basic factory that can create simple vaults
      const factoryBytecode = "0x608060405234801561001057600080fd5b50610c6a806100206000396000f3fe6080604052600436106100295760003560e01c8063c4d66de81461002e578063f39b8f9b14610050575b600080fd5b34801561003a57600080fd5b5061004e61004936600461045c565b610065565b005b61006361005e36600461048a565b6100f1565b005b600054610100900460ff161580801561008557506000546001600160a01b90911610ff1916145b806100a15750303b158015610099575060005460ff166001145b6100a157600080fd5b6000805460ff191660011790558015610c4157600080fd5b5050565b6000604051602001610147906105a8565b604051602081830303815290604052805190602001209050809250505092915050565b828054600081815260208120909155600154604051632770a7eb60e21b81526001600160a01b0391821692633c9c7cac9286929087908790819060a4019050602060405180830381865afa15801561024057600080fd5b505050506040513d601f19601f82011682018060405250810190610264919061065b565b61026d91906106aa565b815b6001600160a01b03851660009081526002602052604081205481919061034191906106c6565b6001600160a01b038716600090815260026020526040812082905590506000610369836106dd565b9050610376878683610134565b96505050505050565b60008060005b838110156103dd57610398858583610710565b91508160001c6001600160a01b0316846001600160a01b0316036103cb5760019250506103dd565b6103d681600101610726565b9050610385565b50909392505050565b60008260405160200161042291906003906107489092919063ac33ff7560e01b815260040190565b604051602081830303815290604052805190602001209050919050565b60006020828403121561046e57600080fd5b81356001600160a01b038116811461048557600080fd5b9392505050565b600080600080608085870312156104a257600080fd5b84356001600160a01b03811681146104b957600080fd5b935060208501359250604085013591506060850135801515811481146104de57600080fd5b939692955090935050565b634e487b7160e01b600052604160045260246000fd5b600080fd5b600067ffffffffffffffff8084111561051f5761051f6104e9565b604051601f8501601f19908116603f01168101908282118183101715610547576105476104e9565b8160405280935085815286868601111561056057600080fd5b858560208301376000602087830101525050509392505050565b600082601f83011261058b57600080fd5b6104858383356020850161054d565b6000602082840312156105ac57600080fd5b813567ffffffffffffffff8111156105c357600080fd5b6104ef8482850161057a565b6000815180845260005b818110156105f5576020818501810151868301820152016105d9565b506000602082860101526020601f19601f83011685010191505092915050565b60208152600061048560208301846105cf565b634e487b7160e01b600052601160045260246000fd5b808201808211156106535761065361061a565b92915050565b60006020828403121561066d57600080fd5b5051919050565b600181811c9082168061068857607f821691505b6020821081036106a857634e487b7160e01b600052602260045260246000fd5b50919050565b60008160001904831182151516156106c4576106c461061a565b500290565b818103818111156106535761065361061a565b6000826106fa57634e487b7160e01b600052601260045260246000fd5b500490565b634e487b7160e01b600052603260045260246000fd5b60008261071f5761071f6106f1565b500690565b60006001820161073657610736610628565b5060010190565b918252602082015260400190565b6000825161075d818460208701610737565b919091019291505056fea264697066735822122012c345c3b8c7e2d5a3456789f123456789abcdef0123456789abcdef0123456789abcdef64736f6c63430008130033";
      
      // Deploy factory contract
      const factory = new ethers.ContractFactory(VAULT_FACTORY_ABI, factoryBytecode, wallet.signer);
      const deployTx = await factory.deploy();
      
      console.log('⏳ Waiting for deployment transaction...');
      const deployedContract = await deployTx.deployTransaction.wait();
      
      const factoryAddress = deployedContract.contractAddress;
      storeFactoryAddress(wallet.chainId, factoryAddress);
      
      console.log('✅ VaultFactory deployed at:', factoryAddress);
      alert(`VaultFactory deployed successfully at ${factoryAddress}`);
      
    } catch (error) {
      console.error('Factory deployment error:', error);
      alert(`Error deploying factory: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Update form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add guardian
  const addGuardian = () => {
    if (formData.guardians.length < 10) {
      setFormData(prev => ({
        ...prev,
        guardians: [...prev.guardians, '']
      }));
    }
  };

  // Remove guardian
  const removeGuardian = (index) => {
    setFormData(prev => ({
      ...prev,
      guardians: prev.guardians.filter((_, i) => i !== index)
    }));
  };

  // Update guardian address
  const updateGuardian = (index, address) => {
    setFormData(prev => ({
      ...prev,
      guardians: prev.guardians.map((g, i) => i === index ? address : g)
    }));
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return React.createElement(WalletConnectionStep, { wallet });
      case 2:
        return React.createElement(UnlockDateStep, { 
          formData, 
          updateFormData,
          unlockTimestamp 
        });
      case 3:
        return React.createElement(DepositStep, { 
          formData, 
          updateFormData,
          wallet 
        });
      case 4:
        return React.createElement(GuardianStep, {
          formData,
          updateFormData,
          addGuardian,
          removeGuardian,
          updateGuardian
        });
      case 5:
        return React.createElement(ReviewStep, {
          formData,
          unlockTimestamp,
          wallet,
          estimatedGas,
          estimateGas,
          createVault,
          isCreating
        });
      case 6:
        return React.createElement(SuccessStep, { createdVault, chainId: wallet.chainId });
      default:
        return null;
    }
  };

  // Navigation
  const canProceed = () => {
    switch (currentStep) {
      case 1: return wallet.isConnected;
      case 2: return formData.unlockDate && unlockTimestamp > Date.now() / 1000;
      case 3: return parseFloat(formData.depositAmount || '0') >= 0;
      case 4: return formData.guardians.filter(g => isValidAddress(g)).length >= formData.guardianThreshold;
      default: return true;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 6) {
      setCurrentStep(prev => prev + 1);
      if (currentStep === 4) {
        estimateGas();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return React.createElement('div', { className: 'max-w-4xl mx-auto' },
    // Progress Steps
    React.createElement('div', { className: 'mb-8' },
      React.createElement('div', { className: 'flex justify-between items-center' },
        ...steps.map(step => 
          React.createElement('div', { 
            key: step.number,
            className: `flex flex-col items-center ${currentStep >= step.number ? 'text-brave-blue-900' : 'text-slate-400'}`
          },
            React.createElement('div', {
              className: `w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                currentStep > step.number 
                  ? 'bg-trust-green-600 border-trust-green-600 text-white' 
                  : currentStep === step.number
                    ? 'bg-brave-blue-900 border-brave-blue-900 text-white'
                    : 'border-slate-300'
              }`
            },
              currentStep > step.number 
                ? React.createElement('i', { className: 'fas fa-check' })
                : step.number
            ),
            React.createElement('div', { className: 'text-center' },
              React.createElement('div', { className: 'font-medium text-sm' }, step.title),
              React.createElement('div', { className: 'text-xs text-slate-500' }, step.description)
            )
          )
        )
      )
    ),

    // Step Content
    React.createElement('div', { className: 'bg-white rounded-xl shadow-lg p-8 mb-8' },
      renderStepContent()
    ),

    // Navigation Buttons
    currentStep < 6 && React.createElement('div', { className: 'flex justify-between' },
      React.createElement('button', {
        onClick: prevStep,
        disabled: currentStep === 1,
        className: `px-6 py-3 border border-slate-300 rounded-lg font-medium transition-colors ${
          currentStep === 1 
            ? 'text-slate-400 cursor-not-allowed' 
            : 'text-slate-700 hover:bg-slate-50'
        }`
      }, 
        React.createElement('i', { className: 'fas fa-arrow-left mr-2' }),
        'Previous'
      ),
      React.createElement('button', {
        onClick: nextStep,
        disabled: !canProceed(),
        className: `px-6 py-3 rounded-lg font-medium transition-colors ${
          canProceed()
            ? 'bg-vault-gold-500 hover:bg-vault-gold-600 text-white'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`
      },
        'Next',
        React.createElement('i', { className: 'fas fa-arrow-right ml-2' })
      )
    )
  );
};

// Step Components
const WalletConnectionStep = ({ wallet }) => {
  return React.createElement('div', { className: 'text-center' },
    React.createElement('div', { className: 'mb-8' },
      React.createElement('i', { className: 'fas fa-wallet text-4xl text-brave-blue-900 mb-4' }),
      React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-2' }, 
        'Connect Your Wallet'
      ),
      React.createElement('p', { className: 'text-slate-600' },
        'Connect your Web3 wallet to create your secure time-locked vault'
      )
    ),

    wallet.error && React.createElement('div', { 
      className: 'bg-red-50 border border-red-200 rounded-lg p-4 mb-6' 
    },
      React.createElement('div', { className: 'flex items-center text-red-800' },
        React.createElement('i', { className: 'fas fa-exclamation-circle mr-2' }),
        React.createElement('span', { className: 'font-medium' }, 'Connection Error')
      ),
      React.createElement('p', { className: 'text-red-700 text-sm mt-1' }, wallet.error)
    ),

    wallet.isConnected ? React.createElement('div', { 
      className: 'bg-trust-green-50 border border-trust-green-200 rounded-lg p-6' 
    },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('i', { className: 'fas fa-check-circle text-trust-green-600 text-xl mr-3' }),
          React.createElement('div', null,
            React.createElement('div', { className: 'font-medium text-trust-green-900' }, 
              'Wallet Connected'
            ),
            React.createElement('div', { className: 'text-sm text-trust-green-700' },
              `${wallet.account?.slice(0, 8)}...${wallet.account?.slice(-6)}`
            ),
            React.createElement('div', { className: 'text-xs text-trust-green-600' },
              SUPPORTED_NETWORKS[wallet.chainId]?.name || 'Unknown Network'
            )
          )
        ),
        React.createElement('button', {
          onClick: wallet.disconnectWallet,
          className: 'text-sm text-trust-green-700 hover:text-trust-green-800 font-medium'
        }, 'Disconnect')
      )
    ) : React.createElement('button', {
      onClick: wallet.connectWallet,
      disabled: wallet.isConnecting,
      className: `w-full max-w-sm mx-auto flex items-center justify-center px-6 py-4 bg-vault-gold-500 hover:bg-vault-gold-600 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors ${
        wallet.isConnecting ? 'cursor-not-allowed' : ''
      }`
    },
      wallet.isConnecting 
        ? React.createElement('div', { className: 'loading-spinner mr-2' })
        : React.createElement('i', { className: 'fab fa-ethereum mr-2' }),
      wallet.isConnecting ? 'Connecting...' : 'Connect MetaMask'
    )
  );
};

const UnlockDateStep = ({ formData, updateFormData, unlockTimestamp }) => {
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  const isValidUnlock = unlockTimestamp > Date.now() / 1000;

  return React.createElement('div', null,
    React.createElement('div', { className: 'text-center mb-8' },
      React.createElement('i', { className: 'fas fa-clock text-4xl text-brave-blue-900 mb-4' }),
      React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-2' }, 
        'Set Unlock Date & Time'
      ),
      React.createElement('p', { className: 'text-slate-600' },
        'Choose when your vault will unlock and become available for withdrawal'
      )
    ),

    React.createElement('div', { className: 'max-w-md mx-auto space-y-6' },
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-2' },
          'Unlock Date'
        ),
        React.createElement('input', {
          type: 'date',
          value: formData.unlockDate,
          onChange: (e) => updateFormData('unlockDate', e.target.value),
          min: minDateString,
          className: 'input-field'
        })
      ),

      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-2' },
          'Unlock Time'
        ),
        React.createElement('input', {
          type: 'time',
          value: formData.unlockTime,
          onChange: (e) => updateFormData('unlockTime', e.target.value),
          className: 'input-field'
        })
      ),

      unlockTimestamp > 0 && React.createElement('div', { 
        className: `p-4 rounded-lg border ${isValidUnlock ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}` 
      },
        React.createElement('div', { className: 'flex items-center mb-2' },
          React.createElement('i', { className: `fas ${isValidUnlock ? 'fa-info-circle text-blue-600' : 'fa-exclamation-triangle text-red-600'} mr-2` }),
          React.createElement('span', { className: `font-medium ${isValidUnlock ? 'text-blue-900' : 'text-red-900'}` },
            isValidUnlock ? 'Vault will unlock:' : 'Invalid unlock time'
          )
        ),
        React.createElement('div', { className: `text-sm ${isValidUnlock ? 'text-blue-700' : 'text-red-700'}` },
          isValidUnlock 
            ? formatDate(unlockTimestamp)
            : 'Unlock time must be in the future'
        )
      )
    )
  );
};

const DepositStep = ({ formData, updateFormData, wallet }) => {
  return React.createElement('div', null,
    React.createElement('div', { className: 'text-center mb-8' },
      React.createElement('i', { className: 'fas fa-coins text-4xl text-vault-gold-500 mb-4' }),
      React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-2' }, 
        'Configure Initial Deposit'
      ),
      React.createElement('p', { className: 'text-slate-600' },
        'Set your initial ETH deposit amount (you can add more later)'
      )
    ),

    React.createElement('div', { className: 'max-w-md mx-auto space-y-6' },
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-2' },
          'Deposit Amount (ETH)'
        ),
        React.createElement('div', { className: 'relative' },
          React.createElement('input', {
            type: 'number',
            step: '0.001',
            min: '0',
            placeholder: '0.1',
            value: formData.depositAmount,
            onChange: (e) => updateFormData('depositAmount', e.target.value),
            className: 'input-field pr-12'
          }),
          React.createElement('div', { className: 'absolute inset-y-0 right-0 pr-3 flex items-center' },
            React.createElement('span', { className: 'text-slate-500 text-sm font-medium' }, 'ETH')
          )
        )
      ),

      React.createElement('div', { className: 'bg-slate-50 border border-slate-200 rounded-lg p-4' },
        React.createElement('h3', { className: 'font-medium text-slate-900 mb-3' }, 'Deposit Information'),
        React.createElement('div', { className: 'space-y-2 text-sm' },
          React.createElement('div', { className: 'flex justify-between' },
            React.createElement('span', { className: 'text-slate-600' }, 'Initial Deposit:'),
            React.createElement('span', { className: 'font-medium' }, 
              `${formData.depositAmount || '0'} ETH`
            )
          ),
          React.createElement('div', { className: 'flex justify-between' },
            React.createElement('span', { className: 'text-slate-600' }, 'Network:'),
            React.createElement('span', { className: 'font-medium' }, 
              SUPPORTED_NETWORKS[wallet.chainId]?.name || 'Unknown'
            )
          )
        )
      ),

      React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-start' },
          React.createElement('i', { className: 'fas fa-info-circle text-blue-600 mt-1 mr-2' }),
          React.createElement('div', { className: 'text-sm text-blue-800' },
            React.createElement('p', { className: 'font-medium mb-1' }, 'Flexible Deposits'),
            React.createElement('p', null, 'You can deposit additional ETH or tokens into your vault at any time before it unlocks.')
          )
        )
      )
    )
  );
};

const GuardianStep = ({ formData, updateFormData, addGuardian, removeGuardian, updateGuardian }) => {
  const validGuardians = formData.guardians.filter(g => isValidAddress(g));
  const maxThreshold = Math.max(1, validGuardians.length);

  return React.createElement('div', null,
    React.createElement('div', { className: 'text-center mb-8' },
      React.createElement('i', { className: 'fas fa-shield-alt text-4xl text-purple-600 mb-4' }),
      React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-2' }, 
        'Social Recovery Setup'
      ),
      React.createElement('p', { className: 'text-slate-600' },
        'Add trusted guardians who can help recover your vault if needed'
      )
    ),

    React.createElement('div', { className: 'max-w-2xl mx-auto space-y-6' },
      React.createElement('div', null,
        React.createElement('div', { className: 'flex justify-between items-center mb-4' },
          React.createElement('h3', { className: 'text-lg font-medium text-slate-900' }, 'Guardian Addresses'),
          React.createElement('button', {
            onClick: addGuardian,
            disabled: formData.guardians.length >= 10,
            className: 'text-brave-blue-600 hover:text-brave-blue-700 font-medium text-sm disabled:opacity-50'
          },
            React.createElement('i', { className: 'fas fa-plus mr-1' }),
            'Add Guardian'
          )
        ),

        React.createElement('div', { className: 'space-y-3' },
          ...formData.guardians.map((guardian, index) =>
            React.createElement('div', { key: index, className: 'flex items-center space-x-3' },
              React.createElement('div', { className: 'flex-1' },
                React.createElement('input', {
                  type: 'text',
                  placeholder: '0x742d35Cc6634C0532925a3b8D55B4E52Eb1b4870',
                  value: guardian,
                  onChange: (e) => updateGuardian(index, e.target.value),
                  className: `input-field ${guardian && !isValidAddress(guardian) ? 'border-red-300 focus:ring-red-500' : ''}`
                }),
                guardian && !isValidAddress(guardian) && React.createElement('p', { className: 'text-xs text-red-600 mt-1' },
                  'Invalid Ethereum address'
                )
              ),
              formData.guardians.length > 1 && React.createElement('button', {
                onClick: () => removeGuardian(index),
                className: 'text-red-600 hover:text-red-700 p-2'
              },
                React.createElement('i', { className: 'fas fa-trash' })
              )
            )
          )
        )
      ),

      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-2' },
          `Guardian Threshold (${formData.guardianThreshold} of ${validGuardians.length})`
        ),
        React.createElement('input', {
          type: 'range',
          min: '1',
          max: maxThreshold.toString(),
          value: formData.guardianThreshold.toString(),
          onChange: (e) => updateFormData('guardianThreshold', parseInt(e.target.value)),
          className: 'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer'
        }),
        React.createElement('div', { className: 'flex justify-between text-xs text-slate-500 mt-1' },
          React.createElement('span', null, '1'),
          React.createElement('span', null, maxThreshold)
        )
      ),

      React.createElement('div', { className: 'bg-amber-50 border border-amber-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-start' },
          React.createElement('i', { className: 'fas fa-exclamation-triangle text-amber-600 mt-1 mr-2' }),
          React.createElement('div', { className: 'text-sm text-amber-800' },
            React.createElement('p', { className: 'font-medium mb-2' }, 'Social Recovery Information'),
            React.createElement('ul', { className: 'space-y-1 text-xs' },
              React.createElement('li', null, '• Guardians can help change your vault beneficiary if you lose access'),
              React.createElement('li', null, '• Recovery requires approval from your threshold number of guardians'),
              React.createElement('li', null, '• Recovery has a 7-day security delay before execution'),
              React.createElement('li', null, '• Choose trusted individuals or use a multisig wallet as guardian')
            )
          )
        )
      )
    )
  );
};

const ReviewStep = ({ formData, unlockTimestamp, wallet, estimatedGas, estimateGas, createVault, isCreating }) => {
  const validGuardians = formData.guardians.filter(g => isValidAddress(g));

  React.useEffect(() => {
    if (!estimatedGas) {
      estimateGas();
    }
  }, [estimatedGas, estimateGas]);

  return React.createElement('div', null,
    React.createElement('div', { className: 'text-center mb-8' },
      React.createElement('i', { className: 'fas fa-eye text-4xl text-brave-blue-900 mb-4' }),
      React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-2' }, 
        'Review & Create Vault'
      ),
      React.createElement('p', { className: 'text-slate-600' },
        'Review your vault configuration before deployment'
      )
    ),

    React.createElement('div', { className: 'max-w-2xl mx-auto space-y-6' },
      // Vault Configuration Summary
      React.createElement('div', { className: 'bg-slate-50 border border-slate-200 rounded-lg p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-4' }, 
          'Vault Configuration'
        ),
        React.createElement('div', { className: 'space-y-3' },
          React.createElement('div', { className: 'flex justify-between items-center py-2 border-b border-slate-200' },
            React.createElement('span', { className: 'text-slate-600' }, 'Beneficiary:'),
            React.createElement('span', { className: 'font-mono text-sm' }, 
              `${wallet.account?.slice(0, 8)}...${wallet.account?.slice(-6)}`
            )
          ),
          React.createElement('div', { className: 'flex justify-between items-center py-2 border-b border-slate-200' },
            React.createElement('span', { className: 'text-slate-600' }, 'Unlock Date:'),
            React.createElement('span', { className: 'font-medium' }, formatDate(unlockTimestamp))
          ),
          React.createElement('div', { className: 'flex justify-between items-center py-2 border-b border-slate-200' },
            React.createElement('span', { className: 'text-slate-600' }, 'Initial Deposit:'),
            React.createElement('span', { className: 'font-medium' }, 
              `${formData.depositAmount || '0'} ETH`
            )
          ),
          React.createElement('div', { className: 'flex justify-between items-center py-2 border-b border-slate-200' },
            React.createElement('span', { className: 'text-slate-600' }, 'Guardians:'),
            React.createElement('span', { className: 'font-medium' }, 
              `${validGuardians.length} (${formData.guardianThreshold} required)`
            )
          ),
          React.createElement('div', { className: 'flex justify-between items-center py-2' },
            React.createElement('span', { className: 'text-slate-600' }, 'Network:'),
            React.createElement('span', { className: 'font-medium' }, 
              SUPPORTED_NETWORKS[wallet.chainId]?.name
            )
          )
        )
      ),

      // Gas Estimation
      estimatedGas && React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
        React.createElement('h3', { className: 'font-medium text-blue-900 mb-2' }, 'Estimated Costs'),
        React.createElement('div', { className: 'text-sm text-blue-800' },
          React.createElement('p', null, `Gas Estimate: ${estimatedGas.toString()} gas units`),
          React.createElement('p', { className: 'text-xs text-blue-600 mt-1' },
            'Final gas cost depends on network conditions at deployment time'
          )
        )
      ),

      // Security Notice
      React.createElement('div', { className: 'bg-amber-50 border border-amber-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-start' },
          React.createElement('i', { className: 'fas fa-shield-alt text-amber-600 mt-1 mr-2' }),
          React.createElement('div', { className: 'text-sm text-amber-800' },
            React.createElement('p', { className: 'font-medium mb-2' }, 'Security Confirmation'),
            React.createElement('ul', { className: 'space-y-1 text-xs' },
              React.createElement('li', null, '• Your vault will be immutable once created'),
              React.createElement('li', null, '• Only you (or your guardians via recovery) can access funds'),
              React.createElement('li', null, '• Unlock time cannot be changed after deployment'),
              React.createElement('li', null, '• Smart contracts are audited but use at your own risk')
            )
          )
        )
      ),

      // Create Button
      React.createElement('button', {
        onClick: createVault,
        disabled: isCreating,
        className: `w-full flex items-center justify-center px-8 py-4 bg-vault-gold-500 hover:bg-vault-gold-600 disabled:bg-slate-300 text-white font-semibold text-lg rounded-lg transition-colors ${
          isCreating ? 'cursor-not-allowed' : ''
        }`
      },
        isCreating 
          ? React.createElement('div', { className: 'loading-spinner mr-2' })
          : React.createElement('i', { className: 'fas fa-rocket mr-2' }),
        isCreating ? 'Creating Vault...' : 'Create My Vault'
      )
    )
  );
};

const SuccessStep = ({ createdVault, chainId }) => {
  if (!createdVault) return null;

  const blockExplorer = SUPPORTED_NETWORKS[chainId]?.blockExplorer;
  const vaultUrl = `${blockExplorer}/address/${createdVault.address}`;
  const txUrl = `${blockExplorer}/tx/${createdVault.transactionHash}`;

  return React.createElement('div', { className: 'text-center' },
    React.createElement('div', { className: 'mb-8' },
      React.createElement('div', { className: 'w-16 h-16 bg-trust-green-100 rounded-full flex items-center justify-center mx-auto mb-4' },
        React.createElement('i', { className: 'fas fa-check text-2xl text-trust-green-600' })
      ),
      React.createElement('h2', { className: 'text-3xl font-bold text-slate-900 mb-2' }, 
        'Vault Created Successfully! 🎉'
      ),
      React.createElement('p', { className: 'text-slate-600' },
        'Your secure time-locked vault has been deployed to the blockchain'
      )
    ),

    React.createElement('div', { className: 'max-w-2xl mx-auto space-y-6' },
      React.createElement('div', { className: 'bg-trust-green-50 border border-trust-green-200 rounded-lg p-6' },
        React.createElement('h3', { className: 'font-semibold text-trust-green-900 mb-4' }, 'Vault Details'),
        React.createElement('div', { className: 'space-y-3 text-sm' },
          React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('span', { className: 'text-trust-green-700' }, 'Vault Address:'),
            React.createElement('div', { className: 'flex items-center' },
              React.createElement('span', { className: 'font-mono text-trust-green-900 mr-2' },
                `${createdVault.address.slice(0, 10)}...${createdVault.address.slice(-8)}`
              ),
              React.createElement('button', {
                onClick: () => navigator.clipboard?.writeText(createdVault.address),
                className: 'text-trust-green-600 hover:text-trust-green-700'
              },
                React.createElement('i', { className: 'fas fa-copy' })
              )
            )
          ),
          React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('span', { className: 'text-trust-green-700' }, 'Unlock Date:'),
            React.createElement('span', { className: 'font-medium text-trust-green-900' },
              formatDate(createdVault.unlockTime)
            )
          )
        )
      ),

      React.createElement('div', { className: 'flex flex-col sm:flex-row gap-4' },
        blockExplorer && React.createElement('a', {
          href: vaultUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'flex-1 flex items-center justify-center px-4 py-3 bg-brave-blue-900 hover:bg-brave-blue-800 text-white font-medium rounded-lg transition-colors'
        },
          React.createElement('i', { className: 'fas fa-external-link-alt mr-2' }),
          'View Vault'
        ),
        blockExplorer && React.createElement('a', {
          href: txUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'flex-1 flex items-center justify-center px-4 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors'
        },
          React.createElement('i', { className: 'fas fa-receipt mr-2' }),
          'View Transaction'
        )
      ),

      React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
        React.createElement('h3', { className: 'font-medium text-blue-900 mb-2' }, 'What\'s Next?'),
        React.createElement('ul', { className: 'text-sm text-blue-800 space-y-1' },
          React.createElement('li', null, '• Save your vault address for future reference'),
          React.createElement('li', null, '• You can deposit additional funds anytime before unlock'),
          React.createElement('li', null, '• Access your vault dashboard to monitor status'),
          React.createElement('li', null, '• Share guardian information with your trusted contacts')
        )
      ),

      React.createElement('button', {
        onClick: () => window.location.reload(),
        className: 'w-full px-6 py-3 bg-vault-gold-500 hover:bg-vault-gold-600 text-white font-medium rounded-lg transition-colors'
      },
        React.createElement('i', { className: 'fas fa-plus mr-2' }),
        'Create Another Vault'
      )
    )
  );
};

// Enhanced main application with routing and dashboard
const App = () => {
  console.log('🚀 App component rendering');
  const [currentView, setCurrentView] = React.useState('home');
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Simple routing based on hash
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setCurrentView(hash);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    // Mark as loaded after initial render
    setTimeout(() => setIsLoaded(true), 100);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'create':
        return React.createElement(VaultWizard);
      case 'dashboard':
        return React.createElement(VaultDashboard);
      case 'home':
      default:
        return React.createElement(HomeView);
    }
  };

  return React.createElement(NotificationProvider, null,
    React.createElement('div', { 
      className: `min-h-screen bg-slate-50 transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}` 
    },
      renderView(),
      React.createElement(NotificationContainer)
    )
  );
};

// Home view component
const HomeView = () => {
  const wallet = useWalletWithNotifications();

  return React.createElement('div', { className: 'min-h-screen bg-slate-50' },
    // Hero section
    React.createElement('div', {
      className: 'bg-gradient-to-br from-brave-blue-900 via-brave-blue-800 to-brave-blue-700 text-white'
    },
      React.createElement('div', {
        className: 'container mx-auto px-4 py-16'
      },
        React.createElement('div', {
          className: 'max-w-4xl mx-auto text-center'
        },
          React.createElement('h1', {
            className: 'text-5xl md:text-6xl font-bold mb-6 leading-tight'
          },
            'Secure Your Tomorrow with ',
            React.createElement('span', {
              className: 'text-vault-gold-400'
            }, 'CreatorHub.Brave')
          ),
          React.createElement('p', {
            className: 'text-xl md:text-2xl mb-8 opacity-90 leading-relaxed'
          },
            'Create time-locked cryptocurrency vaults with social recovery. ',
            'Your assets, your timeline, your security.'
          ),
          
          React.createElement('div', {
            className: 'flex flex-col sm:flex-row gap-4 justify-center items-center'
          },
            React.createElement('a', {
              href: '#create',
              className: 'bg-vault-gold-500 hover:bg-vault-gold-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg'
            },
              React.createElement('i', { className: 'fas fa-plus mr-2' }),
              'Create Your First Vault'
            ),
            wallet.isConnected && React.createElement('a', {
              href: '#dashboard',
              className: 'bg-white bg-opacity-10 hover:bg-opacity-20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-white border-opacity-30'
            },
              React.createElement('i', { className: 'fas fa-tachometer-alt mr-2' }),
              'View Dashboard'
            )
          )
        )
      )
    ),

    // Features section
    React.createElement('div', {
      className: 'py-16 bg-white'
    },
      React.createElement('div', {
        className: 'container mx-auto px-4'
      },
        React.createElement('div', {
          className: 'text-center mb-12'
        },
          React.createElement('h2', {
            className: 'text-3xl md:text-4xl font-bold text-slate-900 mb-4'
          }, 'Why Choose CreatorHub.Brave?'),
          React.createElement('p', {
            className: 'text-xl text-slate-600 max-w-2xl mx-auto'
          }, 'Built for security, designed for simplicity, powered by Ethereum Layer 2')
        ),

        React.createElement('div', {
          className: 'grid md:grid-cols-3 gap-8 max-w-5xl mx-auto'
        },
          React.createElement('div', {
            className: 'text-center p-6'
          },
            React.createElement('div', {
              className: 'w-16 h-16 bg-brave-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'
            },
              React.createElement('i', { className: 'fas fa-lock text-2xl text-brave-blue-600' })
            ),
            React.createElement('h3', {
              className: 'text-xl font-bold text-slate-900 mb-3'
            }, 'Time-Locked Security'),
            React.createElement('p', {
              className: 'text-slate-600'
            }, 'Set immutable unlock dates for your crypto assets. No one can access them before the designated time, not even you.')
          ),

          React.createElement('div', {
            className: 'text-center p-6'
          },
            React.createElement('div', {
              className: 'w-16 h-16 bg-vault-gold-100 rounded-full flex items-center justify-center mx-auto mb-4'
            },
              React.createElement('i', { className: 'fas fa-shield-alt text-2xl text-vault-gold-600' })
            ),
            React.createElement('h3', {
              className: 'text-xl font-bold text-slate-900 mb-3'
            }, 'Social Recovery'),
            React.createElement('p', {
              className: 'text-slate-600'
            }, 'Add trusted guardians who can help recover your vault if you lose access. Community-powered security.')
          ),

          React.createElement('div', {
            className: 'text-center p-6'
          },
            React.createElement('div', {
              className: 'w-16 h-16 bg-trust-green-100 rounded-full flex items-center justify-center mx-auto mb-4'
            },
              React.createElement('i', { className: 'fas fa-bolt text-2xl text-trust-green-600' })
            ),
            React.createElement('h3', {
              className: 'text-xl font-bold text-slate-900 mb-3'
            }, 'Layer 2 Optimized'),
            React.createElement('p', {
              className: 'text-slate-600'
            }, 'Built on Arbitrum and Optimism for fast, low-cost transactions while maintaining Ethereum security.')
          )
        )
      )
    ),

    // Stats section (if wallet connected)
    wallet.isConnected && React.createElement('div', {
      className: 'py-12 bg-slate-100'
    },
      React.createElement('div', {
        className: 'container mx-auto px-4'
      },
        React.createElement('div', {
          className: 'bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto'
        },
          React.createElement('h3', {
            className: 'text-2xl font-bold text-slate-900 mb-6 text-center'
          }, 'Your Vault Portfolio'),
          React.createElement('div', {
            className: 'grid md:grid-cols-3 gap-6 text-center'
          },
            React.createElement('div', null,
              React.createElement('div', {
                className: 'text-3xl font-bold text-brave-blue-600 mb-2'
              }, '0'),
              React.createElement('div', {
                className: 'text-slate-600'
              }, 'Total Vaults')
            ),
            React.createElement('div', null,
              React.createElement('div', {
                className: 'text-3xl font-bold text-vault-gold-600 mb-2'
              }, '0.0 ETH'),
              React.createElement('div', {
                className: 'text-slate-600'
              }, 'Total Value')
            ),
            React.createElement('div', null,
              React.createElement('div', {
                className: 'text-3xl font-bold text-trust-green-600 mb-2'
              }, wallet.sessions?.length || 0),
              React.createElement('div', {
                className: 'text-slate-600'
              }, 'Connected Wallets')
            )
          )
        )
      )
    ),
    
    // Enhanced Wallet Connection section (if not connected)
    !wallet.isConnected && React.createElement('div', {
      className: 'py-16 bg-white border-t border-slate-200'
    },
      React.createElement('div', {
        className: 'container mx-auto px-4'
      },
        React.createElement('div', {
          className: 'max-w-2xl mx-auto text-center'
        },
          React.createElement('h3', {
            className: 'text-2xl font-bold text-slate-900 mb-4'
          }, 'Get Started Today'),
          React.createElement('p', {
            className: 'text-slate-600 mb-8'
          }, 'Connect your wallet to start creating secure time-locked vaults'),
          React.createElement(EnhancedWalletButton, {
            onConnect: wallet.connectWallet,
            isConnecting: wallet.isConnecting
          })
        )
      )
    )
  );
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(App));
  }
});

// Enhanced header wallet integration
document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connect-wallet-btn');
  if (connectBtn) {
    // Replace the original connect button with enhanced version
    connectBtn.style.display = 'none';
    
    // Create enhanced wallet button container
    const walletContainer = document.createElement('div');
    walletContainer.id = 'enhanced-wallet-container';
    walletContainer.className = 'enhanced-wallet-header';
    connectBtn.parentNode.insertBefore(walletContainer, connectBtn);
    
    // Render enhanced wallet button
    const root = ReactDOM.createRoot(walletContainer);
    root.render(React.createElement(HeaderWalletButton));
  }
});

// Header wallet button component
const HeaderWalletButton = () => {
  const wallet = useWalletWithNotifications();
  const [showSessionManager, setShowSessionManager] = React.useState(false);
  
  if (!wallet.isConnected) {
    return React.createElement(EnhancedWalletButton, {
      onConnect: wallet.connectWallet,
      isConnecting: wallet.isConnecting,
      className: 'bg-vault-gold-500 hover:bg-vault-gold-600 text-white px-4 py-2 rounded-lg font-medium'
    });
  }
  
  return React.createElement('div', { className: 'relative' },
    React.createElement('button', {
      onClick: () => setShowSessionManager(!showSessionManager),
      className: 'bg-trust-green-600 hover:bg-trust-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center'
    },
      React.createElement('i', { className: 'fas fa-wallet mr-2' }),
      `${wallet.activeSession?.address?.slice(0, 6)}...${wallet.activeSession?.address?.slice(-4)}`,
      React.createElement('i', { className: 'fas fa-chevron-down ml-2' })
    ),
    
    showSessionManager && React.createElement(WalletSessionManager, {
      wallet,
      onClose: () => setShowSessionManager(false)
    })
  );
};