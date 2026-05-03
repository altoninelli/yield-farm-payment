---
name: yield-farm-payment
version: 1.2.0
author: altoninelli
description: "Agent-friendly payment automation! Transform your outgoing payments into a yield-generating asset. Auto recover of all paid amounts through yield farming on Aave V3. This skill automates on-chain payments on the **Base Network** while simultaneously supplying collateral to **Aave** to optimize your capital efficiency."
tags: ["DeFi", "Net Zero Cost", "Savings", "Payment", "Base network", "Automation", "Aave", "AgentPay"]
price_per_call: 0.2 USDC
requires:
  - viem
metadata:
  openclaw:
    emoji: "🌾"
    category: "DeFi Payments"
    reputation_required: "medium"
    security_level: "high-privilege"
    warning: "AgentPay mode requires external wallet signing. Use dedicated wallets with limited funds."
---

# YieldFarmPayment Skill v1.2

**Important Security Notice**

This skill supports **AgentPay Mode Only** (batch preparation for external wallet signing).

**Strongly recommended:**
- Use a **dedicated wallet** created only for this skill
- Fund it with **only the necessary amount** + small buffer for gas
- Never use your main wallet or a wallet containing significant funds
- Review batch transactions before signing in your wallet

Environment variables required:
- `BASE_RPC_URL`: Base Mainnet RPC URL
- No `PRIVATE_KEY` required (external signing only)

---

**DeFi Immediate Payment System with Capital Recovery via Aave V3**

Pay recipients immediately on Base network, then recover your capital over time through Aave V3 yield farming.

## ⚠️ v1.2 — AgentPay Mode Only

**v1.2 supports only AgentPay Mode** (batch preparation for external wallet signing).
Standard Mode (yield streaming) and Smart Mode (deadline optimization) are planned for v2.0 with x402 protocol integration.

## 🎯 Features

- **AgentPay Mode Only**: Batch transaction preparation for external wallet signing, no `PRIVATE_KEY` needed in `.env`
- **Fee Built In**: 0.2 USDC fee included in the prepared batch
- **Flexible Collateral**: 3x to 20x multiplier with configurable buffer (default: 20x)
- **Aave V3 Integration**: Deposit collateral to earn yield on Base network
- **Batch Transaction Flow**: developer fee + seller payment + Aave collateral deposit
- **Professional CLI**: Full-featured command line interface for simulation and batch preparation

## 💰 Monetization & Usage
- **Model:** Paid service via AgentPay
- **Cost:** 0.2 USDC per AgentPay transaction (built into the batch)
- **Network:** Base Mainnet

## 💰 How It Works (AgentPay)

### Payment Flow:
1. **Prepare a batch** of transactions in the skill
2. **Pay 0.2 USDC fee** to the developer address
3. **Pay the seller** the requested USDC amount
4. **Approve and deposit collateral** into Aave V3 from the user wallet
5. **The user signs the batch** with their external wallet

### Recovery Time Calculation:

**The amount to recover is the PAYMENT sent to the seller, not the total collateral.**

```
Recovery Time = Payment Amount / Annual Yield from Aave Deposit
```

### Example: 0.1 USDC payment, 20x collateral, 8% buffer, 3% APY

```
Total Locked:      0.1 × 20 × 1.08 = 2.16 USDC
Developer Fee:     0.20 USDC
Seller Payment:    0.10 USDC
Aave Deposit:      2.06 USDC
Annual Yield:      2.06 × 3% = 0.0618 USDC/year
Amount to Recover: 0.1 USDC
Recovery Time:     0.1 / 0.0618 ≈ 592 days (~1.6 years)
```

### Why Higher Collateral = Faster Recovery:

| Multiplier | Aave Deposit | Annual Yield | Recovery Time |
|------------|-------------|--------------|---------------|
| 3×         | 0.224 USDC  | 0.0067 USDC  | ~15 years     |
| 5×         | 0.440 USDC  | 0.0132 USDC  | ~7.5 years    |
| 10×        | 0.980 USDC  | 0.0294 USDC  | ~3.4 years    |
| 20×        | 1.86 USDC   | 0.0558 USDC  | ~1.8 years    |

