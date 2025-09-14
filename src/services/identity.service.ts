import { Address, getContract } from "viem";
import { MIZUPASS_IDENTITY_ADDRESS, MIZUPASS_IDENTITY_ABI } from "../config/Contracts";
import KaiganClient from "../config/KaiganClient";

export const isVerifiedUser = async (userAddress: Address): Promise<boolean> => {
  try {
    const contract = getContract({
      address: MIZUPASS_IDENTITY_ADDRESS,
      abi: MIZUPASS_IDENTITY_ABI,
      client: KaiganClient,
    });
    console.log("Checking verification for contract:", contract);

    const verified = await contract.read.isVerifiedUser([userAddress]);

    return verified as boolean;
  } catch (error) {
    console.error("Error checking user verification:", error);
    throw error;
  }
};

export const isZKPassportVerified = async (userAddress: Address): Promise<boolean> => {
  try {
    const contract = getContract({
      address: MIZUPASS_IDENTITY_ADDRESS,
      abi: MIZUPASS_IDENTITY_ABI,
      client: KaiganClient,
    });

    const verified = await contract.read.isZKPassportVerified([userAddress]);

    return verified as boolean;
  } catch (error) {
    console.error("Error checking ZK passport verification:", error);
    throw error;
  }
};

export const verifyMizuhikiSBT = async (userAddress: Address): Promise<boolean> => {
  try {
    const contract = getContract({
      address: MIZUPASS_IDENTITY_ADDRESS,
      abi: MIZUPASS_IDENTITY_ABI,
      client: KaiganClient,
    });

    const verified = await contract.read.verifyMizuhikiSBT([userAddress]);

    return verified as boolean;
  } catch (error) {
    console.error("Error verifying Mizuhiki SBT:", error);
    throw error;
  }
};