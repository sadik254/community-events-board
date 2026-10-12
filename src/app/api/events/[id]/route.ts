import { connection } from "next/server";

import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();

  const { id } = await params;

  try {
    const event = await db.event.findFirst({
      where: {
        id,
        isActive: true,
        startsAt: {
          gte: new Date(),
        },
      },
    });

    if (!event) {
      return Response.json(
        { error: "Event not found." },
        { status: 404 },
      );
    }

    return Response.json(
      { event },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load event:", error);

    return Response.json(
      { error: "Unable to load this event. Please try again." },
      { status: 500 },
    );
  }
}