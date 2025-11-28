import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameEngine } from '@game/game/GameEngine';
import { CharacterCard, FoundationCard, AttackCard } from '@game/models/Card';
import { Symbol } from '@game/models/Card';
import GameBoard from '../components/GameBoard';
import './GamePage.css';

const GamePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gameMode = searchParams.get('mode'); // 'cpu' or 'player'
  
  const [game, setGame] = useState<GameEngine | null>(null);
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    // Initialize game based on mode
    if (gameMode === 'cpu') {
      initializeCPUGame();
    } else if (gameMode === 'player') {
      initializePlayerGame();
    }
  }, [gameMode]);

  const initializeCPUGame = () => {
    console.log('Starting CPU game...');
    
    // Create a new game
    const newGame = new GameEngine({
      player1Name: 'You',
      player2Name: 'CPU',
      startingPlayer: 1
    });

    // Create sample characters
    const char1 = new CharacterCard({
      id: 'ryu',
      name: 'Ryu',
      check: 6,
      difficulty: 0,
      blockZone: 'mid',
      blockModifier: 0,
      symbols: [Symbol.GOOD, Symbol.ORDER],
      keywords: ['Form'],
      text: 'Legendary martial artist',
      unique: true,
      enhance: false,
      response: false,
      form: true,
      blitz: false,
      handSize: 6,
      health: 25
    });

    const char2 = new CharacterCard({
      id: 'chunli',
      name: 'Chun-Li',
      check: 6,
      difficulty: 0,
      blockZone: 'mid',
      blockModifier: 0,
      symbols: [Symbol.GOOD, Symbol.ORDER],
      keywords: ['Form'],
      text: 'First Lady of Fighting Games',
      unique: true,
      enhance: false,
      response: false,
      form: true,
      blitz: false,
      handSize: 6,
      health: 23
    });

    const player1 = newGame.getPlayer(1);
    const player2 = newGame.getPlayer(2);

    player1.setCharacter(char1);
    player2.setCharacter(char2);

    // Create sample decks
    const deck1: any[] = [];
    const deck2: any[] = [];

    for (let i = 0; i < 40; i++) {
      deck1.push(new FoundationCard({
        id: `p1-foundation-${i}`,
        name: `Training ${i + 1}`,
        check: Math.floor(Math.random() * 4) + 2,
        difficulty: 0,
        blockZone: null,
        blockModifier: 0,
        symbols: [Symbol.ORDER],
        keywords: [],
        text: '',
        unique: false,
        enhance: false,
        response: false,
        form: false,
        blitz: false
      }));

      deck2.push(new FoundationCard({
        id: `p2-foundation-${i}`,
        name: `Focus ${i + 1}`,
        check: Math.floor(Math.random() * 4) + 2,
        difficulty: 0,
        blockZone: null,
        blockModifier: 0,
        symbols: [Symbol.ORDER],
        keywords: [],
        text: '',
        unique: false,
        enhance: false,
        response: false,
        form: false,
        blitz: false
      }));
    }

    for (let i = 0; i < 20; i++) {
      deck1.push(new AttackCard({
        id: `p1-attack-${i}`,
        name: `Hadoken ${i + 1}`,
        check: 3,
        difficulty: 3,
        blockZone: 'mid',
        blockModifier: 0,
        symbols: [Symbol.ORDER],
        keywords: ['Ranged'],
        text: 'Energy projectile',
        unique: false,
        enhance: false,
        response: false,
        form: false,
        blitz: false,
        speed: 3,
        damage: 3,
        zones: ['high', 'mid'],
        throw: false,
        flash: false
      }));

      deck2.push(new AttackCard({
        id: `p2-attack-${i}`,
        name: `Lightning Kick ${i + 1}`,
        check: 4,
        difficulty: 2,
        blockZone: 'mid',
        blockModifier: 0,
        symbols: [Symbol.ORDER],
        keywords: ['Multiple'],
        text: 'Rapid kick attack',
        unique: false,
        enhance: false,
        response: false,
        form: false,
        blitz: false,
        speed: 4,
        damage: 2,
        zones: ['mid', 'low'],
        throw: false,
        flash: false
      }));
    }

    player1.setupGame(deck1);
    player2.setupGame(deck2);
    newGame.startGame();

    setGame(newGame);
  };

  const initializePlayerGame = () => {
    console.log('Starting multiplayer game...');
    // TODO: Set up WebSocket connection for multiplayer
    initializeCPUGame(); // For now, just start a CPU game
  };

  const handleUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  if (!game) {
    return <div className="loading">Loading game...</div>;
  }

  return (
    <div className="game-page">
      <header className="game-header">
        <h2>UVS Simulator - {gameMode === 'cpu' ? 'vs CPU' : 'vs Player'}</h2>
        <button onClick={() => window.location.href = '/'}>
          Back to Menu
        </button>
      </header>
      
      <GameBoard game={game} onUpdate={handleUpdate} />
    </div>
  );
};

export default GamePage;