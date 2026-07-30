import "@fontsource/cinzel/500.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";

import Reveal from "reveal.js";
import Notes from "reveal.js/plugin/notes";
import gsap from "gsap";

import "reveal.js/reveal.css";
import "./styles.css";

const deck = new Reveal({
  width: 1920,
  height: 1080,
  margin: 0,
  minScale: 0.2,
  maxScale: 2,
  hash: true,
  history: true,
  controls: false,
  progress: true,
  slideNumber: "c/t",
  showSlideNumber: "speaker",
  center: false,
  transition: "fade",
  transitionSpeed: "fast",
  backgroundTransition: "fade",
  pdfSeparateFragments: false,
  plugins: [Notes]
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isPrint = new URLSearchParams(window.location.search).has("print-pdf");

function animateSlide(slide) {
  if (!slide || prefersReducedMotion || isPrint) return;

  const items = slide.querySelectorAll("[data-animate]");
  gsap.killTweensOf(items);
  gsap.fromTo(
    items,
    { autoAlpha: 0, y: 28 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.72,
      stagger: 0.08,
      ease: "power3.out",
      clearProps: "transform"
    }
  );

  const hero = slide.querySelector(".hero-art");
  if (hero) {
    gsap.killTweensOf(hero);
    gsap.fromTo(
      hero,
      { scale: 1.04, xPercent: 1.2 },
      { scale: 1, xPercent: 0, duration: 2.2, ease: "power2.out" }
    );
  }

  const route = slide.querySelector(".journey-line__track");
  if (route) {
    gsap.killTweensOf(route);
    gsap.fromTo(route, { scaleX: 0 }, { scaleX: 1, duration: 1.35, delay: 0.42, ease: "power2.inOut" });
  }

  const mapPaths = slide.querySelectorAll(".operator-map__path");
  if (mapPaths.length) {
    gsap.killTweensOf(mapPaths);
    gsap.fromTo(
      mapPaths,
      { scaleX: 0, opacity: 0 },
      {
        scaleX: 1,
        opacity: 1,
        duration: 0.95,
        stagger: 0.15,
        delay: 0.35,
        ease: "power2.inOut"
      }
    );
  }
}

deck.on("ready", (event) => {
  document.documentElement.classList.add("deck-ready");
  animateSlide(event.currentSlide);
});

deck.on("slidechanged", (event) => {
  animateSlide(event.currentSlide);
});

deck.initialize();
