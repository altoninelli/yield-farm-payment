#!/usr/bin/env node

/**
 * Realistic payment test script for YieldFarmPayment v1.2
 * Testing AgentPay batch preparation and simulation only.
 *
 * This script is aligned with the current AgentPay-only flow:
 * - batch fee transfer to the fixed developer wallet
 * - seller payment
 * - Aave collateral deposit
 *
 * It does not require a user PRIVATE_KEY in .env.
 */

const { yieldFarmPayment } = require('./yield-farm-payment.js');

const DEFAULT_RECIPIENT = '0x...';
const DEFAULT_USER_WALLET = '0x...';
const FIXED_FEE_USDC = 0.2;
const DEFAULT_APY = 0.03;

function calculateBatchMetrics(amount, collateralMultiplier, bufferPercentage, apy = DEFAULT_APY) {
  const totalLocked = amount * collateralMultiplier * (1 + bufferPercentage / 100);
  const fee = FIXED_FEE_USDC;
  const sellerPayment = amount;
  const aaveDeposit = Math.max(0, totalLocked - sellerPayment - fee);
  const annualYield = aaveDeposit * apy;
  const dailyYield = annualYield / 365;
  const recoveryDays = dailyYield > 0 ? Math.ceil(sellerPayment / dailyYield) : Infinity;

  return {
    amount,
    collateralMultiplier,
    bufferPercentage,
    fee,
    totalLocked,
    sellerPayment,
    aaveDeposit,
    annualYield,
    dailyYield,
    recoveryDays
  };
}

function printMetrics(metrics) {
  console.log(`   Amount to pay: ${metrics.amount.toFixed(4)} USDC`);
  console.log(`   Collateral multiplier: ${metrics.collateralMultiplier}x`);
  console.log(`   Buffer percentage: ${metrics.bufferPercentage}%`);
  console.log(`   Fixed fee: ${metrics.fee.toFixed(4)} USDC`);
  console.log(`   Total locked: ${metrics.totalLocked.toFixed(6)} USDC`);
  console.log(`   Seller payment: ${metrics.sellerPayment.toFixed(6)} USDC`);
  console.log(`   Aave deposit: ${metrics.aaveDeposit.toFixed(6)} USDC`);
  console.log(`   Estimated annual yield: ${metrics.annualYield.toFixed(6)} USDC/year`);
  console.log(`   Estimated daily yield: ${metrics.dailyYield.toFixed(8)} USDC/day`);
  console.log(`   Estimated recovery time: ~${metrics.recoveryDays} days`);
}

async function runAgentPayScenario(amount, collateralMultiplier, bufferPercentage) {
  const metrics = calculateBatchMetrics(amount, collateralMultiplier, bufferPercentage);

  console.log('='.repeat(80));
  console.log(`AGENTPAY SCENARIO: ${amount} USDC, ${collateralMultiplier}x collateral, ${bufferPercentage}% buffer`);
  console.log('='.repeat(80));
  printMetrics(metrics);
  console.log('');

  if (!process.env.BASE_RPC_URL) {
    console.log('⚠️ Skipping live AgentPay batch preparation because BASE_RPC_URL is not configured in .env');
    console.log('   Set BASE_RPC_URL to run the real batch simulation.');
    return;
  }

  try {
    const result = await yieldFarmPayment({
      amountToPay: amount,
      recipientAddress: DEFAULT_RECIPIENT,
      userWalletAddress: DEFAULT_USER_WALLET,
      collateralMultiplier,
      bufferPercentage
    });

    if (result.success) {
      console.log('✅ AgentPay batch prepared successfully!');
      console.log(`   Fee: ${result.summary.feeAmount} USDC`);
      console.log(`   Payment: ${result.summary.paymentAmount} USDC`);
      console.log(`   Collateral: ${result.summary.collateralAmount} USDC`);
      console.log(`   Total amount: ${result.summary.totalAmount} USDC`);
      console.log(`   Estimated recovery days: ${result.summary.estimatedRecoveryDays}`);
      console.log('');
    } else {
      console.error('❌ AgentPay batch preparation failed:');
      console.error(`   ${result.error}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Unexpected error during AgentPay batch preparation:');
    console.error(`   ${error.message}`);
    console.log('');
  }
}

async function runRealisticTests() {
  console.log('🚀 YieldFarmPayment v1.2 - Realistic AgentPay Tests\n');
  console.log('📋 Configuration:');
  console.log(`   Recipient: ${DEFAULT_RECIPIENT}`);
  console.log(`   User wallet: ${DEFAULT_USER_WALLET}`);
  console.log('   Mode: AgentPay only');
  console.log('   Fee receiver: fixed developer wallet in code');
  console.log('   No PRIVATE_KEY required in .env');
  console.log('');

  console.log('🌐 Environment:');
  console.log(`   BASE_RPC_URL: ${process.env.BASE_RPC_URL || '(not configured)'}`);
  console.log('');

  await runAgentPayScenario(0.1, 10, 8);
  await runAgentPayScenario(0.1, 20, 8);
  await runAgentPayScenario(0.5, 10, 10);

  console.log('='.repeat(80));
  console.log('📌 Notes:');
  console.log(' - This script simulates the AgentPay batch flow.');
  console.log(' - Fee is fixed at 0.2 USDC and is sent to the hardcoded developer wallet.');
  console.log(' - If BASE_RPC_URL is configured, the script will attempt live batch preparation.');
  console.log(' - Use a dedicated user wallet with minimal funds for external signing.');
  console.log(' - The script does not require a PRIVATE_KEY in .env.');
  console.log('');

  console.log('🔧 Recommended commands:');
  console.log(`   node scripts/cli.js --dry-run --amount 0.1 --recipient ${DEFAULT_RECIPIENT} --user-wallet ${DEFAULT_USER_WALLET} --collateral 10 --buffer 8`);
  console.log(`   node scripts/cli.js --amount 0.1 --recipient ${DEFAULT_RECIPIENT} --user-wallet ${DEFAULT_USER_WALLET} --collateral 10 --buffer 8`);
}

if (require.main === module) {
  runRealisticTests().catch((error) => {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  });
}

module.exports = { runRealisticTests };