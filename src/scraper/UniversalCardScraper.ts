/**
 * Universal card scraper for all Universus card types
 * Scrapes cards from uvsultra.online with legality information
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  Card, 
  CardType, 
  Format, 
  CardLegality, 
  ScrapeResult,
  CharacterCard,
  AttackCard,
  FoundationCard,
  ActionCard,
  AssetCard,
  BackupCard
} from './types';

export class UniversalCardScraper {
  private readonly baseUrl = 'https://uvsultra.online/';
  private readonly outputDir = path.join(process.cwd(), 'data', 'cards');

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Scrape all cards of all types
   */
  async scrapeAllCards(): Promise<ScrapeResult> {
    return this.scrapeCards(Object.values(CardType));
  }

  /**
   * Scrape specific card types
   * @param cardTypes Array of card types to scrape (e.g., [CardType.CHARACTER, CardType.ATTACK])
   */
  async scrapeCards(cardTypes: CardType[]): Promise<ScrapeResult> {
    const browser = await puppeteer.launch({ 
      headless: true,
      defaultViewport: { width: 1920, height: 1080 },
      timeout: 60000
    });
    
    try {
      const allCards: Card[] = [];
      
      // Scrape each card type
      for (const cardType of cardTypes) {
        console.log(`\n=== Scraping ${cardType.toUpperCase()} cards ===`);
        const cards = await this.scrapeCardType(browser, cardType);
        allCards.push(...cards);
        console.log(`Found ${cards.length} ${cardType} cards`);
      }

      // Create output directory
      await fs.mkdir(this.outputDir, { recursive: true });

      // Save all cards
      const result: ScrapeResult = {
        cards: allCards,
        totalCount: allCards.length,
        scrapedAt: new Date().toISOString()
      };

      await fs.writeFile(
        path.join(this.outputDir, 'all-cards.json'),
        JSON.stringify(result, null, 2),
        'utf-8'
      );

      // Save by card type (only types that were scraped)
      for (const cardType of cardTypes) {
        const typeCards = allCards.filter(c => c.cardType === cardType);
        await fs.writeFile(
          path.join(this.outputDir, `${cardType}-cards.json`),
          JSON.stringify(typeCards, null, 2),
          'utf-8'
        );
      }

      console.log(`\n=== Scraping Complete ===`);
      console.log(`Total cards: ${allCards.length}`);
      console.log(`Files saved to: ${this.outputDir}`);

      return result;
    } finally {
      await browser.close();
    }
  }

  /**
   * Scrape cards of a specific type
   */
  private async scrapeCardType(browser: Browser, cardType: CardType): Promise<Card[]> {
    const page = await browser.newPage();
    
    try {
      // Navigate to base URL
      await page.goto(this.baseUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      
      // Wait for form elements
      await page.waitForSelector(`#${cardType}_checkbox`, { timeout: 60000 });
      
      // Select card type
      await page.click(`#${cardType}_checkbox`);
      
      // Click search button
      await page.click('button.btn-success');
      
      // Wait for results
      await page.waitForSelector('.card', { timeout: 60000 });
      await this.delay(3000);

      // Scrape all pages
      const cards: Card[] = [];
      let pageNumber = 0;
      let hasNextPage = true;

      while (hasNextPage) {
        console.log(`  Processing page ${pageNumber + 1}...`);

        // Extract card data from current page
        const pageCards = await this.extractCardsFromPage(page, cardType);
        cards.push(...pageCards);

        // Check for next page
        const nextPageExists = await page.evaluate(() => {
          const nextButton = Array.from(document.querySelectorAll('a'))
            .find((a: Element) => a.textContent?.trim() === '»');
          return !!nextButton;
        });

        if (nextPageExists) {
          // Navigate to next page
          await page.evaluate((pageNum: number) => {
            (window as any).send_form(pageNum, false);
          }, pageNumber + 1);

          await this.delay(3000);
          await page.waitForSelector('.card', { timeout: 60000 });

          pageNumber++;
        } else {
          hasNextPage = false;
        }
      }

      return cards;
    } finally {
      await page.close();
    }
  }

  /**
   * Extract card data from the current page
   */
  private async extractCardsFromPage(page: Page, cardType: CardType): Promise<Card[]> {
    const rawCards = await page.$$eval('.card', (cards: Element[]) => {
      return cards.map((card: Element) => {
        // Extract common fields
        const name = card.querySelector('.card_title h1')?.textContent?.trim() || '';
        const imageUrl = card.querySelector('.card_image img')?.getAttribute('src') || '';
        
        // Card divisions
        const cd1Text = card.querySelector('.card_division.cd1')?.textContent?.trim() || '';
        const cd2Text = card.querySelector('.card_division.cd2')?.textContent?.trim() || '';
        const cd3Text = card.querySelector('.card_division.cd3')?.textContent?.trim() || '';
        const cd4Text = card.querySelector('.card_division.cd4')?.textContent?.trim() || '';

        // Extract symbols
        const symbols = Array.from(card.querySelectorAll('.card_division img'))
          .map((img: Element) => img.getAttribute('alt') || '')
          .filter(alt => alt !== '');

        // Extract block zone from cd3 images (blockhigh.png, blockmid.png, blocklow.png)
        const cd3Images = Array.from(card.querySelectorAll('.card_division.cd3 img'));
        const blockZoneImage = cd3Images.find((img: Element) => {
          const src = img.getAttribute('src') || '';
          return src.includes('blockhigh') || src.includes('blockmid') || src.includes('blocklow');
        });
        const blockZoneTitle = blockZoneImage?.getAttribute('title') || '';
        const blockZoneSrc = blockZoneImage?.getAttribute('src') || '';

        // Extract legality information
        const legalityLabels = Array.from(card.querySelectorAll('.label'));
        const legalities = legalityLabels
          .filter((label: Element) => 
            label.textContent?.includes('Standard') || 
            label.textContent?.includes('Legacy') ||
            label.textContent?.includes('Banned') ||
            label.textContent?.includes('Restricted')
          )
          .map((label: Element) => label.textContent?.trim() || '');

        return {
          name,
          imageUrl: imageUrl ? `https://uvsultra.online/${imageUrl}` : '',
          cd1Text,
          cd2Text,
          cd3Text,
          cd4Text,
          symbols,
          legalities,
          blockZoneTitle,
          blockZoneSrc
        };
      });
    });

    // Parse raw card data based on type
    return rawCards.map((raw, index) => 
      this.parseCardData(raw, cardType, index)
    ).filter(card => card !== null) as Card[];
  }

  /**
   * Parse raw card data into typed card objects
   */
  private parseCardData(raw: any, cardType: CardType, index: number): Card | null {
    if (!raw.name) return null;

    // Generate a unique ID
    const id = `${cardType}-${raw.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    // Parse legalities
    const legalities = this.parseLegalities(raw.legalities);

    // Extract common numeric values
    const controlMatch = raw.cd3Text.match(/Control\s*:\s*(\d+)/i);
    const difficultyMatch = raw.cd3Text.match(/Difficulty\s*:\s*(\d+)/i);
    const blockMatch = raw.cd3Text.match(/Block\s*:\s*([-+]?\d+)/i);

    const control = controlMatch ? parseInt(controlMatch[1]) : 0;
    const difficulty = difficultyMatch ? parseInt(difficultyMatch[1]) : 0;
    const blockModifier = blockMatch ? parseInt(blockMatch[1]) : 0;
    
    // Parse block zone from image (blockhigh.png, blockmid.png, blocklow.png)
    let blockZone: string | null = null;
    if (raw.blockZoneSrc.includes('blockhigh')) {
      blockZone = 'high';
    } else if (raw.blockZoneSrc.includes('blockmid')) {
      blockZone = 'mid';
    } else if (raw.blockZoneSrc.includes('blocklow')) {
      blockZone = 'low';
    } else if (raw.blockZoneTitle) {
      // Fallback to title attribute (e.g., "high", "mid", "low")
      blockZone = raw.blockZoneTitle.toLowerCase();
    }

    // Extract keywords (anything in brackets or common keywords)
    const keywords = this.extractKeywords(raw.cd2Text + ' ' + raw.cd4Text);

    // Check if unique
    const unique = raw.cd1Text.toLowerCase().includes('unique') || 
                   raw.cd2Text.toLowerCase().includes('unique');

    // Base card data
    const baseCard = {
      id,
      name: raw.name,
      cardType,
      control,
      difficulty,
      blockZone,
      blockModifier,
      symbols: raw.symbols,
      keywords,
      cardText: raw.cd2Text + '\n' + raw.cd4Text,
      unique,
      imageUrl: raw.imageUrl,
      legalities
    };

    // Parse type-specific fields
    switch (cardType) {
      case CardType.CHARACTER:
        return this.parseCharacterCard(baseCard, raw);
      case CardType.ATTACK:
        return this.parseAttackCard(baseCard, raw);
      case CardType.FOUNDATION:
        return this.parseFoundationCard(baseCard, raw);
      case CardType.ACTION:
        return this.parseActionCard(baseCard, raw);
      case CardType.ASSET:
        return this.parseAssetCard(baseCard, raw);
      case CardType.BACKUP:
        return this.parseBackupCard(baseCard, raw);
      default:
        return null;
    }
  }

  private parseCharacterCard(base: any, raw: any): CharacterCard {
    const handSizeMatch = raw.cd3Text.match(/Hand\s*size\s*:\s*(\d+)/i);
    const healthMatch = raw.cd3Text.match(/Vitality\s*:\s*(\d+)/i);
    const traitsMatch = raw.cd2Text.match(/^([\w\s\-]+?)(?:\s{10,}|$)/);

    return {
      ...base,
      cardType: CardType.CHARACTER,
      handSize: handSizeMatch ? parseInt(handSizeMatch[1]) : 6,
      health: healthMatch ? parseInt(healthMatch[1]) : 20,
      traits: traitsMatch ? traitsMatch[1].trim() : ''
    };
  }

  private parseAttackCard(base: any, raw: any): AttackCard {
    const speedMatch = raw.cd3Text.match(/Speed\s*:\s*(\d+)/i);
    const damageMatch = raw.cd3Text.match(/Damage\s*:\s*(\d+)/i);
    const zoneMatch = raw.cd3Text.match(/Zone\s*:\s*([\w\s,/]+)/i);

    const zones: string[] = [];
    const zoneText = zoneMatch ? zoneMatch[1].toLowerCase() : '';
    if (zoneText.includes('high')) zones.push('high');
    if (zoneText.includes('mid')) zones.push('mid');
    if (zoneText.includes('low')) zones.push('low');

    return {
      ...base,
      cardType: CardType.ATTACK,
      speed: speedMatch ? parseInt(speedMatch[1]) : 0,
      damage: damageMatch ? parseInt(damageMatch[1]) : 0,
      zones,
      isThrow: raw.cd2Text.toLowerCase().includes('throw') || 
               raw.cd4Text.toLowerCase().includes('throw')
    };
  }

  private parseFoundationCard(base: any, raw: any): FoundationCard {
    return {
      ...base,
      cardType: CardType.FOUNDATION
    };
  }

  private parseActionCard(base: any, raw: any): ActionCard {
    const isEnhance = raw.cd2Text.toLowerCase().includes('enhance') ||
                     raw.cd4Text.toLowerCase().includes('enhance');
    const isResponse = raw.cd2Text.toLowerCase().includes('response') ||
                      raw.cd4Text.toLowerCase().includes('response');
    const isForm = raw.cd2Text.toLowerCase().includes('form') ||
                  raw.cd4Text.toLowerCase().includes('form');

    return {
      ...base,
      cardType: CardType.ACTION,
      isEnhance,
      isResponse,
      isForm
    };
  }

  private parseAssetCard(base: any, raw: any): AssetCard {
    const isEnhance = raw.cd2Text.toLowerCase().includes('enhance') ||
                     raw.cd4Text.toLowerCase().includes('enhance');
    const isResponse = raw.cd2Text.toLowerCase().includes('response') ||
                      raw.cd4Text.toLowerCase().includes('response');
    const isForm = raw.cd2Text.toLowerCase().includes('form') ||
                  raw.cd4Text.toLowerCase().includes('form');

    return {
      ...base,
      cardType: CardType.ASSET,
      isEnhance,
      isResponse,
      isForm
    };
  }

  private parseBackupCard(base: any, raw: any): BackupCard {
    const staminaMatch = raw.cd3Text.match(/Stamina\s*:\s*(\d+)/i);
    const isEnhance = raw.cd2Text.toLowerCase().includes('enhance') ||
                     raw.cd4Text.toLowerCase().includes('enhance');
    const isResponse = raw.cd2Text.toLowerCase().includes('response') ||
                      raw.cd4Text.toLowerCase().includes('response');
    const isForm = raw.cd2Text.toLowerCase().includes('form') ||
                  raw.cd4Text.toLowerCase().includes('form');

    return {
      ...base,
      cardType: CardType.BACKUP,
      stamina: staminaMatch ? parseInt(staminaMatch[1]) : 0,
      isEnhance,
      isResponse,
      isForm
    };
  }

  /**
   * Parse legality information from labels
   * If no legalities are found, the card is considered completely banned
   * Otherwise, parse which formats the card is legal/banned in
   */
  private parseLegalities(legalityStrings: string[]): CardLegality[] {
    const legalities: CardLegality[] = [];
    
    // Check for each format
    const formatChecks = [
      { format: Format.STANDARD, keywords: ['standard'] },
      { format: Format.RETRO, keywords: ['retro'] },
      { format: Format.ROCHESTER_RETRO, keywords: ['rochester retro', 'rochester'] },
      { format: Format.SPOTLIGHT_MHA, keywords: ['spotlight mha', 'mha'] },
      { format: Format.SPOTLIGHT_YYH, keywords: ['spotlight yyh', 'yyh'] },
      { format: Format.SPOTLIGHT_AOT, keywords: ['spotlight aot', 'aot'] },
      { format: Format.LEGACY, keywords: ['legacy'] }
    ];

    for (const check of formatChecks) {
      const formatMentioned = legalityStrings.some(s => 
        check.keywords.some(keyword => s.toLowerCase().includes(keyword))
      );
      
      if (formatMentioned) {
        // Check if banned in this specific format
        const bannedInFormat = legalityStrings.some(s => {
          const lower = s.toLowerCase();
          return check.keywords.some(keyword => 
            lower.includes(keyword) && lower.includes('banned')
          );
        });
        
        legalities.push({
          format: check.format,
          banned: bannedInFormat
        });
      }
    }

    return legalities;
  }

  /**
   * Extract keywords from card text
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const commonKeywords = [
      'Multiple', 'Stun', 'Reversal', 'Desperation', 'Powerful',
      'E Commit', 'Enhance', 'Response', 'Form', 'Breaker',
      'Progressive', 'Combo', 'Weapon', 'Ranged', 'Throw'
    ];

    for (const keyword of commonKeywords) {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    }

    return [...new Set(keywords)]; // Remove duplicates
  }
}
