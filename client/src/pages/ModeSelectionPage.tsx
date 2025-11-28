import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ModeSelectionPage.css';

interface ModeSelectionPageProps {
  hasSelectedDeck?: boolean;
}

export const ModeSelectionPage: React.FC<ModeSelectionPageProps> = ({ hasSelectedDeck = false }) => {
  const navigate = useNavigate();

  const handlePlayVsCPU = () => {
    navigate('/select-deck?mode=cpu');
  };

  const handlePlayVsPlayer = () => {
    navigate('/select-deck?mode=player');
  };

  return (
    <div className="mode-selection-page">
      <div className="mode-selection-container">
        <div className="mode-selection-header">
          <h1>Choose Game Mode</h1>
          {hasSelectedDeck && (
            <p className="deck-status">✓ Deck selected</p>
          )}
        </div>

        <div className="game-mode-selection">
          <button 
            className="mode-button cpu-mode"
            onClick={handlePlayVsCPU}
          >
            <div className="mode-icon">🤖</div>
            <h2>Play vs CPU</h2>
            <p>Practice against an AI opponent</p>
          </button>
          
          <button 
            className="mode-button player-mode"
            onClick={handlePlayVsPlayer}
          >
            <div className="mode-icon">👥</div>
            <h2>Play vs Player</h2>
            <p>Challenge another player online</p>
          </button>
        </div>

        <div className="mode-selection-footer">
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
