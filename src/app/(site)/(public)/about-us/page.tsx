"use client";

import {useEffect, useRef, useState} from "react";
import Link from "next/link";
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {BiChevronDown, BiLock, BiMusic, BiShare} from "react-icons/bi";
import {LuListMusic} from "react-icons/lu";
import {FiShare2} from "react-icons/fi";
import Footer from "@/components/Footer";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

function StarField({
                       density = 60,
                       parallaxClass = "",
                   }: {
    density?: number;
    parallaxClass?: string;
}) {
    const stars = Array.from({length: density}).map((_, i) => {
        const seed = i * 9973
        const x = (seed % 1000) / 10
        const y = ((seed * 7) % 1000) / 10
        const size = 1 + (seed % 3)
        const delay = (seed % 400) / 100
        return {x, y, size, delay, id: i}
    });

    return (
        <div
            className={`pointer-events-none absolute inset-0 overflow-hidden ${parallaxClass}`}
        >
            {stars.map((s) => (
                <span
                    key={s.id}
                    className="absolute rounded-full bg-white/70 animate-pulse"
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

function FloatingOrbs() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="float-orb absolute top-[15%] left-[8%] w-40 h-40 rounded-full bg-purple-500/20 blur-3xl"/>
            <div className="float-orb absolute top-[55%] right-[10%] w-56 h-56 rounded-full bg-blue-500/15 blur-3xl"/>
            <div
                className="float-orb absolute bottom-[10%] left-[35%] w-32 h-32 rounded-full bg-purple-400/15 blur-3xl"/>
        </div>
    );
}


function Typewriter({
                        text,
                        className = "",
                        speed = 26,
                        cursor = true,
                    }: {
    text: string;
    className?: string;
    speed?: number;
    cursor?: boolean;
}) {
    const [displayed, setDisplayed] = useState("");
    const [started, setStarted] = useState(false);
    const [done, setDone] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !started) {
                        setStarted(true);
                        observer.disconnect();
                    }
                });
            },
            {threshold: 0.4}
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [started]);

    useEffect(() => {
        if (!started) return;
        let i = 0;
        const interval = setInterval(() => {
            i += 1;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(interval);
                setDone(true);
            }
        }, speed);
        return () => clearInterval(interval);
    }, [started, text, speed]);

    return (
        <span ref={ref} className={className}>
      {displayed}
            {cursor && !done && (
                <span className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle animate-pulse"/>
            )}
    </span>
    );
}


function Marquee({text}: { text: string }) {
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!trackRef.current) return;
        const tween = gsap.to(trackRef.current, {
            xPercent: -50,
            repeat: -1,
            duration: 40,
            ease: "none",
        });
        return () => {
            tween.kill();
        };
    }, []);

    const items = Array.from({length: 8}).fill(text);

    return (
        <div className="relative border-y border-white/10 py-5 overflow-hidden">
            <div ref={trackRef} className="flex w-max whitespace-nowrap">
                {[...items, ...items].map((t, i) => (
                    <span
                        key={i}
                        className="mx-6 text-sm md:text-base font-bold tracking-[0.3em] uppercase text-white/25"
                    >
            {t as string} <span className="text-purple-400/50">•</span>
          </span>
                ))}
            </div>
        </div>
    );
}


