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
        <nav className="bg-brave-blue-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="text-xl font-bold">CreatorHub.Brave</div>
              </div>
              <div>
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
        
        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Secure Your Tomorrow
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Create time-locked vaults to secure your crypto assets until the perfect moment. 
              Built on Ethereum Layer 2 with social recovery.
            </p>
          </div>
          
          <div id="vault-wizard-container" className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-brave-blue-50 text-brave-blue-900 rounded-full mb-6">
                  <i className="fas fa-lock mr-2"></i>
                  Vault Creation Wizard
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Create Your Secure Vault</h2>
                <p className="text-slate-600 mb-8">
                  Follow these steps to create your time-locked cryptocurrency vault
                </p>
                
                <div className="text-left">
                  <div id="app">
                    {/* React app will be mounted here */}
                    <div className="text-center py-12">
                      <div className="animate-spin w-8 h-8 border-4 border-brave-blue-200 border-t-brave-blue-600 rounded-full mx-auto mb-4"></div>
                      <p className="text-slate-600">Loading Vault Wizard...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
})

export default app
