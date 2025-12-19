# Persona - People Search Application

A comprehensive people search application similar to BeenVerified and TruthFinder, built with React, Vite, and Supabase.

## Features

- 🔐 User authentication and profiles
- 🔍 Advanced people search by name, age, and location
- 📊 Comprehensive search results including:
  - Addresses
  - Phone numbers
  - Social media profiles
  - Criminal records
  - Known relatives
- 📜 Search history tracking
- ⭐ Favorite searches
- 🎨 Modern, user-friendly interface

## Tech Stack

- **Frontend**: React 19, Vite
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Routing**: React Router DOM
- **HTTP Client**: Axios

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [Supabase](https://supabase.com)
2. Go to your project settings → API
3. Copy your **Project URL** and **anon/public key**

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
# Get these from: https://app.supabase.com/project/_/settings/api
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# External API Keys
# Replace with your actual API keys from data provider services
# Example services: WhitePages, PeopleFinder, BeenVerified, TruthFinder, etc.
VITE_PEOPLE_DATA_API_KEY=your_people_data_api_key_here
VITE_PEOPLE_DATA_API_URL=https://api.example.com/v1

# Criminal Records API (if using separate service)
VITE_CRIMINAL_RECORDS_API_KEY=your_criminal_records_api_key_here
VITE_CRIMINAL_RECORDS_API_URL=https://api.criminalrecords.com/v1

# Social Media API (if using separate service)
VITE_SOCIAL_MEDIA_API_KEY=your_social_media_api_key_here
VITE_SOCIAL_MEDIA_API_URL=https://api.socialmedia.com/v1
```

### 4. Set Up Database

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL script to create all tables, indexes, and security policies

### 5. Configure External APIs

The application is designed to work with external people data APIs. You'll need to:

1. **Choose a data provider** (examples):
   - WhitePages API
   - PeopleFinder API
   - BeenVerified API (if available)
   - TruthFinder API (if available)
   - Other public records APIs

2. **Update API configuration** in `src/config/api.js`:
   - Replace API endpoints with your provider's endpoints
   - Adjust request/response formats to match your API provider
   - Update the data mapping in `src/services/searchService.js`

3. **API Integration Points**:
   - `fetchPersonData()` - Main person information
   - `fetchAddresses()` - Address history
   - `fetchPhoneNumbers()` - Phone number records
   - `fetchSocialMedia()` - Social media profiles
   - `fetchCriminalRecords()` - Criminal background
   - `fetchRelatives()` - Known relatives

### 6. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
persona/
├── database/
│   └── schema.sql          # Database schema for Supabase
├── public/
├── src/
│   ├── components/         # Reusable React components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── SearchForm.jsx
│   │   ├── PersonCard.jsx
│   │   ├── DataSection.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/              # Page components
│   │   ├── Dashboard.jsx
│   │   ├── SearchResults.jsx
│   │   ├── SearchHistory.jsx
│   │   ├── Favorites.jsx
│   │   └── Profile.jsx
│   ├── services/           # Business logic services
│   │   ├── authService.js
│   │   ├── searchService.js
│   │   └── userService.js
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx
│   ├── config/             # Configuration files
│   │   ├── supabase.js
│   │   └── api.js
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── .env                    # Environment variables (create this)
├── .env.example            # Example environment variables
└── package.json
```

## Key Files to Configure

### 1. `src/config/supabase.js`
- Replace `YOUR_SUPABASE_URL_HERE` with your Supabase project URL
- Replace `YOUR_SUPABASE_ANON_KEY_HERE` with your Supabase anon key

### 2. `src/config/api.js`
- Update `API_CONFIG.PEOPLE_DATA` with your people data API credentials
- Update `API_CONFIG.CRIMINAL_RECORDS` with your criminal records API credentials
- Update `API_CONFIG.SOCIAL_MEDIA` with your social media API credentials
- Adjust `ENDPOINTS` to match your API provider's endpoints

### 3. `src/services/searchService.js`
- Modify API request formats to match your provider's API
- Adjust response parsing based on your API's response structure
- Update data mapping for addresses, phone numbers, etc.

## API Integration Guide

The search service makes API calls to external data providers. Here's how to integrate:

1. **API Request Format**: Update the request body/headers in each fetch function
2. **Response Parsing**: Adjust how responses are parsed based on your API's format
3. **Error Handling**: Add appropriate error handling for API failures
4. **Rate Limiting**: Implement rate limiting if your API has restrictions

Example API integration structure:
```javascript
async fetchPersonData(query) {
  const response = await fetch('YOUR_API_ENDPOINT', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_CONFIG.PEOPLE_DATA.API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      first_name: query.firstName,
      last_name: query.lastName,
      // ... other parameters
    }),
  })
  return await response.json()
}
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure
- Supabase Row Level Security (RLS) is enabled to protect user data
- All database queries are protected by RLS policies

## Troubleshooting

### Supabase Connection Issues
- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is active
- Ensure RLS policies are set up correctly

### API Integration Issues
- Check API endpoint URLs are correct
- Verify API keys are valid
- Review API documentation for request/response formats
- Check browser console for detailed error messages

### Database Issues
- Ensure you've run the schema.sql script
- Check Supabase dashboard for any errors
- Verify RLS policies are enabled

## License

This project is private and proprietary.

## Support

For issues or questions, please refer to the code comments marked with `TODO:` for configuration points.
