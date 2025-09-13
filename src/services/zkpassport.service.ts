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
}

export class ZKPassportService {
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

    // Do something with it, such as using the unique identifier to
    // identify the user in the database

    return {
      registered: verified,
      verified,
      uniqueIdentifier
    };
  }
}