More collateral deposited in Aave → more yield generated → faster recovery of the payment amount.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Base network wallet with ETH for gas
- USDC tokens for collateral

### Installation
```bash
cd your-project
npm install
```

### Configuration
1. Copy `.env.example` to `.env`
2. Set your `BASE_RPC_URL` and verify the Aave/Base contract addresses

### Usage
```bash
# Check configuration
node scripts/check-configuration.js

# Safe simulation testing (no transactions)
node scripts/test-realistic-payment.js

# Recommended workflow:
# Step 1: Test with dry-run first (no on-chain execution)
node scripts/cli.js --dry-run --amount 0.1 --recipient 0x... --user-wallet 0x... --collateral 5 --buffer 8

# Step 2: Prepare AgentPay batch for external wallet signing
node scripts/cli.js --amount 0.1 --recipient 0x... --user-wallet 0x... --collateral 5 --buffer 8

# Custom collateral multiplier
node scripts/cli.js --amount 0.5 --recipient 0x... --user-wallet 0x... --collateral 10 --buffer 5
```

## 📁 Project Structure

```
yield-farm-payment/
├── SKILL.md                    # This documentation
├── .env.example                # Configuration template
├── package.json                # Dependencies and skill metadata
├── scripts/
│   ├── cli.js                  # CLI interface (AgentPay-only)
│   ├── yield-farm-payment.js   # Core payment logic (active)
│   ├── collateral-calculator.js # Collateral optimization
│   ├── check-configuration.js  # Config validation
│   └── test-realistic-payment.js # Comprehensive tests
└── references/
    ├── aave-addresses.md       # Aave contract addresses
    └── v2.0-planned/           # Planned features for future release
        ├── 10x-collateral-guide.md
        ├── flexible-collateral-guide.md
        └── x402-integration.md
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Required
BASE_RPC_URL=https://...       # Base network RPC

# Aave V3 Contracts (Base)
AAVE_V3_POOL_ADDRESS=0xA238Dd80C259a72e81d7e4664a9801593F98d1c5
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
AAVE_USDC_TOKEN_ADDRESS=0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB

# Settings
SKILL_FEE_USDC=0.2
DEFAULT_COLLATERAL_MULTIPLIER=20
DEFAULT_BUFFER_PERCENTAGE=8
ESTIMATED_APY=0.03
```

## 🔒 Security & Safety

### Built-in Protections
- **Balance Verification**: Pre-transaction checks
- **Gas Limit Monitoring**: Prevents excessive fees
- **Transaction Retry**: 3 attempts with gas price escalation
- **Nonce Management**: Handles concurrent transactions

### Transaction Confirmation
- **AgentPay Mode**: Batch preparation with external wallet signing
- **Clear Transaction Preview**: Shows amount, recipient, collateral, and recovery estimates
- **Amount Limits**: Maximum 1000 USDC per transaction
- **Address Validation**: Verifies recipient and wallet addresses before execution

### CLI Safety Flags
```bash
# Test with dry-run first (RECOMMENDED)
node scripts/cli.js --dry-run --amount 0.1 --recipient 0x... --user-wallet 0x...

# AgentPay batch preparation
node scripts/cli.js --amount 0.1 --recipient 0x... --user-wallet 0x... --collateral 10 --buffer 8
```

### Risk Management
- **Collateral Buffer**: 5-15% safety margin
- **APY Estimation**: Conservative 3% default
- **Multiplier Limits**: 3x minimum, 20x maximum

## 🚨 Error Handling

### Common Errors & Solutions
- **"insufficient funds"**: Balance verification before transaction
- **"nonce too low"**: Automatic nonce management
- **Contract errors**: Detailed logging and fallback

## 📈 Roadmap

### v2.0 Planned
- **Standard Mode**: Yield streaming via x402 protocol
- **Smart Mode**: Deadline optimization
- **x402 Integration**: Trustless automatic yield distribution
- **Multi-token Support**: USDT, wETH, etc.

- **AgentPay Mode**: Batch transaction preparation for external wallet signing
- **Monetization**: 0.2 USDC fee per AgentPay transaction
- **Agent Automation**: Support for autonomous agent execution

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

**YieldFarmPayment v1.1** — Agent-friendly payments with capital recovery on Base network. 🚀
