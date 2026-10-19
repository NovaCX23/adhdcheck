// Game sessions from the child's device. Logic and tests live in handler.ts.
// TODO: once the QR session token is checked here (FR-01, NFR-13), switch to
// createSupabaseSessionStore(createAdminClient()). Until then every save fails with 503 and nothing
// is stored, so no one can post sessions for a child_id they do not own.
import { handleSessionPost } from "./handler";
import { unconfiguredStore } from "./store";

export async function POST(request: Request) {
  return handleSessionPost(request, { store: unconfiguredStore });
}
