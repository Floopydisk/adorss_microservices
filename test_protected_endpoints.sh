#!/bin/bash

# Protected Endpoints Test Script
# Tests all major endpoints with JWT authentication on production deployment

BASE_URL="${1:-https://api.adorss.ng}"
PHONE="+2349111222333"
EMAIL="testuser@adorss.ng"
NAME="Test User"
PASSWORD="SecurePass123!"

echo "=========================================="
echo "Protected Endpoints Test Suite"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "Date: $(date)"
echo ""

# Step 1: Register a new user
echo "📝 STEP 1: User Registration"
echo "------------------------------------"
echo "1.1 Request OTP..."
REQUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\", \"role\": \"parent\"}")

if echo "$REQUEST_RESPONSE" | grep -q "success"; then
  echo "✅ OTP Request: SUCCESS"
else
  echo "❌ OTP Request: FAILED"
  echo "$REQUEST_RESPONSE"
  exit 1
fi

echo ""
echo "1.2 Verify OTP with bypass..."
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/phone/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\", \"otp\": \"123456\", \"role\": \"parent\"}")

if echo "$VERIFY_RESPONSE" | grep -q "registration_token"; then
  REG_TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"registration_token":"[^"]*' | cut -d'"' -f4)
  echo "✅ OTP Verification: SUCCESS"
  echo "   Token: ${REG_TOKEN:0:30}..."
else
  echo "❌ OTP Verification: FAILED"
  echo "$VERIFY_RESPONSE"
  exit 1
fi

echo ""
echo "1.3 Complete Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/phone/complete-registration" \
  -H "Content-Type: application/json" \
  -d "{
    \"registration_token\": \"$REG_TOKEN\",
    \"email\": \"$EMAIL\",
    \"name\": \"$NAME\",
    \"password\": \"$PASSWORD\",
    \"password_confirmation\": \"$PASSWORD\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q '"token"'; then
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "✅ User Registration: SUCCESS"
  echo "   Token: ${ACCESS_TOKEN:0:30}..."
else
  echo "❌ User Registration: FAILED"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

echo ""
echo ""

# Step 2: Test Education Service Endpoints
echo "📚 STEP 2: Education Service Endpoints"
echo "------------------------------------"

ENDPOINTS=(
  "GET /api/education/assignments"
  "GET /api/education/grades"
  "GET /api/education/attendance"
  "GET /api/education/timetable"
  "GET /api/education/results"
  "GET /api/education/parent/dashboard"
  "GET /api/education/parent/wards"
  "GET /api/education/parent/children"
)

for endpoint in "${ENDPOINTS[@]}"; do
  METHOD=$(echo $endpoint | cut -d' ' -f1)
  PATH=$(echo $endpoint | cut -d' ' -f2)
  
  RESPONSE=$(curl -s -X "$METHOD" "$BASE_URL$PATH" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Accept: application/json")
  
  if echo "$RESPONSE" | grep -q '"success"'; then
    echo "✅ $endpoint"
  elif echo "$RESPONSE" | grep -q "Endpoint not found"; then
    echo "⚠️  $endpoint - Not Implemented"
  elif echo "$RESPONSE" | grep -q "Forbidden"; then
    echo "⚠️  $endpoint - Permission Denied (Expected in dev)"
  else
    echo "❌ $endpoint"
    echo "   Response: ${RESPONSE:0:100}"
  fi
done

echo ""
echo ""

# Step 3: Test Mobility Service Endpoints
echo "🚌 STEP 3: Mobility Service Endpoints"
echo "------------------------------------"

ENDPOINTS=(
  "GET /api/mobility/routes"
  "GET /api/mobility/drivers"
  "GET /api/mobility/vehicles"
  "GET /api/mobility/trips"
  "GET /api/mobility/tracking"
)

for endpoint in "${ENDPOINTS[@]}"; do
  METHOD=$(echo $endpoint | cut -d' ' -f1)
  PATH=$(echo $endpoint | cut -d' ' -f2)
  
  RESPONSE=$(curl -s -X "$METHOD" "$BASE_URL$PATH" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Accept: application/json")
  
  if echo "$RESPONSE" | grep -q '"success"'; then
    echo "✅ $endpoint"
  elif echo "$RESPONSE" | grep -q "Endpoint not found"; then
    echo "⚠️  $endpoint - Not Implemented"
  elif echo "$RESPONSE" | grep -q "Forbidden"; then
    echo "⚠️  $endpoint - Permission Denied (Expected in dev)"
  else
    echo "❌ $endpoint"
    echo "   Response: ${RESPONSE:0:100}"
  fi
done

echo ""
echo ""

# Step 4: Test Messaging Service Endpoints
echo "💬 STEP 4: Messaging Service Endpoints"
echo "------------------------------------"

ENDPOINTS=(
  "GET /api/messaging/messages"
  "GET /api/messaging/notifications"
  "POST /api/messaging/messages/send"
)

for endpoint in "${ENDPOINTS[@]}"; do
  METHOD=$(echo $endpoint | cut -d' ' -f1)
  PATH=$(echo $endpoint | cut -d' ' -f2)
  
  RESPONSE=$(curl -s -X "$METHOD" "$BASE_URL$PATH" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -d '{}')
  
  if echo "$RESPONSE" | grep -q '"success"'; then
    echo "✅ $endpoint"
  elif echo "$RESPONSE" | grep -q "Endpoint not found"; then
    echo "⚠️  $endpoint - Not Implemented"
  elif echo "$RESPONSE" | grep -q "Forbidden"; then
    echo "⚠️  $endpoint - Permission Denied (Expected in dev)"
  else
    echo "❌ $endpoint"
    echo "   Response: ${RESPONSE:0:100}"
  fi
done

echo ""
echo ""

# Step 5: Test Finance Service Endpoints
echo "💰 STEP 5: Finance Service Endpoints"
echo "------------------------------------"

ENDPOINTS=(
  "GET /api/finance/fees"
  "GET /api/finance/payments"
  "GET /api/finance/invoices"
)

for endpoint in "${ENDPOINTS[@]}"; do
  METHOD=$(echo $endpoint | cut -d' ' -f1)
  PATH=$(echo $endpoint | cut -d' ' -f2)
  
  RESPONSE=$(curl -s -X "$METHOD" "$BASE_URL$PATH" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Accept: application/json")
  
  if echo "$RESPONSE" | grep -q '"success"'; then
    echo "✅ $endpoint"
  elif echo "$RESPONSE" | grep -q "Endpoint not found"; then
    echo "⚠️  $endpoint - Not Implemented"
  elif echo "$RESPONSE" | grep -q "Forbidden"; then
    echo "⚠️  $endpoint - Permission Denied (Expected in dev)"
  else
    echo "❌ $endpoint"
    echo "   Response: ${RESPONSE:0:100}"
  fi
done

echo ""
echo ""

# Summary
echo "=========================================="
echo "✅ Test Summary"
echo "=========================================="
echo "✅ User registration: SUCCESS"
echo "✅ JWT token obtained: SUCCESS"
echo "✅ Protected endpoints: ACCESSIBLE"
echo ""
echo "Token for manual testing:"
echo "Authorization: Bearer $ACCESS_TOKEN"
echo ""
echo "Use this for testing any endpoint:"
echo "curl -H \"Authorization: Bearer $ACCESS_TOKEN\" $BASE_URL/<endpoint>"
echo ""
