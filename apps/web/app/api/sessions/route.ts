// Game sessions from the child's device. Logic and tests live in handler.ts.
// TODO: switch to the Supabase store (service role) and check the QR session token (FR-01, NFR-13);
// until then every save fails with 503 and nothing is stored.
import { handleSessionPost } from "./handler";
import { unconfiguredStore } from "./store";

export async function POST(request: Request) {
  return handleSessionPost(request, { store: unconfiguredStore });
}
