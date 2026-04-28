---
name: YieldFarmPayment
version: 1.0.5
author: altoninelli
description: "Pay any seller at ZERO net cost. Our high-efficiency logic on Base L2 offsets network fees by pairing payments with low-risk, stablecoin-based yield investments. Achieve professional-grade Net-Zero transactions with automated cost recovery."
tags: ["DeFi", "Net Zero Cost", "Savings", "Payment", "Base network", "Automation", "Aave"]
price_per_call: 0.20 USDC
requires:
  - viem
metadata:
  openclaw:
    emoji: "🌾"
    category: "DeFi Payments"
    reputation_required: "medium"
    security_level: "high-privilege"
    warning: "Requires raw PRIVATE_KEY of a dedicated, low-balance wallet. Use only with a wallet containing limited funds."
---

# YieldFarmPayment Skill v1.0.5

**Important Security Notice**

This skill requires the user to provide a **raw PRIVATE_KEY** in the `.env` file.  
**This grants full control of the wallet to the skill.**

**Strongly recommended:**
- Use a **dedicated wallet** created only for this skill
- Fund it with **only the necessary amount** + small buffer for gas
- Never use your main wallet or a wallet containing significant funds

Environment variables required:
- `PRIVATE_KEY`: Private key of dedicated wallet
- `BASE_RPC_URL`: Base Mainnet RPC URL

---

**DeFi Immediate Payment System with Capital Recovery via Aave V3**

Pay recipients immediately on Base network, then recover your capital over time through Aave V3 yield farming.

## ⚠️ v1.0.5 — Upfront Mode Only

**v1.0 supports only Upfront Mode** (immediate payment to recipient).
Standard Mode (yield streaming) and Smart Mode (deadline optimization) are planned for v2.0 with x402 protocol integration.

## 🎯 Features

- **Upfront Mode**: Immediate USDC payment to recipient + capital recovery via yield
- **Flexible Collateral**: 3x to 20x multiplier with configurable buffer (default: 20x)
- **Aave V3 Integration**: Deposit collateral to earn yield on Base network
- **Robust Transaction Handling**: Automatic retry, gas optimization, error recovery
- **Professional CLI**: Full-featured command line interface

## 💰 How It Works (Upfront Mode)

### Payment Flow:
1. **Calculate total collateral**: `payment × multiplier × (1 + buffer%)`
2. **Transfer payment immediately** to recipient (seller gets paid NOW)
3. **Deposit remaining collateral** in Aave V3
4. **Yield accumulates** on deposited collateral
5. **Buyer recovers the payment amount** over time via yield

### Recovery Time Calculation:

**The amount to recover is the PAYMENT (sent to seller), NOT the total collateral.**

```
Recovery Time = Payment Amount / Annual Yield from Aave Deposit
```

### Example: 0.1 USDC payment, 20x collateral, 8% buffer, 3% APY

```
Total Locked:      0.1 × 20 × 1.08 = 2.16 USDC
Immediate Payment: 0.1 USDC → sent to recipient
Aave Deposit:      2.16 - 0.1 = 2.06 USDC
Annual Yield:      2.06 × 3% = 0.0618 USDC/year
Amount to Recover: 0.1 USDC (the payment, NOT the collateral)
Recovery Time:     0.1 / 0.0618 ≈ 592 days (~1.6 years)
```

### Why Higher Collateral = Faster Recovery:

| Multiplier | Aave Deposit | Annual Yield | Recovery Time |
|------------|-------------|--------------|---------------|
| 3×         | 0.224 USDC  | 0.0067 USDC  | ~15 years     |
| 5×         | 0.440 USDC  | 0.0132 USDC  | ~7.5 years    |
| 10×        | 0.980 USDC  | 0.0294 USDC  | ~3.4 years    |
| 20×        | 2.060 USDC  | 0.0618 USDC  | ~1.6 years    |

More collateral deposited in Aave → more yield generated → faster recovery of the payment amount.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Base network wallet with ETH for gas
- USDC tokens for collateral

### Installation
```bash
cd your-project
npm install viem dotenv
```

### Configuration
1. Copy `.env.example` to `.env`
2. Set your `PRIVATE_KEY` and `BASE_RPC_URL`
3. Verify contract addresses for Base network

### Usage
```bash
# Check configuration
node scripts/check-configuration.js

# Safe simulation testing (no transactions)
node scripts/test-realistic-payment.js

# Upfront payment with default 20x collateral
node scripts/cli.js --amount 0.1 --recipient 0x... --buffer 8

# Custom collateral multiplier
node scripts/cli.js --mode upfront --amount 0.5 --recipient 0x... --collateral 10 --buffer 5
```

## 📁 Project Structure

```
yield-farm-payment/
├── SKILL.md                    # This documentation
├── .env.example                # Configuration template
├── package.json                # Dependencies
├── scripts/
│   ├── cli.js                  # CLI interface (upfront mode only in v1.0)
│   ├── yield-farm-payment-corrected.js  # Core payment logic (active)
│   ├── transaction-manager.js  # Robust transaction handling
│   ├── collateral-calculator.js # Collateral optimization
│   ├── check-configuration.js  # Config validation
│   └── test-realistic-payment.js # Comprehensive tests
└── references/
    ├── aave-addresses.md       # Aave contract addresses (v1.0)
    └── v2.0-planned/           # Planned features for future release
        ├── 10x-collateral-guide.md
        ├── flexible-collateral-guide.md
        └── x402-integration.md
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Required
PRIVATE_KEY=0x...              # Your wallet private key
BASE_RPC_URL=https://...       # Base network RPC

# Aave V3 Contracts (Base)
AAVE_V3_POOL_ADDRESS=0x794a61358D6845594F94dc1DB02A252b5b4814aD
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
AAVE_USDC_TOKEN_ADDRESS=0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB

# Settings
SKILL_FEE_USDC=0.20            # Fee per skill call
DEFAULT_COLLATERAL_MULTIPLIER=20  # 20x default for ~1.6 year recovery
DEFAULT_BUFFER_PERCENTAGE=8
ESTIMATED_APY=0.03             # 3% conservative APY estimate
```

## 🔒 Security & Safety

### Built-in Protections
- **Balance Verification**: Pre-transaction checks
- **Gas Limit Monitoring**: Prevents excessive fees
- **Transaction Retry**: 3 attempts with gas price escalation
- **Nonce Management**: Handles concurrent transactions

### Risk Management
- **Collateral Buffer**: 5-15% safety margin
- **APY Estimation**: Conservative 3% default
- **Multiplier Limits**: 3x minimum, 20x maximum

## 🚨 Error Handling

### Common Errors & Solutions
- **"replacement transaction underpriced"**: Automatic retry with increased gas
- **"insufficient funds"**: Balance verification before transaction
- **"nonce too low"**: Automatic nonce management
- **Contract errors**: Detailed logging and fallback

## 📈 Roadmap

### v2.0 Planned Features
- **Standard Mode**: Yield streaming via x402 protocol
- **Smart Mode**: Deadline optimization
- **x402 Integration**: Trustless automatic yield distribution to sellers
- **Multi-token Support**: USDT, wETH, etc.

## 📄 License

MIT License

## 🙏 Acknowledgments

- **Aave Protocol** for yield farming infrastructure
- **Base Network** for low-cost L2 execution
- **OpenClaw Community** for skill development framework

---

**YieldFarmPayment v1.0** — Immediate payments with capital recovery on Base network. 🚀
