/**
 * Game zones and card collections for Universus simulator.
 * Manages all areas where cards can exist during gameplay.
 */

import { Card, CardType, FoundationCard, AssetCard } from './Card';

/**
 * Base class for game zones that hold cards
 */
export abstract class CardZone {
  protected cards: Card[] = [];
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  add(card: Card): void {
    this.cards.push(card);
  }

  remove(card: Card): boolean {
    const index = this.cards.indexOf(card);
    if (index !== -1) {
      this.cards.splice(index, 1);
      return true;
    }
    return false;
  }

  removeById(cardId: string): Card | null {
    const index = this.cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      return this.cards.splice(index, 1)[0];
    }
    return null;
  }

  count(): number {
    return this.cards.length;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  clear(): void {
    this.cards = [];
  }

  getCards(): readonly Card[] {
    return [...this.cards];
  }

  contains(card: Card): boolean {
    return this.cards.includes(card);
  }
}

/**
 * Deck - player's library of cards
 */
export class Deck extends CardZone {
  constructor() {
    super('deck');
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(): Card | null {
    return this.cards.shift() || null;
  }

  drawMultiple(count: number): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.draw();
      if (card) {
        drawn.push(card);
      } else {
        break;
      }
    }
    return drawn;
  }

  addToTop(card: Card): void {
    this.cards.unshift(card);
  }

  addToBottom(card: Card): void {
    this.cards.push(card);
  }

  peekTop(count: number = 1): readonly Card[] {
    return this.cards.slice(0, count);
  }
}

/**
 * Hand - cards the player can currently play
 */
export class Hand extends CardZone {
  constructor() {
    super('hand');
  }

  findCard(cardId: string): Card | null {
    return this.cards.find(c => c.id === cardId) || null;
  }

  getPlayableCards(): readonly Card[] {
    // Can be extended with filtering logic
    return [...this.cards];
  }
}

/**
 * Discard Pile - cards that have been used or discarded
 */
export class DiscardPile extends CardZone {
  constructor() {
    super('discard');
  }

  addToTop(card: Card): void {
    this.cards.unshift(card);
  }

  peekTop(): Card | null {
    return this.cards[0] || null;
  }

  peekTopN(count: number): readonly Card[] {
    return this.cards.slice(0, count);
  }
}

/**
 * Card Pool - cards revealed during checks
 */
export class CardPool extends CardZone {
  constructor() {
    super('card_pool');
  }

  getTotalControl(): number {
    return this.cards.reduce((sum, card) => sum + card.check, 0);
  }
}

/**
 * Staging Area - cards being played or in the process of resolution
 */
export class StagingArea extends CardZone {
  constructor() {
    super('staging_area');
  }
}

/**
 * Play Area - cards currently in play (foundations, assets)
 */
export class PlayArea extends CardZone {
  constructor() {
    super('in_play');
  }

  getCommittedCards(): readonly Card[] {
    return this.cards.filter(card => card.committed);
  }

  getUncommittedCards(): readonly Card[] {
    return this.cards.filter(card => !card.committed);
  }

  getFoundations(): readonly FoundationCard[] {
    return this.cards.filter(card => card.cardType === CardType.FOUNDATION) as FoundationCard[];
  }

  getUncommittedFoundations(): readonly FoundationCard[] {
    return this.getFoundations().filter(f => !f.committed);
  }

  getAssets(): readonly AssetCard[] {
    return this.cards.filter(card => card.cardType === CardType.ASSET) as AssetCard[];
  }

  readyAll(): void {
    this.cards.forEach(card => card.reset());
  }

  commitCard(card: Card): boolean {
    if (this.contains(card) && !card.committed) {
      card.commit();
      return true;
    }
    return false;
  }
}

/**
 * Removed Zone - cards removed from the game
 */
export class RemovedZone extends CardZone {
  constructor() {
    super('removed');
  }
}
