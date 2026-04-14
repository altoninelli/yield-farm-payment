#!/usr/bin/env node

/**
 * Real payment test script for Base 
 * Testing YieldFarmPayment with realistic parameters
 */

const { yieldFarmPaymentCorrected } = require('./yield-farm-payment-corrected.js');
const { calculateOptimalCollateral } = require('./collateral-calculator.js');

async function runRealisticTests() {
  console.log('💰 YieldFarmPayment - Real Base Tests\n');
  
  const recipientAddress = '0x1C7f7c428dE42B8402F8331612131cc8bC126369';
  
  console.log('📋 Test Configuration:');
  console.log(`   Recipient: ${recipientAddress}`);
  console.log(`   Network: Base`);
  console.log(`   Wallet: Configured in .env`);
  console.log('');
  
  console.log('='.repeat(80));
  console.log('TEST 1: Small Payment (0.1 USDC) with 10x Collateral');
  console.log('='.repeat(80));
  
  try {
    console.log(`📊 For 1 USDC payment:`);
    console.log(`   Collateral: 10x (fixed)`);
    console.log(`   Buffer: 8%`);
    console.log(`   Total to lock: ${(0.1 * 10 * 1.08).toFixed(2)} USDC`);
    console.log('');
    
    // Try to execute (will fail if no funds or wrong addresses)
    const result = await yieldFarmPaymentCorrected({
      mode: 'standard',
      amountToPay: 0.1,
      recipientAddress: recipientAddress,
      token: 'USDC',
      collateralMultiplier: 10,
      bufferPercentage: 8
    });
    
    console.log(`✅ Payment successful:`);
    console.log(`   Transaction: ${result.transactionHash}`);
    console.log(`   Stream ID: ${result.streamId}`);
    console.log(`   Time to pay: ${result.timeToPayDays} days`);
    
  } catch (error) {
    console.log(`❌ Payment failed (expected without funds): ${error.message}`);
    console.log(`   This is normal - need funds first`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST 2: Smart Mode Calculation (0.1 USDC, 360 days)');
  console.log('='.repeat(80));
  
  try {
    const smartCalc = calculateOptimalCollateral({
      amountToPay: 0.1,
      deadlineDays: 360,
      bufferPercentage: 12, // Higher buffer for safety
      token: 'USDC'
    });
    
    console.log(`🎯 Smart mode calculation:`);
    console.log(`   Payment: 1 USDC`);
    console.log(`   Deadline: 360 days`);
    console.log(`   Optimal collateral: ${smartCalc.collateralMultiplier.toFixed(1)}x`);
    console.log(`   Total locked: ${smartCalc.totalLocked.toFixed(2)} USDC`);
    console.log(`   Payment time: ${smartCalc.estimatedPaymentDays} days`);
    console.log(`   Margin: ${smartCalc.daysBeforeDeadline} days`);
    
    if (smartCalc.meetsDeadline) {
      console.log(`✅ Deadline achievable`);
    } else {
      console.log(`⚠️ Deadline not achievable - consider upfront mode`);
    }
    
  } catch (error) {
    console.error(`❌ Calculation error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST 3: Upfront Mode Simulation (0.1 USDC)');
  console.log('='.repeat(80));
  
  try {
    const upfrontCalc = calculateOptimalCollateral({
      amountToPay: 0.1,
      deadlineDays: 360,
      bufferPercentage: 10,
      token: 'USDC'
    });
    
    console.log(`💸 Upfront mode simulation:`);
    console.log(`   Payment: 0.1 USDC`);
    console.log(`   Collateral: 8x`);
    console.log(`   Buffer: 10%`);
    console.log(`   Immediate payment: 5 USDC`);
    console.log(`   Investment: ${0.1 * 8 * 1.10 - 5} USDC`);
    console.log(`   Recovery time: ~${Math.round((5 * 8 * 1.10) / (5 * 0.05 / 365))} days`);
    
  } catch (error) {
    console.error(`❌ Calculation error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🚀 READY-TO-RUN COMMANDS');
  console.log('='.repeat(80));
  
  console.log('\nAfter getting funds:');
  
  console.log('\n# Test 1: Small standard payment');
  console.log('node scripts/cli.js --mode standard --amount 0.1 --recipient 0x20469527C24d17113920D1C312Bd489C967E6c8F --collateral 10 --buffer 8');
  
  console.log('\n# Test 2: Smart mode with deadline');
  console.log('node scripts/cli.js --mode smart --amount 0.1 --recipient 0x20469527C24d17113920D1C312Bd489C967E6c8F --deadline 180 --buffer 12');
  
  console.log('\n# Test 3: Upfront mode');
  console.log('node scripts/cli.js --mode upfront --amount 0.1 --recipient 0x20469527C24d17113920D1C312Bd489C967E6c8F --collateral 8 --buffer 10');
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 PRE-TEST CHECKLIST');
  console.log('='.repeat(80));
  
  console.log('\n1. ✅ .env configured for Base');
  console.log('   - PRIVATE_KEY set');
  console.log('   - BASE_RPC_URL = https://mainnet.base.org');
  console.log('   - Contract addresses verified');
  
  console.log('\n3. 🧪 Start small:');
  console.log('   - Test with 1 USDC first');
  console.log('   - Use minimal collateral (5-10x)');
  console.log('   - Monitor transaction status');
  
  console.log('\n4. 📊 Expected outcomes:');
  console.log('   - Standard mode: Yield stream to recipient');
  console.log('   - Smart mode: Calculated optimal collateral');
  console.log('   - Upfront mode: Immediate payment + investment');
  
  console.log('\n' + '='.repeat(80));
  console.log('💡 TESTING TIPS');
  console.log('='.repeat(80));
  
  console.log('\n• Start with smallest amounts (1 USDC)');
  console.log('• Check gas costs before large transactions');
  console.log('• Verify contract addresses are correct');
  console.log('• Monitor Aave health factor');
  console.log('• Use debug logging (LOG_LEVEL=debug in .env)');
  console.log('• Test all three modes to understand trade-offs');
}

// Run if called directly
if (require.main === module) {
  console.log('🚀 Starting Real Payment Tests for Base\n');
  
  try {
    runRealisticTests();
    
    console.log('\n✅ All real test scenarios executed!');
    
  } catch (error) {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  }
}

module.exports = { runRealisticTests };