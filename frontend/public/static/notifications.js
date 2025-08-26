// CreatorHub.Brave - Notification System
// Toast notifications and transaction status updates

// Notification types
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error', 
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
};

// Notification context
const NotificationContext = React.createContext();

// Notification provider
const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = React.useState([]);

  // Add notification
  const addNotification = React.useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: NOTIFICATION_TYPES.INFO,
      duration: 5000,
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove notification
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  // Remove notification
  const removeNotification = React.useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearNotifications = React.useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = React.useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      message,
      ...options
    });
  }, [addNotification]);

  const error = React.useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      message,
      duration: 8000, // Errors stay longer
      ...options
    });
  }, [addNotification]);

  const warning = React.useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      message,
      ...options
    });
  }, [addNotification]);

  const info = React.useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      message,
      ...options
    });
  }, [addNotification]);

  const loading = React.useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.LOADING,
      message,
      duration: 0, // Loading notifications don't auto-remove
      ...options
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    success,
    error,
    warning,
    info,
    loading
  };

  return React.createElement(NotificationContext.Provider, { value },
    children,
    React.createElement(NotificationContainer, { 
      notifications,
      onRemove: removeNotification 
    })
  );
};

// Hook to use notifications
const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Notification item component
const NotificationItem = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  React.useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'fas fa-check-circle';
      case NOTIFICATION_TYPES.ERROR:
        return 'fas fa-exclamation-circle';
      case NOTIFICATION_TYPES.WARNING:
        return 'fas fa-exclamation-triangle';
      case NOTIFICATION_TYPES.LOADING:
        return 'fas fa-spinner fa-spin';
      default:
        return 'fas fa-info-circle';
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'bg-trust-green-50 border-trust-green-200 text-trust-green-800';
      case NOTIFICATION_TYPES.ERROR:
        return 'bg-red-50 border-red-200 text-red-800';
      case NOTIFICATION_TYPES.WARNING:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case NOTIFICATION_TYPES.LOADING:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  return React.createElement('div', {
    className: `transform transition-all duration-300 ${
      isRemoving 
        ? 'translate-x-full opacity-0' 
        : isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
    }`
  },
    React.createElement('div', {
      className: `max-w-md w-full shadow-lg rounded-lg pointer-events-auto border ${getColors()}`
    },
      React.createElement('div', {
        className: 'p-4'
      },
        React.createElement('div', {
          className: 'flex items-start'
        },
          React.createElement('div', {
            className: 'flex-shrink-0'
          },
            React.createElement('i', {
              className: `${getIcon()} text-lg`
            })
          ),
          React.createElement('div', {
            className: 'ml-3 w-0 flex-1'
          },
            notification.title && React.createElement('p', {
              className: 'text-sm font-medium'
            }, notification.title),
            React.createElement('p', {
              className: `text-sm ${notification.title ? 'mt-1' : ''}`
            }, notification.message),
            notification.action && React.createElement('div', {
              className: 'mt-2'
            },
              React.createElement('button', {
                onClick: notification.action.onClick,
                className: 'text-sm font-medium underline hover:no-underline'
              }, notification.action.label)
            )
          ),
          React.createElement('div', {
            className: 'ml-4 flex-shrink-0 flex'
          },
            React.createElement('button', {
              onClick: handleRemove,
              className: 'inline-flex text-gray-400 hover:text-gray-600 focus:outline-none transition-colors'
            },
              React.createElement('i', { className: 'fas fa-times text-sm' })
            )
          )
        )
      )
    )
  );
};

// Notification container
const NotificationContainer = ({ notifications, onRemove } = {}) => {
  // Use context if no props provided
  const context = React.useContext(NotificationContext);
  const notificationList = notifications || context?.notifications || [];
  const removeHandler = onRemove || context?.removeNotification;
  
  if (!notificationList || notificationList.length === 0) return null;

  return React.createElement('div', {
    className: 'fixed top-4 right-4 z-50 space-y-2'
  },
    ...notificationList.map(notification =>
      React.createElement(NotificationItem, {
        key: notification.id,
        notification,
        onRemove: () => removeHandler?.(notification.id)
      })
    )
  );
};

