import { connection } from "next/server";
import AdminShell from "./components/admin-shell";

export default async function Home() {
  // Per-request nonce CSP requires dynamic HTML instead of a cached static shell.
  await connection();
  return <AdminShell />;
}
