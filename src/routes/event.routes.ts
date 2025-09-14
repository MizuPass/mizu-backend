import { Hono } from "hono";
import { 
  getAllActiveEvents, 
  getOrganizerActiveEvents, 
  getEventDetails,
  getEventDetailsByContract 
} from "../services/event.service";

const eventRouter = new Hono();

eventRouter.get("/active", async (c) => {
  try {
    const events = await getAllActiveEvents();
    
    return c.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    console.error("Error fetching all active events:", error);
    return c.json({ 
      success: false,
      error: "Failed to fetch active events" 
    }, 500);
  }
});

eventRouter.get("/organizer/:organizerAddress/active", async (c) => {
  try {
    const organizerAddress = c.req.param("organizerAddress") as `0x${string}`;

    if (!organizerAddress || !organizerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({ 
        success: false,
        error: "Invalid Ethereum address" 
      }, 400);
    }

    const events = await getOrganizerActiveEvents(organizerAddress);
    
    return c.json({
      success: true,
      data: events,
      count: events.length,
      organizer: organizerAddress
    });
  } catch (error) {
    console.error("Error fetching organizer active events:", error);
    return c.json({ 
      success: false,
      error: "Failed to fetch organizer active events" 
    }, 500);
  }
});

eventRouter.get("/details/:eventId", async (c) => {
  try {
    const eventIdParam = c.req.param("eventId");
    const eventId = parseInt(eventIdParam);

    if (isNaN(eventId) || eventId < 0) {
      return c.json({ 
        success: false,
        error: "Invalid event ID" 
      }, 400);
    }

    const event = await getEventDetails(eventId);
    
    if (!event) {
      return c.json({ 
        success: false,
        error: "Event not found" 
      }, 404);
    }
    
    return c.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error("Error fetching event details:", error);
    return c.json({ 
      success: false,
      error: "Failed to fetch event details" 
    }, 500);
  }
});

eventRouter.get("/contract/:contractAddress", async (c) => {
  try {
    const contractAddress = c.req.param("contractAddress") as `0x${string}`;

    if (!contractAddress || !contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return c.json({ 
        success: false,
        error: "Invalid contract address" 
      }, 400);
    }

    const event = await getEventDetailsByContract(contractAddress);
    
    if (!event) {
      return c.json({ 
        success: false,
        error: "Event not found" 
      }, 404);
    }
    
    return c.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error("Error fetching event details by contract:", error);
    return c.json({ 
      success: false,
      error: "Failed to fetch event details" 
    }, 500);
  }
});

export default eventRouter;
