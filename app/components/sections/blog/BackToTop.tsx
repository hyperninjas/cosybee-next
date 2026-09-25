"use client";

import { ArrowUp } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { Container } from "@/app/components/ui/Container";

/**
 * Floating "back to top" control, pinned bottom-left of the article's page
 * container (same width as ArticleDetail's), not the viewport edge — so on
 * wide screens it lines up with the sidebar instead of drifting into the
 * margin. The fixed strip spanning the viewport ignores pointer events; only
 * the button takes them. Hidden until the reader
 * has scrolled a viewport's worth, so it never sits over the title on load.
 * Smooth-scrolls unless the reader prefers reduced motion.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    function update() {
      setVisible(window.scrollY > window.innerHeight);
    }
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function scrollToTop() {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-6 z-40 transition-all duration-200 lg:bottom-10 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      // Out of the tab order and hidden from assistive tech while invisible.
      inert={!visible}
    >
      <Container size="blog" className="xl:max-w-300">
        {/* `primary` is HeroUI's accent variant (--accent / --accent-foreground). */}
        <Button
          isIconOnly
          variant="primary"
          aria-label="Back to top"
          onPress={scrollToTop}
          className={`h-12 w-12 rounded-full shadow-md ${visible ? "pointer-events-auto" : ""}`}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </Container>
    </div>
  );
}
