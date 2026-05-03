#!/usr/bin/env node

/**
 * YieldFarmPayment 
 * v1.2 supports ONLY AgentPay Mode (batch transaction preparation for external signing)
 * AgentPay Mode: Prepare batch transaction for external signing
 */

const { createPublicClient, http, formatUnits, parseUnits } = require('viem');
const { base } = require('viem/chains');

// Load .env
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// ABI definitions (object format)
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
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
  },
  {
    name: 'getUserAccountData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalCollateralBase', type: 'uint256' },
      { name: 'totalDebtBase', type: 'uint256' },
      { name: 'availableBorrowsBase', type: 'uint256' },
      { name: 'currentLiquidationThreshold', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' }
    ]
  }
];

/**
 * Professional transaction execution with retry and error handling
 */
async function executeWithRetry(walletClient, contractConfig, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📝 Attempt ${attempt}/${maxRetries}...`);
      
      const hash = await walletClient.writeContract(contractConfig);
      console.log(`✅ Transaction sent: ${hash.substring(0, 16)}...`);
      
      // Wait for confirmation
      const publicClient = createPublicClient({
        chain: base,
        transport: http(process.env.BASE_RPC_URL)
      });
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      
      return { success: true, hash, receipt };
      
    } catch (error) {
      lastError = error;
      const errorMsg = error.message || error.toString();
      
      console.log(`⚠️ Attempt ${attempt} failed: ${errorMsg.substring(0, 100)}...`);
      
      // Handle specific errors
      if (errorMsg.includes('replacement transaction underpriced')) {
        console.log('   Increasing gas price for next attempt...');
        
        // Increase gas price for next attempt
        if (contractConfig.maxPriorityFeePerGas) {
          contractConfig.maxPriorityFeePerGas = contractConfig.maxPriorityFeePerGas * 15n / 10n; // +50%
          contractConfig.maxFeePerGas = contractConfig.maxFeePerGas * 15n / 10n;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }
      
      if (errorMsg.includes('nonce too low')) {
        console.log('   Nonce error - waiting for pending transactions...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      // For other errors, break
      break;
    }
  }
  
  return { success: false, error: lastError };
}

/**
 * Main yield farming payment function - AgentPay Mode Only
 */
async function yieldFarmPayment(params) {
  const {
    amountToPay,
    recipientAddress,
    token = 'USDC',
    collateralMultiplier = 10,
    bufferPercentage = 8,
    userWalletAddress // Required for agent-pay mode
  } = params;
  
  console.log('🌾 YieldFarmPayment (v1.2 - AgentPay Mode Only)\n');
  
  // Validate userWalletAddress is provided
  if (!userWalletAddress) {
    console.error(`❌ ERROR: userWalletAddress is required for AgentPay mode`);
    return {
      success: false,
      error: 'userWalletAddress is required for AgentPay mode'
    };
  }
  
  // ⚠️ AMOUNT VALIDATION - Maximum limits for safety
  const isMainnet = !process.env.BASE_RPC_URL?.includes('sepolia') && !process.env.BASE_RPC_URL?.includes('testnet');
  const maxAmount = 1000; // 1000 USDC max for both mainnet and testnet
  
  if (amountToPay > maxAmount) {
    console.error(`❌ ERROR: Amount exceeds maximum limit`);
    console.error(`   Maximum allowed: ${maxAmount} USDC`);
    console.error(`   Requested: ${amountToPay} USDC`);
    console.error(`   Network: ${isMainnet ? 'BASE MAINNET' : 'Base Testnet'}`);
    
    return {
      success: false,
      error: `Amount ${amountToPay} USDC exceeds limit of ${maxAmount} USDC`
    };
  }
  
  // Setup clients - only public client needed for AgentPay
  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL)
  });
  
  // Token configuration
  const tokenAddress = process.env.USDC_ADDRESS;
  const decimals = 6; // USDC
  
  console.log(`👤 Wallet: ${userWalletAddress}`);
  console.log(`📋 Mode: AgentPay, Amount: ${amountToPay} ${token}, Recipient: ${recipientAddress.substring(0, 12)}...`);
  
  try {
    // 1. Calculate amounts
    const decimals = 6; // USDC
    const amountToPayWei = parseUnits(amountToPay.toString(), decimals);
    const baseCollateralWei = amountToPayWei * BigInt(Math.floor(collateralMultiplier * 100)) / 100n;
    const bufferWei = baseCollateralWei * BigInt(bufferPercentage) / 100n;
    const totalLockedWei = baseCollateralWei + bufferWei;
    
    console.log(`📊 Collateral: ${formatUnits(totalLockedWei, decimals)} ${token} (${collateralMultiplier}x + ${bufferPercentage}%)`);
    
    // 2. Prepare AgentPay batch
    const result = await prepareAgentPayBatch(
      publicClient, userWalletAddress,
      tokenAddress, decimals, token,
      totalLockedWei, amountToPayWei,
      recipientAddress, collateralMultiplier, bufferPercentage
    );
    
    return result;
    
  } catch (error) {
    console.error(`\n❌ Payment failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * AgentPay Mode: Prepare batch transaction for external signing
 */
async function prepareAgentPayBatch(publicClient, userWalletAddress,
  tokenAddress, decimals, token,
  totalLockedWei, amountToPayWei,
  recipientAddress, collateralMultiplier, bufferPercentage) {
  
  console.log('\n🤖 Preparing AgentPay Batch Transaction');
  
  // Calculate fee (0.2 USDC fixed for now)
  const feeAmount = parseUnits('0.2', decimals);
  const totalAmountNeeded = totalLockedWei + feeAmount;
  
  console.log(`💰 Fee: ${formatUnits(feeAmount, decimals)} USDC`);
  console.log(`📦 Total batch amount: ${formatUnits(totalAmountNeeded, decimals)} USDC`);
  
  // Prepare batch transactions
  const batchTransactions = [];
  
  // Transaction 1: Pay fee to developer
  const developerAddress = '0x1C7f7c428dE42B8402F8331612131cc8bC126369';
  batchTransactions.push({
    type: 'erc20-transfer',
    description: `Pay ${formatUnits(feeAmount, decimals)} USDC fee to developer`,
    contractAddress: tokenAddress,
    functionName: 'transfer',
    args: [developerAddress, feeAmount],
    value: 0n
  });
  
  // Transaction 2: Pay amount to recipient
  batchTransactions.push({
    type: 'erc20-transfer',
    description: `Pay ${formatUnits(amountToPayWei, decimals)} USDC to recipient`,
    contractAddress: tokenAddress,
    functionName: 'transfer',
    args: [recipientAddress, amountToPayWei],
    value: 0n
  });
  
  // Transaction 3: Approve Aave pool to spend collateral
  const collateralAmount = totalLockedWei - amountToPayWei;
  const aavePoolAddress = process.env.AAVE_V3_POOL_ADDRESS;
  batchTransactions.push({
    type: 'erc20-approve',
    description: `Approve Aave pool to spend ${formatUnits(collateralAmount, decimals)} USDC`,
    contractAddress: tokenAddress,
    functionName: 'approve',
    args: [aavePoolAddress, collateralAmount],
    value: 0n
  });
  
  // Transaction 4: Supply collateral to Aave
  batchTransactions.push({
    type: 'aave-supply',
    description: `Supply ${formatUnits(collateralAmount, decimals)} USDC to Aave V3`,
    contractAddress: aavePoolAddress,
    functionName: 'supply',
    args: [tokenAddress, collateralAmount, userWalletAddress, 0],
    value: 0n
  });
  
  // Simulate the batch to check for errors
  console.log('\n🔍 Simulating batch transactions...');
  try {
    for (let i = 0; i < batchTransactions.length; i++) {
      const tx = batchTransactions[i];
      console.log(`   ${i + 1}. ${tx.description}`);
      
      // Simulate each transaction
      await publicClient.simulateContract({
        address: tx.contractAddress,
        abi: tx.contractAddress === tokenAddress ? ERC20_ABI : AAVE_POOL_ABI,
        functionName: tx.functionName,
        args: tx.args,
        account: userWalletAddress
      });
    }
    console.log('✅ Batch simulation successful');
  } catch (error) {
    console.error(`❌ Batch simulation failed: ${error.message}`);
    throw error;
  }
  
  // Calculate recovery metrics
  const apy = parseFloat(process.env.ESTIMATED_APY) || 0.03;
  const annualYield = Number(formatUnits(collateralAmount, decimals)) * apy;
  const dailyYield = annualYield / 365;
  const recoveryDays = Number(formatUnits(amountToPayWei, decimals)) / dailyYield;
  
  console.log('\n📋 AgentPay Batch Ready for Signing:');
  console.log('═'.repeat(80));
  batchTransactions.forEach((tx, index) => {
    console.log(`${index + 1}. ${tx.description}`);
  });
  console.log('═'.repeat(80));
  console.log(`\n💰 Recovery Estimate: ~${Math.ceil(recoveryDays)} days at ${apy * 100}% APY`);
  console.log(`\n🔑 Sign these transactions in your wallet to complete the payment.`);
  
  return {
    success: true,
    mode: 'agent-pay',
    batchTransactions,
    summary: {
      feeAmount: formatUnits(feeAmount, decimals),
      paymentAmount: formatUnits(amountToPayWei, decimals),
      collateralAmount: formatUnits(collateralAmount, decimals),
      totalAmount: formatUnits(totalAmountNeeded, decimals),
      estimatedRecoveryDays: Math.ceil(recoveryDays),
      apy: apy
    }
  };
}

module.exports = { yieldFarmPayment };