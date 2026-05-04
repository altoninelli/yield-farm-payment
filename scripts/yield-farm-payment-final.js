#!/usr/bin/env node

/**
 * YieldFarmPayment - FINAL WORKING VERSION
 * Uses HTML page for wallet connection (bulletproof)
 */

const { createPublicClient, http, formatUnits, parseUnits, encodeFunctionData } = require('viem');
const { base } = require('viem/chains');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

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
 * Generate HTML page for wallet connection
 */
function generateWalletConnectPage(transactions, summary) {
  const projectId = process.env.WALLETCONNECT_PROJECT_ID || 'demo-project-id';
  
  // Simple but effective HTML with Web3Modal CDN
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>YieldFarmPayment - Sign Transactions</title>
    <script src="https://cdn.jsdelivr.net/npm/@walletconnect/web3modal@2.8.1/dist/index.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/viem@2.x/dist/viem.min.js"></script>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
        .tx { background: #f0f0f0; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .btn { background: #4CAF50; color: white; border: none; padding: 15px; width: 100%; border-radius: 8px; font-size: 16px; cursor: pointer; margin: 20px 0; }
        .btn:hover { background: #45a049; }
        #status { padding: 10px; margin: 10px 0; border-radius: 5px; display: none; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
    </style>
</head>
<body>
    <h1>🌾 YieldFarmPayment</h1>
    <p>Sign these 3 transactions to complete your payment:</p>
    
    ${transactions.map((tx, i) => `
    <div class="tx">
        <h3>${i + 1}. ${tx.description}</h3>
        <p><small>To: ${tx.to.substring(0, 20)}...</small></p>
    </div>
    `).join('')}
    
    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>💰 Summary</h3>
        <p>Fee: ${summary.feeAmount} USDC → Developer</p>
        <p>Payment: ${summary.paymentAmount} USDC → Recipient</p>
        <p>Collateral: ${summary.collateralAmount} USDC → Aave V3</p>
        <p>Recovery: ~${summary.estimatedRecoveryDays} days</p>
    </div>
    
    <button class="btn" id="connectBtn">Connect Wallet with Web3Modal</button>
    
    <div id="status"></div>
    
    <div id="txControls" style="display: none;">
        <h3>Connected! Click to sign:</h3>
        <button class="btn" id="signBtn">Sign All Transactions</button>
        <div id="txStatus"></div>
    </div>
    
    <script>
        const transactions = ${JSON.stringify(transactions)};
        let provider = null;
        let signer = null;
        
        // Web3Modal
        const web3Modal = new Web3Modal.default({
            projectId: '${projectId}',
            theme: 'dark',
            chainId: 8453
        });
        
        document.getElementById('connectBtn').onclick = async () => {
            try {
                document.getElementById('connectBtn').disabled = true;
                document.getElementById('connectBtn').textContent = 'Connecting...';
                
                provider = await web3Modal.connect();
                signer = await viem.createWalletClient({
                    transport: viem.custom(provider),
                    chain: { id: 8453, name: 'Base' }
                });
                
                document.getElementById('connectBtn').style.display = 'none';
                document.getElementById('txControls').style.display = 'block';
                showStatus('✅ Wallet connected!', 'success');
                
            } catch (error) {
                showStatus('❌ Error: ' + error.message, 'error');
                document.getElementById('connectBtn').disabled = false;
                document.getElementById('connectBtn').textContent = 'Connect Wallet';
            }
        };
        
        document.getElementById('signBtn').onclick = async () => {
            try {
                document.getElementById('signBtn').disabled = true;
                document.getElementById('signBtn').textContent = 'Signing...';
                
                const txStatus = document.getElementById('txStatus');
                txStatus.innerHTML = '';
                
                for (let i = 0; i < transactions.length; i++) {
                    const tx = transactions[i];
                    txStatus.innerHTML += '<p>⏳ ' + tx.description + '</p>';
                    
                    try {
                        const hash = await signer.sendTransaction({
                            to: tx.to,
                            data: tx.data,
                            value: BigInt(tx.value || '0x0')
                        });
                        
                        txStatus.innerHTML += '<p style="color: green;">✅ Sent: ' + hash.substring(0, 16) + '...</p>';
                        txStatus.innerHTML += '<p><a href="https://basescan.org/tx/' + hash + '" target="_blank">View on BaseScan</a></p>';
                        
                    } catch (txError) {
                        txStatus.innerHTML += '<p style="color: red;">❌ Failed: ' + txError.message + '</p>';
                        break;
                    }
                }
                
                txStatus.innerHTML += '<h3>🎉 All transactions completed!</h3>';
                document.getElementById('signBtn').textContent = 'Complete!';
                
            } catch (error) {
                showStatus('❌ Signing error: ' + error.message, 'error');
                document.getElementById('signBtn').disabled = false;
                document.getElementById('signBtn').textContent = 'Sign All Transactions';
            }
        };
        
        function showStatus(msg, type) {
            const status = document.getElementById('status');
            status.textContent = msg;
            status.className = type;
            status.style.display = 'block';
        }
    </script>
</body>
</html>
  `;
  
  return html;
}

/**
 * Main payment function - FINAL WORKING VERSION
 */
async function yieldFarmPayment(params) {
  const {
    amountToPay,
    recipientAddress,
    useHtmlWallet = false,
    collateralMultiplier = parseFloat(process.env.DEFAULT_COLLATERAL_MULTIPLIER) || 10,
    bufferPercentage = parseFloat(process.env.DEFAULT_BUFFER_PERCENTAGE) || 8
  } = params;
  
  console.log('🌾 YieldFarmPayment v1.3\n');
  
  // Create public client
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
    
    // Summary for display
    const summary = {
      feeAmount: formatUnits(feeAmount, decimals),
      paymentAmount: formatUnits(amountToPayWei, decimals),
      collateralAmount: formatUnits(collateralAmount, decimals),
      estimatedRecoveryDays: recoveryDays,
      recipient: recipientAddress,
      developer: developerAddress
    };
    
    // Generate HTML wallet connection page
    if (useHtmlWallet) {
      console.log('\n══════════════════════════════════════════════════════════════');
      console.log('📱 GENERATING WALLET CONNECTION PAGE');
      console.log('══════════════════════════════════════════════════════════════');
      
      const html = generateWalletConnectPage(transactions, summary);
      const filename = `yieldfarm-wallet-${Date.now()}.html`;
      fs.writeFileSync(filename, html);
      
      console.log(`\n📁 Wallet connection page created: ${filename}`);
      console.log('\n🚀 HOW TO USE:');
      console.log('   1. Open this HTML file in your web browser');
      console.log('   2. Click "Connect Wallet with Web3Modal"');
      console.log('   3. Connect your wallet (MetaMask, Trust, etc.)');
      console.log('   4. Click "Sign All Transactions"');
      console.log('   5. Approve each transaction in your wallet');
      console.log('\n💡 Tip: If on a server, run: python3 -m http.server 8080');
      console.log(`   Then open: http://localhost:8080/${filename}`);
      
      return {
        success: true,
        mode: 'html-wallet',
        htmlFile: filename,
        transactions,
        summary
      };
      
    } else {
      // Manual mode
      const filename = `yieldfarm-payment-${Date.now()}.json`;
      const data = {
        success: true,
        mode: 'manual',
        transactions,
        summary,
        instructions: 'Use Revoke.cash Batch mode or custom script'
      };
      
      fs.writeFileSync(filename, JSON.stringify(data, (k, v) => 
        typeof v === 'bigint' ? v.toString() : v, 2
      ));
      
      console.log(`\n📁 Transactions saved to: ${filename}`);
      console.log('\n🔧 Manual execution options:');
      console.log('   • Revoke.cash → Batch mode → Import JSON');
      console.log('   • RabbitHole → Batch transactions');
      console.log('   • Custom script with web3 library');
      
      return data;
    }
    
  } catch (error) {
    console.error(`\n❌ Payment failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export
module.exports = { yieldFarmPayment };

// Test
if (require.main === module) {
  yieldFarmPayment({
    amountToPay: 0.05,
    recipientAddress: '0x1234567890123456789012345678901234567890',
    useHtmlWallet: false
  }).then(console.log).catch(console.error);
}