import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login on mount
    navigate('/login');
  }, [navigate]);

  return (
    <div className="landing-page">
      <div className="landing-container">
        <h1>UVS Simulator</h1>
        <p className="subtitle">Loading...</p>
      </div>
    </div>
  );
};

export default LandingPage;