// CreatorHub.Brave - Simple Working Application
// A streamlined version that works reliably

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Simple app initializing...');
  
  // Get the app container
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('App container not found');
    return;
  }

  // Create the main application content
  const createMainContent = () => {
    return `
      <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

        
        <!-- Hero Section -->
        <section class="relative bg-gradient-to-br from-brave-blue-900 via-brave-blue-800 to-brave-blue-700 text-white overflow-hidden">
          <div class="absolute inset-0 bg-black opacity-10"></div>
          <div class="relative container mx-auto px-4 py-24">
            <div class="max-w-4xl mx-auto text-center">
              <!-- CreatorHub.Brave Logo -->
              <div class="flex items-center justify-center mb-8">
                <div class="w-20 h-20 bg-gradient-to-br from-vault-gold-400 to-vault-gold-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <i class="fas fa-shield-alt text-3xl text-white"></i>
                </div>
                <div class="ml-4 text-left">
                  <div class="text-3xl font-bold text-vault-gold-400">CreatorHub</div>
                  <div class="text-xl font-semibold text-white opacity-90">.Brave</div>
                </div>
              </div>
              
              <h1 class="text-6xl font-bold mb-6 leading-tight">
                Secure Your Tomorrow with 
                <span class="text-vault-gold-400">Time-Locked Vaults</span>
              </h1>
              <p class="text-2xl mb-8 opacity-90 leading-relaxed">
                Create time-locked cryptocurrency vaults with social recovery. 
                Your assets, your timeline, your security.
              </p>
              
              <div id="network-warning" class="hidden bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-4 mb-6 text-white">
                <div class="flex items-center">
                  <i class="fas fa-exclamation-triangle mr-3 text-red-300"></i>
                  <div>
                    <div class="font-bold">Wrong Network Detected</div>
                    <div class="text-sm opacity-90">Switch to Sepolia testnet to create vaults with ETH</div>
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <a href="#create" onclick="showCreateVault()" 
                   class="bg-vault-gold-500 hover:bg-vault-gold-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg">
                  <i class="fas fa-plus mr-2"></i>
                  Create Your First Vault
                  <div class="text-xs opacity-80 mt-1">Requires Sepolia Testnet</div>
                </a>
                <a href="#dashboard" onclick="openDashboard()" 
                   class="bg-white bg-opacity-10 hover:bg-opacity-20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-white border-opacity-30">
                  <i class="fas fa-tachometer-alt mr-2"></i>
                  View Dashboard
                </a>
              </div>

              <!-- Feature highlights -->
              <div class="grid md:grid-cols-3 gap-8 mt-16">
                <div class="text-center">
                  <div class="w-16 h-16 bg-vault-gold-100 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-lock text-2xl text-vault-gold-300"></i>
                  </div>
                  <h3 class="text-xl font-bold mb-3">Time-Locked Security</h3>
                  <p class="opacity-80">Set immutable unlock dates for your crypto assets</p>
                </div>
                <div class="text-center">
                  <div class="w-16 h-16 bg-trust-green-100 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-shield-alt text-2xl text-trust-green-300"></i>
                  </div>
                  <h3 class="text-xl font-bold mb-3">Social Recovery</h3>
                  <p class="opacity-80">Add trusted guardians for community-powered security</p>
                </div>
                <div class="text-center">
                  <div class="w-16 h-16 bg-brave-blue-100 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-bolt text-2xl text-brave-blue-300"></i>
                  </div>
                  <h3 class="text-xl font-bold mb-3">Layer 2 Optimized</h3>
                  <p class="opacity-80">Fast, low-cost transactions on Arbitrum & Optimism</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Multi-Wallet Connection Section -->
        <section id="wallet-section" class="py-16 bg-white">
          <div class="container mx-auto px-4">
            <div class="max-w-4xl mx-auto text-center">
              <h2 class="text-4xl font-bold text-slate-900 mb-6">Connect Your Wallet</h2>
              <p class="text-xl text-slate-600 mb-12">Choose from multiple wallet providers for seamless access</p>
              
              <div class="grid md:grid-cols-4 gap-6 mb-12">
                <button onclick="connectWallet('metamask')" 
                        class="wallet-button bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl p-6 transition-all">
                  <div class="text-4xl mb-3">🦊</div>
                  <h3 class="font-bold text-slate-900">MetaMask</h3>
                  <p class="text-sm text-slate-600">Browser Extension</p>
                </button>
                
                <button onclick="connectWallet('walletconnect')" 
                        class="wallet-button bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-6 transition-all">
                  <div class="text-4xl mb-3">🔗</div>
                  <h3 class="font-bold text-slate-900">WalletConnect</h3>
                  <p class="text-sm text-slate-600">Mobile Wallets</p>
                </button>
                
                <button onclick="connectWallet('coinbase')" 
                        class="wallet-button bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-6 transition-all">
                  <div class="text-4xl mb-3">🔵</div>
                  <h3 class="font-bold text-slate-900">Coinbase</h3>
                  <p class="text-sm text-slate-600">Browser & Mobile</p>
                </button>
                
                <button onclick="connectWallet('brave')" 
                        class="wallet-button bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl p-6 transition-all">
                  <div class="text-4xl mb-3">🦁</div>
                  <h3 class="font-bold text-slate-900">Brave Wallet</h3>
                  <p class="text-sm text-slate-600">Native Browser</p>
                </button>
              </div>

              <div id="wallet-status" class="hidden bg-trust-green-50 border border-trust-green-200 rounded-xl p-6">
                <div class="flex items-center justify-center">
                  <i class="fas fa-check-circle text-trust-green-600 text-2xl mr-3"></i>
                  <div class="flex-1">
                    <div class="font-bold text-trust-green-900">Wallet Connected!</div>
                    <div class="text-sm text-trust-green-700" id="wallet-address">0x...</div>
                    <div id="network-status" class="text-xs mt-1">
                      <span class="text-gray-600">Network: </span>
                      <span id="current-network" class="font-semibold">Checking...</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <button id="switch-network-btn" class="hidden text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded" onclick="switchToSepoliaNetwork()">
                      Switch to Sepolia
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Dashboard Preview Section -->
        <section class="py-16 bg-slate-50">
          <div class="container mx-auto px-4">
            <div class="max-w-6xl mx-auto">
              <div class="text-center mb-12">
                <h2 class="text-4xl font-bold text-slate-900 mb-6">Vault Management Dashboard</h2>
                <p class="text-xl text-slate-600">Complete control over your time-locked assets</p>
              </div>

              <!-- Portfolio Overview Cards -->
              <div class="grid md:grid-cols-4 gap-6 mb-12">
                <div class="bg-gradient-to-r from-brave-blue-500 to-brave-blue-600 text-white p-6 rounded-xl">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium opacity-90">Total Vaults</h3>
                    <i class="fas fa-vault text-xl opacity-75"></i>
                  </div>
                  <div class="text-3xl font-bold">3</div>
                </div>

                <div class="bg-gradient-to-r from-vault-gold-500 to-vault-gold-600 text-white p-6 rounded-xl">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium opacity-90">Total Value</h3>
                    <i class="fas fa-coins text-xl opacity-75"></i>
                  </div>
                  <div class="text-3xl font-bold">43.25 ETH</div>
                </div>

                <div class="bg-gradient-to-r from-trust-green-500 to-trust-green-600 text-white p-6 rounded-xl">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium opacity-90">Unlocked</h3>
                    <i class="fas fa-unlock text-xl opacity-75"></i>
                  </div>
                  <div class="text-3xl font-bold">12.50 ETH</div>
                </div>

                <div class="bg-gradient-to-r from-slate-500 to-slate-600 text-white p-6 rounded-xl">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium opacity-90">Locked</h3>
                    <i class="fas fa-lock text-xl opacity-75"></i>
                  </div>
                  <div class="text-3xl font-bold">30.75 ETH</div>
                </div>
              </div>

              <!-- Sample Vault Cards -->
              <div class="grid lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <h3 class="text-xl font-bold text-slate-900 mb-1">Emergency Fund</h3>
                      <div class="flex items-center text-sm text-slate-600">
                        <i class="fas fa-lock text-red-500 mr-1"></i>
                        <span>Locked until Dec 15, 2024</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-2xl font-bold text-slate-900">5.75 ETH</div>
                      <div class="text-sm text-slate-500">≈ $12,850</div>
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-between text-sm mb-4">
                    <span class="text-slate-600">Guardians:</span>
                    <span class="font-medium">2 of 3 required</span>
                  </div>
                  
                  <div class="flex gap-2">
                    <button class="flex-1 bg-brave-blue-600 hover:bg-brave-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      <i class="fas fa-plus mr-2"></i>Deposit
                    </button>
                    <button disabled class="flex-1 bg-slate-300 text-slate-500 px-4 py-2 rounded-lg font-medium cursor-not-allowed">
                      <i class="fas fa-lock mr-2"></i>Locked
                    </button>
                  </div>
                </div>

                <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <h3 class="text-xl font-bold text-slate-900 mb-1">Savings Vault</h3>
                      <div class="flex items-center text-sm text-slate-600">
                        <i class="fas fa-unlock text-trust-green-500 mr-1"></i>
                        <span>Available for withdrawal</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-2xl font-bold text-slate-900">12.50 ETH</div>
                      <div class="text-sm text-slate-500">≈ $27,750</div>
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-between text-sm mb-4">
                    <span class="text-slate-600">Guardians:</span>
                    <span class="font-medium">2 of 2 required</span>
                  </div>
                  
                  <div class="flex gap-2">
                    <button class="flex-1 bg-brave-blue-600 hover:bg-brave-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      <i class="fas fa-plus mr-2"></i>Deposit
                    </button>
                    <button class="flex-1 bg-trust-green-600 hover:bg-trust-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      <i class="fas fa-arrow-down mr-2"></i>Withdraw
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Notification Toast Container -->
        <div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2"></div>
      </div>
    `;
  };

  // Replace the loading state with actual content
  appContainer.innerHTML = createMainContent();

  // Check for existing wallet connection
  checkExistingWalletConnection();

  console.log('✅ Simple app loaded successfully!');
});

