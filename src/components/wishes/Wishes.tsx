import { useMemo, useState } from "react";
import { CapVideo } from "./CapVideo";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Smile, Trash2, Video } from "lucide-react";
import { toStorageRef, useFileUrl } from "@/lib/storage";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, type Wish } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { messageErrorMessage } from "@/lib/vote-errors";
import { DepartmentBadge, StudentAvatar } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const MAX_WISH_LENGTH = 500;
const MAX_VIDEO_MB = 100;
const wishSchema = z
  .string()
  .trim()
  .max(MAX_WISH_LENGTH, `Messages must be ${MAX_WISH_LENGTH} characters or fewer.`)
  .refine((v) => !/<[^>]*>/.test(v), "HTML is not allowed in messages.");

const EMOJIS = ["🎓", "🎉", "✨", "💛", "🚀", "👏", "🙌", "🌟", "❤️", "🥳", "💪", "🙏"];

export function WishCard({ wish, onDelete }: { wish: Wish; onDelete?: (() => void) | undefined }) {
  const name = wish.student?.full_name ?? "Elevate student";
  return (
    <article className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-soft">
      {wish.video_url && <WishVideo value={wish.video_url} />}
      {wish.caption && <h3 className="mt-3 font-display text-lg font-bold leading-snug">{wish.caption}</h3>}
      {wish.message && <p className="mt-1.5 flex-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-muted-foreground">{wish.message}</p>}
      <div className="mt-4 flex items-center gap-3 border-t pt-4">
        <StudentAvatar name={name} url={wish.student?.avatar_url} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <div className="flex flex-wrap items-center gap-2">
            <DepartmentBadge departmentId={wish.student?.department_id} />
            <time dateTime={wish.created_at} className="text-xs text-muted-foreground" title={formatDistanceToNow(new Date(wish.created_at), { addSuffix: true })}>
              {format(new Date(wish.created_at), "d MMM yyyy · h:mm a")}
            </time>
          </div>
        </div>
        {onDelete && (
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete your message">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </article>
  );
}

function WishVideo({ value }: { value: string }) {
  const url = useFileUrl(value);
  return url ? (
    <CapVideo src={url} className="aspect-video w-full rounded-xl bg-muted object-cover" />
  ) : (
    <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
  );
}

export function WishForm() {
  const { user, student } = useAuth();
  const { data: settings } = useQuery(settingsQuery);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const previewUrl = useMemo(() => (video ? URL.createObjectURL(video) : ""), [video]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center shadow-soft">
        <p className="font-semibold">Want to share your gratitude?</p>
        <p className="mt-1 text-sm text-muted-foreground">Sign in with your registered student email to post on the wall.</p>
        <Button asChild variant="navy" className="mt-4">
          <Link to="/login">Sign in to post</Link>
        </Button>
      </div>
    );
  }
  if (!student || !student.is_active) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
        Only registered Elevate Academy students can post gratitude clips.
      </div>
    );
  }
  if (settings && !settings.messages_enabled) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
        Posting gratitude clips is currently turned off.
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = wishSchema.safeParse(message);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid message");
      return;
    }
    if (!video) {
      setError("Please record or choose a video clip.");
      return;
    }
    if (!video.type.startsWith("video/")) return setError("Please choose a video file.");
    if (video.size > MAX_VIDEO_MB * 1024 * 1024) return setError(`Videos must be ${MAX_VIDEO_MB} MB or smaller.`);
    setError(null);
    setSubmitting(true);
    const ext = video.name.split(".").pop()?.toLowerCase() || "mp4";
    const path = `${student.id}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("gratitude-videos").upload(path, video, { contentType: video.type });
    if (up.error) {
      setSubmitting(false);
      toast.error("We couldn't upload your video. Please try again.");
      return;
    }
    const { error: err } = await supabase
      .from("graduation_messages")
      .insert({ student_id: student.id, message: parsed.data, video_url: toStorageRef("gratitude-videos", path) });
    setSubmitting(false);
    if (err) {
      toast.error(messageErrorMessage(err));
      return;
    }
    setMessage("");
    setVideo(null);
    toast.success("Your gratitude clip has been posted 🎉");
    queryClient.invalidateQueries({ queryKey: ["wishes"] });
  };

  const remaining = MAX_WISH_LENGTH - message.length;

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-5 shadow-soft" noValidate>
      <label htmlFor="wish" className="text-sm font-semibold">
        Share your gratitude
      </label>
      <p className="mt-1 text-xs text-muted-foreground">Record a short clip of yourself (or pick one), up to {MAX_VIDEO_MB} MB.</p>
      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-sm font-medium hover:bg-accent">
        <Video className="h-5 w-5" /> {video ? video.name : "Record or upload a video"}
        <input type="file" accept="video/*" capture="user" className="sr-only" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} />
      </label>
      {video && <div className="mt-3"><CapVideo src={previewUrl} className="aspect-video w-full rounded-xl bg-muted object-cover" /></div>}
      <Textarea
        id="wish"
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, MAX_WISH_LENGTH))}
        maxLength={MAX_WISH_LENGTH}
        rows={2}
        placeholder="Optional caption…"
        className="mt-2 resize-none"
        aria-invalid={!!error}
        aria-describedby="wish-help"
      />
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Add emoji">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <div className="grid grid-cols-6 gap-1">
                {EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className="rounded-md p-1.5 text-xl hover:bg-accent"
                    onClick={() => setMessage((m) => (m + em).slice(0, MAX_WISH_LENGTH))}
                    aria-label={`Insert ${em}`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <span id="wish-help" className={remaining < 40 ? "text-xs font-semibold text-destructive" : "text-xs text-muted-foreground"}>
            {message.length}/{MAX_WISH_LENGTH}
          </span>
        </div>
        <Button type="submit" variant="gold" disabled={submitting || !video}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post
        </Button>
      </div>
    </form>
  );
}
