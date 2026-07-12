"use client";

import React, { ReactNode, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
    BiHome,
    BiImage,
    BiMusic,
    BiSolidPlaylist,
    BiUser,
} from "react-icons/bi";
import type { PublicCategory, PublicPlaylist, PublicTrack } from "./PublicPlaylistPage";

type Variant = "blue" | "pink" | "purple" | "orange";
type HoverLine = "left" | "right";

const LINE_CONFIGS: {
    variant: Variant;
    hoverLine?: HoverLine;
    duration?: number;
}[] = [
    { variant: "blue" },
    { variant: "pink" },
    { variant: "purple", duration: 0.5 },
    { variant: "orange", duration: 0.6 },
    { variant: "orange", hoverLine: "right", duration: 0.6 },
    { variant: "purple", hoverLine: "right", duration: 0.5 },
    { variant: "pink", hoverLine: "right" },
    { variant: "blue", hoverLine: "right" },
];

const variants: Record<
    Variant,
    {
        vLine: string;
        hLine: string;
        circle: string;
        rectangle: string;
        hoverLineColor: string;
        rectangleHoverColor: string;
    }
> = {
    blue: {
        vLine:
            "lg:w-[10vw] lg:min-w-[120px] lg:max-w-[250px] w-0 bg-blue-300 shadow-blue-300/80 before:bg-blue-300 after:bg-blue-300 h-[3px]",
        hLine:
            "lg:h-[18vh] lg:min-h-[120px] lg:max-h-[220px] h-[68vh] bg-blue-300 before:bg-blue-300 after:bg-blue-300",
        circle: "bg-blue-300 shadow-blue-300 after:bg-blue-300 before:bg-blue-300",
        rectangle: "border-blue-300",
        hoverLineColor: "bg-blue-400 before:bg-blue-400 after:bg-blue-400",
        rectangleHoverColor: "hover:bg-[rgba(142,197,255,0.2)]",
    },
    pink: {
        vLine:
            "lg:w-[20vw] lg:min-w-[180px] lg:max-w-[450px] w-0 bg-pink-400 h-[3px]",
        hLine:
            "lg:h-[32vh] lg:min-h-[180px] lg:max-h-[380px] h-[68vh] bg-pink-400",
        circle: "bg-pink-400 shadow-pink-400",
        rectangle: "border-pink-400",
        hoverLineColor: "bg-pink-500 before:bg-pink-500 after:bg-pink-500",
        rectangleHoverColor: "hover:bg-[rgba(251,100,182,0.2)]",
    },
    purple: {
        vLine:
            "lg:w-[30vw] lg:min-w-[220px] lg:max-w-[650px] w-0 bg-purple-500 h-[3px]",
        hLine:
            "lg:h-[46vh] lg:min-h-[260px] lg:max-h-[540px] h-[68vh] bg-purple-500",
        circle: "bg-purple-400 shadow-purple-500",
        rectangle: "border-purple-500",
        hoverLineColor: "bg-purple-600 before:bg-purple-600 after:bg-purple-600",
        rectangleHoverColor: "hover:bg-[rgba(173,70,255,0.2)]",
    },
    orange: {
        vLine:
            "lg:w-[40vw] lg:min-w-[280px] lg:max-w-[850px] w-0 bg-orange-400 h-[3px]",
        hLine:
            "lg:h-[60vh] lg:min-h-[320px] lg:max-h-[700px] h-[68vh] bg-orange-400",
        circle: "bg-orange-400 shadow-orange-400",
        rectangle: "border-orange-400",
        hoverLineColor: "bg-orange-500 before:bg-orange-500 after:bg-orange-500",
        rectangleHoverColor: "hover:bg-[rgba(255,137,4,0.2)]",
    },
};

