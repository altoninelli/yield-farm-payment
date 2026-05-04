#!/usr/bin/env node

/**
 * YieldFarmPayment with WalletConnect UniversalProvider v2
 * Direct, stable implementation
 */

const { createPublicClient, http, formatUnits, parseUnits, encodeFunctionData } = require('viem');
const { base } = require('viem/chains');

// ABI definitions
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
];

const AAVE_POOL_ABI = [
  {
    name: 'supply',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' }
    ],
    outputs: []
  }
];

// Load .env
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

/**
 * WalletConnect UniversalProvider integration
 */
async function connectWithWalletConnectV2() {
  try {
    const { UniversalProvider } = require('@walletconnect/universal-provider');
    const qrcode = require('qrcode-terminal');
    
    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('📱 WALLETCONNECT v2.0 (UniversalProvider)');
    console.log('══════════════════════════════════════════════════════════════');
    
    const projectId = process.env.WALLETCONNECT_PROJECT_ID;
    
    if (!projectId || projectId === 'your_project_id_here') {
      console.warn('\n⚠️  WARNING: Please set WALLETCONNECT_PROJECT_ID in .env');
      console.warn('   Get free Project ID from: https://cloud.walletconnect.com');
      console.warn('   Using demo mode for now...');
    }
    
    console.log('\n🔄 Initializing WalletConnect UniversalProvider...');
    
    // Initialize provider
    const provider = await UniversalProvider.init({
      projectId: projectId || 'demo-project-id',
      metadata: {
        name: 'YieldFarmPayment',
        description: 'DeFi Payment System with Aave Recovery',
        url: 'https://github.com/altoninelli/yield-farm-payment',
        icons: ['https://raw.githubusercontent.com/altoninelli/yield-farm-payment/main/icon.png']
      },
      disableProviderPing: true
    });
    
    console.log('✅ Provider initialized');
    
    // Define required namespaces for Base chain
    const requiredNamespaces = {
      eip155: {
        methods: ['eth_sendTransaction', 'personal_sign'],
        chains: ['eip155:8453'], // Base mainnet
        events: ['chainChanged', 'accountsChanged']
      }
    };
    
    // Connect
    console.log('\n🔗 Connecting to wallet...');
    const { uri, approval } = await provider.connect({
      requiredNamespaces
    });
    
    // Show QR code if URI available
    if (uri) {
      console.log('\n📲 MOBILE USERS:');
      console.log('1. Open your wallet app (MetaMask, Trust, Coinbase, etc.)');
      console.log('2. Tap "Scan QR code"');
      console.log('3. Scan this QR code:\n');
      
      qrcode.generate(uri, { small: true }, (qr) => {
        console.log(qr);
      });
      
      console.log('\n💻 DESKTOP USERS:');
      console.log(`1. Click: ${uri.replace('wc:', 'https://walletconnect.com/wc?uri=')}`);
      console.log('2. Approve connection in your wallet extension');
      console.log('\n⏳ Waiting for connection... (Ctrl+C to cancel)');
    }
    
    // Wait for session approval
    const session = await approval();
    
    // Get user address
    const address = session.namespaces.eip155.accounts[0].split(':')[2];
    
    console.log(`\n✅ Connected! Wallet: ${address.substring(0, 12)}...`);
    
    return {
      provider,
      address,
      session,
      disconnect: () => provider.disconnect()
    };
    
  } catch (error) {
    console.error('\n❌ WalletConnect connection failed:', error.message);
    throw error;
  }
}

/**
 * Send transactions via WalletConnect
 */
async function sendTransactionsWithWalletConnectV2(provider, address, transactions) {
  try {
    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('🔄 EXECUTING TRANSACTIONS');
    console.log('\nPlease approve each transaction in your wallet popup...');
    console.log('══════════════════════════════════════════════════════════════');
    
    const results = [];
    
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      console.log(`\n${i + 1}/${transactions.length}: ${tx.description}`);
      
      try {
        // Send transaction via WalletConnect
        const hash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: tx.to,
            data: tx.data,
            value: tx.value || '0x0'
          }]
        });
        
        results.push({
          success: true,
          hash,
          description: tx.description,
          explorerUrl: `https://basescan.org/tx/${hash}`
        });
        
        console.log(`   ✅ Sent: ${hash.substring(0, 16)}...`);
        console.log(`   🔗 View: https://basescan.org/tx/${hash}`);
        
        // Small delay between transactions
        if (i < transactions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        results.push({
          success: false,
          error: error.message,
          description: tx.description
        });
        break;
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Transaction execution failed:', error.message);
    throw error;
  }
}

/**
 * Main payment function with WalletConnect v2
 */
