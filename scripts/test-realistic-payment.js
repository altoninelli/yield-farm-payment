#!/usr/bin/env node

/**
 * Realistic payment test script for YieldFarmPayment v2.0
 * Testing WalletConnect v2.0 and HTML fallback modes
 * 
 * This script demonstrates both execution modes:
 * 1. WalletConnect v2.0 (QR code in terminal)
 * 2. HTML Wallet mode (browser-based)
 * 
 * IMPORTANT: For testing only - use small amounts!
 */

const { yieldFarmPaymentWC2 } = require('./yield-farm-payment-wc2.js');
const { yieldFarmPayment } = require('./yield-farm-payment-final.js');

// Test address (use a real address for actual testing)
const TEST_RECIPIENT = '0x20469527C24d17113920D1C312Bd489C967E6c8F';
const FIXED_FEE_USDC = 0.2;
const DEFAULT_APY = 0.03;

function calculatePaymentMetrics(amount, collateralMultiplier, bufferPercentage, apy = DEFAULT_APY) {
  const totalLocked = amount * collateralMultiplier * (1 + bufferPercentage / 100);
  const fee = FIXED_FEE_USDC;
  const payment = amount;
  const aaveDeposit = Math.max(0, totalLocked - payment - fee);
  const annualYield = aaveDeposit * apy;
  const dailyYield = annualYield / 365;
  const recoveryDays = dailyYield > 0 ? Math.ceil(payment / dailyYield) : Infinity;

  return {
    amount,
    collateralMultiplier,
    bufferPercentage,
    fee,
    totalLocked,
    payment,
    aaveDeposit,
    annualYield,
    dailyYield,
    recoveryDays
  };
}

function printPaymentMetrics(metrics) {
  console.log(`   Amount to pay: ${metrics.amount.toFixed(4)} USDC`);
  console.log(`   Collateral multiplier: ${metrics.collateralMultiplier}x`);
  console.log(`   Buffer percentage: ${metrics.bufferPercentage}%`);
  console.log(`   Developer fee: ${metrics.fee.toFixed(4)} USDC`);
  console.log(`   Total locked: ${metrics.totalLocked.toFixed(6)} USDC`);
  console.log(`   Payment to recipient: ${metrics.payment.toFixed(6)} USDC`);
  console.log(`   Aave deposit: ${metrics.aaveDeposit.toFixed(6)} USDC`);
  console.log(`   Estimated annual yield: ${metrics.annualYield.toFixed(6)} USDC/year`);
  console.log(`   Estimated daily yield: ${metrics.dailyYield.toFixed(8)} USDC/day`);
  console.log(`   Estimated recovery time: ~${metrics.recoveryDays} days`);
}

