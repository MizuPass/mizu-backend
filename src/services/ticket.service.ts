import { join, dirname } from "path";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";

// Types for tickets
export interface TicketData {
  eventAddress: string;
  stealthAddress: string;
  stealthPrivateKey?: string; // Don't store in backend for privacy
  tokenId: string;
  ticketPrice: string;
  purchaseDate: string;
  mainWallet: string;
  purchaseTxHash: string;
  completeTxHash?: string;
  eventName: string;
  eventDate: string;
  ephemeralPublicKey?: string;
}

export interface StoredTicketData extends TicketData {
  id: string; // Backend-generated ID
  userId: string; // Wallet address for user identification
  isValid: boolean; // Ticket validity status
  createdAt: string; // Backend timestamp
  updatedAt: string; // Backend timestamp
}

// Simple file-based storage for now (can be replaced with real database later)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "..", "..", "data");
const TICKETS_FILE = join(DATA_DIR, "tickets.json");

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize tickets file if it doesn't exist
if (!existsSync(TICKETS_FILE)) {
  writeFileSync(TICKETS_FILE, JSON.stringify([]));
}

/**
 * Load all tickets from storage
 */
const loadTickets = (): StoredTicketData[] => {
  try {
    const data = readFileSync(TICKETS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("[TicketService] Error loading tickets:", error);
    return [];
  }
};

/**
 * Save tickets to storage
 */
const saveTickets = (tickets: StoredTicketData[]): void => {
  try {
    writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
  } catch (error) {
    console.error("[TicketService] Error saving tickets:", error);
    throw new Error("Failed to save tickets");
  }
};

/**
 * Generate unique ticket ID
 */
const generateTicketId = (): string => {
  return `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Store a new ticket
 */
export const storeTicket = async (
  walletAddress: string,
  ticketData: TicketData
): Promise<StoredTicketData> => {
  try {
    console.log("[TicketService] Storing ticket for wallet:", walletAddress);
    
    const tickets = loadTickets();
    
    // Create stored ticket data
    const storedTicket: StoredTicketData = {
      id: generateTicketId(),
      userId: walletAddress.toLowerCase(), // Normalize address
      isValid: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...ticketData,
      stealthPrivateKey: undefined, // Don't store private key in backend
    };
    
    // Add to tickets array
    tickets.push(storedTicket);
    
    // Save to file
    saveTickets(tickets);
    
    console.log(`[TicketService] Ticket stored with ID: ${storedTicket.id}`);
    return storedTicket;
  } catch (error) {
    console.error("[TicketService] Error storing ticket:", error);
    throw new Error("Failed to store ticket");
  }
};

/**
 * Get all tickets for a specific wallet address
 */
export const getUserTickets = async (walletAddress: string): Promise<StoredTicketData[]> => {
  try {
    console.log("[TicketService] Fetching tickets for wallet:", walletAddress);
    
    const tickets = loadTickets();
    const userTickets = tickets.filter(
      ticket => ticket.userId.toLowerCase() === walletAddress.toLowerCase()
    );
    
    console.log(`[TicketService] Found ${userTickets.length} tickets for wallet`);
    return userTickets;
  } catch (error) {
    console.error("[TicketService] Error fetching user tickets:", error);
    throw new Error("Failed to fetch user tickets");
  }
};

/**
 * Get all tickets for a specific event
 */
export const getEventTickets = async (eventAddress: string): Promise<StoredTicketData[]> => {
  try {
    console.log("[TicketService] Fetching tickets for event:", eventAddress);
    
    const tickets = loadTickets();
    const eventTickets = tickets.filter(
      ticket => ticket.eventAddress.toLowerCase() === eventAddress.toLowerCase()
    );
    
    console.log(`[TicketService] Found ${eventTickets.length} tickets for event`);
    return eventTickets;
  } catch (error) {
    console.error("[TicketService] Error fetching event tickets:", error);
    throw new Error("Failed to fetch event tickets");
  }
};

/**
 * Verify a specific ticket by token ID and event address
 */
export const verifyTicket = async (
  eventAddress: string,
  tokenId: string
): Promise<StoredTicketData | null> => {
  try {
    console.log("[TicketService] Verifying ticket:", { eventAddress, tokenId });
    
    const tickets = loadTickets();
    const ticket = tickets.find(
      t => t.eventAddress.toLowerCase() === eventAddress.toLowerCase() && 
           t.tokenId === tokenId
    );
    
    if (ticket) {
      console.log(`[TicketService] Ticket verified: ${ticket.id}`);
    } else {
      console.log("[TicketService] Ticket not found");
    }
    
    return ticket || null;
  } catch (error) {
    console.error("[TicketService] Error verifying ticket:", error);
    throw new Error("Failed to verify ticket");
  }
};

/**
 * Update ticket status (for organizer use)
 */
export const updateTicketStatus = async (
  ticketId: string,
  updates: Partial<StoredTicketData>
): Promise<StoredTicketData> => {
  try {
    console.log("[TicketService] Updating ticket:", ticketId);
    
    const tickets = loadTickets();
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    
    if (ticketIndex === -1) {
      throw new Error("Ticket not found");
    }
    
    // Update ticket
    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // Save updated tickets
    saveTickets(tickets);
    
    console.log(`[TicketService] Ticket updated: ${ticketId}`);
    return tickets[ticketIndex];
  } catch (error) {
    console.error("[TicketService] Error updating ticket:", error);
    throw new Error("Failed to update ticket");
  }
};

/**
 * Get ticket statistics
 */
export const getTicketStats = async (): Promise<{
  totalTickets: number;
  activeTickets: number;
  totalEvents: number;
  totalUsers: number;
}> => {
  try {
    const tickets = loadTickets();
    const uniqueEvents = new Set(tickets.map(t => t.eventAddress.toLowerCase()));
    const uniqueUsers = new Set(tickets.map(t => t.userId.toLowerCase()));
    
    return {
      totalTickets: tickets.length,
      activeTickets: tickets.filter(t => t.isValid).length,
      totalEvents: uniqueEvents.size,
      totalUsers: uniqueUsers.size,
    };
  } catch (error) {
    console.error("[TicketService] Error getting ticket stats:", error);
    throw new Error("Failed to get ticket stats");
  }
};