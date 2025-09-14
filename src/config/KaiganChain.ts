import { defineChain } from 'viem'

const token = 'fe4hYU5C4Q8djb-5kghnnqIzNqdGGDurJ0tbWV93ZAU'

export const kaigan = defineChain({
  id: 5278000,
  name: 'Kaigan',
  nativeCurrency: {
    decimals: 18,
    name: 'J Ether',
    symbol: 'JETH',
  },
  rpcUrls: {
    default: {
      http: [`https://rpc.kaigan.jsc.dev/rpc?token=${token}`],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.kaigan.jsc.dev' },
  },
})