import { db } from "@/lib/db";
import {
  Category,
  type Prisma,
} from "@/generated/prisma/client";

function parsePositiveInteger(
  value: string | null,
  defaultValue: number,
): number | null {
  if (value === null) {
    return defaultValue;
  }

  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const number = Number(value);

  return Number.isSafeInteger(number) ? number : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const categoryValue = searchParams.get("category")?.trim();
  const city = searchParams.get("city")?.trim();
  const query = searchParams.get("q")?.trim();

  const page = parsePositiveInteger(
    searchParams.get("page"),
    1,
  );

  const pageSize = parsePositiveInteger(
    searchParams.get("pageSize"),
    6,
  );

  if (page === null || pageSize === null || pageSize > 50) {
    return Response.json(
      {
        error:
          "page must be a positive integer. pageSize must be between 1 and 50.",
      },
      { status: 400 },
    );
  }

  const skip = (page - 1) * pageSize;

  if (!Number.isSafeInteger(skip)) {
    return Response.json(
      { error: "The requested page is too large." },
      { status: 400 },
    );
  }

  let category: Category | undefined;

  if (categoryValue) {
    const match = Object.values(Category).find(
      (value) => value === categoryValue,
    );

    if (!match) {
      return Response.json(
        {
          error:
            "Invalid category. Use MUSIC, WORKSHOP, FOOD, SPORTS, or KIDS.",
        },
        { status: 400 },
      );
    }

    category = match;
  }

  const where: Prisma.EventWhereInput = {
    isActive: true,
    startsAt: {
      gte: new Date(),
    },
  };

  if (category) {
    where.category = category;
  }

  if (city) {
    where.city = city;
  }

  if (query) {
    where.OR = [
      { title: { contains: query } },
      { description: { contains: query } },
    ];
  }

  try {
    const [events, total] = await db.$transaction([
      db.event.findMany({
        where,
        orderBy: [
          { startsAt: "asc" },
          { id: "asc" },
        ],
        skip,
        take: pageSize,
      }),
      db.event.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return Response.json({
      events,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);

    return Response.json(
      { error: "Unable to load events. Please try again." },
      { status: 500 },
    );
  }
}