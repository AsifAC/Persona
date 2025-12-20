# Persona

A people search application that aggregates public records data from multiple external APIs and provides comprehensive person profiles. Built with React 19, Vite, and Supabase.

## Architecture

Persona is a single-page application that implements a service-oriented architecture with clear separation between presentation, business logic, and data persistence layers.

### Technology Stack

- **Frontend Framework**: React 19 with functional components and hooks
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 6.26.0 with protected route implementation
- **Backend Services**: Supabase (PostgreSQL database, authentication, Row Level Security)
- **HTTP Client**: Axios 1.7.7 for external API communication
- **State Management**: React Context API for authentication state

### Application Structure

The application follows a modular component architecture:

```
src/
├── components/          # Reusable UI components
│   ├── Login.jsx       # Authentication form component
│   ├── Register.jsx    # User registration component
│   ├── SearchForm.jsx  # Search query input component
│   ├── PersonCard.jsx  # Person profile display component
│   ├── DataSection.jsx # Collapsible data section component
│   ├── ProtectedRoute.jsx # Route guard for authenticated routes
│   └── ErrorBoundary.jsx  # React error boundary implementation
├── pages/              # Route-level page components
│   ├── Dashboard.jsx   # Main search interface
│   ├── SearchResults.jsx # Search results display
│   ├── SearchHistory.jsx # Historical search queries
│   ├── Favorites.jsx   # Favorite search results
│   └── Profile.jsx     # User profile management
├── services/           # Business logic layer
│   ├── authService.js  # Supabase authentication wrapper
│   ├── searchService.js # Person search and data aggregation
│   ├── userService.js  # User profile operations
│   └── guestService.js # LocalStorage-based guest mode
├── contexts/           # React context providers
│   └── AuthContext.jsx # Global authentication state
└── config/             # Configuration modules
    ├── supabase.js     # Supabase client initialization
    └── api.js          # External API configuration
```

## Core Functionality

### Authentication System

The application implements dual authentication modes:

**Authenticated Mode**: Uses Supabase Auth with email/password and OAuth providers (Google, GitHub). User data is persisted in PostgreSQL with Row Level Security policies enforcing data isolation.

**Guest Mode**: LocalStorage-based session that allows limited functionality without account creation. Search queries and results are stored locally on the device.

Authentication state is managed through `AuthContext` which provides:
- `user`: Current authenticated user object
- `isGuest`: Boolean flag indicating guest mode
- `signIn(email, password)`: Email/password authentication
- `signUp(email, password, firstName, lastName)`: User registration
- `signInWithOAuth(provider)`: OAuth provider authentication
- `signOut()`: Session termination
- `isLoading`: Authentication state loading indicator

### Search Workflow

The search process follows a multi-stage pipeline:

1. **Query Validation**: Validates required fields (first name, last name) and optional parameters (age, location)

2. **Query Persistence**: 
   - Authenticated: Inserts into `search_queries` table with user_id foreign key
   - Guest: Stores in LocalStorage with generated UUID

3. **Parallel API Aggregation**: Executes concurrent requests to external data providers:
   - `fetchPersonData()`: Core person information
   - `fetchAddresses()`: Address history records
   - `fetchPhoneNumbers()`: Phone number records
   - `fetchSocialMedia()`: Social media profile links
   - `fetchCriminalRecords()`: Criminal background data
   - `fetchRelatives()`: Known relative associations

4. **Profile Creation/Update**: 
   - Checks for existing `person_profiles` record by name match
   - Creates new profile or updates existing with latest metadata
   - Inserts related data into normalized tables (addresses, phone_numbers, social_media, criminal_records, relatives)

5. **Confidence Score Calculation**: Computes match confidence based on data availability:
   - Person data: 30 points
   - Addresses: 20 points (5 points per address, max 20)
   - Phone numbers: 20 points (5 points per number, max 20)
   - Social media: 15 points (3 points per profile, max 15)
   - Criminal records: 10 points (binary)
   - Relatives: 5 points (1 point per relative, max 5)
   - Final score: (total_points / 100) * 100

6. **Result Persistence**: Creates `search_results` record linking query, profile, and confidence score

