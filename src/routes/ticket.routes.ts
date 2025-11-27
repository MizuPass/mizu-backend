import { Hono } from "hono";
import { 
  storeTicket,
  getUserTickets, 
  getEventTickets,
  verifyTicket,
  updateTicketStatus,
  getTicketStats,
  testConnection
} from "../services/ticket.service.supabase";
import type { TicketData } from "../services/ticket.service";

const ticketRouter = new Hono();

/**
 * POST /tickets - Store a new ticket
 * Body: { walletAddress: string, ticketData: TicketData }
 */
ticketRouter.post("/", async (c) => {
  try {
    const { walletAddress, ticketData } = await c.req.json() as {
      walletAddress: string;
      ticketData: TicketData;
    };

    console.log("[TicketRouter] Storing new ticket for:", walletAddress);

    // Validate required fields
    if (!walletAddress || !ticketData) {
      return c.json({
        success: false,
        error: "Missing walletAddress or ticketData"
      }, 400);
    }

    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({
        success: false,
        error: "Invalid wallet address format"
      }, 400);
    }

    // Store ticket
    const storedTicket = await storeTicket(walletAddress, ticketData);

    return c.json({
      success: true,
      data: storedTicket
    });
  } catch (error) {
    console.error("[TicketRouter] Error storing ticket:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to store ticket"
    }, 500);
  }
});

/**
 * GET /tickets/user/:walletAddress - Get all tickets for a user
 */
ticketRouter.get("/user/:walletAddress", async (c) => {
  try {
    const walletAddress = c.req.param("walletAddress");

    console.log("[TicketRouter] Fetching tickets for wallet:", walletAddress);

    // Validate wallet address
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({
        success: false,
        error: "Invalid wallet address"
      }, 400);
    }

    // Get user tickets
    const tickets = await getUserTickets(walletAddress);

    return c.json({
      success: true,
      data: tickets,
      count: tickets.length,
      userId: walletAddress
    });
  } catch (error) {
    console.error("[TicketRouter] Error fetching user tickets:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch tickets"
    }, 500);
  }
});

/**
 * GET /tickets/event/:eventAddress - Get all tickets for an event
 */
ticketRouter.get("/event/:eventAddress", async (c) => {
  try {
    const eventAddress = c.req.param("eventAddress");

    console.log("[TicketRouter] Fetching tickets for event:", eventAddress);

    // Validate event address
    if (!eventAddress || !eventAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({
        success: false,
        error: "Invalid event address"
      }, 400);
    }

    // Get event tickets
    const tickets = await getEventTickets(eventAddress);

    return c.json({
      success: true,
      data: tickets,
      count: tickets.length,
      eventAddress: eventAddress
    });
  } catch (error) {
    console.error("[TicketRouter] Error fetching event tickets:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch event tickets"
    }, 500);
  }
});

/**
 * GET /tickets/verify/:tokenId?eventAddress=... - Verify a specific ticket
 */
ticketRouter.get("/verify/:tokenId", async (c) => {
  try {
    const tokenId = c.req.param("tokenId");
    const eventAddress = c.req.query("eventAddress");

    console.log("[TicketRouter] Verifying ticket:", { tokenId, eventAddress });

    // Validate parameters
    if (!tokenId || !eventAddress) {
      return c.json({
        success: false,
        error: "Missing tokenId or eventAddress"
      }, 400);
    }

    if (!eventAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({
        success: false,
        error: "Invalid event address"
      }, 400);
    }

    // Verify ticket
    const ticket = await verifyTicket(eventAddress, tokenId);

    if (!ticket) {
      return c.json({
        success: false,
        error: "Ticket not found or invalid"
      }, 404);
    }

    return c.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error("[TicketRouter] Error verifying ticket:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify ticket"
    }, 500);
  }
});

/**
 * PUT /tickets/update/:ticketId - Update ticket status
 */
ticketRouter.put("/update/:ticketId", async (c) => {
  try {
    const ticketId = c.req.param("ticketId");
    const updates = await c.req.json();

    console.log("[TicketRouter] Updating ticket:", ticketId);

    // Validate ticket ID
    if (!ticketId) {
      return c.json({
        success: false,
        error: "Missing ticket ID"
      }, 400);
    }

    // Update ticket
    const updatedTicket = await updateTicketStatus(ticketId, updates);

    return c.json({
      success: true,
      data: updatedTicket
    });
  } catch (error) {
    console.error("[TicketRouter] Error updating ticket:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update ticket"
    }, 500);
  }
});

/**
 * GET /tickets/stats - Get ticket statistics
 */
ticketRouter.get("/stats", async (c) => {
  try {
    console.log("[TicketRouter] Fetching ticket stats");

    const stats = await getTicketStats();

    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("[TicketRouter] Error fetching stats:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch stats"
    }, 500);
  }
});

/**
 * GET /tickets/health - Test database connection
 */
ticketRouter.get("/health", async (c) => {
  try {
    console.log("[TicketRouter] Testing database connection");

    const isConnected = await testConnection();

    return c.json({
      success: isConnected,
      message: isConnected ? "Database connection successful" : "Database connection failed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[TicketRouter] Database health check failed:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Health check failed"
    }, 500);
  }
});

export default ticketRouter;