import { Address, getContract } from "viem";
import { 
  EVENT_REGISTRY_ADDRESS, 
  MIZUPASS_EVENT_REGISTRY_ABI,
  MIZUPASS_EVENT_CONTRACT_ABI 
} from "../config/Contracts";
import KaiganClient from "../config/KaiganClient";
import { getIPFSData, getIPFSImageUrl } from "../utils/pinata";
import { serializeBigInts } from "../utils";

export interface EventData {
  organizer: Address;
  ipfsHash: string;
  ticketIpfsHash: string;
  ticketPrice: bigint;
  maxTickets: bigint;
  ticketsSold: bigint;
  isActive: boolean;
  eventDate: bigint;
}

export interface ProcessedEventData extends EventData {
  eventId?: number;
  eventContract?: Address;
  eventMetadata?: any;
  ticketMetadata?: any;
  eventImageUrl?: string;
  ticketImageUrl?: string;
}

export interface EventDetails {
  eventData: EventData;
  eventContract: Address;
}

export const getAllActiveEvents = async (): Promise<ProcessedEventData[]> => {
  try {
    const contract = getContract({
      address: EVENT_REGISTRY_ADDRESS,
      abi: MIZUPASS_EVENT_REGISTRY_ABI,
      client: KaiganClient,
    });

    const result = await contract.read.getAllActiveEvents() as [bigint[], Address[], EventData[]];
    const [eventIds, eventContractAddresses, eventDataArray] = result;

    const processedEvents: ProcessedEventData[] = [];

    for (let i = 0; i < eventIds.length; i++) {
      const eventId = Number(eventIds[i]);
      const eventContract = eventContractAddresses[i];
      const eventData = eventDataArray[i];

      try {
        const processedEvent = await processEventData(eventData, eventId, eventContract);
        if (processedEvent) {
          processedEvents.push(processedEvent);
        }
      } catch (error) {
        console.error(`Error processing event ${eventId}:`, error);
      }
    }

    return serializeBigInts(processedEvents) as ProcessedEventData[];
  } catch (error) {
    console.error("Error fetching all active events:", error);
    throw error;
  }
};

export const getOrganizerActiveEvents = async (organizerAddress: Address): Promise<ProcessedEventData[]> => {
  try {
    const contract = getContract({
      address: EVENT_REGISTRY_ADDRESS,
      abi: MIZUPASS_EVENT_REGISTRY_ABI,
      client: KaiganClient,
    });

    const result = await contract.read.getOrganizerActiveEvents([organizerAddress]) as [bigint[], Address[], EventData[]];
    const [eventIds, eventContractAddresses, eventDataArray] = result;

    const processedEvents: ProcessedEventData[] = [];

    for (let i = 0; i < eventIds.length; i++) {
      const eventId = Number(eventIds[i]);
      const eventContract = eventContractAddresses[i];
      const eventData = eventDataArray[i];

      try {
        const processedEvent = await processEventData(eventData, eventId, eventContract);
        if (processedEvent) {
          processedEvents.push(processedEvent);
        }
      } catch (error) {
        console.error(`Error processing organizer event ${eventId}:`, error);
      }
    }

    return serializeBigInts(processedEvents) as ProcessedEventData[];
  } catch (error) {
    console.error("Error fetching organizer active events:", error);
    throw error;
  }
};

export const getEventDetails = async (eventId: number): Promise<ProcessedEventData | null> => {
  try {
    const contract = getContract({
      address: EVENT_REGISTRY_ADDRESS,
      abi: MIZUPASS_EVENT_REGISTRY_ABI,
      client: KaiganClient,
    });

    const result = await contract.read.getEventDetails([BigInt(eventId)]) as [EventData, Address];
    const [eventData, eventContract] = result;

    const processedEvent = await processEventData(eventData, eventId, eventContract);
    if (!processedEvent) {
      return null;
    }
    return serializeBigInts(processedEvent) as ProcessedEventData;
  } catch (error) {
    console.error(`Error fetching event details for ID ${eventId}:`, error);
    throw error;
  }
};

