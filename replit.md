# Overview

This is a REST API application for a mortgage broker platform that manages loan quotes, lenders, employees, and loan products. Built with Express.js, TypeScript, and Prisma ORM with PostgreSQL, the system facilitates the complete lifecycle of mortgage quote management including applicant information, loan details, priorities, rental information, and term sheets. The platform supports multiple user roles (users, employees/admins, lenders) with authentication via Google OAuth and JWT tokens.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Authentication & Authorization

**Problem**: Need to support both OAuth-based social login and traditional email/password authentication across multiple user types (regular users, employees, lenders).

**Solution**: Hybrid authentication system using:
- Passport.js with Google OAuth 2.0 strategy for social login
- JWT tokens for API authentication stored in HTTP-only cookies
- bcrypt for password hashing
- Role-based access control (RBAC) with middleware guards

**Rationale**: Provides flexibility for users while maintaining security. OAuth reduces friction for user onboarding, while JWT tokens enable stateless API authentication. Cookie-based token storage prevents XSS attacks.

**Trade-offs**:
- Pros: User-friendly, secure, supports multiple auth flows
- Cons: Increased complexity managing multiple authentication methods, cookie configuration requires CORS coordination

## Database Architecture

**Problem**: Need to manage complex relationships between quotes, applicants, loans, lenders, employees, and term sheets with data integrity.

**Solution**: PostgreSQL with Prisma ORM for type-safe database access and migrations. Extended with Prisma Accelerate for connection pooling and caching.

**Key Schema Decisions**:
- Separate tables for different loan types (Fix & Flip vs DSCR Rental) to accommodate different data requirements
- Junction table (Loan_Connection) linking lenders, quotes, employees, and loan products
- Universal term sheet model to standardize offer presentation across lenders
- Status enums for quote workflow (draft, submitted, under_review, approved, etc.)

**Rationale**: Strong typing with Prisma prevents runtime errors, while PostgreSQL provides ACID compliance for financial data. Separate loan type tables avoid nullable fields and maintain data consistency.

**Trade-offs**:
- Pros: Type safety, automatic migrations, excellent developer experience
- Cons: Prisma adds abstraction layer overhead, potential for n+1 queries without careful includes

## API Structure

**Problem**: Need RESTful endpoints for multiple entities with consistent patterns for CRUD operations.

**Solution**: Modular route structure with versioned API (`/api/v1/`) organized by resource:
- `/auth` - Authentication (Google OAuth, login, logout)
- `/users` - User management
- `/employee` - Employee invitation and management
- `/lender` - Lender invitation and management
- `/quotes` - Quote lifecycle management
- `/loan-products` - Lender loan product catalog
- `/loan-connections` - Links between quotes, lenders, and products
- `/universal-term-sheets` - Standardized term sheet offers

**Middleware Chain**:
1. CORS configuration for cross-origin requests
2. JSON body parser
3. Cookie parser for JWT extraction
4. Session management
5. Route-specific authentication (`verifyJWT`)
6. Role-based authorization (`requireAdmin`, `requireEmployee`)

**Rationale**: Clear separation of concerns with dedicated controllers for each resource. Middleware composition allows flexible security policies per route.

## Invitation System

**Problem**: Need secure onboarding flow for employees and lenders without pre-creating passwords.

**Solution**: JWT-based invitation tokens with email delivery:
- Admin sends invitation via email with embedded JWT token
- Token contains user type (`employee_invitation` or `lender_invitation`) and database ID
- Registration endpoint validates token and allows password creation
- Token expiration prevents stale invitations

**Rationale**: Secure, self-contained tokens eliminate need for separate invitation tracking table. Email delivery ensures proper recipient verification.

## Validation Layer

**Problem**: Need consistent input validation across all endpoints with clear error messages.

**Solution**: Zod schema validation library for runtime type checking with schemas organized by feature:
- `/schemas/auth/` - Login schemas
- `/schemas/employee/` - Employee creation schemas
- `/schemas/lender/` - Loan product schemas
- `/schemas/quote/` - Quote, applicant, loan details, priorities schemas

**Rationale**: Zod provides TypeScript type inference, composable schemas, and detailed error messages. Co-locating schemas with features improves maintainability.

## Quote Workflow

**Problem**: Multi-step quote creation process with different data requirements per loan type.

**Solution**: Stateful quote progression with `active_step` field tracking:
1. Initial quote creation (address, loan type, living situation)
2. Applicant information
3. Loan details (varies by loan type)
4. Priorities (speed, fees, leverage preferences)
5. Rental info (DSCR loans only)

Dynamic schema validation adjusts based on loan type and user inputs (e.g., properties owned).

**Rationale**: Step-based approach prevents overwhelming users and allows partial completion. Status tracking enables admin oversight of quote pipeline.

## Pagination & Search

**Problem**: Need efficient data retrieval for lists that may grow large.

**Solution**: Reusable `PaginationService` utility providing:
- Configurable page size with max limits
- Skip/take calculation for database queries
- Search across multiple fields
- Metadata (total count, page count) in responses

**Rationale**: Centralized pagination logic ensures consistency and prevents N+1 query patterns. Search functionality improves admin user experience.

# External Dependencies

## Email Service (Nodemailer)

**Purpose**: Send transactional emails for invitations, welcome messages, password resets, and quote status updates.

**Configuration**: SMTP-based with Gmail support (configurable via environment variables).

**Integration Points**:
- Employee invitation emails with registration links
- Lender invitation emails
- Quote status notifications to users

## Google OAuth 2.0

**Purpose**: Social authentication for user login.

**Configuration**: 
- Client ID and secret from Google Cloud Console
- Callback URL varies by environment (dev/staging/production)
- Scopes: profile, email

**Integration Points**: `/auth/google` initiation, `/auth/google/callback` handler

## Prisma Accelerate

**Purpose**: Connection pooling and query caching for Prisma Client.

**Integration**: Extended on PrismaClient instance in all controllers for performance optimization.

## Frontend Applications

The API serves multiple frontend applications:
- Main user portal (themortgageplatform.com)
- Admin dashboard (admin.themortgageplatform.com)
- Lender portal (separate subdomain)

CORS is configured to allow all subdomains in production with credentials support.

## Environment-Based Configuration

The system uses a `STAGE` environment variable to switch between:
- `dev` - Local development (localhost:3000, localhost:4000)
- `staging` - Vercel preview deployments
- `production` - Production domains (themortgageplatform.com and subdomains)

This affects callback URLs, frontend URLs, cookie domains, and CORS origins.