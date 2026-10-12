import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const statusSchema = z.object({
  isActive: z.boolean(),
});

const privateHeaders = {
  "Cache-Control": "no-store",
};

export async function PATCH(
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

    const result = statusSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: "isActive must be true or false." },
        { status: 400, headers: privateHeaders },
      );
    }

    const { id } = await params;

    const update = await db.event.updateMany({
      where: { id },
      data: { isActive: result.data.isActive },
    });

    if (update.count === 0) {
      return Response.json(
        { error: "Event not found." },
        { status: 404, headers: privateHeaders },
      );
    }

    const event = await db.event.findUnique({
      where: { id },
    });

    return Response.json(
      { event },
      { headers: privateHeaders },
    );
  } catch (error) {
    console.error("Admin event update failed:", error);

    return Response.json(
      { error: "Unable to update event." },
      { status: 500, headers: privateHeaders },
    );
  }
}