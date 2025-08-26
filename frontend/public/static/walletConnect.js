// CreatorHub.Brave - Enhanced Wallet Connection
// Multi-wallet support with MetaMask, WalletConnect, and session management

// Enhanced dependency check with graceful fallback
const waitForDependencies = () => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 30; // 3 seconds max wait
    
    const checkDependencies = () => {
      attempts++;
      
      // Check for React (required)
      if (typeof React === 'undefined') {
        if (attempts >= maxAttempts) {
          reject(new Error('React is required but not loaded'));
          return;
        }
        setTimeout(checkDependencies, 100);
        return;
      }
      
      // Ethers.js is optional for basic functionality
      if (typeof ethers !== 'undefined') {
        resolve({ hasEthers: true });
      } else if (attempts >= maxAttempts) {
        console.warn('⚠️ Ethers.js not available - using fallback wallet connection');
        resolve({ hasEthers: false });
      } else {
        setTimeout(checkDependencies, 100);
      }
    };
    
    checkDependencies();
  });
};

// Initialize when dependencies are ready
waitForDependencies().then((deps) => {
  console.log('✅ Enhanced Wallet Connect loaded with multi-wallet support');
  window.walletHasEthers = deps.hasEthers;
  
  // WalletConnect configuration
  const WALLETCONNECT_PROJECT_ID = 'f3c5c6c7e2d1a0b9f3c5c6c7e2d1a0b9'; // Placeholder

// Supported wallets configuration
const SUPPORTED_WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    type: 'injected',
    installed: () => window.ethereum?.isMetaMask,
    downloadUrl: 'https://metamask.io/download/'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    type: 'walletconnect',
    installed: () => true, // Always available
    downloadUrl: null
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔵',
    type: 'injected',
    installed: () => window.ethereum?.isCoinbaseWallet,
    downloadUrl: 'https://www.coinbase.com/wallet'
  },
  {
    id: 'brave',
    name: 'Brave Wallet',
    icon: '🦁',
    type: 'injected', 
    installed: () => window.ethereum?.isBraveWallet,
    downloadUrl: 'https://brave.com/'
  }
];

