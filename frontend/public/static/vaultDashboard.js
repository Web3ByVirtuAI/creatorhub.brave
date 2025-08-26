// CreatorHub.Brave - Vault Management Dashboard
// Comprehensive vault operations, portfolio tracking, and management interface

// Vault operations hook
const useVaultOperations = (wallet) => {
  const [vaults, setVaults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [transactions, setTransactions] = React.useState([]);

  // Mock vault data for development
  const mockVaults = [
    {
      address: '0x742d35Cc6634C0532925a3b8D55B4E52Eb1b4870',
      beneficiary: wallet?.activeAddress,
      unlockTime: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      ethBalance: '2.5',
      tokenBalances: [],
      guardians: ['0x1234567890123456789012345678901234567890'],
      guardianThreshold: 1,
      createdAt: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
      chainId: 421614,
      isLocked: true,
      totalValue: '2.5'
    },
    {
      address: '0x5678901234567890123456789012345678901234',
      beneficiary: wallet?.activeAddress,
      unlockTime: Math.floor(Date.now() / 1000) - (5 * 24 * 60 * 60), // 5 days ago (unlocked)
      ethBalance: '1.2',
      tokenBalances: [],
      guardians: ['0x1234567890123456789012345678901234567890', '0x9876543210987654321098765432109876543210'],
      guardianThreshold: 2,
      createdAt: Date.now() - (45 * 24 * 60 * 60 * 1000), // 45 days ago
      chainId: 11155420,
      isLocked: false,
      totalValue: '1.2'
    }
  ];

  // Load user's vaults
  const loadVaults = React.useCallback(async () => {
    if (!wallet?.activeSession) return;

    setLoading(true);
    setError(null);

    try {
      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userVaults = mockVaults.filter(v => 
        v.beneficiary?.toLowerCase() === wallet.activeAddress?.toLowerCase()
      );
      
      setVaults(userVaults);
    } catch (err) {
      setError(err.message || 'Failed to load vaults');
    } finally {
      setLoading(false);
    }
  }, [wallet?.activeAddress]);

  // Load vaults when wallet connects
  React.useEffect(() => {
    loadVaults();
  }, [loadVaults]);

  // Deposit ETH to vault
  const depositToVault = async (vaultAddress, amount) => {
    if (!wallet?.activeSession) throw new Error('Wallet not connected');

    try {
      const tx = {
        type: 'deposit',
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        vault: vaultAddress,
        amount,
        timestamp: Date.now(),
        status: 'pending'
      };

      setTransactions(prev => [tx, ...prev]);

      // Simulate transaction confirmation
      setTimeout(() => {
        setTransactions(prev => 
          prev.map(t => 
            t.hash === tx.hash 
              ? { ...t, status: 'confirmed' }
              : t
          )
        );

        // Update vault balance
        setVaults(prev => 
          prev.map(v => 
            v.address === vaultAddress
              ? { ...v, ethBalance: (parseFloat(v.ethBalance) + parseFloat(amount)).toString() }
              : v
          )
        );
      }, 3000);

      return tx;
    } catch (err) {
      throw new Error(err.message || 'Deposit failed');
    }
  };

  // Withdraw from vault
  const withdrawFromVault = async (vaultAddress, amount) => {
    if (!wallet?.activeSession) throw new Error('Wallet not connected');

    const vault = vaults.find(v => v.address === vaultAddress);
    if (!vault) throw new Error('Vault not found');
    if (vault.isLocked) throw new Error('Vault is still locked');

    try {
      const tx = {
        type: 'withdrawal',
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        vault: vaultAddress,
        amount,
        timestamp: Date.now(),
        status: 'pending'
      };

      setTransactions(prev => [tx, ...prev]);

      // Simulate transaction confirmation
      setTimeout(() => {
        setTransactions(prev => 
          prev.map(t => 
            t.hash === tx.hash 
              ? { ...t, status: 'confirmed' }
              : t
          )
        );

        // Update vault balance
        setVaults(prev => 
          prev.map(v => 
            v.address === vaultAddress
              ? { ...v, ethBalance: (parseFloat(v.ethBalance) - parseFloat(amount)).toString() }
              : v
          )
        );
      }, 3000);

      return tx;
    } catch (err) {
      throw new Error(err.message || 'Withdrawal failed');
    }
  };

  return {
    vaults,
    loading,
    error,
    transactions,
    loadVaults,
    depositToVault,
    withdrawFromVault
  };
};

// Portfolio overview component
const PortfolioOverview = ({ vaults, transactions }) => {
  const totalValue = React.useMemo(() => {
    return vaults.reduce((sum, vault) => sum + parseFloat(vault.ethBalance), 0);
  }, [vaults]);

  const lockedValue = React.useMemo(() => {
    return vaults
      .filter(v => v.isLocked)
      .reduce((sum, vault) => sum + parseFloat(vault.ethBalance), 0);
  }, [vaults]);

  const unlockedValue = totalValue - lockedValue;

  return React.createElement('div', {
    className: 'bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-8'
  },
    React.createElement('h2', {
      className: 'text-2xl font-bold text-slate-900 mb-6'
    }, 'Portfolio Overview'),

    React.createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-4 gap-6'
    },
      React.createElement('div', {
        className: 'bg-gradient-to-r from-brave-blue-500 to-brave-blue-600 text-white p-6 rounded-xl'
      },
        React.createElement('div', {
          className: 'flex items-center justify-between mb-2'
        },
          React.createElement('h3', {
            className: 'text-sm font-medium opacity-90'
          }, 'Total Value'),
          React.createElement('i', { className: 'fas fa-wallet text-xl opacity-75' })
        ),
        React.createElement('div', {
          className: 'text-2xl font-bold'
        }, `${totalValue.toFixed(4)} ETH`)
      ),

      React.createElement('div', {
        className: 'bg-gradient-to-r from-vault-gold-500 to-vault-gold-600 text-white p-6 rounded-xl'
      },
        React.createElement('div', {
          className: 'flex items-center justify-between mb-2'
        },
          React.createElement('h3', {
            className: 'text-sm font-medium opacity-90'
          }, 'Locked Value'),
          React.createElement('i', { className: 'fas fa-lock text-xl opacity-75' })
        ),
        React.createElement('div', {
          className: 'text-2xl font-bold'
        }, `${lockedValue.toFixed(4)} ETH`)
      ),

      React.createElement('div', {
        className: 'bg-gradient-to-r from-trust-green-500 to-trust-green-600 text-white p-6 rounded-xl'
      },
        React.createElement('div', {
          className: 'flex items-center justify-between mb-2'
        },
          React.createElement('h3', {
            className: 'text-sm font-medium opacity-90'
          }, 'Available Value'),
          React.createElement('i', { className: 'fas fa-unlock text-xl opacity-75' })
        ),
        React.createElement('div', {
          className: 'text-2xl font-bold'
        }, `${unlockedValue.toFixed(4)} ETH`)
      ),

      React.createElement('div', {
        className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl'
      },
        React.createElement('div', {
          className: 'flex items-center justify-between mb-2'
        },
          React.createElement('h3', {
            className: 'text-sm font-medium opacity-90'
          }, 'Total Vaults'),
          React.createElement('i', { className: 'fas fa-boxes text-xl opacity-75' })
        ),
        React.createElement('div', {
          className: 'text-2xl font-bold'
        }, vaults.length)
      )
    )
  );
};

