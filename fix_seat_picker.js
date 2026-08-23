const fs = require('fs');
let css = fs.readFileSync('apps/web/app/globals.css', 'utf8');

// The mobile overrides are at the end, inside /* Mobile overrides moved to bottom to fix cascade */
// I can just replace `.seat-grid-large { gap:5px; }` with `.seat-grid-large { gap:2px; } .seat-large { font-size: 8px; border-radius: 2px; }`
css = css.replace('.seat-grid-large { gap:5px; }', '.seat-grid-large { gap:2px; } .seat-large { font-size: 8px; border-radius: 2px; }');

// Save the file
fs.writeFileSync('apps/web/app/globals.css', css);
console.log('Fixed seat-picker CSS for mobile.');
