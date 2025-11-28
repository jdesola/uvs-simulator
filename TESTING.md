# Testing UVS Ultra Login Integration

## Prerequisites

1. **UVS Ultra Account**: Make sure you have a valid account at https://uvsultra.online
2. **Node.js**: Ensure Node.js is installed and working

## Steps to Test

### Step 1: Start the API Server

Open a terminal in the root directory and run:

```bash
npm run api
```

You should see:
```
UVS Simulator API server running on port 3001
```

**If you get an error**, it might be because dependencies aren't installed in the root. Run:
```bash
npm install
```

### Step 2: Start the Client

Open a **second terminal** and run:

```bash
cd client
npm run dev
```

You should see the Vite dev server start on `http://localhost:5173`

### Step 3: Test the Login Flow

1. Open your browser to `http://localhost:5173`
2. You'll be redirected to the login page
3. Enter your UVS Ultra email and password
4. Click "Login"

## Troubleshooting

### "Invalid password" error

This usually means one of these issues:

**Problem 1: API server not running**
- Check if you see the API server running message in terminal 1
- Try accessing `http://localhost:3001/api/decks` directly - you should get a 401 error (which is correct, means server is running)

**Problem 2: CORS issues**
- Open browser DevTools (F12) → Console tab
- Look for CORS errors (red text about "Access-Control-Allow-Origin")
- If you see CORS errors, the API server needs to be configured

**Problem 3: Wrong credentials**
- Verify you can login at https://uvsultra.online with the same credentials
- Password is case-sensitive

**Problem 4: Network request failing**
- Open DevTools → Network tab
- Try logging in and watch for a request to `http://localhost:3001/api/auth/login`
- If no request appears, the client isn't connecting to the API
- If the request shows "net::ERR_CONNECTION_REFUSED", the API server isn't running

### Testing without running the API server

If you just want to test the UI without actual authentication:

1. Skip the API server (don't run `npm run api`)
2. On the login page, click "Continue without login (sample decks)"
3. This will take you to mode selection with sample decks

## Quick Verification Commands

**Check if API server is running:**
```bash
netstat -ano | findstr :3001
```
(Should show a process listening on port 3001)

**Check if client is running:**
```bash
netstat -ano | findstr :5173
```
(Should show Vite dev server)

**Test API server directly:**
```bash
curl http://localhost:3001/api/decks
```
(Should return a 401 error, which means server is running but you're not authenticated)

## Development Tips

### Hot Reload
- Both servers support hot reload
- Changes to frontend code (client/) will refresh automatically
- Changes to backend code (src/) require restarting `npm run api`

### Viewing Logs
- API server logs appear in terminal 1
- Client errors appear in browser DevTools Console
- Network requests appear in browser DevTools Network tab

### Session Storage
- Your session is stored in browser's localStorage with key "sessionId"
- To logout: Open DevTools → Application tab → Local Storage → Delete "sessionId"

## Expected Flow

1. Visit `http://localhost:5173` → Auto-redirect to `/login`
2. Login with UVS Ultra credentials
3. Redirect to `/select-deck` → See your decks and folders
4. Click a deck → Redirect to `/select-mode`
5. Choose CPU or Player → Redirect to `/roll`
6. Roll for starting player → Redirect to `/game`

## Next Steps After Testing

Once login works:
- Test deck selection
- Test folder navigation
- Test both CPU and Player modes
- Verify deck data loads correctly in the game
