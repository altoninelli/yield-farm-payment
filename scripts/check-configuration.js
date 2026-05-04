#!/usr/bin/env node

/**
 * Configuration check script for YieldFarmPayment v2.0
 * Updated for WalletConnect v2.0 + HTML fallback
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

function checkConfiguration() {
  console.log('🔧 YieldFarmPayment v2.0 - Configuration Check\n');
  
  console.log('='.repeat(80));
  console.log('📋 REQUIRED CONFIGURATION');
  console.log('='.repeat(80));
  
  // Required variables for WalletConnect
  const required = [
    'WALLETCONNECT_PROJECT_ID',
    'BASE_RPC_URL',
    'USDC_ADDRESS',
    'AAVE_V3_POOL_ADDRESS'
  ];
  
  let allValid = true;
  
  required.forEach(key => {
    const value = process.env[key];
    
    if (!value || value.trim() === '' || value.includes('your_project_id_here')) {
      console.log(`❌ ${key}: NOT SET or placeholder`);
      allValid = false;
    } else if (value === '0x...' || value === '0x0000000000000000000000000000000000000000') {
      console.log(`❌ ${key}: PLACEHOLDER value`);
      allValid = false;
    } else {
      // Hide long values for security
      if (key === 'WALLETCONNECT_PROJECT_ID') {
        console.log(`✅ ${key}: ${value.length > 20 ? value.substring(0, 10) + '...' + value.substring(value.length - 10) : value}`);
      } else {
        console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
      }
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('🌐 NETWORK CHECK');
  console.log('='.repeat(80));
  
  const rpcUrl = process.env.BASE_RPC_URL;
  if (rpcUrl && rpcUrl.includes('mainnet.base.org')) {
    console.log(`✅ Using Base Mainnet: ${rpcUrl}`);
    console.log('   • Real USDC required');
    console.log('   • Real transactions');
  } else if (rpcUrl && (rpcUrl.includes('sepolia') || rpcUrl.includes('testnet'))) {
    console.log(`⚠️ Using TESTNET: ${rpcUrl}`);
    console.log('   • Testnet funds only');
    console.log('   • For development/testing');
  } else {
    console.log(`❓ Unknown RPC: ${rpcUrl}`);
    console.log('   Should be Base Mainnet for production');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('⚙️ OPTIONAL SETTINGS');
  console.log('='.repeat(80));
  
  const settings = [
    'DEFAULT_COLLATERAL_MULTIPLIER',
    'DEFAULT_BUFFER_PERCENTAGE', 
    'MIN_COLLATERAL_MULTIPLIER',
    'MAX_COLLATERAL_MULTIPLIER',
    'ESTIMATED_APY'
  ];
  
  settings.forEach(key => {
    const value = process.env[key];
    if (value !== undefined) {
      console.log(`✅ ${key}: ${value}`);
    } else {
      console.log(`🔧 ${key}: Using default value`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('🚀 EXECUTION MODES AVAILABLE');
  console.log('='.repeat(80));
  
  console.log('\n📱 WalletConnect v2.0 Mode:');
  console.log('   node scripts/cli-wc2.js --walletconnect --amount 0.1 --recipient 0x...');
  console.log('   • QR code in terminal');
  console.log('   • Direct wallet connection');
  console.log('   • Recommended for experts');
  
  console.log('\n🌐 HTML Wallet Mode:');
  console.log('   node scripts/cli-final.js --html-wallet --amount 0.1 --recipient 0x...');
  console.log('   • Browser-based UI');
  console.log('   • Web3Modal integration');
  console.log('   • User-friendly');
  
  console.log('\n📄 Manual Mode:');
  console.log('   node scripts/cli-wc2.js --manual --amount 0.1 --recipient 0x...');
  console.log('   • Save transactions as JSON');
  console.log('   • Execute with Revoke.cash');
  console.log('   • For advanced users');
  
  console.log('\n🧪 Dry-run Mode:');
  console.log('   Add --dry-run flag to any command');
  console.log('   • Calculate without executing');
  console.log('   • Test configuration');
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 QUICK START RECOMMENDATIONS');
  console.log('='.repeat(80));
  
  if (allValid) {
    console.log('\n✅ Configuration appears valid!');
    
    console.log('\nRecommended first test (dry-run):');
    console.log('node scripts/cli-wc2.js --dry-run --amount 0.01 --recipient 0x20469527C24d17113920D1C312Bd489C967E6c8F');
    
    console.log('\nThen try WalletConnect:');
    console.log('node scripts/cli-wc2.js --walletconnect --amount 0.01 --recipient 0x20469527C24d17113920D1C312Bd489C967E6c8F');
    
  } else {
    console.log('\n❌ Configuration incomplete!');
    
    console.log('\nMissing/placeholder values detected:');
    console.log('1. Get FREE WalletConnect Project ID:');
    console.log('   https://cloud.walletconnect.com/');
    console.log('2. Update Base Mainnet addresses in .env:');
    console.log('   USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
    console.log('   Aave V3 Pool: 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5');
    console.log('3. Set Base RPC URL:');
    console.log('   https://mainnet.base.org (or use public RPC)');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🔧 UTILITY SCRIPTS');
  console.log('='.repeat(80));
  
  console.log('\n📊 Collateral calculator:');
  console.log('node scripts/collateral-calculator.js --amount 0.1 --deadline 90');
  
  console.log('\n🧪 End-to-end test:');
  console.log('node scripts/test-realistic-payment.js');
  
  console.log('\n💡 Tips:');
  console.log('• Start with --dry-run to test calculations');
  console.log('• Use small amounts for first real test (0.01 USDC)');
  console.log('• WalletConnect QR code works with mobile wallets');
  console.log('• HTML mode requires browser access');
  
  return allValid;
}

// Run if called directly
if (require.main === module) {
  console.log('🔍 Checking YieldFarmPayment v2.0 Configuration\n');
  
  try {
    const isValid = checkConfiguration();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    
    if (isValid) {
      console.log('\n✅ Ready for production!');
      console.log('\nNext steps:');
      console.log('1. Test with --dry-run flag');
      console.log('2. Try WalletConnect with small amount');
      console.log('3. Share skill on ClawHub');
    } else {
      console.log('\n❌ Configuration needs updates');
      console.log('\nUpdate .env file with:');
      console.log('• WalletConnect Project ID (free)');
      console.log('• Base Mainnet addresses');
      console.log('• Remove placeholder values');
    }
    
  } catch (error) {
    console.error('\n❌ Check error:', error);
    process.exit(1);
  }
}

module.exports = { checkConfiguration };