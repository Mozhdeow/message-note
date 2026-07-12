'use client'
import {useLayoutEffect, useMemo, useRef} from "react";
import Link from "next/link";
import gsap from "gsap";

export function HoverStaggerLink({
                                     href,
                                     label,
                                     className = "",
                                 }: {
    href?: string;
    label: string;
    className?: string;
}) {
    const rootRef = useRef<HTMLAnchorElement | null>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    const chars = useMemo(() => Array.from(label), [label]);

    useLayoutEffect(() => {
        if (!rootRef.current) return;

        const ctx = gsap.context(() => {
            const q = gsap.utils.selector(rootRef);

            const text1Chars = q("[data-layer='1'] [data-char]");
            const text2Chars = q("[data-layer='2'] [data-char]");

            gsap.set(text1Chars, {yPercent: 0});
            gsap.set(text2Chars, {yPercent: 100});

            const tl = gsap.timeline({
                paused: true,
                defaults: {duration: 0.5, ease: "power2.out"},
            });

            const odds1 = Array.from(text1Chars).filter((_, i) => i % 2 === 0);
            const evens1 = Array.from(text1Chars).filter((_, i) => i % 2 === 1);
            const odds2 = Array.from(text2Chars).filter((_, i) => i % 2 === 0);
            const evens2 = Array.from(text2Chars).filter((_, i) => i % 2 === 1);

            tl.fromTo(odds1, {yPercent: 120}, {yPercent: 0}, 0);
            tl.fromTo(odds2, {yPercent: 0}, {yPercent: -120}, 0);

            tl.fromTo(evens1, {yPercent: 0}, {yPercent: 120}, 0);
            tl.fromTo(evens2, {yPercent: -120}, {yPercent: 0}, 0);

            tlRef.current = tl;
        }, rootRef);

        return () => {
            tlRef.current?.kill();
            ctx.revert();
        };
    }, [label]);

    const onEnter = () => tlRef.current?.restart();
    const onLeave = () => tlRef.current?.progress(0).pause();

    return (
        <Link
            ref={rootRef}
            href={href ?? "#"}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            className={className}
        >
      <span className="relative inline-flex items-center justify-center overflow-hidden leading-none">

        <span data-layer="1" className="flex flex-col">
          <span className="whitespace-nowrap">
            {chars.map((ch, i) => (
                <span key={`l1-${i}`} data-char className="inline-block">
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </span>
        </span>

        <span data-layer="2" className="absolute inset-0 flex flex-col">
          <span className="whitespace-nowrap">
            {chars.map((ch, i) => (
                <span key={`l2-${i}`} data-char className="inline-block">
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </span>
        </span>

      </span>
        </Link>
    );
}