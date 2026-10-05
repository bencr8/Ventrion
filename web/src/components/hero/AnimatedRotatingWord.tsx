"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedRotatingWordProps {
  words?: string[];
  intervalMs?: number;
  className?: string;
}

const DEFAULT_WORDS = ["Companies.", "Startups.", "Creators.", "Webshops.", "Ventures."];

export function AnimatedRotatingWord({
  words = DEFAULT_WORDS,
  intervalMs = 5200,
  className = "",
}: AnimatedRotatingWordProps) {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const measureRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({});
  const prevWidthRef = useRef<number>(0);
  const shrinkTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentWord = words[index];

  // Rotate through words: starts early (~1s after load begins), then continues at normal interval
  useEffect(() => {
    // First rotation begins early (~1.0s) so the user doesn't have to wait 5+ seconds
    const firstTimer = setTimeout(() => {
      setIndex(1);
    }, 1000);

    let intervalTimer: NodeJS.Timeout | null = null;
    const intervalStartTimer = setTimeout(() => {
      intervalTimer = setInterval(() => {
        setIndex((prev) => (prev + 1) % words.length);
      }, intervalMs);
    }, 1000);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(intervalStartTimer);
      if (intervalTimer) clearInterval(intervalTimer);
    };
  }, [words.length, intervalMs]);

  // Update container width smoothly:
  // When switching from a wide word to a narrower word, DO NOT shrink immediately!
  // Wait until the wide word has completely finished falling out (~950ms), then smoothly ease to new width.
  // When switching to a wider word, expand immediately.
  useEffect(() => {
    const el = measureRefs.current[currentWord];
    if (!el) return;
    const newWidth = el.offsetWidth;
    const oldWidth = prevWidthRef.current;

    if (shrinkTimerRef.current) {
      clearTimeout(shrinkTimerRef.current);
      shrinkTimerRef.current = null;
    }

    if (oldWidth === 0) {
      // First mount
      setContainerWidth(newWidth);
      prevWidthRef.current = newWidth;
    } else if (newWidth >= oldWidth) {
      // Wider word: expand immediately so incoming letters have full space
      setContainerWidth(newWidth);
      prevWidthRef.current = newWidth;
    } else {
      // Narrower word (e.g. "Companies." -> "Startups."):
      // Hold width at oldWidth so the wide letters on the right are never cut off during descent!
      setContainerWidth(oldWidth);
      shrinkTimerRef.current = setTimeout(() => {
        setContainerWidth(newWidth);
        prevWidthRef.current = newWidth;
      }, 950);
    }

    return () => {
      if (shrinkTimerRef.current) {
        clearTimeout(shrinkTimerRef.current);
      }
    };
  }, [currentWord]);

  // Split word into characters (including trailing period '.')
  const chars = Array.from(currentWord);
  const N = chars.length;

  return (
    <span
      ref={containerRef}
      className={`inline-flex items-baseline relative select-none will-change-transform ${className}`}
      style={{
        width: containerWidth ? `${containerWidth}px` : "auto",
        transition: "width 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
        // -250% horizontal clearance ensures letters on the right or left are NEVER sliced horizontally!
        // 0% bottom boundary strictly cuts off letters before they cross onto the line below ("Stream Dividends.")
        clipPath: "inset(-45% -250% 0% -250%)",
        verticalAlign: "baseline",
        lineHeight: "inherit",
      }}
    >
      {/* Hidden off-screen measurement spans to get exact natural font kerning & widths for each word */}
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 opacity-0 pointer-events-none whitespace-pre select-none -z-50"
      >
        {words.map((w) => (
          <span
            key={w}
            ref={(el) => {
              measureRefs.current[w] = el;
            }}
            className="inline-block whitespace-pre font-bold"
          >
            {w}
          </span>
        ))}
      </span>

      {/* AnimatePresence for seamless, overlapping letter transitions */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={currentWord}
          className="inline-flex items-baseline whitespace-pre will-change-transform"
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            lineHeight: "inherit",
          }}
          // Subtle breathing warm glow while displayed and staying orange
          animate={{
            filter: [
              "drop-shadow(0 0 0px rgba(255,92,24,0))",
              "drop-shadow(0 2px 10px rgba(255,92,24,0.28))",
              "drop-shadow(0 0 0px rgba(255,92,24,0))",
            ],
          }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {chars.map((char, i) => {
            // "es soll von LINKS anfangen, zu fallen":
            // Left-to-right cascade index: first letter (i = 0) starts first, period (i = N - 1) falls last!
            const leftIndex = i;

            // Distance from center calculation: 0 = exact middle letter, 1 = ends (first letter or period)
            const center = (N - 1) / 2;
            const distFromCenter = center > 0 ? Math.abs(i - center) / center : 0;

            // Duration:
            // "langsamer anfangen, langsamer fallen"
            // - Middle letters plunge fastest (~0.80s)
            // - Outer letters fall slower (~1.10s)
            const isOuter = i === 0 || i === N - 1;
            const exitDuration = isOuter ? 1.10 : 0.80 + distFromCenter * 0.22;
            const enterDuration = isOuter ? 1.05 : 0.82 + distFromCenter * 0.20;

            // Stagger Delay starting from the LEFT:
            // First letter starts at 0.0s, each subsequent letter delayed by 0.082s:
            const exitDelay = leftIndex * 0.082;

            // Incoming letters arrive cascading from the LEFT:
            const enterDelay = 0.42 + leftIndex * 0.072;

            return (
              <motion.span
                key={`${currentWord}-${i}-${char}`}
                className="inline-block relative will-change-transform"
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  verticalAlign: "baseline",
                  lineHeight: "inherit",
                }}
                initial={{
                  y: "-120%",
                  opacity: 0,
                  color: "#111113",
                  filter: "blur(4px)",
                }}
                animate={{
                  y: "0%",
                  opacity: 1,
                  // Colors into vibrant Ventrion orange and stays orange
                  color: "#FF5C18",
                  filter: "blur(0px)",
                  transition: {
                    duration: enterDuration,
                    delay: enterDelay,
                    // Snappy, luxurious ease-out Bezier for incoming letters
                    ease: [0.16, 1, 0.3, 1],
                    color: {
                      duration: enterDuration * 0.75,
                      delay: enterDelay + 0.08,
                      ease: "easeInOut",
                    },
                  },
                }}
                exit={{
                  y: "135%",
                  // Fades out gracefully before the bottom clip boundary
                  opacity: 0,
                  // Color gets "sucked out" into black as it plummets!
                  color: "#111113",
                  filter: "blur(4px)",
                  transition: {
                    duration: exitDuration,
                    delay: exitDelay,
                    // "langsamer anfangen": starts with gentle acceleration Bezier
                    ease: [0.5, 0.05, 0.65, 0.95],
                    color: {
                      // Orange rapidly drains back to black in the first half of the fall:
                      duration: exitDuration * 0.45,
                      delay: exitDelay,
                      ease: "easeIn",
                    },
                  },
                }}
              >
                {char}
              </motion.span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
