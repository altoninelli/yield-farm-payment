#!/usr/bin/env node

/**
 * CLI for YieldFarmPayment Fixed Version
 * Uses the robust transaction manager with retry logic
 */

const { yieldFarmPaymentCorrected } = require('./yield-farm-payment-corrected.js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    mode: 'upfront',  // v1.0 ONLY supports upfront
    amount: null,
    recipient: null,
    collateral: parseFloat(process.env.DEFAULT_COLLATERAL_MULTIPLIER) || 10,
    buffer: parseFloat(process.env.DEFAULT_BUFFER_PERCENTAGE) || 8
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--mode':
      case '-m':
        params.mode = args[++i];
        break;
      case '--amount':
      case '-a':
        params.amount = parseFloat(args[++i]);
        break;
      case '--recipient':
      case '-r':
        params.recipient = args[++i];
        break;
      case '--collateral':
      case '-c':
        params.collateral = parseFloat(args[++i]);
        break;
      case '--buffer':
      case '-b':
        params.buffer = parseFloat(args[++i]);
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith('--')) {
          console.warn(`⚠️ Unknown option: ${arg}`);
        }
    }
  }

  return params;
}

function printHelp() {
  console.log(`
🌾 YieldFarmPayment CLI - Fixed Version (with robust transaction handling)

USAGE:
  node scripts/cli.js [OPTIONS]

REQUIRED OPTIONS:
  --amount, -a      Amount to pay in USDC (e.g., 0.01)
  --recipient, -r   Recipient Ethereum address

OPTIONAL OPTIONS:
  --mode, -m        Payment mode: upfront ONLY in v1.0 (default: upfront)
  --collateral, -c  Collateral multiplier (e.g., 5 for 5x, default: 10)
  --buffer, -b      Buffer percentage (e.g., 8 for 8%, default: 8)

EXAMPLES:
  # Upfront mode (immediate payment) - v1.0 ONLY
  node scripts/cli.js --mode upfront --amount 0.5 --recipient 0x... --collateral 3 --buffer 5

  # Upfront mode with default parameters (20x collateral)
  node scripts/cli.js --amount 0.1 --recipient 0x... --buffer 8

FEATURES:
  • Automatic retry on "replacement transaction underpriced"
  • Gas price optimization
  • Wait for transaction confirmations
  • Professional error handling
  • Balance and health factor checks

NOTES:
  • v1.0 ONLY supports 'upfront' mode (immediate payment)
  • Minimum collateral multiplier: ${process.env.MIN_COLLATERAL_MULTIPLIER || 3}x
  • Maximum collateral multiplier: ${process.env.MAX_COLLATERAL_MULTIPLIER || 20}x
  • Skill fee: ${process.env.SKILL_FEE_USDC || 0.2} USDC
  • Network: ${process.env.BASE_RPC_URL?.includes('sepolia') ? 'Base Sepolia Testnet' : 'Base Mainnet'}
  `);
}

async function main() {
  const params = parseArgs();
  
  if (!params.amount || params.amount <= 0) {
    console.error('❌ Error: --amount is required and must be positive');
    printHelp();
    process.exit(1);
  }
  
  if (!params.recipient || !params.recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
    console.error('❌ Error: --recipient must be a valid Ethereum address');
    printHelp();
    process.exit(1);
  }
  
  console.log('🚀 Starting YieldFarmPayment with robust transaction handling...\n');
  
  const result = await yieldFarmPaymentCorrected({
    mode: params.mode,
    amountToPay: params.amount,
    recipientAddress: params.recipient,
    collateralMultiplier: params.collateral,
    bufferPercentage: params.buffer
  });
  
  if (result.success) {
    console.log('\n✅ Payment completed successfully!');
    console.log(`📊 Transaction: ${result.transactionHash}`);
    
    // Handle different result structures based on mode
    if (result.dailyYield) {
      console.log(`🔄 Daily yield: ${result.dailyYield} USDC`);
    }
    
    if (result.paymentDurationDays) {
      console.log(`⏰ Estimated payment time: ${result.paymentDurationDays} days`);
    }
    
    if (result.recoveryDays) {
      console.log(`💰 Immediate payment: ${result.immediatePayment || 'sent'} USDC`);
      console.log(`🏦 Recovery collateral: ${result.recoveryCollateral || 'locked'} USDC`);
      console.log(`⏰ Estimated recovery time: ${result.recoveryDays} days`);
    }
    
    if (result.healthFactor) {
      console.log(`🏦 Health factor: ${result.healthFactor.toFixed(2)}`);
    }
    
    if (result.mode) {
      console.log(`🎯 Mode: ${result.mode}`);
    }
    
  } else {
    console.error('\n❌ Payment failed:');
    console.error(`   ${result.error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, printHelp };