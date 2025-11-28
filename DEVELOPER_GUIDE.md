# Universus Simulator - Developer Guide

## Project Overview

This is a digital simulator for the Universus card game (formerly UFS), built with TypeScript, React, and Vite. The project consists of:
- **Backend Game Engine** (`/src`) - Core game logic and card models
- **Frontend UI** (`/client`) - React-based interface with drag-and-drop gameplay
- **Card Scraper** (`/src/scraper`) - Tools to fetch card data from uvsultra.online and TTS mod files

---

## Project Structure

```
UVS Simulator/
├── src/                          # Backend game engine (Node.js/TypeScript)
│   ├── game/
│   │   ├── GameEngine.ts         # Main game controller
│   │   └── GamePhases.ts         # Turn phase management (Ready, Review, Combat, etc.)
│   ├── models/
│   │   ├── Card.ts               # Card class hierarchy (Character, Attack, Foundation, etc.)
│   │   ├── Player.ts             # Player state and methods
│   │   └── Zone.ts               # Card zones (deck, hand, discard, etc.)
│   └── scraper/
│       ├── UniversalCardScraper.ts    # Puppeteer-based web scraper
│       ├── CardLoader.ts              # Converts scraped data to game format
│       ├── extract-tts-images.ts      # Extracts image URLs from TTS JSON
│       ├── download-tts-images.ts     # Downloads images locally
│       └── download-card-back.ts      # Downloads generic card back image
│
├── client/                       # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameBoard.tsx          # Main game board container
│   │   │   ├── PlayerArea.tsx         # Individual player's play area
│   │   │   ├── TurnInfo.tsx           # Turn/phase display + check panel
│   │   │   ├── CheckPanel.tsx         # Check system info display
│   │   │   └── CardModal.tsx          # Card detail popup
│   │   ├── App.tsx                    # Root component, game initialization
│   │   └── main.tsx                   # Entry point
│   └── public/
│       ├── data/cards/                # JSON card data
│       │   ├── all-cards.json             # Scraped card database
│       │   ├── tts-image-mapping.json     # TTS imgur URLs
│       │   └── local-image-mapping.json   # Local image paths
│       └── images/cards/              # 5,353 card images (5,352 cards + 1 back)
│
├── data/cards/                   # Backend card data (mirror of client/public/data)
└── package.json                  # Root package (scraper scripts)
```

---

## Tech Stack

- **TypeScript 5.x** - Strict typing throughout
- **React 18** - Frontend framework
- **Vite 7.2.4** - Build tool and dev server
- **Puppeteer 21.0.0** - Web scraping
- **HTML5 Drag & Drop API** - Card interactions
- **CSS Custom Properties** - Theming

---

## Getting Started

### Installation

```bash
# Install root dependencies (scraper)
npm install

# Install client dependencies
cd client
npm install
```

### Running the Dev Server

```bash
cd client
npm run dev
```

The app will be available at `http://localhost:3001` (or next available port).

### Card Data Management

Cards are loaded from `client/public/data/cards/all-cards.json`. Images are stored in `client/public/images/cards/`.

**To rescrape card data:**

```bash
# From root directory
npm run scrape
```

This runs the full scraping pipeline:
1. Scrapes card data from uvsultra.online
2. Downloads high-quality images from TTS mod file imgur URLs
3. Creates image mapping files

**Manual scraping steps:**

```bash
# Extract TTS image URLs from mod file
npx ts-node src/scraper/extract-tts-images.ts

# Download all images locally
npx ts-node src/scraper/download-tts-images.ts

# Download card back
npx ts-node src/scraper/download-card-back.ts
```

---

## Key Architecture Concepts

### Card Model

All cards inherit from the base `Card` class (`src/models/Card.ts`):

```typescript
export abstract class Card {
  // Base properties (readonly)
  readonly id: string;
  readonly name: string;
  readonly cardType: CardType;
  readonly check: number;           // Check value for passing difficulty checks
  readonly baseDifficulty: number;  // Base difficulty to play this card
  readonly baseBlockZone: string | null;  // 'high', 'mid', 'low', or null
  readonly blockModifier: number;
  readonly symbols: Symbol[];       // For deck building constraints
  readonly keywords: string[];
  readonly text: string;
  readonly imageUrl: string;
  
  // Mutable game state
  currentDifficulty: number;        // Can be modified by effects
  currentBlockZone: string | null;  // Can be modified by effects
  progressiveDifficulty: number;    // +X from card pool position
  committed: boolean;               // For foundations
  zone: Zone;
  controllerId: number | null;
}
```

