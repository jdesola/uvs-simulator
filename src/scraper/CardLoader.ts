/**
 * Utility to load scraped card data and convert it to simulator format
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  Card as ScrapedCard, 
  CharacterCard as ScrapedCharacter,
  AttackCard as ScrapedAttack,
  FoundationCard as ScrapedFoundation,
  ActionCard as ScrapedAction,
  AssetCard as ScrapedAsset,
  ScrapeResult 
} from './types';
import { 
  CharacterCard, 
  AttackCard, 
  FoundationCard, 
  ActionCard, 
  AssetCard,
  Symbol 
} from '../models/Card';

export class CardLoader {
  private readonly dataDir: string;
  private localImageMapping: Record<string, string> = {};
  private ttsImageMapping: Record<string, string> = {};

  constructor(dataDir?: string) {
    // Allow custom data directory, or use default for Node.js
    this.dataDir = dataDir || (typeof process !== 'undefined' 
      ? path.join(process.cwd(), 'data', 'cards')
      : '/data/cards');
  }

  /**
   * Load local image mapping (downloaded images with local paths)
   */
  private async loadLocalImageMapping(): Promise<void> {
    if (Object.keys(this.localImageMapping).length > 0) {
      return; // Already loaded
    }

    try {
      const filePath = path.join(this.dataDir, 'local-image-mapping.json');
      const data = await fs.readFile(filePath, 'utf-8');
      this.localImageMapping = JSON.parse(data);
      console.log(`Loaded ${Object.keys(this.localImageMapping).length} local image paths`);
    } catch (error) {
      console.log('Local images not available, will use remote URLs');
      this.localImageMapping = {};
    }
  }

  /**
   * Load TTS image mapping (high-quality imgur URLs)
   */
  private async loadTTSImageMapping(): Promise<void> {
    if (Object.keys(this.ttsImageMapping).length > 0) {
      return; // Already loaded
    }

    try {
      const filePath = path.join(this.dataDir, 'tts-image-mapping.json');
      const data = await fs.readFile(filePath, 'utf-8');
      this.ttsImageMapping = JSON.parse(data);
      console.log(`Loaded ${Object.keys(this.ttsImageMapping).length} TTS image URLs`);
    } catch (error) {
      console.warn('Could not load TTS image mapping, using scraped images:', error);
      this.ttsImageMapping = {};
    }
  }

  /**
   * Get image URL: prefer local files, fallback to TTS imgur URLs, then scraped URLs
   */
  private getImageUrl(cardName: string, scrapedUrl?: string): string | undefined {
    const normalizedName = cardName.toLowerCase().trim();
    
    // First priority: local downloaded images
    const localUrl = this.localImageMapping[normalizedName];
    if (localUrl) {
      return localUrl;
    }
    
    // Second priority: TTS imgur URLs
    const ttsUrl = this.ttsImageMapping[normalizedName];
    if (ttsUrl) {
      return ttsUrl;
    }
    
    // Fallback: scraped URLs
    return scrapedUrl;
  }

  /**
   * Load all scraped cards
   */
  async loadAllCards(): Promise<ScrapeResult> {
    const filePath = path.join(this.dataDir, 'all-cards.json');
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as ScrapeResult;
  }

  /**
   * Load character cards
   */
  async loadCharacters(): Promise<ScrapedCharacter[]> {
    const filePath = path.join(this.dataDir, 'character-cards.json');
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as ScrapedCharacter[];
  }

  /**
   * Convert scraped symbol string to Symbol enum
   */
  private parseSymbol(symbolStr: string): Symbol {
    const normalized = symbolStr.toLowerCase().replace(/\s+/g, '');
    
    const symbolMap: Record<string, Symbol> = {
      'all': Symbol.ALL,
      'any': Symbol.ANY,
      'good': Symbol.GOOD,
      'evil': Symbol.EVIL,
      'chaos': Symbol.CHAOS,
      'order': Symbol.ORDER,
      'void': Symbol.VOID,
      'death': Symbol.DEATH,
      'earth': Symbol.EARTH,
      'fire': Symbol.FIRE,
      'water': Symbol.WATER,
      'wind': Symbol.WIND,
      'life': Symbol.LIFE,
      'infinity': Symbol.INFINITY
    };

    return symbolMap[normalized] || Symbol.ANY;
  }

  /**
   * Convert scraped character to simulator CharacterCard
   */
  convertCharacter(scraped: ScrapedCharacter): CharacterCard {
    return new CharacterCard({
      id: scraped.id,
      name: scraped.name,
      check: scraped.control,
      difficulty: scraped.difficulty,
      blockZone: scraped.blockZone || 'mid', // Use scraped zone or default to mid
      blockModifier: scraped.blockModifier,
      symbols: scraped.symbols.map(s => this.parseSymbol(s)),
      keywords: scraped.keywords,
      text: scraped.cardText,
      unique: scraped.unique,
      enhance: scraped.keywords.some(k => k.toLowerCase().includes('enhance')),
      response: scraped.keywords.some(k => k.toLowerCase().includes('response')),
      form: scraped.keywords.some(k => k.toLowerCase().includes('form')),
      blitz: scraped.keywords.some(k => k.toLowerCase().includes('blitz')),
      imageUrl: this.getImageUrl(scraped.name, scraped.imageUrl),
      handSize: scraped.handSize,
      health: scraped.health
    });
  }

  /**
   * Convert scraped attack to simulator AttackCard
   */
  convertAttack(scraped: ScrapedAttack): AttackCard {
    return new AttackCard({
      id: scraped.id,
      name: scraped.name,
      check: scraped.control,
      difficulty: scraped.difficulty,
      blockZone: scraped.blockZone || 'mid', // Use scraped zone or default to mid
      blockModifier: scraped.blockModifier,
      symbols: scraped.symbols.map(s => this.parseSymbol(s)),
      keywords: scraped.keywords,
      text: scraped.cardText,
      unique: scraped.unique,
      enhance: scraped.keywords.some(k => k.toLowerCase().includes('enhance')),
      response: scraped.keywords.some(k => k.toLowerCase().includes('response')),
      form: scraped.keywords.some(k => k.toLowerCase().includes('form')),
      blitz: scraped.keywords.some(k => k.toLowerCase().includes('blitz')),
      imageUrl: this.getImageUrl(scraped.name, scraped.imageUrl),
      speed: scraped.speed,
      damage: scraped.damage,
      zones: scraped.zones,
      throw: scraped.isThrow,
      flash: scraped.keywords.some(k => k.toLowerCase().includes('flash'))
    });
  }

  /**
   * Convert scraped foundation to simulator FoundationCard
   */
  convertFoundation(scraped: ScrapedFoundation): FoundationCard {
    return new FoundationCard({
      id: scraped.id,
      name: scraped.name,
      check: scraped.control,
      difficulty: scraped.difficulty,
      blockZone: scraped.blockZone, // Foundations typically have null
      blockModifier: scraped.blockModifier,
      symbols: scraped.symbols.map(s => this.parseSymbol(s)),
      keywords: scraped.keywords,
      text: scraped.cardText,
      unique: scraped.unique,
      enhance: scraped.keywords.some(k => k.toLowerCase().includes('enhance')),
      response: scraped.keywords.some(k => k.toLowerCase().includes('response')),
      form: scraped.keywords.some(k => k.toLowerCase().includes('form')),
      blitz: scraped.keywords.some(k => k.toLowerCase().includes('blitz')),
      imageUrl: this.getImageUrl(scraped.name, scraped.imageUrl)
    });
  }

  /**
   * Convert scraped action to simulator ActionCard
   */
  convertAction(scraped: ScrapedAction): ActionCard {
    return new ActionCard({
      id: scraped.id,
      name: scraped.name,
      check: scraped.control,
      difficulty: scraped.difficulty,
      blockZone: scraped.blockZone, // Actions may or may not have block zones
      blockModifier: scraped.blockModifier,
      symbols: scraped.symbols.map(s => this.parseSymbol(s)),
      keywords: scraped.keywords,
      text: scraped.cardText,
      unique: scraped.unique,
      enhance: scraped.isEnhance,
      response: scraped.isResponse,
      form: scraped.isForm,
      blitz: scraped.keywords.some(k => k.toLowerCase().includes('blitz')),
      imageUrl: this.getImageUrl(scraped.name, scraped.imageUrl)
    });
  }

  /**
   * Convert scraped asset to simulator AssetCard
   */
  convertAsset(scraped: ScrapedAsset): AssetCard {
    return new AssetCard({
      id: scraped.id,
      name: scraped.name,
      check: scraped.control,
      difficulty: scraped.difficulty,
      blockZone: scraped.blockZone, // Assets may or may not have block zones
      blockModifier: scraped.blockModifier,
      symbols: scraped.symbols.map(s => this.parseSymbol(s)),
      keywords: scraped.keywords,
      text: scraped.cardText,
      unique: scraped.unique,
      enhance: scraped.isEnhance,
      response: scraped.isResponse,
      form: scraped.isForm,
      blitz: scraped.keywords.some(k => k.toLowerCase().includes('blitz')),
      imageUrl: this.getImageUrl(scraped.name, scraped.imageUrl)
    });
  }

  /**
   * Load all cards and convert to simulator format
   */
  async loadAndConvertAll(): Promise<{
    characters: CharacterCard[];
    attacks: AttackCard[];
    foundations: FoundationCard[];
    actions: ActionCard[];
    assets: AssetCard[];
  }> {
    // Load image mappings (local first, then TTS)
    await Promise.all([
      this.loadLocalImageMapping(),
      this.loadTTSImageMapping()
    ]);
    
    const result = await this.loadAllCards();
    
    const characters: CharacterCard[] = [];
    const attacks: AttackCard[] = [];
    const foundations: FoundationCard[] = [];
    const actions: ActionCard[] = [];
    const assets: AssetCard[] = [];

    for (const card of result.cards) {
      switch (card.cardType) {
        case 'character':
          characters.push(this.convertCharacter(card as ScrapedCharacter));
          break;
        case 'attack':
          attacks.push(this.convertAttack(card as ScrapedAttack));
          break;
        case 'foundation':
          foundations.push(this.convertFoundation(card as ScrapedFoundation));
          break;
        case 'action':
          actions.push(this.convertAction(card as ScrapedAction));
          break;
        case 'asset':
          assets.push(this.convertAsset(card as ScrapedAsset));
          break;
      }
    }

    return { characters, attacks, foundations, actions, assets };
  }
}
