import { db } from "@/lib/db";

export async function GET() {
  try {
    const events = await db.event.findMany({
      where: {
        isActive: true,
        startsAt: {
          gte: new Date(),
        },
      },
      orderBy: [
        { startsAt: "asc" },
        { id: "asc" },
      ],
    });

    return Response.json({ events });
  } catch (error) {
    console.error("Failed to fetch events:", error);

    return Response.json(
      { error: "Unable to load events. Please try again." },
      { status: 500 },
    );
  }
}