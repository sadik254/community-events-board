import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  createToken,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
} from "@/lib/token";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email("Enter a valid email address.")),

  password: z
    .string()
    .min(1, "Enter your password.")
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
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error:
          result.error.issues[0]?.message ?? "Invalid login details.",
      },
      { status: 400 },
    );
  }

  const { email, password } = result.data;

  try {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const passwordMatches = await compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = await createToken(user.id);

    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    response.headers.set("Cache-Control", "no-store");

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      { error: "Unable to log in. Please try again." },
      { status: 500 },
    );
  }
}