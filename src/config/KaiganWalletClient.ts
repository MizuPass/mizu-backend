import { createWalletClient, http } from "viem";
import type { WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";
import { kaigan } from "./KaiganChain";

dotenv.config();
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

if (!PRIVATE_KEY) {
  throw new Error("Missing PRIVATE_KEY in environment variables");
}

const account = privateKeyToAccount(PRIVATE_KEY);

const walletClient: WalletClient = createWalletClient({
  account,
  chain: kaigan,
  transport: http(),
});

export default walletClient;