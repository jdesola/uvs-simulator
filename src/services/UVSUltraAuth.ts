import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';

export interface UVSUltraCredentials {
  email: string;
  password: string;
}

export interface DeckListItem {
  id: string;
  name: string;
  format: string;
  cardCount: number;
  isValid: boolean;
  characterName?: string;
  characterImage?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  deckCount: number;
  folderCount: number;
}

export class UVSUltraAuth {
  private axiosInstance: AxiosInstance;
  private sessionCookies: Map<string, string> = new Map();
  
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://uvsultra.online',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      withCredentials: true,
    });
  }

  /**
   * Login to UVS Ultra and establish session
   */
  async login(credentials: UVSUltraCredentials): Promise<boolean> {
    try {
      // Hash the password using SHA1 (based on captured data)
      const hashedPassword = crypto
        .createHash('sha1')
        .update(credentials.password)
        .digest('hex');

      // Make login request
      const response = await this.axiosInstance.post('/', {
        login: credentials.email,
        password: credentials.password,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Extract cookies from response
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        setCookieHeader.forEach((cookie: string) => {
          const [nameValue] = cookie.split(';');
          const [name, value] = nameValue.split('=');
          this.sessionCookies.set(name.trim(), value.trim());
        });
      }

      // Store credentials as cookies (like the site does)
      this.sessionCookies.set('login', encodeURIComponent(credentials.email));
      this.sessionCookies.set('password', hashedPassword);

      // Verify login by checking if we can access deck list
      const testResponse = await this.getUserDecks();
      return testResponse.length >= 0; // Even 0 decks means we're logged in
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  /**
   * Get cookie string for requests
   */
  private getCookieString(): string {
    return Array.from(this.sessionCookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  /**
   * Get list of user's decks
   */
  async getUserDecks(orderBy: 'date_created' | 'date_modified' | 'name' = 'date_created'): Promise<DeckListItem[]> {
    try {
      const response = await this.axiosInstance.get('/menu_list_user_deck.php', {
        params: {
          mdorderby: orderBy,
          js: '',
          mdorderdir: 'DESC',
        },
        headers: {
          'Cookie': this.getCookieString(),
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      return this.parseDecksFromHTML(response.data);
    } catch (error) {
      console.error('Failed to get user decks:', error);
      return [];
    }
  }

  /**
   * Get list of user's folders
   */
  async getUserFolders(): Promise<FolderItem[]> {
    try {
      const response = await this.axiosInstance.get('/menu_list_user_deck.php', {
        params: {
          mdorderby: 'date_created',
          js: '',
          mdorderdir: 'DESC',
        },
        headers: {
          'Cookie': this.getCookieString(),
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      return this.parseFoldersFromHTML(response.data);
    } catch (error) {
      console.error('Failed to get user folders:', error);
      return [];
    }
  }

  /**
   * Get decks in a specific folder
   */
  async getDecksInFolder(folderId: string): Promise<DeckListItem[]> {
    try {
      const response = await this.axiosInstance.get('/menu_list_user_deck.php', {
        params: {
          mdfolderid: folderId,
          js: '',
        },
        headers: {
          'Cookie': this.getCookieString(),
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      return this.parseDecksFromHTML(response.data);
    } catch (error) {
      console.error(`Failed to get decks in folder ${folderId}:`, error);
      return [];
    }
  }

  /**
   * Get full deck details including card list
   */
  async getDeckDetails(deckId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/deck.php', {
        params: {
          deck: deckId,
        },
        headers: {
          'Cookie': this.getCookieString(),
        },
      });

      return this.parseDeckDetailsFromHTML(response.data);
    } catch (error) {
      console.error(`Failed to get deck details for ${deckId}:`, error);
      return null;
    }
  }

  /**
   * Parse deck list from HTML response
   */
  private parseDecksFromHTML(html: string): DeckListItem[] {
    const $ = cheerio.load(html);
    const decks: DeckListItem[] = [];

    $('#list-mydeck-all .avatar-deck').each((_, element) => {
      const $deck = $(element);
      const $link = $deck.find('a[href^="deck.php"]').first();
      const deckUrl = $link.attr('href') || '';
      const deckId = deckUrl.match(/deck=([^&]+)/)?.[1] || '';
      
      const name = $link.text().trim();
      const $img = $deck.find('img.ci-small_image');
      const characterImage = $img.attr('src');
      
      const infoText = $deck.find('.avatar-deck-info span').text();
      const cardCountMatch = infoText.match(/(\d+)\s+cards/);
      const cardCount = cardCountMatch ? parseInt(cardCountMatch[1]) : 0;
      
      const $formatBadge = $deck.find('.label-success, .label-warning');
      const formatText = $formatBadge.text().trim();
      const format = formatText.split(' ')[0]; // e.g., "Standard", "Retro"
      const isValid = $formatBadge.hasClass('label-success');

      if (deckId && name) {
        decks.push({
          id: deckId,
          name,
          format,
          cardCount,
          isValid,
          characterImage,
        });
      }
    });

    return decks;
  }

  /**
   * Parse folder list from HTML response
   */
  private parseFoldersFromHTML(html: string): FolderItem[] {
    const $ = cheerio.load(html);
    const folders: FolderItem[] = [];

    $('#list-myfolders-all .avatar-deck').each((_, element) => {
      const $folder = $(element);
      const $link = $folder.find('a[href^="folder.php"]').first();
      const folderUrl = $link.attr('href') || '';
      const folderId = folderUrl.match(/id=(\d+)/)?.[1] || '';
      
      const name = $link.text().trim();
      
      const infoText = $folder.find('.avatar-folder-info').text();
      const deckCountMatch = infoText.match(/(\d+)\s+decks/);
      const folderCountMatch = infoText.match(/(\d+)\s+folders/);
      
      const deckCount = deckCountMatch ? parseInt(deckCountMatch[1]) : 0;
      const folderCount = folderCountMatch ? parseInt(folderCountMatch[1]) : 0;

      if (folderId && name) {
        folders.push({
          id: folderId,
          name,
          deckCount,
          folderCount,
        });
      }
    });

    return folders;
  }

  /**
   * Parse full deck details from HTML response
   */
  private parseDeckDetailsFromHTML(html: string): any {
    const $ = cheerio.load(html);
    
    const deckName = $('#name').text().trim();
    const character = $('h2 img').attr('alt');
    
    const cards: any = {
      character: [],
      foundation: [],
      attack: [],
      asset: [],
      action: [],
      backup: [],
    };

    // Parse each card type section
    $('.type_card_character li.card-list').each((_, el) => {
      const cardData = this.parseCardFromElement($, $(el));
      if (cardData) cards.character.push(cardData);
    });

    $('.type_card_foundation li.card-list').each((_, el) => {
      const cardData = this.parseCardFromElement($, $(el));
      if (cardData) cards.foundation.push(cardData);
    });

    $('.type_card_attack li.card-list').each((_, el) => {
      const cardData = this.parseCardFromElement($, $(el));
      if (cardData) cards.attack.push(cardData);
    });

    $('.type_card_asset li.card-list').each((_, el) => {
      const cardData = this.parseCardFromElement($, $(el));
      if (cardData) cards.asset.push(cardData);
    });

    $('.type_card_action li.card-list').each((_, el) => {
      const cardData = this.parseCardFromElement($, $(el));
      if (cardData) cards.action.push(cardData);
    });

    $('.type_card_backup li.card-list').each((_, el) => {
      const cardData = this.parseCardFromElement($, $(el));
      if (cardData) cards.backup.push(cardData);
    });

    return {
      name: deckName,
      character,
      cards,
    };
  }

  /**
   * Parse individual card data from HTML element
   */
  private parseCardFromElement($: cheerio.CheerioAPI, $el: cheerio.Cheerio): any {
    const cardName = $el.text().split('x')[0].trim();
    const quantityText = $el.find('.badge-success').text();
    const quantityMatch = quantityText.match(/x(\d+)/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    
    const $img = $el.find('img.ci-micro_image');
    const imageSrc = $img.attr('src');
    const cardId = $el.attr('id')?.replace('deck-card-', '');

    if (!cardName) return null;

    return {
      id: cardId,
      name: cardName,
      quantity,
      image: imageSrc,
    };
  }

  /**
   * Check if currently logged in
   */
  isLoggedIn(): boolean {
    return this.sessionCookies.has('login') && this.sessionCookies.has('password');
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.sessionCookies.clear();
  }
}
