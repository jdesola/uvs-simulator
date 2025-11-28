import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-container">
        <h1>UVS Simulator</h1>
        <p className="subtitle">Choose how you want to play</p>
        
        <div className="login-section">
          <button 
            className="login-button-main"
            onClick={() => navigate('/login')}
          >
            <h2>🎴 Have a UVS Ultra Account?</h2>
            <p>Login here to load your decks</p>
          </button>
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="game-mode-selection">
          <button 
            className="mode-button"
            onClick={() => navigate('/select-mode')}
          >
            <h2>🎮 Play Without Login</h2>
            <p>Use sample decks to play immediately</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;