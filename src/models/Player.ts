/**
 * Player class representing a player in the Universus game.
 * Manages player state, zones, and resources.
 */

import { CharacterCard, Card } from './Card';
import { Deck, Hand, DiscardPile, CardPool, StagingArea, PlayArea, RemovedZone } from './Zone';

export class Player {
  readonly id: number;
  readonly name: string;
  character: CharacterCard | null = null;

  // Game zones
  readonly deck: Deck;
  readonly hand: Hand;
  readonly discard: DiscardPile;
  readonly cardPool: CardPool;
  readonly stagingArea: StagingArea;
  readonly playArea: PlayArea;
  readonly removed: RemovedZone;

  // Player resources
  momentum: number = 0;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;

    // Initialize all zones
    this.deck = new Deck();
    this.hand = new Hand();
    this.discard = new DiscardPile();
    this.cardPool = new CardPool();
    this.stagingArea = new StagingArea();
    this.playArea = new PlayArea();
    this.removed = new RemovedZone();
  }

  /**
   * Set the player's character
   */
  setCharacter(character: CharacterCard): void {
    this.character = character;
    character.controllerId = this.id;
  }

  /**
   * Get the player's current health
   */
  getHealth(): number {
    return this.character?.currentHealth || 0;
  }

  /**
   * Get the player's maximum health
   */
  getMaxHealth(): number {
    return this.character?.maxHealth || 0;
  }

  /**
   * Check if the player is defeated
   */
  isDefeated(): boolean {
    return this.character?.isDefeated() || false;
  }

  /**
   * Take damage
   */
  takeDamage(amount: number): void {
    this.character?.takeDamage(amount);
  }

  /**
   * Heal damage
   */
  heal(amount: number): void {
    this.character?.heal(amount);
  }

  /**
   * Get the player's hand size
   */
  getHandSize(): number {
    return this.character?.handSize || 6;
  }

  /**
   * Add momentum
   */
  addMomentum(amount: number): void {
    this.momentum += amount;
  }

  /**
   * Spend momentum
   */
  spendMomentum(amount: number): boolean {
    if (this.momentum >= amount) {
      this.momentum -= amount;
      return true;
    }
    return false;
  }

  /**
   * Draw cards from deck to hand
   */
  drawCards(count: number): Card[] {
    const drawn = this.deck.drawMultiple(count);
    drawn.forEach(card => {
      this.hand.add(card);
    });
    return drawn;
  }

  /**
   * Draw up to hand size
   */
  drawToHandSize(): Card[] {
    const handSize = this.getHandSize();
    const currentHandSize = this.hand.count();
    const toDraw = Math.max(0, handSize - currentHandSize);
    return this.drawCards(toDraw);
  }

  /**
   * Discard a card from hand
   */
  discardCard(card: Card): boolean {
    if (this.hand.remove(card)) {
      this.discard.addToTop(card);
      return true;
    }
    return false;
  }

  /**
   * Discard entire hand
   */
  discardHand(): void {
    const cards = [...this.hand.getCards()];
    cards.forEach(card => {
      this.hand.remove(card);
      this.discard.addToTop(card);
    });
  }

  /**
   * Ready all cards in play (for Ready Phase)
   */
  readyAllCards(): void {
    this.playArea.readyAll();
  }

  /**
   * Shuffle discard pile into deck
   */
  shuffleDiscardIntoDeck(): void {
    const cards = [...this.discard.getCards()];
    cards.forEach(card => {
      this.discard.remove(card);
      this.deck.addToBottom(card);
    });
    this.deck.shuffle();
  }

  /**
   * Get total number of uncommitted foundations
   */
  getAvailableFoundations(): number {
    return this.playArea.getUncommittedFoundations().length;
  }

  /**
   * Move card from one zone to another
   */
  moveCard(card: Card, fromZone: any, toZone: any): boolean {
    if (fromZone.remove(card)) {
      toZone.add(card);
      return true;
    }
    return false;
  }

  /**
   * Setup player for game start
   */
  setupGame(deckCards: Card[]): void {
    // Add all cards to deck
    deckCards.forEach(card => {
      card.controllerId = this.id;
      this.deck.add(card);
    });

    // Shuffle deck
    this.deck.shuffle();

    // Reset momentum
    this.momentum = 0;
  }
}
