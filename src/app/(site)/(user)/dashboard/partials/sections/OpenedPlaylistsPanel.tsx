"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
    BiCopy,
    BiHistory,
    BiImage,
    BiLinkExternal,
    BiLockOpen,
    BiSolidPlaylist,
} from "react-icons/bi";

import GlassCard from "../GlassCard";
import ProfileSectionHeader from "../ProfileSectionHeader";

type OpenedPlaylist = {
    id: number;
    playlist_id: number;
    title: string;
    receiver_name?: string | null;
    receiver_message?: string | null;
    cover_image?: string | null;
    share_token: string;
    created_at?: string | null;
    opened_at: string;
    categories_count: number;
    tracks_count: number;
    has_main_track: boolean;
};

const getPlaylistPath = (token: string) => {
    return `/playlist/${encodeURIComponent(token)}`;
};

const getPlaylistFullUrl = (token: string) => {
    if (typeof window === "undefined") {
        return getPlaylistPath(token);
    }

    return `${window.location.origin}${getPlaylistPath(token)}`;
};

const getImageUrl = (url?: string | null) => {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    const apiBase = process.env.NEXT_PUBLIC_PHP_API || "";
    const cleanBase = apiBase.replace(/\/$/, "");
    const cleanUrl = url.replace(/^\//, "");

    if (!cleanBase) {
        return `/${cleanUrl}`;
    }

    return `${cleanBase}/${cleanUrl}`;
};

export default function OpenedPlaylistsPanel() {
    const [playlists, setPlaylists] = useState<OpenedPlaylist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOpenedPlaylists();
    }, []);

    const loadOpenedPlaylists = async () => {
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
                        action: "get_opened_playlists",
                    }).toString(),
                }
            );

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid opened playlists response:", text);
                toast.error("Server returned an invalid response.");
                return;
            }

            if (!result.success) {
                toast.error(result.message || "Could not load opened playlists.");
                return;
            }

            setPlaylists(result.playlists || []);
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while loading opened playlists.");
        } finally {
            setLoading(false);
        }
    };

    const copyLink = async (token: string) => {
        try {
            const url = getPlaylistFullUrl(token);

            await navigator.clipboard.writeText(url);
            toast.success("Playlist link copied.");
        } catch {
            toast.error("Could not copy link.");
        }
    };

    return (
        <div>
            <ProfileSectionHeader
                eyebrow="Opened Playlists"
                title="Music notes you opened"
                description="These are the private playlists you have unlocked and opened before."
            />

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-bold text-white/45">
                        {loading
                            ? "Loading opened playlists..."
                            : `${playlists.length} opened playlist${
                                playlists.length === 1 ? "" : "s"
                            } found`}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <OpenedPlaylistSkeleton />
                    <OpenedPlaylistSkeleton />
                    <OpenedPlaylistSkeleton />
                    <OpenedPlaylistSkeleton />
                </div>
            ) : playlists.length === 0 ? (
                <GlassCard>
                    <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary">
                            <BiHistory className="h-9 w-9" />
                        </div>

                        <h3 className="text-2xl font-black text-white">
                            No opened playlists yet.
                        </h3>

                        <p className="mt-3 max-w-md text-sm leading-7 text-white/45">
                            When you open a shared playlist with its password, it will appear here.
                        </p>
                    </div>
                </GlassCard>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {playlists.map((playlist) => (
                        <OpenedPlaylistCard
                            key={`${playlist.playlist_id}-${playlist.opened_at}`}
                            playlist={playlist}
                            onCopy={copyLink}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function OpenedPlaylistCard({
                                playlist,
                                onCopy,
                            }: {
    playlist: OpenedPlaylist;
    onCopy: (token: string) => void;
}) {
    const openedDate = playlist.opened_at
        ? new Date(playlist.opened_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
        : "Unknown date";

    const playlistPath = getPlaylistPath(playlist.share_token);
    const coverUrl = getImageUrl(playlist.cover_image);

    return (
        <GlassCard className="group overflow-hidden transition hover:-translate-y-1 hover:bg-white/[0.05]">
            <div className="flex gap-4">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={playlist.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 text-white/35">
                            <BiImage className="h-10 w-10" />
                        </div>
                    )}

                    {playlist.has_main_track && (
                        <span className="absolute left-2 top-2 rounded-full bg-cyan-400/90 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-black">
                            Main
                        </span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl font-black text-white">
                        {playlist.title}
                    </h3>

                    {playlist.receiver_name && (
                        <p className="mt-1 truncate text-sm font-bold text-primary">
                            For {playlist.receiver_name}
                        </p>
                    )}

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/45">
                        {playlist.receiver_message || "No personal message added."}
                    </p>

                    <p className="mt-3 text-xs font-bold uppercase tracking-wider text-white/30">
                        Opened {openedDate}
                    </p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniStat label="Categories" value={playlist.categories_count} />
                <MiniStat label="Tracks" value={playlist.tracks_count} />
                <MiniStat label="Status" value="Opened" />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                <Link
                    href={playlistPath}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black! transition hover:bg-primary hover:text-white!"
                >
                    <BiLinkExternal className="h-4 w-4" />
                    Open
                </Link>

                <button
                    type="button"
                    onClick={() => onCopy(playlist.share_token)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white/65 transition hover:bg-white/[0.09] hover:text-white"
                >
                    <BiCopy className="h-4 w-4" />
                    Copy Link
                </button>
            </div>
        </GlassCard>
    );
}

function MiniStat({
                      label,
                      value,
                  }: {
    label: string;
    value: number | string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
            <p className="text-lg font-black text-white">{value}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-white/30">
                {label}
            </p>
        </div>
    );
}

function OpenedPlaylistSkeleton() {
    return (
        <GlassCard>
            <div className="flex gap-4">
                <div className="h-28 w-28 shrink-0 animate-pulse rounded-3xl bg-white/10" />

                <div className="flex-1">
                    <div className="h-6 w-2/3 animate-pulse rounded-xl bg-white/10" />
                    <div className="mt-3 h-4 w-1/2 animate-pulse rounded-xl bg-white/10" />
                    <div className="mt-4 h-4 w-full animate-pulse rounded-xl bg-white/10" />
                    <div className="mt-2 h-4 w-3/4 animate-pulse rounded-xl bg-white/10" />
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
                <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
                <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
            </div>
        </GlassCard>
    );
}