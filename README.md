# Universus Card Game Simulator

A digital simulator for the Universus trading card game, built with TypeScript.

## Project Structure

```
src/
├── models/
│   ├── Card.ts          # Card types and classes (Character, Attack, Foundation, Action, Asset)
│   ├── Zone.ts          # Game zones (Deck, Hand, Discard, Play Area, etc.)
│   └── Player.ts        # Player state and resources
├── game/
│   ├── GamePhases.ts    # Turn structure (Review, Ready, Combat phases)
│   └── GameEngine.ts    # Main game controller
├── scraper/
│   ├── types.ts                    # Scraper type definitions
│   ├── UniversalCardScraper.ts    # Main scraper implementation
│   ├── CardLoader.ts               # Card data loader and converter
│   └── scrape-all.ts               # Scraping script
├── examples/
│   ├── demo.ts                     # Basic game demo
│   └── example-load-cards.ts       # Example using scraped cards
└── index.ts             # Entry point and exports
```

## Core Components

### Card Types
- **Character**: The player's avatar with vitality and hand size
- **Attack**: Cards used to attack opponents (speed, damage, zones)
- **Foundation**: Resource cards needed to play other cards
- **Action**: Special effect cards (can be responses or enhancements)
- **Asset**: Permanent cards that stay in play

### Game Zones
- **Deck**: Player's library
- **Hand**: Cards available to play
- **Discard Pile**: Used/discarded cards
- **Card Pool**: Cards revealed during checks
- **Staging Area**: Cards being played
- **Play Area**: Foundations and assets in play
- **Removed**: Cards removed from game

### Turn Structure
1. **Review Phase**: Discard hand, draw new hand
2. **Ready Phase**: Ready all cards, play foundations/assets
3. **Combat Phase**: Declare attacks, enhancements, blocks, and resolve

## Getting Started

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

### Run

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

### Scrape Cards

Scrape all cards from uvsultra.online with legality information:

```bash
npm run scrape
```

See [SCRAPER_README.md](SCRAPER_README.md) for detailed scraper documentation.

## Usage Example

```typescript
import { GameEngine } from './game/GameEngine';
import { CharacterCard } from './models/Card';

// Create a game
const game = new GameEngine({
  player1Name: 'Alice',
  player2Name: 'Bob',
  startingPlayer: 1
});

// Set up characters and decks
// ... (load card data)

// Start the game
game.startGame();

// Play cards
game.playFoundation(1, foundationCard);
game.declareAttack(1, attackCard);
```

## Game Rules

This simulator implements the Universus card game rules. Key concepts:

- **Control Check**: Reveal cards from deck until control value meets difficulty
- **Momentum**: Resource gained from successful checks
- **Progressive Difficulty**: Increases when playing multiple attacks
- **Zones**: High/Mid/Low zones for attacks and blocking
- **Commit**: Tapping cards to pay costs

## Development Status

This is a foundational stub with:
- ✅ Core card models and types
- ✅ All game zones implemented
- ✅ Player state management
- ✅ Turn phase structure
- ✅ Basic game engine

### To Be Implemented
- [ ] Complete combat resolution logic
- [ ] Resource cost checking
- [ ] Check system details
- [ ] Card abilities and effects
- [ ] Keyword mechanics (Multiple, Stun, etc.)
- [ ] UI/Frontend interface
- [ ] Card database and deck builder
- [ ] Network multiplayer
- [ ] AI opponent

## Contributing

Contributions welcome! This is a work in progress.

## License

MIT
