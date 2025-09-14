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

      const processedEvent = await processEventData(eventData, eventId, eventContract);
      processedEvents.push(processedEvent);
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

      const processedEvent = await processEventData(eventData, eventId, eventContract);
      processedEvents.push(processedEvent);
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
): Promise<ProcessedEventData> => {
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
          processedEvent.eventImageUrl = await getIPFSImageUrl(processedEvent.eventMetadata.image);
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
          processedEvent.ticketImageUrl = await getIPFSImageUrl(processedEvent.ticketMetadata.image);
        }
      }
    } catch (error) {
      console.error(`Error fetching ticket metadata for hash ${eventData.ticketIpfsHash}:`, error);
    }
  }

  return processedEvent;
};
