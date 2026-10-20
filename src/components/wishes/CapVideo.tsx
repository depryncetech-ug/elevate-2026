import { useEffect, useRef, useState } from "react";
import capSticker from "@/assets/grad-cap-sticker.png";

type Box = { x: number; y: number; w: number };

// Shared, lazily-loaded face detector (browser only).
let detectorPromise: Promise<any> | null = null;
function getDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );
      return vision.FaceDetector.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        },
        runningMode: "VIDEO",
      });
    })().catch((e) => {
      detectorPromise = null;
      throw e;
    });
  }
  return detectorPromise;
}

/** Video player that places a graduation-cap sticker on the speaker's head. */
export function CapVideo({ src, className }: { src: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let raf = 0;
    let stopped = false;
    let detector: any = null;
    let lastT = -1;

    const tick = () => {
      if (stopped) return;
      if (detector && video.readyState >= 2 && video.currentTime !== lastT && video.videoWidth) {
        lastT = video.currentTime;
        try {
          const res = detector.detectForVideo(video, performance.now());
          const d = res.detections?.[0]?.boundingBox;
          if (d) {
            // Map from video pixels to displayed element (object-cover aware).
            const vw = video.videoWidth, vh = video.videoHeight;
            const ew = video.clientWidth, eh = video.clientHeight;
            const cover = getComputedStyle(video).objectFit === "cover";
            const s = cover ? Math.max(ew / vw, eh / vh) : Math.min(ew / vw, eh / vh);
            const ox = (ew - vw * s) / 2, oy = (eh - vh * s) / 2;
            const next = { x: ox + (d.originX + d.width / 2) * s, y: oy + d.originY * s, w: d.width * s };
            setBox((p) => (p ? { x: p.x * 0.6 + next.x * 0.4, y: p.y * 0.6 + next.y * 0.4, w: p.w * 0.6 + next.w * 0.4 } : next));
          }
        } catch {
          /* ignore frame errors */
        }
      }
      raf = requestAnimationFrame(tick);
    };

    getDetector()
      .then((d) => {
        detector = d;
      })
      .catch(() => {});
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [src]);

  // Fallback: top-centre until a face is found.
  const w = box ? box.w * 1.5 : 0;
  const style = box
    ? { left: box.x - w / 2, top: box.y - w * 0.62, width: w }
    : { left: "50%", top: "4%", width: "22%", transform: "translateX(-50%)" };

  return (
    <div className="relative overflow-hidden rounded-xl">
      <video ref={videoRef} src={src} controls playsInline preload="metadata" crossOrigin="anonymous" className={className} />
      <img
        src={capSticker}
        alt=""
        aria-hidden
        width={816}
        height={816}
        className="pointer-events-none absolute -rotate-6 drop-shadow-lg transition-[left,top,width] duration-100 ease-out"
        style={style}
      />
    </div>
  );
}
