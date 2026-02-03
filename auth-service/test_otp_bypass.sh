#!/bin/bash

# OTP Bypass Test - Comprehensive Testing Script
# Tests both request and verify endpoints with dev bypass

echo "🧪 OTP Bypass Test - February 3, 2026"
echo "======================================"
echo ""

BASE_URL="${1:-http://localhost:8000}"
PHONE="+2349876543210"
ROLE="parent"
STATIC_OTP="123456"

echo "📋 Test Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Phone: $PHONE"
echo "  Role: $ROLE"
echo "  Static OTP: $STATIC_OTP"
echo ""

# Test 1: Request OTP
echo "📤 Test 1: Requesting OTP..."
echo "----------------------------"
REQUEST_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/auth/phone/request-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"role\": \"$ROLE\"
  }")

HTTP_STATUS=$(echo "$REQUEST_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$REQUEST_RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status Code: $HTTP_STATUS"
echo "Response: $RESPONSE_BODY"
echo ""

if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ Test 1 FAILED: Expected 200, got $HTTP_STATUS"
  echo ""
  echo "Possible issues:"
  echo "  - Phone number might already be registered"
  echo "  - Rate limiting might be active (shouldn't be in dev mode)"
  echo "  - Database connection issue"
  exit 1
fi

if echo "$RESPONSE_BODY" | grep -q '"success":true'; then
  echo "✅ Test 1 PASSED: OTP request successful"
else
  echo "❌ Test 1 FAILED: Response doesn't indicate success"
  exit 1
fi

echo ""
sleep 1

# Test 2: Verify OTP with Static Bypass
echo "🔐 Test 2: Verifying OTP with static bypass ($STATIC_OTP)..."
echo "-------------------------------------------------------------"
VERIFY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/auth/phone/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"otp\": \"$STATIC_OTP\",
    \"role\": \"$ROLE\"
  }")

HTTP_STATUS=$(echo "$VERIFY_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$VERIFY_RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status Code: $HTTP_STATUS"
echo "Response: $RESPONSE_BODY"
echo ""

if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ Test 2 FAILED: Expected 200, got $HTTP_STATUS"
  echo ""
  echo "Error Details:"
  echo "$RESPONSE_BODY" | grep -o '"message":"[^"]*"' || echo "No message found"
  echo ""
  echo "Troubleshooting:"
  echo "  - Check APP_ENV is set to 'local', 'development', or 'testing'"
  echo "  - Verify DevOtpHelper::isDevOtpBypassEnabled() returns true"
  echo "  - Check application logs for detailed error"
  exit 1
fi

if echo "$RESPONSE_BODY" | grep -q '"success":true'; then
  echo "✅ Test 2 PASSED: OTP verification successful"
  
  # Extract registration token
  REG_TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"registration_token":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$REG_TOKEN" ]; then
    echo "📝 Registration Token: ${REG_TOKEN:0:20}..."
  fi
else
  echo "❌ Test 2 FAILED: Response doesn't indicate success"
  exit 1
fi

echo ""

# Test 3: Verify without request (direct bypass)
echo "🔓 Test 3: Direct verification without prior request..."
echo "--------------------------------------------------------"
NEW_PHONE="+2348099999999"
DIRECT_VERIFY=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/auth/phone/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$NEW_PHONE\",
    \"otp\": \"$STATIC_OTP\",
    \"role\": \"$ROLE\"
  }")

HTTP_STATUS=$(echo "$DIRECT_VERIFY" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$DIRECT_VERIFY" | sed '/HTTP_STATUS/d')

echo "Status Code: $HTTP_STATUS"
echo "Response: $RESPONSE_BODY"
echo ""

if [ "$HTTP_STATUS" == "200" ] && echo "$RESPONSE_BODY" | grep -q '"success":true'; then
  echo "✅ Test 3 PASSED: Direct verification with bypass works"
else
  echo "⚠️  Test 3 FAILED: Direct verification didn't work (this is OK if you want to require request-otp first)"
fi

echo ""
echo "========================================"
echo "🎉 All critical tests passed!"
echo "========================================"
echo ""
echo "✅ Summary:"
echo "  - OTP request endpoint working"
echo "  - OTP verification with static bypass (123456) working"
echo "  - Registration token generation working"
echo ""
echo "📱 Frontend can now use:"
echo "  1. POST $BASE_URL/auth/phone/request-otp"
echo "  2. POST $BASE_URL/auth/phone/verify-otp with otp='123456'"
echo ""
