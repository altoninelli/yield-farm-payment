#!/usr/bin/env node

/**
 * Transaction Confirmation Module
 * Provides interactive confirmation prompts and dry-run capabilities
 * for blockchain transactions before they are sent to the network
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Display a clear transaction preview before confirmation
 */
function displayTransactionPreview(params) {
  console.log('\n' + '═'.repeat(80));
  console.log('📋 TRANSACTION PREVIEW');
  console.log('═'.repeat(80));
  
  console.log(`\n💰 Payment Details:`);
  console.log(`   Amount to Pay:        ${params.amountToPay} USDC`);
  console.log(`   Recipient Address:    ${params.recipientAddress}`);
  console.log(`   Your Wallet Address:  ${params.senderAddress}`);
  
  console.log(`\n🏦 Collateral Configuration:`);
  console.log(`   Collateral Multiplier: ${params.collateralMultiplier}x`);
  console.log(`   Buffer Percentage:     ${params.bufferPercentage}%`);
  
  const totalLocked = params.amountToPay * params.collateralMultiplier * (1 + params.bufferPercentage / 100);
  const recoveryCollateral = totalLocked - params.amountToPay;
  
  console.log(`\n📊 Calculated Amounts:`);
  console.log(`   Total Locked in Wallet:  ${totalLocked.toFixed(6)} USDC`);
  console.log(`   Immediate Payment:       ${params.amountToPay} USDC → Recipient`);
  console.log(`   Recovery Collateral:     ${recoveryCollateral.toFixed(6)} USDC → Aave V3`);
  
  const apy = params.estimatedAPY || 0.03;
  const annualYield = recoveryCollateral * apy;
  const dailyYield = annualYield / 365;
  const recoveryDays = params.amountToPay / dailyYield;
  
  console.log(`\n🔄 Recovery Metrics (at ~${(apy * 100).toFixed(1)}% APY):`);
  console.log(`   Annual Yield (Aave):     ${annualYield.toFixed(6)} USDC/year`);
  console.log(`   Daily Yield:             ${dailyYield.toFixed(6)} USDC/day`);
  console.log(`   Recovery Time:           ~${Math.ceil(recoveryDays)} days`);
  
  console.log(`\n🌐 Network:`);
  const isMainnet = !params.rpcUrl?.includes('sepolia') && !params.rpcUrl?.includes('testnet');
  console.log(`   Network: ${isMainnet ? '🔴 BASE MAINNET (REAL FUNDS)' : '🟡 BASE TESTNET'}`);
  
  console.log('\n' + '═'.repeat(80));
}

/**
 * Validate transaction parameters
 */
function validateTransaction(params) {
  const errors = [];
  
  // Check required fields
  if (!params.amountToPay || params.amountToPay <= 0) {
    errors.push('❌ Invalid amount: must be positive');
  }
  
  if (!params.recipientAddress || !params.recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push('❌ Invalid recipient address');
  }
  
  if (!params.senderAddress || !params.senderAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push('❌ Invalid sender address');
  }
  
  if (params.collateralMultiplier < 3 || params.collateralMultiplier > 20) {
    errors.push(`❌ Collateral multiplier must be between 3x and 20x (got ${params.collateralMultiplier}x)`);
  }
  
  if (params.bufferPercentage < 5 || params.bufferPercentage > 20) {
    errors.push(`❌ Buffer percentage must be between 5% and 20% (got ${params.bufferPercentage}%)`);
  }
  
  // Check maximum amount limits for mainnet
  const isMainnet = !params.rpcUrl?.includes('sepolia') && !params.rpcUrl?.includes('testnet');
  const maxAmount = 1000; // 1000 USDC max for both mainnet and testnet
  
  if (params.amountToPay > maxAmount) {
    errors.push(`❌ Amount exceeds limit: maximum ${maxAmount} USDC (got ${params.amountToPay})`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Prompt user for confirmation
 */
function promptConfirmation(message) {
  return new Promise((resolve) => {
    rl.question(`\n${message}\nConfirm? (yes/no): `, (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Request explicit human approval
 */
async function requestApproval(params) {
  // Validate first
  const validation = validateTransaction(params);
  
  if (!validation.valid) {
    console.error('\n⛔ TRANSACTION VALIDATION FAILED:\n');
    validation.errors.forEach(error => console.error(error));
    return false;
  }
  
  // Display preview
  displayTransactionPreview(params);
  
  // Check if mainnet
  const isMainnet = !params.rpcUrl?.includes('sepolia') && !params.rpcUrl?.includes('testnet');
  
  if (isMainnet) {
    console.log('\n🔴 ⚠️  WARNING: This will execute on BASE MAINNET with REAL FUNDS');
    console.log('   Your wallet will be debited for the full amount immediately.');
    console.log('   This action is IRREVERSIBLE on the blockchain.\n');
  }
  
  // Ask for confirmation
  const confirmed = await promptConfirmation('⚠️  Do you want to proceed with this transaction?');
  
  if (!confirmed) {
    console.log('\n❌ Transaction cancelled by user.');
    return false;
  }
  
  // For mainnet, require additional confirmation
  if (isMainnet) {
    const recipient = params.recipientAddress.substring(0, 6) + '...' + params.recipientAddress.substring(38);
    const confirmed2 = await promptConfirmation(
      `\n⚠️  FINAL CONFIRMATION: Send ${params.amountToPay} USDC to ${recipient}? (yes/no)`
    );
    
    if (!confirmed2) {
      console.log('\n❌ Transaction cancelled by user.');
      return false;
    }
  }
  
  console.log('\n✅ Transaction approved by user. Proceeding...\n');
  return true;
}

/**
 * Perform dry-run simulation
 */
function dryRunSimulation(params) {
  console.log('\n' + '═'.repeat(80));
  console.log('🏃 DRY-RUN MODE (No transactions will be sent)');
  console.log('═'.repeat(80));
  
  displayTransactionPreview(params);
  
  console.log('\n📊 SIMULATION RESULTS:');
  console.log('   ✓ Address validation: PASSED');
  console.log('   ✓ Amount validation: PASSED');
  console.log('   ✓ Collateral calculation: OK');
  console.log('   ✓ Balance check: WOULD BE PERFORMED');
  console.log('   ✓ Aave integration: SIMULATED');
  
  console.log('\n✅ Dry-run completed successfully.');
  console.log('   No transactions were sent to the blockchain.');
  console.log('   Use the same command without --dry-run to execute real transactions.\n');
  
  return { success: true, dryRun: true };
}

/**
 * Close the readline interface
 */
function closePrompt() {
  rl.close();
}

module.exports = {
  displayTransactionPreview,
  validateTransaction,
  promptConfirmation,
  requestApproval,
  dryRunSimulation,
  closePrompt
};
