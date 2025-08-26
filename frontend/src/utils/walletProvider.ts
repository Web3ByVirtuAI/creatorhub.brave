// CreatorHub.Brave - Enhanced Wallet Provider
// Multi-wallet support with MetaMask, WalletConnect, and session management

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      selectedAddress?: string;
      on: (event: string, callback: (data: any) => void) => void;
      removeListener: (event: string, callback: (data: any) => void) => void;
      isMetaMask?: boolean;
      isBraveWallet?: boolean;
      isCoinbaseWallet?: boolean;
    };
  }
}

export interface WalletInfo {
  id: string;
  name: string;
  icon: string;
  connector: string;
  installed?: boolean;
  downloadUrl?: string;
}

export interface WalletSession {
  address: string;
  chainId: number;
  walletType: string;
  walletName: string;
  provider: any;
  signer: any;
  connectedAt: number;
  isActive: boolean;
}

export interface WalletState {
  sessions: WalletSession[];
  activeSession: WalletSession | null;
  isConnecting: boolean;
  error: string | null;
  supportedWallets: WalletInfo[];
}

// Supported wallet configurations
export const SUPPORTED_WALLETS: WalletInfo[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
    connector: 'injected',
    downloadUrl: 'https://metamask.io/download/'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: 'https://walletconnect.com/walletconnect-logo.svg',
    connector: 'walletconnect'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: 'https://images.ctfassets.net/q5ulk4bp65r7/3TBS4oVkD1ghowTqVQJlqj/2dfd4ea3b623a7c0d8deb2ff445dee9e/Consumer_Wordmark.svg',
    connector: 'injected',
    downloadUrl: 'https://www.coinbase.com/wallet'
  },
  {
    id: 'brave',
    name: 'Brave Wallet',
    icon: 'https://brave.com/static-assets/images/brave-logo-sans-text.svg',
    connector: 'injected',
    downloadUrl: 'https://brave.com/'
  }
];