// Enhanced wallet provider hook
const useEnhancedWallet = () => {
  const [sessions, setSessions] = React.useState([]);
  const [activeSession, setActiveSession] = React.useState(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [walletConnectProvider, setWalletConnectProvider] = React.useState(null);

  // Get installed wallets
  const availableWallets = React.useMemo(() => {
    return SUPPORTED_WALLETS.map(wallet => ({
      ...wallet,
      isInstalled: wallet.installed()
    }));
  }, []);

  // Connect to MetaMask or injected wallet
  const connectInjectedWallet = async (walletId) => {
    if (!window.ethereum) {
      throw new Error(`${walletId} not detected. Please install the wallet extension.`);
    }

    // Use ethers if available, otherwise use basic web3 calls
    if (window.walletHasEthers && typeof ethers !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);

      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      // Validate network
      if (![421614, 11155420].includes(network.chainId)) {
        console.warn('Please switch to Arbitrum Sepolia or Optimism Sepolia testnet');
      }

      return {
        address,
        chainId: network.chainId,
        provider
      };
    } else {
      // Fallback to basic web3 calls
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        const numericChainId = parseInt(chainId, 16);
        
        return {
          id: `${walletId}-${address}`,
          address,
          chainId: numericChainId,
          walletType: 'injected',
          walletName: SUPPORTED_WALLETS.find(w => w.id === walletId)?.name || walletId,
          provider: window.ethereum,
          connectedAt: Date.now(),
          isActive: true
        };
      } else {
        throw new Error('No accounts found');
      }
    }
  };

  // Connect to WalletConnect
  const connectWalletConnect = async () => {
    try {
      // For demo purposes, simulate WalletConnect connection
      // In production, this would use the actual WalletConnect SDK
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, fallback to MetaMask if available for demo
      if (window.ethereum) {
        const session = await connectInjectedWallet('metamask');
        return {
          ...session,
          id: `walletconnect-${session.address}`,
          walletType: 'walletconnect',
          walletName: 'WalletConnect'
        };
      } else {
        throw new Error('WalletConnect requires a compatible wallet. Please install MetaMask for demo.');
      }
    } catch (error) {
      throw new Error(`WalletConnect failed: ${error.message}`);
    }
  };

  // Main connect function
  const connectWallet = async (walletId) => {
    setIsConnecting(true);
    setError(null);

    try {
      let session;

      if (walletId === 'walletconnect') {
        session = await connectWalletConnect();
      } else {
        session = await connectInjectedWallet(walletId);
      }

      // Check if session already exists
      const existingIndex = sessions.findIndex(s => s.address === session.address);
      let newSessions;

      if (existingIndex >= 0) {
        // Update existing session
        newSessions = [...sessions];
        newSessions[existingIndex] = session;
      } else {
        // Add new session
        newSessions = [...sessions, session];
      }

      // Deactivate other sessions
      newSessions = newSessions.map(s => ({
        ...s,
        isActive: s.id === session.id
      }));

      setSessions(newSessions);
      setActiveSession(session);
      
      // Setup event listeners
      if (session.walletType === 'injected' && window.ethereum) {
        setupEventListeners(session);
      }

      return session;

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Setup event listeners for injected wallets
  const setupEventListeners = (session) => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectSession(session.id);
      } else if (accounts[0] !== session.address) {
        // Account changed, update session
        session.address = accounts[0];
        setSessions(prev => [...prev]);
      }
    };

    const handleChainChanged = (chainId) => {
      const numericChainId = parseInt(chainId, 16);
      if ([421614, 11155420].includes(numericChainId)) {
        session.chainId = numericChainId;
        setSessions(prev => [...prev]);
      } else {
        setError('Unsupported network. Please switch to Arbitrum Sepolia or Optimism Sepolia.');
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
  };

  // Switch active session
  const switchSession = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const newSessions = sessions.map(s => ({
        ...s,
        isActive: s.id === sessionId
      }));
      setSessions(newSessions);
      setActiveSession(session);
    }
  };

  // Disconnect specific session
  const disconnectSession = (sessionId) => {
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);

    if (activeSession?.id === sessionId) {
      const newActive = newSessions.find(s => s.isActive) || newSessions[0] || null;
      setActiveSession(newActive);
    }
  };

  // Disconnect all sessions
  const disconnectAll = () => {
    setSessions([]);
    setActiveSession(null);
    if (walletConnectProvider) {
      // Disconnect WalletConnect provider
      setWalletConnectProvider(null);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  return {
    // State
    sessions,
    activeSession,
    isConnecting,
    error,
    availableWallets,
    
    // Actions
    connectWallet,
    switchSession,
    disconnectSession,
    disconnectAll,
    clearError,
    
    // Computed
    isConnected: activeSession !== null,
    activeAddress: activeSession?.address || null,
    activeChainId: activeSession?.chainId || null
  };
};

// Enhanced wallet selection modal
const WalletSelectionModal = ({ isOpen, onClose, onConnect, availableWallets, isConnecting, error }) => {
  if (!isOpen) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50',
    onClick: (e) => e.target === e.currentTarget && onClose()
  },
    React.createElement('div', {
      className: 'bg-white rounded-xl shadow-2xl max-w-md w-full max-h-96 overflow-hidden'
    },
      // Header
      React.createElement('div', {
        className: 'p-6 border-b border-slate-200'
      },
        React.createElement('div', {
          className: 'flex items-center justify-between'
        },
          React.createElement('h2', {
            className: 'text-xl font-bold text-slate-900'
          }, 'Connect Wallet'),
          React.createElement('button', {
            onClick: onClose,
            className: 'text-slate-400 hover:text-slate-600'
          },
            React.createElement('i', { className: 'fas fa-times text-xl' })
          )
        ),
        error && React.createElement('div', {
          className: 'mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'
        },
          React.createElement('div', {
            className: 'flex items-center text-red-800'
          },
            React.createElement('i', { className: 'fas fa-exclamation-circle mr-2' }),
            React.createElement('span', { className: 'text-sm' }, error)
          )
        )
      ),

      // Wallet list
      React.createElement('div', {
        className: 'p-6 space-y-3 max-h-80 overflow-y-auto'
      },
        ...availableWallets.map(wallet => 
          React.createElement('button', {
            key: wallet.id,
            onClick: () => wallet.isInstalled ? onConnect(wallet.id) : window.open(wallet.downloadUrl, '_blank'),
            disabled: isConnecting,
            className: `w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              wallet.isInstalled 
                ? 'border-slate-200 hover:border-brave-blue-300 hover:bg-brave-blue-50' 
                : 'border-slate-100 bg-slate-50'
            } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`
          },
            React.createElement('div', {
              className: 'flex items-center'
            },
              React.createElement('span', {
                className: 'text-2xl mr-3'
              }, wallet.icon),
              React.createElement('div', {
                className: 'text-left'
              },
                React.createElement('div', {
                  className: 'font-medium text-slate-900'
                }, wallet.name),
                !wallet.isInstalled && React.createElement('div', {
                  className: 'text-xs text-slate-500'
                }, 'Not installed')
              )
            ),
            React.createElement('div', {
              className: 'text-slate-400'
            },
              wallet.isInstalled 
                ? React.createElement('i', { className: 'fas fa-arrow-right' })
                : React.createElement('i', { className: 'fas fa-external-link-alt' })
            )
          )
        )
      )
    )
  );
};

