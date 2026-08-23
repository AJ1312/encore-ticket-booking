const fs = require('fs');

const eventsFile = fs.readFileSync('apps/web/lib/events.ts', 'utf8');

// Regex to match the objects in the array
const eventRegex = /{\s*slug:\s*'([^']+)',\s*title:\s*'([^']+)',\s*kind:\s*'([^']+)',\s*date:\s*'([^']+)',\s*time:\s*'([^']+)',\s*venue:\s*'([^']+)',\s*city:\s*'([^']+)',\s*price:\s*'([^']+)',\s*description:\s*'([^']+)',\s*image:\s*'([^']+)',\s*(?:featured:\s*true,\s*)?showId:\s*'([^']+)',\s*}/g;

let match;
const events = [];
while ((match = eventRegex.exec(eventsFile)) !== null) {
  events.push({
    slug: match[1],
    title: match[2],
    venue: match[6],
    city: match[7],
    image: match[10],
    showId: match[11]
  });
}

let code = `    const cityShows: Record<string, { venueId: string; venueName: string; city: string; eventId: string; eventTitle: string; posterUrl: string }> = {\n`;
for (const e of events) {
  const shortId = e.showId.split('-')[4];
  const venueId = `33333333-3333-4333-8333-${shortId}`;
  const eventId = `44444444-4444-4444-8444-${shortId}`;
  code += `      '${e.showId}': {\n`;
  code += `        venueId: '${venueId}',\n`;
  code += `        venueName: '${e.venue.replace(/'/g, "\\'")}',\n`;
  code += `        city: '${e.city}',\n`;
  code += `        eventId: '${eventId}',\n`;
  code += `        eventTitle: '${e.title.replace(/'/g, "\\'")}',\n`;
  code += `        posterUrl: '${e.image}',\n`;
  code += `      },\n`;
}
code += `    };\n`;
console.log(code);