// Network configurations
export const SUPPORTED_NETWORKS = {
  421614: {
    name: 'Arbitrum Sepolia',
    shortName: 'arb-sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
  },
  11155420: {
    name: 'Optimism Sepolia',
    shortName: 'opt-sepolia',
    rpcUrl: 'https://sepolia.optimism.io',
    blockExplorer: 'https://sepolia-optimism.etherscan.io',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
  }
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_NETWORKS;

// WalletConnect configuration
const WALLETCONNECT_PROJECT_ID = 'f3c5c6c7e2d1a0b9f3c5c6c7e2d1a0b9'; // Placeholder - should be from environment

export class WalletProvider {
  private state: WalletState = {
    sessions: [],
    activeSession: null,
    isConnecting: false,
    error: null,
    supportedWallets: SUPPORTED_WALLETS
  };

  private listeners: Set<(state: WalletState) => void> = new Set();
  private walletConnectProvider: any = null;

  constructor() {
    this.detectInstalledWallets();
    this.loadSavedSessions();
  }

  // State management
  private setState(updates: Partial<WalletState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  public subscribe(listener: (state: WalletState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): WalletState {
    return { ...this.state };
  }

  // Wallet detection
  private detectInstalledWallets() {
    const installedWallets = this.state.supportedWallets.map(wallet => {
      let installed = false;

      switch (wallet.id) {
        case 'metamask':
          installed = window.ethereum?.isMetaMask === true;
          break;
        case 'coinbase':
          installed = window.ethereum?.isCoinbaseWallet === true;
          break;
        case 'brave':
          installed = window.ethereum?.isBraveWallet === true;
          break;
        case 'walletconnect':
          installed = true; // Always available
          break;
        default:
          installed = false;
      }

      return { ...wallet, installed };
    });

    this.setState({ supportedWallets: installedWallets });
  }

  // Session management
  private saveSessions() {
    try {
      const sessionsToSave = this.state.sessions.map(session => ({
        ...session,
        provider: null, // Don't serialize providers
        signer: null
      }));
      localStorage.setItem('wallet_sessions', JSON.stringify(sessionsToSave));
    } catch (error) {
      console.error('Failed to save wallet sessions:', error);
    }
  }

  private loadSavedSessions() {
    try {
      const saved = localStorage.getItem('wallet_sessions');
      if (saved) {
        const sessions = JSON.parse(saved);
        // Don't auto-restore sessions - user must reconnect
        // Just clear old sessions
        localStorage.removeItem('wallet_sessions');
      }
    } catch (error) {
      console.error('Failed to load wallet sessions:', error);
    }
  }

  // MetaMask connection
  private async connectMetaMask(): Promise<WalletSession> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask to continue.');
    }

    const provider = new (window as any).ethers.providers.Web3Provider(window.ethereum);
    
    // Request account access
    await provider.send('eth_requestAccounts', []);
    
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    if (!SUPPORTED_NETWORKS[network.chainId as SupportedChainId]) {
      throw new Error(`Unsupported network. Please switch to ${Object.values(SUPPORTED_NETWORKS).map(n => n.name).join(' or ')}.`);
    }

    const session: WalletSession = {
      address,
      chainId: network.chainId,
      walletType: 'injected',
      walletName: 'MetaMask',
      provider,
      signer,
      connectedAt: Date.now(),
      isActive: true
    };

    // Setup event listeners
    this.setupMetaMaskListeners(provider, session);

    return session;
  }

  private setupMetaMaskListeners(provider: any, session: WalletSession) {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnectSession(session.address);
      } else if (accounts[0] !== session.address) {
        // Account changed, reconnect
        this.connectWallet('metamask');
      }
    };

    const handleChainChanged = (chainId: string) => {
      const numericChainId = parseInt(chainId, 16);
      if (SUPPORTED_NETWORKS[numericChainId as SupportedChainId]) {
        session.chainId = numericChainId;
        this.setState({ sessions: [...this.state.sessions] });
      } else {
        this.setState({ 
          error: `Unsupported network. Please switch to ${Object.values(SUPPORTED_NETWORKS).map(n => n.name).join(' or ')}.`
        });
      }
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    window.ethereum?.on('chainChanged', handleChainChanged);
  }

  // WalletConnect connection
  private async connectWalletConnect(): Promise<WalletSession> {
    try {
      // Initialize WalletConnect provider
      const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
      
      const provider = await EthereumProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        chains: [421614, 11155420], // Arbitrum Sepolia, Optimism Sepolia
        methods: ['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
        events: ['chainChanged', 'accountsChanged'],
        metadata: {
          name: 'CreatorHub.Brave',
          description: 'Secure Time-Locked Vault Platform',
          url: 'https://creatorhub.brave',
          icons: ['https://creatorhub.brave/icon.png']
        }
      });

      // Connect
      await provider.connect();

      const ethersProvider = new (window as any).ethers.providers.Web3Provider(provider);
      const signer = ethersProvider.getSigner();
      const address = await signer.getAddress();
      const network = await ethersProvider.getNetwork();

      this.walletConnectProvider = provider;

      const session: WalletSession = {
        address,
        chainId: network.chainId,
        walletType: 'walletconnect',
        walletName: 'WalletConnect',
        provider: ethersProvider,
        signer,
        connectedAt: Date.now(),
        isActive: true
      };

      // Setup WalletConnect listeners
      this.setupWalletConnectListeners(provider, session);

      return session;
    } catch (error: any) {
      throw new Error(`WalletConnect connection failed: ${error.message}`);
    }
  }

  private setupWalletConnectListeners(provider: any, session: WalletSession) {
    provider.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnectSession(session.address);
      } else if (accounts[0] !== session.address) {
        session.address = accounts[0];
        this.setState({ sessions: [...this.state.sessions] });
      }
    });

    provider.on('chainChanged', (chainId: number) => {
      if (SUPPORTED_NETWORKS[chainId as SupportedChainId]) {
        session.chainId = chainId;
        this.setState({ sessions: [...this.state.sessions] });
      } else {
        this.setState({ 
          error: `Unsupported network. Please switch to ${Object.values(SUPPORTED_NETWORKS).map(n => n.name).join(' or ')}.`
        });
      }
    });

    provider.on('disconnect', () => {
      this.disconnectSession(session.address);
    });
  }

  // Main connection method
  public async connectWallet(walletId: string): Promise<WalletSession> {
    this.setState({ isConnecting: true, error: null });

    try {
      let session: WalletSession;

      switch (walletId) {
        case 'metamask':
        case 'coinbase':
        case 'brave':
          session = await this.connectMetaMask();
          break;
        case 'walletconnect':
          session = await this.connectWalletConnect();
          break;
        default:
          throw new Error(`Unsupported wallet: ${walletId}`);
      }

      // Check if session already exists for this address
      const existingIndex = this.state.sessions.findIndex(s => s.address === session.address);
      let newSessions: WalletSession[];

      if (existingIndex >= 0) {
        // Update existing session
        newSessions = [...this.state.sessions];
        newSessions[existingIndex] = session;
      } else {
        // Add new session
        newSessions = [...this.state.sessions, session];
      }

      this.setState({ 
        sessions: newSessions,
        activeSession: session,
        isConnecting: false 
      });

      this.saveSessions();
      return session;

    } catch (error: any) {
      this.setState({ 
        isConnecting: false, 
        error: error.message || 'Failed to connect wallet' 
      });
      throw error;
    }
  }

  // Session management methods
  public switchSession(address: string) {
    const session = this.state.sessions.find(s => s.address === address);
    if (session) {
      // Deactivate all sessions
      const updatedSessions = this.state.sessions.map(s => ({
        ...s,
        isActive: s.address === address
      }));

      this.setState({ 
        sessions: updatedSessions,
        activeSession: session 
      });
      this.saveSessions();
    }
  }

  public async disconnectSession(address: string) {
    const session = this.state.sessions.find(s => s.address === address);
    if (!session) return;

    // Handle specific disconnection logic
    if (session.walletType === 'walletconnect' && this.walletConnectProvider) {
      await this.walletConnectProvider.disconnect();
      this.walletConnectProvider = null;
    }

    // Remove session
    const newSessions = this.state.sessions.filter(s => s.address !== address);
    const newActiveSession = newSessions.length > 0 ? newSessions[0] : null;

    this.setState({ 
      sessions: newSessions,
      activeSession: newActiveSession 
    });

    this.saveSessions();
  }

  public async disconnectAll() {
    // Disconnect WalletConnect if active
    if (this.walletConnectProvider) {
      await this.walletConnectProvider.disconnect();
      this.walletConnectProvider = null;
    }

    this.setState({ 
      sessions: [],
      activeSession: null 
    });

    localStorage.removeItem('wallet_sessions');
  }

  // Utility methods
  public getActiveSession(): WalletSession | null {
    return this.state.activeSession;
  }

  public getAllSessions(): WalletSession[] {
    return this.state.sessions;
  }

  public isConnected(): boolean {
    return this.state.activeSession !== null;
  }

  public getNetworkName(chainId: number): string {
    return SUPPORTED_NETWORKS[chainId as SupportedChainId]?.name || 'Unknown Network';
  }

  public getBlockExplorer(chainId: number): string {
    return SUPPORTED_NETWORKS[chainId as SupportedChainId]?.blockExplorer || '';
  }

  public isNetworkSupported(chainId: number): boolean {
    return chainId in SUPPORTED_NETWORKS;
  }

  // Error handling
  public clearError() {
    this.setState({ error: null });
  }
}

// Global wallet provider instance
export const walletProvider = new WalletProvider();

// React hook for using wallet provider
export const useWalletProvider = () => {
  const [state, setState] = React.useState(walletProvider.getState());

  React.useEffect(() => {
    return walletProvider.subscribe(setState);
  }, []);

  return {
    ...state,
    connectWallet: walletProvider.connectWallet.bind(walletProvider),
    disconnectSession: walletProvider.disconnectSession.bind(walletProvider),
    disconnectAll: walletProvider.disconnectAll.bind(walletProvider),
    switchSession: walletProvider.switchSession.bind(walletProvider),
    clearError: walletProvider.clearError.bind(walletProvider),
    isConnected: walletProvider.isConnected.bind(walletProvider),
    getActiveSession: walletProvider.getActiveSession.bind(walletProvider),
    getAllSessions: walletProvider.getAllSessions.bind(walletProvider)
  };
};