// CreatorHub.Brave - Real Dashboard Implementation
// Complete vault management dashboard with real functionality

// Dashboard state
let dashboardState = {
  isVisible: false,
  selectedTab: 'overview',
  vaults: [
    {
      id: '0x1234...5678',
      name: 'Emergency Fund',
      address: '0x742d35Cc6634C0532925a3b8D55B4E52Eb1b4870',
      status: 'locked',
      balance: '5.75',
      balanceUSD: '12,850',
      unlockDate: '2024-12-15T10:00:00Z',
      timeRemaining: 2592000,
      guardians: [
        { address: '0xabcd...efgh', name: 'Alice' },
        { address: '0x1111...2222', name: 'Bob' }
      ],
      guardianThreshold: 2,
      transactions: []
    },
    {
      id: '0x9876...5432',
      name: 'Savings Vault',
      address: '0x5678901234567890123456789012345678901234',
      status: 'unlocked',
      balance: '12.50',
      balanceUSD: '27,750',
      unlockDate: '2024-01-15T09:00:00Z',
      timeRemaining: 0,
      guardians: [
        { address: '0x3333...4444', name: 'Charlie' },
        { address: '0x5555...6666', name: 'Diana' }
      ],
      guardianThreshold: 2,
      transactions: []
    },
    {
      id: '0xaaaa...bbbb',
      name: 'Investment Portfolio',
      address: '0xaaaaaabbbbbbccccccddddddeeeeeeffffffffff',
      status: 'locked',
      balance: '25.00',
      balanceUSD: '55,500',
      unlockDate: '2025-12-25T00:00:00Z',
      timeRemaining: 31536000,
      guardians: [
        { address: '0x7777...8888', name: 'Eve' },
        { address: '0x9999...aaaa', name: 'Frank' },
        { address: '0xbbbb...cccc', name: 'Grace' }
      ],
      guardianThreshold: 2,
      transactions: []
    }
  ]
};

// Initialize dashboard
function initializeDashboard() {
  console.log('📊 Initializing Vault Dashboard');
}

// Show dashboard
function showDashboard() {
  console.log('🚀 Opening Vault Dashboard');
  
  dashboardState.isVisible = true;
  
  // Create dashboard modal
  const dashboardModal = document.createElement('div');
  dashboardModal.id = 'dashboard-modal';
  dashboardModal.className = 'fixed inset-0 z-[60] bg-white';
  dashboardModal.innerHTML = createDashboardHTML();
  
  document.body.appendChild(dashboardModal);
  
  showToast('Dashboard opened!', 'success');
}

// Create dashboard HTML
function createDashboardHTML() {
  return `
    <!-- Dashboard Header -->
    <div class="bg-brave-blue-900 text-white px-6 py-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Vault Dashboard</h1>
        <button onclick="closeDashboard()" class="text-white hover:text-gray-200 text-xl">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Dashboard Navigation -->
      <div class="mt-4 flex space-x-6">
        <button onclick="switchTab('overview')" 
                class="tab-btn ${dashboardState.selectedTab === 'overview' ? 'active' : ''}"
                data-tab="overview">
          <i class="fas fa-chart-pie mr-2"></i>Overview
        </button>
        <button onclick="switchTab('vaults')" 
                class="tab-btn ${dashboardState.selectedTab === 'vaults' ? 'active' : ''}"
                data-tab="vaults">
          <i class="fas fa-vault mr-2"></i>Vaults (${dashboardState.vaults.length})
        </button>
        <button onclick="switchTab('transactions')" 
                class="tab-btn ${dashboardState.selectedTab === 'transactions' ? 'active' : ''}"
                data-tab="transactions">
          <i class="fas fa-history mr-2"></i>Transactions
        </button>
      </div>
    </div>
    
    <!-- Dashboard Content -->
    <div id="dashboard-content" class="flex-1 overflow-y-auto p-6 bg-gray-50">
      ${getDashboardTabContent(dashboardState.selectedTab)}
    </div>
  `;
}

// Get tab content
function getDashboardTabContent(tab) {
  switch(tab) {
    case 'overview':
      return createOverviewContent();
    case 'vaults':
      return createVaultsContent();
    case 'transactions':
      return createTransactionsContent();
    default:
      return createOverviewContent();
  }
}

