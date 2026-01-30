# MOBILITY-SERVICE

Mobility Service - Fleet management, driver management, ride-sharing, and school transport tracking

**Assigned to:** Backend Dev 2

## Port

`8003`

## Tech Stack

- TypeScript
- Express.js
- MongoDB (TODO)
- Redis (TODO - for real-time tracking)

## Current Status: MOCK MODE

⚠️ **This service currently returns mock/static data.** The data structures and API contracts are defined and ready for implementation.

### What's Implemented (Mock):

- ✅ Type definitions for all entities
- ✅ Mock data for testing
- ✅ API routes structure
- ✅ Service-to-service communication patterns
- ✅ Response formats

### TODO - Real Implementation:

- 🔲 MongoDB models and database connections
- 🔲 Real-time GPS tracking integration
- 🔲 Driver app authentication
- 🔲 Ride request flow (Uber-like)
- 🔲 WebSocket for live tracking
- 🔲 Push notifications

## Architecture

```
Mobility Service
├── Public API (/api/mobility)          → API Gateway → Mobile Apps
│   ├── Routes management
│   ├── Drivers management
│   ├── Vehicles management
│   └── Ride requests (TODO)
│
└── Internal API (/api/mobility/internal) → Education Service
    ├── Passenger status
    ├── Route tracking
    └── ETA calculations
```

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start development server:

```bash
pnpm dev
```

## Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm lint` - Lint TypeScript files
- `pnpm lint:fix` - Fix linting issues

## API Endpoints

### Health Check

```
GET /health
```

### Public API (via API Gateway)

Base path: `/api/mobility`

#### Routes

```
GET  /api/mobility/routes                    - List all routes
GET  /api/mobility/routes/:routeId           - Get route details
GET  /api/mobility/routes/:routeId/tracking  - Get real-time tracking
GET  /api/mobility/routes/:routeId/eta       - Get ETA for a stop
POST /api/mobility/routes                    - Create route (TODO)
```

#### Drivers

```
GET   /api/mobility/drivers                  - List all drivers
GET   /api/mobility/drivers/:driverId        - Get driver details
POST  /api/mobility/drivers                  - Register driver (TODO)
PATCH /api/mobility/drivers/:driverId/status - Update status (TODO)
PATCH /api/mobility/drivers/:driverId/location - Update location (TODO)
```

#### Vehicles

```
GET  /api/mobility/vehicles                      - List all vehicles
GET  /api/mobility/vehicles/:vehicleId           - Get vehicle details
GET  /api/mobility/vehicles/:vehicleId/tracking  - Get vehicle tracking
POST /api/mobility/vehicles                      - Register vehicle (TODO)
```

#### Rides (TODO)

```
POST  /api/mobility/rides          - Request a ride
GET   /api/mobility/rides/:rideId  - Get ride status
PATCH /api/mobility/rides/:rideId  - Accept/reject/complete ride
```

### Internal API (Service-to-Service)

Base path: `/api/mobility/internal`

These endpoints are called by the Education Service:

```
GET  /passengers/:studentId/status         - Get transport status for student
GET  /passengers/:studentId/history        - Get transport history
POST /passengers/:studentId/notify-absence - Notify transport absence
GET  /routes/:routeId/tracking             - Get route tracking data
GET  /routes/:routeId/eta                  - Get ETA for a stop
```

## Data Types

See `src/types/index.ts` for comprehensive type definitions:

- **Organization** - Schools, companies that manage fleets
- **Driver** - Driver profiles, verification, earnings
- **Vehicle** - Fleet vehicles with tracking
- **Route** - Transport routes with stops
- **Trip** - Individual trips on routes
- **Passenger** - Students linked to routes (school transport)
- **RideRequest** - On-demand ride requests (Uber-like)

## Mock Data

Mock data is defined in `src/data/mockData.ts`:

- 1 Organization (Lekki High School)
- 2 Drivers
- 2 Vehicles
- 2 Routes (morning/afternoon)
- Sample passengers and trip logs

## Integration with Education Service

The Education Service calls internal endpoints to get transport data for parents:

```typescript
// Education Service example
const getStudentTransportStatus = async (studentId: string) => {
  const response = await fetch(
    `${MOBILITY_SERVICE_URL}/api/mobility/internal/passengers/${studentId}/status`,
  );
  return response.json();
};
```

## Environment Variables

```env
PORT=8003
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mobility-service
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
AUTH_SERVICE_URL=http://localhost:8000
EDUCATION_SERVICE_URL=http://localhost:8001
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## Development Notes

### File Structure

```
src/
├── controllers/       # Request handlers
├── data/             # Mock data (replace with DB)
├── middleware/       # Auth, validation (TODO)
├── models/           # MongoDB models (TODO)
├── routes/           # API routes
├── services/         # Business logic
├── types/            # TypeScript types
└── index.ts          # App entry point
```

### For the Developer Working on This:

1. **Start with database models** - Convert types in `src/types/index.ts` to Mongoose schemas
2. **Replace mock data** - Update services to query MongoDB instead of mock data
3. **Add authentication** - Use JWT from auth-service for driver/admin endpoints
4. **Implement GPS tracking** - Integrate with vehicle GPS devices
5. **Add WebSocket** - For real-time location updates
6. **Implement ride flow** - Request → Match → Accept → Pickup → Complete

### Key Integrations:

- **Auth Service** - For user authentication
- **Education Service** - Consumes transport data for parents
- **API Gateway** - Routes external requests

## Team Assignment

This service is assigned to **Backend Dev 2**.

## Environment Variables

See `.env.example` for required environment variables.

## Development Notes

- All TypeScript code in `src/` directory
- Compiled JavaScript in `dist/` directory
- Types in `src/types/`
- Tests in `tests/`

## Team Assignment

This service is assigned to **Backend Dev 2**.
