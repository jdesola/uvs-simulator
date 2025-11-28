/**
 * Puppeteer script to analyze UVS Ultra's login flow and deck retrieval
 * This is for research purposes to understand the API structure
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

interface NetworkRequest {
  url: string;
  method: string;
  headers: any;
  postData?: string;
}

interface NetworkResponse {
  url: string;
  status: number;
  headers: any;
  body?: any;
}

class UVSUltraAnalyzer {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private requests: NetworkRequest[] = [];
  private responses: NetworkResponse[] = [];

  async launch() {
    console.log('Launching Chrome browser...');
    this.browser = await puppeteer.launch({
      headless: false, // Set to false so you can see what's happening
      defaultViewport: { width: 1920, height: 1080 },
      timeout: 60000,
      channel: 'chrome', // Use Chrome instead of Chromium
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    this.page = await this.browser.newPage();

    // Intercept network requests
    await this.page.setRequestInterception(true);

    this.page.on('request', (request) => {
      const url = request.url();
      
      // Log API requests
      if (url.includes('api') || url.includes('auth') || url.includes('deck') || url.includes('login')) {
        this.requests.push({
          url: url,
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log(`\n📤 REQUEST: ${request.method()} ${url}`);
        if (request.postData()) {
          console.log('   Body:', request.postData());
        }
      }
      
      request.continue();
    });

    this.page.on('response', async (response) => {
      const url = response.url();
      
      // Log API responses
      if (url.includes('api') || url.includes('auth') || url.includes('deck') || url.includes('login')) {
        try {
          const text = await response.text();
          let body;
          try {
            body = JSON.parse(text);
          } catch {
            body = text;
          }

          this.responses.push({
            url: url,
            status: response.status(),
            headers: response.headers(),
            body: body
          });

          console.log(`\n📥 RESPONSE: ${response.status()} ${url}`);
          if (body && typeof body === 'object') {
            console.log('   Body:', JSON.stringify(body, null, 2).substring(0, 500));
          }
        } catch (error) {
          console.log(`   (Could not read response body)`);
        }
      }
    });
  }

  async navigateToSite() {
    if (!this.page) throw new Error('Browser not launched');
    
    console.log('\nNavigating to UVS Ultra...');
    await this.page.goto('https://uvsultra.online/', {
      waitUntil: 'networkidle2'
    });

    console.log('Page loaded. Looking for login elements...');
    await this.analyzeLoginUI();
  }

  async analyzeLoginUI() {
    if (!this.page) return;

    // Look for login buttons, forms, inputs
    const loginElements = await this.page.evaluate(() => {
      const results: any = {
        buttons: [] as string[],
        inputs: [] as string[],
        forms: [] as string[],
        links: [] as string[]
      };

      // Find potential login buttons
      document.querySelectorAll('button, a').forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('login') || text.includes('sign in') || text.includes('log in')) {
          results.buttons.push(`${el.tagName}: ${el.textContent?.trim()} (class: ${el.className})`);
        }
      });

      // Find input fields
      document.querySelectorAll('input').forEach(input => {
        const type = input.type;
        const name = input.name;
        const id = input.id;
        const placeholder = input.placeholder;
        results.inputs.push(`${type} - name: ${name}, id: ${id}, placeholder: ${placeholder}`);
      });

      // Find forms
      document.querySelectorAll('form').forEach(form => {
        results.forms.push(`action: ${form.action}, method: ${form.method}`);
      });

      return results;
    });

    console.log('\n🔍 Login UI Analysis:');
    console.log('Buttons:', JSON.stringify(loginElements.buttons, null, 2));
    console.log('Inputs:', JSON.stringify(loginElements.inputs, null, 2));
    console.log('Forms:', JSON.stringify(loginElements.forms, null, 2));

    // Take screenshot
    await this.page.screenshot({ path: 'uvs-ultra-homepage.png' });
    console.log('\n📸 Screenshot saved: uvs-ultra-homepage.png');
  }

  async attemptLogin(username: string, password: string) {
    if (!this.page) return;

    console.log('\n⚠️  NOTE: This is for analysis only. Please enter credentials manually in the browser.');
    console.log('Press Enter in the terminal after you have logged in manually...');

    // Wait for manual login
    await new Promise<void>((resolve) => {
      process.stdin.once('data', () => resolve());
    });

    console.log('\nAnalyzing post-login state...');
  }

  async analyzeDeckArea() {
    if (!this.page) return;

    console.log('\n🔍 Looking for deck-related elements...');

    // Look for deck-related URLs, buttons, sections
    const deckInfo = await this.page.evaluate(() => {
      const results: any = {
        deckLinks: [] as string[],
        deckButtons: [] as string[],
        deckSections: [] as string[]
      };

      // Find deck-related links and buttons
      document.querySelectorAll('a, button').forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        const href = (el as HTMLAnchorElement).href || '';
        if (text.includes('deck') || href.includes('deck')) {
          results.deckLinks.push(`${el.tagName}: ${text.trim()} - ${href}`);
        }
      });

      // Find sections that might contain deck data
      document.querySelectorAll('div[class*="deck"], section[class*="deck"]').forEach(el => {
        results.deckSections.push(`${el.className}`);
      });

      return results;
    });

    console.log('Deck Links:', JSON.stringify(deckInfo.deckLinks, null, 2));
    console.log('Deck Sections:', JSON.stringify(deckInfo.deckSections, null, 2));

    // Take screenshot of deck area
    await this.page.screenshot({ path: 'uvs-ultra-deck-area.png' });
    console.log('\n📸 Screenshot saved: uvs-ultra-deck-area.png');
  }

  async saveAnalysis() {
    const analysis = {
      timestamp: new Date().toISOString(),
      requests: this.requests,
      responses: this.responses,
      summary: {
        totalRequests: this.requests.length,
        totalResponses: this.responses.length,
        apiEndpoints: [...new Set(this.requests.map(r => r.url))]
      }
    };

    const outputDir = path.join(process.cwd(), 'data');
    const outputPath = path.join(outputDir, 'uvs-ultra-analysis.json');
    
    try {
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
      console.log(`\n💾 Analysis saved to: ${outputPath}`);
      console.log(`   ${this.requests.length} requests captured`);
      console.log(`   ${this.responses.length} responses captured`);
    } catch (error) {
      console.error('Error saving analysis:', error);
      // Try alternative location
      const altPath = path.join(process.cwd(), 'uvs-ultra-analysis.json');
      await fs.writeFile(altPath, JSON.stringify(analysis, null, 2));
      console.log(`\n💾 Analysis saved to alternate location: ${altPath}`);
    }
  }

  async close() {
    console.log('\nClosing browser...');
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function main() {
  const analyzer = new UVSUltraAnalyzer();

  // Setup graceful shutdown
  const cleanup = async () => {
    console.log('\n\n🛑 Shutting down...');
    await analyzer.saveAnalysis();
    await analyzer.close();
    console.log('\n✅ Analysis complete!');
    console.log('\nNext steps:');
    console.log('- Review data/uvs-ultra-analysis.json for API endpoints');
    console.log('- Check screenshots for UI structure');
    console.log('- Look for patterns in request/response data');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    await analyzer.launch();
    await analyzer.navigateToSite();

    console.log('\n' + '='.repeat(80));
    console.log('INSTRUCTIONS:');
    console.log('1. Manually log in to UVS Ultra in the browser window');
    console.log('2. Navigate to your decks section');
    console.log('3. Click around to explore deck functionality');
    console.log('4. Press Ctrl+C in this terminal to save and exit');
    console.log('5. OR type "save" and press Enter to save without closing');
    console.log('='.repeat(80) + '\n');

    // Listen for manual save command
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.on('line', async (input: string) => {
      if (input.toLowerCase().trim() === 'save') {
        await analyzer.saveAnalysis();
        console.log('\n✅ Analysis saved! You can continue browsing or press Ctrl+C to exit.\n');
      }
    });

    // Keep the process running
    await new Promise(() => {});

  } catch (error) {
    console.error('Error during analysis:', error);
    await analyzer.saveAnalysis();
    await analyzer.close();
    process.exit(1);
  }
}

main();