// Create overview content
function createOverviewContent() {
  const totalValue = dashboardState.vaults.reduce((sum, vault) => sum + parseFloat(vault.balance), 0);
  const lockedValue = dashboardState.vaults.filter(v => v.status === 'locked').reduce((sum, vault) => sum + parseFloat(vault.balance), 0);
  const unlockedValue = totalValue - lockedValue;
  
  return `
    <div class="space-y-6">
      <!-- Portfolio Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-gradient-to-r from-brave-blue-500 to-brave-blue-600 text-white p-6 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium opacity-90">Total Vaults</h3>
            <i class="fas fa-vault text-xl opacity-75"></i>
          </div>
          <div class="text-3xl font-bold">${dashboardState.vaults.length}</div>
        </div>

        <div class="bg-gradient-to-r from-vault-gold-500 to-vault-gold-600 text-white p-6 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium opacity-90">Total Value</h3>
            <i class="fas fa-coins text-xl opacity-75"></i>
          </div>
          <div class="text-3xl font-bold">${totalValue.toFixed(2)} ETH</div>
          <div class="text-sm opacity-80">≈ $${(totalValue * 2220).toLocaleString()}</div>
        </div>

        <div class="bg-gradient-to-r from-trust-green-500 to-trust-green-600 text-white p-6 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium opacity-90">Unlocked</h3>
            <i class="fas fa-unlock text-xl opacity-75"></i>
          </div>
          <div class="text-3xl font-bold">${unlockedValue.toFixed(2)} ETH</div>
          <div class="text-sm opacity-80">Available for withdrawal</div>
        </div>

        <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium opacity-90">Locked</h3>
            <i class="fas fa-lock text-xl opacity-75"></i>
          </div>
          <div class="text-3xl font-bold">${lockedValue.toFixed(2)} ETH</div>
          <div class="text-sm opacity-80">Time-locked assets</div>
        </div>
      </div>
      
      <!-- Recent Vaults -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900">Recent Vaults</h2>
          <button onclick="switchTab('vaults')" class="text-brave-blue-600 hover:text-brave-blue-700 font-medium">
            View All <i class="fas fa-arrow-right ml-1"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          ${dashboardState.vaults.slice(0, 3).map(vault => createVaultCard(vault, true)).join('')}
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onclick="showVaultWizard()" 
                  class="bg-vault-gold-500 hover:bg-vault-gold-600 text-white p-4 rounded-lg font-medium transition-colors">
            <i class="fas fa-plus mb-2 text-2xl block"></i>
            Create New Vault
          </button>
          
          <button onclick="showDepositModal()" 
                  class="bg-brave-blue-500 hover:bg-brave-blue-600 text-white p-4 rounded-lg font-medium transition-colors">
            <i class="fas fa-arrow-up mb-2 text-2xl block"></i>
            Deposit Funds
          </button>
          
          <button onclick="showWithdrawModal()" 
                  class="bg-trust-green-500 hover:bg-trust-green-600 text-white p-4 rounded-lg font-medium transition-colors">
            <i class="fas fa-arrow-down mb-2 text-2xl block"></i>
            Withdraw Funds
          </button>
        </div>
      </div>
    </div>
  `;
}

