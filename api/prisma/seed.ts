import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type EventType } from "@prisma/client";

const prisma = new PrismaClient();

// Events are placed relative to the day the seed runs, so the app always has
// upcoming events. Day offset 3 is deliberately left empty so the "no events
// on this day" filter state is real.
const EMPTY_DAY_OFFSET = 3;

interface SeedEvent {
  id: string;
  title: string;
  type: EventType;
  dayOffset: number;
  startHour: number;
  durationHours: number;
  description: string;
  venue: string;
  address: string;
  priceLabel: string;
  ticketUrl: string;
}

const CITY = "Riverside";

const EVENTS: SeedEvent[] = [
  // Day 0 (today)
  {
    id: "jazz-on-the-terrace",
    title: "Jazz on the Terrace",
    type: "MUSIC",
    dayOffset: 0,
    startHour: 19,
    durationHours: 3,
    description:
      "A relaxed evening of live jazz from the Riverside Quartet on the rooftop terrace. Bring a jacket; the river breeze picks up after sunset.",
    venue: "Harbour Hotel Rooftop",
    address: "12 Quay Street",
    priceLabel: "From ₹600",
    ticketUrl: "https://tickets.example.com/events/jazz-on-the-terrace",
  },
  {
    id: "night-market-street-food",
    title: "Night Market Street Food",
    type: "FOOD",
    dayOffset: 0,
    startHour: 17,
    durationHours: 5,
    description:
      "Forty stalls of street food from across the region: dosas, momos, kebabs, and kulfi. Cash and cards accepted at every stall.",
    venue: "Old Mill Square",
    address: "Mill Road",
    priceLabel: "Free entry",
    ticketUrl: "https://www.example.org/night-market",
  },
  {
    id: "storytime-in-the-park",
    title: "Storytime in the Park",
    type: "FAMILY",
    dayOffset: 0,
    startHour: 10,
    durationHours: 2,
    description:
      "Picture books, puppets, and sing-alongs for children aged three to eight. Blankets provided; parents stay with their children.",
    venue: "Lakeside Gardens",
    address: "Lake View Avenue",
    priceLabel: "Free, registration required",
    ticketUrl: "https://www.example.org/storytime/register",
  },
  // Day 1
  {
    id: "city-derby-football",
    title: "City Derby: Riverside FC vs Hillcrest",
    type: "SPORTS",
    dayOffset: 1,
    startHour: 16,
    durationHours: 2,
    description:
      "The season's biggest local derby. Gates open ninety minutes before kick-off. Family stand seats are available.",
    venue: "Riverside Stadium",
    address: "1 Stadium Way",
    priceLabel: "From ₹350",
    ticketUrl: "https://tickets.example.com/events/city-derby",
  },
  {
    id: "watercolour-workshop",
    title: "Watercolour Workshop for Beginners",
    type: "ARTS",
    dayOffset: 1,
    startHour: 11,
    durationHours: 3,
    description:
      "Learn washes, layering, and colour mixing with painter Meera Joshi. All materials included. Limited to 16 places.",
    venue: "Riverside Arts Centre",
    address: "44 Gallery Lane",
    priceLabel: "₹1,200",
    ticketUrl: "https://tickets.example.com/events/watercolour-workshop",
  },
  {
    id: "indie-showcase",
    title: "Indie Showcase: Four Bands, One Night",
    type: "MUSIC",
    dayOffset: 1,
    startHour: 20,
    durationHours: 3,
    description:
      "Four up-and-coming local bands play short sets back to back. Standing room only.",
    venue: "The Warehouse",
    address: "8 Dock Road",
    priceLabel: "₹450",
    ticketUrl: "https://tickets.example.com/events/indie-showcase",
  },
  // Day 2
  {
    id: "farmers-market",
    title: "Weekend Farmers' Market",
    type: "FOOD",
    dayOffset: 2,
    startHour: 8,
    durationHours: 5,
    description:
      "Seasonal produce, fresh bread, honey, and cheese direct from growers within fifty kilometres of the city.",
    venue: "Town Hall Plaza",
    address: "Civic Centre",
    priceLabel: "Free entry",
    ticketUrl: "https://www.example.org/farmers-market",
  },
  {
    id: "science-fair-for-kids",
    title: "Hands-On Science Fair",
    type: "FAMILY",
    dayOffset: 2,
    startHour: 10,
    durationHours: 6,
    description:
      "Build a rocket, extract DNA from a strawberry, and meet the robots. Best for ages six and up.",
    venue: "Riverside Science Museum",
    address: "3 Discovery Road",
    priceLabel: "₹250 per child",
    ticketUrl: "https://tickets.example.com/events/science-fair",
  },
  {
    id: "riverside-10k",
    title: "Riverside 10K Fun Run",
    type: "SPORTS",
    dayOffset: 2,
    startHour: 7,
    durationHours: 3,
    description:
      "A flat, scenic 10K along the river path. Chip timing, water stations every 2.5 km, and a medal for every finisher.",
    venue: "Riverside Promenade",
    address: "Promenade Start Line, Ferry Steps",
    priceLabel: "₹800 entry",
    ticketUrl: "https://tickets.example.com/events/riverside-10k",
  },
  // Day 3 is intentionally empty.
  // Day 4
  {
    id: "contemporary-photography",
    title: "Contemporary Photography: Opening Night",
    type: "ARTS",
    dayOffset: 4,
    startHour: 18,
    durationHours: 3,
    description:
      "The opening of 'Ordinary Light', a group exhibition by six regional photographers. Meet the artists over drinks.",
    venue: "North Wall Gallery",
    address: "27 Market Street",
    priceLabel: "Free",
    ticketUrl: "https://www.example.org/ordinary-light",
  },
  {
    id: "symphony-under-the-stars",
    title: "Symphony Under the Stars",
    type: "MUSIC",
    dayOffset: 4,
    startHour: 19,
    durationHours: 2,
    description:
      "The Riverside Philharmonic plays film scores and classical favourites in the open air. Seating on the lawn.",
    venue: "Lakeside Gardens Bandstand",
    address: "Lake View Avenue",
    priceLabel: "From ₹500",
    ticketUrl: "https://tickets.example.com/events/symphony-under-the-stars",
  },
  // Day 5
  {
    id: "chili-cook-off",
    title: "Great Chili Cook-Off",
    type: "FOOD",
    dayOffset: 5,
    startHour: 12,
    durationHours: 4,
    description:
      "Twenty teams compete for the golden ladle. Buy a tasting card and vote for your favourite.",
    venue: "Old Mill Square",
    address: "Mill Road",
    priceLabel: "Tasting card ₹300",
    ticketUrl: "https://tickets.example.com/events/chili-cook-off",
  },
  {
    id: "family-movie-night",
    title: "Outdoor Family Movie Night",
    type: "FAMILY",
    dayOffset: 5,
    startHour: 18,
    durationHours: 3,
    description:
      "An animated favourite on the big inflatable screen. Popcorn on sale; bring cushions and blankets.",
    venue: "Central Park Lawn",
    address: "Park Road",
    priceLabel: "Free",
    ticketUrl: "https://www.example.org/movie-night",
  },
  // Day 6
  {
    id: "basketball-3x3",
    title: "3x3 Street Basketball Tournament",
    type: "SPORTS",
    dayOffset: 6,
    startHour: 9,
    durationHours: 8,
    description:
      "Open bracket 3x3 tournament with under-16, open, and women's divisions. Spectators welcome all day.",
    venue: "Eastside Courts",
    address: "Eastside Recreation Ground",
    priceLabel: "Team entry ₹1,000",
    ticketUrl: "https://tickets.example.com/events/basketball-3x3",
  },
  {
    id: "poetry-slam",
    title: "Open Mic Poetry Slam",
    type: "ARTS",
    dayOffset: 6,
    startHour: 19,
    durationHours: 2,
    description:
      "Three minutes, no props, scored by the audience. Sign up at the door to perform or just come to listen.",
    venue: "Riverside Arts Centre",
    address: "44 Gallery Lane",
    priceLabel: "₹150",
    ticketUrl: "https://tickets.example.com/events/poetry-slam",
  },
  // Later
  {
    id: "food-truck-friday",
    title: "Food Truck Friday",
    type: "FOOD",
    dayOffset: 8,
    startHour: 17,
    durationHours: 4,
    description: "A dozen food trucks, live DJ, and picnic tables by the water.",
    venue: "Ferry Steps Car Park",
    address: "Ferry Steps",
    priceLabel: "Free entry",
    ticketUrl: "https://www.example.org/food-truck-friday",
  },
  {
    id: "folk-festival",
    title: "Riverside Folk Festival",
    type: "MUSIC",
    dayOffset: 10,
    startHour: 12,
    durationHours: 9,
    description: "A full day of folk, bluegrass, and acoustic acts across two stages.",
    venue: "Lakeside Gardens",
    address: "Lake View Avenue",
    priceLabel: "Day pass ₹900",
    ticketUrl: "https://tickets.example.com/events/folk-festival",
  },
];

