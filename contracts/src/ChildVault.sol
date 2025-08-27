// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ChildVault
 * @author CreatorHub.Brave Team
 * @notice A time-locked vault that holds ETH and ERC-20 tokens until a specified unlock date
 * @dev Implements minimal proxy pattern for gas-efficient deployment
 * 
 * Key Features:
 * - Time-locked withdrawals with immutable unlock timestamp
 * - Support for ETH and whitelisted ERC-20 tokens
 * - Immutable beneficiary address (can only be changed via social recovery)
 * - Social recovery system with guardian consensus
 * - Emergency pause functionality
 * - Comprehensive event logging
 * 
 * Brand Alignment:
 * - "Your vault, your keys, your future" - Clear ownership model
 * - "Secure Your Tomorrow" - Time-locked security focus
 * - Clear, user-friendly error messages following brand voice
 */
contract ChildVault is ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Vault is still locked - withdrawals not yet available
    error VaultStillLocked(uint256 currentTime, uint256 unlockTime);
    
    /// @notice Only the beneficiary can perform this action
    error OnlyBeneficiary(address caller, address beneficiary);
    
    /// @notice Only authorized guardians can perform this action
    error OnlyGuardian(address caller);
    
    /// @notice Token is not whitelisted for this vault
    error TokenNotAllowed(address token);
    
    /// @notice Invalid unlock time (must be in the future)
    error InvalidUnlockTime(uint256 unlockTime);
    
    /// @notice Invalid address provided (cannot be zero address)
    error InvalidAddress(address addr);
    
    /// @notice Insufficient guardian signatures for recovery
    error InsufficientGuardianSignatures(uint256 provided, uint256 required);
    
    /// @notice Social recovery is already in progress
    error RecoveryAlreadyInProgress();
    
    /// @notice Social recovery timelock has not expired yet
    error RecoveryTimelockActive(uint256 currentTime, uint256 recoveryTime);

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Emitted when the vault is initialized
    event VaultInitialized(
        address indexed beneficiary,
        uint256 indexed unlockTime,
        address[] allowedTokens
    );
    
    /// @notice Emitted when ETH is deposited
    event EthDeposited(address indexed from, uint256 amount);
    
    /// @notice Emitted when tokens are deposited
    event TokenDeposited(address indexed from, address indexed token, uint256 amount);
    
    /// @notice Emitted when ETH is withdrawn
    event EthWithdrawn(address indexed to, uint256 amount);
    
    /// @notice Emitted when tokens are withdrawn
    event TokenWithdrawn(address indexed to, address indexed token, uint256 amount);
    
    /// @notice Emitted when social recovery is initiated
    event SocialRecoveryInitiated(
        address indexed newBeneficiary,
        address[] guardians,
        uint256 recoveryTime
    );
    
    /// @notice Emitted when social recovery is completed
    event SocialRecoveryCompleted(
        address indexed oldBeneficiary,
        address indexed newBeneficiary
    );
    
    /// @notice Emitted when guardians are updated
    event GuardiansUpdated(address[] newGuardians, uint256 newThreshold);

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @notice The beneficiary who can withdraw funds after unlock time
    address public beneficiary;
    
    /// @notice Timestamp when the vault unlocks (set during initialization)
    uint256 public unlockTime;
    
    /// @notice List of tokens allowed to be deposited in this vault
    mapping(address => bool) public allowedTokens;
    
    /// @notice Array of allowed token addresses for enumeration
    address[] public allowedTokenList;
    
    /// @notice List of guardian addresses for social recovery
    address[] public guardians;
    
    /// @notice Number of guardian signatures required for recovery
    uint256 public guardianThreshold;
    
    /// @notice Social recovery data
    struct SocialRecovery {
        address newBeneficiary;
        uint256 initiatedAt;
        uint256 guardiansApproved;
        mapping(address => bool) hasApproved;
        bool isActive;
    }
    
    /// @notice Current social recovery state
    SocialRecovery public socialRecovery;
    
    /// @notice Time delay for social recovery (7 days)
    uint256 public constant RECOVERY_TIMELOCK = 7 days;
    
    /// @notice Factory contract that deployed this vault  
    address public factory;
    
    /// @notice Whether this vault has been initialized (for clones)
    bool public isInitialized;

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Restricts access to the beneficiary only
    modifier onlyBeneficiary() {
        if (msg.sender != beneficiary) {
            revert OnlyBeneficiary(msg.sender, beneficiary);
        }
        _;
    }
    
    /// @notice Restricts access to authorized guardians only
    modifier onlyGuardian() {
        bool isGuardian = false;
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == msg.sender) {
                isGuardian = true;
                break;
            }
        }
        if (!isGuardian) {
            revert OnlyGuardian(msg.sender);
        }
        _;
    }
    
    /// @notice Ensures vault is unlocked before allowing withdrawals
    modifier onlyWhenUnlocked() {
        if (block.timestamp < unlockTime) {
            revert VaultStillLocked(block.timestamp, unlockTime);
        }
        _;
    }
    
    /// @notice Validates that address is not zero
    modifier validAddress(address addr) {
        if (addr == address(0)) {
            revert InvalidAddress(addr);
        }
        _;
    }
    
    /// @notice Ensures vault is initialized before use
    modifier onlyInitialized() {
        if (!isInitialized) {
            revert OnlyGuardian(msg.sender); // Reusing error for uninitialized access
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Constructor sets factory for template (clones will be initialized separately)
    /// @param _factory Address of the VaultFactory contract  
    /// @param _unlockTime Placeholder unlock time for template (clones will override this)
    constructor(address _factory, uint256 _unlockTime) validAddress(_factory) {
        factory = _factory;
        unlockTime = _unlockTime; // This is just a placeholder for the template
        
        // Initialize as paused - clones will be initialized properly
        _pause();
    }

    /*//////////////////////////////////////////////////////////////
                         INITIALIZATION
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Initializes the vault with beneficiary and allowed tokens
    /// @dev Called by VaultFactory during deployment
    /// @param _beneficiary Address that will receive funds after unlock
    /// @param _unlockTime Timestamp when vault unlocks
    /// @param _allowedTokens Array of token addresses allowed for deposit
    /// @param _guardians Array of guardian addresses for social recovery
    /// @param _guardianThreshold Number of guardians required for recovery
    function initialize(
        address _beneficiary,
        uint256 _unlockTime,
        address[] calldata _allowedTokens,
        address[] calldata _guardians,
        uint256 _guardianThreshold
    ) external validAddress(_beneficiary) {
        // Prevent re-initialization
        if (isInitialized) {
            revert OnlyGuardian(msg.sender); // Reusing error for re-initialization
        }
        
        // Set factory address (for clones)
        factory = msg.sender;
        
        // Validate unlock time
        if (_unlockTime <= block.timestamp) {
            revert InvalidUnlockTime(_unlockTime);
        }
        
        // Validate guardian threshold
        if (_guardianThreshold == 0 || _guardianThreshold > _guardians.length) {
            revert InsufficientGuardianSignatures(_guardianThreshold, _guardians.length);
        }
        
        beneficiary = _beneficiary;
        unlockTime = _unlockTime;
        
        // Set allowed tokens
        for (uint256 i = 0; i < _allowedTokens.length; i++) {
            if (_allowedTokens[i] != address(0)) {
                allowedTokens[_allowedTokens[i]] = true;
                allowedTokenList.push(_allowedTokens[i]);
            }
        }
        
        // Set guardians
        guardians = _guardians;
        guardianThreshold = _guardianThreshold;
        
        // Mark as initialized
        isInitialized = true;
        
        // Unpause the vault (only if it was paused)
        if (paused()) {
            _unpause();
        }
        
        emit VaultInitialized(_beneficiary, unlockTime, _allowedTokens);
        emit GuardiansUpdated(_guardians, _guardianThreshold);
    }

    /*//////////////////////////////////////////////////////////////
                            DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Deposits ETH into the vault
    /// @dev Anyone can deposit ETH into the vault
    function depositEth() external payable onlyInitialized {
        if (msg.value == 0) revert InvalidAddress(address(0)); // Reusing error for zero amount
        
        emit EthDeposited(msg.sender, msg.value);
    }
    
    /// @notice Deposits ERC-20 tokens into the vault
    /// @param token Address of the token to deposit
    /// @param amount Amount of tokens to deposit
    function depositToken(address token, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        validAddress(token)
    {
        if (!allowedTokens[token]) {
            revert TokenNotAllowed(token);
        }
        
        if (amount == 0) revert InvalidAddress(address(0)); // Reusing error for zero amount
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        emit TokenDeposited(msg.sender, token, amount);
    }

    /*//////////////////////////////////////////////////////////////
                           WITHDRAWAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Withdraws all ETH from the vault
    /// @dev Only beneficiary can withdraw and only after unlock time
    function withdrawEth() external onlyBeneficiary onlyWhenUnlocked nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) return;
        
        (bool success, ) = payable(beneficiary).call{value: balance}("");
        require(success, "ETH transfer failed");
        
        emit EthWithdrawn(beneficiary, balance);
    }
    
    /// @notice Withdraws specific amount of ETH from the vault
    /// @param amount Amount of ETH to withdraw
    function withdrawEth(uint256 amount) 
        external 
        onlyBeneficiary 
        onlyWhenUnlocked 
        nonReentrant 
    {
        if (amount == 0) revert InvalidAddress(address(0)); // Reusing error for zero amount
        if (amount > address(this).balance) revert InvalidAddress(address(0)); // Insufficient balance
        
        (bool success, ) = payable(beneficiary).call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit EthWithdrawn(beneficiary, amount);
    }
    
    /// @notice Withdraws all tokens of a specific type from the vault
    /// @param token Address of the token to withdraw
    function withdrawToken(address token) 
        external 
        onlyBeneficiary 
        onlyWhenUnlocked 
        nonReentrant 
        validAddress(token)
    {
        if (!allowedTokens[token]) {
            revert TokenNotAllowed(token);
        }
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) return;
        
        IERC20(token).safeTransfer(beneficiary, balance);
        
        emit TokenWithdrawn(beneficiary, token, balance);
    }
    
    /// @notice Withdraws specific amount of tokens from the vault
    /// @param token Address of the token to withdraw
    /// @param amount Amount of tokens to withdraw
    function withdrawToken(address token, uint256 amount) 
        external 
        onlyBeneficiary 
        onlyWhenUnlocked 
        nonReentrant 
        validAddress(token)
    {
        if (!allowedTokens[token]) {
            revert TokenNotAllowed(token);
        }
        
        if (amount == 0) revert InvalidAddress(address(0)); // Reusing error for zero amount
        
        IERC20(token).safeTransfer(beneficiary, amount);
        
        emit TokenWithdrawn(beneficiary, token, amount);
    }

    /*//////////////////////////////////////////////////////////////
                         SOCIAL RECOVERY FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Initiates social recovery process to change beneficiary
    /// @param newBeneficiary New beneficiary address
    function initiateSocialRecovery(address newBeneficiary) 
        external 
        onlyGuardian 
        validAddress(newBeneficiary)
    {
        if (socialRecovery.isActive) {
            revert RecoveryAlreadyInProgress();
        }
        
        socialRecovery.newBeneficiary = newBeneficiary;
        socialRecovery.initiatedAt = block.timestamp;
        socialRecovery.guardiansApproved = 1;
        socialRecovery.hasApproved[msg.sender] = true;
        socialRecovery.isActive = true;
        
        emit SocialRecoveryInitiated(newBeneficiary, guardians, block.timestamp + RECOVERY_TIMELOCK);
    }
    
    /// @notice Approves the current social recovery proposal
    function approveSocialRecovery() external onlyGuardian {
        if (!socialRecovery.isActive) {
            revert InvalidAddress(address(0)); // No active recovery
        }
        
        if (socialRecovery.hasApproved[msg.sender]) {
            return; // Already approved
        }
        
        socialRecovery.hasApproved[msg.sender] = true;
        socialRecovery.guardiansApproved++;
    }
    
    /// @notice Executes social recovery after timelock and sufficient approvals
    function executeSocialRecovery() external {
        if (!socialRecovery.isActive) {
            revert InvalidAddress(address(0)); // No active recovery
        }
        
        if (block.timestamp < socialRecovery.initiatedAt + RECOVERY_TIMELOCK) {
            revert RecoveryTimelockActive(
                block.timestamp, 
                socialRecovery.initiatedAt + RECOVERY_TIMELOCK
            );
        }
        
        if (socialRecovery.guardiansApproved < guardianThreshold) {
            revert InsufficientGuardianSignatures(
                socialRecovery.guardiansApproved, 
                guardianThreshold
            );
        }
        
        address oldBeneficiary = beneficiary;
        beneficiary = socialRecovery.newBeneficiary;
        
        // Reset social recovery state
        delete socialRecovery;
        
        emit SocialRecoveryCompleted(oldBeneficiary, beneficiary);
    }

    /*//////////////////////////////////////////////////////////////
                              VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Returns the ETH balance of the vault
    function getEthBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /// @notice Returns the token balance for a specific token
    /// @param token Address of the token
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    /// @notice Returns all allowed tokens
    function getAllowedTokens() external view returns (address[] memory) {
        return allowedTokenList;
    }
    
    /// @notice Returns all guardians
    function getGuardians() external view returns (address[] memory) {
        return guardians;
    }
    
    /// @notice Returns time remaining until unlock (0 if already unlocked)
    function getTimeUntilUnlock() external view returns (uint256) {
        if (block.timestamp >= unlockTime) {
            return 0;
        }
        return unlockTime - block.timestamp;
    }
    
    /// @notice Checks if vault is currently unlocked
    function isUnlocked() external view returns (bool) {
        return block.timestamp >= unlockTime;
    }
    
    /// @notice Returns social recovery status
    function getSocialRecoveryStatus() external view returns (
        bool isActive,
        address newBeneficiary,
        uint256 initiatedAt,
        uint256 guardiansApproved,
        uint256 timeRemaining
    ) {
        isActive = socialRecovery.isActive;
        newBeneficiary = socialRecovery.newBeneficiary;
        initiatedAt = socialRecovery.initiatedAt;
        guardiansApproved = socialRecovery.guardiansApproved;
        
        if (isActive && block.timestamp < socialRecovery.initiatedAt + RECOVERY_TIMELOCK) {
            timeRemaining = (socialRecovery.initiatedAt + RECOVERY_TIMELOCK) - block.timestamp;
        } else {
            timeRemaining = 0;
        }
    }

    /*//////////////////////////////////////////////////////////////
                         EMERGENCY FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Emergency pause function (only for critical security issues)
    /// @dev Can only be called by factory for emergency situations
    function emergencyPause() external {
        if (msg.sender != factory) {
            revert OnlyGuardian(msg.sender);
        }
        _pause();
    }
    
    /// @notice Unpause the vault (only factory)
    function unpause() external {
        if (msg.sender != factory) {
            revert OnlyGuardian(msg.sender);
        }
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                              FALLBACK
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Receives ETH deposits
    receive() external payable whenNotPaused {
        emit EthDeposited(msg.sender, msg.value);
    }
}