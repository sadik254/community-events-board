import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  await connection();

  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "Please log in to continue." },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return Response.json(
      { user },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to read current user:", error);

    return Response.json(
      { error: "Unable to check your session. Please try again." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}