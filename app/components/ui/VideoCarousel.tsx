"use client";

import { useRef, useState } from "react";
import { Button } from "@heroui/react";
import {
  ChevronLeft,
  ChevronRight,
  PauseFill,
  PlayFill,
  VolumeFill,
  VolumeSlashFill,
} from "@gravity-ui/icons";

type VideoCarouselProps = {
  /** Public URLs of the videos, in slide order. */
  videos: string[];
  /** Slide shape — "portrait" (9:16 phone recordings) or "wide" (16:9). */
  aspect?: "portrait" | "wide";
  className?: string;
};

/**
 * Carousel of autoplaying, muted, looping videos with minimal controls —
 * play/pause + mute/unmute for the active slide. Arrows and dots only
 * render when there is more than one video, so a single-video carousel
 * looks like a plain inline video.
 */
export default function VideoCarousel({
  videos,
  aspect = "portrait",
  className = "",
}: VideoCarouselProps) {
  const aspectClass = aspect === "wide" ? "aspect-video" : "aspect-[9/16]";
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const goTo = (next: number) => {
    const target = (next + videos.length) % videos.length;
    if (target === index) return;
    videoRefs.current[index]?.pause();
    const video = videoRefs.current[target];
    if (video) {
      video.muted = isMuted;
      video.currentTime = 0;
      void video.play();
    }
    setIndex(target);
  };

  const togglePlay = () => {
    const video = videoRefs.current[index];
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRefs.current[index];
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div className={`group relative overflow-hidden rounded-2xl ${className}`}>
      <div
        className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {videos.map((src, i) => (
          <video
            key={src}
            ref={(el) => {
              videoRefs.current[i] = el;
            }}
            src={src}
            autoPlay={i === 0}
            muted
            loop={videos.length === 1}
            playsInline
            preload={i === 0 ? "auto" : "metadata"}
            onEnded={() => goTo(i + 1)}
            onPlay={() => {
              if (i === index) setIsPlaying(true);
            }}
            onPause={() => {
              if (i === index) setIsPlaying(false);
            }}
            className={`${aspectClass} w-full shrink-0 object-cover`}
          />
        ))}
      </div>

      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={isPlaying ? "Pause video" : "Play video"}
          onPress={togglePlay}
          className="rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
        >
          {isPlaying ? <PauseFill /> : <PlayFill />}
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          onPress={toggleMute}
          className="rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
        >
          {isMuted ? <VolumeSlashFill /> : <VolumeFill />}
        </Button>
      </div>

      {videos.length > 1 && (
        <>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Previous video"
            onPress={() => goTo(index - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-black/60"
          >
            <ChevronLeft />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Next video"
            onPress={() => goTo(index + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-black/60"
          >
            <ChevronRight />
          </Button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            {videos.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Go to video ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`size-2 rounded-full transition-colors ${
                  i === index ? "bg-white" : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
