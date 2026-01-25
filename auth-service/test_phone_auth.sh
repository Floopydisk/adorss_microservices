#!/bin/bash

BASE_URL="http://localhost:8000/api"

echo "=== Testing Phone-Based Authentication Flow ==="
echo ""

# Step 1: Request OTP
echo "Step 1: Request OTP for phone registration"
PHONE="+1234567890"
ROLE="student"

OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\", \"role\": \"$ROLE\"}")

echo "Response: $OTP_RESPONSE"
OTP=$(echo $OTP_RESPONSE | grep -o '"otp":"[^"]*' | cut -d'"' -f4)
echo "Generated OTP: $OTP"
echo ""

# Step 2: Verify OTP
echo "Step 2: Verify OTP"
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/phone/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\", \"otp\": \"$OTP\", \"role\": \"$ROLE\"}")

echo "Response: $VERIFY_RESPONSE"
REG_TOKEN=$(echo $VERIFY_RESPONSE | grep -o '"registration_token":"[^"]*' | cut -d'"' -f4)
echo "Registration Token: $REG_TOKEN"
echo ""

# Step 3: Complete Registration
echo "Step 3: Complete Registration (email, name, password)"
EMAIL="student@example.com"
NAME="Test Student"
PASSWORD="SecurePassword123!"

REG_COMPLETE=$(curl -s -X POST "$BASE_URL/auth/phone/complete-registration" \
  -H "Content-Type: application/json" \
  -d "{\"registration_token\": \"$REG_TOKEN\", \"email\": \"$EMAIL\", \"name\": \"$NAME\", \"password\": \"$PASSWORD\"}")

echo "Response: $REG_COMPLETE"
JWT_TOKEN=$(echo $REG_COMPLETE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "JWT Token: $JWT_TOKEN"
echo ""

# Step 4: Login with Phone + OTP
echo "Step 4: Login with Phone + OTP"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/phone/login" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\", \"otp\": \"$OTP\", \"role\": \"$ROLE\"}")

echo "Response: $LOGIN_RESPONSE"
echo ""

# Step 5: Get User Profile (using token)
echo "Step 5: Get User Profile with JWT"
PROFILE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Profile: $PROFILE"
echo ""

echo "=== Flow Test Complete ==="