export const getEventDetailsByContract = async (eventContractAddress: Address): Promise<ProcessedEventData | null> => {
  try {
    const contract = getContract({
      address: eventContractAddress,
      abi: MIZUPASS_EVENT_CONTRACT_ABI,
      client: KaiganClient,
    });

    const eventData = await contract.read.getEventData() as EventData;
    const eventName = await contract.read.getEventName();
    const eventSymbol = await contract.read.getEventSymbol();

    const processedEvent = await processEventData(eventData, undefined, eventContractAddress);
    
    if (!processedEvent) {
      return null;
    }
    
    if (processedEvent.eventMetadata) {
      processedEvent.eventMetadata.name = eventName;
      processedEvent.eventMetadata.symbol = eventSymbol;
    }

    return serializeBigInts(processedEvent) as ProcessedEventData;
  } catch (error) {
    console.error(`Error fetching event details for contract ${eventContractAddress}:`, error);
    throw error;
  }
};

const processEventData = async (
  eventData: EventData, 
  eventId?: number, 
  eventContract?: Address
): Promise<ProcessedEventData | null> => {
  // Filter out test events
  if (eventData.ipfsHash === 'test') {
    console.warn(`Skipping test event ${eventId} with ipfsHash: ${eventData.ipfsHash}`);
    return null;
  }

  // Temporarily disable validation to test IPFS data fetching
  // const hasValidEventHash = !eventData.ipfsHash || isValidIPFSHash(eventData.ipfsHash);
  // const hasValidTicketHash = !eventData.ticketIpfsHash || isValidIPFSHash(eventData.ticketIpfsHash);
  
  
  // if (!hasValidEventHash || !hasValidTicketHash) {
  //   console.warn(`Skipping event ${eventId} due to invalid IPFS hashes - event: ${eventData.ipfsHash}, ticket: ${eventData.ticketIpfsHash}`);
  //   return null;
  // }

  const processedEvent: ProcessedEventData = {
    ...eventData,
    eventId,
    eventContract,
  };

  if (eventData.ipfsHash) {
    try {
      const eventIpfsData = await getIPFSData(eventData.ipfsHash);
      
      if (eventIpfsData && eventIpfsData.data) {
        processedEvent.eventMetadata = eventIpfsData.data as any;
        
        if (processedEvent.eventMetadata && processedEvent.eventMetadata.image) {
          console.log(processedEvent.eventMetadata.image, 'test')
          try {
            processedEvent.eventImageUrl = await getIPFSImageUrl(processedEvent.eventMetadata.image);
          } catch (imageError) {
            console.error(`Error processing event image for hash ${eventData.ipfsHash}:`, imageError);
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching event metadata for hash ${eventData.ipfsHash}:`, error);
    }
  }

  if (eventData.ticketIpfsHash) {
    try {
      const ticketIpfsData = await getIPFSData(eventData.ticketIpfsHash);
      if (ticketIpfsData && ticketIpfsData.data) {
        processedEvent.ticketMetadata = ticketIpfsData.data as any;
        
        if (processedEvent.ticketMetadata && processedEvent.ticketMetadata.image) {
          try {
            processedEvent.ticketImageUrl = await getIPFSImageUrl(processedEvent.ticketMetadata.image);
          } catch (imageError) {
            console.error(`Error processing ticket image for hash ${eventData.ticketIpfsHash}:`, imageError);
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching ticket metadata for hash ${eventData.ticketIpfsHash}:`, error);
    }
  }

  console.log(`🔍 [DEBUG] Final processed event ${eventId}:`, {
    eventImageUrl: processedEvent.eventImageUrl,
    ticketImageUrl: processedEvent.ticketImageUrl,
    hasEventMetadata: !!processedEvent.eventMetadata,
    hasTicketMetadata: !!processedEvent.ticketMetadata
  });
  
  return processedEvent;
};
