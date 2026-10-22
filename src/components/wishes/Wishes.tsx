import { useEffect, useMemo, useState } from "react";
import { CapVideo } from "./CapVideo";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquareHeart, Pause, Play, Send, Smile, Sparkles, Trash2, Video } from "lucide-react";
import { toStorageRef, useFileUrl } from "@/lib/storage";
import { toast } from "sonner";
import { gratitudeSchema, MAX_WISH_LENGTH } from "@/lib/gratitude";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, type Wish } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { messageErrorMessage } from "@/lib/vote-errors";
import { DepartmentBadge, StudentAvatar } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export { MAX_WISH_LENGTH } from "@/lib/gratitude";
const MAX_VIDEO_MB = 100;

const EMOJIS = ["🎓", "🎉", "✨", "💛", "🚀", "👏", "🙌", "🌟", "❤️", "🥳", "💪", "🙏"];

export function NewWishNotice({ posts }: { posts: Wish[] }) {
  const latest = posts[0];
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {latest && (
        <div key={latest.id} className="gratitude-notice mb-5 flex items-center gap-3 rounded-xl border border-primary/30 bg-accent px-4 py-3 text-sm">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <p className="min-w-0 break-words font-medium">
            {posts.length > 1 ? `${posts.length} new gratitude posts just arrived` : `${latest.student?.full_name ?? "Someone"} just ${latest.video_url ? "shared a gratitude video" : "sent a message"}`}
          </p>
        </div>
      )}
    </div>
  );
}

export function WishCard({ wish, onDelete, isNew = false }: { wish: Wish; onDelete?: (() => void) | undefined; isNew?: boolean }) {
  const name = wish.student?.full_name ?? "Elevate student";
  return (
    <article className={`flex h-full flex-col rounded-2xl border bg-card p-5 shadow-soft ${isNew ? "gratitude-arrival" : ""}`}>
      {isNew && <span className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" aria-hidden /> Just posted</span>}
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
    <CapVideo src={url} />
  ) : (
    <div className="aspect-[1080/1350] w-full animate-pulse rounded-xl bg-muted" />
  );
}

export function GratitudeMessages({ wishes, newPosts = [], onDelete }: { wishes: Wish[]; newPosts?: Wish[]; onDelete?: (wish: Wish) => (() => void) | undefined }) {
  const [paused, setPaused] = useState(false);
  const messages = wishes.filter((wish) => !wish.video_url);
  if (!messages.length) return null;
  return (
    <section className="mb-8 min-w-0" aria-label="Gratitude messages">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-bold"><MessageSquareHeart className="h-5 w-5 text-primary" /> Messages of gratitude</h3>
        <Button variant="outline" size="icon" onClick={() => setPaused(!paused)} aria-label={paused ? "Play scrolling messages" : "Pause scrolling messages"} title={paused ? "Play scrolling messages" : "Pause scrolling messages"}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</Button>
      </div>
      <div className="gratitude-marquee overflow-hidden py-2" data-paused={paused}>
        <div className="gratitude-track flex w-max">
          {[0, 1].map((copy) => <div key={copy} aria-hidden={copy === 1 ? true : undefined} className="flex shrink-0 gap-5 pr-5">
            {messages.map((wish) => <div key={wish.id} className="gratitude-message-item"><WishCard wish={wish} isNew={newPosts.some((post) => post.id === wish.id)} onDelete={copy === 0 ? onDelete?.(wish) : undefined} /></div>)}
          </div>)}
        </div>
      </div>
    </section>
  );
}

export function WishForm() {
  const { user } = useAuth();
  const { data: settings } = useQuery(settingsQuery);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [caption, setCaption] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [kind, setKind] = useState<"video" | "message">("message");
  const previewUrl = useMemo(() => (video ? URL.createObjectURL(video) : ""), [video]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center shadow-soft">
        <p className="font-semibold">Want to share your gratitude?</p>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to share a message or video.</p>
        <Button asChild variant="navy" className="mt-4">
          <Link to="/login">Sign in to post</Link>
        </Button>
      </div>
    );
  }
  if (settings && !settings.messages_enabled) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
        Posting gratitude is currently turned off.
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = gratitudeSchema.safeParse({ kind, message, caption, hasVideo: Boolean(video) });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid message");
      return;
    }
    const clip = kind === "video" ? video : null;
    const ext = clip?.name.split(".").pop()?.toLowerCase() || "mp4";
    if (clip) {
      const looksVideo = clip.type.startsWith("video/") || ["mp4", "mov", "webm", "m4v", "3gp", "mkv", "avi"].includes(ext);
      if (!looksVideo) return setError("Please choose a video file.");
      if (clip.size > MAX_VIDEO_MB * 1024 * 1024) return setError(`Videos must be ${MAX_VIDEO_MB} MB or smaller.`);
    }
    setError(null);
    setSubmitting(true);
    const { data: myId, error: idErr } = await supabase.rpc("ensure_my_student");
    if (idErr || !myId) {
      setSubmitting(false);
      toast.error("We couldn't prepare your account. Please sign out and in again.");
      return;
    }
    const studentId = myId as string;
    let videoRef: string | null = null;
    if (clip) {
      const path = `${studentId}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("gratitude-videos").upload(path, clip, { contentType: clip.type || `video/${ext === "mov" ? "quicktime" : ext}` });
      if (up.error) {
        setSubmitting(false);
        toast.error(`We couldn't upload your video: ${up.error.message}`);
        return;
      }
      videoRef = toStorageRef("gratitude-videos", path);
    }
    const { error: err } = await supabase
      .from("graduation_messages")
      .insert({ student_id: studentId, caption: kind === "video" ? parsed.data.caption : null, message: parsed.data.message, video_url: videoRef });
    setSubmitting(false);
    if (err) {
      toast.error(messageErrorMessage(err));
      return;
    }
    setMessage("");
    setCaption("");
    setVideo(null);
    toast.success("Your gratitude has been posted 🎉");
    queryClient.invalidateQueries({ queryKey: ["wishes"] });
  };

  const remaining = MAX_WISH_LENGTH - message.length;

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-5 shadow-soft" noValidate>
      <p className="text-sm font-semibold">Share your gratitude</p>
      <Tabs value={kind} onValueChange={(value) => { setKind(value === "video" ? "video" : "message"); setError(null); }} className="mt-3">
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="message" disabled={submitting}><MessageSquareHeart className="mr-2 h-4 w-4" /> Message</TabsTrigger><TabsTrigger value="video" disabled={submitting}><Video className="mr-2 h-4 w-4" /> Video</TabsTrigger></TabsList>
      </Tabs>
      {kind === "video" && <>
      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-sm font-medium hover:bg-accent">
        <Video className="h-5 w-5" /> {video ? video.name : "Record or upload a video"}
        <input type="file" accept="video/*" className="sr-only" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} />
      </label>
      {video && <div className="mt-3"><CapVideo src={previewUrl} /></div>}
      <Input
        value={caption}
        onChange={(e) => setCaption(e.target.value.slice(0, 120))}
        placeholder="Caption (e.g. Thank you, Elevate!)"
        className="mt-3"
        aria-label="Caption"
      />
      </>}
      <Textarea
        id="wish"
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, MAX_WISH_LENGTH))}
        maxLength={MAX_WISH_LENGTH}
        rows={3}
        placeholder="Your message of gratitude…"
        className="mt-2 resize-none"
        aria-label="Message"
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
        <Button type="submit" variant="gold" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post
        </Button>
      </div>
    </form>
  );
}
