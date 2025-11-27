import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { TicketData } from "./ticket.service";

// Database ticket format (snake_case)
export interface DatabaseTicketData extends TicketData {
  id: string; // Backend-generated ID
  user_id: string; // Wallet address for user identification (snake_case for PostgreSQL)
  is_valid: boolean; // Ticket validity status
  created_at: string; // Backend timestamp
  updated_at: string; // Backend timestamp
}

// API response format (camelCase for frontend)
export interface StoredTicketData extends TicketData {
  id: string; // Backend-generated ID
  userId: string; // Wallet address for user identification (camelCase for frontend)
  is_valid: boolean; // Ticket validity status
  created_at: string; // Backend timestamp
  updated_at: string; // Backend timestamp
}

// Database schema interface for type safety
export interface TicketsTable {
  Row: DatabaseTicketData;
  Insert: Omit<DatabaseTicketData, 'id' | 'created_at' | 'updated_at'> & {
    id?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<DatabaseTicketData>;
}

/**
 * Map database ticket format to frontend API format
 */
const mapDatabaseToApiFormat = (dbTicket: DatabaseTicketData): StoredTicketData => {
  const { user_id, ...rest } = dbTicket;
  return {
    ...rest,
    userId: user_id, // Map snake_case to camelCase
  };
};

export interface Database {
  public: {
    Tables: {
      tickets: TicketsTable;
    };
  };
}

// Supabase client instance
let supabase: SupabaseClient<Database> | null = null;

/**
 * Initialize Supabase client
 */
const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }

    supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
    console.log("[TicketService] ✅ Supabase client initialized with service role");
  }

  return supabase;
};

/**
 * Store a new ticket in Supabase PostgreSQL
 */
export const storeTicket = async (
  walletAddress: string,
  ticketData: TicketData
): Promise<StoredTicketData> => {
  try {
    console.log("[TicketService] Storing ticket for wallet:", walletAddress);
    
    const supabase = getSupabaseClient();
    
    // Prepare ticket data for database insertion
    const ticketInsert: TicketsTable["Insert"] = {
      user_id: walletAddress.toLowerCase(), // Normalize address
      is_valid: true,
      eventAddress: ticketData.eventAddress.toLowerCase(), // Normalize address
      stealthAddress: ticketData.stealthAddress.toLowerCase(), // Normalize address
      tokenId: ticketData.tokenId,
      ticketPrice: ticketData.ticketPrice,
      purchaseDate: ticketData.purchaseDate,
      mainWallet: ticketData.mainWallet.toLowerCase(), // Normalize address
      purchaseTxHash: ticketData.purchaseTxHash.toLowerCase(), // Normalize hash
      completeTxHash: (ticketData.completeTxHash || '').toLowerCase(), // Normalize hash
      eventName: ticketData.eventName,
      eventDate: ticketData.eventDate,
      ephemeralPublicKey: ticketData.ephemeralPublicKey || '',
      // Don't store private key in backend for privacy
      stealthPrivateKey: undefined,
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from("tickets")
      .insert(ticketInsert)
      .select()
      .single();
    
    if (error) {
      console.error("[TicketService] Supabase insert error:", error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data) {
      throw new Error("No data returned from database insert");
    }
    
    console.log(`[TicketService] ✅ Ticket stored with ID: ${data.id}`);
    return mapDatabaseToApiFormat(data);
  } catch (error) {
    console.error("[TicketService] Error storing ticket:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to store ticket");
  }
};

/**
 * Get all tickets for a specific wallet address
 */
export const getUserTickets = async (walletAddress: string): Promise<StoredTicketData[]> => {
  try {
    console.log("[TicketService] Fetching tickets for wallet:", walletAddress);
    
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", walletAddress.toLowerCase())
      .eq("is_valid", true)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("[TicketService] Supabase query error:", error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`[TicketService] ✅ Found ${data?.length || 0} tickets for wallet`);
    return (data || []).map(mapDatabaseToApiFormat);
  } catch (error) {
    console.error("[TicketService] Error fetching user tickets:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch user tickets");
  }
};

/**
 * Get all tickets for a specific event
 */
export const getEventTickets = async (eventAddress: string): Promise<StoredTicketData[]> => {
  try {
    console.log("[TicketService] Fetching tickets for event:", eventAddress);
    
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("eventAddress", eventAddress.toLowerCase())
      .eq("is_valid", true)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("[TicketService] Supabase query error:", error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`[TicketService] ✅ Found ${data?.length || 0} tickets for event`);
    return (data || []).map(mapDatabaseToApiFormat);
  } catch (error) {
    console.error("[TicketService] Error fetching event tickets:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch event tickets");
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
    
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("eventAddress", eventAddress.toLowerCase())
      .eq("tokenId", tokenId)
      .eq("is_valid", true)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("[TicketService] Supabase query error:", error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (data) {
      console.log(`[TicketService] ✅ Ticket verified: ${data.id}`);
    } else {
      console.log("[TicketService] ℹ️ Ticket not found");
    }
    
    return data ? mapDatabaseToApiFormat(data) : null;
  } catch (error) {
    console.error("[TicketService] Error verifying ticket:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to verify ticket");
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
    
    const supabase = getSupabaseClient();
    
    // Prepare updates with timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from("tickets")
      .update(updateData)
      .eq("id", ticketId)
      .select()
      .single();
    
    if (error) {
      console.error("[TicketService] Supabase update error:", error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data) {
      throw new Error("Ticket not found or update failed");
    }
    
    console.log(`[TicketService] ✅ Ticket updated: ${ticketId}`);
    return mapDatabaseToApiFormat(data);
  } catch (error) {
    console.error("[TicketService] Error updating ticket:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update ticket");
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
    const supabase = getSupabaseClient();
    
    // Get total tickets
    const { count: totalTickets, error: totalError } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true });
    
    // Get active tickets
    const { count: activeTickets, error: activeError } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("is_valid", true);
    
    // Get unique events
    const { data: eventData, error: eventError } = await supabase
      .from("tickets")
      .select("eventAddress")
      .eq("is_valid", true);
    
    // Get unique users
    const { data: userData, error: userError } = await supabase
      .from("tickets")
      .select("user_id")
      .eq("is_valid", true);
    
    if (totalError || activeError || eventError || userError) {
      const error = totalError || activeError || eventError || userError;
      console.error("[TicketService] Supabase stats error:", error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    const uniqueEvents = new Set(eventData?.map(t => t.eventAddress.toLowerCase()) || []);
    const uniqueUsers = new Set(userData?.map(t => t.user_id.toLowerCase()) || []);
    
    const stats = {
      totalTickets: totalTickets || 0,
      activeTickets: activeTickets || 0,
      totalEvents: uniqueEvents.size,
      totalUsers: uniqueUsers.size,
    };
    
    console.log("[TicketService] ✅ Stats computed:", stats);
    return stats;
  } catch (error) {
    console.error("[TicketService] Error getting ticket stats:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to get ticket stats");
  }
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("tickets")
      .select("count", { count: "exact", head: true });
    
    if (error) {
      console.error("[TicketService] Connection test failed:", error);
      return false;
    }
    
    console.log("[TicketService] ✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("[TicketService] Connection test error:", error);
    return false;
  }
};