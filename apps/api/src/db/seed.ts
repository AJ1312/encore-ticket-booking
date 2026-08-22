import 'dotenv/config';
import * as argon2 from 'argon2';
import { db } from './client';
import { events, seats, showSeats, shows, users, venues } from './schema';

const ids={admin:'11111111-1111-4111-8111-111111111111',organiser:'22222222-2222-4222-8222-222222222222',venue:'33333333-3333-4333-8333-333333333333',event:'44444444-4444-4444-8444-444444444444',show:'55555555-5555-4555-8555-555555555555'};
async function run(){
 const password=await argon2.hash(process.env.SEED_PASSWORD||'EncoreDemo!2026');
 await db.insert(users).values([{id:ids.admin,name:'Encore Admin',email:'admin@encore.local',passwordHash:password,role:'admin'},{id:ids.organiser,name:'Encore Organiser',email:'organiser@encore.local',passwordHash:password,role:'organiser'}]).onConflictDoNothing();
 await db.insert(venues).values({id:ids.venue,name:'Riverside Grounds',city:'Mumbai',address:'Bandra West, Mumbai',timezone:'Asia/Kolkata'}).onConflictDoNothing();
 await db.insert(events).values({id:ids.event,organiserId:ids.organiser,title:'The Night We Remember',description:'An intimate live set under the city lights.',type:'concert',posterUrl:'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=85'}).onConflictDoNothing();
 await db.insert(shows).values({id:ids.show,eventId:ids.event,venueId:ids.venue,startsAt:new Date('2026-08-28T14:30:00.000Z')}).onConflictDoNothing();
 const inventory=Array.from({length:72},(_,i)=>({venueId:ids.venue,section:i<24?'Premium':i<48?'Standard':'Economy',rowLabel:String.fromCharCode(65+Math.floor(i/12)),seatNumber:i%12+1,category:i<24?'Premium':i<48?'Standard':'Economy',pricePaise:i<24?149900:i<48?99900:69900,x:i%12,y:Math.floor(i/12)}));
 await db.insert(seats).values(inventory).onConflictDoNothing();
 const stored=await db.select({id:seats.id}).from(seats);
 await db.insert(showSeats).values(stored.map(s=>({showId:ids.show,seatId:s.id}))).onConflictDoNothing();
 console.log(`Seeded ${stored.length} seats for show ${ids.show}`); process.exit(0);
}
run().catch(error=>{console.error(error);process.exit(1)});
