import { describe, expect, it } from "vitest";
import { gratitudeSchema } from "./gratitude";

describe("Gratitude post types", () => {
  it("allows a message without a video or caption", () => {
    expect(gratitudeSchema.safeParse({ kind: "message", message: "Thank you to our teachers!", caption: "", hasVideo: false }).success).toBe(true);
  });
  it("allows video posts with caption and message", () => {
    expect(gratitudeSchema.safeParse({ kind: "video", message: "Thank you!", caption: "Graduation memories", hasVideo: true }).success).toBe(true);
  });
  it("requires an attached video for video posts", () => {
    expect(gratitudeSchema.safeParse({ kind: "video", message: "Thank you!", caption: "Memories", hasVideo: false }).success).toBe(false);
  });
});