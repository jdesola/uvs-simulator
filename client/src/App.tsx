import { useState, useEffect } from 'react';
import './App.css';
import { GameEngine } from '@game/game/GameEngine';
import { CharacterCard, FoundationCard, AttackCard, Symbol } from '@game/models/Card';
import type { Card } from '@game/models/Card';
import { CardLoader } from '@game/scraper/CardLoader';
import { Format } from '@game/scraper/types';
import GameBoard from './components/GameBoard';

function App() {
  const [game, setGame] = useState<GameEngine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, forceUpdate] = useState({});
  const [gamePhase, setGamePhase] = useState<'setup' | 'pickChoice' | 'rolling' | 'choose' | 'playing'>('setup');
  const [rollWinner, setRollWinner] = useState<number | null>(null);
  const [loadedCards, setLoadedCards] = useState<any>(null);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [activePlayer, setActivePlayer] = useState<number | null>(null);
  const [playerChoice, setPlayerChoice] = useState<'evens' | 'odds' | null>(null);

  // Load cards on mount
  useEffect(() => {
    async function loadCards() {
      try {
        setLoading(true);
        
        // Fetch card data from public directory
        console.log('Loading scraped cards...');
        const response = await fetch('/data/cards/all-cards.json');
        if (!response.ok) {
          throw new Error('Card data not found. Run "npm run scrape" to download cards.');
        }
        
        const scrapedData = await response.json();
        console.log(`Loaded ${scrapedData.totalCount} cards from ${scrapedData.scrapedAt}`);
        
        // Manually convert scraped cards to simulator format
        const loader = new CardLoader();
        const characters = scrapedData.cards
          .filter((c: any) => c.cardType === 'character')
          .map((c: any) => loader.convertCharacter(c));
        
        const attacks = scrapedData.cards
          .filter((c: any) => c.cardType === 'attack')
          .map((c: any) => loader.convertAttack(c));
        
        const foundations = scrapedData.cards
          .filter((c: any) => c.cardType === 'foundation')
          .map((c: any) => loader.convertFoundation(c));
        
        const cards = { characters, attacks, foundations };
        console.log(`Loaded ${cards.characters.length} characters, ${cards.attacks.length} attacks, ${cards.foundations.length} foundations`);

        setLoadedCards(cards);
        setLoading(false);
        // Randomly pick which player gets to choose evens/odds
        const randomPlayer = Math.random() < 0.5 ? 1 : 2;
        setActivePlayer(randomPlayer);
        setGamePhase('pickChoice');
      } catch (err: any) {
        console.error('Error loading cards:', err);
        console.log('Falling back to sample cards...');
        
        // Fallback to sample cards
        loadSampleCards();
      }
    }

    function loadSampleCards() {
      const newGame = new GameEngine({
        player1Name: 'Player 1',
        player2Name: 'Player 2',
        startingPlayer: 1
      });

      // Create sample characters
      const ryu = new CharacterCard({
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

    const chun = new CharacterCard({
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
    
    player1.setCharacter(ryu);
    player2.setCharacter(chun);

    // Create sample decks
    const deck1: Card[] = [];
    const deck2: Card[] = [];

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
        text: 'Powerful energy projectile',
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

    const sampleCards = { characters: [ryu, chun], attacks: [], foundations: [] };
    setLoadedCards(sampleCards);
    setLoading(false);
    // Randomly pick which player gets to choose evens/odds
    const randomPlayer = Math.random() < 0.5 ? 1 : 2;
    setActivePlayer(randomPlayer);
    setGamePhase('pickChoice');
  }

    loadCards();
  }, []);

  const handleChoiceSelection = (choice: 'evens' | 'odds') => {
    setPlayerChoice(choice);
    setGamePhase('rolling');
    setIsRolling(true);
    
    // Animate dice roll
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      
      if (rollCount >= 15) {
        clearInterval(rollInterval);
        
        // Final roll
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);
        
        // Determine winner based on choice
        const isEven = finalRoll % 2 === 0;
        const activePlayerWins = (choice === 'evens' && isEven) || (choice === 'odds' && !isEven);
        const winner = activePlayerWins ? activePlayer : (activePlayer === 1 ? 2 : 1);
        
        setTimeout(() => {
          setRollWinner(winner);
          setGamePhase('choose');
        }, 1000);
      }
    }, 100);
  };

  const handleChooseFirst = (startingPlayer: 1 | 2) => {
    if (!loadedCards) return;
    
    initializeGame(startingPlayer);
  };

  const initializeGame = (startingPlayer: 1 | 2) => {
    if (!loadedCards) return;

    const cards = loadedCards;
    
    // Get characters
    let char1 = cards.characters[0];
    let char2 = cards.characters[1];

    console.log(`Using characters: ${char1.name} vs ${char2.name}`);

    // Create game
    const newGame = new GameEngine({
      player1Name: 'Player 1',
      player2Name: 'Player 2',
      startingPlayer
    });

    const player1 = newGame.getPlayer(1);
    const player2 = newGame.getPlayer(2);
    
    player1.setCharacter(char1);
    player2.setCharacter(char2);

    // Build decks from loaded cards
    const deck1: Card[] = [];
    const deck2: Card[] = [];

    // Use foundations if available
    if (cards.foundations.length >= 40) {
      for (let i = 0; i < Math.min(40, cards.foundations.length); i++) {
        deck1.push(cards.foundations[i]);
      }
      
      for (let i = 40; i < Math.min(80, cards.foundations.length); i++) {
        deck2.push(cards.foundations[i]);
      }
    } else {
      // Create sample foundations
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
    }

    // Use attacks if available
    if (cards.attacks.length >= 20) {
      for (let i = 0; i < Math.min(20, cards.attacks.length); i++) {
        deck1.push(cards.attacks[i]);
      }

      for (let i = 20; i < Math.min(40, cards.attacks.length); i++) {
        deck2.push(cards.attacks[i]);
      }
    } else {
      // Create sample attacks
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
          text: 'Powerful energy projectile',
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
    }

    console.log(`Deck 1: ${deck1.length} cards, Deck 2: ${deck2.length} cards`);

    player1.setupGame(deck1);
    player2.setupGame(deck2);
    newGame.startGame();

    setGame(newGame);
    setGamePhase('playing');
  };

  const handleAdvancePhase = () => {
    if (game) {
      game.advancePhase();
      forceUpdate({});
    }
  };

  const handleEndTurn = () => {
    if (game) {
      game.endTurn();
      forceUpdate({});
    }
  };

  if (loading) {
    return <div className="loading">Loading cards from database...</div>;
  }

  if (error) {
    return (
      <div className="loading">
        <div>⚠️ Error: {error}</div>
        <div style={{ marginTop: '10px', fontSize: '14px' }}>
          Run <code>npm run scrape</code> to download card data
        </div>
      </div>
    );
  }

  if (gamePhase === 'pickChoice') {
    return (
      <div className="loading">
        <h2>🎲 Determine First Player</h2>
        <p><strong>Player {activePlayer}</strong>, choose evens or odds:</p>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', justifyContent: 'center' }}>
          <button 
            onClick={() => handleChoiceSelection('evens')} 
            className="btn-primary" 
            style={{ padding: '10px 30px', fontSize: '16px' }}
          >
            Evens
          </button>
          <button 
            onClick={() => handleChoiceSelection('odds')} 
            className="btn-primary" 
            style={{ padding: '10px 30px', fontSize: '16px' }}
          >
            Odds
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'rolling') {
    return (
      <div className="loading">
        <h2>🎲 Rolling...</h2>
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', marginBottom: '20px', color: '#94a3b8' }}>
            <strong>Player {activePlayer}</strong> chose: <strong style={{ color: '#3b82f6' }}>{playerChoice?.toUpperCase()}</strong>
          </div>
          <div 
            className="dice-display" 
            style={{ 
              fontSize: '120px', 
              lineHeight: '1',
              transition: 'transform 0.1s',
              transform: isRolling ? `rotate(${diceValue * 60}deg)` : 'rotate(0deg)',
              display: 'inline-block'
            }}
          >
            {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][diceValue - 1]}
          </div>
          <div style={{ marginTop: '20px', fontSize: '16px', color: '#cbd5e1' }}>
            {!isRolling && (
              <div style={{ fontWeight: 'bold', color: diceValue % 2 === 0 ? '#22c55e' : '#f97316' }}>
                {diceValue} - {diceValue % 2 === 0 ? 'EVENS' : 'ODDS'}!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'choose' && rollWinner !== null) {
    return (
      <div className="loading">
        <h2>🎉 Player {rollWinner} Won the Roll!</h2>
        <p>Player {rollWinner}, choose who goes first:</p>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', justifyContent: 'center' }}>
          <button onClick={() => handleChooseFirst(1)} className="btn-primary" style={{ padding: '10px 30px', fontSize: '16px' }}>
            Player 1 Goes First
          </button>
          <button onClick={() => handleChooseFirst(2)} className="btn-primary" style={{ padding: '10px 30px', fontSize: '16px' }}>
            Player 2 Goes First
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return <div className="loading">Initializing game...</div>;
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>⚔️ Universus Simulator</h1>
        <div className="game-controls">
          <button onClick={handleAdvancePhase} className="btn-primary">
            Advance Phase
          </button>
          <button onClick={handleEndTurn} className="btn-secondary">
            End Turn
          </button>
        </div>
      </header>
      
      <GameBoard 
        game={game} 
        onUpdate={() => forceUpdate({})}
      />
    </div>
  );
}

export default App;
