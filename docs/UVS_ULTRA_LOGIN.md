# UVS Ultra Login Integration

This document explains how to use the UVS Ultra login feature to access your decks in the UVS Simulator.

## Overview

The simulator now integrates with UVS Ultra (uvsultra.online) to allow users to:
- Login with their UVS Ultra credentials
- Browse their deck folders and decks
- Select and play with their own decks

## Architecture

### Backend (API Server)
- **Location**: `src/api-server.ts`
- **Port**: 3001
- **Authentication Service**: `src/services/UVSUltraAuth.ts`

The backend acts as a proxy between the client and UVS Ultra, handling:
- User authentication
- Session management
- Deck list retrieval
- Folder browsing
- Full deck data fetching

### Frontend (React Client)
- **Location**: `client/src/`
- **Port**: 5173 (Vite dev server)
- **Pages**:
  - `LoginPage.tsx` - Login form
  - `DeckSelectionPage.tsx` - Deck browser

## How to Run

### 1. Start the API Server

```bash
# Terminal 1: Start the backend API server
npm run api

# Or for development with auto-reload:
npm install -g nodemon
npm run api:dev
```

The API server will start on `http://localhost:3001`

### 2. Start the Client

```bash
# Terminal 2: Start the React development server
cd client
npm run dev
```

The client will start on `http://localhost:5173`

## User Flow

1. **Landing Page** (`/`)
   - User sees option to "Login with UVS Ultra" or play with sample decks
   - Click "Login with UVS Ultra" to proceed to login

2. **Login Page** (`/login`)
   - User enters their UVS Ultra email and password
   - Credentials are sent to the API server
   - API server logs in to UVS Ultra and returns a session ID
   - Session ID is stored in localStorage for subsequent requests

3. **Deck Selection Page** (`/select-deck`)
   - Displays user's folders and decks
   - Click on a folder to view decks inside
   - Click on a valid deck to select it
   - Invalid decks are shown but disabled

4. **Game Flow**
   - After selecting a deck, user proceeds to roll page (`/roll`)
   - Then to the game page (`/game`) with their selected deck

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/logout` - Logout and clear session

### Decks
- `GET /api/decks` - Get user's deck list
- `GET /api/folders` - Get user's folder list
- `GET /api/folders/:folderId/decks` - Get decks in a folder
- `GET /api/decks/:deckId` - Get full deck details

## Authentication Flow

### How UVS Ultra Authentication Works

Based on the captured network traffic:

1. **Credentials are stored in cookies**:
   - `login`: URL-encoded email
   - `password`: SHA1 hash of the password
   - `PHPSESSID`: Session identifier

2. **API responses are HTML**, not JSON
   - We use Cheerio to parse the HTML and extract:
     - Deck names, IDs, and metadata
     - Folder structure
     - Card lists from deck pages

3. **Session Management**:
   - Each user gets a unique session ID
   - Session ID maps to a UVSUltraAuth instance on the server
   - Client includes session ID in `X-Session-Id` header

## Security Considerations

⚠️ **Important**: This is a development implementation. For production, you should:

1. **Use HTTPS**: All communication should be encrypted
2. **Secure Session Management**: Use proper session store (Redis, database)
3. **Password Hashing**: Passwords are hashed with SHA1 (as UVS Ultra uses), but never stored
4. **CORS Configuration**: Restrict allowed origins
5. **Rate Limiting**: Prevent brute force attacks
6. **Token Expiration**: Implement session timeouts
7. **Environment Variables**: Store API URLs in environment variables

## Development Notes

### Adding New Features

To add new UVS Ultra features:

1. **Capture the network request** using the analyzer:
   ```bash
   npm run analyze-uvs-login
   ```

2. **Add parsing logic** to `UVSUltraAuth.ts`:
   - Create a parsing method for the HTML response
   - Use Cheerio selectors to extract data

3. **Add API endpoint** to `api-server.ts`:
   - Create a new route
   - Call the UVSUltraAuth method
   - Return JSON response

4. **Update the client** to call the new endpoint

### Troubleshooting

**Login fails**:
- Check that the API server is running on port 3001
- Verify credentials are correct on uvsultra.online
- Check browser console for CORS errors

**Decks not loading**:
- Verify you're logged in (check localStorage for sessionId)
- Check API server logs for errors
- Ensure UVS Ultra site is accessible

**CORS errors**:
- Make sure API server has CORS middleware enabled
- Check that client is using correct API URL (localhost:3001)

## Files Structure

```
src/
├── api-server.ts              # Express API server
└── services/
    └── UVSUltraAuth.ts        # UVS Ultra authentication service

client/src/
├── App.tsx                     # Main app with API client
└── pages/
    ├── LoginPage.tsx           # Login form
    ├── LoginPage.css           # Login styles
    ├── DeckSelectionPage.tsx   # Deck browser
    └── DeckSelectionPage.css   # Deck browser styles
```

## Future Enhancements

- [ ] Deck import to local storage for offline play
- [ ] Auto-sync with UVS Ultra when deck changes
- [ ] Support for sideboard selection
- [ ] Deck validation before game start
- [ ] Remember last selected deck
- [ ] Quick play with favorite decks
