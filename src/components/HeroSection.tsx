"use client";

import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { BiHeadphone, BiMouse } from "react-icons/bi";
import { BsArrowUpRight } from "react-icons/bs";

export default function HeroSection() {
    const rootRef = useRef<HTMLElement | null>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from("[data-hero='eyebrow']", {
                y: 18,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
            });

            gsap.from("[data-hero='title']", {
                yPercent: 110,
                opacity: 0,
                rotateX: -18,
                duration: 1.1,
                stagger: 0.12,
                ease: "power4.out",
                delay: 0.1,
            });

            gsap.from("[data-hero='text']", {
                y: 24,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
                delay: 0.55,
            });

            gsap.from("[data-hero='cta']", {
                y: 20,
                opacity: 0,
                duration: 0.75,
                stagger: 0.1,
                ease: "power3.out",
                delay: 0.75,
            });

            gsap.to("[data-hero='scroll']", {
                y: 10,
                duration: 1.2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
        }, rootRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={rootRef}
            className="relative flex min-h-screen items-center px-6 pb-20 pt-32 md:px-12 lg:px-20"
        >
            <div className="mx-auto flex w-full max-w-7xl flex-col items-start">
                <div
                    data-hero="eyebrow"
                    className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-white/70 backdrop-blur-md"
                >
                    <BiHeadphone className="h-4 w-4 text-secondary" />
                    Private music sharing
                </div>

                <div className="overflow-hidden">
                    <h1
                        data-hero="title"
                        className="font-display text-[18vw] font-black uppercase leading-[0.78] tracking-tighter text-white md:text-[12vw] lg:text-[9rem] xl:text-[11rem]"
                    >
                        PLAY IT
                    </h1>
                </div>

                <div className="overflow-hidden">
                    <h1
                        data-hero="title"
                        className="font-display bg-gradient-to-r from-white via-primary to-secondary bg-clip-text text-[18vw] font-black uppercase leading-[0.82] tracking-tighter text-transparent md:text-[12vw] lg:text-[9rem] xl:text-[11rem]"
                    >
                        PRIVATE
                    </h1>
                </div>

                <p
                    data-hero="text"
                    className="mt-7 max-w-2xl text-base font-semibold leading-8 text-white/70 md:text-lg"
                >
                    Create a playlist, lock it with a password, write your note, and share
                    it with someone special.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                        data-hero="cta"
                        href="/dashboard/profile?tab=create-playlist"
                        className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-black uppercase tracking-wider text-black! shadow-[0_12px_40px_rgba(255,255,255,0.18)] transition hover:bg-primary hover:text-white"
                    >
                        Create Playlist
                        <BsArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </Link>

                    <Link
                        data-hero="cta"
                        href="#how-it-works"
                        className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 py-3 text-sm font-black uppercase tracking-wider text-white backdrop-blur-md transition hover:bg-white/10"
                    >
                        How it works
                    </Link>
                </div>

                <div
                    data-hero="scroll"
                    className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-white/45 md:flex"
                >
                    <BiMouse className="h-5 w-5" />
                    Scroll
                </div>
            </div>
        </section>
    );
}