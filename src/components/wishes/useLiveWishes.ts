import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Wish } from "@/lib/data";

/** Announce only posts that have been read back through the public, approved query. */
export function useLiveWishes(wishes: Wish[] | undefined, channelName: string) {
  const queryClient = useQueryClient();
  const previousIds = useRef<Set<string> | null>(null);
  const [newPosts, setNewPosts] = useState<Wish[]>([]);

  useEffect(() => {
    const channel = supabase.channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "graduation_messages" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["wishes"] });
      })
      .subscribe();
    // Also refresh when realtime is reconnecting or not available.
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void queryClient.invalidateQueries({ queryKey: ["wishes"] });
      }
    }, 15_000);
    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [channelName, queryClient]);

  useEffect(() => {
    if (!wishes) return;
    if (previousIds.current) {
      const added = wishes.filter((wish) => !previousIds.current?.has(wish.id));
      if (added.length) setNewPosts(added);
    }
    previousIds.current = new Set(wishes.map((wish) => wish.id));
  }, [wishes]);

  useEffect(() => {
    if (!newPosts.length) return;
    const timeout = window.setTimeout(() => setNewPosts([]), 8_000);
    return () => window.clearTimeout(timeout);
  }, [newPosts]);

  return newPosts;
}