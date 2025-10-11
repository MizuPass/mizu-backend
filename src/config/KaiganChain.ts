import { defineChain } from 'viem'

export const u2uTestnet = defineChain({
  id: 2484,
  name: 'U2U Nebulas Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'U2U',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-nebulas-testnet.u2u.xyz'],
      webSocket: ['wss://ws-nebulas-testnet.u2u.xyz'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'U2U Scan', 
      url: 'https://testnet.u2uscan.xyz' 
    },
  },
  testnet: true,
})

export const u2uMainnet = defineChain({
  id: 39,
  name: 'U2U Network Solaris',
  nativeCurrency: { 
    name: 'U2U', 
    symbol: 'U2U', 
    decimals: 18 
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mainnet.u2u.xyz'],
      webSocket: ['wss://ws-mainnet.u2u.xyz'],
    },
    public: {
      http: ['https://rpc-mainnet.u2u.xyz'],
      webSocket: ['wss://ws-mainnet.u2u.xyz'],
    },
    trace: {
      http: ['https://rpc-tracer-mainnet.u2u.xyz'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'U2U Scan', 
      url: 'https://u2uscan.xyz' 
    },
  },
})

// Export mainnet as default for production
export const kaigan = u2uMainnet