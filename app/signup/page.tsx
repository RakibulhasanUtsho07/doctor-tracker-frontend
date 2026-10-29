import { connection } from "next/server";
import SignupClient from "./signup-client";

export default async function SignupPage() {
  // The security proxy generates a fresh CSP nonce per request. Keep the
  // signup route request-rendered so HTML/script nonces are never cached stale.
  await connection();
  return <SignupClient />;
}
