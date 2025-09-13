import { Hono } from "hono";
import { ZKPassportService, VerifyRequest } from "../services/zkpassport.service";

const zkpassportRoutes = new Hono();
const zkpassportService = new ZKPassportService();

zkpassportRoutes.post("/verify", async (c) => {
  try {
    const body: VerifyRequest = await c.req.json();
    const result = await zkpassportService.verify(body);
    return c.json(result);
  } catch (error) {
    console.error("ZKPassport verification error:", error);
    return c.json({ error: "Verification failed" }, 500);
  }
});

export { zkpassportRoutes };