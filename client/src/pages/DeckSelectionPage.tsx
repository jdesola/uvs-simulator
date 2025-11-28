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
  const [decks, setDecks] = useState<Deck[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDecksAndFolders();
  }, []);

  const loadDecksAndFolders = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const [decksData, foldersData] = await Promise.all([
        fetchDecks(),
        fetchFolders(),
      ]);
      
      setDecks(decksData);
      setFolders(foldersData);
    } catch (err) {
      setError('Failed to load decks. Please try again.');
      console.error('Error loading decks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = async (folderId: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const folderDecks = await fetchDecksInFolder(folderId);
      setDecks(folderDecks);
      setCurrentFolder(folderId);
    } catch (err) {
      setError('Failed to load folder contents.');
      console.error('Error loading folder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    setCurrentFolder(null);
    loadDecksAndFolders();
  };

  const handleDeckClick = (deckId: string) => {
    onDeckSelected(deckId);
    navigate('/select-mode');
  };

  if (isLoading) {
    return (
      <div className="deck-selection-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your decks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-selection-page">
      <div className="deck-selection-container">
        <div className="deck-selection-header">
          <h1>Select Your Deck</h1>
          {currentFolder && (
            <button className="back-button" onClick={handleBackClick}>
              ← Back to All Decks
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {!currentFolder && folders.length > 0 && (
          <div className="folders-section">
            <h2>Folders</h2>
            <div className="folders-grid">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="folder-card"
                  onClick={() => handleFolderClick(folder.id)}
                >
                  <div className="folder-icon">📁</div>
                  <div className="folder-info">
                    <h3>{folder.name}</h3>
                    <p>
                      {folder.deckCount} deck{folder.deckCount !== 1 ? 's' : ''}
                      {folder.folderCount > 0 && 
                        `, ${folder.folderCount} subfolder${folder.folderCount !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="decks-section">
          <h2>{currentFolder ? 'Decks in Folder' : 'All Decks'}</h2>
          {decks.length === 0 ? (
            <div className="no-decks">
              <p>No decks found.</p>
              <a 
                href="https://uvsultra.online" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Create a deck on UVS Ultra
              </a>
            </div>
          ) : (
            <div className="decks-grid">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className={`deck-card ${!deck.isValid ? 'invalid' : ''}`}
                  onClick={() => deck.isValid && handleDeckClick(deck.id)}
                >
                  {deck.characterImage && (
                    <div className="deck-image">
                      <img 
                        src={`https://uvsultra.online${deck.characterImage}`} 
                        alt={deck.name}
                      />
                    </div>
                  )}
                  <div className="deck-info">
                    <h3>{deck.name}</h3>
                    <div className="deck-meta">
                      <span className={`format-badge ${deck.isValid ? 'valid' : 'invalid'}`}>
                        {deck.format} {deck.isValid ? '✓' : '✗'}
                      </span>
                      <span className="card-count">{deck.cardCount} cards</span>
                    </div>
                    {!deck.isValid && (
                      <p className="invalid-warning">
                        This deck is not valid and cannot be used
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
