---
name: yield-farm-payment
version: 2.0.0
author: altoninelli
description: "Payments with total paid amount auto recovery through yield farming on Aave. Automated process. Modern payment automation with WalletConnect v2.0! Connect your wallet via QR code or browser UI. Pay recipients immediately while earning yield on Aave V3. Supports WalletConnect, HTML fallback, and manual modes."
tags: ["DeFi", "Payments", "WalletConnect", "Aave", "Base", "QR Code", "Yield Farming", "Web3", "Automation"]
price_per_call: 0.2 USDC
requires:
  - viem
metadata:
  openclaw:
    emoji: "🌾"
    category: "DeFi Payments"
    reputation_required: "low"
    security_level: "user-wallet"
    warning: "User signs transactions in their own wallet via WalletConnect. No private keys stored."
---

# YieldFarmPayment Skill v2.0 🚀

**Modern wallet connection with WalletConnect v2.0 + HTML fallback**

Connect your wallet via QR code in terminal or browser UI. Pay recipients on Base network while automatically recovering capital through Aave V3 yield farming.

## ✨ What's New in v2.0

- **WalletConnect v2.0** - Scan QR code with any mobile wallet
- **HTML Fallback** - Browser-based UI for desktop users  
- **3 Execution Modes** - Choose your preferred workflow
- **No Private Keys** - User signs in their own wallet
- **Modern UX** - QR code + Web3Modal integration

## 🎯 Features

- **WalletConnect v2.0** - Industry-standard wallet connection
- **HTML Fallback** - Browser UI with Web3Modal
- **Manual Mode** - JSON export for Revoke.cash
- **0.2 USDC Fee** - Built-in developer fee (visible before signing)
- **Aave V3 Integration** - Deposit collateral to earn yield
- **Base Network** - Low fees, fast transactions
- **Dry-run Mode** - Test calculations without executing
- **Flexible Collateral** - 3x to 20x multiplier with buffer

## 💰 Monetization

- **Cost:** 0.2 USDC per transaction
- **Transparent:** Fee shown before user signs
- **Automatic:** Included in transaction batch
- **Network:** Base Mainnet (USDC)

## 🔧 Setup

### Required Environment Variables

```bash
# WalletConnect Project ID (FREE from cloud.walletconnect.com)
WALLETCONNECT_PROJECT_ID=your_project_id_here

# Base Mainnet RPC
BASE_RPC_URL=https://mainnet.base.org

# Contract addresses (Base Mainnet)
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
AAVE_V3_POOL_ADDRESS=0xA238Dd80C259a72e81d7e4664a9801593F98d1c5
```

### Quick Setup

```bash
npm install
cp .env.example .env
# Edit .env with your WalletConnect Project ID
node scripts/check-configuration.js
```

## 🚀 Quick Start

### 1. Dry-run first (recommended)
```bash
node scripts/cli-wc2.js --dry-run --amount 0.1 --recipient 0x...
```

### 2. WalletConnect Mode (QR code)
```bash
node scripts/cli-wc2.js --walletconnect --amount 0.1 --recipient 0x...
```
**Flow:**
1. Terminal shows QR code
2. Scan with mobile wallet (or click link)
3. Approve connection
4. Sign 3 transactions in wallet

### 3. HTML Wallet Mode (browser)
```bash
node scripts/cli-final.js --html-wallet --amount 0.1 --recipient 0x...
```
**Flow:**
1. CLI generates HTML file
2. Open in browser
3. Connect wallet via Web3Modal
4. Sign transactions

### 4. Manual Mode (advanced)
```bash
node scripts/cli-wc2.js --manual --amount 0.1 --recipient 0x...
```
**Flow:**
1. Save transactions as JSON
2. Import to Revoke.cash
3. Execute manually

## 🎯 How It Works

### Payment Flow

1. **User connects wallet** via QR code or browser
2. **3 transactions prepared:**
   - 0.2 USDC → Developer fee
   - Payment amount → Recipient
   - Collateral amount → Aave V3
3. **User approves each transaction** in their wallet
4. **Transactions execute** on Base network
5. **Capital recovers over time** via Aave yield

### Recovery Calculation

**Example:** 0.1 USDC payment, 20x collateral, 8% buffer, 3% APY

```
Total Locked:      0.1 × 20 × 1.08 = 2.16 USDC
Developer Fee:     0.20 USDC
Payment:           0.10 USDC → Recipient
Aave Deposit:      1.86 USDC
Annual Yield:      1.86 × 3% = 0.0558 USDC/year
Daily Yield:       0.0558 / 365 = 0.000153 USDC/day
Recovery Time:     0.1 / 0.000153 ≈ 654 days
```

### Why Higher Collateral = Faster Recovery

| Multiplier | Aave Deposit | Annual Yield | Recovery Time |
|------------|-------------|--------------|---------------|
| 3×         | 0.224 USDC  | 0.0067 USDC  | ~15 years     |
| 10×        | 0.980 USDC  | 0.0294 USDC  | ~3.4 years    |
| 20×        | 1.86 USDC   | 0.0558 USDC  | ~1.8 years    |

More collateral = more yield = faster recovery!

## 🔧 Utility Scripts

### Check Configuration
```bash
node scripts/check-configuration.js
```

### Collateral Calculator
```bash
node scripts/collateral-calculator.js --amount 0.1 --deadline 90
```

### Test Suite
```bash
node scripts/test-realistic-payment.js
```

## 💡 Tips & Best Practices

1. **Start with --dry-run** to verify calculations
2. **Use small amounts** for first tests (0.01 USDC)
3. **WalletConnect QR code** works best with mobile wallets
4. **HTML mode** for desktop browser wallets (MetaMask, etc.)
5. **Manual mode** for batch execution via Revoke.cash
6. **Check gas prices** before executing large amounts

## 🛡️ Security

- **No private keys** stored or required
- **User signs** all transactions in their own wallet
- **Fee transparency** - 0.2 USDC shown before signing
- **WalletConnect v2.0** - Industry standard
- **Base Mainnet** - Secure, audited network

## 🤝 Support

- **Issues:** GitHub repository
- **Questions:** ClawHub discussion
- **WalletConnect:** https://cloud.walletconnect.com

## 📄 License

MIT License - See LICENSE file for details.

---

**Ready to automate payments with yield farming recovery!** 🚀