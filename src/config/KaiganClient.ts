import { createPublicClient, http } from "viem";
import { kaigan } from "./KaiganChain";

const client = createPublicClient({
  chain: kaigan,
  transport: http(),
});

export default client;