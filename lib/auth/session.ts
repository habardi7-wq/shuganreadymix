import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/enums";

export const SESSION_COOKIE = "kp_session";

const secretValue = process.env.AUTH_SECRET;
if (!secretValue && process.env.NODE_ENV === "production") {
  throw new Error("AUTH_SECRET must be set in production");
}
const secret = new TextEncoder().encode(secretValue ?? "dev-only-insecure-secret-change-me");

export interface SessionPayload {
  sub: string;
  role: Role;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return { sub: payload.sub, role: payload.role as Role };
  } catch {
    return null;
  }
}
