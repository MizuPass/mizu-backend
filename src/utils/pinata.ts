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
export const getIPFSData = async (hash: string) => {
    try {
      const result = await pinataClient.gateways.get(hash)
      return result
    } catch (error) {
      console.error('Error fetching IPFS data:', error)
      return null
    }
}

export const getIPFSImageUrl = async (hash: string) => {
    return `https://gateway.pinata.cloud/ipfs/${hash}`
}

export const uploadJsonIPFS = async (data: JsonBody, key: string) => {
    try {
        const result = await pinataClient.upload.json(data).key(key);
        return result;
    } catch (error) {
        console.error('Error upload IPFS data:', error);
        return null;
    }
};

export const uploadFileIPFS = async (data: File, key: string) => {
    try {
        const result = await pinataClient.upload.file(data).key(key);
        return result;
    } catch (error) {
        console.error('Error upload IPFS data:', error);
        return null;
    }
};