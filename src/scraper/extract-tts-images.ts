import * as fs from 'fs';
import * as path from 'path';

interface ImageMapping {
  [key: string]: string;
}

interface TTSObject {
  LuaScript?: string;
  ContainedObjects?: TTSObject[];
  [key: string]: any;
}

/**
 * Recursively find all LuaScript fields in TTS objects
 */
function findAllLuaScripts(obj: any, scripts: string[] = []): string[] {
  if (typeof obj !== 'object' || obj === null) {
    return scripts;
  }
  
  if (obj.LuaScript && typeof obj.LuaScript === 'string' && obj.LuaScript.includes('imgur')) {
    scripts.push(obj.LuaScript);
  }
  
  // Recurse into all properties
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      findAllLuaScripts(obj[key], scripts);
    }
  }
  
  return scripts;
}

/**
 * Extract imgur URLs from TTS Lua script
 */
function extractImagesFromTTSFile() {
  const ttsFilePath = path.join(__dirname, '../../client/src/components/tts_mod_rip.json');
  const content = fs.readFileSync(ttsFilePath, 'utf-8');
  
  // Parse the JSON
  const ttsData = JSON.parse(content);
  
  // Find all Lua scripts
  const luaScripts = findAllLuaScripts(ttsData);
  
  console.log(`Found ${luaScripts.length} Lua scripts with imgur references`);
  
  const imagesBack: ImageMapping = {};
  const images: ImageMapping = {};
  
  for (const luaScript of luaScripts) {
    // Extract imagesBack (character backs)
    const imagesBackRegex = /imagesBack\["([^"]+)"\]\s*=\s*"(https:\/\/i\.imgur\.com\/[^"]+)"/g;
    let match;
    
    while ((match = imagesBackRegex.exec(luaScript)) !== null) {
      const cardName = match[1].toLowerCase();
      const imageUrl = match[2];
      imagesBack[cardName] = imageUrl;
    }
    
    // Extract images (front faces)
    const imagesRegex = /images\["([^"]+)"\]\s*=\s*"(https:\/\/i\.imgur\.com\/[^"]+)"/g;
    
    while ((match = imagesRegex.exec(luaScript)) !== null) {
      const cardName = match[1].toLowerCase();
      const imageUrl = match[2];
      images[cardName] = imageUrl;
    }
  }
  
  console.log(`Found ${Object.keys(imagesBack).length} character back images`);
  console.log(`Found ${Object.keys(images).length} card images`);
  
  // Combine into single mapping
  const allImages = { ...imagesBack, ...images };
  
  // Save to JSON file
  const outputPath = path.join(__dirname, '../../data/cards/tts-image-mapping.json');
  fs.writeFileSync(outputPath, JSON.stringify(allImages, null, 2));
  
  console.log(`Saved image mapping to ${outputPath}`);
  console.log(`Total cards with images: ${Object.keys(allImages).length}`);
  
  // Also save to client public directory
  const clientOutputPath = path.join(__dirname, '../../client/public/data/cards/tts-image-mapping.json');
  fs.writeFileSync(clientOutputPath, JSON.stringify(allImages, null, 2));
  console.log(`Copied to ${clientOutputPath}`);
  
  // Print some sample mappings
  console.log('\nSample mappings:');
  const sampleKeys = Object.keys(allImages).slice(0, 5);
  sampleKeys.forEach(key => {
    console.log(`  "${key}": "${allImages[key]}"`);
  });
}

// Run extraction
extractImagesFromTTSFile();
