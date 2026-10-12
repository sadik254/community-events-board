import "server-only";

import { errors } from "jose";
import { cookies, headers } from "next/headers";

import { db } from "@/lib/db";
import { SESSION_COOKIE, verifyToken } from "@/lib/token";

export async function getCurrentUser() {
  const requestHeaders = await headers();
  const authorization = requestHeaders.get("authorization");

  let token: string | undefined;

  if (authorization !== null) {
    const match = /^Bearer\s+(\S+)$/i.exec(authorization);

    if (!match) {
      return null;
    }

    token = match[1];
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE)?.value;
  }

  if (!token) {
    return null;
  }

  let userId: string;

  try {
    userId = await verifyToken(token);
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      return null;
    }

    throw error;
  }

  return db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });
}