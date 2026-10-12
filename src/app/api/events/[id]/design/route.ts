import { connection } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CardTheme } from "@/generated/prisma/client";

const allowedStickers = ["🎵", "⭐", "🎈", "🍕", "⚽"] as const;

const designSchema = z.object({
  theme: z.enum(CardTheme),
  stickers: z
    .array(z.enum(allowedStickers))
    .max(3, "Choose up to three stickers.")
    .refine(
      (stickers) => new Set(stickers).size === stickers.length,
      "You can only add a sticker once.",
    ),
});

const privateHeaders = {
  "Cache-Control": "no-store",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();

  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "Please log in to load your card design." },
        { status: 401, headers: privateHeaders },
      );
    }

    const { id } = await params;

    const design = await db.cardDesign.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: id,
        },
      },
      select: {
        theme: true,
        stickers: true,
      },
    });

    return Response.json(
      {
        theme: design?.theme ?? "SUNSET",
        stickers: design?.stickers ?? [],
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    console.error("Failed to load card design:", error);

    return Response.json(
      { error: "Unable to load your design. Please try again." },
      { status: 500, headers: privateHeaders },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
        { error: "Please log in to save your card design." },
        { status: 401, headers: privateHeaders },
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

    const result = designSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error:
            result.error.issues[0]?.message ?? "Invalid card design.",
        },
        { status: 400, headers: privateHeaders },
      );
    }

    const { id } = await params;

    const event = await db.event.findFirst({
      where: {
        id,
        isActive: true,
        startsAt: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (!event) {
      return Response.json(
        { error: "That upcoming event is not available." },
        { status: 404, headers: privateHeaders },
      );
    }

    const design = await db.cardDesign.upsert({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: id,
        },
      },
      update: {
        theme: result.data.theme,
        stickers: result.data.stickers,
      },
      create: {
        userId: user.id,
        eventId: id,
        theme: result.data.theme,
        stickers: result.data.stickers,
      },
      select: {
        theme: true,
        stickers: true,
      },
    });

    return Response.json(design, { headers: privateHeaders });
  } catch (error) {
    console.error("Failed to save card design:", error);

    return Response.json(
      { error: "Unable to save your design. Please try again." },
      { status: 500, headers: privateHeaders },
    );
  }
}