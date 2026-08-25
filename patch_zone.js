const fs = require('fs');
const path = './apps/web/components/seat-picker.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetHelper = `  const availableSeats = useMemo(() => {
    return seats.filter(s => s.status === 'available');
  }, [seats]);`;

const helperReplacement = `  const availableSeats = useMemo(() => {
    return seats.filter(s => s.status === 'available');
  }, [seats]);

  const zoneCategories = useMemo(() => {
    const cats = Array.from(new Set(seats.map(s => s.category || 'Standard')));
    return cats.map(cat => {
      const catSeats = seats.filter(s => (s.category || 'Standard') === cat);
      const available = catSeats.filter(s => s.status === 'available');
      const selectedCount = selected.filter(id => seats.find(s => s.id === id)?.category === cat).length;
      return {
        name: cat,
        price: catSeats[0]?.pricePaise || 99900,
        total: catSeats.length,
        available: available.length,
        selected: selectedCount,
        availableSeats: available,
      };
    });
  }, [seats, selected]);

  const handleZoneAdd = (catName: string) => {
    const cat = zoneCategories.find(c => c.name === catName);
    if (!cat) return;
    const availableUnselected = cat.availableSeats.filter(s => !selected.includes(s.id));
    if (availableUnselected.length > 0 && selected.length < 8) {
      setSelected(prev => [...prev, availableUnselected[0].id]);
    }
  };

  const handleZoneRemove = (catName: string) => {
    const selectedInCategory = selected.filter(id => seats.find(s => s.id === id)?.category === catName || (!s.category && catName === 'Standard'));
    if (selectedInCategory.length > 0) {
      const toRemove = selectedInCategory[selectedInCategory.length - 1];
      setSelected(prev => prev.filter(id => id !== toRemove));
    }
  };`;

const targetTabs = `                <div className="map-tabs">
                  <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>Map view</button>
                  <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>List view</button>
                </div>`;

const tabsReplacement = `                <div className="map-tabs">
                  <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>Map view</button>
                  <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>List view</button>
                  <button className={view === 'zone' ? 'active' : ''} onClick={() => setView('zone')}>Zone view</button>
                </div>`;

const targetViews = `              {view === 'map' ? (
                <div className="seat-canvas" style={{ background: '#0e1012', border: '1px solid #23272d', borderRadius: 8, padding: 30 }}>`;

const viewsReplacement = `              {view === 'zone' ? (
                <div className="seat-zone-view" style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {zoneCategories.map(cat => {
                    const isSoldOut = cat.available === 0 && cat.selected === 0;
                    return (
                      <div key={cat.name} className="zone-card" style={{
                        background: '#141d26', border: '1px solid #23272d', borderRadius: 12, padding: 20,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isSoldOut ? 0.6 : 1
                      }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#e0e1dd' }}>{cat.name}</h3>
                          <div style={{ color: '#8b949e', fontSize: 14 }}>
                            ₹{Math.round(cat.price / 100).toLocaleString('en-IN')}
                            <span style={{ margin: '0 8px' }}>•</span>
                            {isSoldOut ? <span style={{ color: '#e07a5f' }}>Sold Out</span> : <span>{cat.available} available</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <button
                            onClick={() => handleZoneRemove(cat.name)}
                            disabled={cat.selected === 0}
                            style={{
                              width: 36, height: 36, borderRadius: '50%', border: '1px solid #415a77',
                              background: 'transparent', color: '#e0e1dd', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: cat.selected > 0 ? 'pointer' : 'not-allowed', opacity: cat.selected > 0 ? 1 : 0.3
                            }}
                          >
                            <Minus size={16} />
                          </button>
                          <span style={{ fontSize: 18, fontWeight: 600, width: 24, textAlign: 'center' }}>{cat.selected}</span>
                          <button
                            onClick={() => handleZoneAdd(cat.name)}
                            disabled={cat.available - cat.selected <= 0 || selected.length >= 8}
                            style={{
                              width: 36, height: 36, borderRadius: '50%', border: '1px solid #415a77',
                              background: 'var(--peach)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
                              cursor: cat.available - cat.selected > 0 && selected.length < 8 ? 'pointer' : 'not-allowed',
                              opacity: cat.available - cat.selected > 0 && selected.length < 8 ? 1 : 0.3
                            }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : view === 'map' ? (
                <div className="seat-canvas" style={{ background: '#0e1012', border: '1px solid #23272d', borderRadius: 8, padding: 30 }}>`;

code = code.replace(targetHelper, helperReplacement);
code = code.replace(targetTabs, tabsReplacement);
code = code.replace(targetViews, viewsReplacement);
fs.writeFileSync(path, code);
console.log('done');
