import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareHeart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { wishesQuery } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { GratitudeMessages, NewWishNotice, WishCard, WishForm } from "@/components/wishes/Wishes";
import { useLiveWishes } from "@/components/wishes/useLiveWishes";
import { CardGridSkeleton, EmptyState, PageHeader } from "@/components/common/primitives";

export const Route = createFileRoute("/wishes")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Wall of Gratitude — Elevate Academy Class of Dec 2026" },
      { name: "description", content: "Graduation wishes, memories and congratulations from Elevate Academy students." },
      { property: "og:title", content: "Wall of Gratitude — Elevate Academy" },
      { property: "og:description", content: "Messages and video thank-yous from the Class of 2026." },
    ],
  }),
  component: WishesPage,
});

function WishesPage() {
  const { data, isLoading } = useQuery(wishesQuery(100));
  const { student } = useAuth();
  const queryClient = useQueryClient();
  const newPosts = useLiveWishes(data, "wishes-wall");

  const remove = async (id: string) => {
    const { error } = await supabase.from("graduation_messages").delete().eq("id", id);
    if (error) toast.error("We couldn't delete your message. Please try again.");
    else {
      toast.success("Message deleted");
      queryClient.invalidateQueries({ queryKey: ["wishes"] });
    }
  };

  return (
    <>
      <PageHeader eyebrow="Graduation Wall" title="Wall of Gratitude" description="Messages and video thank-yous from the Class of 2026." />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <WishForm />
        </div>
        <div className="min-w-0">
          <NewWishNotice posts={newPosts} />
          <GratitudeMessages wishes={data ?? []} newPosts={newPosts} onDelete={(wish) => student && wish.student_id === student.id ? () => remove(wish.id) : undefined} />
          {isLoading ? (
            <CardGridSkeleton count={4} />
          ) : data?.length ? (
            <div className="columns-1 gap-5 sm:columns-2 [&>*]:mb-5 [&>*]:break-inside-avoid">
              {data.filter((w) => w.video_url).map((w) => (
                <WishCard key={w.id} wish={w} isNew={newPosts.some((post) => post.id === w.id)} onDelete={student && w.student_id === student.id ? () => remove(w.id) : undefined} />
              ))}
            </div>
          ) : (
            <EmptyState icon={MessageSquareHeart} title="No gratitude posts yet. Be the first to share one!" />
          )}
        </div>
      </div>
    </>
  );
}