async function testWalletConnectMode(amount, collateralMultiplier, bufferPercentage) {
  console.log('='.repeat(80));
  console.log(`📱 WALLETCONNECT v2.0 TEST: ${amount} USDC, ${collateralMultiplier}x, ${bufferPercentage}%`);
  console.log('='.repeat(80));
  
  const metrics = calculatePaymentMetrics(amount, collateralMultiplier, bufferPercentage);
  printPaymentMetrics(metrics);
  console.log('');
  
  console.log('🚀 Execution flow:');
  console.log('1. Terminal shows QR code');
  console.log('2. Scan with mobile wallet (or click link)');
  console.log('3. Approve connection in wallet');
  console.log('4. Sign 3 transactions in wallet popups:');
  console.log('   • 0.2 USDC fee → Developer');
  console.log('   • Payment → Recipient');
  console.log('   • Collateral → Aave V3');
  console.log('');
  
  if (!process.env.WALLETCONNECT_PROJECT_ID) {
    console.log('⚠️ Skipping live test: WALLETCONNECT_PROJECT_ID not configured');
    console.log('   Get free project ID: https://cloud.walletconnect.com/');
    return;
  }
  
  try {
    console.log('🔗 Testing preparation (stopping before QR code)...');
    
    // Dry-run only - not actually connecting
    const result = await yieldFarmPaymentWC2({
      amountToPay: amount,
      recipientAddress: TEST_RECIPIENT,
      useWalletConnect: true,
      collateralMultiplier,
      bufferPercentage,
      dryRun: true  // Stop before QR code
    });
    
    if (result.success) {
      console.log('✅ WalletConnect preparation successful!');
      console.log(`   Ready to show QR code for connection`);
      console.log(`   Fee: ${result.summary?.feeAmount || 0.2} USDC`);
      console.log(`   Payment: ${result.summary?.paymentAmount || amount} USDC`);
      console.log(`   Collateral: ${result.summary?.collateralAmount || 'calculated'} USDC`);
    } else {
      console.error('❌ WalletConnect preparation failed:');
      console.error(`   ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error(`   ${error.message}`);
  }
  
  console.log('');
}

async function testHTMLWalletMode(amount, collateralMultiplier, bufferPercentage) {
  console.log('='.repeat(80));
  console.log(`🌐 HTML WALLET TEST: ${amount} USDC, ${collateralMultiplier}x, ${bufferPercentage}%`);
  console.log('='.repeat(80));
  
  const metrics = calculatePaymentMetrics(amount, collateralMultiplier, bufferPercentage);
  printPaymentMetrics(metrics);
  console.log('');
  
  console.log('🚀 Execution flow:');
  console.log('1. CLI generates HTML file');
  console.log('2. Open HTML in browser');
  console.log('3. Click "Connect Wallet with Web3Modal"');
  console.log('4. Connect wallet (MetaMask, Trust, Coinbase, etc.)');
  console.log('5. Click "Sign All Transactions"');
  console.log('6. Approve 3 transactions in wallet popups');
  console.log('');
  
  if (!process.env.WALLETCONNECT_PROJECT_ID) {
    console.log('⚠️ Skipping HTML generation: WALLETCONNECT_PROJECT_ID not configured');
    return;
  }
  
  try {
    console.log('🔗 Testing HTML generation...');
    
    const result = await yieldFarmPayment({
      amountToPay: amount,
      recipientAddress: TEST_RECIPIENT,
      useHtmlWallet: true,
      collateralMultiplier,
      bufferPercentage,
      testMode: true  // Generate HTML but don't show interactive prompt
    });
    
    if (result.success && result.mode === 'html-wallet') {
      console.log('✅ HTML wallet page created successfully!');
      console.log(`   File: ${result.htmlFile}`);
      console.log('   To test: Open this file in browser and connect wallet');
    } else if (result.success) {
      console.log('✅ Payment prepared successfully!');
      console.log(`   Mode: ${result.mode}`);
    } else {
      console.error('❌ HTML preparation failed:');
      console.error(`   ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error(`   ${error.message}`);
  }
  
  console.log('');
}

async function testManualMode(amount, collateralMultiplier, bufferPercentage) {
  console.log('='.repeat(80));
  console.log(`📄 MANUAL MODE TEST: ${amount} USDC, ${collateralMultiplier}x, ${bufferPercentage}%`);
  console.log('='.repeat(80));
  
  const metrics = calculatePaymentMetrics(amount, collateralMultiplier, bufferPercentage);
  printPaymentMetrics(metrics);
  console.log('');
  
  try {
    console.log('💾 Testing manual transaction generation...');
    
    const result = await yieldFarmPaymentWC2({
      amountToPay: amount,
      recipientAddress: TEST_RECIPIENT,
      useWalletConnect: false,  // Manual mode
      collateralMultiplier,
      bufferPercentage
    });
    
    if (result.success && !result.mode?.includes('walletconnect')) {
      console.log('✅ Manual transactions prepared!');
      console.log('   Transactions saved for execution with Revoke.cash');
      console.log('   Execute manually or import to batch tool');
    } else {
      console.error('❌ Manual preparation failed:');
      console.error(`   ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error(`   ${error.message}`);
  }
  
  console.log('');
}

async function runAllTests() {
  console.log('🚀 YieldFarmPayment v2.0 - Realistic Test Suite\n');
  console.log('📋 Test Configuration:');
  console.log(`   Recipient: ${TEST_RECIPIENT}`);
  console.log(`   Fee: ${FIXED_FEE_USDC} USDC (developer fee)`);
  console.log(`   APY: ${DEFAULT_APY * 100}% (estimated)`);
  console.log(`   Network: Base Mainnet`);
  console.log('');
  
  // Test scenarios
  await testWalletConnectMode(0.01, 10, 8);     // Small amount, reasonable collateral
  await testHTMLWalletMode(0.01, 20, 8);        // Higher collateral test
  await testManualMode(0.01, 5, 5);             // Low collateral test
  
  console.log('='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\n✅ Tests completed!');
  
  if (!process.env.WALLETCONNECT_PROJECT_ID) {
    console.log('\n⚠️ Missing WALLETCONNECT_PROJECT_ID');
    console.log('   Get free project ID: https://cloud.walletconnect.com/');
    console.log('   Add to .env: WALLETCONNECT_PROJECT_ID=your_project_id_here');
  }
  
  console.log('\n🔧 Next steps:');
  console.log('1. Update .env with WalletConnect Project ID');
  console.log('2. Run check-configuration: node scripts/check-configuration.js');
  console.log('3. Test dry-run: node scripts/cli-wc2.js --dry-run --amount 0.01 --recipient 0x...');
  console.log('4. Try WalletConnect with small amount');
  console.log('');
  
  console.log('💡 Tips for testing:');
  console.log('• Start with 0.01 USDC amounts');
  console.log('• Use WalletConnect QR code for mobile wallets');
  console.log('• HTML mode works with all browser wallets');
  console.log('• Manual mode saves JSON for Revoke.cash');
  console.log('');
}

if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  });
}

module.exports = {
  testWalletConnectMode,
  testHTMLWalletMode,
  testManualMode,
  runAllTests
};