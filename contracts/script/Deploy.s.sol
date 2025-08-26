// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/VaultFactory.sol";

/**
 * @title DeployScript
 * @notice Deployment script for CreatorHub.Brave contracts
 * @dev Deploys VaultFactory and GiftRegistry with proper configuration
 */
contract DeployScript is Script {
    // Deployment configuration
    uint256 public constant PLATFORM_FEE = 0.01 ether; // 0.01 ETH platform fee
    
    // Contract addresses (will be set during deployment)
    VaultFactory public vaultFactory;
    
    function run() external {
        // Get deployment private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        require(deployer.balance >= 0.1 ether, "Insufficient ETH for deployment");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy VaultFactory
        console.log("Deploying VaultFactory...");
        vaultFactory = new VaultFactory(deployer, PLATFORM_FEE);
        console.log("VaultFactory deployed at:", address(vaultFactory));
        
        // Verify deployment
        require(vaultFactory.owner() == deployer, "VaultFactory owner mismatch");
        require(vaultFactory.platformFee() == PLATFORM_FEE, "Platform fee mismatch");
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network:", getChainName(block.chainid));
        console.log("Deployer:", deployer);
        console.log("VaultFactory:", address(vaultFactory));
        console.log("Platform Fee:", PLATFORM_FEE);
        console.log("Vault Implementation:", vaultFactory.vaultImplementation());
        
        // Save deployment addresses to file
        string memory deploymentInfo = string(abi.encodePacked(
            "VaultFactory=", vm.toString(address(vaultFactory)), "\n",
            "VaultImplementation=", vm.toString(vaultFactory.vaultImplementation()), "\n",
            "PlatformFee=", vm.toString(PLATFORM_FEE), "\n",
            "ChainId=", vm.toString(block.chainid), "\n",
            "Deployer=", vm.toString(deployer)
        ));
        
        vm.writeFile("./deployment.env", deploymentInfo);
        console.log("\nDeployment addresses saved to deployment.env");
    }
    
    function getChainName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 1) return "Ethereum Mainnet";
        if (chainId == 11155111) return "Sepolia";
        if (chainId == 42161) return "Arbitrum One";
        if (chainId == 421614) return "Arbitrum Sepolia";
        if (chainId == 10) return "Optimism";
        if (chainId == 11155420) return "Optimism Sepolia";
        if (chainId == 137) return "Polygon";
        if (chainId == 80001) return "Mumbai";
        if (chainId == 31337) return "Anvil Local";
        return "Unknown";
    }
}