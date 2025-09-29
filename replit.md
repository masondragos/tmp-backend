# Mortgage Broker Quote API

## Overview
This is a REST API backend built with Express.js, TypeScript, Prisma ORM, and PostgreSQL. It provides mortgage broker quote management functionality with user authentication via Google OAuth.

## Recent Changes
- **2025-09-29**: Initial Replit setup completed
  - Installed all dependencies using pnpm
  - Configured PostgreSQL database with Prisma migrations
  - Updated server to run on port 5000 with 0.0.0.0 host
  - Added Replit domain support for CORS and OAuth callbacks
  - Made Google OAuth optional for environments without credentials
  - Configured deployment for autoscale

## Project Architecture

### Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.1.0
- **Database**: PostgreSQL with Prisma ORM 6.9.0
- **Authentication**: Passport.js with Google OAuth 2.0
- **Package Manager**: pnpm

### Database Schema
The application uses Prisma with the following main models:
- `User`: User accounts with email, Google OAuth integration
- `Quote`: Mortgage quote requests
- `Quote_Applicant_Info`: Applicant information for quotes
- `Quote_Loan_Details`: Loan details including purchase price, rehab funds, etc.
- `Quote_Rental_Info`: Rental property information
- `Quote_Priorities`: User priorities (speed, fees, leverage)

### API Endpoints
- **Auth**: `/api/v1/auth/*` - Google OAuth authentication
- **Users**: `/api/v1/users` - User management
- **Quotes**: `/api/v1/quotes/*` - Quote management
- **Health**: `/ping` - Health check endpoint

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured in Replit)
- `SESSION_SECRET`: Session secret key (configured in Replit secrets)
- `GOOGLE_AUTH_CLIENT_ID`: Google OAuth client ID (optional)
- `GOOGLE_AUTH_CLIENT_SECRET`: Google OAuth secret (optional)
- `STAGE`: Environment stage (defaults to "dev")
- `PORT`: Server port (defaults to 5000)
- `REPLIT_DEV_DOMAIN`: Auto-set in Replit environment

### Key Features
- Google OAuth authentication
- Mortgage quote management system
- Session-based authentication
- CORS configured for multiple origins
- Database migrations with Prisma
- TypeScript for type safety

## Development

### Running Locally
The server runs automatically via the configured workflow:
```bash
pnpm run dev
```

### Database Migrations
Apply migrations:
```bash
pnpm prisma migrate deploy
```

Generate Prisma client:
```bash
pnpm prisma generate
```

### Testing
Test the API with curl:
```bash
curl http://localhost:5000/ping
curl http://localhost:5000/api/v1/users
```

## Deployment
The application is configured for autoscale deployment on Replit. It will automatically scale based on traffic and uses the production start command:
```bash
pnpm start
```

## Notes
- Google OAuth is optional - the app will warn if credentials are missing but will still run
- The app automatically detects Replit environment and adjusts URLs accordingly
- CORS is configured to work with both local development and Replit proxy
