"use client";

import {useEffect, useRef} from "react";
import Link from "next/link";
import Image from "next/image";
import {gsap} from "gsap";

const BG_IMAGE = "/images/not-found-bg.png";
const ASTRONAUT_IMAGE = "/images/astronaut.png";

function StarField({density = 70}: { density?: number }) {
    const stars = Array.from({length: density}).map((_, i) => {
        const seed = i * 9973;
        const x = (seed % 1000) / 10;
        const y = ((seed * 7) % 1000) / 10;
        const size = 1 + (seed % 3);
        const delay = (seed % 400) / 100;
        return {x, y, size, delay, id: i};
    });

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {stars.map((s) => (
                <span
                    key={s.id}
                    className="absolute rounded-full bg-white/80 animate-pulse"
                    style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        width: s.size,
                        height: s.size,
                        animationDelay: `${s.delay}s`,
                        animationDuration: "3.5s",
                    }}
                />
            ))}
        </div>
    );
}

export default function NotFound() {
    const wrapRef = useRef<HTMLDivElement>(null);
    const astronautRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({defaults: {ease: "power3.out"}});

            tl.fromTo(
                ".digit",
                {y: 60, opacity: 0, scale: 0.8},
                {y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.12}
            )
                .fromTo(
                    astronautRef.current,
                    {opacity: 0, scale: 0.85, rotate: -6},
                    {opacity: 1, scale: 1, rotate: 0, duration: 1},
                    "-=0.6"
                )
                .fromTo(
                    ".uhoh-title",
                    {y: 24, opacity: 0},
                    {y: 0, opacity: 1, duration: 0.6},
                    "-=0.4"
                )
                .fromTo(
                    ".uhoh-sub",
                    {y: 16, opacity: 0},
                    {y: 0, opacity: 1, duration: 0.6},
                    "-=0.35"
                )
                .fromTo(
                    ".uhoh-btn",
                    {y: 16, opacity: 0},
                    {y: 0, opacity: 1, duration: 0.5},
                    "-=0.3"
                );

            // Astronaut drifts gently, like floating in zero gravity
            gsap.to(astronautRef.current, {
                y: "+=16",
                rotate: 3,
                duration: 3.4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });

            // Glow behind the astronaut breathes
            gsap.to(glowRef.current, {
                scale: 1.15,
                opacity: 0.85,
                duration: 2.6,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });

            // Subtle parallax: astronaut + glow follow the cursor slightly
            const wrap = wrapRef.current;
            if (wrap) {
                const xTo = gsap.quickTo(astronautRef.current, "x", {
                    duration: 0.8,
                    ease: "power2.out",
                });
                const yTo = gsap.quickTo(astronautRef.current, "y", {
                    duration: 0.8,
                    ease: "power2.out",
                });

                const onMove = (e: MouseEvent) => {
                    const rect = wrap.getBoundingClientRect();
                    const px = (e.clientX - rect.left) / rect.width - 0.5;
                    const py = (e.clientY - rect.top) / rect.height - 0.5;
                    xTo(px * 24);
                    yTo(py * 24);
                };
                wrap.addEventListener("mousemove", onMove);
                return () => wrap.removeEventListener("mousemove", onMove);
            }
        }, wrapRef);

        return () => ctx.revert();
    }, []);

    return (
        <main
            ref={wrapRef}
            className="relative min-h-screen bg-[#050308] text-white flex flex-col items-center justify-center overflow-hidden px-6"
        >
            <Image
                src={BG_IMAGE}
                alt=""
                fill
                priority
                className="object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#050308]"/>
            <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(124,58,237,0.25),transparent_60%)]"/>
            <StarField density={80}/>

            <div className="relative z-10 flex items-center justify-center select-none">
        <span
            className="digit font-black leading-none text-[22vw] sm:text-[18vw] md:text-[220px] bg-gradient-to-b from-purple-300 via-purple-400 to-blue-400 bg-clip-text text-transparent"
            style={{filter: "drop-shadow(0 0 40px rgba(147,51,234,0.55))"}}
        >
          4
        </span>

                <div
                    className="relative w-[36vw] sm:w-[26vw] md:w-[260px] aspect-square flex items-center justify-center mx-1 sm:mx-3">
                    <div
                        ref={glowRef}
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/60 to-blue-500/50 blur-3xl"
                    />

                    <div ref={astronautRef} className="relative w-[85%] h-[85%]">
                        <Image
                            src={ASTRONAUT_IMAGE}
                            alt="Astronaut floating in space"
                            fill
                            className="object-contain drop-shadow-[0_0_30px_rgba(124,58,237,0.6)]"
                        />
                    </div>
                </div>

                <span
                    className="digit font-black leading-none text-[22vw] sm:text-[18vw] md:text-[220px] bg-gradient-to-b from-blue-400 via-purple-400 to-purple-300 bg-clip-text text-transparent"
                    style={{filter: "drop-shadow(0 0 40px rgba(56,189,248,0.5))"}}
                >
          4
        </span>
            </div>

            <div className="relative z-10 text-center -mt-2 sm:-mt-4">
                <h1 className="uhoh-title text-2xl md:text-3xl font-extrabold uppercase tracking-wide">
                    Signal lost
                </h1>
                <p className="uhoh-sub mt-3 text-white/60 text-sm md:text-base max-w-md mx-auto">
                    This page drifted off the map. The link might be broken, or it
                    never existed in the first place.
                </p>

                <Link
                    href="/"
                    className="uhoh-btn inline-flex items-center gap-2 mt-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs md:text-sm font-bold tracking-widest uppercase px-7 py-4 hover:opacity-90 hover:scale-105 transition-all duration-300"
                >
                    Go to home page
                </Link>
            </div>
        </main>
    );
}