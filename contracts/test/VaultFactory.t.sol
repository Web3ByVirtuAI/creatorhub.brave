// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/VaultFactory.sol";
import "../src/ChildVault.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title VaultFactoryTest
 * @notice Comprehensive test suite for VaultFactory contract
 * @dev Tests vault creation, fee management, and administrative functions
 */
contract VaultFactoryTest is Test {
    VaultFactory public factory;
    MockERC20 public token1;
    MockERC20 public token2;
    
    address public owner = makeAddr("owner");
    address public beneficiary = makeAddr("beneficiary");
    address public guardian1 = makeAddr("guardian1");
    address public guardian2 = makeAddr("guardian2");
    address public attacker = makeAddr("attacker");
    
    uint256 public platformFee = 0.01 ether;
    uint256 public unlockTime;
    address[] public allowedTokens;
    address[] public guardians;
    uint256 public guardianThreshold = 2;
    
    event VaultCreated(
        address indexed vault,
        address indexed beneficiary,
        uint256 indexed unlockTime,
        address[] allowedTokens,
        address[] guardians,
        uint256 guardianThreshold,
        address creator
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event ImplementationUpdated(address oldImplementation, address newImplementation);
    event FeesWithdrawn(address indexed to, uint256 amount);

    function setUp() public {
        // Deploy tokens
        token1 = new MockERC20("Token1", "T1");
        token2 = new MockERC20("Token2", "T2");
        
        // Set unlock time
        unlockTime = block.timestamp + 1 days;
        
        // Setup arrays
        allowedTokens.push(address(token1));
        allowedTokens.push(address(token2));
        
        guardians.push(guardian1);
        guardians.push(guardian2);
        
        // Deploy factory
        factory = new VaultFactory(owner, platformFee);
    }

    /*//////////////////////////////////////////////////////////////
                          FACTORY DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function testFactoryInitialization() public {
        assertEq(factory.owner(), owner);
        assertEq(factory.platformFee(), platformFee);
        assertTrue(factory.vaultImplementation() != address(0));
        assertEq(factory.totalVaults(), 0);
        assertEq(factory.totalFeesCollected(), 0);
    }
    
    function testCannotDeployWithZeroOwner() public {
        vm.expectRevert();
        new VaultFactory(address(0), platformFee);
    }

    /*//////////////////////////////////////////////////////////////
                           VAULT CREATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testCreateVault() public {
        vm.deal(address(this), 1 ether);
        
        vm.expectEmit(false, true, true, false);
        emit VaultCreated(
            address(0), // We don't know the vault address in advance
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold,
            address(this)
        );
        
        address vault = factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        // Verify vault was created correctly
        assertTrue(factory.isVaultRegistered(vault));
        assertEq(factory.vaultBeneficiary(vault), beneficiary);
        assertEq(factory.userVaultCount(beneficiary), 1);
        assertEq(factory.userVaults(beneficiary, 0), vault);
        assertEq(factory.totalVaults(), 1);
        assertEq(factory.totalFeesCollected(), platformFee);
        
        // Verify vault functionality
        ChildVault vaultContract = ChildVault(payable(vault));
        assertEq(vaultContract.beneficiary(), beneficiary);
        assertEq(vaultContract.unlockTime(), unlockTime);
        assertTrue(vaultContract.allowedTokens(address(token1)));
        assertTrue(vaultContract.allowedTokens(address(token2)));
    }
    
    function testCreateVaultForSelf() public {
        vm.deal(address(this), 1 ether);
        
        address vault = factory.createVault{value: platformFee}(
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        assertTrue(factory.isVaultRegistered(vault));
        assertEq(factory.vaultBeneficiary(vault), address(this));
        assertEq(factory.userVaultCount(address(this)), 1);
    }
    
    function testCannotCreateVaultWithInsufficientFee() public {
        vm.deal(address(this), platformFee - 1);
        
        vm.expectRevert(abi.encodeWithSelector(
            VaultFactory.InsufficientPayment.selector,
            platformFee - 1,
            platformFee
        ));
        
        factory.createVaultFor{value: platformFee - 1}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
    }
    
    function testCreateVaultRefundsExcess() public {
        uint256 overpayment = platformFee + 0.5 ether;
        vm.deal(address(this), overpayment);
        
        uint256 balanceBefore = address(this).balance;
        
        factory.createVaultFor{value: overpayment}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        // Should refund the excess
        assertEq(address(this).balance, balanceBefore - platformFee);
        assertEq(address(factory).balance, platformFee);
    }
    
    function testCannotCreateVaultWithPastUnlockTime() public {
        vm.deal(address(this), 1 ether);
        
        vm.expectRevert();
        factory.createVaultFor{value: platformFee}(
            beneficiary,
            block.timestamp, // Past time
            allowedTokens,
            guardians,
            guardianThreshold
        );
    }
    
    function testCannotCreateVaultWithZeroBeneficiary() public {
        vm.deal(address(this), 1 ether);
        
        vm.expectRevert(abi.encodeWithSelector(
            VaultFactory.InvalidAddress.selector,
            address(0)
        ));
        
        factory.createVaultFor{value: platformFee}(
            address(0),
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
    }
    
    function testCannotCreateVaultWithTooManyGuardians() public {
        vm.deal(address(this), 1 ether);
        
        // Create array with too many guardians
        address[] memory tooManyGuardians = new address[](11); // MAX_GUARDIANS is 10
        for (uint256 i = 0; i < 11; i++) {
            tooManyGuardians[i] = makeAddr(string(abi.encodePacked("guardian", i)));
        }
        
        vm.expectRevert(abi.encodeWithSelector(
            VaultFactory.TooManyGuardians.selector,
            11,
            10
        ));
        
        factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            tooManyGuardians,
            5
        );
    }
    
    function testCannotCreateVaultWithInvalidGuardianThreshold() public {
        vm.deal(address(this), 1 ether);
        
        // Threshold greater than guardian count
        vm.expectRevert(abi.encodeWithSelector(
            VaultFactory.InvalidGuardianThreshold.selector,
            3,
            2
        ));
        
        factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            3 // Only 2 guardians but threshold is 3
        );
        
        // Zero threshold
        vm.expectRevert(abi.encodeWithSelector(
            VaultFactory.InvalidGuardianThreshold.selector,
            0,
            2
        ));
        
        factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            0
        );
    }
    
    function testCannotCreateVaultWithDuplicateGuardians() public {
        vm.deal(address(this), 1 ether);
        
        address[] memory duplicateGuardians = new address[](2);
        duplicateGuardians[0] = guardian1;
        duplicateGuardians[1] = guardian1; // Duplicate
        
        vm.expectRevert(abi.encodeWithSelector(
            VaultFactory.DuplicateGuardian.selector,
            guardian1
        ));
        
        factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            duplicateGuardians,
            2
        );
    }

    /*//////////////////////////////////////////////////////////////
                           ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testSetPlatformFee() public {
        uint256 newFee = 0.02 ether;
        
        vm.startPrank(owner);
        
        vm.expectEmit(true, true, false, false);
        emit PlatformFeeUpdated(platformFee, newFee);
        
        factory.setPlatformFee(newFee);
        
        assertEq(factory.platformFee(), newFee);
        vm.stopPrank();
    }
    
    function testOnlyOwnerCanSetPlatformFee() public {
        vm.startPrank(attacker);
        vm.expectRevert("Ownable: caller is not the owner");
        factory.setPlatformFee(0.02 ether);
        vm.stopPrank();
    }
    
    function testSetImplementation() public {
        ChildVault newImpl = new ChildVault(address(factory), block.timestamp + 1 days);
        address oldImpl = factory.vaultImplementation();
        
        vm.startPrank(owner);
        
        vm.expectEmit(true, true, false, false);
        emit ImplementationUpdated(oldImpl, address(newImpl));
        
        factory.setImplementation(address(newImpl));
        
        assertEq(factory.vaultImplementation(), address(newImpl));
        vm.stopPrank();
    }
    
    function testCannotSetZeroImplementation() public {
        vm.startPrank(owner);
        
        vm.expectRevert(abi.encodeWithSelector(
            VaultFactory.InvalidAddress.selector,
            address(0)
        ));
        
        factory.setImplementation(address(0));
        vm.stopPrank();
    }
    
    function testWithdrawFees() public {
        // Create vault to generate fees
        vm.deal(address(this), 1 ether);
        factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        address feeRecipient = makeAddr("feeRecipient");
        uint256 balanceBefore = feeRecipient.balance;
        
        vm.startPrank(owner);
        
        vm.expectEmit(true, false, false, true);
        emit FeesWithdrawn(feeRecipient, platformFee);
        
        factory.withdrawFees(feeRecipient);
        
        assertEq(feeRecipient.balance, balanceBefore + platformFee);
        assertEq(address(factory).balance, 0);
        vm.stopPrank();
    }
    
    function testPauseAndUnpause() public {
        vm.startPrank(owner);
        
        factory.pause();
        assertTrue(factory.paused());
        
        // Should not be able to create vaults when paused
        vm.deal(address(this), 1 ether);
        vm.expectRevert("Pausable: paused");
        factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        factory.unpause();
        assertFalse(factory.paused());
        
        // Should work again after unpause
        factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testGetUserVaults() public {
        vm.deal(address(this), 1 ether);
        
        // Create multiple vaults for beneficiary
        address vault1 = factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        vm.deal(address(this), 1 ether);
        address vault2 = factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime + 1 days,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        address[] memory userVaults = factory.getUserVaults(beneficiary);
        assertEq(userVaults.length, 2);
        assertEq(userVaults[0], vault1);
        assertEq(userVaults[1], vault2);
    }
    
    function testGetAllVaults() public {
        vm.deal(address(this), 2 ether);
        
        address vault1 = factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        address vault2 = factory.createVaultFor{value: platformFee}(
            makeAddr("beneficiary2"),
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        // Test pagination
        address[] memory allVaults = factory.getAllVaults(0, 10);
        assertEq(allVaults.length, 2);
        assertEq(allVaults[0], vault1);
        assertEq(allVaults[1], vault2);
        
        // Test pagination with offset
        address[] memory pagedVaults = factory.getAllVaults(1, 10);
        assertEq(pagedVaults.length, 1);
        assertEq(pagedVaults[0], vault2);
    }
    
    function testEstimateVaultCreationGas() public {
        uint256 gasEstimate = factory.estimateVaultCreationGas();
        assertGt(gasEstimate, 0);
        assertEq(gasEstimate, 250000); // Expected estimate
    }
    
    function testCalculateVaultCreationCost() public {
        uint256 gasPrice = 20 gwei;
        uint256 totalCost = factory.calculateVaultCreationCost(gasPrice);
        uint256 expectedCost = platformFee + (250000 * gasPrice);
        assertEq(totalCost, expectedCost);
    }
    
    function testGetFactoryStats() public {
        vm.deal(address(this), 2 ether);
        
        // Create some vaults
        factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        factory.createVaultFor{value: platformFee}(
            makeAddr("beneficiary2"),
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        (
            uint256 totalVaultsCreated,
            uint256 totalFeesCollectedAmount,
            uint256 currentPlatformFee,
            uint256 supportedTokenCount
        ) = factory.getFactoryStats();
        
        assertEq(totalVaultsCreated, 2);
        assertEq(totalFeesCollectedAmount, platformFee * 2);
        assertEq(currentPlatformFee, platformFee);
        assertEq(supportedTokenCount, 0); // No supported tokens set yet
    }

    /*//////////////////////////////////////////////////////////////
                       SUPPORTED TOKENS TESTS
    //////////////////////////////////////////////////////////////*/

    function testSetSupportedTokens() public {
        address[] memory tokens = new address[](2);
        tokens[0] = address(token1);
        tokens[1] = address(token2);
        
        bool[] memory supported = new bool[](2);
        supported[0] = true;
        supported[1] = true;
        
        vm.startPrank(owner);
        factory.setSupportedTokens(tokens, supported);
        
        assertTrue(factory.supportedTokens(address(token1)));
        assertTrue(factory.supportedTokens(address(token2)));
        
        address[] memory supportedTokensList = factory.getSupportedTokens();
        assertEq(supportedTokensList.length, 2);
        vm.stopPrank();
    }
    
    function testRemoveSupportedTokens() public {
        // First add tokens
        address[] memory tokens = new address[](2);
        tokens[0] = address(token1);
        tokens[1] = address(token2);
        
        bool[] memory supported = new bool[](2);
        supported[0] = true;
        supported[1] = true;
        
        vm.startPrank(owner);
        factory.setSupportedTokens(tokens, supported);
        
        // Now remove one
        address[] memory removeTokens = new address[](1);
        removeTokens[0] = address(token1);
        
        bool[] memory removeSupported = new bool[](1);
        removeSupported[0] = false;
        
        factory.setSupportedTokens(removeTokens, removeSupported);
        
        assertFalse(factory.supportedTokens(address(token1)));
        assertTrue(factory.supportedTokens(address(token2)));
        
        address[] memory supportedTokensList = factory.getSupportedTokens();
        assertEq(supportedTokensList.length, 1);
        assertEq(supportedTokensList[0], address(token2));
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                         EMERGENCY FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testEmergencyPauseVault() public {
        vm.deal(address(this), 1 ether);
        
        address vault = factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        vm.startPrank(owner);
        factory.emergencyPauseVault(vault);
        
        // Verify vault is paused
        ChildVault vaultContract = ChildVault(payable(vault));
        assertTrue(vaultContract.paused());
        
        factory.emergencyUnpauseVault(vault);
        assertFalse(vaultContract.paused());
        vm.stopPrank();
    }
    
    function testCannotEmergencyPauseUnregisteredVault() public {
        address fakeVault = makeAddr("fakeVault");
        
        vm.startPrank(owner);
        vm.expectRevert(abi.encodeWithSelector(
            VaultFactory.InvalidAddress.selector,
            fakeVault
        ));
        factory.emergencyPauseVault(fakeVault);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                             FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_CreateVaultWithDifferentFees(uint256 fee) public {
        fee = bound(fee, 0, 10 ether);
        
        vm.startPrank(owner);
        factory.setPlatformFee(fee);
        vm.stopPrank();
        
        vm.deal(address(this), fee + 1 ether);
        
        address vault = factory.createVaultFor{value: fee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        assertTrue(factory.isVaultRegistered(vault));
        assertEq(factory.totalFeesCollected(), fee);
    }
    
    function testFuzz_CreateMultipleVaults(uint8 vaultCount) public {
        vaultCount = uint8(bound(vaultCount, 1, 20));
        
        vm.deal(address(this), uint256(vaultCount) * platformFee);
        
        for (uint256 i = 0; i < vaultCount; i++) {
            address beneficiaryI = makeAddr(string(abi.encodePacked("beneficiary", i)));
            
            address vault = factory.createVaultFor{value: platformFee}(
                beneficiaryI,
                unlockTime + i * 1 days,
                allowedTokens,
                guardians,
                guardianThreshold
            );
            
            assertTrue(factory.isVaultRegistered(vault));
        }
        
        assertEq(factory.totalVaults(), vaultCount);
        assertEq(factory.totalFeesCollected(), uint256(vaultCount) * platformFee);
    }

    /*//////////////////////////////////////////////////////////////
                          INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testFullVaultCreationAndUsage() public {
        vm.deal(address(this), 2 ether);
        
        // 1. Create vault
        address vault = factory.createVaultFor{value: platformFee}(
            beneficiary,
            unlockTime,
            allowedTokens,
            guardians,
            guardianThreshold
        );
        
        // 2. Deposit into vault
        uint256 depositAmount = 1 ether;
        ChildVault vaultContract = ChildVault(payable(vault));
        vaultContract.depositEth{value: depositAmount}();
        
        // 3. Verify vault state
        assertEq(vaultContract.getEthBalance(), depositAmount);
        assertEq(vaultContract.beneficiary(), beneficiary);
        assertTrue(factory.isVaultRegistered(vault));
        
        // 4. Wait for unlock and withdraw
        vm.warp(unlockTime + 1);
        
        vm.startPrank(beneficiary);
        uint256 balanceBefore = beneficiary.balance;
        vaultContract.withdrawEth();
        assertEq(beneficiary.balance, balanceBefore + depositAmount);
        vm.stopPrank();
    }
    
    receive() external payable {}
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