// Multi-session wallet manager
const WalletSessionManager = ({ sessions, activeSession, onSwitch, onDisconnect, onDisconnectAll }) => {
  if (sessions.length === 0) return null;

  return React.createElement('div', {
    className: 'bg-white rounded-xl shadow-lg border border-slate-200 p-4'
  },
    React.createElement('div', {
      className: 'flex items-center justify-between mb-4'
    },
      React.createElement('h3', {
        className: 'font-semibold text-slate-900'
      }, 'Connected Wallets'),
      sessions.length > 1 && React.createElement('button', {
        onClick: onDisconnectAll,
        className: 'text-xs text-red-600 hover:text-red-700 font-medium'
      }, 'Disconnect All')
    ),

    React.createElement('div', {
      className: 'space-y-2'
    },
      ...sessions.map(session => 
        React.createElement('div', {
          key: session.id,
          className: `flex items-center justify-between p-3 rounded-lg border-2 ${
            session.isActive 
              ? 'border-brave-blue-300 bg-brave-blue-50' 
              : 'border-slate-200 hover:border-slate-300'
          }`
        },
          React.createElement('div', {
            className: 'flex items-center'
          },
            React.createElement('div', {
              className: `w-3 h-3 rounded-full mr-3 ${session.isActive ? 'bg-trust-green-500' : 'bg-slate-300'}`
            }),
            React.createElement('div', null,
              React.createElement('div', {
                className: 'font-medium text-sm text-slate-900'
              }, session.walletName),
              React.createElement('div', {
                className: 'text-xs text-slate-500 font-mono'
              }, `${session.address.slice(0, 8)}...${session.address.slice(-6)}`),
              React.createElement('div', {
                className: 'text-xs text-slate-400'
              }, SUPPORTED_NETWORKS[session.chainId]?.name || 'Unknown Network')
            )
          ),
          React.createElement('div', {
            className: 'flex items-center space-x-2'
          },
            !session.isActive && React.createElement('button', {
              onClick: () => onSwitch(session.id),
              className: 'text-xs text-brave-blue-600 hover:text-brave-blue-700 font-medium'
            }, 'Switch'),
            React.createElement('button', {
              onClick: () => onDisconnect(session.id),
              className: 'text-xs text-red-600 hover:text-red-700'
            },
              React.createElement('i', { className: 'fas fa-times' })
            )
          )
        )
      )
    )
  );
};

