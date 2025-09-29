# Mortgage Broker Quote API - Postman Collection

## 📋 Overview

This Postman collection provides comprehensive testing and documentation for the Mortgage Broker Quote API. It includes all CRUD operations for quotes, applicant information, loan details, priorities, and rental information.

## 🚀 Quick Start

### 1. Import Collection and Environment

1. **Import Collection**: Import `Mortgage_Broker_Quote_API.postman_collection.json`
2. **Import Environment**: Import `Mortgage_Broker_Environment.postman_environment.json`
3. **Select Environment**: Choose "Mortgage Broker Environment" in Postman

### 2. Authentication Setup

Before using the API, you need to authenticate:

1. **Get JWT Token**: Use your authentication endpoint to get a JWT token
2. **Update Environment**: Set the `authToken` variable in the environment with your JWT token
3. **Bearer Token**: The collection is pre-configured to use Bearer token authentication

### 3. Update Base URL

If your API is running on a different port or domain, update the `baseUrl` variable in the environment:
- Default: `http://localhost:3000/api`
- Production: `https://your-api-domain.com/api`

## 📚 API Endpoints

### Quote Management
- **POST** `/quotes` - Create a new quote
- **GET** `/quotes/:id` - Get a specific quote
- **PUT** `/quotes/:id` - Update a quote
- **GET** `/quotes/:id/whole` - Get complete quote with all relations

### Applicant Information
- **POST** `/quotes/applicant-info` - Create applicant information
- **GET** `/quotes/:id/applicant-info` - Get applicant information
- **PUT** `/quotes/:id/applicant-info` - Update applicant information

### Loan Details
- **POST** `/quotes/loan-details` - Create loan details
- **GET** `/quotes/:id/loan-details` - Get loan details
- **PUT** `/quotes/:id/loan-details` - Update loan details

### Priorities
- **POST** `/quotes/priorities` - Create priority settings
- **GET** `/quotes/:id/priorities` - Get priority settings
- **PUT** `/quotes/:id/priorities` - Update priority settings

### Rental Information
- **POST** `/quotes/rental-info` - Create rental information
- **GET** `/quotes/:id/rental-info` - Get rental information
- **PUT** `/quotes/:id/rental-info` - Update rental information

## 🔧 Loan Types and Schemas

### Fix & Flip Loans
- **Purpose**: `purchase` or `refinance`
- **Required Fields**: Vary based on purpose and rehab funding needs
- **Conditional Fields**: `rehab_amount_requested` (if requesting rehab funds)

### DSCR Loans
- **Purpose**: `purchase`, `refinance-no-cash`, or `refinance-cash-out`
- **Required Fields**: Vary based on purpose, rehab needs, and tenant status
- **Conditional Fields**: 
  - Rehab fields (if requesting rehab funds)
  - Tenant fields (if property has existing tenant)
  - Market rent (if no existing tenant)

## 📝 Demo Data Examples

### Sample Quote Creation
```json
{
  "address": "123 Main St, New York, NY 10001",
  "is_living_in_property": false,
  "loan_type": "bridge_fix_and_flip"
}
```

### Sample Applicant Info
```json
{
  "full_name": "John Smith",
  "citizenship": "US Citizen",
  "company_ein": "12-3456789",
  "company_name": "Smith Investments LLC",
  "liquid_funds_available": "$500,000",
  "credit_score": 750,
  "phone_number": "(555) 123-4567",
  "properties_owned": 3,
  "company_state": "California",
  "quote_id": 1,
  "whats_most_important": "Fast closing and competitive rates"
}
```

### Sample Fix & Flip Purchase Loan
```json
{
  "purpose_of_loan": "purchase",
  "purchase_price": "$450,000",
  "contract_close_date": "2024-02-15",
  "after_repair_property_value": "$650,000",
  "exit_plan": "sell",
  "completed_fix_and_flips_2_years": "5",
  "as_is_property_value": "$400,000",
  "has_rehab_funds_requested": true,
  "quote_id": 1,
  "rehab_amount_requested": "$75,000"
}
```

## 🔐 Authentication

All endpoints require authentication via JWT token:

1. **Token Location**: Cookie named `authToken`
2. **Token Format**: JWT (JSON Web Token)
3. **Token Validation**: Server validates token and extracts user information
4. **User Context**: `req.user` contains `{id, email, name}`

## ⚠️ Error Handling

### Common Error Responses

**401 Unauthorized**
```json
{
  "error": "No authentication token found"
}
```

**400 Bad Request**
```json
{
  "error": "Validation error message"
}
```

**404 Not Found**
```json
{
  "error": "Quote not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

## 🧪 Testing Workflow

### Recommended Testing Order

1. **Authentication**: Get JWT token and set in environment
2. **Create Quote**: Start with a basic quote
3. **Add Applicant Info**: Complete applicant details
4. **Add Loan Details**: Based on loan type and purpose
5. **Set Priorities**: Define customer preferences
6. **Add Rental Info**: If applicable
7. **Get Complete Quote**: Verify all data is linked correctly
8. **Update Operations**: Test partial updates

### Auto-Generated Variables

The collection includes scripts that automatically:
- Save quote IDs from create responses
- Generate timestamps for demo purposes
- Update environment variables

## 📊 Response Examples

### Complete Quote Response
```json
{
  "id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "user_id": 1,
  "address": "123 Main St, New York, NY 10001",
  "is_living_in_property": false,
  "loan_type": "bridge_fix_and_flip",
  "quoteApplicantInfo": {
    "id": 1,
    "full_name": "John Smith",
    "credit_score": 750,
    // ... other applicant fields
  },
  "quoteLoanDetails": {
    "id": 1,
    "purpose_of_loan": "purchase",
    "purchase_price": "$450,000",
    // ... other loan fields
  },
  "quotePriorities": {
    "id": 1,
    "fast_closing": true,
    "low_rates": false,
    // ... other priority fields
  },
  "quoteRentalInfo": {
    "id": 1,
    "market_rent": "$3,200",
    // ... other rental fields
  }
}
```

## 🔄 Frontend Integration Notes

### For Frontend Developers

1. **Base URL**: Use environment variable for different environments
2. **Authentication**: Include JWT token in cookies for all requests
3. **Error Handling**: Implement proper error handling for all status codes
4. **Validation**: Client-side validation should match server-side schemas
5. **Loading States**: Handle async operations with proper loading indicators
6. **Data Flow**: Use the complete quote endpoint for displaying full quote details

### State Management

- **Quote State**: Store complete quote object with nested relations
- **Form State**: Manage individual form sections (applicant, loan, etc.)
- **Validation State**: Track validation errors for each form section
- **Loading State**: Track loading states for each API operation

## 🛠️ Development Tips

1. **Use Environment Variables**: Switch between dev/staging/prod easily
2. **Test Edge Cases**: Try invalid data, missing fields, etc.
3. **Monitor Network**: Check request/response timing and size
4. **Validate Responses**: Ensure response structure matches expectations
5. **Test Authentication**: Verify token expiration and refresh logic

## 📞 Support

For questions about this API:
1. Check the endpoint descriptions in Postman
2. Review the demo request bodies
3. Test with the provided sample data
4. Contact the backend team for schema questions

---

**Happy Testing! 🚀**