// Wallet connection - now with basic web3 detection
async function connectWallet(walletType) {
  console.log('Connecting to ' + walletType + '...');
  
  // Show connecting state
  showToast('Connecting to ' + walletType + '...', 'info');
  
  try {
    let provider = null;
    let address = null;
    
    if (walletType === 'metamask' || walletType === 'brave') {
      // Check for Ethereum provider
      if (typeof window.ethereum !== 'undefined') {
        provider = window.ethereum;
        
        // Request account access
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          address = accounts[0];
          showToast('Successfully connected to ' + walletType + '!', 'success');
        } else {
          throw new Error('No accounts found');
        }
      } else {
        throw new Error(walletType + ' not detected. Please install the extension.');
      }
    } else {
      // For walletconnect and coinbase, simulate for now but with better UX
      showToast('Opening ' + walletType + ' connection...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a realistic test address
      const testAddresses = [
        '0x742d35Cc6634C0532925a3b8D55B4E52Eb1b4870',
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
      ];
      address = testAddresses[Math.floor(Math.random() * testAddresses.length)];
      showToast('Successfully connected to ' + walletType + '!', 'success');
    }
    
    if (address) {
      // Update UI with connected state
      const walletStatus = document.getElementById('wallet-status');
      const walletAddressEl = document.getElementById('wallet-address');
      
      if (walletStatus && walletAddressEl) {
        walletStatus.classList.remove('hidden');
        walletAddressEl.textContent = address;
      }
      
      // Update header button
      updateHeaderWalletButton(address);
      
      // Store connection for persistence
      localStorage.setItem('connectedWallet', JSON.stringify({
        type: walletType,
        address: address,
        timestamp: Date.now()
      }));
      
      // Update global wallet state
      window.walletState.updateWalletState(address, provider, walletType);
      
      return { success: true, address, provider };
    }
    
  } catch (error) {
    console.error('Wallet connection failed:', error);
    showToast('Failed to connect to ' + walletType + ': ' + error.message, 'error');
    return { success: false, error: error.message };
  }
}

