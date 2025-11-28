import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handlePlayVsCPU = () => {
    navigate('/game?mode=cpu');
  };

  const handlePlayVsPlayer = () => {
    navigate('/game?mode=player');
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        <h1>UVS Simulator</h1>
        <div className="game-mode-selection">
          <button 
            className="mode-button cpu-mode"
            onClick={handlePlayVsCPU}
          >
            <h2>Play vs CPU</h2>
            <p>Practice against an AI opponent</p>
          </button>
          <button 
            className="mode-button player-mode"
            onClick={handlePlayVsPlayer}
          >
            <h2>Play vs Player</h2>
            <p>Challenge another player online</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;