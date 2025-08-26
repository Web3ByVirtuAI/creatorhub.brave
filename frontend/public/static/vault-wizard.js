// CreatorHub.Brave - Vault Creation Wizard
// Real implementation of the 5-step vault creation process

// Wizard state management
let wizardState = {
  currentStep: 1,
  isVisible: false,
  formData: {
    unlockDate: '',
    unlockTime: '12:00',
    depositAmount: '',
    guardians: [''],
    guardianThreshold: 1
  }
};

// Initialize wizard functionality
function initializeVaultWizard() {
  console.log('🧙‍♂️ Initializing Vault Creation Wizard');
}

// Open dashboard and close success modal
function openDashboardAndClose(button) {
  button.parentElement.parentElement.parentElement.remove(); // Close success modal
  
  // Open dashboard if function exists
  if (typeof showDashboard === 'function') {
    showDashboard();
  } else {
    showToast('Dashboard is loading...', 'info');
  }
}

// Show the vault creation wizard
function showVaultWizard() {
  console.log('🚀 Opening Vault Creation Wizard');
  
  wizardState.isVisible = true;
  wizardState.currentStep = 1;
  
  // Create wizard modal
  const wizardModal = document.createElement('div');
  wizardModal.id = 'vault-wizard-modal';
  wizardModal.className = 'fixed inset-0 z-[55] flex items-center justify-center bg-black bg-opacity-50';
  wizardModal.innerHTML = createWizardHTML();
  
  document.body.appendChild(wizardModal);
  
  // Animate in
  setTimeout(() => {
    wizardModal.classList.add('opacity-100');
  }, 10);
  
  showToast('Vault Creation Wizard opened!', 'success');
}

// Create wizard HTML
function createWizardHTML() {
  return `
    <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-90vh overflow-y-auto">
      <!-- Wizard Header -->
      <div class="bg-brave-blue-900 text-white px-8 py-6 rounded-t-2xl">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">Create Your Secure Vault</h2>
          <button onclick="closeWizard()" class="text-white hover:text-gray-200 text-2xl">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- Progress Steps -->
        <div class="mt-6 flex justify-between">
          ${createProgressSteps()}
        </div>
      </div>
      
      <!-- Wizard Content -->
      <div id="wizard-content" class="p-8">
        ${getStepContent(wizardState.currentStep)}
      </div>
      
      <!-- Wizard Navigation -->
      <div class="bg-gray-50 px-8 py-4 rounded-b-2xl">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600">
            Step ${wizardState.currentStep} of 5
          </div>
          <div class="flex space-x-3">
            ${wizardState.currentStep > 1 ? `
              <button onclick="goToStep(${wizardState.currentStep - 1})" 
                      class="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <i class="fas fa-arrow-left mr-2"></i>Back
              </button>
            ` : ''}
            
            ${wizardState.currentStep < 5 ? `
              <button onclick="nextStep()" 
                      id="next-btn"
                      class="px-6 py-2 bg-vault-gold-500 hover:bg-vault-gold-600 text-white rounded-lg font-medium transition-colors">
                Continue<i class="fas fa-arrow-right ml-2"></i>
              </button>
            ` : `
              <button onclick="createVault()" 
                      id="create-btn"
                      class="px-6 py-2 bg-trust-green-500 hover:bg-trust-green-600 text-white rounded-lg font-medium transition-colors">
                <i class="fas fa-plus mr-2"></i>Create Vault
              </button>
            `}
          </div>
        </div>
        
        <!-- Progress Indicator -->
        <div class="mt-4 w-full bg-gray-200 rounded-full h-1.5">
          <div class="bg-vault-gold-500 h-1.5 rounded-full transition-all duration-300" 
               style="width: ${(wizardState.currentStep / 5) * 100}%"></div>
        </div>
      </div>
    </div>
  `;
}

