/**
 * Demo of the Universus Simulator
 * Shows basic game setup and turn flow
 */

import { GameEngine } from './game/GameEngine';
import { CharacterCard, FoundationCard, AttackCard } from './models/Card';
import { Symbol, CardType } from './models/Card';

function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   UNIVERSUS CARD GAME SIMULATOR v0.1   ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Create a new game
  const game = new GameEngine({
    player1Name: 'Alice',
    player2Name: 'Bob',
    startingPlayer: 1
  });

  console.log('⚙️  Setting up game...\n');

  // Create character cards
  const ryu = new CharacterCard({
    id: 'ryu',
    name: 'Ryu',
    check: 6,
    difficulty: 0,
    blockZone: 'mid',
    blockModifier: 0,
    symbols: [Symbol.GOOD, Symbol.ORDER],
    keywords: ['Form'],
    text: 'Legendary martial artist seeking the ultimate challenge',
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

  // Set up players
  const alice = game.getPlayer(1);
  const bob = game.getPlayer(2);
  
  alice.setCharacter(ryu);
  bob.setCharacter(chun);

  console.log(`👤 Player 1: ${alice.name} playing as ${ryu.name}`);
  console.log(`   💚 Health: ${ryu.maxHealth} | 🃏 Hand Size: ${ryu.handSize}`);
  console.log();
  console.log(`👤 Player 2: ${bob.name} playing as ${chun.name}`);
  console.log(`   💚 Health: ${chun.maxHealth} | 🃏 Hand Size: ${chun.handSize}`);
  console.log();

  // Create sample decks
  console.log('📚 Building decks...\n');
  
  const deck1: any[] = [];
  const deck2: any[] = [];

  // Add foundations
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

  // Add some attack cards
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

  // Setup game with decks
  alice.setupGame(deck1);
  bob.setupGame(deck2);

  console.log(`   ${alice.name}: ${deck1.length} cards`);
  console.log(`   ${bob.name}: ${deck2.length} cards`);
  console.log();

  // Start the game
  console.log('🎮 Starting game...\n');
  game.startGame();

  const state = game.getGameState();

  console.log('═══════════════════════════════════════════');
  console.log(`   TURN ${state.turnNumber} - ${game.getActivePlayer().name}'s Turn`);
  console.log('═══════════════════════════════════════════');
  console.log();

  console.log(`📍 Current Phase: ${state.currentPhase.toUpperCase()}`);
  console.log();

  // Show game state
  console.log('🎯 Player Status:');
  console.log();
  console.log(`   ${alice.name} (${alice.character?.name}):`);
  console.log(`   ❤️  Health: ${alice.getHealth()}/${alice.getMaxHealth()}`);
  console.log(`   🃏 Hand: ${alice.hand.count()} cards`);
  console.log(`   📚 Deck: ${alice.deck.count()} cards`);
  console.log(`   🏗️  Foundations: ${alice.playArea.getFoundations().length}`);
  console.log(`   ⚡ Momentum: ${alice.momentum}`);
  console.log();

  console.log(`   ${bob.name} (${bob.character?.name}):`);
  console.log(`   ❤️  Health: ${bob.getHealth()}/${bob.getMaxHealth()}`);
  console.log(`   🃏 Hand: ${bob.hand.count()} cards`);
  console.log(`   📚 Deck: ${bob.deck.count()} cards`);
  console.log(`   🏗️  Foundations: ${bob.playArea.getFoundations().length}`);
  console.log(`   ⚡ Momentum: ${bob.momentum}`);
  console.log();

  console.log('═══════════════════════════════════════════');
  console.log('   Next Steps:');
  console.log('═══════════════════════════════════════════');
  console.log();
  console.log('The simulator is ready! Here\'s what you can do next:');
  console.log();
  console.log('📋 Core Mechanics:');
  console.log('   • Review Phase - Discard and draw implemented ✓');
  console.log('   • Ready Phase - Ready cards and play foundations ✓');
  console.log('   • Combat Phase - Attack declaration framework ✓');
  console.log();
  console.log('🎮 Available Actions (via GameEngine):');
  console.log('   • game.playFoundation(playerId, card)');
  console.log('   • game.declareAttack(attackerId, attackCard)');
  console.log('   • game.declareBlock(defenderId, blockCard)');
  console.log('   • game.performCheck(playerId, difficulty)');
  console.log('   • game.advancePhase()');
  console.log('   • game.endTurn()');
  console.log();
  console.log('🔧 To Build Next:');
  console.log('   1. Web UI (React/Vue) for interactive gameplay');
  console.log('   2. Complete combat resolution logic');
  console.log('   3. Card ability system and effects');
  console.log('   4. AI opponent for single-player');
  console.log('   5. Network multiplayer support');
  console.log();
  console.log('💾 Card Database:');
  console.log('   • Run "npm run scrape" to download real cards');
  console.log('   • Use CardLoader to import scraped data');
  console.log();
  console.log('✨ Simulator is ready for development!');
}

main();
