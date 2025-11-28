/**
 * Core card models for Universus card game simulator.
 * Defines all card types and their properties.
 */

export enum CardType {
  CHARACTER = 'character',
  ATTACK = 'attack',
  FOUNDATION = 'foundation',
  ACTION = 'action',
  ASSET = 'asset',
  BACKUP = 'backup'
}

export enum Symbol {
  ALL = 'all',
  ANY = 'any',
  GOOD = 'good',
  EVIL = 'evil',
  CHAOS = 'chaos',
  ORDER = 'order',
  VOID = 'void',
  DEATH = 'death',
  EARTH = 'earth',
  FIRE = 'fire',
  WATER = 'water',
  WIND = 'wind',
  LIFE = 'life',
  INFINITY = 'infinity'
}

export enum Zone {
  DECK = 'deck',
  HAND = 'hand',
  DISCARD = 'discard',
  CARD_POOL = 'card_pool',
  STAGE = 'stage',
  IN_PLAY = 'in_play',
  REMOVED = 'removed'
}

export interface CardData {
  id: string;
  name: string;
  cardType: CardType;
  check: number;
  difficulty: number;
  blockZone: string | null;
  blockModifier: number;
  symbols: Symbol[];
  keywords: string[];
  text: string;
  unique: boolean;
  enhance: boolean;
  response: boolean;
  form: boolean;
  blitz: boolean;
  imageUrl?: string;
}

/**
 * Base Card class for all Universus cards
 */
export abstract class Card {
  readonly id: string;
  readonly name: string;
  readonly cardType: CardType;
  readonly check: number;
  readonly baseDifficulty: number;
  readonly baseBlockZone: string | null;
  readonly blockModifier: number;
  readonly symbols: Symbol[];
  readonly keywords: string[];
  readonly text: string;
  readonly unique: boolean;
  readonly enhance: boolean;
  readonly response: boolean;
  readonly form: boolean;
  readonly blitz: boolean;
  readonly imageUrl: string;

  // Game state
  zone: Zone;
  controllerId: number | null;
  committed: boolean;
  progressiveDifficulty: number;
  currentDifficulty: number; // Can be modified by card effects
  currentBlockZone: string | null; // Can be modified by card effects, null if card has no block zone

  constructor(data: CardData) {
    this.id = data.id;
    this.name = data.name;
    this.cardType = data.cardType;
    this.check = data.check;
    this.baseDifficulty = data.difficulty;
    this.currentDifficulty = data.difficulty;
    this.baseBlockZone = data.blockZone;
    this.currentBlockZone = data.blockZone;
    this.blockModifier = data.blockModifier;
    this.symbols = [...data.symbols];
    this.keywords = [...data.keywords];
    this.text = data.text;
    this.unique = data.unique;
    this.enhance = data.enhance;
    this.response = data.response;
    this.form = data.form;
    this.blitz = data.blitz;
    this.imageUrl = data.imageUrl || '';

    // Initialize game state
    this.zone = Zone.DECK;
    this.controllerId = null;
    this.committed = false;
    this.progressiveDifficulty = 0;
  }

  get difficulty(): number {
    return this.currentDifficulty + this.progressiveDifficulty;
  }

  canBlock(): boolean {
    return this.currentBlockZone !== null;
  }

  reset(): void {
    this.committed = false;
    this.progressiveDifficulty = 0;
    this.currentDifficulty = this.baseDifficulty;
    this.currentBlockZone = this.baseBlockZone;
  }

  commit(): void {
    this.committed = true;
  }

  uncommit(): void {
    this.committed = false;
  }
}

export interface CharacterData extends Omit<CardData, 'cardType'> {
  handSize: number;
  health: number;
}

/**
 * Character Card - the player's avatar
 */
export class CharacterCard extends Card {
  readonly handSize: number;
  readonly maxHealth: number;
  currentHealth: number;
  isAttacked: boolean;

  constructor(data: CharacterData) {
    super({ ...data, cardType: CardType.CHARACTER });
    this.handSize = data.handSize;
    this.maxHealth = data.health;
    this.currentHealth = data.health;
    this.isAttacked = false;
  }

  takeDamage(amount: number): void {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
  }

  heal(amount: number): void {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }

  isDefeated(): boolean {
    return this.currentHealth <= 0;
  }
}

export interface AttackData extends Omit<CardData, 'cardType'> {
  speed: number;
  damage: number;
  zones: string[];
  throw: boolean;
  flash: boolean;
}

/**
 * Attack Card - used to attack opponents
 * Zones can be modified by card effects
 */
export class AttackCard extends Card {
  readonly speed: number;
  readonly damage: number;
  readonly throw: boolean;
  readonly flash: boolean;
  readonly baseZones: string[]; // Original zones printed on card
  
  // Current zones - can be modified by card effects
  currentZones: string[]; // ['high', 'mid', 'low']

  constructor(data: AttackData) {
    super({ ...data, cardType: CardType.ATTACK });
    this.speed = data.speed;
    this.damage = data.damage;
    this.baseZones = [...data.zones];
    this.currentZones = [...data.zones];
    this.throw = data.throw;
    this.flash = data.flash;
  }

  hasZone(zone: string): boolean {
    return this.currentZones.includes(zone.toLowerCase());
  }

  addZone(zone: string): void {
    const lowerZone = zone.toLowerCase();
    if (!this.currentZones.includes(lowerZone)) {
      this.currentZones.push(lowerZone);
    }
  }

  removeZone(zone: string): void {
    this.currentZones = this.currentZones.filter(z => z !== zone.toLowerCase());
  }

  setZones(zones: string[]): void {
    this.currentZones = zones.map(z => z.toLowerCase());
  }

  resetZones(): void {
    this.currentZones = [...this.baseZones];
  }

  override reset(): void {
    super.reset();
    this.resetZones();
  }
}

export interface FoundationData extends Omit<CardData, 'cardType'> {}

/**
 * Foundation Card - built into card pool to add to checks
 * Symbols on foundations are for deck building and effect requirements only
 * When committed, foundations add +1 to checks (unless card text says otherwise)
 */
export class FoundationCard extends Card {
  constructor(data: FoundationData) {
    super({ ...data, cardType: CardType.FOUNDATION });
  }
}

export interface ActionData extends Omit<CardData, 'cardType'> {}

/**
 * Action Card - special effects and responses
 */
export class ActionCard extends Card {
  constructor(data: ActionData) {
    super({ ...data, cardType: CardType.ACTION });
  }
}

export interface AssetData extends Omit<CardData, 'cardType'> {}

/**
 * Asset Card - permanents that stay in play
 */
export class AssetCard extends Card {
  constructor(data: AssetData) {
    super({ ...data, cardType: CardType.ASSET });
  }
}

export interface BackupData extends Omit<CardData, 'cardType'> {
  stamina: number;
}

/**
 * Backup Card - supporting characters that can be played from staging area
 */
export class BackupCard extends Card {
  readonly maxStamina: number;
  currentStamina: number;
  isAttacked: boolean;

  constructor(data: BackupData) {
    super({ ...data, cardType: CardType.BACKUP });
    this.maxStamina = data.stamina;
    this.currentStamina = data.stamina;
    this.isAttacked = false;
  }

  takeDamage(amount: number): void {
    this.currentStamina = Math.max(0, this.currentStamina - amount);
  }

  heal(amount: number): void {
    this.currentStamina = Math.min(this.maxStamina, this.currentStamina + amount);
  }

  isDestroyed(): boolean {
    return this.currentStamina <= 0;
  }
}
