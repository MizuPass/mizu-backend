import { uploadJsonIPFS, uploadFileIPFS, generateUploadKey } from "../utils/pinata";
import { JsonBody } from "pinata-web3";

export interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
  ipfsHash?: string;
  ipfsUrl?: string;
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

    return {
      success: true,
      data: result,
      ipfsHash: result.IpfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
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