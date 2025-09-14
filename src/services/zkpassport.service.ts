import { QueryResult, ZKPassport, ProofResult } from "@zkpassport/sdk";

export interface VerifyRequest {
  queryResult: QueryResult;
  proofs: ProofResult[];
  domain: string;
}

export interface VerifyResponse {
  registered: boolean;
  verified?: boolean;
  uniqueIdentifier?: string;
  uniqueIdentifierBytes32?: string;
}

export class ZKPassportService {
  /**
   * Convert decimal unique identifier to bytes32 hex format for smart contracts
   */
  private convertToBytes32(decimalValue: string): string {
    // Convert decimal string to BigInt, then to hex, pad to 32 bytes (64 hex chars)
    return BigInt(decimalValue).toString(16).padStart(64, '0');
  }

  async verify(request: VerifyRequest): Promise<VerifyResponse> {
    const { queryResult, proofs, domain } = request;

    const zkpassport = new ZKPassport(domain);

    const { verified, uniqueIdentifier } = await zkpassport.verify({
      proofs,
      queryResult,
      devMode: true,
    });

    console.log("Verified", verified);
    console.log("Unique identifier", uniqueIdentifier);

    // Convert decimal unique identifier to bytes32 format for smart contract compatibility
    const uniqueIdentifierBytes32 = uniqueIdentifier ? this.convertToBytes32(uniqueIdentifier) : undefined;

    console.log("Unique identifier (bytes32)", uniqueIdentifierBytes32);

    // Do something with it, such as using the unique identifier to
    // identify the user in the database

    return {
      registered: verified,
      verified,
      uniqueIdentifier,
      uniqueIdentifierBytes32
    };
  }
}