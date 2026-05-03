
const { privateKeyToAccount } = require('viem/accounts');
const { createPublicClient, http } = require('viem');
const { base } = require('viem/chains');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testWallet() {
  console.log('🔐 Wallet Connectivity Test');
  
  try {
    const account = privateKeyToAccount(process.env.PRIVATE_KEY);
    console.log('✅ Private key valid');
    console.log('   Address: ' + account.address);
    
    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.BASE_RPC_URL)
    });
    
    const balance = await publicClient.getBalance({ address: account.address });
    console.log('✅ RPC connected');
    console.log('   Balance: ' + (balance / 1e18) + ' ETH');
    
    return true;
  } catch (error) {
    console.error('❌ Error: ' + error.message);
    return false;
  }
}

if (require.main === module) {
  testWallet();
}
