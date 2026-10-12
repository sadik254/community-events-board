import { connection } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Category } from "@/generated/prisma/client";

const favouritesSchema = z.object({
  categories: z
    .array(z.enum(Category))
    .max(5, "Select no more than five categories.")
    .refine(
      (categories) => new Set(categories).size === categories.length,
      "Each category can only be selected once.",
    ),
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
        { error: "Please log in to continue." },
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
      orderBy: {
        category: "asc",
      },
    });

    return Response.json(
      {
        categories: favourites.map((item) => item.category),
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    console.error("Failed to load favourites:", error);

    return Response.json(
      { error: "Unable to load your categories. Please try again." },
      { status: 500, headers: privateHeaders },
    );
  }
}

export async function PUT(request: Request) {
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
        { error: "Please log in to continue." },
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

    const result = favouritesSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error:
            result.error.issues[0]?.message ??
            "Invalid category selection.",
        },
        { status: 400, headers: privateHeaders },
      );
    }

    const { categories } = result.data;

    await db.$transaction(async (transaction) => {
      await transaction.favouriteCategory.deleteMany({
        where: {
          userId: user.id,
        },
      });

      if (categories.length > 0) {
        await transaction.favouriteCategory.createMany({
          data: categories.map((category) => ({
            userId: user.id,
            category,
          })),
        });
      }
    });

    return Response.json(
      { categories },
      { headers: privateHeaders },
    );
  } catch (error) {
    console.error("Failed to save favourites:", error);

    return Response.json(
      { error: "Unable to save your categories. Please try again." },
      { status: 500, headers: privateHeaders },
    );
  }
}