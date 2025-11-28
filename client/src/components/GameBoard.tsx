import { useState } from 'react';
import type { GameEngine } from '@game/game/GameEngine';
import PlayerArea from './PlayerArea';
import TurnInfo from './TurnInfo';
import type { CheckState } from './CheckPanel';
import './GameBoard.css';

interface GameBoardProps {
  game: GameEngine;
  onUpdate: () => void;
}

function GameBoard({ game, onUpdate }: GameBoardProps) {
  const [checkState, setCheckState] = useState<CheckState | null>(null);
  const player1 = game.getPlayer(1);
  const player2 = game.getPlayer(2);
  const activePlayer = game.getActivePlayer();
  const gameState = game.getGameState();

  return (
    <div className="game-board">
      <PlayerArea 
        player={player2} 
        isActive={activePlayer.id === player2.id}
        isOpponent={true}
        onUpdate={onUpdate}
        onCheckStateChange={setCheckState}
      />

      <div className="center-area">
        <TurnInfo 
          gameState={gameState}
          activePlayerName={activePlayer.name}
          checkState={checkState}
          cardPoolSize={player1.cardPool.count()}
        />
      </div>

      <PlayerArea 
        player={player1} 
        isActive={activePlayer.id === player1.id}
        isOpponent={false}
        onUpdate={onUpdate}
        onCheckStateChange={setCheckState}
      />
    </div>
  );
}

export default GameBoard;