export default function CosmicPlaylistView({
                                               playlist,
                                               token,
                                           }: {
    playlist: PublicPlaylist;
    token: string;
}) {
    const borderRef = useRef<SVGSVGElement | null>(null);
    const centerLineRef = useRef<HTMLDivElement | null>(null);

    const visibleCategories = playlist.categories.slice(0, 8);
    const leftCategories = visibleCategories.slice(0, 4);
    const rightCategories = visibleCategories.slice(4, 8);

    useEffect(() => {
        if (!borderRef.current) return;

        const path = borderRef.current.querySelector("path");

        if (!path) return;

        const length = path.getTotalLength();

        gsap.set(path, {
            strokeDasharray: "8 18",
            strokeDashoffset: length,
        });

        gsap.to(path, {
            strokeDashoffset: 0,
            duration: 8,
            repeat: -1,
            ease: "linear",
        });
    }, []);

    useEffect(() => {
        if (!centerLineRef.current) return;

        gsap.fromTo(
            centerLineRef.current,
            {
                scaleY: 0,
                opacity: 0,
                transformOrigin: "bottom bottom",
            },
            {
                scaleY: 1,
                opacity: 1,
                duration: 2.2,
                ease: "power3.out",
            }
        );
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#02081a] text-white">
            <CosmicBackground />

            <main
                dir="ltr"
                className="relative z-10 flex min-h-screen w-full flex-col items-center overflow-hidden px-4 pt-20 md:px-6 xl:px-10"
            >
                <TopMusicNode
                    playlist={playlist}
                    borderRef={borderRef}
                />

                <div className="lg:hidden flex w-full flex-1 items-center justify-center">
                    <ResponsiveTreeSlider
                        categories={visibleCategories}
                        token={token}
                    />
                </div>

                <div className="hidden lg:flex relative w-full max-w-[1700px] flex-1 items-end justify-center gap-[2.5vw]">
                    {leftCategories.map((category, index) => {
                        const config = LINE_CONFIGS[index];

                        return (
                            <Line
                                key={category.id}
                                id={category.id}
                                token={token}
                                variant={config.variant}
                                duration={config.duration}
                                title={category.name}
                                description={category.description || ""}
                                tracks={category.tracks || []}
                            />
                        );
                    })}

                    <div className="relative flex h-full items-center justify-center px-6">
                        <div className="absolute h-[clamp(350px,70vh,900px)] w-[3px] rounded-full bg-rose-600 opacity-30" />

                        <div
                            ref={centerLineRef}
                            className="relative h-[clamp(350px,72vh,1000px)] w-[3px] rounded-full bg-rose-600 shadow-md shadow-rose-600/50 before:absolute before:-inset-1 before:bg-rose-600 before:opacity-60 before:blur-md before:content-[''] after:absolute after:-inset-1 after:bg-rose-600 after:opacity-50 after:blur-xl after:content-['']"
                        />
                    </div>

                    {rightCategories.map((category, index) => {
                        const config = LINE_CONFIGS[index + 4];

                        return (
                            <Line
                                key={category.id}
                                id={category.id}
                                token={token}
                                variant={config.variant}
                                hoverLine={config.hoverLine}
                                duration={config.duration}
                                title={category.name}
                                description={category.description || ""}
                                tracks={category.tracks || []}
                            />
                        );
                    })}
                </div>

                <div className="flex w-full items-center justify-center pb-6 md:pb-8">
                    <div className="flex h-[90px] w-[85vw] items-center justify-center rounded-lg border-2 border-rose-600 px-4 shadow-2xl shadow-rose-600/70 sm:h-[110px] md:h-[130px] lg:w-[40vw]">
                        <BottomCosmicMenu token={token} />
                    </div>
                </div>
            </main>
        </div>
    );
}

function CosmicBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-[#02081a]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(162,89,255,0.13),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(35,177,216,0.10),transparent_26%),linear-gradient(180deg,#020817_0%,#06152d_100%)]" />
            <div className="absolute inset-0 opacity-55 [background-image:radial-gradient(circle,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:90px_90px]" />
        </div>
    );
}

