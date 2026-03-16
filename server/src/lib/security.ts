import crypto from "node:crypto";

const ENCRYPTION_KEY = (process.env.VISITOR_LOG_KEY ?? "0123456789abcdef0123456789abcdef").slice(0, 32);
const IV_LENGTH = 16;

export function encryptVisitorLog(payload: object): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}
