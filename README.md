# 🌾 YieldFarmPayment v1.2 — AgentPay Only

**AgentPay-first payment automation on Base.**
This skill prepares a batch of external-signing transactions so users never need to store a `PRIVATE_KEY` in `.env`.

Pay recipients immediately, collect a built-in 0.2 USDC fee, and deposit collateral into Aave V3 from the user wallet.

[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-blue)](https://clawhub.ai)
[![Base Network](https://img.shields.io/badge/Network-Base-0052FF)](https://base.org)
[![Aave V3](https://img.shields.io/badge/Integration-Aave%20V3-1B5AE3)](https://aave.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ⚠️ v1.2 — AgentPay Mode Only

This release supports **AgentPay Mode Only** with batch preparation for external wallet signing.
No `PRIVATE_KEY` is required or stored in `.env`.

## 🎯 What Problem Does This Solve?

Many payment automations ask users to store private keys locally. YieldFarmPayment now prepares a signed-ready transaction batch instead:
- **Developer fee**: 0.2 USDC fee is paid automatically in the batch
- **Seller payment**: requested USDC amount is sent to the recipient
- **Aave collateral**: the remaining collateral is deposited to Aave V3 from the user's wallet
- **External signing**: the user approves the batch in their wallet

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Base network wallet with ETH for gas
- USDC tokens for collateral

### Setup
```bash
npm install
cp .env.example .env
# Edit .env with your Base RPC and verify addresses
node scripts/check-configuration.js
```

### Dry-run first (recommended)
```bash
node scripts/cli.js --dry-run --amount 0.1 --recipient 0x... --user-wallet 0x... --collateral 10 --buffer 8
```

### Prepare AgentPay batch
```bash
node scripts/cli.js --amount 0.1 --recipient 0x... --user-wallet 0x... --collateral 10 --buffer 8
```

## ✨ Key Features

- **AgentPay Mode Only**: batch transaction preparation for external signing
- **Built-in fee**: 0.2 USDC developer fee included in batch
- **Flexible collateral**: 3x to 20x multiplier with configurable buffer
- **Aave V3 integration**: supply USDC collateral to Base Aave
- **No `PRIVATE_KEY` in `.env`**: external wallet signing only
- **Dry-run support**: simulate before preparing real batch

## 📘 Usage

### Simulate safely
```bash
node scripts/test-realistic-payment.js
```

### Check configuration
```bash
node scripts/check-configuration.js
```

### Batch preparation workflow
1. Run with `--dry-run` to verify values and collateral
2. Run without `--dry-run` to prepare the AgentPay batch
3. Sign the batch in your wallet
4. Broadcast and monitor on Base

### Example command
```bash
node scripts/cli.js --amount 0.1 --recipient 0x... --user-wallet 0x... --collateral 10 --buffer 8
```

## 🔧 Configuration

### Environment Variables
- `BASE_RPC_URL`: Base RPC endpoint
- `AAVE_V3_POOL_ADDRESS`: Aave V3 pool address on Base
- `USDC_ADDRESS`: USDC token address on Base
- `AAVE_USDC_TOKEN_ADDRESS`: aToken address for USDC on Base
- `SKILL_FEE_USDC`: fee per AgentPay transaction (default 0.2)
- `DEFAULT_COLLATERAL_MULTIPLIER`: default collateral multiplier
- `DEFAULT_BUFFER_PERCENTAGE`: default buffer percentage
- `ESTIMATED_APY`: yield estimation used for recovery calculations

## 🔒 Security

- Use a dedicated wallet with minimal funds
- Do not store mainnet private keys in source-controlled files
- Test on Base Sepolia before mainnet
- Verify contract addresses before executing

## 📄 License

MIT

**YieldFarmPayment v1.2** — AgentPay-first payment automation with Aave collateral recovery.


*Built with ❤️ for the OpenClaw community*