**Card Types:**
- `CharacterCard` - Your fighter (handSize, health)
- `AttackCard` - Attacks with speed, damage, block zones
- `FoundationCard` - Goes in card pool, adds +1 to checks when committed
- `ActionCard` - Non-attack actions
- `AssetCard` - Persistent effects

**Important:** The `check` property is NOT nested under `current` - it's directly on the card object.

### Zones

Cards move between zones (`src/models/Zone.ts`):

```typescript
enum Zone {
  DECK = 'deck',
  HAND = 'hand',
  CARD_POOL = 'cardPool',      // Foundations live here
  STAGING_AREA = 'stagingArea', // Cards being played this turn
  DISCARD = 'discard',
  REMOVED = 'removed'
}
```

Each player has zone containers accessible via:
- `player.deck`
- `player.hand`
- `player.cardPool`
- `player.stagingArea`
- `player.discard`
- `player.removed`

### Game Phases

Phases cycle through (`src/game/GamePhases.ts`):

1. **Ready** - Draw cards, ready committed cards
2. **Review** - Review hand, mulligan decision
3. **Build** - Build foundations (place foundations in card pool)
4. **Combat** - Play attacks, commit foundations for checks
5. **End** - End of turn cleanup

---

## Core Game Mechanics

### Check System

When playing a card (placing it in the card pool), a **check** is required:

1. **Difficulty Calculation:**
   ```
   Required Difficulty = Card's Base Difficulty + Progressive Difficulty
   ```
   - Progressive Difficulty = position in card pool (0, +1, +2, +3, +4, +5...)

2. **Check Process:**
   - Player reveals top card of deck (goes to discard)
   - Check Value = Revealed Card's `check` property
   - **Pass:** Check Value ≥ Required Difficulty
   - **Fail:** Check Value < Required Difficulty

3. **Foundation Commitment:**
   - If check fails, player can commit foundations from card pool
   - Each committed foundation adds +1 to check value
   - Foundations become "committed" (exhausted) until Ready phase

**Example:**
```
Card to play: Attack with difficulty 4
Position in pool: 3rd card (progressive difficulty = +2)
Required: 4 + 2 = 6

Revealed card has check value: 5
Result: 5 < 6 (FAIL)

Available foundations: 8
Needed to pass: 6 - 5 = 1 foundation
Player commits 1 foundation: 5 + 1 = 6 (PASS)
```

### Progressive Difficulty

Cards in the card pool increase the difficulty of subsequent plays:
- Slot 0: +0
- Slot 1: +1
- Slot 2: +2
- Slot 3: +3
- Slot 4: +4
- Slot 5: +5
- Slots 6-11: Condense, cycle continues

The UI shows these as badges on each card pool slot.

### Card Pool Condensing

When 6 cards fill a set of slots:
- All cards in that set condense to 45px width (overlap)
- Badge numbers remain visible
- Last card in set stays full-size until next card is added
- This repeats for multiple sets of 6

---

## UI Components

### PlayerArea (`client/src/components/PlayerArea.tsx`)

Main player view with:
- **Health tracker** - Row of numbers indicating current health
- **Character slot** - Shows character card
- **Momentum area** - Stack of momentum cards
- **Card pool** - 6 slots (expandable), progressive difficulty badges
- **Stage area** - Where cards go when played
- **Piles** - Deck (shows card back), Discard (shows top card), Removed
- **Hand** - Player's cards (draggable)

**Key Features:**
- Drag cards from hand to card pool (triggers check)
- Click cards to view in modal
- Mill button to discard X cards from deck
- Check button to perform check (disabled when not applicable)

**State Management:**
```typescript
const [checkState, setCheckState] = useState<CheckState | null>(null);
const [draggedCard, setDraggedCard] = useState<Card | null>(null);
const [millCount, setMillCount] = useState<string>('1');
```

**Check State Flow:**
1. Card dropped on card pool → `updateCheckState()` called
2. Check state passed up to `GameBoard` via `onCheckStateChange` callback
3. `GameBoard` passes to `TurnInfo`
4. `TurnInfo` displays `CheckPanel`

### CheckPanel (`client/src/components/CheckPanel.tsx`)

Informational display (no interactive buttons) showing:
- Card being played (image, name, difficulty)
- Revealed check card (after check performed)
- Check calculation breakdown
- Pass/fail status
- Foundation commitment info (if needed)

**Props:**
```typescript
interface CheckPanelProps {
  checkState: CheckState;
  onCommitFoundation: () => void;    // Currently unused (informational only)
  onUncommitFoundation: () => void;  // Currently unused
  onAccept: () => void;              // Currently unused
  onCancel: () => void;              // Currently unused
  maxFoundations: number;            // Available foundations in card pool
}
```

