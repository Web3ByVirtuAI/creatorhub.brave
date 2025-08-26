import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

const app = new Hono()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// JSX renderer middleware
app.use(renderer)

// API routes for smart contract integration
app.get('/api/contracts', (c) => {
  // Return contract addresses and ABIs
  return c.json({
    contracts: {
      vaultFactory: {
        address: process.env.VAULT_FACTORY_ADDRESS || '0x...',
        abi: 'VaultFactory ABI would be here'
      },
      childVault: {
        address: process.env.CHILD_VAULT_IMPLEMENTATION || '0x...',
        abi: 'ChildVault ABI would be here'
      }
    },
    networks: {
      arbitrumSepolia: {
        chainId: 421614,
        rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc'
      },
      optimismSepolia: {
        chainId: 11155420,
        rpcUrl: 'https://sepolia.optimism.io'
      }
    }
  })
})

app.get('/api/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Vault management API endpoints
app.get('/api/vaults/mock', (c) => {
  return c.json({
    success: true,
    vaults: [
      {
        id: '0x1234...5678',
        name: 'Emergency Fund',
        status: 'locked',
        balance: '5.75',
        symbol: 'ETH',
        unlockDate: '2024-06-15T10:00:00Z',
        timeRemaining: 2592000, // 30 days in seconds
        guardians: [
          { address: '0xabcd...efgh', name: 'Alice' },
          { address: '0x1111...2222', name: 'Bob' }
        ]
      },
      {
        id: '0x9876...5432',
        name: 'Savings Vault',
        status: 'unlocked',
        balance: '12.50',
        symbol: 'ETH',
        unlockDate: '2024-01-15T09:00:00Z',
        timeRemaining: 0,
        guardians: [
          { address: '0x3333...4444', name: 'Charlie' },
          { address: '0x5555...6666', name: 'Diana' }
        ]
      },
      {
        id: '0xaaaa...bbbb',
        name: 'Investment Portfolio',
        status: 'pending',
        balance: '25.00',
        symbol: 'ETH',
        unlockDate: '2025-12-25T00:00:00Z',
        timeRemaining: 31536000, // 365 days in seconds
        guardians: [
          { address: '0x7777...8888', name: 'Eve' },
          { address: '0x9999...aaaa', name: 'Frank' },
          { address: '0xbbbb...cccc', name: 'Grace' }
        ]
      }
    ],
    totalValue: '43.25',
    totalVaults: 3,
    lockedAmount: '30.75',
    unlockedAmount: '12.50'
  })
})

app.post('/api/vaults/:vaultId/deposit', async (c) => {
  const vaultId = c.req.param('vaultId')
  const { amount, fromAddress } = await c.req.json()
  
  // Simulate deposit transaction
  return c.json({
    success: true,
    transactionHash: '0xabcdef...' + Math.random().toString(36).substring(7),
    vaultId,
    amount,
    fromAddress,
    timestamp: new Date().toISOString()
  })
})

app.post('/api/vaults/:vaultId/withdraw', async (c) => {
  const vaultId = c.req.param('vaultId')
  const { amount, toAddress } = await c.req.json()
  
  // Simulate withdrawal transaction
  return c.json({
    success: true,
    transactionHash: '0x123456...' + Math.random().toString(36).substring(7),
    vaultId,
    amount,
    toAddress,
    timestamp: new Date().toISOString()
  })
})

// Add the missing /api/vaults endpoint (redirect to mock for now)
app.get('/api/vaults', (c) => {
  return c.json({
    success: true,
    vaults: [
      {
        id: '0x1234...5678',
        name: 'Emergency Fund',
        status: 'locked',
        balance: '5.75',
        symbol: 'ETH',
        unlockDate: '2024-06-15T10:00:00Z',
        timeRemaining: 2592000, // 30 days in seconds
        guardians: [
          { address: '0xabcd...efgh', name: 'Alice' },
          { address: '0x1111...2222', name: 'Bob' }
        ]
      },
      {
        id: '0x9876...5432',
        name: 'Savings Vault',
        status: 'unlocked',
        balance: '12.50',
        symbol: 'ETH',
        unlockDate: '2024-01-15T09:00:00Z',
        timeRemaining: 0,
        guardians: [
          { address: '0x3333...4444', name: 'Charlie' },
          { address: '0x5555...6666', name: 'Diana' }
        ]
      },
      {
        id: '0xaaaa...bbbb',
        name: 'Investment Portfolio',
        status: 'pending',
        balance: '25.00',
        symbol: 'ETH',
        unlockDate: '2025-12-25T00:00:00Z',
        timeRemaining: 31536000, // 365 days in seconds
        guardians: [
          { address: '0x7777...8888', name: 'Eve' },
          { address: '0x9999...aaaa', name: 'Frank' },
          { address: '0xbbbb...cccc', name: 'Grace' }
        ]
      }
    ],
    totalValue: '43.25',
    totalVaults: 3,
    lockedAmount: '30.75',
    unlockedAmount: '12.50'
  })
})

// Add the missing /api/transactions endpoint
app.get('/api/transactions', (c) => {
  return c.json({
    success: true,
    transactions: [
      {
        id: '0xabcdef123456789',
        type: 'deposit',
        vaultId: '0x1234...5678',
        vaultName: 'Emergency Fund',
        amount: '2.5',
        symbol: 'ETH',
        fromAddress: '0x742d35Cc6B2c4032946A2e7d4BA99BD55',
        timestamp: '2024-03-15T14:30:00Z',
        status: 'confirmed',
        blockNumber: 12345678
      },
      {
        id: '0x987654321fedcba',
        type: 'withdrawal',
        vaultId: '0x9876...5432',
        vaultName: 'Savings Vault', 
        amount: '5.0',
        symbol: 'ETH',
        toAddress: '0x742d35Cc6B2c4032946A2e7d4BA99BD55',
        timestamp: '2024-03-10T09:15:00Z',
        status: 'confirmed',
        blockNumber: 12340000
      },
      {
        id: '0xfedcba0987654321',
        type: 'vault_created',
        vaultId: '0xaaaa...bbbb',
        vaultName: 'Investment Portfolio',
        amount: '25.0',
        symbol: 'ETH',
        fromAddress: '0x742d35Cc6B2c4032946A2e7d4BA99BD55',
        timestamp: '2024-02-28T16:45:00Z',
        status: 'confirmed',
        blockNumber: 12330000
      }
    ],
    totalTransactions: 3,
    pendingTransactions: 0
  })
})

// Test endpoint for running frontend validation tests
app.get('/test', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CreatorHub.Brave - Frontend Tests</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-slate-50 font-brand">
        <div class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-slate-900 mb-6">Frontend Tests</h1>
            
            <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 class="text-xl font-semibold text-slate-800 mb-4">Validation Tests</h2>
                <div id="test-output" class="font-mono text-sm bg-slate-900 text-green-400 p-4 rounded-lg min-h-96 overflow-auto">
                    <div>Loading tests...</div>
                </div>
                <button 
                    id="run-tests" 
                    onclick="runTests()" 
                    class="mt-4 bg-brave-blue-900 hover:bg-brave-blue-800 text-white px-6 py-2 rounded-lg font-medium"
                >
                    Run Tests Again
                </button>
            </div>
            
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-semibold text-slate-800 mb-4">Quick Validation Check</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Test Address:</label>
                        <input 
                            id="test-address" 
                            type="text" 
                            placeholder="0x742d35Cc..."
                            class="input-field"
                        >
                        <button 
                            onclick="validateAddress()" 
                            class="mt-2 bg-vault-gold-500 hover:bg-vault-gold-600 text-white px-4 py-2 rounded-lg text-sm"
                        >
                            Validate Address
                        </button>
                        <div id="address-result" class="mt-2 text-sm"></div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Test Date:</label>
                        <input 
                            id="test-date" 
                            type="date" 
                            class="input-field"
                        >
                        <button 
                            onclick="validateDate()" 
                            class="mt-2 bg-vault-gold-500 hover:bg-vault-gold-600 text-white px-4 py-2 rounded-lg text-sm"
                        >
                            Validate Date
                        </button>
                        <div id="date-result" class="mt-2 text-sm"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <script src="/static/validation.js"></script>
        <script>
            function runTests() {
                const output = document.getElementById('test-output');
                output.innerHTML = '<div class="text-yellow-400">Running tests...</div>';
                
                // Clear previous results
                if (window.testResults) {
                    delete window.testResults;
                }
                
                // Capture console output
                const originalLog = console.log;
                const originalError = console.error;
                let testOutput = '';
                
                console.log = (...args) => {
                    testOutput += args.join(' ') + '\\n';
                    originalLog.apply(console, args);
                };
                
                console.error = (...args) => {
                    testOutput += '<span class="text-red-400">' + args.join(' ') + '</span>\\n';
                    originalError.apply(console, args);
                };
                
                try {
                    // Load and run tests
                    fetch('/static/validation.test.js')
                        .then(response => response.text())
                        .then(testCode => {
                            eval(testCode);
                            
                            // Restore console
                            console.log = originalLog;
                            console.error = originalError;
                            
                            // Display results
                            output.innerHTML = '<pre>' + testOutput.replace(/\\n/g, '<br>') + '</pre>';
                            
                            if (window.testResults && window.testResults.success) {
                                output.style.borderColor = '#16a34a';
                            } else {
                                output.style.borderColor = '#dc2626';
                            }
                        });
                } catch (error) {
                    console.log = originalLog;
                    console.error = originalError;
                    output.innerHTML = '<div class="text-red-400">Test execution failed: ' + error.message + '</div>';
                }
            }
            
            function validateAddress() {
                const address = document.getElementById('test-address').value;
                const result = document.getElementById('address-result');
                
                if (!address) {
                    result.innerHTML = '<span class="text-red-600">Please enter an address</span>';
                    return;
                }
                
                if (window.VaultValidation) {
                    const isValid = ethers.utils.isAddress(address);
                    if (isValid) {
                        result.innerHTML = '<span class="text-green-600">✅ Valid Ethereum address</span>';
                    } else {
                        result.innerHTML = '<span class="text-red-600">❌ Invalid Ethereum address</span>';
                    }
                } else {
                    result.innerHTML = '<span class="text-yellow-600">Validation functions not loaded</span>';
                }
            }
            
            function validateDate() {
                const date = document.getElementById('test-date').value;
                const result = document.getElementById('date-result');
                
                if (!date) {
                    result.innerHTML = '<span class="text-red-600">Please select a date</span>';
                    return;
                }
                
                if (window.VaultValidation) {
                    const validation = window.VaultValidation.validateUnlockDate(date, '12:00');
                    if (validation.isValid) {
                        result.innerHTML = '<span class="text-green-600">✅ Valid unlock date</span>';
                    } else {
                        result.innerHTML = '<span class="text-red-600">❌ ' + validation.errors[0] + '</span>';
                    }
                } else {
                    result.innerHTML = '<span class="text-yellow-600">Validation functions not loaded</span>';
                }
            }
            
            // Set tomorrow as default test date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('test-date').value = tomorrow.toISOString().split('T')[0];
            
            // Run tests automatically on load
            document.addEventListener('DOMContentLoaded', runTests);
        </script>
        
        <script src="https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js"></script>
    </body>
    </html>
  `)
})

// Main application route
app.get('/', (c) => {
  return c.render(
    <div id="root">
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-brave-blue-900 text-white shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <a href="#home" className="text-xl font-bold hover:text-vault-gold-300 transition-colors">
                  CreatorHub.Brave
                </a>
                <div className="hidden md:flex space-x-6">
                  <a href="#home" className="text-sm font-medium hover:text-vault-gold-300 transition-colors">
                    Home
                  </a>
                  <a href="#create" className="text-sm font-medium hover:text-vault-gold-300 transition-colors">
                    Create Vault
                  </a>
                  <a href="#dashboard" className="text-sm font-medium hover:text-vault-gold-300 transition-colors">
                    Dashboard
                  </a>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Network indicator */}
                <div className="hidden sm:flex items-center text-sm text-brave-blue-200">
                  <div className="w-2 h-2 bg-trust-green-400 rounded-full mr-2"></div>
                  <span>Testnet</span>
                </div>
                
                {/* Wallet connection will be replaced by enhanced version */}
                <button 
                  id="connect-wallet-btn" 
                  className="bg-vault-gold-500 hover:bg-vault-gold-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        </nav>
        
        <main>
          <div id="app">
            {/* React app will be mounted here */}
            <div className="text-center py-16">
              <div className="animate-spin w-12 h-12 border-4 border-brave-blue-200 border-t-brave-blue-600 rounded-full mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Loading CreatorHub.Brave</h2>
              <p className="text-slate-600">Preparing your secure vault platform...</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
})

export default app
