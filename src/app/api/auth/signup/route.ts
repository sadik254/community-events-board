import { hash } from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email("Enter a valid email address.")),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters.")
    .refine(
      (password) => new TextEncoder().encode(password).length <= 72,
      "Password must not exceed 72 bytes.",
    ),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const result = signupSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        error:
          result.error.issues[0]?.message ?? "Invalid signup details.",
      },
      { status: 400 },
    );
  }

  const { email, password } = result.data;

  try {
    const passwordHash = await hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return Response.json(
      {
        message: "Account created successfully.",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    console.error("Signup failed:", error);

    return Response.json(
      { error: "Unable to create your account. Please try again." },
      { status: 500 },
    );
  }
}