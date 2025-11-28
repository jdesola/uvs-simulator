import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DeckSelectionPage.css';

interface Deck {
  id: string;
  name: string;
  format: string;
  cardCount: number;
  isValid: boolean;
  characterImage?: string;
}

interface Folder {
  id: string;
  name: string;
  deckCount: number;
  folderCount: number;
}

interface DeckSelectionPageProps {
  onDeckSelected: (deckId: string) => void;
  fetchDecks: () => Promise<Deck[]>;
  fetchFolders: () => Promise<Folder[]>;
  fetchDecksInFolder: (folderId: string) => Promise<Deck[]>;
}

export const DeckSelectionPage: React.FC<DeckSelectionPageProps> = ({
  onDeckSelected,
  fetchDecks,
  fetchFolders,
  fetchDecksInFolder,
}) => {
  const [allDecks, setAllDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Get mode from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const gameMode = urlParams.get('mode') || 'player';

  const CACHE_KEY = 'uvs_deck_cache';
  const CACHE_TIMESTAMP_KEY = 'uvs_deck_cache_timestamp';

  useEffect(() => {
    loadDecksFromCache();
  }, []);

  const loadDecksFromCache = () => {
    try {
      const cachedDecks = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedDecks) {
        setAllDecks(JSON.parse(cachedDecks));
        setCacheTimestamp(cachedTimestamp);
      } else {
        // No cache, fetch decks automatically on first load
        fetchAndCacheDecks();
      }
    } catch (err) {
      console.error('Error loading from cache:', err);
      fetchAndCacheDecks();
    }
  };

  const fetchAndCacheDecks = async () => {
    setIsFetching(true);
    setError('');
    
    try {
      const decksData = await fetchDecks();
      setAllDecks(decksData);
      
      // Cache the decks
      const timestamp = new Date().toISOString();
      localStorage.setItem(CACHE_KEY, JSON.stringify(decksData));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp);
      setCacheTimestamp(timestamp);
    } catch (err) {
      setError('Failed to load decks. Please try again.');
      console.error('Error loading decks:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleRefreshDecks = () => {
    fetchAndCacheDecks();
  };

  // Filter decks based on search query
  const filteredDecks = allDecks.filter(deck =>
    deck.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeckClick = (deckId: string) => {
    onDeckSelected(deckId);
    navigate(`/roll?mode=${gameMode}`);
  };

  return (
    <div className="deck-selection-page">
      <div className="deck-selection-container">
        <div className="deck-selection-header">
          <h1>Select Your Deck</h1>
          <p className="mode-indicator">Mode: {gameMode === 'cpu' ? '🤖 VS CPU' : '👥 VS Player'}</p>
          <div className="header-actions">
            <button 
              className="refresh-button" 
              onClick={handleRefreshDecks}
              disabled={isFetching}
            >
              {isFetching ? '⟳ Fetching...' : '🔄 Refresh Decks'}
            </button>
            <button className="back-button" onClick={() => navigate('/select-mode')}>
              ← Change Mode
            </button>
          </div>
          {cacheTimestamp && (
            <p className="cache-info">
              Last updated: {new Date(cacheTimestamp).toLocaleString()}
            </p>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="search-section">
          <input
            type="text"
            className="deck-search"
            placeholder="🔍 Search decks by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="decks-section">
          <h2>Your Decks ({filteredDecks.length})</h2>
          {filteredDecks.length === 0 ? (
            <div className="no-decks">
              <p>
                {searchQuery 
                  ? `No decks matching "${searchQuery}"` 
                  : 'No decks found.'}
              </p>
              {!searchQuery && (
                <a 
                  href="https://uvsultra.online" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Create a deck on UVS Ultra
                </a>
              )}
            </div>
          ) : (
            <div className="decks-list">
              {filteredDecks.map((deck) => (
                <div
                  key={deck.id}
                  className={`deck-list-item ${!deck.isValid ? 'invalid' : ''}`}
                  onClick={() => deck.isValid && handleDeckClick(deck.id)}
                >
                  <div className="deck-list-info">
                    <h3>{deck.name}</h3>
                    <div className="deck-meta">
                      <span className={`format-badge ${deck.isValid ? 'valid' : 'invalid'}`}>
                        {deck.format} {deck.isValid ? '✓' : '✗'}
                      </span>
                      <span className="card-count">{deck.cardCount} cards</span>
                    </div>
                  </div>
                  {!deck.isValid && (
                    <span className="invalid-indicator">Invalid</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