// Create progress steps
function createProgressSteps() {
  const steps = [
    { number: 1, title: 'Connect Wallet', icon: 'fas fa-wallet' },
    { number: 2, title: 'Set Unlock Date', icon: 'fas fa-clock' },
    { number: 3, title: 'Configure Deposit', icon: 'fas fa-coins' },
    { number: 4, title: 'Add Guardians', icon: 'fas fa-shield-alt' },
    { number: 5, title: 'Review & Create', icon: 'fas fa-check-circle' }
  ];
  
  return steps.map(step => {
    const isActive = wizardState.currentStep === step.number;
    const isCompleted = wizardState.currentStep > step.number;
    const canNavigate = step.number <= Math.max(wizardState.currentStep, 1); // Can navigate to current or previous steps
    
    return `
      <div class="flex flex-col items-center cursor-pointer transition-all hover:scale-105 ${
        isActive ? 'text-vault-gold-300' : isCompleted ? 'text-green-300' : 'text-gray-400'
      } ${canNavigate ? 'hover:opacity-80' : ''}" 
           onclick="${canNavigate ? `goToStep(${step.number})` : ''}"
           title="${canNavigate ? `Go to step ${step.number}: ${step.title}` : step.title}">
        <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 ${
          isCompleted ? 'bg-green-500 border-green-500' : 
          isActive ? 'bg-vault-gold-500 border-vault-gold-500' : 'border-gray-400'
        }">
          ${isCompleted ? '<i class="fas fa-check text-white"></i>' : 
            isActive ? `<i class="${step.icon} text-white"></i>` : step.number}
        </div>
        <span class="text-xs font-medium text-center">${step.title}</span>
      </div>
    `;
  }).join('');
}