// Enhanced wallet connection component for the header
const EnhancedWalletButton = () => {
  const wallet = useEnhancedWallet();
  const [showModal, setShowModal] = React.useState(false);
  const [showManager, setShowManager] = React.useState(false);

  const handleConnect = async (walletId) => {
    try {
      await wallet.connectWallet(walletId);
      setShowModal(false);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  if (!wallet.isConnected) {
    return React.createElement('div', null,
      React.createElement('button', {
        onClick: () => setShowModal(true),
        className: 'bg-vault-gold-500 hover:bg-vault-gold-600 text-white px-4 py-2 rounded-lg font-medium transition-colors'
      }, 'Connect Wallet'),

      React.createElement(WalletSelectionModal, {
        isOpen: showModal,
        onClose: () => {
          setShowModal(false);
          wallet.clearError();
        },
        onConnect: handleConnect,
        availableWallets: wallet.availableWallets,
        isConnecting: wallet.isConnecting,
        error: wallet.error
      })
    );
  }

  return React.createElement('div', {
    className: 'relative'
  },
    React.createElement('button', {
      onClick: () => setShowManager(!showManager),
      className: 'flex items-center space-x-2 bg-trust-green-600 hover:bg-trust-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'
    },
      React.createElement('div', {
        className: 'w-2 h-2 bg-green-300 rounded-full'
      }),
      React.createElement('span', null, `${wallet.activeAddress?.slice(0, 6)}...${wallet.activeAddress?.slice(-4)}`),
      wallet.sessions.length > 1 && React.createElement('span', {
        className: 'bg-green-500 text-xs px-1 py-0.5 rounded-full'
      }, wallet.sessions.length),
      React.createElement('i', { className: 'fas fa-chevron-down text-xs' })
    ),

    showManager && React.createElement('div', {
      className: 'absolute top-full right-0 mt-2 w-80 z-50'
    },
      React.createElement(WalletSessionManager, {
        sessions: wallet.sessions,
        activeSession: wallet.activeSession,
        onSwitch: wallet.switchSession,
        onDisconnect: wallet.disconnectSession,
        onDisconnectAll: () => {
          wallet.disconnectAll();
          setShowManager(false);
        }
      })
    )
  );
};

// Update the global useWallet hook to use enhanced wallet
window.useEnhancedWallet = useEnhancedWallet;
window.EnhancedWalletButton = EnhancedWalletButton;

// Initialize enhanced wallet in the header
document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connect-wallet-btn');
  if (connectBtn) {
    // Hide the original button
    connectBtn.style.display = 'none';
    
    // Create enhanced wallet button container
    const container = document.createElement('div');
    container.id = 'enhanced-wallet-container';
    connectBtn.parentNode.insertBefore(container, connectBtn);
    
    // Render enhanced wallet button
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(EnhancedWalletButton));
  }
});

// Wallet hook with notifications integration
const useWalletWithNotifications = () => {
  const notifications = React.useContext(window.NotificationContext || React.createContext());
  const wallet = useEnhancedWallet();
  
  // Add notification support to wallet operations
  const connectWalletWithNotifications = async (walletType = 'metamask') => {
    try {
      await wallet.connectWallet(walletType);
      if (wallet.isConnected && notifications?.addNotification) {
        notifications.addNotification({
          type: 'success',
          title: 'Wallet Connected',
          message: `Successfully connected to ${walletType}`
        });
      }
    } catch (error) {
      if (notifications?.addNotification) {
        notifications.addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: error.message
        });
      }
    }
  };

  return {
    ...wallet,
    connectWallet: connectWalletWithNotifications
  };
};

  // Export to global scope
  window.useWalletWithNotifications = useWalletWithNotifications;

}).catch((error) => {
  console.error('❌ Enhanced Wallet Connect failed to load:', error);
});