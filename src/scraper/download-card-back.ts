import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

/**
 * Download a file from a URL
 */
function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
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
 * Download the generic UVS card back
 */
async function downloadCardBack() {
  const cardBackUrl = 'https://steamusercontent-a.akamaihd.net/ugc/2083534112071700900/E741482B971F45167F4A08CAC6F26B9D01362F97/';
  const outputDir = path.join(__dirname, '../../client/public/images/cards');
  const outputPath = path.join(outputDir, 'card-back.png');

  // Create output directory if needed
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Downloading UVS card back image...');
  console.log(`URL: ${cardBackUrl}`);
  console.log(`Output: ${outputPath}`);

  try {
    await downloadFile(cardBackUrl, outputPath);
    console.log('\n✓ Card back downloaded successfully!');
    console.log(`Saved to: ${outputPath}`);
    console.log('\nYou can now use this as /images/cards/card-back.png in your app');
  } catch (error) {
    console.error('Failed to download card back:', error);
  }
}

// Run download
downloadCardBack();
