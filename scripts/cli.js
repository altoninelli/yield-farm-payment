#!/usr/bin/env node

/**
 * CLI for YieldFarmPayment Fixed Version
 * Uses the robust transaction manager with retry logic
 * Includes interactive confirmation and dry-run mode for transaction safety
 */

const { yieldFarmPayment } = require('./yield-farm-payment.js');
const {
  displayTransactionPreview,
  validateTransaction,
  requestApproval,
  dryRunSimulation,
  closePrompt
} = require('./transaction-confirmation.js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    mode: 'agent-pay',  // v1.2 ONLY supports agent-pay (default)
    amount: null,
    recipient: null,
    userWallet: null, // Required for agent-pay mode
    collateral: parseFloat(process.env.DEFAULT_COLLATERAL_MULTIPLIER) || 10,
    buffer: parseFloat(process.env.DEFAULT_BUFFER_PERCENTAGE) || 8,
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--amount':
      case '-a':
        params.amount = parseFloat(args[++i]);
        break;
      case '--recipient':
      case '-r':
        params.recipient = args[++i];
        break;
      case '--user-wallet':
      case '-w':
        params.userWallet = args[++i];
        break;
      case '--collateral':
      case '-c':
        params.collateral = parseFloat(args[++i]);
        break;
      case '--buffer':
      case '-b':
        params.buffer = parseFloat(args[++i]);
        break;
      case '--dry-run':
        params.dryRun = true;
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
🌾 YieldFarmPayment CLI - v1.2 (AgentPay Mode Only)
   Agent-friendly batch transaction preparation for external wallet signing

USAGE:
  node scripts/cli.js [OPTIONS]

REQUIRED OPTIONS:
  --amount, -a      Amount to pay in USDC (e.g., 0.01)
  --recipient, -r   Recipient Ethereum address
  --user-wallet, -w Your wallet address (where transactions will be signed)

OPTIONAL OPTIONS:
  --collateral, -c  Collateral multiplier (e.g., 5 for 5x, default: 10)
  --buffer, -b      Buffer percentage (e.g., 8 for 8%, default: 8)
  --dry-run         Simulate transaction without preparing batch

EXAMPLES:

  # Test with dry-run first (RECOMMENDED)
  node scripts/cli.js --dry-run --amount 0.1 --recipient 0x... --user-wallet 0x...

  # Prepare AgentPay batch for external wallet signing
  node scripts/cli.js --amount 0.1 --recipient 0x... --user-wallet 0x...

  # Custom collateral multiplier
  node scripts/cli.js --amount 0.5 --recipient 0x... --user-wallet 0x... --collateral 10 --buffer 5

SAFETY FEATURES:
  ✓ Transaction preview before signing
  ✓ Amount validation (max 1000 USDC)
  ✓ Recipient and wallet address verification
  ✓ AgentPay batch preparation for external wallet signing
  ✓ Dry-run mode for testing without on-chain execution
  ✓ Collateral multiplier limits (3x-20x)
  ✓ Buffer percentage validation (5%-20%)

WORKFLOW:
  1. Run with --dry-run to test parameters
  2. Run without --dry-run to prepare AgentPay batch
  3. Sign the 4 transactions in your external wallet
  4. Review transaction details carefully
  5. Transaction is sent and broadcasted to Base network

NOTES:
  • v1.2 ONLY supports AgentPay mode (batch preparation for external signing)
  • AgentPay includes automatic 0.2 USDC fee for skill usage
  • Minimum collateral multiplier: ${process.env.MIN_COLLATERAL_MULTIPLIER || 3}x
  • Maximum collateral multiplier: ${process.env.MAX_COLLATERAL_MULTIPLIER || 20}x
  • Maximum amount: 1000 USDC
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
  
  // Validate required parameters
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
  
  if (!params.userWallet || !params.userWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
    console.error('❌ Error: --user-wallet is required and must be a valid Ethereum address');
    printHelp();
    process.exit(1);
  }
  
  console.log('🚀 Starting YieldFarmPayment AgentPay Mode...\n');
  
  // Handle dry-run mode
  if (params.dryRun) {
    const confirmationParams = {
      amountToPay: params.amount,
      recipientAddress: params.recipient,
      senderAddress: params.userWallet,
      collateralMultiplier: params.collateral,
      bufferPercentage: params.buffer,
      rpcUrl: process.env.BASE_RPC_URL,
      estimatedAPY: parseFloat(process.env.ESTIMATED_APY) || 0.03
    };
    const result = dryRunSimulation(confirmationParams);
    closePrompt();
    process.exit(result.success ? 0 : 1);
  }
  
  // Prepare AgentPay parameters
  const paymentParams = {
    amountToPay: params.amount,
    recipientAddress: params.recipient,
    collateralMultiplier: params.collateral,
    bufferPercentage: params.buffer,
    userWalletAddress: params.userWallet
  };
  
  // Execute AgentPay batch preparation
  try {
    const result = await yieldFarmPayment(paymentParams);
    
    if (result.success) {
      console.log('\n✅ AgentPay batch prepared successfully!');
      console.log(`💰 Fee: ${result.summary.feeAmount} USDC`);
      console.log(`💸 Payment: ${result.summary.paymentAmount} USDC`);
      console.log(`🏦 Collateral: ${result.summary.collateralAmount} USDC`);
      console.log(`⏰ Recovery: ~${result.summary.estimatedRecoveryDays} days`);
      console.log('\n🔑 Sign the batch transactions in your wallet to complete the payment.');
      
      if (result.healthFactor) {
        console.log(`🏦 Health factor: ${result.healthFactor.toFixed(2)}`);
      }
      
    } else {
      console.error('\n❌ Payment failed:');
      console.error(`   ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Unexpected error:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, printHelp };