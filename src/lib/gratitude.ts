import { z } from "zod";

export const MAX_WISH_LENGTH = 500;
export const gratitudeSchema = z.object({
  kind: z.enum(["message", "video"]),
  message: z.string().trim().min(1, "Please add your message of gratitude.").max(MAX_WISH_LENGTH).refine((value) => !/<[^>]*>/.test(value), "HTML is not allowed in messages."),
  caption: z.string().trim().max(120).refine((value) => !/<[^>]*>/.test(value), "HTML is not allowed in captions."),
  hasVideo: z.boolean(),
}).superRefine((value, context) => {
  if (value.kind !== "video") return;
  if (!value.hasVideo) context.addIssue({ code: "custom", path: ["hasVideo"], message: "Please record or choose a video clip." });
  if (!value.caption) context.addIssue({ code: "custom", path: ["caption"], message: "Please add a caption for your clip." });
});