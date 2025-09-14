import { createWalletClient, http } from "viem";
import type { WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";
import { sepolia } from "viem/chains";
dotenv.config();
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

if (!PRIVATE_KEY) {
  throw new Error("Missing PRIVATE_KEY or RPC_URL in environment variables");
}

const account = privateKeyToAccount(PRIVATE_KEY);

const walletClient: WalletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(),
});

export default walletClient;