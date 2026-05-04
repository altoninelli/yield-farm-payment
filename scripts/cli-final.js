#!/usr/bin/env node

/**
 * CLI for YieldFarmPayment - FINAL WORKING VERSION
 * User-friendly with HTML wallet connection page
 */

const { yieldFarmPayment } = require('./yield-farm-payment-final.js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    mode: 'auto',
    amount: null,
    recipient: null,
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
      case '--collateral':
      case '-c':
        params.collateral = parseFloat(args[++i]);
        break;
      case '--buffer':
      case '-b':
        params.buffer = parseFloat(args[++i]);
        break;
      case '--html-wallet':
      case '--web':
        params.mode = 'html-wallet';
        break;
      case '--manual':
        params.mode = 'manual';
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
🌾 YieldFarmPayment CLI - v1.3 (FINAL WORKING VERSION)
   Bulletproof wallet connection via HTML page

USAGE:
  node scripts/cli-final.js [OPTIONS]

REQUIRED OPTIONS:
  --amount, -a      Amount to pay in USDC (e.g., 0.01)
  --recipient, -r   Recipient Ethereum address

EXECUTION MODES:
  --html-wallet     User-friendly: Generate HTML page for wallet connection (RECOMMENDED)
  --manual          Advanced: Save transactions as JSON for manual execution

OPTIONAL OPTIONS:
  --collateral, -c  Collateral multiplier (e.g., 5 for 5x, default: 10)
  --buffer, -b      Buffer percentage (e.g., 8 for 8%, default: 8)
  --dry-run         Show payment calculation without executing

EXAMPLES:

  # User-friendly HTML wallet connection (RECOMMENDED)
  node scripts/cli-final.js --html-wallet --amount 0.1 --recipient 0x...

  # Advanced manual execution
  node scripts/cli-final.js --manual --amount 0.1 --recipient 0x...

  # Custom collateral multiplier
  node scripts/cli-final.js --html-wallet --amount 0.5 --recipient 0x... --collateral 10 --buffer 5

HTML WALLET FLOW:
  1. CLI generates an HTML file with Web3Modal
  2. User opens HTML in web browser
  3. User clicks "Connect Wallet" (supports MetaMask, Trust, Coinbase, etc.)
  4. User signs 3 transactions in wallet popups:
     • 0.2 USDC fee → Developer
     • Payment amount → Recipient
     • Collateral amount → Aave V3
  5. Transactions execute automatically

MANUAL FLOW:
  1. CLI saves transactions as JSON file
  2. User imports to Revoke.cash (Batch mode)
  3. User signs and executes manually

SECURITY FEATURES:
  ✓ HTML page with Web3Modal (industry standard)
  ✓ No private keys in skill
  ✓ User approves each transaction in wallet
  ✓ Fee transparency (0.2 USDC visible before signing)
  ✓ Works with ALL WalletConnect-compatible wallets

NOTES:
  • Requires WALLETCONNECT_PROJECT_ID in .env (free from cloud.walletconnect.com)
  • Includes 0.2 USDC developer fee
  • Minimum collateral: ${process.env.MIN_COLLATERAL_MULTIPLIER || 3}x
  • Maximum amount: 1000 USDC
  • Network: Base Mainnet
  `);
}

async function main() {
  const params = parseArgs();
  
  // Validate
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
  
  console.log('🚀 Starting YieldFarmPayment v1.3 (Final Working Version)...\n');
  
  // Dry-run (simple calculation)
  if (params.dryRun) {
    console.log('🔍 DRY-RUN MODE: Payment calculation\n');
    
    const totalLocked = params.amount * params.collateral * (1 + params.buffer/100);
    const fee = 0.2;
    const aaveDeposit = totalLocked - params.amount;
    const apy = parseFloat(process.env.ESTIMATED_APY) || 0.03;
    const recoveryDays = Math.ceil(params.amount / (aaveDeposit * apy / 365));
    
    console.log(`💰 Amount to pay: ${params.amount} USDC`);
    console.log(`🏦 Collateral: ${totalLocked.toFixed(3)} USDC (${params.collateral}x + ${params.buffer}%)`);
    console.log(`💸 Fee: ${fee} USDC`);
    console.log(`🔄 Aave deposit: ${aaveDeposit.toFixed(3)} USDC`);
    console.log(`⏰ Recovery: ~${recoveryDays} days at ${apy * 100}% APY`);
    console.log('\n✅ Dry-run completed. Use --html-wallet or --manual to execute.');
    process.exit(0);
  }
  
  // Execute payment
  const paymentParams = {
    amountToPay: params.amount,
    recipientAddress: params.recipient,
    useHtmlWallet: params.mode === 'html-wallet',
    collateralMultiplier: params.collateral,
    bufferPercentage: params.buffer
  };
  
  try {
    const result = await yieldFarmPayment(paymentParams);
    
    if (result.success) {
      console.log('\n══════════════════════════════════════════════════════════════');
      console.log('✅ PAYMENT PREPARED SUCCESSFULLY!');
      console.log('══════════════════════════════════════════════════════════════');
      
      if (result.mode === 'html-wallet') {
        console.log(`\n📁 HTML wallet page created: ${result.htmlFile}`);
        console.log('\n🚀 NEXT STEPS:');
        console.log('   1. Open the HTML file in your web browser');
        console.log('   2. Click "Connect Wallet with Web3Modal"');
        console.log('   3. Connect your wallet (MetaMask, Trust, Coinbase, etc.)');
        console.log('   4. Click "Sign All Transactions"');
        console.log('   5. Approve each transaction in your wallet popup');
        
      } else {
        console.log(`\n📁 Transactions saved for manual execution`);
        console.log('\n🔧 Execute with:');
        console.log('   • Revoke.cash → Batch mode → Import JSON');
        console.log('   • RabbitHole → Batch transactions');
        console.log('   • Custom script with web3 library');
      }
      
      console.log('\n💰 Payment Summary:');
      console.log(`   • Fee: ${result.summary.feeAmount} USDC → Developer`);
      console.log(`   • Payment: ${result.summary.paymentAmount} USDC → Recipient`);
      console.log(`   • Collateral: ${result.summary.collateralAmount} USDC → Aave V3`);
      console.log(`   • Recovery: ~${result.summary.estimatedRecoveryDays} days at 3% APY`);
      
      console.log('\n🔗 Resources:');
      console.log('   • BaseScan: https://basescan.org');
      console.log('   • USDC on Base: https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
      console.log('   • Aave V3: https://basescan.org/address/0xA238Dd80C259a72e81d7e4664a9801593F98d1c5');
      
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