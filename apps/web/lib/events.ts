export type EncoreEvent = {
  slug: string;
  title: string;
  kind: 'Events' | 'Movies' | 'Dining' | 'Comedy';
  date: string;
  time: string;
  venue: string;
  city: 'Mumbai' | 'Delhi NCR' | 'Bengaluru' | 'Pune';
  price: string;
  description: string;
  image: string;
  featured?: boolean;
  showId: string;
};

export const encoreEvents: EncoreEvent[] = [
  // ── Mumbai ────────────────────────────────────────────────────────────────
  {
    slug: 'the-night-we-remember',
    title: 'The Night We Remember',
    kind: 'Events',
    date: '28 Aug',
    time: '8:00 PM',
    venue: 'Riverside Grounds',
    city: 'Mumbai',
    price: '₹1,499',
    description: 'One open-air stage, a handpicked line-up, and the kind of night that turns into a group chat name.',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=85',
    featured: true,
    showId: '55555555-5555-4555-8555-555555555555',
  },
  {
    slug: 'actually-im-fine',
    title: 'Actually, I’m Fine',
    kind: 'Comedy',
    date: '29 Aug',
    time: '7:30 PM',
    venue: 'The Habitat',
    city: 'Mumbai',
    price: '₹899',
    description: 'A sharp, warm night of new comedy from the voices you will quote all week.',
    image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1000&q=85',
    showId: '55555555-5555-4555-8555-000000000001',
  },
  {
    slug: 'signals-after-dark',
    title: 'Signals / After Dark',
    kind: 'Events',
    date: '30 Aug',
    time: '10:00 PM',
    venue: 'AntiSocial',
    city: 'Mumbai',
    price: '₹1,200',
    description: 'Late-night electronic sets, soft lights, and a room built for losing track of time.',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85',
    showId: '55555555-5555-4555-8555-000000000002',
  },
  {
    slug: 'midnight-in-marigold',
    title: 'Midnight in Marigold',
    kind: 'Movies',
    date: 'Today',
    time: '9:45 PM',
    venue: 'PVR Lower Parel',
    city: 'Mumbai',
    price: '₹280',
    description: 'A late screening for people who like their stories atmospheric and their popcorn salty.',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=85',
    showId: '55555555-5555-4555-8555-000000000003',
  },
  {
    slug: 'sunday-social',
    title: 'Sunday Social: Vinyl & Small Plates',
    kind: 'Dining',
    date: '01 Sep',
    time: '12:30 PM',
    venue: 'The Bombay Canteen',
    city: 'Mumbai',
    price: '₹1,800',
    description: 'A long lunch with vinyl on the speakers, small plates on the table, and nowhere else to be.',
    image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85',
    showId: '55555555-5555-4555-8555-000000000004',
  },

  // ── Delhi NCR ─────────────────────────────────────────────────────────────
  {
    slug: 'echoes-in-the-ruins',
    title: 'Echoes in the Ruins: Sunder Acoustic',
    kind: 'Events',
    date: '31 Aug',
    time: '6:30 PM',
    venue: 'Sunder Nursery Amphitheatre',
    city: 'Delhi NCR',
    price: '₹1,299',
    description: 'A sunset acoustic concert set amongst heritage monuments and green gardens.',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1400&q=85',
    featured: true,
    showId: '55555555-5555-4555-8555-000000000010',
  },
  {
    slug: 'capital-comedy-showcase',
    title: 'Capital Comedy Showcase',
    kind: 'Comedy',
    date: '01 Sep',
    time: '8:00 PM',
    venue: 'Canvas Laugh Club CyberHub',
    city: 'Delhi NCR',
    price: '₹799',
    description: 'Delhi’s funniest headliners taking the stage for 90 minutes of non-stop laughter.',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1000&q=85',
    showId: '55555555-5555-4555-8555-000000000011',
  },
  {
    slug: 'neon-horizon-delhi',
    title: 'Neon Horizon / Rooftop Beats',
    kind: 'Events',
    date: '02 Sep',
    time: '9:00 PM',
    venue: 'Imperfecto Patio',
    city: 'Delhi NCR',
    price: '₹999',
    description: 'Deep house under the stars with handcrafted cocktails and ambient lighting.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=85',
    showId: '55555555-5555-4555-8555-000000000012',
  },

  // ── Bengaluru ─────────────────────────────────────────────────────────────
  {
    slug: 'electronic-symphony-blr',
    title: 'Garden City Live: Synth & Brass',
    kind: 'Events',
    date: '29 Aug',
    time: '7:00 PM',
    venue: 'Jayamahal Palace Lawns',
    city: 'Bengaluru',
    price: '₹1,599',
    description: 'A seamless fusion of live brass instruments and modular synthesizers under the Bengaluru canopy.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=85',
    featured: true,
    showId: '55555555-5555-4555-8555-000000000020',
  },
  {
    slug: 'indiranagar-standup',
    title: 'Underground Comedy: Indiranagar',
    kind: 'Comedy',
    date: '30 Aug',
    time: '8:30 PM',
    venue: 'The Underground Club',
    city: 'Bengaluru',
    price: '₹650',
    description: 'Intimate setting, craft beverages, and unreleased jokes from Bengaluru’s favorite comics.',
    image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1000&q=85',
    showId: '55555555-5555-4555-8555-000000000021',
  },
  {
    slug: 'microbrew-vinyl-blr',
    title: 'Hops & Needle: Craft Vinyl Brunch',
    kind: 'Dining',
    date: '31 Aug',
    time: '1:00 PM',
    venue: 'Toit Brewpub',
    city: 'Bengaluru',
    price: '₹1,650',
    description: 'Woodfired pizzas, seasonal brews, and all-day funk and soul curated on vinyl.',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=85',
    showId: '55555555-5555-4555-8555-000000000022',
  },

  // ── Pune ──────────────────────────────────────────────────────────────────
  {
    slug: 'high-street-acoustic-pune',
    title: 'Sunset Sessions at The Mills',
    kind: 'Events',
    date: '30 Aug',
    time: '6:45 PM',
    venue: 'The Mills Amphitheatre',
    city: 'Pune',
    price: '₹1,199',
    description: 'Indie singer-songwriters playing warm stripped-down arrangements as the sun sets over Pune.',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=85',
    featured: true,
    showId: '55555555-5555-4555-8555-000000000030',
  },
  {
    slug: 'koregaon-park-laughter',
    title: 'Koregaon Park Comedy Special',
    kind: 'Comedy',
    date: '31 Aug',
    time: '8:00 PM',
    venue: 'Classic Rock Coffee Co',
    city: 'Pune',
    price: '₹599',
    description: 'Pune’s freshest standup talent alongside touring national acts in KP.',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1000&q=85',
    showId: '55555555-5555-4555-8555-000000000031',
  },
  {
    slug: 'sunset-bistro-jazz-pune',
    title: 'Candlelight Jazz & Dine',
    kind: 'Dining',
    date: '01 Sep',
    time: '7:30 PM',
    venue: 'Santé Spa & Bistro',
    city: 'Pune',
    price: '₹1,750',
    description: 'An intimate five-course dinner paired with smooth live jazz quartet performances.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85',
    showId: '55555555-5555-4555-8555-000000000032',
  },
];

export function getEvent(idOrSlug: string) {
  return (
    encoreEvents.find(event => event.slug === idOrSlug || event.showId === idOrSlug) ||
    encoreEvents[0]
  );
}