export default function AboutPage() {
    const heroRef = useRef<HTMLDivElement>(null);
    const storyRef = useRef<HTMLDivElement>(null);
    const valuesRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const heroStarsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".hero-badge, .hero-title-line, .hero-sub",
                {y: 24, opacity: 0},
                {y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "power3.out"}
            );

            gsap.to(".float-orb", {
                y: "+=24",
                x: "+=14",
                duration: 5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: {each: 0.6, from: "random"},
            });

            if (heroStarsRef.current) {
                gsap.to(heroStarsRef.current, {
                    yPercent: -8,
                    xPercent: 3,
                    ease: "none",
                    scrollTrigger: {
                        trigger: heroRef.current,
                        start: "top top",
                        end: "bottom top",
                        scrub: 0.8,
                    },
                });
            }

            gsap.utils.toArray<HTMLElement>(".reveal-up").forEach((el) => {
                gsap.fromTo(
                    el,
                    {y: 40, opacity: 0},
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        ease: "power2.out",
                        scrollTrigger: {trigger: el, start: "top 85%"},
                    }
                );
            });

            gsap.fromTo(
                ".value-card",
                {y: 30, opacity: 0},
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.7,
                    stagger: 0.15,
                    ease: "power2.out",
                    scrollTrigger: {trigger: valuesRef.current, start: "top 80%"},
                }
            );

            if (pathRef.current) {
                const length = pathRef.current.getTotalLength();
                gsap.set(pathRef.current, {
                    strokeDasharray: length,
                    strokeDashoffset: length,
                });
                gsap.to(pathRef.current, {
                    strokeDashoffset: 0,
                    ease: "none",
                    scrollTrigger: {
                        trigger: timelineRef.current,
                        start: "top 70%",
                        end: "bottom 60%",
                        scrub: 0.6,
                    },
                });
            }

            gsap.utils.toArray<HTMLElement>(".node-dot").forEach((el) => {
                gsap.fromTo(
                    el,
                    {opacity: 0.25, scale: 0.7},
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 0.4,
                        scrollTrigger: {
                            trigger: el,
                            start: "top 75%",
                            onEnter: () => {
                                gsap.to(el, {
                                    boxShadow: "0 0 22px rgba(167,139,250,0.9)",
                                    scale: 1.15,
                                    duration: 1.1,
                                    repeat: -1,
                                    yoyo: true,
                                    ease: "sine.inOut",
                                });
                            },
                        },
                    }
                );
            });

            gsap.utils.toArray<HTMLElement>(".value-card").forEach((card) => {
                const xTo = gsap.quickTo(card, "rotationY", {duration: 0.4, ease: "power2.out"});
                const yTo = gsap.quickTo(card, "rotationX", {duration: 0.4, ease: "power2.out"});


                const onMove = (e: MouseEvent) => {
                    const rect = card.getBoundingClientRect();
                    const px = (e.clientX - rect.left) / rect.width - 0.5;
                    const py = (e.clientY - rect.top) / rect.height - 0.5;
                    xTo(px * 10);
                    yTo(-py * 10);
                };
                const onLeave = () => {
                    xTo(0);
                    yTo(0);
                };
                card.addEventListener("mousemove", onMove);
                card.addEventListener("mouseleave", onLeave);
            });
        });

        return () => ctx.revert();
    }, []);

    return (
        <main className="relative bg-[#07060d] text-white overflow-hidden">

            <section
                ref={heroRef}
                className="relative min-h-screen flex flex-col items-center justify-center text-center px-6"
            >
                <div
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(124,58,237,0.28),transparent_60%)]"/>
                <div
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_70%,rgba(56,189,248,0.15),transparent_55%)]"/>
                <div ref={heroStarsRef} className="absolute inset-0">
                    <StarField density={70}/>
                </div>
                <FloatingOrbs/>

                <div className="relative z-10 max-w-4xl">
          <span
              className="hero-badge inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] tracking-[0.2em] text-white/70 mb-8">
            <BiMusic size={12} className="text-purple-300"/>
            BEHIND THE NOTE
          </span>

                    <h1 className="font-extrabold uppercase leading-[0.95] text-5xl sm:text-6xl md:text-7xl tracking-tight">
                        <span className="hero-title-line block">We believe some</span>
                        <span
                            className="hero-title-line block bg-gradient-to-r from-white via-purple-300 to-blue-400 bg-clip-text text-transparent">
              messages deserve
            </span>
                        <span className="hero-title-line block">a soundtrack</span>
                    </h1>

                    <p className="hero-sub mt-8 text-white/60 text-base md:text-lg max-w-xl mx-auto min-h-[3.5em]">
                        <Typewriter
                            text="Message Note started with a simple idea — words can say a lot, but sometimes a song says it better. We built a place to lock your feelings inside a playlist and hand someone the key."
                            speed={16}
                        />
                    </p>
                </div>

                <div
                    className="absolute bottom-8 flex flex-col items-center gap-2 text-white/40 text-[11px] tracking-[0.2em]">
                    SCROLL
                    <BiChevronDown size={14} className="animate-bounce"/>
                </div>
            </section>

            <section ref={storyRef} className="relative py-28 px-6 md:px-10">
                <StarField density={35}/>
                <div className="relative z-10 max-w-[1400px] mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="reveal-up">
                        <p className="text-blue-400 text-xs tracking-[0.25em] font-semibold mb-4">
                            OUR STORY
                        </p>
                        <h2 className="text-4xl md:text-5xl font-extrabold uppercase leading-tight mb-6">
                            A playlist that
                            <br/>
                            never got sent.
                        </h2>
                        <div className="space-y-4 text-white/60 text-base leading-relaxed max-w-lg">
                            <p>
                                Everyone has one — the playlist they built for someone and
                                never worked up the nerve to share. The songs that carried a
                                memory, an apology, or a thank-you they couldn&apos;t quite
                                put into words.
                            </p>
                            <p>
                                Message Note exists so that playlist doesn&apos;t stay
                                buried in a notes app. Build it, lock it with a password,
                                write the note you couldn&apos;t say out loud, and let the
                                music carry the rest.
                            </p>
                        </div>
                    </div>

                    <div
                        className="reveal-up relative rounded-3xl border border-white/10 bg-gradient-to-b from-purple-950/40 to-black/60 backdrop-blur-sm p-8 md:p-10"
                        style={{transformStyle: "preserve-3d"}}>
                        <div
                            className="absolute -top-3 -left-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center rotate-6">
                            <BiMusic size={20}/>
                        </div>
                        <p className="text-xl md:text-2xl font-semibold leading-snug text-white/90 min-h-[6em]">
                            <Typewriter
                                text={'"We didn\u2019t want to build another music player. We wanted to build a way to say something without saying it."'}
                                speed={22}
                            />
                        </p>
                        <p className="mt-6 text-sm text-white/40 tracking-wide">
                            — The Message Note team
                        </p>
                    </div>
                </div>
            </section>

            <Marquee text="PLAY IT PRIVATE — YOUR NOTE, YOUR SONGS, YOUR PERSON —"/>

            <section ref={valuesRef} className="relative py-24 px-6 md:px-10">
                <div className="relative z-10 max-w-[1400px] mx-auto">
                    <div className="reveal-up text-center max-w-2xl mx-auto mb-16">
                        <p className="text-blue-400 text-xs tracking-[0.25em] font-semibold mb-4">
                            WHAT WE STAND FOR
                        </p>
                        <h2 className="text-4xl md:text-5xl font-extrabold uppercase leading-tight">
                            Built with intention
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <ValueCard
                            icon={<BiLock size={20}/>}
                            title="Privacy first"
                            text="Your playlist stays locked until you decide who gets to hear it. No public feed, no algorithm — just you and the person you're sending it to."
                        />
                        <ValueCard
                            icon={<LuListMusic size={20}/>}
                            title="Made for meaning"
                            text="Every playlist tells a story. We build the tools; the music does the talking."
                        />
                        <ValueCard
                            icon={<FiShare2 size={20}/>}
                            title="Simple by design"
                            text="No clutter, no distractions. Create, protect, share — that's the whole idea."
                        />
                    </div>
                </div>
            </section>

            <section ref={timelineRef} className="relative py-28 px-6 md:px-10">
                <StarField density={45}/>
                <div className="relative z-10 max-w-3xl mx-auto">
                    <div className="reveal-up text-center mb-20">
                        <p className="text-blue-400 text-xs tracking-[0.25em] font-semibold mb-4">
                            HOW IT CAME TOGETHER
                        </p>
                        <h2 className="text-4xl md:text-5xl font-extrabold uppercase leading-tight">
                            The idea, mapped out
                        </h2>
                    </div>

                    <div className="relative pl-10 md:pl-16">
                        <svg
                            className="absolute left-3 md:left-6 top-0 h-full w-1"
                            width="4"
                            viewBox="0 0 4 900"
                            preserveAspectRatio="none"
                            fill="none"
                        >
                            <path
                                ref={pathRef}
                                d="M2 0 L2 900"
                                stroke="url(#lineGradient)"
                                strokeWidth="2"
                            />
                            <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#a78bfa"/>
                                    <stop offset="100%" stopColor="#38bdf8"/>
                                </linearGradient>
                            </defs>
                        </svg>

                        <TimelineNode
                            title="A shared frustration"
                            text="Texting a playlist link felt cold. Sharing a note felt exposed. We wanted both, together, private."
                        />
                        <TimelineNode
                            title="The first prototype"
                            text="A playlist you could lock behind a password, with one message attached. Nothing else."
                        />
                        <TimelineNode
                            title="Message Note, today"
                            text="A quiet corner of the internet where a playlist can say what a text message can't."
                        />
                    </div>
                </div>
            </section>

            <section className="relative py-28 px-6 md:px-10 text-center">
                <div
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(124,58,237,0.22),transparent_65%)]"/>
                <StarField density={40}/>
                <FloatingOrbs/>
                <div className="reveal-up relative z-10 max-w-2xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-extrabold uppercase leading-tight mb-6">
                        Ready to say it in a playlist?
                    </h2>
                    <p className="text-white/60 mb-10">
                        Create your first private playlist and send it to someone who
                        needs to hear it.
                    </p>
                    <Link
                        href="/dashboard/profile?tab=create-playlist"
                        className="inline-block rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-bold tracking-wide px-8 py-4 hover:opacity-90 transition-opacity hover:scale-105 duration-300"
                    >
                        GET STARTED
                    </Link>
                </div>
            </section>

            <Footer/>
        </main>
    );
}


function ValueCard({
                       icon,
                       title,
                       text,
                   }: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <div
            className="value-card rounded-2xl border border-white/10 bg-white/[0.03] p-7 hover:bg-white/[0.05] transition-colors will-change-transform">
            <div
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-purple-300 mb-5">
                {icon}
            </div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-white/55 text-sm leading-relaxed">{text}</p>
        </div>
    );
}

function TimelineNode({title, text}: { title: string; text: string }) {
    return (
        <div className="reveal-up relative pb-16 last:pb-0">
            <span
                className="node-dot absolute -left-10 md:-left-16 top-1 w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-blue-400"/>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-white/55 text-sm leading-relaxed max-w-md">{text}</p>
        </div>
    );
}