**CheckState Interface:**
```typescript
interface CheckState {
  cardBeingPlayed: Card | null;
  revealedCheckCard: Card | null;
  requiredDifficulty: number;
  foundationsCommitted: number;      // Currently unused
  isCheckPassed: boolean | null;
}
```

### TurnInfo (`client/src/components/TurnInfo.tsx`)

Displays:
- Current turn number
- Active player name
- Current phase
- **CheckPanel** (when check is active)

Located in the center area between player areas.

### GameBoard (`client/src/components/GameBoard.tsx`)

Container managing:
- Both player areas
- Turn info display
- Check state coordination between players and turn display

```typescript
const [checkState, setCheckState] = useState<CheckState | null>(null);

// Pass checkState down to TurnInfo
// Pass setCheckState down to PlayerAreas
```

---

## Image System

### Three-Tier Priority

`CardLoader.ts` uses a priority system for card images:

1. **Local files** (`/images/cards/[sanitized-name].png`) - Fastest
2. **TTS imgur URLs** (`https://i.imgur.com/[hash].png`) - High quality fallback
3. **Scraped URLs** (from uvsultra.online) - Last resort

### File Naming

Card names are sanitized for filenames:
- Lowercase
- Special characters removed
- Spaces replaced with hyphens
- Example: `"Eren Yeager"` → `"eren-yeager.png"`

### Mappings

Two JSON files map card names to image sources:

**`tts-image-mapping.json`:**
```json
{
  "Card Name": "https://i.imgur.com/XXXXX.png"
}
```

**`local-image-mapping.json`:**
```json
{
  "Card Name": "/images/cards/card-name.png"
}
```

### Card Back

Generic UVS card back stored at: `/images/cards/card-back.png`

Used for:
- Face-down deck display
- Hidden opponent cards (future feature)

---

## Styling Patterns

### CSS Variables

Defined in `App.css`:
```css
:root {
  --primary-color: #3b82f6;
  --bg-dark: #0f172a;
  --bg-light: #1e293b;
  --text-light: #f1f5f9;
  --success-color: #10b981;
}
```

### Common Patterns

**Gradient backgrounds:**
```css
background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
```

**Badge styling:**
```css
.badge {
  position: absolute;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 16px;
  border: 2px solid #1e3a5f;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  z-index: 10;
}
```

**Card slots:**
```css
.card-slot {
  width: 140px;
  height: 196px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.card-slot.condensed {
  width: 45px;
}
```

---

## Common Development Tasks

### Adding a New Card Property

1. **Update `Card.ts`:**
   ```typescript
   readonly newProperty: string;
   
   constructor(data: CardData) {
     // ...
     this.newProperty = data.newProperty;
   }
   ```

2. **Update `CardData` interface:**
   ```typescript
   export interface CardData {
     // ...
     newProperty: string;
   }
   ```

3. **Update scraper (`UniversalCardScraper.ts`):**
   ```typescript
   const newProperty = await card.$eval('.selector', el => el.textContent);
   ```

4. **Update `CardLoader.ts` converters:**
   ```typescript
   convertCharacter(data: any): CharacterCard {
     return new CharacterCard({
       // ...
       newProperty: data.newProperty || ''
     });
   }
   ```

### Adding a New Game Phase

1. **Update `GamePhases.ts`:**
   ```typescript
   export enum GamePhase {
     // ...
     NEW_PHASE = 'newPhase'
   }
   
   export const phaseOrder: GamePhase[] = [
     // Insert in correct position
   ];
   ```

2. **Add phase handler:**
   ```typescript
   class GamePhases {
     advancePhase() {
       // ...
       case GamePhase.NEW_PHASE:
         this.handleNewPhase();
         break;
     }
     
     private handleNewPhase() {
       // Phase logic
     }
   }
   ```

### Adding a New UI Component

1. **Create component:**
   ```typescript
   // client/src/components/MyComponent.tsx
   import './MyComponent.css';
   
   interface MyComponentProps {
     data: string;
   }
   
   function MyComponent({ data }: MyComponentProps) {
     return <div className="my-component">{data}</div>;
   }
   
   export default MyComponent;
   ```

2. **Create styles:**
   ```css
   /* client/src/components/MyComponent.css */
   .my-component {
     background: var(--bg-dark);
     padding: 1rem;
   }
   ```

3. **Import and use:**
   ```typescript
   import MyComponent from './components/MyComponent';
   
   <MyComponent data="test" />
   ```

---

## Debugging Tips

### Card Loading Issues

