import express, { Request, Response } from 'express';
import cors from 'cors';
import { UVSUltraAuth } from './services/UVSUltraAuth';

const app = express();
const port = process.env.PORT || 3001;

// Store auth instances per session (in production, use proper session management)
const authSessions = new Map<string, UVSUltraAuth>();

app.use(cors());
app.use(express.json());

// Helper to get or create auth instance
const getAuthInstance = (sessionId: string): UVSUltraAuth => {
  if (!authSessions.has(sessionId)) {
    authSessions.set(sessionId, new UVSUltraAuth());
  }
  return authSessions.get(sessionId)!;
};

// Helper to generate session ID (in production, use proper session management)
const generateSessionId = (req: Request): string => {
  // Simple session ID based on IP and timestamp (use proper session management in production)
  return `${req.ip}-${Date.now()}`;
};

/**
 * POST /api/auth/login
 * Login with UVS Ultra credentials
 */
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const sessionId = generateSessionId(req);
    const auth = getAuthInstance(sessionId);
    
    const success = await auth.login({ email, password });
    
    if (success) {
      res.json({ 
        success: true, 
        sessionId,
        message: 'Login successful' 
      });
    } else {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/decks
 * Get user's deck list (all decks including those in folders)
 */
app.get('/api/decks', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const auth = getAuthInstance(sessionId);
    
    if (!auth.isLoggedIn()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get all decks recursively from all folders
    const decks = await auth.getAllDecksRecursive();
    
    res.json(decks);
  } catch (error) {
    console.error('Get decks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/folders
 * Get user's folder list
 */
app.get('/api/folders', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const auth = getAuthInstance(sessionId);
    
    if (!auth.isLoggedIn()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const folders = await auth.getUserFolders();
    
    res.json(folders);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/folders/:folderId/decks
 * Get decks in a specific folder
 */
app.get('/api/folders/:folderId/decks', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const { folderId } = req.params;
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const auth = getAuthInstance(sessionId);
    
    if (!auth.isLoggedIn()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decks = await auth.getDecksInFolder(folderId);
    
    res.json(decks);
  } catch (error) {
    console.error('Get folder decks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/folders/:folderId/subfolders
 * Get subfolders within a specific folder
 */
app.get('/api/folders/:folderId/subfolders', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const { folderId } = req.params;
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const auth = getAuthInstance(sessionId);
    
    if (!auth.isLoggedIn()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const subfolders = await auth.getSubfolders(folderId);
    
    res.json(subfolders);
  } catch (error) {
    console.error('Get subfolders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/decks/:deckId
 * Get full deck details
 */
app.get('/api/decks/:deckId', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const { deckId } = req.params;
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const auth = getAuthInstance(sessionId);
    
    if (!auth.isLoggedIn()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const deck = await auth.getDeckDetails(deckId);
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    res.json(deck);
  } catch (error) {
    console.error('Get deck details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout and clear session
 */
app.post('/api/auth/logout', (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    
    if (sessionId && authSessions.has(sessionId)) {
      const auth = authSessions.get(sessionId)!;
      auth.logout();
      authSessions.delete(sessionId);
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`UVS Simulator API server running on port ${port}`);
});
