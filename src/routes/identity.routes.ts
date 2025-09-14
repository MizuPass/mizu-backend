import { Hono } from "hono";
import { isVerifiedUser, isZKPassportVerified, verifyMizuhikiSBT } from "../services/identity.service";

const identityRouter = new Hono();

identityRouter.get("/isVerified/:userAddress", async (c) => {
  try {
    const userAddress = c.req.param("userAddress") as `0x${string}`;

    if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({ error: "Invalid Ethereum address" }, 400);
    }

    const verified = await isVerifiedUser(userAddress);

    return c.json({
      userAddress,
      isVerified: verified
    });
  } catch (error) {
    console.error("Error checking user verification:", error);
    return c.json({ error: "Failed to check user verification" }, 500);
  }
});

identityRouter.get("/isZKPassportVerified/:userAddress", async (c) => {
  try {
    const userAddress = c.req.param("userAddress") as `0x${string}`;

    if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({ error: "Invalid Ethereum address" }, 400);
    }

    const verified = await isZKPassportVerified(userAddress);

    return c.json({
      userAddress,
      isZKPassportVerified: verified
    });
  } catch (error) {
    console.error("Error checking ZK passport verification:", error);
    return c.json({ error: "Failed to check ZK passport verification" }, 500);
  }
});

identityRouter.get("/verifyMizuhikiSBT/:userAddress", async (c) => {
  try {
    const userAddress = c.req.param("userAddress") as `0x${string}`;

    if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({ error: "Invalid Ethereum address" }, 400);
    }

    const verified = await verifyMizuhikiSBT(userAddress);

    return c.json({
      userAddress,
      mizuhikiSBTVerified: verified
    });
  } catch (error) {
    console.error("Error verifying Mizuhiki SBT:", error);
    return c.json({ error: "Failed to verify Mizuhiki SBT" }, 500);
  }
});

export default identityRouter;