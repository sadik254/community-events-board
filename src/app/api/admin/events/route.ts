import { connection } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Category } from "@/generated/prisma/client";

const newEventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.enum(Category),
  city: z.string().trim().min(1).max(100),
  startsAt: z.string().datetime(),
  pricePaise: z.number().int().min(0),
  description: z.string().trim().min(1).max(5000),
  imageUrl: z.url(),
});

const privateHeaders = {
  "Cache-Control": "no-store",
};

export async function GET() {
  await connection();

  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "Please log in." },
        { status: 401, headers: privateHeaders },
      );
    }

    if (user.role !== "ADMIN") {
      return Response.json(
        { error: "Admin access required." },
        { status: 403, headers: privateHeaders },
      );
    }

    const events = await db.event.findMany({
      orderBy: [{ startsAt: "desc" }, { id: "asc" }],
    });

    return Response.json(
      { events },
      { headers: privateHeaders },
    );
  } catch (error) {
    console.error("Admin event listing failed:", error);

    return Response.json(
      { error: "Unable to load events." },
      { status: 500, headers: privateHeaders },
    );
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  if (origin && origin !== new URL(request.url).origin) {
    return Response.json(
      { error: "Request origin is not allowed." },
      { status: 403, headers: privateHeaders },
    );
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "Please log in." },
        { status: 401, headers: privateHeaders },
      );
    }

    if (user.role !== "ADMIN") {
      return Response.json(
        { error: "Admin access required." },
        { status: 403, headers: privateHeaders },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Request body must be valid JSON." },
        { status: 400, headers: privateHeaders },
      );
    }

    const result = newEventSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error:
            result.error.issues[0]?.message ?? "Invalid event details.",
        },
        { status: 400, headers: privateHeaders },
      );
    }

    const event = await db.event.create({
      data: {
        ...result.data,
        startsAt: new Date(result.data.startsAt),
        isActive: true,
      },
    });

    return Response.json(
      { event },
      { status: 201, headers: privateHeaders },
    );
  } catch (error) {
    console.error("Admin event creation failed:", error);

    return Response.json(
      { error: "Unable to create event." },
      { status: 500, headers: privateHeaders },
    );
  }
}