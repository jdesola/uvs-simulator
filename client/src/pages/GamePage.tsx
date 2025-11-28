import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './GamePage.css';

const GamePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gameMode = searchParams.get('mode'); // 'cpu' or 'player'
  
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    // Initialize game based on mode
    if (gameMode === 'cpu') {
      initializeCPUGame();
    } else if (gameMode === 'player') {
      initializePlayerGame();
    }
  }, [gameMode]);

  const initializeCPUGame = () => {
    // TODO: Set up game against CPU
    console.log('Starting CPU game...');
  };

  const initializePlayerGame = () => {
    // TODO: Set up multiplayer game (WebSocket connection)
    console.log('Starting multiplayer game...');
  };

  return (
    <div className="game-page">
      <header className="game-header">
        <h2>UVS Simulator - {gameMode === 'cpu' ? 'vs CPU' : 'vs Player'}</h2>
        <button onClick={() => window.location.href = '/'}>
          Back to Menu
        </button>
      </header>
      
      <div className="game-container">
        <div className="game-placeholder">
          <p>Game board will go here</p>
          <p>Mode: {gameMode}</p>
        </div>
      </div>

      {/* Game controls */}
      <div className="game-controls">
        <button>Draw Card</button>
        <button>End Turn</button>
        <button>Pass Priority</button>
      </div>
    </div>
  );
};

export default GamePage;