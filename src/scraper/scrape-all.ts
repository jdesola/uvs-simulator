/**
 * Script to scrape Universus cards with legality information
 * Usage:
 *   npm run scrape                          - Scrape all card types
 *   npm run scrape character attack         - Scrape only character and attack cards
 *   npm run scrape backup                   - Scrape only backup cards
 */

import { UniversalCardScraper } from './UniversalCardScraper';
import { CardType } from './types';

async function main() {
  console.log('=== Universus Card Scraper ===');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  let cardTypes: CardType[];
  
  if (args.length > 0) {
    // Validate and filter card types
    const validTypes = Object.values(CardType);
    cardTypes = args
      .map(arg => arg.toLowerCase() as CardType)
      .filter(type => validTypes.includes(type));
    
    if (cardTypes.length === 0) {
      console.error('Error: Invalid card type(s) specified.');
      console.log('\nValid card types:');
      validTypes.forEach(type => console.log(`  - ${type}`));
      console.log('\nExamples:');
      console.log('  npm run scrape character');
      console.log('  npm run scrape character attack foundation');
      console.log('  npm run scrape backup');
      process.exit(1);
    }
    
    console.log(`Scraping specific types: ${cardTypes.join(', ')}`);
  } else {
    cardTypes = Object.values(CardType);
    console.log('Scraping all card types from uvsultra.online...');
  }
  
  console.log();

  const scraper = new UniversalCardScraper();
  
  try {
    const result = await scraper.scrapeCards(cardTypes);
    
    console.log('\n=== Scraping Summary ===');
    console.log(`Total cards scraped: ${result.totalCount}`);
    
    // Count by type
    const byType: Record<string, number> = {};
    for (const card of result.cards) {
      byType[card.cardType] = (byType[card.cardType] || 0) + 1;
    }
    
    console.log('\nCards by type:');
    for (const [type, count] of Object.entries(byType)) {
      console.log(`  ${type}: ${count}`);
    }
    
    console.log(`\nData saved to: data/cards/`);
    console.log('Files created:');
    console.log('  - all-cards.json (combined results)');
    for (const type of cardTypes) {
      console.log(`  - ${type}-cards.json`);
    }
    
  } catch (error) {
    console.error('Error during scraping:', error);
    process.exit(1);
  }
}

main();
