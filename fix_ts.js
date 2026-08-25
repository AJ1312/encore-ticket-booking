const fs = require('fs');
const path = './apps/web/components/seat-picker.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("    matchedStatic?.type?.toLowerCase() === 'concert' ||\n", "");

const targetFilter = `  const handleZoneRemove = (catName: string) => {
    const selectedInCategory = selected.filter(id => seats.find(s => s.id === id)?.category === catName || (!s.category && catName === 'Standard'));`;

const replaceFilter = `  const handleZoneRemove = (catName: string) => {
    const selectedInCategory = selected.filter(id => {
      const s = seats.find(seat => seat.id === id);
      return s?.category === catName || (!s?.category && catName === 'Standard');
    });`;

code = code.replace(targetFilter, replaceFilter);

const targetStyle = `width: 36, height: 36, borderRadius: '50%', border: '1px solid #415a77',
                              background: 'var(--peach)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',`;
const replaceStyle = `width: 36, height: 36, borderRadius: '50%',
                              background: 'var(--peach)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',`;

code = code.replace(targetStyle, replaceStyle);
fs.writeFileSync(path, code);
console.log('done');
