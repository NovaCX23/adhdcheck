import { afterEach, describe, expect, it, vi } from "vitest";
import { handleDeleteChild } from "./handlers";

const PARENT = "00000000-0000-4000-8000-00000000000a";
const CHILD = "00000000-0000-4000-8000-0000000000ca";

function deps({ parentId = PARENT as string | null, deleted = true } = {}) {
  const deleteChild = vi.fn().mockResolvedValue(deleted);
  return { deps: { getParentId: async () => parentId, deleteChild }, deleteChild };
}

afterEach(() => vi.restoreAllMocks());

describe("DELETE /api/children/[id] (FR-41)", () => {
  it("deletes the parent's child and answers 204", async () => {
    const { deps: d, deleteChild } = deps();
    const res = await handleDeleteChild(CHILD, d);

    expect(res.status).toBe(204);
    expect(deleteChild).toHaveBeenCalledWith(CHILD);
  });

  it("answers 401 when no parent is logged in", async () => {
    const { deps: d, deleteChild } = deps({ parentId: null });
    const res = await handleDeleteChild(CHILD, d);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "not_logged_in" });
    expect(deleteChild).not.toHaveBeenCalled();
  });

  it("answers 404 when nothing was deleted (another parent's child, or already gone)", async () => {
    const { deps: d } = deps({ deleted: false });
    const res = await handleDeleteChild(CHILD, d);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "unknown_child" });
  });

  it("answers 404 for an id that is not a UUID, without touching the database", async () => {
    const { deps: d, deleteChild } = deps();
    const res = await handleDeleteChild("not-a-uuid", d);

    expect(res.status).toBe(404);
    expect(deleteChild).not.toHaveBeenCalled();
  });

  it("answers 503 when the database fails, without logging the id", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { deps: d, deleteChild } = deps();
    deleteChild.mockRejectedValue(new Error("connection refused"));
    const res = await handleDeleteChild(CHILD, d);

    expect(res.status).toBe(503);
    expect(JSON.stringify(error.mock.calls)).not.toContain(CHILD);
  });
});
