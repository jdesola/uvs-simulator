# Universus Card Scraper

Complete card scraper for the Universus card game that extracts all card types with legality information from uvsultra.online.

## Features

- **All Card Types**: Scrapes Characters, Attacks, Foundations, Actions, and Assets
- **Legality Information**: Extracts format legality (Standard, Legacy, Banned, Restricted)
- **Comprehensive Data**: Captures all card attributes including:
  - Name, control, difficulty, block modifier
  - Symbols and keywords
  - Card text
  - Type-specific attributes (speed, damage, zones, hand size, health, etc.)
  - Image URLs
  - Unique status

## Installation

```bash
npm install
```

This will install:
- `puppeteer` - Headless browser for web scraping
- `ts-node` - TypeScript execution

## Usage

### Scrape All Cards

```bash
npm run scrape
```

This will:
1. Launch a headless browser
2. Navigate to uvsultra.online
3. Scrape all card types (Character, Attack, Foundation, Action, Asset)
4. Extract legality information for each card
5. Save results to `data/cards/`

### Output Files

The scraper creates the following files in `data/cards/`:

- `all-cards.json` - All cards in a single file
- `character-cards.json` - Only character cards
- `attack-cards.json` - Only attack cards
- `foundation-cards.json` - Only foundation cards
- `action-cards.json` - Only action cards
- `asset-cards.json` - Only asset cards

### Output Format

Each card includes:

```typescript
{
  "id": "character-ryu",
  "name": "Ryu",
  "cardType": "character",
  "control": 6,
  "difficulty": 0,
  "blockModifier": 0,
  "symbols": ["Good", "Order", "Infinity"],
  "keywords": ["Form"],
  "cardText": "Card text here...",
  "unique": true,
  "imageUrl": "https://uvsultra.online/images/...",
  "legalities": [
    {
      "format": "standard",
      "status": "legal"
    },
    {
      "format": "legacy",
      "status": "legal"
    }
  ],
  // Type-specific fields
  "handSize": 6,
  "health": 25,
  "traits": "Martial Artist"
}
```

## Implementation Details

### UniversalCardScraper Class

The main scraper class (`src/scraper/UniversalCardScraper.ts`) handles:

- Browser automation with Puppeteer
- Multi-page navigation
- Card type filtering
- Data extraction and parsing
- Legality detection
- Type-specific attribute parsing

### Card Types

Defined in `src/scraper/types.ts`:

- `CharacterCard` - Player avatars with health and hand size
- `AttackCard` - Attacks with speed, damage, and zones
- `FoundationCard` - Resource cards
- `ActionCard` - Actions with enhance/response flags
- `AssetCard` - Permanent effects

### Legality Detection

The scraper automatically detects:
- Standard legality
- Legacy legality
- Banned status
- Restricted status

## Notes

- Scraping can take several minutes depending on the number of cards
- The scraper is respectful with 3-second delays between page loads
- If scraping fails, check your internet connection and that uvsultra.online is accessible
- Chrome/Chromium will be automatically downloaded by Puppeteer on first run

## Integration with Simulator

The scraped card data can be imported into the game simulator:

```typescript
import allCards from './data/cards/all-cards.json';
import { GameEngine } from './game/GameEngine';

// Use the scraped cards in your game
const characterCards = allCards.cards.filter(c => c.cardType === 'character');
```
