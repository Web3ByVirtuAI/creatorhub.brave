// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/ChildVault.sol";
import "../src/VaultFactory.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ChildVaultTest
 * @notice Comprehensive test suite for ChildVault contract
 * @dev Tests all core functionality, edge cases, and security aspects
 */
contract ChildVaultTest is Test {
    ChildVault public vault;
    VaultFactory public factory;
    MockERC20 public token1;
    MockERC20 public token2;
    
    address public beneficiary = makeAddr("beneficiary");
    address public guardian1 = makeAddr("guardian1");
    address public guardian2 = makeAddr("guardian2");
    address public guardian3 = makeAddr("guardian3");
    address public attacker = makeAddr("attacker");
    address public factory_owner = makeAddr("factory_owner");
    
    uint256 public unlockTime;
    address[] public allowedTokens;
    address[] public guardians;
    uint256 public guardianThreshold = 2;
    
    event VaultInitialized(
        address indexed beneficiary,
        uint256 indexed unlockTime,
        address[] allowedTokens
    );
    
    event EthDeposited(address indexed from, uint256 amount);
    event TokenDeposited(address indexed from, address indexed token, uint256 amount);
    event EthWithdrawn(address indexed to, uint256 amount);
    event TokenWithdrawn(address indexed to, address indexed token, uint256 amount);
    event SocialRecoveryInitiated(address indexed newBeneficiary, address[] guardians, uint256 recoveryTime);
    event SocialRecoveryCompleted(address indexed oldBeneficiary, address indexed newBeneficiary);

    function setUp() public {
        // Set unlock time to 1 hour from now
        unlockTime = block.timestamp + 1 hours;
        
        // Deploy mock tokens
        token1 = new MockERC20("Token1", "T1");
        token2 = new MockERC20("Token2", "T2");
        
        // Setup allowed tokens
        allowedTokens.push(address(token1));
        allowedTokens.push(address(token2));
        
        // Setup guardians
        guardians.push(guardian1);
        guardians.push(guardian2);
        guardians.push(guardian3);
        
        // Deploy factory
        factory = new VaultFactory(factory_owner, 0.01 ether);
        
        // Deploy vault
        vault = new ChildVault(address(factory), unlockTime);
        
        // Initialize vault as factory
        vm.prank(address(factory));
        vault.initialize(beneficiary, unlockTime, allowedTokens, guardians, guardianThreshold);
    }

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testInitialization() public {
        assertEq(vault.beneficiary(), beneficiary);
        assertEq(vault.unlockTime(), unlockTime);
        assertEq(vault.factory(), address(factory));
        assertEq(vault.guardianThreshold(), guardianThreshold);
        
        address[] memory vaultGuardians = vault.getGuardians();
        assertEq(vaultGuardians.length, 3);
        assertEq(vaultGuardians[0], guardian1);
        assertEq(vaultGuardians[1], guardian2);
        assertEq(vaultGuardians[2], guardian3);
        
        assertTrue(vault.allowedTokens(address(token1)));
        assertTrue(vault.allowedTokens(address(token2)));
        
        address[] memory vaultAllowedTokens = vault.getAllowedTokens();
        assertEq(vaultAllowedTokens.length, 2);
    }
    
    function testCannotInitializeTwice() public {
        vm.prank(address(factory));
        vm.expectRevert();
        vault.initialize(beneficiary, unlockTime, allowedTokens, guardians, guardianThreshold);
    }
    
    function testCannotInitializeWithZeroBeneficiary() public {
        ChildVault newVault = new ChildVault(address(factory), unlockTime);
        
        vm.prank(address(factory));
        vm.expectRevert();
        newVault.initialize(address(0), unlockTime, allowedTokens, guardians, guardianThreshold);
    }

    /*//////////////////////////////////////////////////////////////
                            DEPOSIT TESTS
    //////////////////////////////////////////////////////////////*/

    function testDepositEth() public {
        uint256 depositAmount = 1 ether;
        
        vm.expectEmit(true, false, false, true);
        emit EthDeposited(address(this), depositAmount);
        
        vault.depositEth{value: depositAmount}();
        
        assertEq(vault.getEthBalance(), depositAmount);
        assertEq(address(vault).balance, depositAmount);
    }
    
    function testDepositEthViaReceive() public {
        uint256 depositAmount = 0.5 ether;
        
        vm.expectEmit(true, false, false, true);
        emit EthDeposited(address(this), depositAmount);
        
        (bool success, ) = address(vault).call{value: depositAmount}("");
        assertTrue(success);
        
        assertEq(vault.getEthBalance(), depositAmount);
    }
    
    function testDepositToken() public {
        uint256 depositAmount = 100e18;
        
        // Mint tokens to this contract
        token1.mint(address(this), depositAmount);
        token1.approve(address(vault), depositAmount);
        
        vm.expectEmit(true, true, false, true);
        emit TokenDeposited(address(this), address(token1), depositAmount);
        
        vault.depositToken(address(token1), depositAmount);
        
        assertEq(vault.getTokenBalance(address(token1)), depositAmount);
        assertEq(token1.balanceOf(address(vault)), depositAmount);
    }
    
    function testCannotDepositUnallowedToken() public {
        MockERC20 unauthorizedToken = new MockERC20("Bad", "BAD");
        uint256 depositAmount = 100e18;
        
        unauthorizedToken.mint(address(this), depositAmount);
        unauthorizedToken.approve(address(vault), depositAmount);
        
        vm.expectRevert(abi.encodeWithSelector(ChildVault.TokenNotAllowed.selector, address(unauthorizedToken)));
        vault.depositToken(address(unauthorizedToken), depositAmount);
    }
    
    function testCannotDepositZeroAmount() public {
        vm.expectRevert();
        vault.depositEth{value: 0}();
        
        vm.expectRevert();
        vault.depositToken(address(token1), 0);
    }

    /*//////////////////////////////////////////////////////////////
                           WITHDRAWAL TESTS
    //////////////////////////////////////////////////////////////*/

    function testCannotWithdrawBeforeUnlock() public {
        // Deposit some ETH
        vault.depositEth{value: 1 ether}();
        
        // Try to withdraw as beneficiary before unlock time
        vm.startPrank(beneficiary);
        vm.expectRevert(abi.encodeWithSelector(
            ChildVault.VaultStillLocked.selector, 
            block.timestamp, 
            unlockTime
        ));
        vault.withdrawEth();
        vm.stopPrank();
    }
    
    function testWithdrawEthAfterUnlock() public {
        uint256 depositAmount = 1 ether;
        vault.depositEth{value: depositAmount}();
        
        // Fast forward past unlock time
        vm.warp(unlockTime + 1);
        
        // Withdraw as beneficiary
        vm.startPrank(beneficiary);
        uint256 balanceBefore = beneficiary.balance;
        
        vm.expectEmit(true, false, false, true);
        emit EthWithdrawn(beneficiary, depositAmount);
        
        vault.withdrawEth();
        
        assertEq(beneficiary.balance, balanceBefore + depositAmount);
        assertEq(vault.getEthBalance(), 0);
        vm.stopPrank();
    }
    
    function testWithdrawSpecificEthAmount() public {
        uint256 depositAmount = 2 ether;
        uint256 withdrawAmount = 1 ether;
        vault.depositEth{value: depositAmount}();
        
        // Fast forward past unlock time
        vm.warp(unlockTime + 1);
        
        vm.startPrank(beneficiary);
        uint256 balanceBefore = beneficiary.balance;
        
        vault.withdrawEth(withdrawAmount);
        
        assertEq(beneficiary.balance, balanceBefore + withdrawAmount);
        assertEq(vault.getEthBalance(), depositAmount - withdrawAmount);
        vm.stopPrank();
    }
    
    function testWithdrawTokenAfterUnlock() public {
        uint256 depositAmount = 100e18;
        
        token1.mint(address(this), depositAmount);
        token1.approve(address(vault), depositAmount);
        vault.depositToken(address(token1), depositAmount);
        
        // Fast forward past unlock time
        vm.warp(unlockTime + 1);
        
        vm.startPrank(beneficiary);
        uint256 balanceBefore = token1.balanceOf(beneficiary);
        
        vm.expectEmit(true, true, false, true);
        emit TokenWithdrawn(beneficiary, address(token1), depositAmount);
        
        vault.withdrawToken(address(token1));
        
        assertEq(token1.balanceOf(beneficiary), balanceBefore + depositAmount);
        assertEq(vault.getTokenBalance(address(token1)), 0);
        vm.stopPrank();
    }
    
    function testOnlyBeneficiaryCanWithdraw() public {
        vault.depositEth{value: 1 ether}();
        vm.warp(unlockTime + 1);
        
        // Try to withdraw as non-beneficiary
        vm.startPrank(attacker);
        vm.expectRevert(abi.encodeWithSelector(
            ChildVault.OnlyBeneficiary.selector,
            attacker,
            beneficiary
        ));
        vault.withdrawEth();
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        SOCIAL RECOVERY TESTS
    //////////////////////////////////////////////////////////////*/

    function testInitiateSocialRecovery() public {
        address newBeneficiary = makeAddr("newBeneficiary");
        
        vm.startPrank(guardian1);
        
        vm.expectEmit(true, false, false, false);
        emit SocialRecoveryInitiated(newBeneficiary, guardians, block.timestamp + vault.RECOVERY_TIMELOCK());
        
        vault.initiateSocialRecovery(newBeneficiary);
        
        (bool isActive, address recoveryBeneficiary, uint256 initiatedAt, uint256 approved, uint256 timeRemaining) = 
            vault.getSocialRecoveryStatus();
            
        assertTrue(isActive);
        assertEq(recoveryBeneficiary, newBeneficiary);
        assertEq(approved, 1);
        assertGt(timeRemaining, 0);
        
        vm.stopPrank();
    }
    
    function testSocialRecoveryApproval() public {
        address newBeneficiary = makeAddr("newBeneficiary");
        
        // Initiate recovery
        vm.prank(guardian1);
        vault.initiateSocialRecovery(newBeneficiary);
        
        // Second guardian approves
        vm.prank(guardian2);
        vault.approveSocialRecovery();
        
        (,, , uint256 approved, ) = vault.getSocialRecoveryStatus();
        assertEq(approved, 2);
    }
    
    function testExecuteSocialRecovery() public {
        address newBeneficiary = makeAddr("newBeneficiary");
        
        // Initiate recovery
        vm.prank(guardian1);
        vault.initiateSocialRecovery(newBeneficiary);
        
        // Second guardian approves
        vm.prank(guardian2);
        vault.approveSocialRecovery();
        
        // Fast forward past recovery timelock
        vm.warp(block.timestamp + vault.RECOVERY_TIMELOCK() + 1);
        
        vm.expectEmit(true, true, false, false);
        emit SocialRecoveryCompleted(beneficiary, newBeneficiary);
        
        vault.executeSocialRecovery();
        
        // Verify beneficiary has changed
        assertEq(vault.beneficiary(), newBeneficiary);
        
        // Verify recovery state is reset
        (bool isActive,,,,) = vault.getSocialRecoveryStatus();
        assertFalse(isActive);
    }
    
    function testCannotExecuteRecoveryWithoutEnoughApprovals() public {
        address newBeneficiary = makeAddr("newBeneficiary");
        
        // Only one guardian initiates (need 2 for threshold)
        vm.prank(guardian1);
        vault.initiateSocialRecovery(newBeneficiary);
        
        // Fast forward past timelock
        vm.warp(block.timestamp + vault.RECOVERY_TIMELOCK() + 1);
        
        vm.expectRevert(abi.encodeWithSelector(
            ChildVault.InsufficientGuardianSignatures.selector,
            1,
            guardianThreshold
        ));
        vault.executeSocialRecovery();
    }
    
    function testCannotExecuteRecoveryBeforeTimelock() public {
        address newBeneficiary = makeAddr("newBeneficiary");
        
        // Get required approvals
        vm.prank(guardian1);
        vault.initiateSocialRecovery(newBeneficiary);
        vm.prank(guardian2);
        vault.approveSocialRecovery();
        
        // Try to execute before timelock
        vm.expectRevert();
        vault.executeSocialRecovery();
    }
    
    function testOnlyGuardiansCanInitiateRecovery() public {
        address newBeneficiary = makeAddr("newBeneficiary");
        
        vm.startPrank(attacker);
        vm.expectRevert(abi.encodeWithSelector(
            ChildVault.OnlyGuardian.selector,
            attacker
        ));
        vault.initiateSocialRecovery(newBeneficiary);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testGetTimeUntilUnlock() public {
        uint256 timeUntilUnlock = vault.getTimeUntilUnlock();
        assertGt(timeUntilUnlock, 0);
        assertLe(timeUntilUnlock, 1 hours);
        
        // After unlock time
        vm.warp(unlockTime + 1);
        assertEq(vault.getTimeUntilUnlock(), 0);
    }
    
    function testIsUnlocked() public {
        assertFalse(vault.isUnlocked());
        
        vm.warp(unlockTime + 1);
        assertTrue(vault.isUnlocked());
    }
    
    function testGetBalances() public {
        uint256 ethAmount = 1 ether;
        uint256 tokenAmount = 100e18;
        
        // Deposit ETH and tokens
        vault.depositEth{value: ethAmount}();
        
        token1.mint(address(this), tokenAmount);
        token1.approve(address(vault), tokenAmount);
        vault.depositToken(address(token1), tokenAmount);
        
        assertEq(vault.getEthBalance(), ethAmount);
        assertEq(vault.getTokenBalance(address(token1)), tokenAmount);
    }

    /*//////////////////////////////////////////////////////////////
                            SECURITY TESTS
    //////////////////////////////////////////////////////////////*/

    function testReentrancyProtection() public {
        // This test would need a malicious token contract
        // that tries to reenter on transfer - simplified for now
        uint256 depositAmount = 100e18;
        
        token1.mint(address(this), depositAmount);
        token1.approve(address(vault), depositAmount);
        
        vault.depositToken(address(token1), depositAmount);
        
        vm.warp(unlockTime + 1);
        
        vm.startPrank(beneficiary);
        vault.withdrawToken(address(token1));
        
        // Should not be able to withdraw again
        vm.expectRevert();
        vault.withdrawToken(address(token1));
        vm.stopPrank();
    }
    
    function testEmergencyPause() public {
        // Only factory can pause
        vm.startPrank(address(factory));
        vault.emergencyPause();
        
        // Should not be able to deposit when paused
        vm.expectRevert("Pausable: paused");
        vault.depositEth{value: 1 ether}();
        
        vault.unpause();
        vm.stopPrank();
        
        // Should work again after unpause
        vault.depositEth{value: 1 ether}();
    }
    
    function testOnlyFactoryCanPause() public {
        vm.startPrank(attacker);
        vm.expectRevert(abi.encodeWithSelector(
            ChildVault.OnlyGuardian.selector,
            attacker
        ));
        vault.emergencyPause();
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                             FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_DepositAndWithdrawEth(uint256 amount) public {
        vm.assume(amount > 0 && amount <= 100 ether);
        
        // Ensure we have enough ETH
        vm.deal(address(this), amount);
        
        vault.depositEth{value: amount}();
        assertEq(vault.getEthBalance(), amount);
        
        vm.warp(unlockTime + 1);
        
        vm.startPrank(beneficiary);
        vault.withdrawEth();
        
        assertEq(vault.getEthBalance(), 0);
        vm.stopPrank();
    }
    
    function testFuzz_UnlockTime(uint256 _unlockTime) public {
        _unlockTime = bound(_unlockTime, block.timestamp + 1 hours, block.timestamp + 100 * 365 days);
        
        ChildVault newVault = new ChildVault(address(factory), _unlockTime);
        assertEq(newVault.unlockTime(), _unlockTime);
        
        // Should not be unlocked initially
        assertFalse(newVault.isUnlocked());
        
        // Should be unlocked after the time
        vm.warp(_unlockTime + 1);
        assertTrue(newVault.isUnlocked());
    }

    /*//////////////////////////////////////////////////////////////
                          INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testFullVaultLifecycle() public {
        uint256 ethAmount = 2 ether;
        uint256 tokenAmount = 1000e18;
        
        // 1. Deposit funds
        vault.depositEth{value: ethAmount}();
        
        token1.mint(address(this), tokenAmount);
        token1.approve(address(vault), tokenAmount);
        vault.depositToken(address(token1), tokenAmount);
        
        // 2. Verify funds are locked
        vm.startPrank(beneficiary);
        vm.expectRevert();
        vault.withdrawEth();
        vm.stopPrank();
        
        // 3. Wait for unlock
        vm.warp(unlockTime + 1);
        
        // 4. Withdraw funds
        vm.startPrank(beneficiary);
        uint256 ethBefore = beneficiary.balance;
        uint256 tokenBefore = token1.balanceOf(beneficiary);
        
        vault.withdrawEth();
        vault.withdrawToken(address(token1));
        
        assertEq(beneficiary.balance, ethBefore + ethAmount);
        assertEq(token1.balanceOf(beneficiary), tokenBefore + tokenAmount);
        assertEq(vault.getEthBalance(), 0);
        assertEq(vault.getTokenBalance(address(token1)), 0);
        vm.stopPrank();
    }
}

/**
 * @title MockERC20
 * @notice Simple ERC20 token for testing
 */
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}