// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ChildVault.sol";

/**
 * @title VaultFactory
 * @author CreatorHub.Brave Team  
 * @notice Factory contract for deploying gas-efficient time-locked vaults using minimal proxy pattern
 * @dev Implements EIP-1167 minimal proxy pattern for cost-effective vault deployment
 * 
 * Key Features:
 * - Minimal proxy deployment for gas efficiency
 * - Vault registry and management
 * - Fee collection for platform sustainability  
 * - Emergency controls and upgradability
 * - Comprehensive event logging and user tracking
 * 
 * Brand Alignment:
 * - "Your vault, your keys, your future" - User ownership and control
 * - "Secure Your Tomorrow" - Professional platform management
 * - Clear, educational event names and error messages
 */
contract VaultFactory is Ownable, ReentrancyGuard, Pausable {
    using Clones for address;

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Invalid unlock time provided (must be in future)
    error InvalidUnlockTime(uint256 unlockTime, uint256 currentTime);
    
    /// @notice Invalid fee amount provided
    error InvalidFeeAmount(uint256 provided, uint256 required);
    
    /// @notice Invalid address provided (cannot be zero)
    error InvalidAddress(address addr);
    
    /// @notice Vault deployment failed
    error VaultDeploymentFailed();
    
    /// @notice Insufficient payment for vault creation
    error InsufficientPayment(uint256 provided, uint256 required);
    
    /// @notice Guardian threshold invalid
    error InvalidGuardianThreshold(uint256 threshold, uint256 guardianCount);
    
    /// @notice Too many guardians specified
    error TooManyGuardians(uint256 provided, uint256 maximum);
    
    /// @notice Duplicate guardian addresses not allowed
    error DuplicateGuardian(address guardian);

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Emitted when a new vault is created
    event VaultCreated(
        address indexed vault,
        address indexed beneficiary,
        uint256 indexed unlockTime,
        address[] allowedTokens,
        address[] guardians,
        uint256 guardianThreshold,
        address creator
    );
    
    /// @notice Emitted when platform fee is updated
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    
    /// @notice Emitted when implementation template is updated
    event ImplementationUpdated(address oldImplementation, address newImplementation);
    
    /// @notice Emitted when fees are withdrawn
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    /// @notice Emitted when supported tokens are updated
    event SupportedTokensUpdated(address[] tokens, bool[] supported);

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Address of the ChildVault implementation template
    address public vaultImplementation;
    
    /// @notice Platform fee for vault creation (in wei)
    uint256 public platformFee;
    
    /// @notice Maximum number of guardians allowed per vault
    uint256 public constant MAX_GUARDIANS = 10;
    
    /// @notice Minimum unlock time (must be at least 1 hour in the future)
    uint256 public constant MIN_LOCK_DURATION = 1 hours;
    
    /// @notice Maximum unlock time (100 years from now)
    uint256 public constant MAX_LOCK_DURATION = 100 * 365 days;
    
    /// @notice Registry of all created vaults
    mapping(address => bool) public isVaultRegistered;
    
    /// @notice User's vault count
    mapping(address => uint256) public userVaultCount;
    
    /// @notice User's vault addresses (user => index => vault address)
    mapping(address => mapping(uint256 => address)) public userVaults;
    
    /// @notice Vault beneficiary mapping (vault => beneficiary)
    mapping(address => address) public vaultBeneficiary;
    
    /// @notice Array of all vault addresses for enumeration
    address[] public allVaults;
    
    /// @notice Supported tokens for vault deposits
    mapping(address => bool) public supportedTokens;
    address[] public supportedTokenList;
    
    /// @notice Total number of vaults created
    uint256 public totalVaults;
    
    /// @notice Total fees collected
    uint256 public totalFeesCollected;

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Validates that address is not zero
    modifier validAddress(address addr) {
        if (addr == address(0)) {
            revert InvalidAddress(addr);
        }
        _;
    }
    
    /// @notice Validates unlock time is within acceptable range
    modifier validUnlockTime(uint256 unlockTime) {
        if (unlockTime <= block.timestamp + MIN_LOCK_DURATION) {
            revert InvalidUnlockTime(unlockTime, block.timestamp + MIN_LOCK_DURATION);
        }
        if (unlockTime > block.timestamp + MAX_LOCK_DURATION) {
            revert InvalidUnlockTime(unlockTime, block.timestamp + MAX_LOCK_DURATION);
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Deploys the factory and creates the vault implementation template
    /// @param _initialOwner Address of the initial owner
    /// @param _platformFee Initial platform fee for vault creation
    constructor(address _initialOwner, uint256 _platformFee) 
        Ownable(_initialOwner) 
        validAddress(_initialOwner)
    {
        platformFee = _platformFee;
        
        // Deploy the implementation template with placeholder values
        // These will be overridden during clone initialization
        vaultImplementation = address(new ChildVault(address(this), block.timestamp + 1 days));
        
        emit ImplementationUpdated(address(0), vaultImplementation);
        emit PlatformFeeUpdated(0, _platformFee);
    }

    /*//////////////////////////////////////////////////////////////
                         VAULT CREATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Creates a new time-locked vault for the caller
    /// @param unlockTime Timestamp when the vault will unlock
    /// @param allowedTokens Array of token addresses allowed for deposit
    /// @param guardians Array of guardian addresses for social recovery
    /// @param guardianThreshold Number of guardian approvals required for recovery
    /// @return vault Address of the created vault
    function createVault(
        uint256 unlockTime,
        address[] calldata allowedTokens,
        address[] calldata guardians,
        uint256 guardianThreshold
    ) external payable nonReentrant whenNotPaused validUnlockTime(unlockTime) returns (address vault) {
        return _createVaultFor(msg.sender, unlockTime, allowedTokens, guardians, guardianThreshold);
    }
    
    /// @notice Creates a new time-locked vault for a specified beneficiary
    /// @param beneficiary Address that will receive funds after unlock
    /// @param unlockTime Timestamp when the vault will unlock  
    /// @param allowedTokens Array of token addresses allowed for deposit
    /// @param guardians Array of guardian addresses for social recovery
    /// @param guardianThreshold Number of guardian approvals required for recovery
    /// @return vault Address of the created vault
    function createVaultFor(
        address beneficiary,
        uint256 unlockTime,
        address[] calldata allowedTokens,
        address[] calldata guardians,
        uint256 guardianThreshold
    ) external payable nonReentrant whenNotPaused validAddress(beneficiary) validUnlockTime(unlockTime) returns (address vault) {
        return _createVaultFor(beneficiary, unlockTime, allowedTokens, guardians, guardianThreshold);
    }
    
    /// @notice Internal function to create vaults
    /// @param beneficiary Address that will receive funds after unlock
    /// @param unlockTime Timestamp when the vault will unlock
    /// @param allowedTokens Array of token addresses allowed for deposit  
    /// @param guardians Array of guardian addresses for social recovery
    /// @param guardianThreshold Number of guardian approvals required for recovery
    /// @return vault Address of the created vault
    function _createVaultFor(
        address beneficiary,
        uint256 unlockTime,
        address[] calldata allowedTokens,
        address[] calldata guardians,
        uint256 guardianThreshold
    ) internal returns (address vault) {
        // Validate payment
        if (msg.value < platformFee) {
            revert InsufficientPayment(msg.value, platformFee);
        }
        
        // Validate guardians
        _validateGuardians(guardians, guardianThreshold);
        
        // Validate allowed tokens
        _validateAllowedTokens(allowedTokens);
        
        // Deploy minimal proxy vault
        vault = vaultImplementation.clone();
        
        if (vault == address(0)) {
            revert VaultDeploymentFailed();
        }
        
        // Initialize the vault
        try ChildVault(payable(vault)).initialize(beneficiary, allowedTokens, guardians, guardianThreshold) {
            // Registration successful
        } catch {
            revert VaultDeploymentFailed();
        }
        
        // Register vault in mappings
        isVaultRegistered[vault] = true;
        vaultBeneficiary[vault] = beneficiary;
        allVaults.push(vault);
        
        // Update user vault tracking
        userVaults[beneficiary][userVaultCount[beneficiary]] = vault;
        userVaultCount[beneficiary]++;
        
        // Update global counters
        totalVaults++;
        totalFeesCollected += platformFee;
        
        // Refund excess payment
        if (msg.value > platformFee) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - platformFee}("");
            require(success, "Refund failed");
        }
        
        emit VaultCreated(
            vault,
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold,
            msg.sender
        );
    }
    
    /// @notice Validates guardian configuration
    /// @param guardians Array of guardian addresses
    /// @param guardianThreshold Required number of approvals
    function _validateGuardians(address[] calldata guardians, uint256 guardianThreshold) internal pure {
        if (guardians.length > MAX_GUARDIANS) {
            revert TooManyGuardians(guardians.length, MAX_GUARDIANS);
        }
        
        if (guardianThreshold == 0 || guardianThreshold > guardians.length) {
            revert InvalidGuardianThreshold(guardianThreshold, guardians.length);
        }
        
        // Check for duplicate guardians
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == address(0)) {
                revert InvalidAddress(guardians[i]);
            }
            
            for (uint256 j = i + 1; j < guardians.length; j++) {
                if (guardians[i] == guardians[j]) {
                    revert DuplicateGuardian(guardians[i]);
                }
            }
        }
    }
    
    /// @notice Validates allowed tokens (optional validation)
    /// @param allowedTokens Array of token addresses
    function _validateAllowedTokens(address[] calldata allowedTokens) internal view {
        for (uint256 i = 0; i < allowedTokens.length; i++) {
            if (allowedTokens[i] != address(0)) {
                // Optional: Add token validation logic here
                // For now, we allow any non-zero token address
                continue;
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Updates the platform fee for vault creation
    /// @param newFee New platform fee in wei
    function setPlatformFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }
    
    /// @notice Updates the vault implementation template
    /// @param newImplementation Address of the new implementation
    function setImplementation(address newImplementation) external onlyOwner validAddress(newImplementation) {
        address oldImplementation = vaultImplementation;
        vaultImplementation = newImplementation;
        emit ImplementationUpdated(oldImplementation, newImplementation);
    }
    
    /// @notice Updates supported tokens list
    /// @param tokens Array of token addresses
    /// @param supported Array of boolean values indicating support status
    function setSupportedTokens(address[] calldata tokens, bool[] calldata supported) external onlyOwner {
        if (tokens.length != supported.length) {
            revert InvalidAddress(address(0)); // Array length mismatch
        }
        
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == address(0)) continue;
            
            bool wasSupported = supportedTokens[tokens[i]];
            supportedTokens[tokens[i]] = supported[i];
            
            // Update supported token list
            if (supported[i] && !wasSupported) {
                supportedTokenList.push(tokens[i]);
            } else if (!supported[i] && wasSupported) {
                // Remove from list
                for (uint256 j = 0; j < supportedTokenList.length; j++) {
                    if (supportedTokenList[j] == tokens[i]) {
                        supportedTokenList[j] = supportedTokenList[supportedTokenList.length - 1];
                        supportedTokenList.pop();
                        break;
                    }
                }
            }
        }
        
        emit SupportedTokensUpdated(tokens, supported);
    }
    
    /// @notice Withdraws collected platform fees
    /// @param to Address to send fees to
    function withdrawFees(address to) external onlyOwner validAddress(to) {
        uint256 balance = address(this).balance;
        if (balance == 0) return;
        
        (bool success, ) = payable(to).call{value: balance}("");
        require(success, "Fee withdrawal failed");
        
        emit FeesWithdrawn(to, balance);
    }
    
    /// @notice Pauses vault creation (emergency use only)
    function pause() external onlyOwner {
        _pause();
    }
    
    /// @notice Unpauses vault creation
    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                              VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Returns vault addresses for a specific user
    /// @param user Address of the user
    /// @return vaults Array of vault addresses owned by the user
    function getUserVaults(address user) external view returns (address[] memory vaults) {
        uint256 count = userVaultCount[user];
        vaults = new address[](count);
        
        for (uint256 i = 0; i < count; i++) {
            vaults[i] = userVaults[user][i];
        }
    }
    
    /// @notice Returns all vault addresses (paginated)
    /// @param offset Starting index
    /// @param limit Maximum number of vaults to return
    /// @return vaults Array of vault addresses
    function getAllVaults(uint256 offset, uint256 limit) external view returns (address[] memory vaults) {
        if (offset >= allVaults.length) {
            return new address[](0);
        }
        
        uint256 end = offset + limit;
        if (end > allVaults.length) {
            end = allVaults.length;
        }
        
        vaults = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            vaults[i - offset] = allVaults[i];
        }
    }
    
    /// @notice Returns supported tokens list
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokenList;
    }
    
    /// @notice Estimates gas cost for vault creation
    /// @return gasEstimate Estimated gas units needed
    function estimateVaultCreationGas() external view returns (uint256 gasEstimate) {
        // Base cost estimation (this would need to be calibrated based on actual usage)
        return 250000; // Estimated gas units for vault creation
    }
    
    /// @notice Calculates total cost for vault creation including gas
    /// @param gasPrice Current gas price in wei
    /// @return totalCost Total cost in wei (platform fee + estimated gas cost)
    function calculateVaultCreationCost(uint256 gasPrice) external view returns (uint256 totalCost) {
        uint256 gasEstimate = this.estimateVaultCreationGas();
        return platformFee + (gasEstimate * gasPrice);
    }
    
    /// @notice Gets factory statistics
    /// @return totalVaultsCreated Total number of vaults created
    /// @return totalFeesCollectedAmount Total fees collected in wei
    /// @return currentPlatformFee Current platform fee in wei
    /// @return supportedTokenCount Number of supported tokens
    function getFactoryStats() external view returns (
        uint256 totalVaultsCreated,
        uint256 totalFeesCollectedAmount,
        uint256 currentPlatformFee,
        uint256 supportedTokenCount
    ) {
        return (
            totalVaults,
            totalFeesCollected,
            platformFee,
            supportedTokenList.length
        );
    }

    /*//////////////////////////////////////////////////////////////
                         EMERGENCY FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Emergency function to pause a specific vault
    /// @param vault Address of the vault to pause
    function emergencyPauseVault(address vault) external onlyOwner {
        if (!isVaultRegistered[vault]) {
            revert InvalidAddress(vault);
        }
        
        ChildVault(payable(vault)).emergencyPause();
    }
    
    /// @notice Emergency function to unpause a specific vault
    /// @param vault Address of the vault to unpause  
    function emergencyUnpauseVault(address vault) external onlyOwner {
        if (!isVaultRegistered[vault]) {
            revert InvalidAddress(vault);
        }
        
        ChildVault(payable(vault)).unpause();
    }

    /*//////////////////////////////////////////////////////////////
                              FALLBACK
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Receives ETH payments (for platform fees)
    receive() external payable {
        // Accepts fee payments
    }
}