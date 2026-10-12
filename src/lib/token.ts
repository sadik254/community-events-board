import "server-only";

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "community_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24;

const issuer = "community-events-board";
const audience = "community-events-api";

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 64) {
    throw new Error(
      "JWT_SECRET must contain at least 64 characters.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
    issuer,
    audience,
    requiredClaims: ["sub", "iat", "exp"],
  });

  if (!payload.sub) {
    throw new Error("Token is missing a user ID.");
  }

  return payload.sub;
}