# MizuPass Backend API Documentation

## Overview

The MizuPass Backend API provides endpoints for managing ENS domains, event management, identity verification, file uploads, and ZK passport verification. The API is built using Hono framework and integrates with blockchain networks and IPFS for decentralized functionality.

## Base URL

```
http://localhost:3000
```

## Authentication

Some endpoints require API key authentication via the `X-API-Key` header.

## Health Check

### GET /health

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## ENS (Ethereum Name Service) API

Base path: `/api/ens`

### GET /api/ens

Resolve an ENS name to an Ethereum address.

**Query Parameters:**
- `ensName` (optional): ENS name to resolve. Defaults to "mizupass.eth"

**Response:**
```json
{
  "success": true,
  "ensWalletAddress": "0x1234567890123456789012345678901234567890"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "No address found for ENS name"
}
```

### GET /api/ens/checkSubdomain/:subdomain

Check if a subdomain exists and is verified.

**Path Parameters:**
- `subdomain`: The subdomain to check (without .mizupass.eth)

**Response:**
```json
{
  "success": true,
  "subdomain": "example.mizupass.eth",
  "exists": true,
  "resolvedAddress": "0x1234567890123456789012345678901234567890",
  "isVerified": true
}
```

### POST /api/ens/createSubEns

Create a new ENS subdomain. **Requires API key authentication.**

**Headers:**
- `X-API-Key`: Your API key
- `Content-Type`: application/json

**Request Body:**
```json
{
  "subdomain": "example",
  "givenSubdomainAddress": "0x1234567890123456789012345678901234567890"
}
```

**Response:**
```json
{
  "success": true,
  "ens": {
    "ens": "example.mizupass.eth",
    "owner": "0x1234567890123456789012345678901234567890",
    "transactions": {
      "setSubnodeRecord": {
        "hash": "0x...",
        "gasUsed": "123456",
        "effectiveGasPrice": "0.00000002",
        "totalGasCost": "0.00246912"
      },
      "setAddr": {
        "hash": "0x...",
        "gasUsed": "78901",
        "effectiveGasPrice": "0.00000002",
        "totalGasCost": "0.00157802"
      }
    }
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Unauthorized: Invalid or missing API key"
}
```

```json
{
  "success": false,
  "error": "Subdomain parameter is required"
}
```

```json
{
  "success": false,
  "error": "Invalid Ethereum address format"
}
```

---

## Events API

Base path: `/api/events`

### GET /api/events/active

Get all active events.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "eventId": 1,
      "eventContract": "0x1234567890123456789012345678901234567890",
      "organizer": "0x1234567890123456789012345678901234567890",
      "ipfsHash": "QmHash...",
      "ticketIpfsHash": "QmTicketHash...",
      "ticketPrice": "1000000000000000000",
      "maxTickets": "100",
      "ticketsSold": "25",
      "isActive": true,
      "eventDate": "1704067200",
      "eventMetadata": {
        "name": "Sample Event",
        "description": "Event description",
        "image": "QmImageHash..."
      },
      "ticketMetadata": {
        "name": "Event Ticket",
        "description": "Ticket description",
        "image": "QmTicketImageHash..."
      },
      "eventImageUrl": "https://gateway.pinata.cloud/ipfs/QmImageHash...",
      "ticketImageUrl": "https://gateway.pinata.cloud/ipfs/QmTicketImageHash..."
    }
  ],
  "count": 1
}
```

### GET /api/events/organizer/:organizerAddress/active

Get all active events for a specific organizer.

**Path Parameters:**
- `organizerAddress`: Ethereum address of the organizer

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 2,
  "organizer": "0x1234567890123456789012345678901234567890"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid Ethereum address"
}
```

### GET /api/events/details/:eventId

Get detailed information about a specific event.

