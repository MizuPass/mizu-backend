import { Hono } from "hono";
import { getENS, createSubEns, getPrimaryEnsNameForAddress } from "../services/ens.service";
import { isVerifiedUser } from "../services/identity.service";

const ensRoutes = new Hono();

const validateApiKey =
  (apiKey: string) => async (c: any, next: () => Promise<void>) => {
    const providedKey = c.req.header("X-API-Key");
    if (!providedKey || providedKey !== apiKey) {
      return c.json(
        { success: false, error: "Unauthorized: Invalid or missing API key" },
        401
      );
    }
    await next();
  };

const API_KEY = process.env.API_KEY as string;

ensRoutes.get("/", async (c) => {
  const ensName = c.req.query("ensName")?.toString() || "mizupass.eth";
  let ensData = await getENS(ensName);

  if (!ensData) {
    return c.json(
      { success: false, error: "No address found for ENS name" },
      400
    );
  }
  return c.json({
    success: true,
    ensWalletAddress: ensData,
  });
});

ensRoutes.get("/checkSubdomain/:subdomain", async (c) => {
  try {
    const subdomain = c.req.param("subdomain");
    const addressLookup = c.req.query("address") as `0x${string}` | undefined;

    if (addressLookup) {
      // Address lookup mode: reverse ENS resolution
      if (!/^0x[a-fA-F0-9]{40}$/.test(addressLookup)) {
        return c.json({
          success: false,
          error: "Invalid Ethereum address format"
        }, 400);
      }

      const primaryEnsName = await getPrimaryEnsNameForAddress(addressLookup);
      const isUserVerified = await isVerifiedUser(addressLookup);

      return c.json({
        success: true,
        address: addressLookup,
        primaryEnsName: primaryEnsName,
        hasPrimaryEns: !!primaryEnsName,
        isVerified: isUserVerified
      });
    } else {
      // Original subdomain lookup mode
      const fullEnsName = `${subdomain}.mizupass.eth`;
      const resolvedAddress = await getENS(fullEnsName);

      let isUserVerified = false;
      if (resolvedAddress) {
        isUserVerified = await isVerifiedUser(resolvedAddress);
      }

      return c.json({
        success: true,
        subdomain: fullEnsName,
        exists: !!resolvedAddress,
        resolvedAddress: resolvedAddress || null,
        isVerified: isUserVerified
      });
    }
  } catch (error) {
    console.error("Error checking subdomain:", error);
    return c.json({
      success: false,
      error: "Failed to check subdomain status"
    }, 500);
  }
});

ensRoutes.post("/createSubEns", validateApiKey(API_KEY), async (c) => {
  const body: any = await c.req.json();
  const subdomain = body.subdomain as string;
  const givenSubdomainAddress = body.givenSubdomainAddress as `0x${string}`;

  if (!subdomain) {
    return c.json(
      { success: false, error: "Subdomain parameter is required" },
      400
    );
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(givenSubdomainAddress)) {
    return c.json(
      { success: false, error: "Invalid Ethereum address format" },
      400
    );
  }
  try {
    let ensData = await createSubEns(subdomain, givenSubdomainAddress);
    return c.json({ success: true, ens: ensData });
  } catch (error) {
    console.error("Error in createSubEns:", error);
    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

export {ensRoutes};