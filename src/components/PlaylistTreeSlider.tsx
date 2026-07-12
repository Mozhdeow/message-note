"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Line from "./ui/Line";
import type { PublicCategory, PublicTrack } from "./PublicPlaylistPage";
import { BiMusic } from "react-icons/bi";

type Variant = "blue" | "pink" | "purple" | "orange";

type SliderItem = {
    id: number;
    title: string;
    description: string;
    variant: Variant;
    hoverLine: "left" | "right";
    tracks: PublicTrack[];
};

type SliderGroup = {
    items: SliderItem[];
};

const variants: Variant[] = ["blue", "pink", "purple", "orange"];

export default function PlaylistTreeSlider({
                                               categories,
                                           }: {
    categories: PublicCategory[];
}) {
    const items: SliderItem[] = categories.map((category, index) => ({
        id: category.id,
        title: category.name,
        description: category.description || "",
        variant: variants[index % variants.length],
        hoverLine: index % 2 === 0 ? "right" : "left",
        tracks: category.tracks || [],
    }));

    const sliderGroups: SliderGroup[] = [];

    for (let i = 0; i < items.length; i += 2) {
        sliderGroups.push({
            items: items.slice(i, i + 2),
        });
    }

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<SliderItem | null>(
        null
    );

    const totalSlides = sliderGroups.length;

    const leftRef = useRef<HTMLDivElement | null>(null);
    const rightRef = useRef<HTMLDivElement | null>(null);

    const isOpen = !!selectedCategory;

    const closeModal = () => {
        setSelectedCategory(null);
    };

    const handleItemClick = (item: SliderItem) => {
        setSelectedCategory(item);
    };

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

    const currentItems = sliderGroups[currentIndex]?.items || [];
    const leftItem = currentItems[0];
    const rightItem = currentItems[1];

    if (!categories.length) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary">
                    <BiMusic className="h-9 w-9" />
                </div>

                <h3 className="text-2xl font-black text-white">
                    No categories found.
                </h3>

                <p className="mt-2 text-sm text-white/45">
                    This playlist does not have any category yet.
                </p>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-[70vh] w-full flex-col justify-center rounded-xl">
            <div className="relative flex h-full w-full items-center justify-center px-10">
                <div
                    ref={leftRef}
                    className="flex h-full w-1/2 items-center justify-center"
                >
                    {leftItem && (
                        <button
                            type="button"
                            onClick={() => handleItemClick(leftItem)}
                            className="relative flex h-full items-center justify-center"
                        >
                            <Line {...leftItem} modal={false} />
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
                            onClick={() => handleItemClick(rightItem)}
                            className="flex h-full w-full items-center justify-center"
                        >
                            <Line {...rightItem} modal={false} />
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

            <Modal
                isOpen={isOpen}
                closeModal={closeModal}
                title={selectedCategory?.title || "Category"}
                actions={
                    selectedCategory ? (
                        <Link
                            href="#"
                            className="flex h-full w-full items-center justify-center rounded-md border-2 border-primary p-2 text-lg uppercase text-white transition hover:bg-primary"
                        >
                            {selectedCategory.tracks.length} Tracks
                        </Link>
                    ) : null
                }
            >
                <div className="max-h-[62vh] overflow-y-auto px-1">
                    {selectedCategory?.description && (
                        <p className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/55">
                            {selectedCategory.description}
                        </p>
                    )}

                    {!selectedCategory?.tracks.length ? (
                        <p className="text-center text-white/45">
                            No tracks in this category.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {selectedCategory.tracks.map((track) => (
                                <CategoryTrackCard key={track.id} track={track} />
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

function CategoryTrackCard({ track }: { track: PublicTrack }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {track.cover_image ? (
                        <img
                            src={track.cover_image}
                            alt={track.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-white/35">
                            <BiMusic className="h-7 w-7" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h4 className="truncate text-lg font-black text-white">
                        {track.title}
                    </h4>

                    <p className="mt-1 truncate text-sm text-primary">
                        {track.artist}{" "}
                        <span className="text-white/35">• {track.album}</span>
                    </p>

                    {track.description && (
                        <p className="mt-2 text-sm leading-6 text-white/45">
                            {track.description}
                        </p>
                    )}
                </div>
            </div>

            {track.lyrics && (
                <p className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm italic leading-6 text-white/45">
                    “{track.lyrics}”
                </p>
            )}

            {track.file_url && (
                <audio controls src={track.file_url} className="mt-4 w-full" />
            )}
        </div>
    );
}