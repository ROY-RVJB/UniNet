#!/bin/bash
# Script para probar el endpoint de creación de usuario desde el servidor

echo "========================================="
echo "Probando endpoint POST /api/users/create"
echo "========================================="

curl -X POST http://localhost:4000/api/users/create \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "username": "testuser",
    "full_name": "Test User",
    "password": "password123",
    "email": "testuser@uninet.com"
  }' \
  -v \
  --max-time 40

echo ""
echo "========================================="
echo "Prueba completada"
echo "========================================="
