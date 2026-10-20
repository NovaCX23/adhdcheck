import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabasePlayLinkStore } from "./supabase-store";

const PARENT = "00000000-0000-4000-8000-00000000000a";
const CHILD = "00000000-0000-4000-8000-0000000000ca";
const codeHash = "b".repeat(64);

function fakeClient(result: { data: unknown; error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as unknown as SupabaseClient, rpc };
}

describe("SupabasePlayLinkStore", () => {
  it("issues through issue_play_link with the parent, the child, the hash and the expiry", async () => {
    const { client, rpc } = fakeClient({ data: true, error: null });
    const expiresAt = new Date("2026-10-20T11:00:00Z");
    const issued = await createSupabasePlayLinkStore(client).issue({ parentId: PARENT, childId: CHILD, codeHash, expiresAt });

    expect(issued).toBe(true);
    expect(rpc).toHaveBeenCalledWith("issue_play_link", {
      p_parent_id: PARENT,
      p_child_id: CHILD,
      p_code_hash: codeHash,
      p_expires_at: "2026-10-20T11:00:00.000Z",
    });
  });

  it("answers false when the child is not the parent's", async () => {
    const { client } = fakeClient({ data: false, error: null });
    const expiresAt = new Date();
    expect(await createSupabasePlayLinkStore(client).issue({ parentId: PARENT, childId: CHILD, codeHash, expiresAt })).toBe(false);
  });

  it("resolves through resolve_play_link and answers the child_id or null", async () => {
    const found = fakeClient({ data: CHILD, error: null });
    expect(await createSupabasePlayLinkStore(found.client).resolve(codeHash)).toBe(CHILD);
    expect(found.rpc).toHaveBeenCalledWith("resolve_play_link", { p_code_hash: codeHash });

    const missing = fakeClient({ data: null, error: null });
    expect(await createSupabasePlayLinkStore(missing.client).resolve(codeHash)).toBeNull();
  });

  it("throws on a database error", async () => {
    const { client } = fakeClient({ data: null, error: { message: "connection refused" } });
    await expect(createSupabasePlayLinkStore(client).resolve(codeHash)).rejects.toThrow();
  });
});
