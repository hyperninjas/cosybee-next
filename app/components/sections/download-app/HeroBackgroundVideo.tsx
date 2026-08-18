"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import {
  PauseFill,
  PlayFill,
  VolumeFill,
  VolumeSlashFill,
} from "@gravity-ui/icons";

/**
 * Background video for the hero, mounted only at md+ (tablet and up). A media
 * query in JS — not CSS hiding — because a `display:none` video with autoplay
 * still downloads; small devices should never fetch the ~13MB file. Until it
 * mounts (and below md, and under prefers-reduced-motion) the hero shows the
 * background photo underneath.
 *
 * Plays through exactly once: it pauses whenever the hero scrolls out of view
 * (and resumes on the way back, unless the viewer pressed pause), and on
 * `ended` it fades out to reveal the photo again rather than looping. The play
 * button restarts it from the top.
 *
 * Renders two sibling layers: the video at -z-10 (above the -z-20 photo,
 * below the gradient the parent places after this component) and a
 * play/mute control cluster at the hero's top-right corner on positive z,
 * so it stays clickable above the content rail.
 */
export default function HeroBackgroundVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // The viewer's intent, kept out of state so the observer never restarts a
  // video they deliberately paused.
  const wantsPlaybackRef = useRef(true);
  const [show, setShow] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setShow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Pause offscreen so a hero scrolled past isn't decoding frames nobody sees.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (wantsPlaybackRef.current && !video.ended) void video.play();
        } else if (!video.paused) {
          video.pause();
        }
      },
      // Any sliver of the hero counts — the element is usually taller than the
      // viewport, so a ratio-based threshold would never fire.
      { threshold: 0 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [show]);

  if (!show) return null;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      if (video.ended) video.currentTime = 0;
      wantsPlaybackRef.current = true;
      void video.play();
    } else {
      wantsPlaybackRef.current = false;
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden
        onPlay={() => {
          setIsPlaying(true);
          setHasEnded(false);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          wantsPlaybackRef.current = false;
          setHasEnded(true);
        }}
        className={`absolute inset-0 -z-10 h-full w-full object-cover object-center transition-opacity duration-700 motion-reduce:hidden ${
          hasEnded ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* controls — same look as VideoCarousel's; hidden with the video
          under prefers-reduced-motion */}
      <div className="absolute right-4 top-4 z-10 flex gap-2 sm:right-6 sm:top-6 motion-reduce:hidden">
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
    </>
  );
}