**Path Parameters:**
- `eventId`: Numeric ID of the event

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": 1,
    "eventContract": "0x1234567890123456789012345678901234567890",
    "organizer": "0x1234567890123456789012345678901234567890",
    "ipfsHash": "QmHash...",
    "ticketIpfsHash": "QmTicketHash...",
    "ticketPrice": "1000000000000000000",
    "maxTickets": "100",
    "ticketsSold": "25",
    "isActive": true,
    "eventDate": "1704067200",
    "eventMetadata": {...},
    "ticketMetadata": {...},
    "eventImageUrl": "https://gateway.pinata.cloud/ipfs/QmImageHash...",
    "ticketImageUrl": "https://gateway.pinata.cloud/ipfs/QmTicketImageHash..."
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Invalid event ID"
}
```

```json
{
  "success": false,
  "error": "Event not found"
}
```

### GET /api/events/contract/:contractAddress

Get event details by contract address.

**Path Parameters:**
- `contractAddress`: Ethereum contract address

**Response:**
```json
{
  "success": true,
  "data": {
    "eventContract": "0x1234567890123456789012345678901234567890",
    "organizer": "0x1234567890123456789012345678901234567890",
    "ipfsHash": "QmHash...",
    "ticketIpfsHash": "QmTicketHash...",
    "ticketPrice": "1000000000000000000",
    "maxTickets": "100",
    "ticketsSold": "25",
    "isActive": true,
    "eventDate": "1704067200",
    "eventMetadata": {
      "name": "Sample Event",
      "symbol": "EVENT",
      "description": "Event description",
      "image": "QmImageHash..."
    },
    "ticketMetadata": {...},
    "eventImageUrl": "https://gateway.pinata.cloud/ipfs/QmImageHash...",
    "ticketImageUrl": "https://gateway.pinata.cloud/ipfs/QmTicketImageHash..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid contract address"
}
```

---

## Identity API

Base path: `/api/identity`

### GET /api/identity/isVerified/:userAddress

Check if a user is verified in the MizuPass identity system.

**Path Parameters:**
- `userAddress`: Ethereum address of the user

**Response:**
```json
{
  "userAddress": "0x1234567890123456789012345678901234567890",
  "isVerified": true
}
```

**Error Response:**
```json
{
  "error": "Invalid Ethereum address"
}
```

### GET /api/identity/isZKPassportVerified/:userAddress

Check if a user has ZK passport verification.

**Path Parameters:**
- `userAddress`: Ethereum address of the user

**Response:**
```json
{
  "userAddress": "0x1234567890123456789012345678901234567890",
  "isZKPassportVerified": true
}
```

### GET /api/identity/verifyMizuhikiSBT/:userAddress

Verify if a user has a valid Mizuhiki SBT (Soul Bound Token).

**Path Parameters:**
- `userAddress`: Ethereum address of the user

**Response:**
```json
{
  "userAddress": "0x1234567890123456789012345678901234567890",
  "mizuhikiSBTVerified": true
}
```

---

## Upload API

Base path: `/api/upload`

### GET /api/upload/key

Generate a temporary upload key for IPFS uploads.

**Response:**
```json
{
  "success": true,
  "data": {
    "keyName": "uuid-string",
    "JWT": "jwt-token",
    "expiresAt": "2024-01-01T01:00:00.000Z"
  }
}
```

### POST /api/upload/json

Upload JSON data to IPFS.

**Request Body:**
```json
{
  "name": "Sample Data",
  "description": "Sample description",
  "attributes": [
    {
      "trait_type": "Type",
      "value": "Sample"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "JSON uploaded to IPFS successfully",
  "data": {
    "ipfsHash": "QmHash...",
    "ipfsUrl": "https://gateway.pinata.cloud/ipfs/QmHash...",
    "ipfsHashTicket": "QmHash...",
    "ipfsUrlTicket": "https://gateway.pinata.cloud/ipfs/QmHash...",
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid JSON data provided"
}
```

### POST /api/upload/file

Upload a file to IPFS.

**Request Body:**
- `file`: File to upload (multipart/form-data)

**Response:**
```json
{
  "success": true,
  "message": "File uploaded to IPFS successfully",
  "data": {
    "ipfsHash": "QmHash...",
    "ipfsUrl": "https://gateway.pinata.cloud/ipfs/QmHash...",
    "fileName": "sample.jpg",
    "fileSize": 12345,
    "fileType": "image/jpeg",
    "pinataData": {
      "IpfsHash": "QmHash...",
      "PinSize": 12345,
      "Timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "No file provided"
}
```

---

## ZK Passport API

Base path: `/api/zkpassport`

### POST /api/zkpassport/verify

Verify ZK passport credentials.

**Request Body:**
```json
{
  "queryResult": {
    "query": "passport",
    "country": "US",
    "issued": "2020-01-01",
    "expires": "2030-01-01"
  },
  "proofs": [
    {
      "proof": "proof-data",
      "publicSignals": ["signal1", "signal2"]
    }
  ],
  "domain": "https://example.com"
}
```

**Response:**
```json
{
  "registered": true,
  "verified": true,
  "uniqueIdentifier": "12345678901234567890",
  "uniqueIdentifierBytes32": "0000000000000000000000000000000000000000000000000000000000000000"
}
```

**Error Response:**
```json
{
  "error": "Verification failed"
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing/invalid API key)
- `404`: Not Found
- `500`: Internal Server Error

Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## Environment Variables

The following environment variables are required:

- `API_KEY`: API key for protected endpoints
- `PINATA_JWT`: Pinata JWT token for IPFS operations
- `PINATA_GATEWAY`: Pinata gateway URL
- `PINATA_GATEWAY_KEY`: Pinata gateway key
- `PORT`: Server port (default: 3000)

---

## Smart Contract Addresses

The API interacts with the following smart contracts:

- **ENS Registry**: `0x0635513f179D50A207757E05759CbD106d7dFcE8`
- **ENS Resolver**: `0x8FADE66B79cC9f707aB26799354482EB93a5B7dD`
- **MizuPass Identity**: `0x143a66A6d8b3349E19828A90F5D091Bf5fFE43E0`
- **Event Registry**: `0xa2d6C35DD254C7660A60335dfCc04360Bf5a70e4`
- **MizuPass Wallet**: `0x67BA06dB6d9c562857BF08AB1220a16DfA455c45`

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

---

## CORS

The API allows all origins (`*`) for CORS. Configure appropriate origins for production use.

---

## Examples

### Creating an ENS Subdomain

```bash
curl -X POST http://localhost:3000/api/ens/createSubEns \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "subdomain": "mycompany",
    "givenSubdomainAddress": "0x1234567890123456789012345678901234567890"
  }'
```

### Uploading a File

```bash
curl -X POST http://localhost:3000/api/upload/file \
  -F "file=@/path/to/your/file.jpg"
```

### Checking User Verification

```bash
curl http://localhost:3000/api/identity/isVerified/0x1234567890123456789012345678901234567890
```