### Data Model

The database schema implements a normalized relational structure:

**Core Tables**:
- `profiles`: User profile data linked to Supabase Auth users
- `search_queries`: Search query parameters with user association
- `person_profiles`: Aggregated person data with JSONB metadata field
- `search_results`: Junction table linking queries to profiles with confidence scores

**Related Data Tables**:
- `addresses`: Address history with temporal data (start_date, end_date, is_current)
- `phone_numbers`: Phone records with type classification and verification timestamps
- `social_media`: Platform-specific social media profiles with activity timestamps
- `criminal_records`: Case records with jurisdiction and status information
- `relatives`: Relative associations with relationship type

**Auxiliary Tables**:
- `search_history`: Chronological search activity log
- `favorites`: User's favorite search results

All tables implement UUID primary keys, foreign key constraints with CASCADE deletion, and timestamp tracking (created_at, updated_at, last_updated).

### External API Integration

The application is designed to integrate with multiple external data provider APIs. API configuration is centralized in `src/config/api.js`:

```javascript
API_CONFIG = {
  PEOPLE_DATA: {
    API_KEY: process.env.VITE_PEOPLE_DATA_API_KEY,
    BASE_URL: process.env.VITE_PEOPLE_DATA_API_URL,
    ENDPOINTS: { SEARCH, DETAILS }
  },
  CRIMINAL_RECORDS: { ... },
  SOCIAL_MEDIA: { ... }
}
```

API requests are made through `makeAPIRequest()` helper which handles:
- Authorization header injection
- Content-Type header management
- Error handling and response parsing
- HTTP status code validation

Each data fetch function (`fetchPersonData`, `fetchAddresses`, etc.) implements:
- Promise-based async/await pattern
- Error handling with fallback to empty arrays/objects
- Response normalization for consistent data structure
- Mock data fallback when API keys are not configured

### Service Layer

**searchService.js**: Core search orchestration
- `searchPerson(query)`: Main search entry point
- `createOrUpdatePersonProfile(data)`: Profile CRUD operations
- `calculateConfidenceScore(data)`: Match confidence algorithm
- `getSearchResult(resultId)`: Result retrieval with joins

**authService.js**: Authentication abstraction
- Wraps Supabase Auth methods with consistent error handling
- Provides OAuth provider integration
- Manages session state and password reset flows

**userService.js**: User profile operations
- Profile CRUD operations
- Search history retrieval
- Favorites management

**guestService.js**: LocalStorage persistence
- Implements same interface as authenticated services
- Uses LocalStorage with JSON serialization
- Generates UUIDs for local entity identification

### Security Implementation

**Row Level Security (RLS)**: All database tables have RLS policies enforcing:
- Users can only access their own search queries and results
- Profile data is read-only for authenticated users
- Write operations require authentication
- Guest mode bypasses RLS (uses LocalStorage)

**Protected Routes**: `ProtectedRoute` component wraps authenticated pages:
- Redirects to `/login` if unauthenticated
- Allows guest mode access with limited functionality
- Preserves intended destination for post-authentication redirect

**API Key Management**: External API keys are stored in environment variables and never exposed to client-side code. Supabase anon key is safe for client-side use per Supabase security model.

## Usage

### Search Interface

The Dashboard component (`/dashboard`) provides the primary search interface:

1. Enter search parameters:
   - First Name (required)
   - Last Name (required)
   - Age (optional)
   - Location (optional)

2. Submit query triggers `searchService.searchPerson()` which:
   - Validates input
   - Persists query
   - Aggregates data from external APIs
   - Creates/updates person profile
   - Calculates confidence score
   - Navigates to `/results` with result data

### Search Results

The SearchResults page displays:
- Person profile card with basic information
- Confidence score indicator
- Collapsible data sections:
  - Addresses (with temporal information)
  - Phone Numbers (with type classification)
  - Social Media (with platform and activity)
  - Criminal Records (with case details)
  - Relatives (with relationship types)

Each result can be added to favorites, which creates a record in the `favorites` table (authenticated) or LocalStorage (guest).

### Search History

