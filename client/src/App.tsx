import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DeckSelectionPage } from './pages/DeckSelectionPage';
import { ModeSelectionPage } from './pages/ModeSelectionPage';
import RollPage from './pages/RollPage';
import GamePage from './pages/GamePage';
import './App.css';

// API client for communicating with the backend
class UVSUltraAuthClient {
  private sessionId: string | null = null;

  constructor() {
    // Load session ID from localStorage if it exists
    this.sessionId = localStorage.getItem('sessionId');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.sessionId) {
      headers['X-Session-Id'] = this.sessionId;
    }
    
    return headers;
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        this.sessionId = data.sessionId;
        localStorage.setItem('sessionId', data.sessionId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async getUserDecks() {
    const response = await fetch('http://localhost:3001/api/decks', {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async getUserFolders() {
    const response = await fetch('http://localhost:3001/api/folders', {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async getDecksInFolder(folderId: string) {
    const response = await fetch(`http://localhost:3001/api/folders/${folderId}/decks`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async getDeckDetails(deckId: string) {
    const response = await fetch(`http://localhost:3001/api/decks/${deckId}`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async logout() {
    try {
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.sessionId = null;
      localStorage.removeItem('sessionId');
    }
  }
}

const App: React.FC = () => {
  const [authClient] = useState(() => new UVSUltraAuthClient());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const success = await authClient.login(email, password);
    if (success) {
      setIsLoggedIn(true);
    }
    return success;
  };

  const handleDeckSelected = (deckId: string) => {
    setSelectedDeckId(deckId);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={<LoginPage onLogin={handleLogin} />} 
        />
        <Route 
          path="/select-deck" 
          element={
            <DeckSelectionPage
              onDeckSelected={handleDeckSelected}
              fetchDecks={() => authClient.getUserDecks()}
              fetchFolders={() => authClient.getUserFolders()}
              fetchDecksInFolder={(folderId) => authClient.getDecksInFolder(folderId)}
            />
          } 
        />
        <Route 
          path="/select-mode" 
          element={<ModeSelectionPage hasSelectedDeck={!!selectedDeckId} />} 
        />
        <Route path="/roll" element={<RollPage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </Router>
  );
};

export default App;