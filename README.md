# 🌾 YieldFarmPayment v2.0 — Modern WalletConnect Integration

**Connect wallet via QR code or browser UI. Pay on Base, recover capital via Aave V3 yield farming.**

[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-blue)](https://clawhub.ai)
[![Base Network](https://img.shields.io/badge/Network-Base-0052FF)](https://base.org)
[![WalletConnect](https://img.shields.io/badge/WalletConnect-v2.0-3B99FC)](https://walletconnect.com)
[![Aave V3](https://img.shields.io/badge/Integration-Aave%20V3-1B5AE3)](https://aave.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-green)](https://github.com/altoninelli/yield-farm-payment)

## 🚀 v2.0 Highlights

- **WalletConnect v2.0** - Scan QR code with any mobile wallet
- **HTML Fallback** - Browser UI with Web3Modal for desktop
- **3 Execution Modes** - Choose your preferred workflow
- **Modern UX** - No private keys, user signs in their wallet
- **0.2 USDC Fee** - Transparent developer fee built-in

## 🎯 What Problem Does This Solve?

Traditional payment automations require storing private keys. YieldFarmPayment v2.0 connects directly to user wallets via:

1. **WalletConnect QR code** - Scan with mobile wallet
2. **HTML browser UI** - Connect any browser wallet
3. **Manual mode** - Export for Revoke.cash

**No private keys stored. User signs everything in their own wallet.**

## ✨ Key Features

- **WalletConnect v2.0** - Industry-standard wallet connection
- **HTML Fallback** - Browser-based UI with Web3Modal
- **Manual Mode** - Export transactions for batch execution
- **Built-in Fee** - 0.2 USDC developer fee (visible before signing)
- **Flexible Collateral** - 3x to 20x multiplier with buffer
- **Aave V3 Integration** - Deposit collateral to earn yield
- **Dry-run Support** - Simulate before executing
- **Base Network** - Low fees, fast transactions

## 📦 Quick Installation

```bash
npm install
cp .env.example .env
# Edit .env with your free WalletConnect Project ID
node scripts/check-configuration.js
```

### Get Free WalletConnect Project ID
1. Visit https://cloud.walletconnect.com
2. Sign up (free)
3. Create new project
4. Copy Project ID to `.env`

## 🚀 Quick Start

### 1. Always dry-run first (recommended)
```bash
node scripts/cli-wc2.js --dry-run --amount 0.1 --recipient 0x...
```

### 2. WalletConnect Mode (QR code - recommended)
```bash
node scripts/cli-wc2.js --walletconnect --amount 0.1 --recipient 0x...
```
**Flow:**
1. Terminal shows QR code
2. Scan with mobile wallet
3. Approve connection
4. Sign 3 transactions in wallet popups

### 3. HTML Wallet Mode (browser - user-friendly)
```bash
node scripts/cli-final.js --html-wallet --amount 0.1 --recipient 0x...
```
**Flow:**
1. CLI generates HTML file
2. Open in browser
3. Click "Connect Wallet with Web3Modal"
4. Connect wallet and sign transactions

### 4. Manual Mode (advanced)
```bash
node scripts/cli-wc2.js --manual --amount 0.1 --recipient 0x...
```
**Flow:**
1. Save transactions as JSON file
2. Import to Revoke.cash
3. Execute as batch transaction

## 📊 How It Works

### Payment & Recovery Flow

**3 Transactions (user signs all):**
1. **0.2 USDC** → Developer fee (skill maintenance)
2. **Payment amount** → Recipient address
3. **Collateral amount** → Aave V3 (yield farming)

**Capital Recovery:**
- Collateral deposited in Aave V3 earns yield
- Yield pays back the original payment amount over time
- Higher collateral = faster recovery

### Example Calculation

```bash
Amount: 0.1 USDC
Collateral: 20x
Buffer: 8%
APY: 3%

Total Locked: 2.16 USDC
Fee: 0.2 USDC
Payment: 0.1 USDC
Aave Deposit: 1.86 USDC
Annual Yield: 0.0558 USDC
Recovery Time: ~654 days
```

## 🔧 Utility Scripts

### Check Configuration
```bash
node scripts/check-configuration.js
```

### Optimize Collateral
```bash
node scripts/collateral-calculator.js --amount 0.1 --deadline 180
```

### Run Test Suite
```bash
node scripts/test-realistic-payment.js
```

## 💡 Usage Examples

### Small test payment
```bash
node scripts/cli-wc2.js --walletconnect --amount 0.01 --recipient 0x...
```

### Custom collateral and buffer
```bash
node scripts/cli-final.js --html-wallet --amount 0.5 --recipient 0x... --collateral 10 --buffer 5
```

### Dry-run with calculation
```bash
node scripts/cli-wc2.js --dry-run --amount 1.0 --recipient 0x... --collateral 15 --buffer 10
```

## 🛡️ Security Features

- **No Private Keys** - User signs in their own wallet
- **WalletConnect v2.0** - Industry standard
- **Transparent Fees** - 0.2 USDC shown before signing
- **Base Mainnet** - Secure, audited network
- **User Control** - Approve each transaction individually

## 🌐 Supported Wallets

### WalletConnect Mode
- MetaMask Mobile
- Trust Wallet
- Coinbase Wallet
- Rainbow
- Rabby
- Argent
- 100+ others via WalletConnect

### HTML Mode
- MetaMask (browser extension)
- Coinbase Wallet (browser extension)
- Any EIP-1193 browser wallet
- All WalletConnect wallets

## 📁 Project Structure

```
scripts/
├── cli-wc2.js               # 📱 WalletConnect v2.0 (main)
├── cli-final.js             # 🌐 HTML Wallet mode
├── yield-farm-payment-wc2.js    # Core logic WalletConnect
├── yield-farm-payment-final.js  # Core logic HTML
├── check-configuration.js       # 🔧 Setup check
├── collateral-calculator.js     # 🧮 Optimize collateral
└── test-realistic-payment.js    # 🧪 Test suite
```

## 🚀 NPM Scripts

```bash
npm start           # Show help for WalletConnect CLI
npm run wc          # Run WalletConnect CLI
npm run html        # Run HTML Wallet CLI  
npm run test        # Run test suite
npm run check       # Check configuration
npm run calc        # Calculate optimal collateral
```

## 💰 Monetization

- **Fee:** 0.2 USDC per transaction
- **Transparency:** Fee visible before user signs
- **Automatic:** Included in transaction batch
- **Value:** Skill maintenance and development

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/altoninelli/yield-farm-payment/issues)
- **Questions:** ClawHub discussions
- **WalletConnect:** https://cloud.walletconnect.com

---

**Ready to automate payments with modern wallet integration!** 🎯