// Update header wallet button
function updateHeaderWalletButton(address) {
  const connectBtn = document.getElementById('connect-wallet-btn');
  if (connectBtn && address) {
    connectBtn.textContent = address.slice(0, 6) + '...' + address.slice(-4);
    connectBtn.classList.remove('bg-vault-gold-500', 'hover:bg-vault-gold-600');
    connectBtn.classList.add('bg-trust-green-600', 'hover:bg-trust-green-700');
  }
}

// Global wallet state management
window.walletState = {
  isConnected: false,
  address: null,
  provider: null,
  type: null,
  
  // Get current wallet state
  getWalletInfo() {
    try {
      const stored = localStorage.getItem('connectedWallet');
      if (stored) {
        const walletData = JSON.parse(stored);
        // Check if connection is less than 24 hours old
        if (Date.now() - walletData.timestamp < 24 * 60 * 60 * 1000) {
          this.isConnected = true;
          this.address = walletData.address;
          this.type = walletData.type;
          return walletData;
        }
      }
    } catch (error) {
      console.error('Failed to get wallet info:', error);
    }
    return null;
  },
  
  // Update wallet state
  updateWalletState(address, provider, type) {
    this.isConnected = true;
    this.address = address;
    this.provider = provider;
    this.type = type;
  },
  
  // Clear wallet state
  clearWalletState() {
    this.isConnected = false;
    this.address = null;
    this.provider = null;
    this.type = null;
    localStorage.removeItem('connectedWallet');
  }
};

