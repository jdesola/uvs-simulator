/**
 * Main entry point for Universus Simulator
 */

import { GameEngine } from './game/GameEngine';
import { CharacterCard, FoundationCard, AttackCard } from './models/Card';
import { Symbol } from './models/Card';

// Example usage
function main() {
  console.log('=== Universus Simulator ===\n');

  // Create a new game
  const game = new GameEngine({
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    startingPlayer: 1
  });

  // Example: Create sample character cards
  const character1 = new CharacterCard({
    id: 'char1',
    name: 'Example Character 1',
    check: 6,
    difficulty: 0,
    blockZone: 'mid',
    blockModifier: 0,
    symbols: [Symbol.FIRE],
    keywords: [],
    text: 'Sample character',
    unique: true,
    enhance: false,
    response: false,
    form: false,
    blitz: false,
    handSize: 6,
    health: 25
  });

  const character2 = new CharacterCard({
    id: 'char2',
    name: 'Example Character 2',
    check: 6,
    difficulty: 0,
    blockZone: 'mid',
    blockModifier: 0,
    symbols: [Symbol.WATER],
    keywords: [],
    text: 'Sample character',
    unique: true,
    enhance: false,
    response: false,
    form: false,
    blitz: false,
    handSize: 6,
    health: 25
  });

  // Set up players with characters
  const player1 = game.getPlayer(1);
  const player2 = game.getPlayer(2);
  
  player1.setCharacter(character1);
  player2.setCharacter(character2);

  // Example: Create sample deck cards (simplified)
  const sampleDeck1: any[] = [];
  const sampleDeck2: any[] = [];

  // In a real implementation, you would load actual card data
  for (let i = 0; i < 50; i++) {
    sampleDeck1.push(new FoundationCard({
      id: `p1-foundation-${i}`,
      name: `Foundation ${i}`,
      check: Math.floor(Math.random() * 6) + 1,
      difficulty: 0,
      blockZone: null,
      blockModifier: 0,
      symbols: [Symbol.FIRE],
      keywords: [],
      text: '',
      unique: false,
      enhance: false,
      response: false,
      form: false,
      blitz: false
    }));

    sampleDeck2.push(new FoundationCard({
      id: `p2-foundation-${i}`,
      name: `Foundation ${i}`,
      check: Math.floor(Math.random() * 6) + 1,
      difficulty: 0,
      blockZone: null,
      blockModifier: 0,
      symbols: [Symbol.WATER],
      keywords: [],
      text: '',
      unique: false,
      enhance: false,
      response: false,
      form: false,
      blitz: false
    }));
  }

  // Setup game
  player1.setupGame(sampleDeck1);
  player2.setupGame(sampleDeck2);

  // Start the game
  game.startGame();

  console.log(`Game started!`);
  console.log(`${player1.name}: ${player1.getHealth()} health`);
  console.log(`${player2.name}: ${player2.getHealth()} health`);
  console.log(`\nActive Player: ${game.getActivePlayer().name}`);
  console.log(`Current Phase: ${game.getGameState().currentPhase}`);
  console.log(`\nPlayer 1 hand size: ${player1.hand.count()}`);
  console.log(`Player 2 hand size: ${player2.hand.count()}`);
}

export {};

// Uncomment to run directly: node dist/index.js
// main();

// Export main components
export { GameEngine } from './game/GameEngine';
export { Player } from './models/Player';
export * from './models/Card';
export * from './models/Zone';
export * from './game/GamePhases';
