import fs from 'fs';

const filePath = './src/modules/tiktok-module/entry_point.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix all template literal errors
const fixes = [
  // Fix fetchWithTimeout calls
  [/fetchWithTimeout`([^`]+)`/g, 'fetchWithTimeout($1)'],
  
  // Fix Error template literals
  [/Error`([^`]+)`/g, 'Error($1)'],
  
  // Fix text`` calls
  [/text`([^`]+)`/g, 'text($1)'],
  
  // Fix MediaGalleryItemBuilder.setURL``
  [/\.setURL`([^`]+)`/g, '.setURL($1)'],
  
  // Fix array initialization with template literals
  [/const head: string\[\] = `([^`]+)`\]/g, 'const head: string[] = [$1]'],
  
  // Fix .push`` calls
  [/\.push`([^`]+)`/g, '.push($1)'],
  
  // Fix foot.push`` calls
  [/foot\.push`([^`]+)`/g, 'foot.push($1)'],
  
  // Fix tail.push`` calls
  [/tail\.push`([^`]+)`/g, 'tail.push($1)'],
  
  // Fix head.push`` calls
  [/head\.push`([^`]+)`/g, 'head.push($1)'],
  
  // Fix console.log`` calls
  [/console\.log`([^`]+)`/g, 'console.log($1)'],
  
  // Fix console.error`` calls
  [/console\.error`([^`]+)`/g, 'console.error($1)'],
  
  // Fix new RegExp`` calls
  [/new RegExp`([^`]+)`/g, 'new RegExp($1)'],
  
  // Fix COLOR_RED reference
  [/COLOR_RED/g, '0xed4245'],
  
  // Fix flags: V2 to flags: V2 as any
  [/flags: V2,/g, 'flags: V2 as any,'],
];

fixes.forEach(([pattern, replacement]) => {
  content = content.replace(pattern, replacement);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all template literal errors in TikTok module!');