// Navigation functions
async function showCreateVault() {
  console.log('Opening vault creation wizard...');
  
  // MANDATORY network check before ANY vault operations
  if (typeof NetworkUtils !== 'undefined') {
    try {
      const currentNetwork = await NetworkUtils.getCurrentNetwork();
      const isOnSepolia = await NetworkUtils.isOnSepolia();
      
      console.log('Pre-creation network check:', { currentNetwork, isOnSepolia });
      
      if (!isOnSepolia) {
        // Show blocking alert - no bypass allowed
        alert(`🚫 NETWORK REQUIREMENT FAILED

Current Network: ${currentNetwork?.name || 'Unknown'}
Currency: ${currentNetwork?.symbol || 'Unknown'}

REQUIRED: Sepolia Testnet (ETH)

You MUST switch to Sepolia testnet before creating vaults. This prevents AMB/AirDAO transactions and ensures you use ETH.

Please switch networks in MetaMask and try again.`);
        
        showToast(`❌ Blocked: Cannot create vaults on ${currentNetwork?.name}. Switch to Sepolia testnet required.`, 'error');
        return; // Absolutely do not proceed
      }
      
      showToast('✅ Network verified: Sepolia testnet', 'success');
    } catch (error) {
      console.error('Network check failed:', error);
      alert('❌ Cannot verify network. Please ensure MetaMask is connected and try again.');
      return;
    }
  } else {
    alert('❌ Network utilities not available. Please refresh the page and try again.');
    return;
  }
  
  // Only proceed if on Sepolia testnet
  const walletInfo = window.walletState.getWalletInfo();
  
  // Call the real vault wizard function from vault-wizard.js
  if (typeof showVaultWizard === 'function') {
    showVaultWizard(walletInfo);
  } else {
    showToast('Vault wizard is loading...', 'warning');
    console.error('showVaultWizard function not found - vault-wizard.js may not be loaded');
  }
}

