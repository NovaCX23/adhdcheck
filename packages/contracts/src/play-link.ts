import { z } from "zod";

// Play-link shapes crossing the browser/server boundary (FR-01, FR-32, FR-70). Strict: unknown fields are
// rejected. Both sides use these schemas, so the request and the response cannot drift apart.

// The parent's camera and microphone choices for one link; both off unless switched on.
export const ConsentSchema = z.strictObject({ camera: z.boolean(), microphone: z.boolean() });

// POST /api/play-links body. The two choices are false when left out.
export const PlayLinkCreateSchema = z.strictObject({
  child_id: z.guid(),
  camera: z.boolean().default(false),
  microphone: z.boolean().default(false),
});

// 201 answer of POST /api/play-links.
export const PlayLinkCreatedSchema = z.strictObject({ code: z.string().min(1), expires_at: z.string().min(1) });

// GET /api/play-links/<code> answer.
export const PlayLinkResolvedSchema = z.strictObject({ child_id: z.string().min(1), consent: ConsentSchema });

export type Consent = z.infer<typeof ConsentSchema>;
export type PlayLinkCreate = z.infer<typeof PlayLinkCreateSchema>;
export type PlayLinkCreated = z.infer<typeof PlayLinkCreatedSchema>;
export type PlayLinkResolved = z.infer<typeof PlayLinkResolvedSchema>;
