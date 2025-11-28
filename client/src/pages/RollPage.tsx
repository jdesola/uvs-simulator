import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './RollPage.css';

type GameStep = 'selecting-player' | 'choosing-preference' | 'rolling' | 'result';

const RollPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameMode = searchParams.get('mode');
  
  const [step, setStep] = useState<GameStep>('selecting-player');
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [choosingPlayer, setChoosingPlayer] = useState<string>('');
  const [preference, setPreference] = useState<'even' | 'odd' | null>(null);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [startingPlayer, setStartingPlayer] = useState<number | null>(null);

  useEffect(() => {
    if (step === 'selecting-player') {
      // Randomly select which player chooses
      setTimeout(() => {
        const random = Math.random() < 0.5 ? 1 : 2;
        setSelectedPlayer(random);
        setChoosingPlayer(`Player ${random}`);
        setStep('choosing-preference');
      }, 1000);
    }
  }, [step]);

  const handlePreferenceChoice = (choice: 'even' | 'odd') => {
    console.log('Preference chosen:', choice);
    setPreference(choice);
    setStep('rolling');
    // Use the choice directly instead of state since state may not update immediately
    rollDiceWithPreference(choice);
  };

  const rollDiceWithPreference = (chosenPreference: 'even' | 'odd') => {
    setIsRolling(true);
    
    // Animate rolling
    let count = 0;
    const interval = setInterval(() => {
      setDiceRoll(Math.floor(Math.random() * 6) + 1);
      count++;
      
      if (count > 15) {
        clearInterval(interval);
        
        // Final roll
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceRoll(finalRoll);
        setIsRolling(false);
        
        // Determine who chooses based on if the roll matches their preference
        const rollIsEven = finalRoll % 2 === 0;
        const preferenceMatched = (chosenPreference === 'even' && rollIsEven) || (chosenPreference === 'odd' && !rollIsEven);
        
        console.log('Roll:', finalRoll, 'Is Even:', rollIsEven, 'Preference:', chosenPreference, 'Matched:', preferenceMatched);
        
        // If the roll matches the choosing player's preference, they win
        // Otherwise, the other player wins
        if (preferenceMatched) {
          setWinner(choosingPlayer);
          console.log('Winner:', choosingPlayer, '(matched preference)');
        } else {
          const otherPlayer = selectedPlayer === 1 ? 'Player 2' : 'Player 1';
          setWinner(otherPlayer);
          console.log('Winner:', otherPlayer, '(preference not matched)');
        }
        
        setStep('result');
      }
    }, 100);
  };

  const handleStartingPlayerChoice = (playerNum: number) => {
    setStartingPlayer(playerNum);
  };

  const startGame = () => {
    navigate(`/game?mode=${gameMode}&starting=${startingPlayer}`);
  };

  return (
    <div className="roll-page">
      <div className="roll-container">
        <h1>Determine Starting Player</h1>

        {step === 'selecting-player' && (
          <div className="step-content">
            <div className="spinner">🎲</div>
            <p className="step-message">Randomly selecting a player...</p>
          </div>
        )}

        {step === 'choosing-preference' && (
          <div className="step-content">
            <p className="step-message">
              <strong>{choosingPlayer}</strong> was randomly selected!
            </p>
            <p className="instruction">Choose EVEN or ODD:</p>
            <div className="preference-buttons">
              <button 
                className="preference-button even"
                onClick={() => handlePreferenceChoice('even')}
              >
                EVEN
              </button>
              <button 
                className="preference-button odd"
                onClick={() => handlePreferenceChoice('odd')}
              >
                ODD
              </button>
            </div>
          </div>
        )}

        {step === 'rolling' && (
          <div className="step-content">
            <p className="step-message">
              <strong>{choosingPlayer}</strong> chose <strong>{preference?.toUpperCase()}</strong>
            </p>
            <div className="dice-area">
              <div className={`dice large ${isRolling ? 'rolling' : ''}`}>
                {diceRoll || '?'}
              </div>
            </div>
            <p className="roll-status">Rolling...</p>
          </div>
        )}

        {step === 'result' && diceRoll && (
          <div className="step-content">
            <p className="step-message">
              <strong>{choosingPlayer}</strong> chose <strong>{preference?.toUpperCase()}</strong>
            </p>
            <div className="dice-area">
              <div className="dice large">
                {diceRoll}
              </div>
            </div>
            <div className="roll-result">
              <div className="result-text">
                Rolled: <strong>{diceRoll}</strong> ({diceRoll % 2 === 0 ? 'EVEN' : 'ODD'})
              </div>
              <div className={`winner-announcement ${winner ? 'show' : ''}`}>
                🎉 <strong>{winner}</strong> gets to choose who goes first! 🎉
              </div>
            </div>

            {!startingPlayer ? (
              <div className="starting-choice">
                <p className="instruction">{winner}, who will go first?</p>
                <div className="player-choice-buttons">
                  <button 
                    className="choice-button"
                    onClick={() => handleStartingPlayerChoice(1)}
                  >
                    Player 1
                  </button>
                  <button 
                    className="choice-button"
                    onClick={() => handleStartingPlayerChoice(2)}
                  >
                    Player 2
                  </button>
                </div>
              </div>
            ) : (
              <div className="final-choice">
                <p className="chosen-text">
                  <strong>Player {startingPlayer}</strong> will go first!
                </p>
                <button 
                  className="start-button"
                  onClick={startGame}
                >
                  Start Game
                </button>
              </div>
            )}
          </div>
        )}

        <div className="roll-actions">
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default RollPage;