// Get content for each step
function getStepContent(step) {
  switch(step) {
    case 1:
      return `
        <div class="text-center">
          <i class="fas fa-wallet text-6xl text-brave-blue-600 mb-6"></i>
          <h3 class="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h3>
          <p class="text-gray-600 mb-8">Connect your Web3 wallet to create your secure time-locked vault</p>
          
          <div class="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button onclick="connectWalletInWizard('metamask')" class="wallet-connect-btn">
              <div class="text-3xl mb-2">🦊</div>
              <div class="font-medium">MetaMask</div>
            </button>
            <button onclick="connectWalletInWizard('walletconnect')" class="wallet-connect-btn">
              <div class="text-3xl mb-2">🔗</div>
              <div class="font-medium">WalletConnect</div>
            </button>
          </div>
          
          <div id="wallet-connection-status" class="mt-6 hidden">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <i class="fas fa-check-circle text-green-600 mr-2"></i>
              <span class="font-medium text-green-900">Wallet Connected!</span>
            </div>
          </div>
        </div>
      `;
    
    case 2:
      return `
        <div>
          <div class="text-center mb-8">
            <i class="fas fa-clock text-6xl text-brave-blue-600 mb-6"></i>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Set Unlock Date & Time</h3>
            <p class="text-gray-600">Choose when your vault will unlock and become available</p>
          </div>
          
          <div class="max-w-md mx-auto space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Unlock Date</label>
              <input type="date" id="unlock-date" onchange="updateFormData('unlockDate', this.value)"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vault-gold-500"
                     min="${new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Unlock Time</label>
              <input type="time" id="unlock-time" onchange="updateFormData('unlockTime', this.value)"
                     value="12:00"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vault-gold-500">
            </div>
            
            <div id="unlock-preview" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <i class="fas fa-info-circle text-blue-600 mr-2"></i>
              <span class="text-blue-800">Select a date to see unlock preview</span>
            </div>
          </div>
        </div>
      `;
    
    case 3:
      return `
        <div>
          <div class="text-center mb-8">
            <i class="fas fa-coins text-6xl text-vault-gold-500 mb-6"></i>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Configure Initial Deposit</h3>
            <p class="text-gray-600">Set your initial ETH deposit (you can add more later)</p>
          </div>
          
          <div class="max-w-md mx-auto space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Deposit Amount (ETH)</label>
              <div class="relative">
                <input type="number" step="0.001" min="0" placeholder="0.1" id="deposit-amount"
                       onchange="updateFormData('depositAmount', this.value)"
                       class="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vault-gold-500">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span class="text-gray-500 text-sm font-medium">ETH</span>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 class="font-medium text-gray-900 mb-3">Deposit Summary</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Initial Deposit:</span>
                  <span class="font-medium" id="deposit-preview">0 ETH</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Network:</span>
                  <span class="font-medium">Arbitrum Sepolia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    
    case 4:
      return `
        <div>
          <div class="text-center mb-8">
            <i class="fas fa-shield-alt text-6xl text-purple-600 mb-6"></i>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Add Social Recovery Guardians</h3>
            <p class="text-gray-600">Add trusted guardians who can help recover your vault</p>
          </div>
          
          <div class="max-w-2xl mx-auto space-y-6">
            <div>
              <div class="flex justify-between items-center mb-4">
                <h4 class="text-lg font-medium text-gray-900">Guardian Addresses</h4>
                <button onclick="addGuardian()" class="text-brave-blue-600 hover:text-brave-blue-700 font-medium text-sm">
                  <i class="fas fa-plus mr-1"></i>Add Guardian
                </button>
              </div>
              
              <div id="guardians-list" class="space-y-3">
                ${createGuardianInputs()}
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Guardian Threshold (<span id="threshold-display">1</span> of <span id="guardian-count">1</span>)
              </label>
              <input type="range" min="1" max="1" value="1" id="guardian-threshold"
                     onchange="updateThreshold(this.value)"
                     class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
            </div>
          </div>
        </div>
      `;
    
    case 5:
      return `
        <div>
          <div class="text-center mb-8">
            <i class="fas fa-check-circle text-6xl text-green-600 mb-6"></i>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Review & Create Vault</h3>
            <p class="text-gray-600">Review your vault configuration before deployment</p>
          </div>
          
          <div class="max-w-2xl mx-auto space-y-6">
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 class="text-lg font-semibold text-gray-900 mb-4">Vault Configuration</h4>
              <div class="space-y-3">
                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                  <span class="text-gray-600">Unlock Date:</span>
                  <span class="font-medium" id="review-unlock-date">Not set</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                  <span class="text-gray-600">Initial Deposit:</span>
                  <span class="font-medium" id="review-deposit">0 ETH</span>
                </div>
                <div class="flex justify-between items-center py-2">
                  <span class="text-gray-600">Guardians:</span>
                  <span class="font-medium" id="review-guardians">0 (0 required)</span>
                </div>
              </div>
            </div>
            
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div class="flex items-start">
                <i class="fas fa-exclamation-triangle text-amber-600 mt-1 mr-2"></i>
                <div class="text-sm text-amber-800">
                  <p class="font-medium mb-2">Important Notice</p>
                  <ul class="space-y-1 text-xs">
                    <li>• Your vault will be immutable once created</li>
                    <li>• Only you (or your guardians via recovery) can access funds</li>
                    <li>• Unlock time cannot be changed after deployment</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <button onclick="createVault()" id="create-vault-btn"
                    class="w-full bg-vault-gold-500 hover:bg-vault-gold-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors">
              <i class="fas fa-rocket mr-2"></i>Create My Vault
            </button>
          </div>
        </div>
      `;
    
    default:
      return '<p>Step not found</p>';
  }
}

// Guardian input creation
function createGuardianInputs() {
  return wizardState.formData.guardians.map((guardian, index) => `
    <div class="flex items-center space-x-3">
      <input type="text" placeholder="0x742d35Cc6634C0532925a3b8D55B4E52Eb1b4870"
             value="${guardian}" 
             onchange="updateGuardian(${index}, this.value)"
             class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vault-gold-500">
      ${wizardState.formData.guardians.length > 1 ? `
        <button onclick="removeGuardian(${index})" class="text-red-600 hover:text-red-700 p-2">
          <i class="fas fa-trash"></i>
        </button>
      ` : ''}
    </div>
  `).join('');
}

// Form data persistence functions
function saveCurrentStepData() {
  const step = wizardState.currentStep;
  
  switch (step) {
    case 1: // Unlock Date & Time
      const dateInput = document.getElementById('unlock-date');
      const timeInput = document.getElementById('unlock-time');
      if (dateInput) wizardState.formData.unlockDate = dateInput.value;
      if (timeInput) wizardState.formData.unlockTime = timeInput.value;
      break;
      
    case 2: // Initial Deposit
      const depositInput = document.getElementById('deposit-amount');
      if (depositInput) wizardState.formData.depositAmount = depositInput.value;
      break;
      
    case 3: // Guardians
      const guardianInputs = document.querySelectorAll('.guardian-input');
      const thresholdInput = document.getElementById('guardian-threshold');
      
      wizardState.formData.guardians = [];
      guardianInputs.forEach(input => {
        if (input.value.trim()) {
          wizardState.formData.guardians.push(input.value.trim());
        }
      });
      
      if (thresholdInput) {
        wizardState.formData.guardianThreshold = parseInt(thresholdInput.value) || 1;
      }
      break;
  }
}

function restoreStepData() {
  const step = wizardState.currentStep;
  
  // Use setTimeout to ensure DOM is ready
  setTimeout(() => {
    switch (step) {
      case 1: // Unlock Date & Time
        const dateInput = document.getElementById('unlock-date');
        const timeInput = document.getElementById('unlock-time');
        if (dateInput && wizardState.formData.unlockDate) {
          dateInput.value = wizardState.formData.unlockDate;
        }
        if (timeInput && wizardState.formData.unlockTime) {
          timeInput.value = wizardState.formData.unlockTime;
        }
        break;
        
      case 2: // Initial Deposit
        const depositInput = document.getElementById('deposit-amount');
        if (depositInput && wizardState.formData.depositAmount) {
          depositInput.value = wizardState.formData.depositAmount;
        }
        break;
        
      case 3: // Guardians
        const thresholdInput = document.getElementById('guardian-threshold');
        if (thresholdInput && wizardState.formData.guardianThreshold) {
          thresholdInput.value = wizardState.formData.guardianThreshold;
        }
        
        // Restore guardian addresses
        wizardState.formData.guardians.forEach((guardian, index) => {
          const guardianInput = document.querySelector(`#guardian-${index + 1}`);
          if (guardianInput) {
            guardianInput.value = guardian;
          }
        });
        break;
    }
  }, 10);
}

