export type EncoreEvent = {
  slug: string;
  title: string;
  kind: 'Events' | 'Movies' | 'Dining' | 'Comedy';
  date: string;
  time: string;
  venue: string;
  city: string;
  price: string;
  description: string;
  image: string;
  featured?: boolean;
  showId?: string;
};

export const encoreEvents: EncoreEvent[] = [
  { slug: 'the-night-we-remember', title: 'The Night We Remember', kind: 'Events', date: '28 Aug', time: '8:00 PM', venue: 'Riverside Grounds', city: 'Mumbai', price: '₹1,499', description: 'One open-air stage, a handpicked line-up, and the kind of night that turns into a group chat name.', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=85', featured: true, showId: '55555555-5555-4555-8555-555555555555' },
  { slug: 'actually-im-fine', title: 'Actually, I’m Fine', kind: 'Comedy', date: '29 Aug', time: '7:30 PM', venue: 'The Habitat', city: 'Mumbai', price: '₹899', description: 'A sharp, warm night of new comedy from the voices you will quote all week.', image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1000&q=85' },
  { slug: 'signals-after-dark', title: 'Signals / After Dark', kind: 'Events', date: '30 Aug', time: '10:00 PM', venue: 'AntiSocial', city: 'Mumbai', price: '₹1,200', description: 'Late-night electronic sets, soft lights, and a room built for losing track of time.', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85' },
  { slug: 'midnight-in-marigold', title: 'Midnight in Marigold', kind: 'Movies', date: 'Today', time: '9:45 PM', venue: 'PVR Lower Parel', city: 'Mumbai', price: '₹280', description: 'A late screening for people who like their stories atmospheric and their popcorn salty.', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=85' },
  { slug: 'the-long-way-home', title: 'The Long Way Home', kind: 'Movies', date: '31 Aug', time: '6:30 PM', venue: 'Maison PVR', city: 'Mumbai', price: '₹450', description: 'A beautifully observed journey home, presented on the big screen with room to breathe.', image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1000&q=85' },
  { slug: 'sunday-social', title: 'Sunday Social: Vinyl & Small Plates', kind: 'Dining', date: '01 Sep', time: '12:30 PM', venue: 'The Bombay Canteen', city: 'Mumbai', price: '₹1,800', description: 'A long lunch with vinyl on the speakers, small plates on the table, and nowhere else to be.', image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85' },
  { slug: 'canvas-laugh-club', title: 'Canvas Laugh Club', kind: 'Comedy', date: '02 Sep', time: '8:30 PM', venue: 'Canvas Laugh Club', city: 'Mumbai', price: '₹750', description: 'An intimate line-up of comics and a small room that makes every punchline land closer.', image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1000&q=85' },
];

export function getEvent(slug: string) { return encoreEvents.find(event => event.slug === slug) || encoreEvents[0]; }
