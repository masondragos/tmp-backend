# Mortgage Broker Quote API

## Overview
This is a REST API backend built with Express.js, TypeScript, Prisma ORM, and PostgreSQL. It provides mortgage broker quote management functionality with user authentication via Google OAuth.

## Recent Changes
- **2025-09-30**: Lender Portal implementation completed
  - Designed and implemented lender database schema (Lender, Lender_Loan_Product, Quote_Lender_Match)
  - Built lender authentication and registration endpoints
  - Created loan product and criteria management system
  - Implemented intelligent quote-to-lender matching with instant disqualification logic
  - Added comprehensive edge case handling for missing data and invalid inputs
  
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

**Borrower/Quote Models:**
- `User`: User accounts with email, Google OAuth integration
- `Quote`: Mortgage quote requests
- `Quote_Applicant_Info`: Applicant information for quotes
- `Quote_Loan_Details`: Loan details including purchase price, rehab funds, etc.
- `Quote_Rental_Info`: Rental property information
- `Quote_Priorities`: User priorities (speed, fees, leverage)

**Lender Portal Models:**
- `Lender`: Lender company accounts with authentication
- `Lender_Loan_Product`: Loan products with qualification criteria per lender
  - Min/max loan amounts
  - Credit score requirements
  - Citizenship requirements
  - Seasoning periods
  - States funded
  - LTV limits
  - Rehab loan acceptance
- `Quote_Lender_Match`: Matching results between quotes and lenders
  - Match status (qualified/disqualified)
  - Disqualification reasons with detailed criteria mismatch info

### API Endpoints

**Authentication & Users:**
- **Auth**: `/api/v1/auth/*` - Google OAuth authentication
- **Users**: `/api/v1/signup`, `/api/v1/login` - User registration and login
- **Health**: `/ping` - Health check endpoint

**Quote Management:**
- **Quotes**: `/api/v1/quotes/*` - Complete quote CRUD operations
- **POST** `/api/v1/quotes/:id/match-lenders` - Match quote with all lenders
- **GET** `/api/v1/quotes/:id/lender-matches` - Get matching results for a quote

**Lender Portal:**
- **POST** `/api/v1/lenders/register` - Register new lender
- **POST** `/api/v1/lenders/login` - Lender authentication
- **GET** `/api/v1/lenders` - List all lenders
- **GET** `/api/v1/lenders/:id` - Get lender profile with loan products
- **PUT** `/api/v1/lenders/:id` - Update lender information
- **POST** `/api/v1/lenders/:lenderId/loan-products` - Create loan product
- **PUT** `/api/v1/lenders/loan-products/:productId` - Update loan product
- **DELETE** `/api/v1/lenders/loan-products/:productId` - Delete loan product

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured in Replit)
- `SESSION_SECRET`: Session secret key (configured in Replit secrets)
- `GOOGLE_AUTH_CLIENT_ID`: Google OAuth client ID (optional)
- `GOOGLE_AUTH_CLIENT_SECRET`: Google OAuth secret (optional)
- `STAGE`: Environment stage (defaults to "dev")
- `PORT`: Server port (defaults to 5000)
- `REPLIT_DEV_DOMAIN`: Auto-set in Replit environment

### Key Features
- Google OAuth authentication for borrowers
- Comprehensive mortgage quote management system
- **Lender Portal** with intelligent matching:
  - Easy lender onboarding with company profiles
  - Flexible loan product criteria configuration
  - Automatic quote-to-lender matching algorithm
  - Instant disqualification logic to filter bad matches
  - Detailed disqualification reasons (loan amount, credit score, state, etc.)
  - Prevents wasting time on incompatible lender requests
- Session-based and JWT authentication
- CORS configured for multiple origins
- Database migrations with Prisma
- TypeScript for type safety
- Comprehensive input validation with Zod
- Robust edge case handling

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