async function yieldFarmPaymentWC2(params) {
  const {
    amountToPay,
    recipientAddress,
    useWalletConnect = false,
    collateralMultiplier = parseFloat(process.env.DEFAULT_COLLATERAL_MULTIPLIER) || 10,
    bufferPercentage = parseFloat(process.env.DEFAULT_BUFFER_PERCENTAGE) || 8
  } = params;
  
  console.log('🌾 YieldFarmPayment (WalletConnect v2.0)\n');
  
  // Setup public client
  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL)
  });
  
  const tokenAddress = process.env.USDC_ADDRESS;
  const decimals = 6;
  
  try {
    // Calculate amounts
    const amountToPayWei = parseUnits(amountToPay.toString(), decimals);
    const baseCollateralWei = amountToPayWei * BigInt(Math.floor(collateralMultiplier * 100)) / 100n;
    const bufferWei = baseCollateralWei * BigInt(bufferPercentage) / 100n;
    const totalLockedWei = baseCollateralWei + bufferWei;
    
    // Fee
    const feeAmount = parseUnits('0.2', decimals);
    const totalAmountNeeded = totalLockedWei + feeAmount;
    const collateralAmount = totalLockedWei - amountToPayWei;
    
    console.log(`📋 Payment Details:`);
    console.log(`   Amount to pay: ${formatUnits(amountToPayWei, decimals)} USDC`);
    console.log(`   Collateral: ${formatUnits(totalLockedWei, decimals)} USDC (${collateralMultiplier}x + ${bufferPercentage}%)`);
    console.log(`   Fee: ${formatUnits(feeAmount, decimals)} USDC`);
    console.log(`   Total needed: ${formatUnits(totalAmountNeeded, decimals)} USDC`);
    console.log(`   Aave deposit: ${formatUnits(collateralAmount, decimals)} USDC`);
    console.log(`   Recipient: ${recipientAddress.substring(0, 12)}...`);
    console.log(`   Developer: 0x1C7f7c428d...`);
    
    // Prepare transactions
    const transactions = [];
    const developerAddress = '0x1C7f7c428dE42B8402F8331612131cc8bC126369';
    
    // Transaction 1: Fee
    const feeData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [developerAddress, feeAmount]
    });
    
    transactions.push({
      description: `Pay ${formatUnits(feeAmount, decimals)} USDC fee to developer`,
      to: tokenAddress,
      data: feeData,
      value: '0x0'
    });
    
    // Transaction 2: Payment
    const paymentData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipientAddress, amountToPayWei]
    });
    
    transactions.push({
      description: `Pay ${formatUnits(amountToPayWei, decimals)} USDC to recipient`,
      to: tokenAddress,
      data: paymentData,
      value: '0x0'
    });
    
    // Transaction 3: Aave
    const aavePoolAddress = process.env.AAVE_V3_POOL_ADDRESS;
    const supplyData = encodeFunctionData({
      abi: AAVE_POOL_ABI,
      functionName: 'supply',
      args: [tokenAddress, collateralAmount, recipientAddress, 0]
    });
    
    transactions.push({
      description: `Supply ${formatUnits(collateralAmount, decimals)} USDC to Aave V3`,
      to: aavePoolAddress,
      data: supplyData,
      value: '0x0'
    });
    
    // Calculate recovery
    const apy = parseFloat(process.env.ESTIMATED_APY) || 0.03;
    const annualYield = Number(formatUnits(collateralAmount, decimals)) * apy;
    const dailyYield = annualYield / 365;
    const recoveryDays = Math.ceil(Number(formatUnits(amountToPayWei, decimals)) / dailyYield);
    
    console.log(`\n💰 Recovery Estimate: ~${recoveryDays} days at ${apy * 100}% APY`);
    
    // Execute with wallet connection
    if (useWalletConnect) {
      console.log('\n🚀 Proceeding with WalletConnect v2.0...');
      
      try {
        // Connect wallet
        const { provider, address, session, disconnect } = await connectWithWalletConnectV2();
        
        // Execute transactions
        const results = await sendTransactionsWithWalletConnectV2(provider, address, transactions);
        
        console.log('\n⚠️ Note: Wallet connection remains active');
        console.log('   To disconnect, close the session in your wallet app');
        
        // Optional: disconnect after done
        // await disconnect();
        
        return {
          success: results.every(r => r.success),
          mode: 'walletconnect-v2',
          results,
          summary: {
            feeAmount: formatUnits(feeAmount, decimals),
            paymentAmount: formatUnits(amountToPayWei, decimals),
            collateralAmount: formatUnits(collateralAmount, decimals),
            estimatedRecoveryDays: recoveryDays,
            recipient: recipientAddress,
            developer: developerAddress,
            userWallet: address
          }
        };
        
      } catch (error) {
        console.error('\n❌ WalletConnect execution failed:', error.message);
        console.log('ℹ️  Falling back to manual mode...');
        
        // Fallback to manual
        return {
          success: true,
          mode: 'manual-fallback',
          transactions,
          summary: {
            feeAmount: formatUnits(feeAmount, decimals),
            paymentAmount: formatUnits(amountToPayWei, decimals),
            collateralAmount: formatUnits(collateralAmount, decimals),
            estimatedRecoveryDays: recoveryDays,
            recipient: recipientAddress,
            developer: developerAddress
          },
          error: error.message
        };
      }
      
    } else {
      // Manual mode
      return {
        success: true,
        mode: 'manual',
        transactions,
        summary: {
          feeAmount: formatUnits(feeAmount, decimals),
          paymentAmount: formatUnits(amountToPayWei, decimals),
          collateralAmount: formatUnits(collateralAmount, decimals),
          estimatedRecoveryDays: recoveryDays,
          recipient: recipientAddress,
          developer: developerAddress
        }
      };
    }
    
  } catch (error) {
    console.error(`\n❌ Payment failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use
module.exports = { yieldFarmPaymentWC2, connectWithWalletConnectV2 };

// Test if called directly
if (require.main === module) {
  console.log('🧪 Testing WalletConnect v2 integration...');
  
  yieldFarmPaymentWC2({
    amountToPay: 0.01,
    recipientAddress: '0x1234567890123456789012345678901234567890',
    useWalletConnect: false
  }).then(console.log).catch(console.error);
}