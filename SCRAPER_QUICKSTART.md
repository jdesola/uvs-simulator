# Card Scraper - Quick Start Guide

## What I've Created

I've built a comprehensive card scraper for your Universus simulator that:

1. **Scrapes ALL card types** from uvsultra.online:
   - Characters
   - Attacks
   - Foundations
   - Actions
   - Assets

2. **Captures legality information**:
   - Standard format legality
   - Legacy format legality
   - Banned/Restricted status

3. **Extracts comprehensive card data**:
   - All card attributes (control, difficulty, block modifier)
   - Symbols and keywords
   - Type-specific data (speed, damage, health, hand size, etc.)
   - Card images
   - Unique status

## Files Created

```
src/scraper/
├── types.ts                    # Type definitions for scraped data
├── UniversalCardScraper.ts    # Main scraper implementation
├── CardLoader.ts              # Utility to load and convert scraped data
└── scrape-all.ts              # Script to run the scraper

src/
└── example-load-cards.ts      # Example showing how to use scraped data

SCRAPER_README.md              # Detailed documentation
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs `puppeteer` (headless browser) and `ts-node`.

### 2. Run the Scraper

```bash
npm run scrape
```

This will:
- Launch a headless Chrome browser
- Navigate to uvsultra.online
- Scrape all card types across all pages
- Save data to `data/cards/`

**Note**: First run will download Chromium (~170MB). Scraping takes several minutes.

### 3. View the Results

After scraping, you'll have:
- `data/cards/all-cards.json` - All cards
- `data/cards/character-cards.json` - Just characters
- `data/cards/attack-cards.json` - Just attacks
- `data/cards/foundation-cards.json` - Just foundations
- `data/cards/action-cards.json` - Just actions
- `data/cards/asset-cards.json` - Just assets

### 4. Use the Data

Run the example to see how to load and use the scraped data:

```bash
npm run example
```

This demonstrates:
- Loading scraped cards
- Filtering by legality
- Converting to simulator format
- Creating games with scraped characters

## Integration with Your Simulator

The `CardLoader` class converts scraped data into your simulator's card format:

```typescript
import { CardLoader } from './scraper/CardLoader';
import { GameEngine } from './game/GameEngine';

const loader = new CardLoader();
const cards = await loader.loadAndConvertAll();

// Use cards.characters, cards.attacks, etc. in your game
const game = new GameEngine({ ... });
game.getPlayer(1).setCharacter(cards.characters[0]);
```

## Next Steps

1. **Run the scraper** to get real card data
2. **Build a deck builder** using the scraped cards
3. **Filter by legality** for format-specific games
4. **Add card search/filtering** by name, type, symbols, etc.
5. **Create preconstructed decks** for testing

## Troubleshooting

**"Cannot find module 'puppeteer'"**
- Run `npm install`

**Scraper hangs or times out**
- Check internet connection
- Verify uvsultra.online is accessible
- Try increasing timeout values in UniversalCardScraper.ts

**No cards found**
- The website structure may have changed
- Check console output for errors
- You may need to update the CSS selectors in the scraper

## Need More?

See [SCRAPER_README.md](SCRAPER_README.md) for detailed documentation.
