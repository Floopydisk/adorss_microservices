# FINANCE-SERVICE

Finance Service - Payments and billing

**Assigned to:** Backend Dev 2

## Port
`8004`

## Tech Stack
- TypeScript
- Express.js
- MongoDB


## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint TypeScript files
- `npm run lint:fix` - Fix linting issues

## Endpoints

### Health Check
```
GET /health
```

Returns service health status.

## Environment Variables

See `.env.example` for required environment variables.

## Development Notes

- All TypeScript code in `src/` directory
- Compiled JavaScript in `dist/` directory
- Types in `src/types/`
- Tests in `tests/`

## Team Assignment

This service is assigned to **Backend Dev 2**.
