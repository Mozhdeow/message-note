"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BiArrowBack, BiImage, BiMusic } from "react-icons/bi";
import type { PublicTrack } from "./PublicPlaylistPage";

type CategoryData = {
    id: number;
    name: string;
    description: string | null;
    tracks: PublicTrack[];
};

export default function PublicCategoryPage({
                                               token,
                                               categoryId,
                                           }: {
    token: string;
    categoryId: string;
}) {
    const [category, setCategory] = useState<CategoryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCategory = async () => {
            setLoading(true);

            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_PHP_API}/process.php`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        credentials: "include",
                        body: new URLSearchParams({
                            action: "get_public_category_tracks",
                            token,
                            category_id: categoryId,
                        }).toString(),
                    }
                );

                const text = await res.text();

                let result;

                try {
                    result = JSON.parse(text);
                } catch {
                    console.error("Invalid category response:", text);
                    toast.error("Server returned an invalid response.");
                    return;
                }

                if (!result.success) {
                    toast.error(result.message || "Could not load category.");
                    return;
                }

                setCategory(result.category);
            } catch (error) {
                console.error(error);
                toast.error("Something went wrong.");
            } finally {
                setLoading(false);
            }
        };

        loadCategory();
    }, [token, categoryId]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#02081a] text-white">
            <CosmicBackground />

            <main className="relative z-10 mx-auto min-h-screen w-full max-w-5xl px-4 pb-20 pt-28 md:px-8">
                <Link
                    href={`/playlist/${token}`}
                    className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm font-bold text-white/60 transition hover:bg-white/[0.12] hover:text-white"
                >
                    <BiArrowBack className="h-5 w-5" />
                    Back to Cosmic Tree
                </Link>

                {loading ? (
                    <p className="text-white/50">Loading category...</p>
                ) : !category ? (
                    <p className="text-white/50">Category not found.</p>
                ) : (
                    <>
                        <p className="text-sm font-bold text-white/45">
                            Category Sector: {category.id}
                        </p>

                        <h1 className="mt-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-display text-5xl font-black text-transparent md:text-6xl">
                            {category.name}
                        </h1>

                        {category.description && (
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
                                {category.description}
                            </p>
                        )}

                        <div className="mt-8 h-px w-full max-w-2xl bg-white/10" />

                        {category.tracks.length === 0 ? (
                            <div className="mt-16 text-center text-white/45">
                                No tracks in this category.
                            </div>
                        ) : (
                            <div className="mt-12 grid gap-8">
                                {category.tracks.map((track) => (
                                    <TrackPlayerCard key={track.id} track={track} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

function TrackPlayerCard({ track }: { track: PublicTrack }) {
    return (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] backdrop-blur-md">
            <div className="flex flex-col gap-5 md:flex-row">
                <div className="mx-auto h-48 w-48 shrink-0 overflow-hidden rounded-full border border-primary/60 bg-white/[0.04] p-3 shadow-[0_0_35px_rgba(162,89,255,0.20)] md:mx-0">
                    <div className="h-full w-full overflow-hidden rounded-full">
                        {track.cover_image ? (
                            <img
                                src={track.cover_image}
                                alt={track.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-white/35">
                                <BiImage className="h-16 w-16" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <div className="flex items-center gap-2 text-primary">
                        <BiMusic className="h-5 w-5" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">
              Audio Track
            </span>
                    </div>

                    <h2 className="mt-3 text-3xl font-black text-white">
                        {track.title}
                    </h2>

                    <p className="mt-2 text-sm font-bold text-white/45">
                        {track.artist}{" "}
                        <span className="text-white/25">• {track.album}</span>
                    </p>

                    {track.description && (
                        <p className="mt-4 text-sm leading-7 text-white/50">
                            {track.description}
                        </p>
                    )}

                    {track.lyrics && (
                        <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm italic leading-7 text-white/45">
                            “{track.lyrics}”
                        </p>
                    )}

                    {track.file_url && (
                        <audio
                            controls
                            src={track.file_url}
                            className="mt-5 w-full"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function CosmicBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-[#02081a]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(162,89,255,0.16),transparent_34%),linear-gradient(180deg,#070321_0%,#06152d_100%)]" />
            <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:90px_90px]" />
        </div>
    );
}