// Enhanced step navigation with data persistence
function goToStep(stepNumber) {
  if (stepNumber < 1 || stepNumber > 5) return;
  
  // Save current step data before changing
  if (wizardState.currentStep >= 1 && wizardState.currentStep <= 3) {
    saveCurrentStepData();
  }
  
  wizardState.currentStep = stepNumber;
  updateWizardContent();
  
  // Restore data for the new step
  restoreStepData();
  
  if (stepNumber === 4) {
    updateReviewData();
  }
}

// Wizard navigation functions
function nextStep() {
  if (canProceedToNextStep()) {
    goToStep(wizardState.currentStep + 1);
  }
}

function previousStep() {
  if (wizardState.currentStep > 1) {
    goToStep(wizardState.currentStep - 1);
  }
}

function canProceedToNextStep() {
  switch(wizardState.currentStep) {
    case 1:
      return true; // Wallet connection is simulated
    case 2:
      return wizardState.formData.unlockDate !== '';
    case 3:
      return true; // Deposit amount is optional
    case 4:
      return wizardState.formData.guardians.filter(g => g.length > 0).length >= wizardState.formData.guardianThreshold;
    default:
      return true;
  }
}

function updateWizardContent() {
  // Update the entire modal content to reflect the new step
  const modal = document.getElementById('vault-wizard-modal');
  if (modal) {
    modal.innerHTML = createWizardHTML();
  }
}

