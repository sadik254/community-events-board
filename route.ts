import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const privateHeaders = {
  "Cache-Control": "no-store",
};

export async function GET() {
  await connection();

  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "Please log in to view your feed." },
        { status: 401, headers: privateHeaders },
      );
    }

    const favourites = await db.favouriteCategory.findMany({
      where: {
        userId: user.id,
      },
      select: {
        category: true,
      },
    });

    const categories = favourites.map((item) => item.category);

    if (categories.length === 0) {
      return Response.json(
        {
          events: [],
          message: "Choose favourite categories to personalize your feed.",
        },
        { headers: privateHeaders },
      );
    }

    const events = await db.event.findMany({
      where: {
        isActive: true,
        startsAt: {
          gte: new Date(),
        },
        category: {
          in: categories,
        },
      },
      orderBy: [
        { startsAt: "asc" },
        { id: "asc" },
      ],
    });

    return Response.json(
      { events },
      { headers: privateHeaders },
    );
  } catch (error) {
    console.error("Failed to load event feed:", error);

    return Response.json(
      { error: "Unable to load your feed. Please try again." },
      { status: 500, headers: privateHeaders },
    );
  }
}