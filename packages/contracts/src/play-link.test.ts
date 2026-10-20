import { describe, expect, it } from "vitest";
import { ConsentSchema, PlayLinkCreateSchema, PlayLinkResolvedSchema } from "./index";

const CHILD = "00000000-0000-4000-8000-00000000000c";

describe("play-link contract", () => {
  it("reads the two choices as off when left out of a create request", () => {
    expect(PlayLinkCreateSchema.parse({ child_id: CHILD })).toEqual({ child_id: CHILD, camera: false, microphone: false });
  });

  it.each([[{}], [{ child_id: "not-a-uuid" }], [{ child_id: CHILD, extra: 1 }], [{ child_id: CHILD, camera: "yes" }], [{ child_id: CHILD, microphone: null }]])(
    "rejects the create request %j",
    (body) => {
      expect(PlayLinkCreateSchema.safeParse(body).success).toBe(false);
    },
  );

  it("accepts a resolved link and rejects an unknown field or a missing choice", () => {
    const ok = { child_id: CHILD, consent: { camera: true, microphone: false } };
    expect(PlayLinkResolvedSchema.parse(ok)).toEqual(ok);
    expect(PlayLinkResolvedSchema.safeParse({ ...ok, extra: 1 }).success).toBe(false);
    expect(PlayLinkResolvedSchema.safeParse({ child_id: CHILD, consent: { camera: true } }).success).toBe(false);
    expect(ConsentSchema.safeParse({ camera: true, microphone: false, extra: 1 }).success).toBe(false);
  });
});