Check console for:
```
Loading scraped cards...
Loaded X cards from [date]
Loaded X characters, X attacks, X foundations
```

If cards don't load:
1. Verify `client/public/data/cards/all-cards.json` exists
2. Check `npm run scrape` output for errors
3. Verify image paths in browser Network tab

### Check System Issues

Enable check debugging:
```typescript
// In PlayerArea.tsx, check button click handler
console.log('Check state:', checkState);
console.log('Revealed card check:', card.check);
console.log('Required difficulty:', checkState.requiredDifficulty);
```

Common issues:
- ❌ `card.current.check` - Wrong! Should be `card.check`
- ✅ `card.check` - Correct
- Check is a direct property on Card, not nested

### Drag & Drop Issues

If cards won't drag:
1. Check `draggable={!isOpponent}` on card element
2. Ensure `onDragStart` sets `e.dataTransfer.effectAllowed`
3. Ensure `onDragOver` calls `e.preventDefault()`
4. Check for `pointer-events: none` on image elements

---

## Build & Deploy

### Production Build

```bash
cd client
npm run build
```

Output in `client/dist/`.

### Environment Variables

Currently none required. All data is self-contained.

### Known Limitations

- No multiplayer networking yet
- Check system is informational only (no automatic turn end on fail)
- Foundation commitment is calculated but not applied to game state
- No AI opponent
- Card effects are not parsed or executed (text is display-only)

---

## Module Aliasing

The client imports from the parent directory using `@game/*`:

**`client/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "paths": {
      "@game/*": ["../src/*"]
    }
  }
}
```

**`client/vite.config.ts`:**
```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@game': path.resolve(__dirname, '../src')
    }
  }
});
```

**Usage:**
```typescript
import { Card } from '@game/models/Card';
import { GameEngine } from '@game/game/GameEngine';
```

---

## Testing

Currently no automated tests. Manual testing checklist:

- [ ] Cards load and display
- [ ] Drag card from hand to card pool
- [ ] Check panel appears with card info
- [ ] Click Check button reveals card
- [ ] Pass/fail calculation correct
- [ ] Foundation commitment info displays
- [ ] Progressive difficulty badges show correct values
- [ ] Card pool condenses at 6 cards
- [ ] Mill button works (1-X cards)
- [ ] Deck shows card back
- [ ] Discard shows top card face-up
- [ ] Card modal opens on click
- [ ] Health tracker updates
- [ ] Momentum displays correctly

---

## Future Development Ideas

### High Priority
- [ ] Actual foundation commitment (apply to game state)
- [ ] Turn end on failed check
- [ ] Attack/block system
- [ ] Damage calculation
- [ ] Ready phase card readying

### Medium Priority
- [ ] Card effect parser and executor
- [ ] Multiplayer networking (WebSocket)
- [ ] Deck builder interface
- [ ] Save/load game state
- [ ] Replay system

### Low Priority
- [ ] AI opponent
- [ ] Animations for card movements
- [ ] Sound effects
- [ ] Mobile/touch support
- [ ] Tournament mode

---

## Troubleshooting

### Port 3000 Already in Use

Vite auto-increments to 3001, 3002, etc. Check terminal output for actual port.

### Images Not Loading

1. Check browser console for 404s
2. Verify files exist in `client/public/images/cards/`
3. Check mapping files have correct entries
4. Re-run `npm run scrape` if needed

### TypeScript Errors

```bash
# Check for errors
npm run build

# In client directory
cd client
npm run build
```

Common issues:
- Missing imports
- Type mismatches (especially `Card.check` vs `Card.current.check`)
- Module resolution (check `tsconfig.json` paths)

### Scraper Fails

- Website structure may have changed
- Check Puppeteer installation: `npm install puppeteer`
- Try headless: false for debugging:
  ```typescript
  const browser = await puppeteer.launch({ headless: false });
  ```

---

## Contact & Resources

- **Original Game:** Universus CCG (formerly UFS)
- **Card Database:** https://uvsultra.online
- **TTS Mod:** Used for high-quality card images

---

## Quick Reference Commands

```bash
# Development
npm install                    # Install root deps
cd client && npm install       # Install client deps
cd client && npm run dev       # Start dev server

# Card Management
npm run scrape                 # Full scrape pipeline
npx ts-node src/scraper/extract-tts-images.ts    # Extract TTS URLs
npx ts-node src/scraper/download-tts-images.ts   # Download images
npx ts-node src/scraper/download-card-back.ts    # Download card back

# Building
cd client && npm run build     # Production build
cd client && npm run preview   # Preview production build
```

---

**Last Updated:** November 28, 2025