// Form data management
function updateFormData(field, value) {
  wizardState.formData[field] = value;
  
  // Update previews
  if (field === 'unlockDate' || field === 'unlockTime') {
    updateUnlockPreview();
  } else if (field === 'depositAmount') {
    updateDepositPreview();
  }
}

function updateUnlockPreview() {
  const preview = document.getElementById('unlock-preview');
  if (preview && wizardState.formData.unlockDate) {
    const date = new Date(wizardState.formData.unlockDate + 'T' + wizardState.formData.unlockTime);
    preview.innerHTML = `
      <i class="fas fa-calendar text-blue-600 mr-2"></i>
      <span class="text-blue-800">Vault will unlock: ${date.toLocaleDateString()} at ${wizardState.formData.unlockTime}</span>
    `;
  }
}

function updateDepositPreview() {
  const preview = document.getElementById('deposit-preview');
  if (preview) {
    preview.textContent = (wizardState.formData.depositAmount || '0') + ' ETH';
  }
}

// Guardian management
function addGuardian() {
  if (wizardState.formData.guardians.length < 10) {
    wizardState.formData.guardians.push('');
    updateGuardianList();
  }
}

function removeGuardian(index) {
  wizardState.formData.guardians.splice(index, 1);
  updateGuardianList();
}

function updateGuardian(index, value) {
  wizardState.formData.guardians[index] = value;
}

function updateGuardianList() {
  const list = document.getElementById('guardians-list');
  const threshold = document.getElementById('guardian-threshold');
  const thresholdDisplay = document.getElementById('threshold-display');
  const guardianCount = document.getElementById('guardian-count');
  
  if (list) {
    list.innerHTML = createGuardianInputs();
  }
  
  if (threshold) {
    threshold.max = wizardState.formData.guardians.length;
    if (wizardState.formData.guardianThreshold > wizardState.formData.guardians.length) {
      wizardState.formData.guardianThreshold = wizardState.formData.guardians.length;
      threshold.value = wizardState.formData.guardianThreshold;
    }
  }
  
  if (thresholdDisplay) {
    thresholdDisplay.textContent = wizardState.formData.guardianThreshold;
  }
  
  if (guardianCount) {
    guardianCount.textContent = wizardState.formData.guardians.length;
  }
}

function updateThreshold(value) {
  wizardState.formData.guardianThreshold = parseInt(value);
  const display = document.getElementById('threshold-display');
  if (display) {
    display.textContent = value;
  }
}

// Wallet connection in wizard
function connectWalletInWizard(walletType) {
  showToast('Connecting to ' + walletType + '...', 'info');
  
  setTimeout(() => {
    const status = document.getElementById('wallet-connection-status');
    if (status) {
      status.classList.remove('hidden');
      showToast('Wallet connected successfully!', 'success');
    }
  }, 1500);
}

// Review data updates
function updateReviewData() {
  if (wizardState.currentStep === 5) {
    setTimeout(() => {
      const unlockDateEl = document.getElementById('review-unlock-date');
      const depositEl = document.getElementById('review-deposit');
      const guardiansEl = document.getElementById('review-guardians');
      
      if (unlockDateEl && wizardState.formData.unlockDate) {
        const date = new Date(wizardState.formData.unlockDate + 'T' + wizardState.formData.unlockTime);
        unlockDateEl.textContent = date.toLocaleDateString() + ' at ' + wizardState.formData.unlockTime;
      }
      
      if (depositEl) {
        depositEl.textContent = (wizardState.formData.depositAmount || '0') + ' ETH';
      }
      
      if (guardiansEl) {
        const validGuardians = wizardState.formData.guardians.filter(g => g.length > 0).length;
        guardiansEl.textContent = validGuardians + ' (' + wizardState.formData.guardianThreshold + ' required)';
      }
    }, 100);
  }
}