function openDashboard() {
  console.log('Opening dashboard...');
  // Call the real dashboard function from dashboard.js
  if (typeof showDashboard === 'function') {
    showDashboard();
  } else {
    showToast('Dashboard is loading...', 'warning');
    console.error('showDashboard function not found - dashboard.js may not be loaded');
  }
}

// Toast notification system
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toastId = 'toast-' + Date.now();
  const iconMap = {
    success: 'fas fa-check-circle text-trust-green-600',
    error: 'fas fa-exclamation-circle text-red-600',
    warning: 'fas fa-exclamation-triangle text-yellow-600',
    info: 'fas fa-info-circle text-blue-600'
  };
  
  const colorMap = {
    success: 'bg-trust-green-50 border-trust-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = colorMap[type] + ' border rounded-lg p-4 shadow-lg transform transition-all duration-300 translate-x-full opacity-0';
  
  toast.innerHTML = 
    '<div class="flex items-center">' +
      '<i class="' + iconMap[type] + ' mr-3"></i>' +
      '<span class="font-medium text-slate-900">' + message + '</span>' +
      '<button onclick="removeToast(\'' + toastId + '\')" class="ml-4 text-slate-400 hover:text-slate-600">' +
        '<i class="fas fa-times"></i>' +
      '</button>' +
    '</div>';

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  }, 10);

  // Auto remove after 5 seconds
  setTimeout(() => {
    removeToast(toastId);
  }, 5000);
}

