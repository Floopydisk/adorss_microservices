# API Gateway Integration with Auth Service

## Architecture

The API Gateway acts as the single entry point for all client requests. It:

1. **Authenticates** requests via JWT tokens from the Auth Service
2. **Authorizes** requests based on user permissions from the Auth Service
3. **Routes** requests to appropriate microservices
4. **Forwards** user context headers to microservices

## Request Flow

```
Client Request
    ↓
API Gateway (Port 3000)
    ├─ /auth/register, /auth/login, /auth/phone/* → Auth Service (8000)
    ├─ /api/students, /api/teachers → Education Service (8001)
    ├─ /api/messages → Messaging Service (8002)
    ├─ /api/mobility → Mobility Service (8003)
    └─ /api/finance → Finance Service (8004)
```

## Authentication

### 1. Obtaining JWT Token

**POST /auth/register**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

Response includes `token` (JWT) to use in subsequent requests.

### 2. Using JWT in Protected Routes

All protected endpoints require:

```
Authorization: Bearer <jwt_token>
```

## Authorization

The gateway checks permissions before routing to services:

```typescript
// Example: Access students data
GET / api / students;
Authorization: Bearer<token>;

// Gateway verifies user has "students:read" permission
// If yes → proxies to Education Service
// If no → returns 403 Forbidden
```

## Protected Endpoints

### Education Service

- `GET /api/students` - Requires `students:read`
- `GET /api/teachers` - Requires `teachers:read`

### Finance Service

- `GET /api/finance` - Requires `finance:read`

### Messaging Service

- `GET /api/messages` - Requires auth (no specific permission)

### Mobility Service

- `GET /api/mobility` - Requires auth (no specific permission)

## Service Context Headers

When proxying requests, the gateway forwards user context:

```
X-User-ID: <user_id>
X-User-Role: <role>
X-School-ID: <school_id>
X-User-Email: <email>
Authorization: Bearer <token>
```

Services can use these headers to enforce additional business logic.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

3. Update service URLs in `.env` if needed.

4. Start development server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
npm start
```

## Testing

### Register a user

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Access protected resource

```bash
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer <your_jwt_token>"
```

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Forbidden: missing permission students:read"
}
```

### 503 Service Unavailable

```json
{
  "success": false,
  "message": "Service unavailable",
  "error": "Connection refused"
}
```

## Environment Variables

| Variable                | Default               | Description                |
| ----------------------- | --------------------- | -------------------------- |
| PORT                    | 3000                  | Gateway port               |
| AUTH_SERVICE_URL        | http://localhost:8000 | Auth Service endpoint      |
| EDUCATION_SERVICE_URL   | http://localhost:8001 | Education Service endpoint |
| MESSAGING_SERVICE_URL   | http://localhost:8002 | Messaging Service endpoint |
| MOBILITY_SERVICE_URL    | http://localhost:8003 | Mobility Service endpoint  |
| FINANCE_SERVICE_URL     | http://localhost:8004 | Finance Service endpoint   |
| RATE_LIMIT_WINDOW_MS    | 900000                | Rate limit window (15 min) |
| RATE_LIMIT_MAX_REQUESTS | 100                   | Max requests per window    |
| JWT_VERIFY_TIMEOUT_MS   | 5000                  | JWT verification timeout   |

## Integration Notes

- **Auth Service is the master controller**: All permission and role decisions are made by Auth Service
- **Stateless**: Gateway doesn't store user state; every request is validated with Auth Service
- **Caching**: Permission checks are cached at Auth Service level (5 min TTL)
- **Service-to-Service**: Services should also validate tokens and trust X-User-\* headers for context
