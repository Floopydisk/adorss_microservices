# ADORSS Microservices Architecture (TypeScript)

This directory contains all microservices for the ADORSS Education Platform.

## Services

| Service | Port | Description | Tech Stack | Assigned To |
|---------|------|-------------|------------|-------------|
| API Gateway | 3000 | Request routing | TypeScript + Express.js | Backend Dev 1 |
| Auth Service | 8000 | Authentication | Laravel + MySQL | Backend Dev 1 |
| Education Service | 8001 | Assignments, grades | TypeScript + MongoDB | Backend Dev 2 |
| Messaging Service | 8002 | Notifications | TypeScript + MongoDB + Redis | Backend Dev 1 |
| Mobility Service | 8003 | Location tracking | TypeScript + MongoDB + Redis | Backend Dev 2 |
| Finance Service | 8004 | Payments | TypeScript + MongoDB | Backend Dev 2 |

## Team Structure

### Backend Dev 1
- Auth Service (Laravel)
- API Gateway (TypeScript)
- Messaging Service (TypeScript)

### Backend Dev 2
- Education Service (TypeScript)
- Finance Service (TypeScript)
- Mobility Service (TypeScript)

## Architecture

```
                    [Flutter Apps]
                          ↓
                  [API Gateway :3000]
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                     ↓
  [Auth Service :8000] ←──────────────→ [Other Services]
        ↓                                     ↓
   [MySQL DB]                      [MongoDB + Redis]
```

## Getting Started

### Prerequisites
- Node.js 18+
- TypeScript 5+
- PHP 8.1+ & Composer (for Auth Service)
- MongoDB 6.0+
- Redis 7+
- MySQL 8.0+

### Installation

1. **Install dependencies for each service:**
```bash
# For each TypeScript service
cd microservices/<service-name>
npm install
```

2. **Set up Auth Service (Laravel):**
```bash
cd microservices/auth-service
composer create-project laravel/laravel .
composer require tymon/jwt-auth
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate
```

3. **Configure environment variables:**
Copy `.env.example` to `.env` in each service directory.

4. **Start all services:**
```bash
# Terminal 1: API Gateway
cd microservices/api-gateway && npm run dev

# Terminal 2: Auth Service
cd microservices/auth-service && php artisan serve

# Terminal 3: Education Service
cd microservices/education-service && npm run dev

# Terminal 4: Messaging Service
cd microservices/messaging-service && npm run dev

# Terminal 5: Mobility Service
cd microservices/mobility-service && npm run dev

# Terminal 6: Finance Service
cd microservices/finance-service && npm run dev
```

## Development Workflow

### TypeScript Development
1. Write code in `src/` directory
2. Run `npm run dev` for hot reload
3. Build with `npm run build`
4. Compiled code in `dist/`

### API-First Approach
1. Define API contracts first (OpenAPI/Swagger)
2. Backend implements APIs
3. Frontend consumes APIs (Flutter)
4. No mocking needed - real APIs ready

## Testing

Each service has its own test suite:
- `npm test` - Run tests
- `npm run test:watch` - Watch mode

Health check endpoints:
- API Gateway: http://localhost:3000/health
- Auth Service: http://localhost:8000/health
- Education Service: http://localhost:8001/health
- Messaging Service: http://localhost:8002/health
- Mobility Service: http://localhost:8003/health
- Finance Service: http://localhost:8004/health

## Shared Code

The `shared/` directory contains:
- `types/` - TypeScript type definitions
- `middleware/` - Reusable middleware (auth, error handling)
- `utils/` - Utility functions

## Documentation

- [Team Implementation Plan](../TEAM_IMPLEMENTATION_PLAN.md)
- [API Quick Reference](../API_QUICK_REFERENCE.md)
- Individual service READMEs in each service directory

## TypeScript Configuration

Each service uses:
- `tsconfig.json` for TypeScript compiler options
- `eslint` for code quality
- `ts-node-dev` for development
- `jest` with `ts-jest` for testing

## Contributing

1. Create feature branch
2. Write TypeScript code
3. Add tests
4. Run linter
5. Submit pull request

## License

Proprietary - ADORSS Education Platform
