import React from 'react';
import { Card } from '@game/models/Card';
import './CheckPanel.css';

export interface CheckState {
  cardBeingPlayed: Card | null;
  revealedCheckCard: Card | null;
  requiredDifficulty: number;
  foundationsCommitted: number;
  isCheckPassed: boolean | null;
}

interface CheckPanelProps {
  checkState: CheckState;
  onCommitFoundation: () => void;
  onUncommitFoundation: () => void;
  onAccept: () => void;
  onCancel: () => void;
  maxFoundations: number;
}

export const CheckPanel: React.FC<CheckPanelProps> = ({
  checkState,
  onCommitFoundation,
  onUncommitFoundation,
  onAccept,
  onCancel,
  maxFoundations
}) => {
  const { cardBeingPlayed, revealedCheckCard, requiredDifficulty, foundationsCommitted, isCheckPassed } = checkState;

  if (!cardBeingPlayed) return null;

  // Calculate check value
  const baseCheckValue = revealedCheckCard?.check || 0;
  const foundationBonus = foundationsCommitted;
  const totalCheckValue = baseCheckValue + foundationBonus;
  const checkPassed = totalCheckValue >= requiredDifficulty;
  
  // Calculate how many foundations needed to pass
  const foundationsNeeded = revealedCheckCard 
    ? Math.max(0, requiredDifficulty - baseCheckValue)
    : 0;
  const canPassWithFoundations = revealedCheckCard && foundationsNeeded > 0 && foundationsNeeded <= maxFoundations;

  return (
    <div className="check-panel-overlay">
      <div className="check-panel">
        <div className="check-panel-header">
          <h2>Check Info</h2>
        </div>

        <div className="check-panel-content">
          {/* Card Being Played */}
          <div className="check-section">
            <h3>Playing Card</h3>
            <div className="check-card-display">
              {cardBeingPlayed.imageUrl && (
                <img src={cardBeingPlayed.imageUrl} alt={cardBeingPlayed.name} />
              )}
              <div className="check-card-info">
                <div className="check-card-name">{cardBeingPlayed.name}</div>
                <div className="check-difficulty">
                  Difficulty: <span className="check-difficulty-value">{requiredDifficulty}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revealed Check Card */}
          {revealedCheckCard && (
            <div className="check-section">
              <h3>Revealed Check Card</h3>
              <div className="check-card-display">
                {revealedCheckCard.imageUrl && (
                  <img src={revealedCheckCard.imageUrl} alt={revealedCheckCard.name} />
                )}
                <div className="check-card-info">
                  <div className="check-card-name">{revealedCheckCard.name}</div>
                  <div className="check-value">
                    Check Value: <span className="check-value-number">{baseCheckValue}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Check Calculation */}
          {revealedCheckCard && (
            <div className="check-section check-calculation">
              <h3>Check Calculation</h3>
              <div className="check-math">
                <div className="check-math-row">
                  <span className="check-math-label">Base Check Value:</span>
                  <span className="check-math-value">{baseCheckValue}</span>
                </div>
                <div className="check-math-row">
                  <span className="check-math-label">Foundations Committed:</span>
                  <span className="check-math-value">+{foundationBonus}</span>
                </div>
                <div className="check-math-row check-math-total">
                  <span className="check-math-label">Total:</span>
                  <span className="check-math-value">{totalCheckValue}</span>
                </div>
                <div className="check-math-row check-math-required">
                  <span className="check-math-label">Required:</span>
                  <span className="check-math-value">{requiredDifficulty}</span>
                </div>
              </div>

              {/* Pass/Fail Indicator */}
              <div className={`check-result ${checkPassed ? 'check-passed' : 'check-failed'}`}>
                {checkPassed ? '✓ CHECK PASSED' : '✗ CHECK FAILED'}
              </div>
            </div>
          )}

          {/* Foundation info - Show if check revealed */}
          {revealedCheckCard && !checkPassed && (
            <div className={`check-section ${canPassWithFoundations ? 'check-commitment' : 'check-failed-section'}`}>
              <h3>{canPassWithFoundations ? 'Foundations Needed' : 'Cannot Pass'}</h3>
              <div className="check-commitment-info">
                <div>
                  <span>Available:</span>
                  <span>{maxFoundations}</span>
                </div>
                <div>
                  <span>Needed:</span>
                  <span>{foundationsNeeded}</span>
                </div>
                {canPassWithFoundations && (
                  <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                    <span>Can Pass:</span>
                    <span>Yes</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