// Vault card component
const VaultCard = ({ vault, onDeposit, onWithdraw }) => {
  const [showDeposit, setShowDeposit] = React.useState(false);
  const [showWithdraw, setShowWithdraw] = React.useState(false);
  const [depositAmount, setDepositAmount] = React.useState('');
  const [withdrawAmount, setWithdrawAmount] = React.useState('');

  const timeUntilUnlock = React.useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = vault.unlockTime - now;
    
    if (timeRemaining <= 0) return 'Unlocked';
    
    const days = Math.floor(timeRemaining / (24 * 60 * 60));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }, [vault.unlockTime]);

  const networkName = SUPPORTED_NETWORKS[vault.chainId]?.name || 'Unknown';

  return React.createElement('div', {
    className: 'bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden transition-all hover:shadow-xl'
  },
    // Card header
    React.createElement('div', {
      className: `p-6 bg-gradient-to-r ${vault.isLocked ? 'from-brave-blue-500 to-brave-blue-600' : 'from-trust-green-500 to-trust-green-600'} text-white`
    },
      React.createElement('div', {
        className: 'flex items-center justify-between mb-4'
      },
        React.createElement('div', {
          className: 'flex items-center'
        },
          React.createElement('i', {
            className: `fas ${vault.isLocked ? 'fa-lock' : 'fa-unlock'} text-2xl mr-3`
          }),
          React.createElement('div', null,
            React.createElement('h3', {
              className: 'font-bold text-lg'
            }, vault.isLocked ? 'Locked Vault' : 'Unlocked Vault'),
            React.createElement('p', {
              className: 'text-sm opacity-90 font-mono'
            }, `${vault.address.slice(0, 8)}...${vault.address.slice(-6)}`)
          )
        ),
        React.createElement('div', {
          className: 'text-right'
        },
          React.createElement('div', {
            className: 'text-2xl font-bold'
          }, `${vault.ethBalance} ETH`),
          React.createElement('div', {
            className: 'text-sm opacity-90'
          }, networkName)
        )
      ),

      React.createElement('div', {
        className: 'flex items-center justify-between'
      },
        React.createElement('div', null,
          React.createElement('div', {
            className: 'text-sm opacity-90'
          }, vault.isLocked ? 'Unlocks in:' : 'Unlocked'),
          React.createElement('div', {
            className: 'font-semibold'
          }, timeUntilUnlock)
        ),
        React.createElement('div', {
          className: 'text-right'
        },
          React.createElement('div', {
            className: 'text-sm opacity-90'
          }, 'Guardians'),
          React.createElement('div', {
            className: 'font-semibold'
          }, `${vault.guardians.length}`)
        )
      )
    ),

    // Card content
    React.createElement('div', {
      className: 'p-6'
    },
      React.createElement('div', {
        className: 'flex space-x-3'
      },
        React.createElement('button', {
          onClick: () => setShowDeposit(true),
          className: 'flex-1 bg-vault-gold-500 hover:bg-vault-gold-600 text-white py-2 px-4 rounded-lg font-medium transition-colors'
        }, 'Deposit'),
        !vault.isLocked && React.createElement('button', {
          onClick: () => setShowWithdraw(true),
          className: 'flex-1 bg-trust-green-600 hover:bg-trust-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors'
        }, 'Withdraw')
      )
    ),

    // Deposit modal
    showDeposit && React.createElement('div', {
      className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50',
      onClick: (e) => e.target === e.currentTarget && setShowDeposit(false)
    },
      React.createElement('div', {
        className: 'bg-white rounded-xl shadow-2xl max-w-md w-full p-6'
      },
        React.createElement('h3', {
          className: 'text-lg font-bold text-slate-900 mb-4'
        }, 'Deposit to Vault'),
        React.createElement('div', {
          className: 'mb-4'
        },
          React.createElement('label', {
            className: 'block text-sm font-medium text-slate-700 mb-2'
          }, 'Amount (ETH)'),
          React.createElement('input', {
            type: 'number',
            step: '0.001',
            value: depositAmount,
            onChange: (e) => setDepositAmount(e.target.value),
            className: 'w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brave-blue-500',
            placeholder: '0.1'
          })
        ),
        React.createElement('div', {
          className: 'flex space-x-3'
        },
          React.createElement('button', {
            onClick: () => setShowDeposit(false),
            className: 'flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg'
          }, 'Cancel'),
          React.createElement('button', {
            onClick: async () => {
              try {
                await onDeposit?.(vault.address, depositAmount);
                setDepositAmount('');
                setShowDeposit(false);
              } catch (error) {
                console.error('Deposit failed:', error);
              }
            },
            disabled: !depositAmount || parseFloat(depositAmount) <= 0,
            className: 'flex-1 px-4 py-2 bg-vault-gold-500 hover:bg-vault-gold-600 disabled:bg-slate-300 text-white rounded-lg'
          }, 'Deposit')
        )
      )
    ),

    // Withdraw modal
    showWithdraw && React.createElement('div', {
      className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50',
      onClick: (e) => e.target === e.currentTarget && setShowWithdraw(false)
    },
      React.createElement('div', {
        className: 'bg-white rounded-xl shadow-2xl max-w-md w-full p-6'
      },
        React.createElement('h3', {
          className: 'text-lg font-bold text-slate-900 mb-4'
        }, 'Withdraw from Vault'),
        React.createElement('div', {
          className: 'mb-4'
        },
          React.createElement('label', {
            className: 'block text-sm font-medium text-slate-700 mb-2'
          }, 'Amount (ETH)'),
          React.createElement('input', {
            type: 'number',
            step: '0.001',
            max: vault.ethBalance,
            value: withdrawAmount,
            onChange: (e) => setWithdrawAmount(e.target.value),
            className: 'w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-trust-green-500',
            placeholder: `Max: ${vault.ethBalance}`
          })
        ),
        React.createElement('div', {
          className: 'flex space-x-3'
        },
          React.createElement('button', {
            onClick: () => setShowWithdraw(false),
            className: 'flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg'
          }, 'Cancel'),
          React.createElement('button', {
            onClick: async () => {
              try {
                await onWithdraw?.(vault.address, withdrawAmount);
                setWithdrawAmount('');
                setShowWithdraw(false);
              } catch (error) {
                console.error('Withdrawal failed:', error);
              }
            },
            disabled: !withdrawAmount || parseFloat(withdrawAmount) <= 0,
            className: 'flex-1 px-4 py-2 bg-trust-green-600 hover:bg-trust-green-700 disabled:bg-slate-300 text-white rounded-lg'
          }, 'Withdraw')
        )
      )
    )
  );
};

