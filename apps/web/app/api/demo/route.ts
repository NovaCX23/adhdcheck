// Is the logged-in parent the demo account? (FR-56). Logic and tests in handlers.ts.
import { handleDemoStatus } from "./handlers";
import { currentUser } from "./user";

export async function GET() {
  return handleDemoStatus({ getUser: currentUser, demoEmail: process.env.DEMO_PARENT_EMAIL });
}
