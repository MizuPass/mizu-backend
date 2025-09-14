import { PinataSDK, JsonBody } from "pinata-web3";

if (!process.env.PINATA_JWT) {
    throw new Error("PINATA_JWT environment variable is not set");
}

if (!process.env.PINATA_GATEWAY) {
    throw new Error("PINATA_GATEWAY environment variable is not set");
}

export const pinataClient = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY,
    pinataGatewayKey: process.env.PINATA_GATEWAY_KEY
});

export const generateUploadKey = async () => {
    try {
        const uuid = crypto.randomUUID();
        const keyData = await pinataClient.keys.create({
            keyName: uuid.toString(),
            permissions: {
                endpoints: {
                    pinning: {
                        pinFileToIPFS: true,
                        pinJSONToIPFS: true,
                    },
                },
            },
            maxUses: 1,
        });
        return keyData;
    } catch (error) {
        console.error('Error generating upload key:', error);
        return null;
    }
};
const isValidIPFSHash = (hash: string): boolean => {
  if (!hash || typeof hash !== 'string') return false;
  if (hash.length < 10) return false;
  if (hash === 'test' || hash === 'dummy' || hash === 'invalid') return false;
  
  const cidPattern = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{50,})$/;
  return cidPattern.test(hash);
};

export const getIPFSData = async (hash: string) => {
    if (!isValidIPFSHash(hash)) {
      console.warn(`Invalid IPFS hash detected: "${hash}" - skipping Pinata call`);
      return null;
    }
    
    try {
      const result = await pinataClient.gateways.get(hash)
      return result
    } catch (error) {
      console.error(`Error fetching IPFS data for hash "${hash}":`, error)
      return null
    }
}

export const getIPFSImageUrl = async (hash: string) => {
    // If it's already a full URL, return as is
    if (hash.startsWith('http')) {
        return hash;
    }
    
    // Otherwise, prepend the gateway URL
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
}

export const uploadJsonIPFS = async (data: JsonBody, key: string) => {
    try {
        const result = await pinataClient.upload.json(data).key(key);
        return result;
    } catch (error) {
        console.error('Error upload IPFS JSON:', error);
        return null;
    }
};

export const uploadFileIPFS = async (data: File, key: string) => {
    try {
        const result = await pinataClient.upload.file(data).key(key);
        return result;
    } catch (error) {
        console.error('Error upload IPFS file:', error);
        return null;
    }
};