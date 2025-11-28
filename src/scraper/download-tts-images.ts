import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

interface ImageMapping {
  [key: string]: string;
}

/**
 * Download a file from a URL
 */
function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        if (response.headers.location) {
          downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Sanitize filename to be filesystem-safe
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

/**
 * Download all TTS images
 */
async function downloadAllTTSImages() {
  const mappingPath = path.join(__dirname, '../../data/cards/tts-image-mapping.json');
  const outputDir = path.join(__dirname, '../../client/public/images/cards');

  // Load image mapping
  const mappingData = fs.readFileSync(mappingPath, 'utf-8');
  const imageMapping: ImageMapping = JSON.parse(mappingData);

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Starting download of ${Object.keys(imageMapping).length} card images...`);
  console.log(`Output directory: ${outputDir}\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  const entries = Object.entries(imageMapping);
  const totalCount = entries.length;

  for (let i = 0; i < entries.length; i++) {
    const [cardName, imageUrl] = entries[i];
    
    // Extract file extension from URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const extension = path.extname(filename) || '.png';
    
    // Create safe filename
    const safeFilename = `${sanitizeFilename(cardName)}${extension}`;
    const outputPath = path.join(outputDir, safeFilename);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      skipped++;
      if (skipped % 100 === 0) {
        console.log(`Progress: ${i + 1}/${totalCount} (${downloaded} downloaded, ${skipped} skipped, ${failed} failed)`);
      }
      continue;
    }

    try {
      await downloadFile(imageUrl, outputPath);
      downloaded++;
      
      // Progress update every 10 downloads
      if (downloaded % 10 === 0) {
        console.log(`Progress: ${i + 1}/${totalCount} (${downloaded} downloaded, ${skipped} skipped, ${failed} failed)`);
      }

      // Add small delay to avoid overwhelming imgur
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      failed++;
      console.error(`Failed to download ${cardName}: ${error}`);
    }
  }

  console.log('\n=== Download Complete ===');
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${totalCount}`);

  // Create a mapping file with local paths
  const localMapping: ImageMapping = {};
  for (const [cardName, imageUrl] of entries) {
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const extension = path.extname(filename) || '.png';
    const safeFilename = `${sanitizeFilename(cardName)}${extension}`;
    localMapping[cardName] = `/images/cards/${safeFilename}`;
  }

  // Save local path mapping
  const localMappingPath = path.join(__dirname, '../../client/public/data/cards/local-image-mapping.json');
  fs.writeFileSync(localMappingPath, JSON.stringify(localMapping, null, 2));
  console.log(`\nSaved local path mapping to ${localMappingPath}`);
}

// Run download
downloadAllTTSImages().catch(console.error);
