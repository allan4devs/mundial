"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useInterval } from "@/lib/hooks/useInterval";
import useSWR from "swr";
import { fetcher } from "@/lib/helpers/fetcher";
import { useLanguage } from "@/lib/LanguageContext";
import { principalContent } from "@/lib/constants/principal";

// New: overlay prop to allow custom content (text or an image) and height prop
interface HeroCarouselProps {
  overlay?: ReactNode;
  height?: string; // Allow custom height (e.g., "50vh", "300px")
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ overlay, height = "50vh" }) => {
  const { lang } = useLanguage();
  const copy = principalContent[lang].hero;

  // --- Data Fetching ---
  const {
    data: carouselImages = [],
    error,
    isLoading,
  } = useSWR<string[]>("/api/images", fetcher);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Parallax references
  const parallaxImageRef = useRef<HTMLDivElement>(null);
  const parallaxOverlayRef = useRef<HTMLDivElement>(null);

  // --- Auto Advance ---
  useInterval(() => {
    if (carouselImages.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
    }
  }, 5000);

  // --- Parallax Effect for Images & Overlay ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const IMG_SPEED = -0.15; // Slower parallax for background images
    const OVERLAY_SPEED = -0.3; // Stronger effect for text or custom overlay

    const handleScroll = () => {
      const scrollY = window.scrollY;

      if (parallaxImageRef.current) {
        parallaxImageRef.current.style.transform = `translate3d(0, ${scrollY * IMG_SPEED}px, 0)`;
      }
      if (parallaxOverlayRef.current) {
        parallaxOverlayRef.current.style.transform = `translate3d(0, ${scrollY * OVERLAY_SPEED}px, 0)`;
      }
    };

    let ticking = false;
    const update = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (error) return <div className="text-red-500 p-8">{copy.errorLoadingImages}: {error.message}</div>;
  if (isLoading || carouselImages.length === 0)
    return <div className="h-[50vh] flex items-center justify-center">{copy.loadingImages}</div>;

  return (
    <section className="relative w-full" style={{ height }}>
      {/* Background Parallax Container */}
      <div ref={parallaxImageRef} className="absolute inset-0 will-change-transform z-0">
        {carouselImages.map((src, index) => (
          <Image
            key={index}
            src={src}
            alt={`Carousel image ${index + 1}`}
            fill
            className={`object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
            priority={index < 3}
            sizes="(max-width: 768px) 100vw, 1280px"
          />
        ))}
      </div>

      {/* Gradient overlays for readability */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="w-full h-1/2 absolute top-0 bg-gradient-to-b from-black/60 to-transparent"></div>
        <div className="w-full h-1/3 absolute bottom-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      {/* Foreground Overlay (Text or Image) */}
      <div
        ref={parallaxOverlayRef}
        className="relative w-full h-full flex flex-col justify-center items-center text-center z-20 px-4 md:px-8 will-change-transform"
      >
        {overlay ? (
          overlay
        ) : (
          <>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 text-white drop-shadow-2xl">
              {copy.title}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light text-white max-w-3xl drop-shadow-xl">
              {copy.subtitle}
            </p>
          </>
        )}

        {/* Scroll Indicator */}
        <a
          href="#calendar"
          className="absolute bottom-12 animate-bounce p-3 rounded-full bg-white/20 hover:bg-white/40 transition"
          aria-label={copy.scrollToMainAria}
        >
          <ChevronDown size={32} className="text-white" />
        </a>
      </div>
    </section>
  );
};
