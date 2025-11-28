import type { GameState } from '@game/game/GamePhases';
import { CheckPanel } from './CheckPanel';
import type { CheckState } from './CheckPanel';
import './TurnInfo.css';

interface TurnInfoProps {
  gameState: GameState;
  activePlayerName: string;
  checkState: CheckState | null;
  cardPoolSize: number;
}

function TurnInfo({ gameState, activePlayerName, checkState, cardPoolSize }: TurnInfoProps) {
  return (
    <div className="turn-info">
      <div className="turn-number">
        Turn {gameState.turnNumber}
      </div>
      <div className="active-player">
        {activePlayerName}'s Turn
      </div>
      <div className="current-phase">
        Phase: <span className="phase-name">{gameState.currentPhase.toUpperCase()}</span>
      </div>
      
      {/* Check Panel Integration */}
      {checkState && (
        <div className="check-panel-container">
          <CheckPanel
            checkState={checkState}
            onCommitFoundation={() => {}}
            onUncommitFoundation={() => {}}
            onAccept={() => {}}
            onCancel={() => {}}
            maxFoundations={cardPoolSize}
          />
        </div>
      )}
    </div>
  );
}

export default TurnInfo;
