import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next.config redirects", () => {
  it("sends /dashboard to /parent, not permanently (Stripe return URLs, FR-45)", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({ source: "/dashboard", destination: "/parent", permanent: false });
  });
});
