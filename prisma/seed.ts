import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  Category,
  PrismaClient,
} from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

type SampleEvent = {
  id: string;
  title: string;
  category: Category;
  city: string;
  daysFromNow: number;
  pricePaise: number;
  description: string;
  isActive: boolean;
  imageUrl: string;
};

// Unsplash source images are grouped by event type so seeded cards are visually distinct.
const eventImages = {
  music: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&auto=format&fit=crop&q=85",
  acoustic: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&auto=format&fit=crop&q=85",
  jazz: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200&auto=format&fit=crop&q=85",
  pottery: "https://images.unsplash.com/photo-1645401242461-ffdab88f6f99?w=1200&auto=format&fit=crop&q=85",
  photography: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=85",
  food: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop&q=85",
  streetFood: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=85",
  sports: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=1200&auto=format&fit=crop&q=85",
  yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&auto=format&fit=crop&q=85",
  kids: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&auto=format&fit=crop&q=85",
  art: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=85",
  rooftop: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=85",
  baking: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=85",
  badminton: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=85",
} as const;

const sampleEvents: SampleEvent[] = [
  {
    id: "sample-music-night",
    title: "Community Music Night",
    category: Category.MUSIC,
    city: "Coimbatore",
    daysFromNow: 7,
    pricePaise: 25000,
    description: "An evening of live music featuring local artists.",
    isActive: true,
    imageUrl: eventImages.music,
  },
  {
    id: "sample-acoustic-evening",
    title: "Acoustic Evening",
    category: Category.MUSIC,
    city: "Chennai",
    daysFromNow: 2,
    pricePaise: 15000,
    description: "Relax with acoustic performances in a cosy venue.",
    isActive: true,
    imageUrl: eventImages.acoustic,
  },
  {
    id: "sample-jazz-night",
    title: "Jazz Night",
    category: Category.MUSIC,
    city: "Coimbatore",
    daysFromNow: 12,
    pricePaise: 50000,
    description: "Enjoy live jazz from talented local musicians.",
    isActive: true,
    imageUrl: eventImages.jazz,
  },
  {
    id: "sample-pottery",
    title: "Beginner Pottery Workshop",
    category: Category.WORKSHOP,
    city: "Coimbatore",
    daysFromNow: 3,
    pricePaise: 80000,
    description: "Learn to shape your first clay bowl. Materials included.",
    isActive: true,
    imageUrl: eventImages.pottery,
  },
  {
    id: "sample-photography",
    title: "Street Photography Walk",
    category: Category.WORKSHOP,
    city: "Bengaluru",
    daysFromNow: 8,
    pricePaise: 40000,
    description: "Explore composition and lighting on a guided photo walk.",
    isActive: true,
    imageUrl: eventImages.photography,
  },
  {
    id: "sample-food-fair",
    title: "Weekend Food Fair",
    category: Category.FOOD,
    city: "Coimbatore",
    daysFromNow: 4,
    pricePaise: 0,
    description: "Browse local food stalls. Entry is free; food costs extra.",
    isActive: true,
    imageUrl: eventImages.food,
  },
  {
    id: "sample-food-night",
    title: "Street Food Night",
    category: Category.FOOD,
    city: "Chennai",
    daysFromNow: 6,
    pricePaise: 10000,
    description: "Discover local street food favourites and evening snacks.",
    isActive: true,
    imageUrl: eventImages.streetFood,
  },
  {
    id: "sample-football",
    title: "Community Football Morning",
    category: Category.SPORTS,
    city: "Bengaluru",
    daysFromNow: 5,
    pricePaise: 20000,
    description: "Join a friendly football session for all skill levels.",
    isActive: true,
    imageUrl: eventImages.sports,
  },
  {
    id: "sample-yoga",
    title: "Yoga in the Park",
    category: Category.SPORTS,
    city: "Coimbatore",
    daysFromNow: 1,
    pricePaise: 0,
    description: "A beginner-friendly outdoor yoga session. Bring a mat.",
    isActive: true,
    imageUrl: eventImages.yoga,
  },
  {
    id: "sample-storytelling",
    title: "Kids Storytelling Afternoon",
    category: Category.KIDS,
    city: "Chennai",
    daysFromNow: 9,
    pricePaise: 12000,
    description: "An afternoon of stories and imagination for children.",
    isActive: true,
    imageUrl: eventImages.kids,
  },
  {
    id: "sample-kids-art",
    title: "Kids Art Workshop",
    category: Category.KIDS,
    city: "Bengaluru",
    daysFromNow: 10,
    pricePaise: 30000,
    description: "Explore colours and painting. Art supplies included.",
    isActive: true,
    imageUrl: eventImages.art,
  },
  {
    id: "sample-inactive-concert",
    title: "Rooftop Music Night",
    category: Category.MUSIC,
    city: "Coimbatore",
    daysFromNow: 11,
    pricePaise: 60000,
    description: "A rooftop concert awaiting confirmation.",
    isActive: false,
    imageUrl: eventImages.rooftop,
  },
  {
    id: "sample-inactive-baking",
    title: "Baking Workshop",
    category: Category.WORKSHOP,
    city: "Chennai",
    daysFromNow: 14,
    pricePaise: 100000,
    description: "Learn the basics of baking bread and pastries.",
    isActive: false,
    imageUrl: eventImages.baking,
  },
  {
    id: "sample-past-food",
    title: "Local Food Festival",
    category: Category.FOOD,
    city: "Bengaluru",
    daysFromNow: -3,
    pricePaise: 15000,
    description: "A previous community food festival.",
    isActive: true,
    imageUrl: eventImages.food,
  },
  {
    id: "sample-past-sports",
    title: "Community Badminton Day",
    category: Category.SPORTS,
    city: "Chennai",
    daysFromNow: -7,
    pricePaise: 25000,
    description: "A previous friendly badminton gathering.",
    isActive: true,
    imageUrl: eventImages.badminton,
  },
];

function getEventDate(daysFromNow: number) {
  const date = new Date();

  date.setUTCDate(date.getUTCDate() + daysFromNow);

  // 13:00 UTC is 6:30 PM in India.
  date.setUTCHours(13, 0, 0, 0);

  return date;
}

async function main() {
  for (const sample of sampleEvents) {
    const { id, daysFromNow, ...fields } = sample;

    const data = {
      ...fields,
      startsAt: getEventDate(daysFromNow),
    };

    await prisma.event.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  console.log(`Seeded ${sampleEvents.length} sample events.`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