The SearchHistory page (`/history`) displays chronological list of all search queries:
- Query parameters (name, age, location)
- Timestamp
- Link to view result
- Option to re-run search

### Favorites

The Favorites page (`/favorites`) displays all favorite search results:
- Quick access to frequently referenced profiles
- Remove from favorites functionality
- Direct navigation to full result view

### User Profile

The Profile page (`/profile`) provides:
- User account information display
- OAuth provider linking status
- Password change functionality
- Account deletion (with data cascade)

## Development

### Environment Variables

Required environment variables:

```
VITE_SUPABASE_URL=<supabase_project_url>
VITE_SUPABASE_ANON_KEY=<supabase_anon_key>
VITE_ENFORMIONGO_PROXY_URL=<supabase_functions_url>/enformion-proxy
VITE_ADMIN_EMAIL=<admin_email>
VITE_ADMIN_EMAILS=<comma_separated_admin_emails>
VITE_VERIFIER_EMAILS=<comma_separated_verifier_emails>
```

The EnformionGO credentials are configured as Supabase Edge Function secrets:

```
ENFORMIONGO_BASE_URL=<enformiongo_api_base_url>
ENFORMIONGO_API_KEY_NAME=<enformiongo_access_profile_name>
ENFORMIONGO_API_KEY_PASSWORD=<enformiongo_access_profile_password>
ENFORMIONGO_CLIENT_TYPE=<required for JS clients, e.g. Persona-Web>
```

Optional per-search endpoints (only needed if EnformionGO does not accept the base URL with `galaxy-search-type`):

```
ENFORMIONGO_ENDPOINT_PERSON_SEARCH=<full endpoint URL>
ENFORMIONGO_ENDPOINT_CONTACT_ENRICHMENT=<full endpoint URL>
ENFORMIONGO_ENDPOINT_CONTACT_ENRICHMENT_PLUS=<full endpoint URL>
ENFORMIONGO_ENDPOINT_REVERSE_PHONE=<full endpoint URL>
ENFORMIONGO_ENDPOINT_CRIMINAL_RECORDS=<full endpoint URL>
ENFORMIONGO_ENDPOINT_PROPERTY_RECORDS=<full endpoint URL>
ENFORMIONGO_ENDPOINT_ADDRESS_SEARCH=<full endpoint URL>
```

Deploy the Edge Function and set secrets:

```bash
supabase functions deploy enformion-proxy
supabase secrets set ENFORMIONGO_BASE_URL=... ENFORMIONGO_API_KEY_NAME=... ENFORMIONGO_API_KEY_PASSWORD=...
```

### Verified Submissions

Run `database/verified_submissions.sql` in the Supabase SQL Editor to create the submission tables and RLS policies.

Create a Supabase Storage bucket named `person-proofs` (private) for proof uploads.

Add verifier users after they sign up:

```sql
INSERT INTO public.verification_admins (user_id, email)
VALUES ('<user_uuid>', '<email>');
```

### Database Schema

The database schema is defined in `database/schema.sql`. Execute this script in the Supabase SQL Editor to initialize:
- All tables with proper constraints
- Indexes for performance optimization
- Row Level Security policies
- Database triggers for timestamp updates

Additional SQL scripts:
- `database/fix_security_performance.sql`: RLS policy updates and performance indexes
- `database/update_oauth_profile_trigger.sql`: OAuth profile synchronization trigger
- `database/fix_person_profiles_rls.sql`: RLS policies for person_profiles table
- `database/verified_submissions.sql`: Verified user submission tables and RLS policies

### Security

See `SECURITY.md` for security configuration, including:
- Leaked password protection (Have I Been Pwned) setup
- Password policy recommendations
- Multi-factor authentication guidance
- Security monitoring best practices

### Build and Deployment

Development server:
```bash
npm run dev
```

Production build:
```bash
npm run build
```

Output directory: `dist/` (static assets ready for deployment to any static hosting service)

## License

This project is private and proprietary. Copyright (c) 2025 Asif Chowdhury.

## Support

For issues or questions, please check the troubleshooting section above or review the configuration files mentioned in the setup instructions.