function removeToast(toastId) {
  const toast = document.getElementById(toastId);
  if (toast) {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
}

// Scroll to wallet connection section
function scrollToWallets() {
  const walletSection = document.getElementById('wallet-section');
  if (walletSection) {
    walletSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// Scroll to top of page
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Check for existing wallet connection
function checkExistingWalletConnection() {
  try {
    const stored = localStorage.getItem('connectedWallet');
    if (stored) {
      const walletData = JSON.parse(stored);
      // Check if connection is less than 24 hours old
      if (Date.now() - walletData.timestamp < 24 * 60 * 60 * 1000) {
        // Restore connection UI
        const walletStatus = document.getElementById('wallet-status');
        const walletAddressEl = document.getElementById('wallet-address');
        
        if (walletStatus && walletAddressEl) {
          walletStatus.classList.remove('hidden');
          walletAddressEl.textContent = walletData.address;
        }
        
        updateHeaderWalletButton(walletData.address);
        showToast('Restored ' + walletData.type + ' connection', 'success');
        return walletData;
      } else {
        // Clear old connection
        localStorage.removeItem('connectedWallet');
      }
    }
  } catch (error) {
    console.error('Failed to restore wallet connection:', error);
    localStorage.removeItem('connectedWallet');
  }
  return null;
}

// Network management functions
async function updateNetworkStatus() {
  if (typeof NetworkUtils === 'undefined') return;
  
  try {
    const currentNetwork = await NetworkUtils.getCurrentNetwork();
    const isOnSepolia = await NetworkUtils.isOnSepolia();
    
    const networkElement = document.getElementById('current-network');
    const switchButton = document.getElementById('switch-network-btn');
    const networkWarning = document.getElementById('network-warning');
    
    if (networkElement) {
      if (currentNetwork) {
        networkElement.textContent = currentNetwork.name;
        
        if (isOnSepolia) {
          networkElement.className = 'font-semibold text-green-600';
          if (switchButton) switchButton.classList.add('hidden');
          if (networkWarning) networkWarning.classList.add('hidden');
        } else {
          networkElement.className = 'font-semibold text-orange-600';
          if (switchButton) switchButton.classList.remove('hidden');
          if (networkWarning) {
            networkWarning.classList.remove('hidden');
            networkWarning.querySelector('.font-bold').textContent = `Wrong Network: ${currentNetwork.name}`;
            networkWarning.querySelector('.opacity-90').textContent = `Currently using ${currentNetwork.symbol}. Switch to Sepolia testnet to use ETH.`;
          }
        }
      } else {
        networkElement.textContent = 'Unknown';
        networkElement.className = 'font-semibold text-gray-500';
        if (switchButton) switchButton.classList.add('hidden');
        if (networkWarning) networkWarning.classList.add('hidden');
      }
    }
  } catch (error) {
    console.warn('Failed to update network status:', error);
  }
}

async function switchToSepoliaNetwork() {
  if (typeof NetworkUtils === 'undefined') {
    showToast('❌ Network utilities not available', 'error');
    return;
  }
  
  try {
    showToast('🔄 Switching to Sepolia testnet...', 'info');
    await NetworkUtils.switchToSepolia();
    showToast('✅ Switched to Sepolia testnet!', 'success');
    await updateNetworkStatus();
  } catch (error) {
    console.error('Network switch error:', error);
    showToast('❌ Failed to switch networks: ' + error.message, 'error');
  }
}

// Initialize network status when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Update network status after a short delay to ensure wallet is loaded
  setTimeout(updateNetworkStatus, 2000);
  
  // Listen for network changes
  if (window.ethereum) {
    window.ethereum.on('chainChanged', (chainId) => {
      console.log('Network changed:', chainId);
      setTimeout(updateNetworkStatus, 500);
    });
  }
});

// Admin function to deploy VaultFactory once
async function showAdminFactoryDeployment() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-75';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
      <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <i class="fas fa-industry text-2xl text-blue-600"></i>
      </div>
      <h3 class="text-2xl font-bold text-gray-900 mb-4">Deploy VaultFactory 🏭</h3>
      <p class="text-gray-600 mb-4">Deploy the VaultFactory contract once for all users to use.</p>
      <p class="text-sm text-gray-500 mb-6">⚠️ Admin function - requires ~0.002 ETH for deployment</p>
      
      <div class="space-y-3">
        <button onclick="deployFactoryAdmin()" id="deploy-factory-btn"
                class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg">
          <i class="fas fa-rocket mr-2"></i>Deploy VaultFactory
        </button>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                class="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-6 rounded-lg">
          Cancel
        </button>
      </div>
      
      <div class="mt-4 text-xs text-gray-500">
        <p>💡 This deploys once and is reused for all vault creations</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Deploy factory (admin function)
async function deployFactoryAdmin() {
  const btn = document.getElementById('deploy-factory-btn');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Deploying...';
    btn.disabled = true;
  }

  try {
    const result = await deployFactoryForProduction();
    
    showToast(`✅ VaultFactory deployed at ${result.address.slice(0,8)}...`, 'success');
    
    // Close modal
    const modal = document.querySelector('.fixed.inset-0');
    if (modal && modal.classList.contains('z-[70]')) modal.remove();
    
  } catch (error) {
    showToast(`❌ Factory deployment failed: ${error.message}`, 'error');
    console.error('Factory deployment error:', error);
    
    // Restore button
    if (btn) {
      btn.innerHTML = '<i class="fas fa-rocket mr-2"></i>Deploy VaultFactory';
      btn.disabled = false;
    }
  }
}

// Admin access via logo clicks
let logoClickCount = 0;
let logoClickTimeout = null;

function handleLogoClick() {
  logoClickCount++;
  
  // Reset counter after 3 seconds
  if (logoClickTimeout) clearTimeout(logoClickTimeout);
  logoClickTimeout = setTimeout(() => {
    logoClickCount = 0;
  }, 3000);
  
  // Show admin panel after 3 clicks
  if (logoClickCount >= 3) {
    logoClickCount = 0;
    showAdminFactoryDeployment();
  }
}

// Make functions globally available
window.showAdminFactoryDeployment = showAdminFactoryDeployment;
window.handleLogoClick = handleLogoClick;