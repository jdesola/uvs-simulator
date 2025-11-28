/**
 * Example: Using scraped card data with the game simulator
 */

import { CardLoader } from '../scraper/CardLoader';
import { GameEngine } from '../game/GameEngine';
import { Format } from '../scraper/types';

async function main() {
  console.log('=== Loading Scraped Cards ===\n');

  const loader = new CardLoader();
  
  try {
    // Load all scraped card data
    const result = await loader.loadAllCards();
    
    console.log(`Loaded ${result.totalCount} cards`);
    console.log(`Scraped at: ${result.scrapedAt}\n`);

    // Get character cards
    const characters = result.cards.filter(c => c.cardType === 'character');
    console.log(`Found ${characters.length} character cards\n`);

    // Find Standard-legal characters
    const standardCharacters = characters.filter(char => 
      char.legalities.some(l => 
        l.format === Format.STANDARD && 
        !l.banned
      )
    );

    console.log(`${standardCharacters.length} are legal in Standard format\n`);

    // Show first 5 characters
    console.log('First 5 characters:');
    for (const char of standardCharacters.slice(0, 5)) {
      console.log(`  - ${char.name} (Health: ${char.health}, Hand Size: ${char.handSize})`);
    }

    console.log('\n=== Creating Game with Scraped Data ===\n');

    // Convert scraped data to simulator format
    const converted = await loader.loadAndConvertAll();
    console.log(`Converted ${converted.characters.length} characters to simulator format`);

    // Example: Create a game with two random standard characters
    if (standardCharacters.length >= 2) {
      const char1 = converted.characters[0];
      const char2 = converted.characters[1];

      console.log(`\nCreating game with:`);
      console.log(`  Player 1: ${char1.name}`);
      console.log(`  Player 2: ${char2.name}`);

      const game = new GameEngine({
        player1Name: 'Player 1',
        player2Name: 'Player 2',
        startingPlayer: 1
      });

      const player1 = game.getPlayer(1);
      const player2 = game.getPlayer(2);

      player1.setCharacter(char1);
      player2.setCharacter(char2);

      console.log(`\nGame ready!`);
      console.log(`  ${player1.name} (${char1.name}): ${player1.getHealth()} HP`);
      console.log(`  ${player2.name} (${char2.name}): ${player2.getHealth()} HP`);
    }

    // Show legality statistics
    console.log('\n=== Legality Statistics ===\n');
    
    const standardLegal = result.cards.filter(c => 
      c.legalities.some(l => l.format === Format.STANDARD && !l.banned)
    ).length;
    
    const legacyLegal = result.cards.filter(c => 
      c.legalities.some(l => l.format === Format.LEGACY && !l.banned)
    ).length;
    
    const banned = result.cards.filter(c => 
      c.legalities.some(l => l.banned)
    ).length;
    

    console.log(`Standard Legal: ${standardLegal}`);
    console.log(`Legacy Legal: ${legacyLegal}`);
    console.log(`Banned: ${banned}`);

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error('\nError: Card data not found!');
      console.error('Please run "npm run scrape" first to download card data.');
    } else {
      console.error('Error loading cards:', error);
    }
  }
}

main();
