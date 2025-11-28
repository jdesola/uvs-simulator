/**
 * Type definitions for card scraping
 */

export enum CardType {
  CHARACTER = 'character',
  ATTACK = 'attack',
  FOUNDATION = 'foundation',
  ACTION = 'action',
  ASSET = 'asset',
  BACKUP = 'backup',
}

/**
 * Game formats for Universus
 */
export enum Format {
  STANDARD = 'standard',
  RETRO = 'retro',
  ROCHESTER_RETRO = 'rochester retro',
  SPOTLIGHT_MHA = 'spotlight mha',
  SPOTLIGHT_YYH = 'spotlight yyh',
  SPOTLIGHT_AOT = 'spotlight aot',
  LEGACY = 'legacy'
}

/**
 * Card legality in a specific format
 * If a card has no legalities scraped from UVS Ultra, it is considered completely banned
 * Otherwise, a card is legal in a format unless explicitly banned in that format
 */
export interface CardLegality {
  format: Format;
  banned: boolean; // true if banned in this format, false if legal
}

export interface BaseCard {
  id: string;
  name: string;
  cardType: CardType;
  control: number;
  difficulty: number;
  blockZone: string | null; // 'high', 'mid', 'low', or null if can't block
  blockModifier: number;
  symbols: string[];
  keywords: string[];
  cardText: string;
  unique: boolean;
  imageUrl: string;
  legalities: CardLegality[];
}

export interface CharacterCard extends BaseCard {
  cardType: CardType.CHARACTER;
  handSize: number;
  health: number;
  traits: string;
}

export interface AttackCard extends BaseCard {
  cardType: CardType.ATTACK;
  speed: number;
  damage: number;
  zones: string[]; // e.g., ['high', 'mid', 'low'] - can be modified by card effects
  isThrow: boolean;
}

export interface FoundationCard extends BaseCard {
  cardType: CardType.FOUNDATION;
}

export interface ActionCard extends BaseCard {
  cardType: CardType.ACTION;
  isEnhance: boolean;
  isResponse: boolean;
  isForm: boolean;
}

export interface AssetCard extends BaseCard {
  cardType: CardType.ASSET;
  isEnhance: boolean;
  isResponse: boolean;
  isForm: boolean;
}

export interface BackupCard extends BaseCard {
  cardType: CardType.BACKUP;
  stamina: number;
  isEnhance: boolean;
  isResponse: boolean;
  isForm: boolean;
}

export type Card = CharacterCard | AttackCard | FoundationCard | ActionCard | AssetCard | BackupCard;

export interface ScrapeResult {
  cards: Card[];
  totalCount: number;
  scrapedAt: string;
}