function atDay(offset: number, hour: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  d.setHours(hour);
  return d;
}

const USERS = [
  { email: "alex@example.com", name: "Alex Rivera", password: "password123", role: "USER" as const },
  { email: "admin@example.com", name: "Sam Admin", password: "admin12345", role: "ADMIN" as const },
];

async function main() {
  if (EVENTS.some((e) => e.dayOffset === EMPTY_DAY_OFFSET)) {
    throw new Error(`Seed must leave day offset ${EMPTY_DAY_OFFSET} empty`);
  }

  const users: Record<string, string> = {};
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: u.name, role: u.role, passwordHash },
      update: { name: u.name, role: u.role, passwordHash },
    });
    users[u.email] = user.id;
  }

  for (const e of EVENTS) {
    const data = {
      title: e.title,
      type: e.type,
      description: e.description,
      venue: e.venue,
      address: e.address,
      city: CITY,
      startsAt: atDay(e.dayOffset, e.startHour),
      endsAt: atDay(e.dayOffset, e.startHour + e.durationHours),
      priceLabel: e.priceLabel,
      ticketUrl: e.ticketUrl,
      imageUrl: `https://picsum.photos/seed/${e.id}/800/450`,
    };
    await prisma.event.upsert({ where: { id: e.id }, create: { id: e.id, ...data }, update: data });
  }

  // Alex starts with a few saved events so the Saved screen opens populated.
  const alexId = users["alex@example.com"];
  for (const eventId of ["jazz-on-the-terrace", "riverside-10k", "contemporary-photography"]) {
    await prisma.savedEvent.upsert({
      where: { userId_eventId: { userId: alexId, eventId } },
      create: { userId: alexId, eventId },
      update: {},
    });
  }

  const emptyDay = atDay(EMPTY_DAY_OFFSET, 0).toDateString();
  console.log(`Seeded ${USERS.length} users and ${EVENTS.length} events. Empty day: ${emptyDay}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
