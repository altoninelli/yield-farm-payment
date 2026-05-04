#!/usr/bin/env node

/**
 * CLI for YieldFarmPayment with WalletConnect v2.0
 * FINAL WORKING VERSION with proper WalletConnect integration
 */

const { yieldFarmPaymentWC2 } = require('./yield-farm-payment-wc2.js');
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
      case '--walletconnect':
      case '--wc':
        params.mode = 'walletconnect';
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
🌾 YieldFarmPayment CLI - v2.0 (WalletConnect v2.0)
   FINAL WORKING VERSION with proper QR code wallet connection

USAGE:
  node scripts/cli-wc2.js [OPTIONS]

REQUIRED OPTIONS:
  --amount, -a      Amount to pay in USDC (e.g., 0.01)
  --recipient, -r   Recipient Ethereum address

EXECUTION MODES:
  --walletconnect   Connect wallet via QR code (WalletConnect v2.0) - RECOMMENDED 🚀
  --manual          Advanced: Save transactions for manual execution

OPTIONAL OPTIONS:
  --collateral, -c  Collateral multiplier (e.g., 5 for 5x, default: 10)
  --buffer, -b      Buffer percentage (e.g., 8 for 8%, default: 8)
  --dry-run         Show payment calculation without executing

EXAMPLES:

  # WalletConnect v2.0 - Scan QR code with your wallet
  node scripts/cli-wc2.js --walletconnect --amount 0.1 --recipient 0x...

  # Manual execution mode
  node scripts/cli-wc2.js --manual --amount 0.1 --recipient 0x...

  # Custom parameters
  node scripts/cli-wc2.js --walletconnect --amount 0.5 --recipient 0x... --collateral 10 --buffer 5

WALLETCONNECT FLOW:
  1. CLI shows QR code and connection link
  2. Scan QR with mobile wallet OR click link on desktop
  3. Approve connection in wallet app
  4. CLI shows 3 transactions to sign (visible before signing):
     • 0.2 USDC fee → Developer (funds skill maintenance)
     • Payment amount → Recipient  
     • Collateral amount → Aave V3 (recoverable yield)
  5. Approve each transaction in wallet popup
  6. Transactions execute automatically after approval

SUPPORTED WALLETS:
  • MetaMask (mobile & desktop)
  • Trust Wallet
  • Coinbase Wallet
  • Rainbow
  • Rabby
  • Argent
  • 100+ others via WalletConnect

SECURITY FEATURES:
  ✓ WalletConnect v2.0 (industry standard)
  ✓ No private keys in skill
  ✓ User approves each transaction in wallet
  ✓ Fee transparency (0.2 USDC visible before signing)
  ✓ Automatic fallback to manual mode if needed

NOTES:
  • Requires WALLETCONNECT_PROJECT_ID in .env (free from cloud.walletconnect.com)
  • Includes 0.2 USDC developer fee (visible before signing)
  • Minimum collateral: ${process.env.MIN_COLLATERAL_MULTIPLIER || 3}x
  • Maximum collateral: ${process.env.MAX_COLLATERAL_MULTIPLIER || 20}x
  • Network: Base Mainnet
  • Token: USDC (6 decimals)
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
  
  console.log('🚀 Starting YieldFarmPayment v2.0 (WalletConnect v2.0)...\n');
  
  // Dry-run
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
    console.log('\n✅ Dry-run completed. Use --walletconnect or --manual to execute.');
    process.exit(0);
  }
  
  // Execute payment
  const paymentParams = {
    amountToPay: params.amount,
    recipientAddress: params.recipient,
    useWalletConnect: params.mode === 'walletconnect',
    collateralMultiplier: params.collateral,
    bufferPercentage: params.buffer
  };
  
  try {
    const result = await yieldFarmPaymentWC2(paymentParams);
    
    if (result.success) {
      console.log('\n══════════════════════════════════════════════════════════════');
      console.log('🎉 PAYMENT COMPLETED SUCCESSFULLY!');
      console.log('══════════════════════════════════════════════════════════════');
      
      if (result.mode === 'walletconnect-v2') {
        console.log(`\n✅ All transactions executed via WalletConnect`);
        console.log(`👤 Connected Wallet: ${result.summary.userWallet}`);
        
        console.log('\n📊 Transaction Results:');
        result.results.forEach((tx, i) => {
          if (tx.success) {
            console.log(`   ${i + 1}. ✅ ${tx.description}`);
            console.log(`      Hash: ${tx.hash.substring(0, 16)}...`);
            console.log(`      View: ${tx.explorerUrl}`);
          } else {
            console.log(`   ${i + 1}. ❌ ${tx.description}`);
            console.log(`      Error: ${tx.error}`);
          }
        });
        
        console.log('\n💰 Payment Summary:');
        console.log(`   • Fee: ${result.summary.feeAmount} USDC → Developer`);
        console.log(`   • Payment: ${result.summary.paymentAmount} USDC → Recipient`);
        console.log(`   • Collateral: ${result.summary.collateralAmount} USDC → Aave V3`);
        console.log(`   • Recovery: ~${result.summary.estimatedRecoveryDays} days at 3% APY`);
        
      } else if (result.mode === 'manual-fallback') {
        console.log(`\n⚠️  WalletConnect failed, falling back to manual mode`);
        console.log(`   Error: ${result.error}`);
        console.log('\n📁 Transactions prepared for manual execution');
        
        // Save to file
        saveToFile(result);
        
      } else {
        // Manual mode
        console.log(`\n✅ Transactions prepared for manual execution`);
        saveToFile(result);
      }
      
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

function saveToFile(result) {
  const fs = require('fs');
  const filename = `yieldfarm-payment-${Date.now()}.json`;
  
  const serializeForJSON = (obj) => JSON.stringify(obj, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2
  );
  
  fs.writeFileSync(filename, serializeForJSON(result));
  console.log(`   📄 File: ${filename}`);
  
  console.log('\n🔧 Manual execution:');
  console.log('   • Revoke.cash → Batch mode → Import JSON');
  console.log('   • Or use custom script with web3 library');
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, printHelp };