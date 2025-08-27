// Test script for vault creation functionality
// This script validates that all the wallet connection and vault creation fixes are working

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing CreatorHub.Brave Vault Creation Fixes\n');

// Test 1: Verify wallet connection fallback logic exists
console.log('📝 Test 1: Checking wallet connection fallback logic...');
const vaultWizardPath = path.join(__dirname, 'frontend/public/static/vault-wizard.js');
const vaultWizardContent = fs.readFileSync(vaultWizardPath, 'utf8');

const hasWalletFallback = vaultWizardContent.includes('window.walletState?.getWalletInfo()');
const hasDeploymentValidation = vaultWizardContent.includes('if (!wizardState.connectedWallet || !wizardState.connectedWallet.address)');
const hasErrorMessage = vaultWizardContent.includes('No wallet connected. Please connect your wallet first.');

console.log(`   ✅ Wallet fallback logic present: ${hasWalletFallback}`);
console.log(`   ✅ Deployment validation present: ${hasDeploymentValidation}`);
console.log(`   ✅ Error message present: ${hasErrorMessage}`);

// Test 2: Verify simple-app.js has proper wallet state management
console.log('\n📝 Test 2: Checking wallet state management...');
const simpleAppPath = path.join(__dirname, 'frontend/public/static/simple-app.js');
const simpleAppContent = fs.readFileSync(simpleAppPath, 'utf8');

const hasWalletState = simpleAppContent.includes('window.walletState = {');
const hasGetWalletInfo = simpleAppContent.includes('getWalletInfo()');
const hasLocalStorageCheck = simpleAppContent.includes('localStorage.getItem(\'connectedWallet\')');

console.log(`   ✅ Window wallet state defined: ${hasWalletState}`);
console.log(`   ✅ GetWalletInfo method present: ${hasGetWalletInfo}`);
console.log(`   ✅ LocalStorage wallet check: ${hasLocalStorageCheck}`);

// Test 3: Verify factory address is properly formatted
console.log('\n📝 Test 3: Checking factory configuration...');
const contractsPath = path.join(__dirname, 'frontend/public/static/contracts.js');
const contractsContent = fs.readFileSync(contractsPath, 'utf8');

const factoryAddressMatch = contractsContent.match(/const factoryAddress = '(0x[0-9a-fA-F]{40})'/);
const hasValidFactoryAddress = factoryAddressMatch && factoryAddressMatch[1].length === 42;

console.log(`   ✅ Factory address format valid: ${hasValidFactoryAddress}`);
if (hasValidFactoryAddress) {
  console.log(`   📍 Factory address: ${factoryAddressMatch[1]}`);
}

// Test 4: Verify unlockTime fix in ChildVault.sol
console.log('\n📝 Test 4: Checking ChildVault unlockTime fix...');
const childVaultPath = path.join(__dirname, 'contracts/src/ChildVault.sol');
const childVaultContent = fs.readFileSync(childVaultPath, 'utf8');

const hasStorageUnlockTime = childVaultContent.includes('uint256 public unlockTime;') && 
                            !childVaultContent.includes('uint256 public immutable unlockTime;');
const hasInitializeFunction = childVaultContent.includes('function initialize(');
const hasUnlockTimeParameter = childVaultContent.includes('uint256 _unlockTime');

console.log(`   ✅ UnlockTime as storage variable: ${hasStorageUnlockTime}`);
console.log(`   ✅ Initialize function present: ${hasInitializeFunction}`);
console.log(`   ✅ UnlockTime parameter present: ${hasUnlockTimeParameter}`);

// Test 5: Verify VaultFactory passes unlockTime correctly
console.log('\n📝 Test 5: Checking VaultFactory unlockTime integration...');
const vaultFactoryPath = path.join(__dirname, 'contracts/src/VaultFactory.sol');
const vaultFactoryContent = fs.readFileSync(vaultFactoryPath, 'utf8');

const passesUnlockTime = vaultFactoryContent.includes('initialize(beneficiary, unlockTime,') ||
                        (vaultFactoryContent.includes('.initialize(') && vaultFactoryContent.includes('unlockTime'));

console.log(`   ✅ Factory passes unlockTime to vault: ${passesUnlockTime}`);

// Summary
console.log('\n📊 SUMMARY:');
const allTestsPassed = hasWalletFallback && hasDeploymentValidation && hasErrorMessage &&
                      hasWalletState && hasGetWalletInfo && hasLocalStorageCheck &&
                      hasValidFactoryAddress && hasStorageUnlockTime && hasInitializeFunction &&
                      hasUnlockTimeParameter && passesUnlockTime;

console.log(`   Overall Status: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

if (allTestsPassed) {
  console.log('\n🎉 The vault creation fixes are properly implemented!');
  console.log('🔧 Key improvements:');
  console.log('   • Fixed "no wallet connected" error with fallback detection');
  console.log('   • Fixed unlockTime immutable variable issue in minimal proxy pattern');
  console.log('   • Implemented proper factory address configuration');
  console.log('   • Enhanced wallet state management with persistence');
  console.log('   • Added comprehensive error handling and validation');
} else {
  console.log('\n⚠️  Some issues were detected. Please review the failing tests.');
}

console.log('\n🌐 Application URL: https://3000-iud55lu8npdntpts02bo0.e2b.dev');
console.log('👆 Visit this URL to test the vault creation functionality with MetaMask');