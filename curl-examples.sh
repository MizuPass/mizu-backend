#!/bin/bash

# Health check
curl -X GET http://localhost:3000/health

echo -e "\n"

# ZKPassport verify endpoint
curl -X POST http://localhost:3000/api/zkpassport/verify \
  -H "Content-Type: application/json" \
  -d '{
    "queryResult": {},
    "proofs": [],
    "domain": "example.com"
  }'