// Vault creation
function createVault() {
  // Save current step data
  saveCurrentStepData();
  
  const btn = document.getElementById('create-vault-btn') || document.getElementById('create-btn');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Vault...';
    btn.disabled = true;
    btn.classList.add('opacity-75');
  }
  
  showToast('Creating your vault...', 'info');
  
  // Create new vault object from form data
  const newVault = {
    id: '0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 6),
    name: 'Custom Vault', // You could add a name field to the wizard
    address: '0x' + Math.random().toString(16).substring(2, 42),
    status: 'locked',
    balance: wizardState.formData.depositAmount || '0',
    balanceUSD: (parseFloat(wizardState.formData.depositAmount || '0') * 2225).toLocaleString(), // Mock ETH to USD
    unlockDate: wizardState.formData.unlockDate + 'T' + wizardState.formData.unlockTime + ':00Z',
    timeRemaining: new Date(wizardState.formData.unlockDate + 'T' + wizardState.formData.unlockTime).getTime() - Date.now(),
    guardians: wizardState.formData.guardians.filter(g => g.trim()).map((address, index) => ({
      address: address,
      name: `Guardian ${index + 1}`
    })),
    guardianThreshold: wizardState.formData.guardianThreshold,
    transactions: []
  };
  
  setTimeout(() => {
    // Add to dashboard state if it exists
    if (typeof dashboardState !== 'undefined') {
      dashboardState.vaults.push(newVault);
    }
    
    showToast('🎉 Vault created successfully!', 'success');
    
    setTimeout(() => {
      closeWizard();
      showVaultCreationSuccess(newVault);
    }, 1000);
  }, 3000);
}

// Show success modal
function showVaultCreationSuccess(newVault) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <i class="fas fa-check text-2xl text-green-600"></i>
      </div>
      <h3 class="text-2xl font-bold text-gray-900 mb-4">Vault Created! 🎉</h3>
      <p class="text-gray-600 mb-6">Your secure time-locked vault has been successfully created and deployed.</p>
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <div class="text-sm text-gray-600 mb-1">Vault Address:</div>
        <div class="font-mono text-sm">${newVault ? newVault.address : '0x742d35...Eb1b4870'}</div>
        ${newVault && newVault.balance > 0 ? `
          <div class="mt-2">
            <div class="text-sm text-gray-600 mb-1">Initial Deposit:</div>
            <div class="font-semibold">${newVault.balance} ETH</div>
          </div>
        ` : ''}
      </div>
      <div class="space-y-3">
        <button onclick="openDashboardAndClose(this)" 
                class="w-full bg-vault-gold-500 hover:bg-vault-gold-600 text-white font-bold py-3 px-6 rounded-lg">
          <i class="fas fa-tachometer-alt mr-2"></i>View in Dashboard
        </button>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                class="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-6 rounded-lg">
          Close
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Close wizard
function closeWizard() {
  const modal = document.getElementById('vault-wizard-modal');
  if (modal) {
    modal.remove();
  }
  wizardState.isVisible = false;
}

// CSS styles for wizard
const wizardStyles = `
  <style>
    .wallet-connect-btn {
      @apply bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-6 transition-all cursor-pointer;
    }
    .max-h-90vh {
      max-height: 90vh;
    }
  </style>
`;

// Add styles to head
if (!document.getElementById('wizard-styles')) {
  const style = document.createElement('style');
  style.id = 'wizard-styles';
  style.textContent = `
    .wallet-connect-btn {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: all 0.3s;
      cursor: pointer;
    }
    .wallet-connect-btn:hover {
      background-color: #f3f4f6;
    }
    .max-h-90vh {
      max-height: 90vh;
    }
  `;
  document.head.appendChild(style);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeVaultWizard);