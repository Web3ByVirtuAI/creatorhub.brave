# CreatorHub.Brave Smart Contract Specification

## Overview

CreatorHub.Brave is a secure, user-friendly platform for creating time-locked vault smart contracts on Ethereum Layer 2. The system enables users to lock ETH and ERC-20 tokens until a predetermined unlock date, with advanced features including social recovery and crypto gifting.

## Architecture

### Core Contracts

#### 1. ChildVault
**Purpose**: Individual time-locked vault for secure asset storage
**Key Features**:
- Immutable unlock timestamp and beneficiary (changeable via social recovery)
- Support for ETH and whitelisted ERC-20 tokens
- Guardian-based social recovery system
- Emergency pause functionality

#### 2. VaultFactory  
**Purpose**: Factory for deploying gas-efficient vault instances using minimal proxy pattern
**Key Features**:
- EIP-1167 minimal proxy pattern for cost-effective deployment
- Platform fee collection and management
- Vault registry and user tracking
- Administrative controls and emergency functions

#### 3. GiftRegistry
**Purpose**: Registry for managing crypto gifts that create time-locked vaults
**Key Features**:
- Gift vault creation with custom messages
- Public gift discovery and claiming
- Gift expiration and reclaim functionality
- Integration with VaultFactory

## Contract Specifications

### ChildVault Contract

#### State Variables
```solidity
address public beneficiary;                    // Vault owner who can withdraw after unlock
uint256 public immutable unlockTime;          // Timestamp when vault unlocks
mapping(address => bool) public allowedTokens; // Whitelisted tokens for deposits
address[] public allowedTokenList;            // Array of allowed tokens
address[] public guardians;                   // Social recovery guardians
uint256 public guardianThreshold;             // Required guardian approvals
address public immutable factory;             // Factory contract address
```

#### Core Functions

**Deposit Functions**:
- `depositEth()`: Accepts ETH deposits from any address
- `depositToken(address token, uint256 amount)`: Deposits whitelisted ERC-20 tokens

**Withdrawal Functions** (only after unlock, only by beneficiary):
- `withdrawEth()`: Withdraws all ETH
- `withdrawEth(uint256 amount)`: Withdraws specific ETH amount
- `withdrawToken(address token)`: Withdraws all tokens of specified type
- `withdrawToken(address token, uint256 amount)`: Withdraws specific token amount

**Social Recovery Functions**:
- `initiateSocialRecovery(address newBeneficiary)`: Starts recovery process
- `approveSocialRecovery()`: Guardian approval for active recovery
- `executeSocialRecovery()`: Executes recovery after timelock and sufficient approvals

**View Functions**:
- `getEthBalance()`: Returns vault ETH balance
- `getTokenBalance(address token)`: Returns specific token balance
- `getAllowedTokens()`: Returns array of allowed tokens
- `getTimeUntilUnlock()`: Returns seconds until unlock (0 if unlocked)
- `isUnlocked()`: Returns boolean unlock status
- `getSocialRecoveryStatus()`: Returns recovery state information

#### Security Features
- **ReentrancyGuard**: Prevents reentrancy attacks on withdrawal functions
- **Pausable**: Emergency pause capability controlled by factory
- **Time Lock**: Immutable unlock timestamp prevents premature access
- **Social Recovery Timelock**: 7-day delay for recovery execution
- **Guardian Validation**: Prevents duplicate guardians and validates threshold

#### Error Handling
Custom errors with clear, user-friendly messages aligned with brand voice:
- `VaultStillLocked(uint256 currentTime, uint256 unlockTime)`
- `OnlyBeneficiary(address caller, address beneficiary)`
- `OnlyGuardian(address caller)`
- `TokenNotAllowed(address token)`
- `InsufficientGuardianSignatures(uint256 provided, uint256 required)`

### VaultFactory Contract

#### State Variables
```solidity
address public vaultImplementation;           // ChildVault template contract
uint256 public platformFee;                   // Fee for vault creation (wei)
mapping(address => bool) public isVaultRegistered; // Vault registry
mapping(address => uint256) public userVaultCount; // User vault counts
mapping(address => mapping(uint256 => address)) public userVaults; // User vault addresses
address[] public allVaults;                   // All created vaults
uint256 public totalVaults;                   // Total vault count
uint256 public totalFeesCollected;            // Cumulative fees
```

#### Core Functions

**Vault Creation**:
- `createVault(...)`: Creates vault for caller
- `createVaultFor(address beneficiary, ...)`: Creates vault for specified beneficiary

**Administrative Functions** (owner only):
- `setPlatformFee(uint256 newFee)`: Updates platform fee
- `setImplementation(address newImplementation)`: Updates vault template
- `withdrawFees(address to)`: Withdraws collected fees
- `pause()/unpause()`: Emergency controls

**View Functions**:
- `getUserVaults(address user)`: Returns user's vault addresses
- `getAllVaults(uint256 offset, uint256 limit)`: Paginated vault list
- `estimateVaultCreationGas()`: Gas estimation for vault creation
- `calculateVaultCreationCost(uint256 gasPrice)`: Total creation cost
- `getFactoryStats()`: Factory statistics

#### Gas Optimization
- **Minimal Proxy Pattern (EIP-1167)**: Reduces deployment costs by ~90%
- **Clones Library**: OpenZeppelin's gas-optimized proxy implementation
- **Efficient Storage**: Optimized storage layout and access patterns

#### Validation Logic
- **Unlock Time**: Must be between 1 hour and 100 years in future
- **Guardians**: Maximum 10 guardians, no duplicates, valid threshold
- **Payment**: Sufficient fee payment with excess refund
- **Addresses**: Zero address validation for all address parameters

### GiftRegistry Contract

#### State Variables
```solidity
VaultFactory public immutable vaultFactory;   // Factory contract reference
uint256 public nextGiftId;                    // Gift ID counter
mapping(uint256 => Gift) public gifts;        // Gift data storage
mapping(address => uint256[]) public senderGifts; // Sender's gifts
mapping(address => uint256[]) public recipientGifts; // Recipient's gifts
uint256[] public publicGifts;                 // Public gift listings
```

#### Gift Data Structure
```solidity
struct Gift {
    uint256 id;
    address sender;
    address recipient;
    address vault;
    uint256 unlockTime;
    uint256 createdAt;
    uint256 expirationTime;
    string message;
    bool isClaimed;
    bool isPublic;
    uint256 initialEthAmount;
    GiftToken[] tokens;
}
```

#### Core Functions

**Gift Creation**:
- `createGift(...)`: Creates gift vault with custom message and settings
- `addTokensToGift(uint256 giftId, address token, uint256 amount)`: Adds tokens to existing gift

**Gift Management**:
- `claimGift(uint256 giftId)`: Recipient claims gift access
- `reclaimExpiredGift(uint256 giftId)`: Sender reclaims expired unclaimed gift
- `updateGiftMessage(uint256 giftId, string message)`: Updates gift message
- `setGiftVisibility(uint256 giftId, bool isPublic)`: Changes gift visibility

**View Functions**:
- `getGift(uint256 giftId)`: Returns complete gift information
- `getSentGifts(address sender)`: Returns sender's gift IDs
- `getReceivedGifts(address recipient)`: Returns recipient's gift IDs
- `getPublicGifts(uint256 offset, uint256 limit)`: Paginated public gifts
- `canClaimGift(uint256 giftId)`: Validates if gift can be claimed

## Security Considerations

### Access Controls
- **Beneficiary-only**: Withdrawal functions restricted to vault beneficiary
- **Guardian-only**: Social recovery functions restricted to registered guardians
- **Owner-only**: Administrative functions restricted to contract owners
- **Factory-only**: Vault initialization restricted to factory contract

### Time-based Security
- **Immutable Unlock Time**: Prevents tampering with time locks
- **Social Recovery Delay**: 7-day timelock prevents hasty beneficiary changes
- **Gift Expiration**: Configurable expiration prevents permanent gift locks

### Economic Security
- **Platform Fees**: Sustainable business model with reasonable fees
- **Gas Optimization**: Minimal proxy pattern reduces user costs
- **Fee Refunds**: Excess payments automatically refunded

### Technical Security
- **Reentrancy Protection**: All financial functions protected
- **Safe Token Transfers**: OpenZeppelin SafeERC20 for secure token handling
- **Pause Functionality**: Emergency controls for critical situations
- **Input Validation**: Comprehensive validation for all user inputs

## Testing Strategy

### Unit Tests
- **ChildVault**: 100+ test cases covering all functions and edge cases
- **VaultFactory**: Comprehensive factory functionality and admin controls
- **GiftRegistry**: Gift lifecycle and management testing

### Integration Tests
- **End-to-end Workflows**: Complete vault creation, deposit, and withdrawal flows
- **Cross-contract Interactions**: Factory-vault and registry-factory integration
- **Social Recovery Flows**: Multi-guardian recovery scenarios

### Security Tests
- **Access Control**: Unauthorized access prevention
- **Reentrancy**: Protection against reentrancy attacks
- **Time Manipulation**: Defense against timestamp manipulation
- **Economic Attacks**: Fee manipulation and overflow protection

### Fuzz Testing
- **Parameter Fuzzing**: Random input validation across all functions
- **Amount Fuzzing**: Various deposit and withdrawal amounts
- **Time Fuzzing**: Different unlock times and scenarios

## Deployment Configuration

### Network Support
- **Primary**: Arbitrum One (low fees, fast finality)
- **Secondary**: Optimism (alternative L2 option)
- **Testing**: Sepolia/Goerli testnets

### Initial Parameters
- **Platform Fee**: 0.01 ETH (adjustable by owner)
- **Max Guardians**: 10 per vault
- **Recovery Timelock**: 7 days (immutable)
- **Min Lock Duration**: 1 hour
- **Max Lock Duration**: 100 years

### Upgrade Strategy
- **Minimal Proxy Pattern**: Allows implementation upgrades
- **Factory Upgrades**: New factory deployments for major changes
- **Migration Tools**: User migration assistance for breaking changes

## Brand Integration

### Error Messages
All error messages follow brand voice guidelines:
- Clear, non-technical language
- Helpful explanations
- Consistent tone and terminology

### Event Naming
Events use clear, descriptive names:
- `VaultCreated` instead of `VaultDeployed`
- `EthDeposited` instead of `Deposit`
- `SocialRecoveryInitiated` instead of `RecoveryStarted`

### Function Documentation
NatSpec comments emphasize:
- User empowerment ("Your vault, your keys, your future")
- Security benefits ("Secure Your Tomorrow")
- Clear explanations of complex concepts

## Future Enhancements

### Planned Features
- **Streaming Payouts**: Gradual unlock over time periods
- **Multi-split Unlocks**: Partial unlocks at different dates  
- **Cross-chain Migration**: Vault portability across L2 networks
- **Advanced Guardianship**: Weighted guardian votes and delegation
- **Vault Templates**: Pre-configured vault types for common use cases

### Integration Opportunities
- **DeFi Protocols**: Yield generation on locked assets
- **NFT Integration**: NFT-gated vaults and collectible unlocks
- **DAO Integration**: Community-managed vault templates
- **Mobile Wallet**: Native mobile app integration
- **Hardware Keys**: Physical key product integration

This specification provides a comprehensive overview of the CreatorHub.Brave smart contract system, ensuring security, usability, and alignment with the brand's vision of making crypto security accessible to everyone.