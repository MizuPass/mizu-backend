# 🎟️ MizuPass Backend - VietBUIDL Hackathon

> **Privacy-First Universal Ticketing Platform**
> Compliant, privacy-preserving ticketing with seamless U2U-to-pUSDT payments and universal KYC verification

## 🏆 Hackathon Track
- 🚀 **User Application Track** (DeFi/SocialFi/RWA) - VietBUIDL Hackathon

## 🚀 What is MizuPass?

MizuPass bridges the gap between regulatory compliance and user privacy by creating the first ticketing platform that:

✅ **Universal KYC**: ZK Passport (International) verification
✅ **Private Payments**: Stealth addresses + ZK payment proofs
✅ **DEX Integration**: Direct U2U payments with pUSDT/USDT
✅ **Privacy-First**: Vietnamese market focus with global privacy standards

## 🔧 Quick Start

### Install Dependencies
```bash
bun install
```

### Development Mode
```bash
bun run dev
```

### Build & Deploy
```bash
bun run build
bun run start
```

## 🛡️ ZKPassport Verification API

### POST `/api/zkpassport/verify`

**Purpose**: Verify international users via ZK Passport without revealing personal data

**Request:**
```json
{
  "queryResult": {},
  "proofs": [],
  "domain": "mizupass.xyz"
}
```

**Response:**
```json
{
  "registered": true,
  "verified": true,
  "uniqueIdentifier": "11525524...443940"
}
```

**Integration Flow:**
1. 🔐 User submits passport → ZK proof generation
2. ✅ Backend verifies proof → returns `uniqueIdentifier`
3. 🏪 Frontend calls smart contract with identifier
4. 🎫 User can purchase tickets with full privacy

## 🌐 Health Check

### GET `/health`
```bash
curl http://localhost:3000/health
```

## 🎯 Hackathon Innovation

### Privacy & Security Features
- **Zero-Knowledge Proofs**: Verify identity without revealing data
- **Stealth Addresses**: Unlinkable payment recipients
- **Privacy Pools**: Transaction mixing for enhanced anonymity
- **Selective Disclosure**: Minimal data exposure for compliance

### Financial Innovation
- **Cross-Border Seamless**: Same UX for Vietnamese + international users
- **Auto-Currency Swap**: U2U → pUSDT via DEX integration
- **Sub-3% Fees**: Revolutionary cost reduction vs traditional platforms
- **Smart Resale Controls**: Programmable ticket resale with price caps

## 🏗️ Architecture Integration

```
Frontend → ZKPassport Backend → Smart Contracts → U2U Network
    ↓              ↓                    ↓
Privacy UX → Identity Verify → On-Chain Registration → Ticket Purchase
```

## 📊 Demo Metrics

- **Verification Speed**: < 30 seconds end-to-end
- **Payment Flow**: U2U → pUSDT automatic conversion
- **Privacy Level**: Zero transaction correlation possible
- **Compliance**: Vietnamese market privacy standards

## 🎪 Next Steps

1. **Smart Contract Integration**: Connect with deployed MizuPassIdentity contract
2. **Mobile PWA**: Offline-capable ticket management
3. **Event Partnerships**: Vietnamese event organizer onboarding
4. **Advanced Privacy**: Enhanced stealth address system

---

**Built for VietBUIDL Hackathon**
*Revolutionizing event ticketing with privacy, compliance, and seamless Web3 UX*

🔗 **Smart Contracts**: `../mizu-contracts/`
📱 **Demo**: `mizupass.com
💬 **Team**: `@mizupass_team`