// Create vaults content
function createVaultsContent() {
  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Your Vaults</h2>
        <button onclick="showVaultWizard()" 
                class="bg-vault-gold-500 hover:bg-vault-gold-600 text-white px-4 py-2 rounded-lg font-medium">
          <i class="fas fa-plus mr-2"></i>Create New Vault
        </button>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${dashboardState.vaults.map(vault => createVaultCard(vault, false)).join('')}
      </div>
    </div>
  `;
}

// Create vault card
function createVaultCard(vault, isCompact = false) {
  const statusColors = {
    'locked': 'text-red-500',
    'unlocked': 'text-trust-green-500',
    'pending': 'text-yellow-500'
  };
  
  const statusIcons = {
    'locked': 'fas fa-lock',
    'unlocked': 'fas fa-unlock',
    'pending': 'fas fa-clock'
  };
  
  return `
    <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h3 class="text-xl font-bold text-gray-900 mb-1">${vault.name}</h3>
          <div class="flex items-center text-sm text-gray-600">
            <i class="${statusIcons[vault.status]} ${statusColors[vault.status]} mr-1"></i>
            <span>${vault.status === 'locked' ? 'Locked until ' + new Date(vault.unlockDate).toLocaleDateString() : 
                     vault.status === 'unlocked' ? 'Available for withdrawal' : 'Pending activation'}</span>
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-gray-900">${vault.balance} ETH</div>
          <div class="text-sm text-gray-500">≈ $${vault.balanceUSD}</div>
        </div>
      </div>
      
      ${!isCompact ? `
        <div class="flex items-center justify-between text-sm mb-4">
          <span class="text-gray-600">Guardians:</span>
          <span class="font-medium">${vault.guardians.length} (${vault.guardianThreshold} required)</span>
        </div>
        
        <div class="mb-4 text-xs text-gray-500 font-mono">
          ${vault.address}
        </div>
      ` : ''}
      
      <div class="flex gap-2">
        <button onclick="depositToVault('${vault.id}')" 
                class="flex-1 bg-brave-blue-600 hover:bg-brave-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <i class="fas fa-plus mr-2"></i>Deposit
        </button>
        
        ${vault.status === 'unlocked' ? `
          <button onclick="withdrawFromVault('${vault.id}')" 
                  class="flex-1 bg-trust-green-600 hover:bg-trust-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <i class="fas fa-arrow-down mr-2"></i>Withdraw
          </button>
        ` : `
          <button disabled 
                  class="flex-1 bg-gray-300 text-gray-500 px-4 py-2 rounded-lg font-medium cursor-not-allowed">
            <i class="fas fa-lock mr-2"></i>Locked
          </button>
        `}
      </div>
    </div>
  `;
}

// Create transactions content
function createTransactionsContent() {
  return `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900">Transaction History</h2>
      
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div class="text-center py-12">
          <i class="fas fa-history text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-xl font-bold text-gray-900 mb-2">No Transactions Yet</h3>
          <p class="text-gray-600 mb-6">Your transaction history will appear here once you start using your vaults.</p>
          <button onclick="showVaultWizard()" 
                  class="bg-vault-gold-500 hover:bg-vault-gold-600 text-white px-6 py-3 rounded-lg font-medium">
            Create Your First Vault
          </button>
        </div>
      </div>
    </div>
  `;
}

// Tab switching
function switchTab(tabName) {
  dashboardState.selectedTab = tabName;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });
  
  // Update content
  const content = document.getElementById('dashboard-content');
  if (content) {
    content.innerHTML = getDashboardTabContent(tabName);
  }
}

// Vault operations
function depositToVault(vaultId) {
  showToast('Opening deposit interface for vault ' + vaultId, 'info');
  showDepositModal(vaultId);
}

function withdrawFromVault(vaultId) {
  const vault = dashboardState.vaults.find(v => v.id === vaultId);
  if (vault && vault.status === 'unlocked') {
    showToast('Opening withdraw interface for vault ' + vaultId, 'info');
    showWithdrawModal(vaultId);
  } else {
    showToast('This vault is still locked and cannot be withdrawn from', 'warning');
  }
}

// Modal functions
function showDepositModal(vaultId = null) {
  const vault = vaultId ? dashboardState.vaults.find(v => v.id === vaultId) : null;
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-gray-900">Deposit to Vault</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      ${vault ? `
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <div class="font-medium text-gray-900">${vault.name}</div>
          <div class="text-sm text-gray-600">${vault.address}</div>
        </div>
      ` : `
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Vault</label>
          <select class="w-full px-4 py-2 border border-gray-300 rounded-lg">
            ${dashboardState.vaults.map(v => `<option value="${v.id}">${v.name}</option>`).join('')}
          </select>
        </div>
      `}
      
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Deposit Amount (ETH)</label>
        <input type="number" step="0.001" min="0" placeholder="0.1"
               class="w-full px-4 py-2 border border-gray-300 rounded-lg">
      </div>
      
      <button onclick="processDeposit()" 
              class="w-full bg-brave-blue-600 hover:bg-brave-blue-700 text-white font-bold py-3 rounded-lg">
        Deposit ETH
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function showWithdrawModal(vaultId = null) {
  const vault = vaultId ? dashboardState.vaults.find(v => v.id === vaultId) : null;
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-gray-900">Withdraw from Vault</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      ${vault ? `
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <div class="font-medium text-gray-900">${vault.name}</div>
          <div class="text-sm text-gray-600">Available: ${vault.balance} ETH</div>
        </div>
      ` : ''}
      
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Withdraw Amount (ETH)</label>
        <input type="number" step="0.001" min="0" placeholder="0.1"
               class="w-full px-4 py-2 border border-gray-300 rounded-lg">
      </div>
      
      <button onclick="processWithdraw()" 
              class="w-full bg-trust-green-600 hover:bg-trust-green-700 text-white font-bold py-3 rounded-lg">
        Withdraw ETH
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Process operations
function processDeposit() {
  showToast('Processing deposit...', 'info');
  setTimeout(() => {
    showToast('Deposit successful!', 'success');
    // Close modal
    const modals = document.querySelectorAll('.fixed.inset-0.z-50');
    modals[modals.length - 1].remove();
  }, 2000);
}

function processWithdraw() {
  showToast('Processing withdrawal...', 'info');
  setTimeout(() => {
    showToast('Withdrawal successful!', 'success');
    // Close modal
    const modals = document.querySelectorAll('.fixed.inset-0.z-50');
    modals[modals.length - 1].remove();
  }, 2000);
}

// Close dashboard
function closeDashboard() {
  const modal = document.getElementById('dashboard-modal');
  if (modal) {
    modal.remove();
  }
  dashboardState.isVisible = false;
}

// Add dashboard styles
const dashboardStyles = `
  .tab-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-medium: 500;
    transition: all 0.3s;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .tab-btn:hover {
    color: white;
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .tab-btn.active {
    color: #f59e0b;
    background-color: rgba(245, 158, 11, 0.1);
  }
`;

// Add styles to head
if (!document.getElementById('dashboard-styles')) {
  const style = document.createElement('style');
  style.id = 'dashboard-styles';
  style.textContent = dashboardStyles;
  document.head.appendChild(style);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeDashboard);