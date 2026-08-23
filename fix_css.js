const fs = require('fs');
let css = fs.readFileSync('apps/web/app/globals.css', 'utf8');
const lines = css.split('\n');

const mediaLines = [];
const otherLines = [];

let inPrint = false;
let printBlock = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (inPrint) {
    printBlock.push(line);
    if (line.includes('}')) {
      inPrint = false;
      mediaLines.push(printBlock.join('\n'));
      printBlock = [];
    }
    continue;
  }

  if (line.trim().startsWith('@media') && line.includes('}')) {
    // Single line media query
    let modifiedLine = line;
    // Inject hero-actions flex-direction column into the first max-width: 850px block
    if (line.includes('(max-width: 850px)') && !mediaLines.some(l => l.includes('.hero-actions { flex-direction: column; }'))) {
      modifiedLine = modifiedLine.replace('{', '{ .hero-actions { flex-direction: column; }');
    }
    // Remove the location-pill display flex from max-width 850px so it actually hides
    if (modifiedLine.includes('.city-selector .location-pill { display:flex; padding:8px 10px; }')) {
       modifiedLine = modifiedLine.replace('.city-selector .location-pill { display:flex; padding:8px 10px; }', '');
    }
    
    mediaLines.push(modifiedLine);
  } else if (line.trim().startsWith('@media print {')) {
    inPrint = true;
    printBlock.push(line);
  } else {
    otherLines.push(line);
  }
}

const finalCss = otherLines.join('\n') + '\n\n/* Mobile overrides moved to bottom to fix cascade */\n' + mediaLines.join('\n');
fs.writeFileSync('apps/web/app/globals.css', finalCss);
console.log('Fixed CSS order and injected hero-actions.');
