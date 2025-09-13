# MizuPass Backend

A simple backend API using TypeScript, Bun, and Hono for ZKPassport verification.

## Setup

1. Install dependencies:
```bash
bun install
```

2. Run in development mode:
```bash
bun run dev
```

3. Build for production:
```bash
bun run build
```

4. Start production server:
```bash
bun run start
```

## API Endpoints

### POST /api/zkpassport/verify

Verify ZKPassport proofs.

**Request Body:**
```json
{
  "queryResult": {},
  "proofs": [],
  "domain": "your-domain.com"
}
```

**Response:**
```json
{
  "registered": true,
  "verified": true,
  "uniqueIdentifier": "..."
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```