// Main dashboard component
const VaultDashboard = () => {
  const wallet = useEnhancedWallet();
  const vaultOps = useVaultOperations(wallet);
  const [activeTab, setActiveTab] = React.useState('overview');

  if (!wallet.isConnected) {
    return React.createElement('div', {
      className: 'max-w-4xl mx-auto text-center py-16'
    },
      React.createElement('div', {
        className: 'bg-white rounded-xl shadow-lg p-8'
      },
        React.createElement('i', { className: 'fas fa-wallet text-6xl text-slate-300 mb-6' }),
        React.createElement('h2', {
          className: 'text-2xl font-bold text-slate-900 mb-4'
        }, 'Connect Wallet to View Dashboard'),
        React.createElement('p', {
          className: 'text-slate-600 mb-6'
        }, 'Connect your wallet to view and manage your secure time-locked vaults')
      )
    );
  }

  return React.createElement('div', {
    className: 'max-w-6xl mx-auto'
  },
    React.createElement('div', {
      className: 'bg-white rounded-xl shadow-lg border border-slate-200 mb-8'
    },
      React.createElement('div', {
        className: 'flex border-b border-slate-200'
      },
        React.createElement('button', {
          onClick: () => setActiveTab('overview'),
          className: `px-6 py-4 font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-brave-blue-500 text-brave-blue-600'
              : 'border-transparent text-slate-600'
          }`
        }, 'Overview'),
        React.createElement('button', {
          onClick: () => setActiveTab('vaults'),
          className: `px-6 py-4 font-medium border-b-2 transition-colors ${
            activeTab === 'vaults'
              ? 'border-brave-blue-500 text-brave-blue-600'
              : 'border-transparent text-slate-600'
          }`
        }, `Vaults (${vaultOps.vaults.length})`)
      )
    ),

    activeTab === 'overview' && React.createElement(PortfolioOverview, {
      vaults: vaultOps.vaults,
      transactions: vaultOps.transactions
    }),

    activeTab === 'vaults' && React.createElement('div', null,
      vaultOps.loading ? React.createElement('div', {
        className: 'text-center py-16'
      },
        React.createElement('div', {
          className: 'animate-spin w-8 h-8 border-4 border-brave-blue-200 border-t-brave-blue-600 rounded-full mx-auto mb-4'
        }),
        React.createElement('p', {
          className: 'text-slate-600'
        }, 'Loading your vaults...')
      ) : vaultOps.vaults.length > 0 ? React.createElement('div', {
        className: 'grid grid-cols-1 lg:grid-cols-2 gap-6'
      },
        ...vaultOps.vaults.map(vault =>
          React.createElement(VaultCard, {
            key: vault.address,
            vault,
            onDeposit: vaultOps.depositToVault,
            onWithdraw: vaultOps.withdrawFromVault
          })
        )
      ) : React.createElement('div', {
        className: 'bg-white rounded-xl shadow-lg p-12 text-center'
      },
        React.createElement('i', { className: 'fas fa-vault text-6xl text-slate-300 mb-6' }),
        React.createElement('h3', {
          className: 'text-2xl font-bold text-slate-900 mb-4'
        }, 'No Vaults Found'),
        React.createElement('p', {
          className: 'text-slate-600 mb-6'
        }, 'Create your first secure time-locked vault to get started.')
      )
    )
  );
};

window.VaultDashboard = VaultDashboard;
window.useVaultOperations = useVaultOperations;

console.log('✅ Vault Dashboard loaded');