function TopMusicNode({
                          playlist,
                          borderRef,
                      }: {
    playlist: PublicPlaylist;
    borderRef: React.RefObject<SVGSVGElement | null>;
}) {
    const image =
        playlist.main_track?.cover_image ||
        playlist.cover_image ||
        "";

    return (
        <div className="relative mt-2 flex w-full flex-col items-center justify-center">
            <div className="relative flex h-[92px] w-[220px] items-center justify-center">
                <svg
                    ref={borderRef}
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox="0 0 220 92"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="top-node-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f5f2ff" />
                            <stop offset="100%" stopColor="#A259FFC9" />
                        </linearGradient>

                        <filter id="top-node-glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <path
                        d="M 8 8 C 8 3.5 11.5 0 16 0 L 204 0 C 208.5 0 212 3.5 212 8 L 212 84 C 212 88.5 208.5 92 204 92 L 16 92 C 11.5 92 8 88.5 8 84 Z"
                        stroke="url(#top-node-gradient)"
                        strokeWidth="4"
                        strokeDasharray="5 20"
                        filter="url(#top-node-glow)"
                    />
                </svg>

                <div className="relative z-10 flex h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-2xl bg-white/[0.04]">
                    {image ? (
                        <img
                            src={image}
                            alt={playlist.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <BiImage className="h-10 w-10 text-white/40" />
                    )}
                </div>
            </div>

            <div className="mt-3 text-center">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-secondary">
                    {playlist.receiver_name ? `For ${playlist.receiver_name}` : "Message Note"}
                </p>

                <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tighter text-white md:text-5xl">
                    {playlist.title}
                </h1>

                {playlist.receiver_message && (
                    <p className="mx-auto mt-3 max-w-2xl text-sm italic leading-7 text-white/45">
                        “{playlist.receiver_message}”
                    </p>
                )}

                {playlist.main_track?.file_url && (
                    <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.045] p-3 backdrop-blur-md">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                            Main Music — {playlist.main_track.title}
                        </p>

                        <audio
                            controls
                            src={playlist.main_track.file_url}
                            className="w-full"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function ResponsiveTreeSlider({
                                  categories,
                                  token,
                              }: {
    categories: PublicCategory[];
    token: string;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] =
        useState<PublicCategory | null>(null);

    const leftRef = useRef<HTMLDivElement | null>(null);
    const rightRef = useRef<HTMLDivElement | null>(null);

    const items = categories.map((category, index) => {
        const config = LINE_CONFIGS[index];

        return {
            ...category,
            variant: config.variant,
            hoverLine: index % 2 === 0 ? "right" : "left",
            duration: config.duration,
        };
    });

    const groups: PublicCategory[][] = [];

    for (let i = 0; i < items.length; i += 2) {
        groups.push(items.slice(i, i + 2));
    }

    const totalSlides = groups.length;
    const currentItems = groups[currentIndex] || [];
    const leftItem = currentItems[0] as (PublicCategory & { variant: Variant; hoverLine: HoverLine; duration?: number }) | undefined;
    const rightItem = currentItems[1] as (PublicCategory & { variant: Variant; hoverLine: HoverLine; duration?: number }) | undefined;

    const animateTransition = (direction: "next" | "prev") => {
        const tl = gsap.timeline();

        tl.to(leftRef.current, {
            opacity: 0,
            x: direction === "next" ? -100 : 100,
            duration: 0.2,
            ease: "power2.inOut",
        }).to(
            rightRef.current,
            {
                opacity: 0,
                x: direction === "next" ? 100 : -100,
                duration: 0.2,
                ease: "power2.inOut",
            },
            "<"
        );

        setTimeout(() => {
            tl.fromTo(
                leftRef.current,
                { opacity: 0, x: direction === "next" ? -100 : 100 },
                { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
            ).fromTo(
                rightRef.current,
                { opacity: 0, x: direction === "next" ? 100 : -100 },
                { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" },
                "<"
            );
        }, 50);
    };

    const nextSlide = () => {
        if (totalSlides <= 1) return;

        animateTransition("next");

        setCurrentIndex((prev) => {
            if (prev < totalSlides - 1) return prev + 1;
            return 0;
        });
    };

    const prevSlide = () => {
        if (totalSlides <= 1) return;

        animateTransition("prev");

        setCurrentIndex((prev) => {
            if (prev > 0) return prev - 1;
            return totalSlides - 1;
        });
    };

    if (!categories.length) {
        return (
            <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
                <BiMusic className="mb-4 h-12 w-12 text-white/30" />
                <p className="font-black text-white">No categories found.</p>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-[62vh] w-full flex-col justify-center rounded-xl">
            <div className="relative flex h-full w-full items-center justify-center px-10">
                <div
                    ref={leftRef}
                    className="flex h-full w-1/2 items-center justify-center"
                >
                    {leftItem && (
                        <button
                            type="button"
                            onClick={() => setSelectedCategory(leftItem)}
                            className="relative flex h-full items-center justify-center"
                        >
                            <Line
                                id={leftItem.id}
                                token={token}
                                modal={false}
                                title={leftItem.name}
                                description={leftItem.description || ""}
                                tracks={leftItem.tracks || []}
                                variant={leftItem.variant}
                                hoverLine={leftItem.hoverLine}
                                duration={leftItem.duration}
                            />
                        </button>
                    )}
                </div>

                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[65vh] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600 shadow-md shadow-rose-600/50 before:absolute before:-inset-1 before:bg-rose-600 before:opacity-60 before:blur-md before:content-[''] after:absolute after:-inset-1 after:rounded-full after:bg-rose-600 after:opacity-50 after:blur-xl after:content-['']" />

                <div
                    ref={rightRef}
                    className="flex h-full w-1/2 items-center justify-center"
                >
                    {rightItem && (
                        <button
                            type="button"
                            onClick={() => setSelectedCategory(rightItem)}
                            className="flex h-full w-full items-center justify-center"
                        >
                            <Line
                                id={rightItem.id}
                                token={token}
                                modal={false}
                                title={rightItem.name}
                                description={rightItem.description || ""}
                                tracks={rightItem.tracks || []}
                                variant={rightItem.variant}
                                hoverLine={rightItem.hoverLine}
                                duration={rightItem.duration}
                            />
                        </button>
                    )}
                </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-4">
                <button
                    type="button"
                    onClick={prevSlide}
                    disabled={totalSlides <= 1}
                    className="rounded-full bg-primary/40 p-3 text-white shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    ←
                </button>

                <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-sm font-black text-white/60 backdrop-blur-md">
          {currentIndex + 1} / {totalSlides}
        </span>

                <button
                    type="button"
                    onClick={nextSlide}
                    disabled={totalSlides <= 1}
                    className="rounded-full bg-primary/40 p-3 text-white shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    →
                </button>
            </div>

            <CategoryModal
                token={token}
                category={selectedCategory}
                onClose={() => setSelectedCategory(null)}
            />
        </div>
    );
}

function Line({
                  variant = "blue",
                  hoverLine = "left",
                  duration = 0.4,
                  id,
                  token,
                  modal = true,
                  title,
                  description,
                  tracks,
              }: {
    hoverLine?: HoverLine;
    duration?: number;
    id: number;
    token: string;
    modal?: boolean;
    variant?: Variant;
    title?: string;
    description?: string;
    tracks?: PublicTrack[];
}) {
    const {
        vLine,
        hLine,
        circle,
        rectangle,
        hoverLineColor,
        rectangleHoverColor,
    } = variants[variant];

    const lineHFillerRef = useRef<HTMLDivElement | null>(null);
    const lineVFillerRef = useRef<HTMLDivElement | null>(null);
    const lineCFillerRef = useRef<HTMLDivElement | null>(null);

    const [isOpen, setIsOpen] = useState(false);

    const play = () => {
        gsap.to(lineHFillerRef.current, {
            height: "100%",
            duration,
            ease: "power2.out",
        });

        gsap.to(lineVFillerRef.current, {
            width: "100%",
            duration,
            ease: "power2.out",
        });

        gsap.to(lineCFillerRef.current, {
            height: "100%",
            duration,
            ease: "power2.out",
        });
    };

    const pause = () => {
        gsap.to(lineHFillerRef.current, {
            height: "0%",
            duration,
            ease: "power2.inOut",
        });

        gsap.to(lineVFillerRef.current, {
            width: "0%",
            duration,
            ease: "power2.inOut",
        });

        gsap.to(lineCFillerRef.current, {
            height: "0%",
            duration,
            ease: "power2.inOut",
        });
    };

    return (
        <div className="relative flex h-full items-end justify-center">
            <div className={`${hLine} relative w-[3px] rounded-full shadow-md`}>
                <div
                    ref={lineHFillerRef}
                    className={`${hoverLineColor} absolute bottom-0 w-full rounded-full before:absolute before:-inset-0 before:blur-md after:absolute after:-inset-0 after:blur-xl`}
                    style={{ height: "0%" }}
                />
            </div>

            <div
                className={`${vLine} ${
                    hoverLine === "left" ? "right-0" : "left-0"
                } absolute top-0 h-[3px] rounded-full`}
            >
                <div
                    ref={lineVFillerRef}
                    className={`${hoverLineColor} ${
                        hoverLine === "left" ? "right-0" : "left-0"
                    } absolute top-0 h-full rounded-full before:absolute before:-inset-0 before:blur-md after:absolute after:-inset-0 after:blur-xl`}
                    style={{ width: "0%" }}
                />

                <div
                    className={`absolute ${
                        hoverLine === "left"
                            ? "left-2 rotate-270 lg:-left-3 lg:rotate-0"
                            : "right-2 rotate-90 lg:-right-3 lg:rotate-0"
                    } top-[30vh] lg:top-0`}
                >
                    <Circle
                        lineRef={lineCFillerRef}
                        hoverLineColor={hoverLineColor}
                        className={circle}
                    />
                </div>

                <Rectangle
                    id={id}
                    token={token}
                    modal={modal}
                    title={title}
                    description={description}
                    tracks={tracks || []}
                    isOpen={isOpen}
                    openModal={() => setIsOpen(true)}
                    closeModal={() => setIsOpen(false)}
                    onHover={play}
                    onLeave={pause}
                    className={`${
                        hoverLine === "left"
                            ? "-left-3 rotate-90 lg:-left-[90px]"
                            : "-right-3 rotate-270 lg:-right-[90px] lg:rotate-0"
                    } top-[30vh] lg:top-20 lg:rotate-0 ${rectangle} ${rectangleHoverColor}`}
                />
            </div>
        </div>
    );
}

function Rectangle({
                       id,
                       token,
                       modal,
                       className,
                       title,
                       description,
                       tracks,
                       isOpen,
                       openModal,
                       closeModal,
                       onHover,
                       onLeave,
                   }: {
    id: number;
    token: string;
    modal?: boolean;
    className?: string;
    title?: string;
    description?: string;
    tracks: PublicTrack[];
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
    onHover: () => void;
    onLeave: () => void;
}) {
    const rectRef = useRef<HTMLDivElement | null>(null);

    const shortTitle =
        title && title.length > 13 ? `${title.slice(0, 13)}...` : title || "Category";

    return (
        <div className="relative flex items-center justify-center">
            <div
                ref={rectRef}
                onMouseEnter={onHover}
                onMouseLeave={onLeave}
                className={`${className} absolute flex h-10 w-[170px] items-center justify-center overflow-hidden rounded border bg-[#06152d]/40 backdrop-blur-sm transition-colors sm:h-12 sm:w-[140px] md:w-[160px] xl:w-[180px]`}
            >
                <button
                    type="button"
                    onClick={openModal}
                    className="flex h-full w-full items-center justify-center overflow-hidden px-2 text-sm font-black text-white lg:text-lg"
                >
                    {shortTitle}
                </button>

                {modal && (
                    <CategoryModal
                        token={token}
                        category={{
                            id,
                            name: title || "Category",
                            description: description || "",
                            sort_order: 0,
                            tracks,
                        }}
                        onClose={closeModal}
                        forcedOpen={isOpen}
                    />
                )}
            </div>
        </div>
    );
}

function Circle({
                    hoverLineColor,
                    className,
                    lineRef,
                }: {
    hoverLineColor: string;
    className: string;
    lineRef: React.RefObject<HTMLDivElement | null>;
}) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const id = useId();

    useEffect(() => {
        const svgElement = svgRef.current;

        if (!svgElement) return;

        const path = svgElement.querySelector("path");

        if (!path) return;

        const length = path.getTotalLength();

        gsap.set(path, {
            strokeDasharray: 30,
            strokeDashoffset: length,
        });

        gsap.to(path, {
            strokeDashoffset: 0,
            duration: 5,
            repeat: -1,
            ease: "linear",
        });
    }, []);

    return (
        <div className="relative flex w-5 flex-col items-center justify-center sm:w-7">
            <svg
                ref={svgRef}
                className="absolute left-0 top-4 h-full w-full sm:top-[22px]"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                        <stop offset="100%" stopColor="#A259FFC9" stopOpacity="1" />
                    </linearGradient>

                    <filter id={`${id}-glow`}>
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <path
                    d="M 50, 5 A 45,45 0 1,1 49.99,5"
                    stroke={`url(#${id}-gradient)`}
                    strokeWidth="3"
                    strokeDasharray="10 10"
                    filter={`url(#${id}-glow)`}
                />
            </svg>

            <div className="z-10 flex flex-col items-center">
                <div
                    className={`${className} relative z-20 mb-2 h-6 w-1 rounded-full sm:mb-[14px] sm:h-7`}
                >
                    <div
                        ref={lineRef}
                        className={`${hoverLineColor} absolute top-0 h-full w-full rounded-full before:absolute before:-inset-0 before:rounded-full before:blur-md after:absolute after:-inset-0 after:rounded-full after:blur-xl`}
                        style={{ height: "0%" }}
                    />
                </div>

                <div className="circle h-2 w-2 rounded-full bg-white shadow-md shadow-white/50 before:absolute before:-inset-0 before:bg-white before:opacity-40 before:blur-sm after:absolute after:-inset-0 after:rounded-full after:bg-white after:opacity-40 after:blur-lg sm:h-3 sm:w-3" />
            </div>
        </div>
    );
}

function CategoryModal({
                           token,
                           category,
                           onClose,
                           forcedOpen,
                       }: {
    token: string;
    category: PublicCategory | null;
    onClose: () => void;
    forcedOpen?: boolean;
}) {
    const isOpen = forcedOpen ?? !!category;

    if (!isOpen || !category) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#06152d]/95 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.35em] text-secondary">
                            Category
                        </p>

                        <h3 className="mt-2 text-3xl font-black text-white">
                            {category.name}
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-white/10 px-3 py-1 text-white/70 transition hover:bg-white/20 hover:text-white"
                    >
                        ×
                    </button>
                </div>

                <div className="max-h-[48vh] overflow-y-auto pr-1">
                    {category.description && (
                        category.description.split("\n").map((line, index) => (
                            <p key={index} className="mb-2 text-sm leading-7 text-white/55">
                                {line}
                            </p>
                        ))
                    )}

                    {category.tracks?.length ? (
                        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                            <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-primary">
                                {category.tracks.length} Tracks
                            </p>

                            <div className="space-y-2">
                                {category.tracks.slice(0, 4).map((track) => (
                                    <p key={track.id} className="truncate text-sm text-white/60">
                                        {track.title} — {track.artist}
                                    </p>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>

                <Link
                    href={`/playlist/${token}/category/${category.id}`}
                    className="mt-6 flex h-full w-full items-center justify-center rounded-md border-2 border-primary p-3 text-lg font-black uppercase text-white transition hover:bg-primary"
                >
                    Go to Tracks
                </Link>
            </div>
        </div>
    );
}

function BottomCosmicMenu({ token }: { token: string }) {
    return (
        <div className="flex items-center justify-center gap-8 md:gap-12">
            <Link
                href="/"
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.035] text-4xl text-primary transition hover:-translate-y-1 hover:bg-primary/15"
            >
                <BiHome />
            </Link>

            <Link
                href={`/playlist/${token}`}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.035] text-4xl text-primary transition hover:-translate-y-1 hover:bg-primary/15"
            >
                <BiSolidPlaylist />
            </Link>

            <Link
                href="/dashboard/profile"
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.035] text-4xl text-primary transition hover:-translate-y-1 hover:bg-primary/15"
            >
                <BiUser />
            </Link>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.035] text-4xl text-primary">
                <BiMusic />
            </div>
        </div>
    );
}