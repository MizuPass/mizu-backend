import { uploadJsonIPFS, uploadFileIPFS, generateUploadKey } from "../utils/pinata";
import { JsonBody } from "pinata-web3";

export interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
  ipfsHash?: string;
  ipfsUrl?: string;
  ipfsHashTicket?: string;
  ipfsUrlTicket?: string;
}

export const uploadJsonToIPFS = async (jsonData: JsonBody): Promise<UploadResult> => {
  try {
    const keyData = await generateUploadKey();
    if (!keyData || !keyData.JWT) {
      return {
        success: false,
        error: "Failed to generate upload key"
      };
    }

    const result = await uploadJsonIPFS(jsonData, keyData.JWT);
    
    if (!result) {
      return {
        success: false,
        error: "Failed to upload JSON to IPFS"
      };
    }

    const ticketMetadata = {
      name: `${jsonData.name} - MizuPass Ticket`,
      description: `${jsonData.description} - MizuPass Ticket`,
      image: "bafybeifkarbtly5agll2baru4ej7q2fe2hwhwkugu6pk2qihchtzrnlbxy",
      external_url: `https://gateway.pinata.cloud/ipfs/bafybeifkarbtly5agll2baru4ej7q2fe2hwhwkugu6pk2qihchtzrnlbxy`
    };

    const ticketKeyData = await generateUploadKey();
    if (!ticketKeyData || !ticketKeyData.JWT) {
      return {
        success: false,
        error: "Failed to generate upload key for ticket metadata"
      };
    }

    const ticketResult = await uploadJsonIPFS(ticketMetadata, ticketKeyData.JWT);
    
    if (!ticketResult) {
      return {
        success: false,
        error: "Failed to upload ticket metadata to IPFS"
      };
    }

    return {
      success: true,
      data: result,
      ipfsHash: result.IpfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      ipfsHashTicket: ticketResult.IpfsHash,
      ipfsUrlTicket: `https://gateway.pinata.cloud/ipfs/${ticketResult.IpfsHash}`
    };
  } catch (error) {
    console.error("Error uploading JSON to IPFS:", error);
    return {
      success: false,
      error: "Failed to upload JSON to IPFS"
    };
  }
};

export const uploadFileToIPFS = async (file: File): Promise<UploadResult> => {
  try {
    const keyData = await generateUploadKey();
    if (!keyData || !keyData.JWT) {
      return {
        success: false,
        error: "Failed to generate upload key"
      };
    }

    const result = await uploadFileIPFS(file, keyData.JWT);
    
    if (!result) {
      return {
        success: false,
        error: "Failed to upload file to IPFS"
      };
    }

    return {
      success: true,
      data: result,
      ipfsHash: result.IpfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    };
  } catch (error) {
    console.error("Error uploading file to IPFS:", error);
    return {
      success: false,
      error: "Failed to upload file to IPFS"
    };
  }
};