// Transaction notification hook
const useTransactionNotifications = () => {
  const { success, error, loading, removeNotification } = useNotifications();

  const notifyTransaction = React.useCallback((tx, type = 'pending') => {
    const txHash = tx.hash || tx.transactionHash;
    const shortHash = txHash ? `${txHash.slice(0, 8)}...${txHash.slice(-6)}` : '';

    switch (type) {
      case 'pending':
        return loading(`Transaction pending: ${shortHash}`, {
          title: 'Transaction Submitted',
          action: {
            label: 'View on Explorer',
            onClick: () => {
              if (txHash && tx.chainId && SUPPORTED_NETWORKS[tx.chainId]) {
                window.open(`${SUPPORTED_NETWORKS[tx.chainId].blockExplorer}/tx/${txHash}`, '_blank');
              }
            }
          }
        });

      case 'confirmed':
        return success(`Transaction confirmed: ${shortHash}`, {
          title: 'Transaction Successful',
          action: {
            label: 'View on Explorer',
            onClick: () => {
              if (txHash && tx.chainId && SUPPORTED_NETWORKS[tx.chainId]) {
                window.open(`${SUPPORTED_NETWORKS[tx.chainId].blockExplorer}/tx/${txHash}`, '_blank');
              }
            }
          }
        });

      case 'failed':
        return error(`Transaction failed: ${tx.error || 'Unknown error'}`, {
          title: 'Transaction Failed',
          duration: 10000
        });

      default:
        return null;
    }
  }, [success, error, loading]);

  const notifyVaultOperation = React.useCallback((operation, vault, amount) => {
    const vaultAddr = `${vault.slice(0, 8)}...${vault.slice(-6)}`;
    
    switch (operation) {
      case 'deposit':
        return success(`Successfully deposited ${amount} ETH to vault ${vaultAddr}`, {
          title: 'Deposit Successful'
        });

      case 'withdrawal':
        return success(`Successfully withdrew ${amount} ETH from vault ${vaultAddr}`, {
          title: 'Withdrawal Successful'
        });

      case 'social_recovery':
        return success(`Social recovery initiated for vault ${vaultAddr}`, {
          title: 'Recovery Initiated',
          duration: 8000
        });

      default:
        return null;
    }
  }, [success]);

  const notifyWalletConnection = React.useCallback((walletName, address) => {
    const shortAddr = `${address.slice(0, 8)}...${address.slice(-6)}`;
    return success(`Connected to ${walletName}: ${shortAddr}`, {
      title: 'Wallet Connected'
    });
  }, [success]);

  const notifyError = React.useCallback((message, title = 'Error') => {
    return error(message, { title });
  }, [error]);

  return {
    notifyTransaction,
    notifyVaultOperation,
    notifyWalletConnection,
    notifyError,
    removeNotification
  };
};

// Global notification instance for non-React usage
class GlobalNotificationManager {
  constructor() {
    this.container = null;
    this.notifications = [];
    this.init();
  }

  init() {
    // Create notification container
    this.container = document.createElement('div');
    this.container.id = 'global-notifications';
    this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', options = {}) {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      duration: options.duration || 5000,
      title: options.title
    };

    this.notifications.push(notification);
    this.render();

    // Auto remove
    if (notification.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }

    return id;
  }

  remove(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.render();
  }

  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  error(message, options = {}) {
    return this.show(message, 'error', { duration: 8000, ...options });
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = '';
    
    this.notifications.forEach(notification => {
      const element = this.createNotificationElement(notification);
      this.container.appendChild(element);
    });
  }

  createNotificationElement(notification) {
    const div = document.createElement('div');
    div.className = 'max-w-md w-full shadow-lg rounded-lg pointer-events-auto border';
    
    let colors = 'bg-slate-50 border-slate-200 text-slate-800';
    let icon = 'fas fa-info-circle';

    switch (notification.type) {
      case 'success':
        colors = 'bg-trust-green-50 border-trust-green-200 text-trust-green-800';
        icon = 'fas fa-check-circle';
        break;
      case 'error':
        colors = 'bg-red-50 border-red-200 text-red-800';
        icon = 'fas fa-exclamation-circle';
        break;
      case 'warning':
        colors = 'bg-yellow-50 border-yellow-200 text-yellow-800';
        icon = 'fas fa-exclamation-triangle';
        break;
    }

    div.className += ' ' + colors;
    div.innerHTML = `
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <i class="${icon} text-lg"></i>
          </div>
          <div class="ml-3 w-0 flex-1">
            ${notification.title ? `<p class="text-sm font-medium">${notification.title}</p>` : ''}
            <p class="text-sm ${notification.title ? 'mt-1' : ''}">${notification.message}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button onclick="globalNotifications.remove(${notification.id})" class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none transition-colors">
              <i class="fas fa-times text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    return div;
  }
}

// Global instance
const globalNotifications = new GlobalNotificationManager();

// Export components and hooks
window.NotificationProvider = NotificationProvider;
window.NotificationContext = NotificationContext;
window.useNotifications = useNotifications;
window.useTransactionNotifications = useTransactionNotifications;
window.globalNotifications = globalNotifications;

console.log('✅ Notification system loaded');