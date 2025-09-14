import {
  Address,
  formatEther,
  getAddress,
  getContract,
  encodePacked,
  keccak256,
} from "viem";
import {
  ENS_REGISTRY_ADDRESS,
  ENS_ADDRESS_RESOLVER,
  ENS_REVERSE_REGISTRAR_ADDRESS,
  ENS_ABI,
  ENS_RESOLVER_ABI,
  ENS_REVERSE_REGISTRAR_ABI,
  MIZUPASS_WALLET_ADDRESS,
} from "../config/Contracts";
import EnsClient from "../config/EnsClient";
import EnsWalletClient from "../config/EnsWalletClient";
import { ethers } from "ethers";
import { isVerifiedUser } from "./identity.service";

export const getENS = async (ensName: string): Promise<Address | null> => {
  try {
    console.log(`Attempting to resolve ENS name: ${ensName}`);

    // Resolve ENS name to Ethereum address
    const address = await EnsClient.getEnsAddress({
      name: ensName,
      universalResolverAddress: "0x3c85752a5d47DD09D677C645Ff2A938B38fbFEbA",
    });

    const name = namehash(ensName);
    console.log(`Namehash of ${ensName} is ${name}`);

    console.log(`ENS resolution result for ${ensName}:`, address);

    if (!address) {
      console.log(`No address found for ${ensName}`);
      return null;
    }

    const checksumAddress = getAddress(address);
    console.log(`Resolved ${ensName} to ${checksumAddress}`);
    return checksumAddress;
  } catch (error) {
    console.error(`Error resolving ENS name ${ensName}:`, error);
    // Don't throw error, return null instead for subdomain checking
    return null;
  }
};

/** Reverse: address -> ENS name (primary) */
export const getPrimaryEnsNameForAddress = async (address: `0x${string}`): Promise<string | null> => {
  try {
    console.log(`Attempting to resolve primary ENS name for address: ${address}`);

    const reverseName = await EnsClient.getEnsName({
      address,
      // Sepolia Universal Resolver
      universalResolverAddress: '0x3c85752a5d47DD09D677C645Ff2A938B38fbFEbA',
    });

    console.log(`Primary ENS name for ${address}:`, reverseName);
    return reverseName;
  } catch (error) {
    console.error(`Error resolving primary ENS name for address ${address}:`, error);
    return null;
  }
};

export const createSubEns = async (
  subdomainName: string,
  givenSubdomainAddress: `0x${string}`,
  parentDomain: string = "mizupass.eth"
) => {
  try {
    // Check if user is verified before allowing subdomain creation
    // const verified = await isVerifiedUser(givenSubdomainAddress);
    // if (!verified) {
    //   throw new Error(
    //     `User ${givenSubdomainAddress} is not verified. Only verified users can create sub-ENS domains.`
    //   );
    // }

    const subDomainaddressOwner = await getENS(subdomainName);
    if (subDomainaddressOwner) {
      throw new Error(`Subdomain ${subdomainName} already exists`);
    }
    // Get the ENS registry contract
    const registryContract = getContract({
      address: ENS_REGISTRY_ADDRESS,
      abi: ENS_ABI,
      client: EnsWalletClient,
    });

    const resolverContract = getContract({
      address: ENS_ADDRESS_RESOLVER,
      abi: ENS_RESOLVER_ABI,
      client: EnsWalletClient,
    });

    // Calculate the namehash of the parent domain
    const parentNamehash = namehash(parentDomain);

    const txSubnodeRecordParams = [
      parentNamehash,
      subdomainName,
      MIZUPASS_WALLET_ADDRESS,
      ENS_ADDRESS_RESOLVER,
      BigInt(0),
      0, // Fuses
      BigInt(0), // Expiry
    ];

    const fullNameHash = namehash(`${subdomainName}.mizupass.eth`);

    const txSetAddrParams = [fullNameHash, "60", givenSubdomainAddress];

    const txSubnodeRecord = await createTransactionSubnodeRecord(
      registryContract,
      txSubnodeRecordParams
    );
    const receiptRecord = await waitForTransactionWithRetry(txSubnodeRecord);

    const txSetAddr = await createTransactionSetAddr(
      resolverContract,
      txSetAddrParams
    );

    const receiptSetAddr = await waitForTransactionWithRetry(txSetAddr);

    const formatGasData = (receipt: any) => ({
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: formatEther(receipt.effectiveGasPrice),
      totalGasCost: formatEther(
        BigInt(receipt.gasUsed) * receipt.effectiveGasPrice
      ),
    });

    const recordGasData = formatGasData(receiptRecord);

    const setAddrGasData = formatGasData(receiptSetAddr);

    return {
      ens: `${subdomainName}.${parentDomain}`,
      owner: givenSubdomainAddress,
      primaryEnsSet: false,
      note: "Primary ENS must be set by the address owner directly via reverse registrar",
      transactions: {
        setSubnodeRecord: {
          hash: txSubnodeRecord,
          ...recordGasData,
        },
        setAddr: {
          hash: txSetAddr,
          ...setAddrGasData,
        },
      },
    };
  } catch (error) {
    console.error("Error creating subdomain:", error);
    throw error;
  }
};

const waitForTransactionWithRetry = async (
  hash: `0x${string}`,
  maxAttempts = 5,
  delayMs = 5000
) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const receipt = await EnsClient.waitForTransactionReceipt({ hash });
      return receipt;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      console.log(
        `Attempt ${attempt} failed. Retrying in ${delayMs / 1000} seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

async function createTransactionSubnodeRecord(
  registryContract: any,
  txParams: any
) {
  try {
    const tx = await registryContract.write.setSubnodeRecord(txParams);
    return tx;
  } catch (error) {
    console.error("Error creating createTransactionSubnodeRecord:", error);
    throw error;
  }
}

async function createTransactionSetAddr(resolverContract: any, txParams: any) {
  try {
    const tx = await resolverContract.write.setAddr(txParams);
    return tx;
  } catch (error) {
    console.error("Error creating createTransactionSetAddr:", error);
    throw error;
  }
}

// Helper function to calculate namehash
function namehash(name: string): string {
  let node =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  if (name) {
    const labels = name.split(".");
    for (let i = labels.length - 1; i >= 0; i--) {
      node = keccak256(
        encodePacked(
          ["bytes32", "bytes32"],
          [
            node as `0x${string}`,
            keccak256(encodePacked(["string"], [labels[i]])),
          ]
        )
      );
    }
  }
  return node;
}
