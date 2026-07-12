"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
    BiCopy,
    BiImage,
    BiLinkExternal,
    BiPlus,
    BiSolidPlaylist,
} from "react-icons/bi";

import GlassCard from "../GlassCard";
import ProfileSectionHeader from "../ProfileSectionHeader";

type UserPlaylist = {
    id: number;
    title: string;
    receiver_name?: string | null;
    receiver_message?: string | null;
    cover_image?: string | null;
    share_token: string;
    share_url?: string;
    created_at: string;
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

export default function MyPlaylistsPanel() {
    const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlaylists();
    }, []);

    const loadPlaylists = async () => {
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
                        action: "get_my_playlists",
                    }).toString(),
                }
            );

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid playlists response:", text);
                toast.error("Server returned an invalid response.");
                return;
            }

            if (!result.success) {
                toast.error(result.message || "Could not load playlists.");
                return;
            }

            setPlaylists(result.playlists || []);
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while loading playlists.");
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
                eyebrow="My Playlists"
                title="Your music notes"
                description="These are the private playlists you created and shared with password protection."
            />

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-bold text-white/45">
                        {loading
                            ? "Loading playlists..."
                            : `${playlists.length} playlist${
                                playlists.length === 1 ? "" : "s"
                            } found`}
                    </p>
                </div>

                <Link
                    href="/dashboard/profile?tab=create-playlist"
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black! transition hover:bg-primary
                    hover:text-white!"
                >
                    <BiPlus className="h-5 w-5" />
                    Create Playlist
                </Link>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <PlaylistSkeleton />
                    <PlaylistSkeleton />
                    <PlaylistSkeleton />
                    <PlaylistSkeleton />
                </div>
            ) : playlists.length === 0 ? (
                <GlassCard>
                    <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary">
                            <BiSolidPlaylist className="h-9 w-9" />
                        </div>

                        <h3 className="text-2xl font-black text-white">
                            No playlists yet.
                        </h3>

                        <p className="mt-3 max-w-md text-sm leading-7 text-white/45">
                            Create your first private playlist, choose a main music,
                            add categories and share it with a password.
                        </p>

                        <Link
                            href="/dashboard/profile?tab=create-playlist"
                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-secondary"
                        >
                            <BiPlus className="h-5 w-5" />
                            Start Creating
                        </Link>
                    </div>
                </GlassCard>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {playlists.map((playlist) => (
                        <PlaylistCard
                            key={playlist.id}
                            playlist={playlist}
                            onCopy={copyLink}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function PlaylistCard({
                          playlist,
                          onCopy,
                      }: {
    playlist: UserPlaylist;
    onCopy: (token: string) => void;
}) {
    const date = playlist.created_at
        ? new Date(playlist.created_at).toLocaleDateString("en-US", {
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
                        Created {date}
                    </p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniStat label="Categories" value={playlist.categories_count} />
                <MiniStat label="Tracks" value={playlist.tracks_count} />
                <MiniStat label="Access" value="Locked" />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                <Link
                    href={playlistPath}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black! transition hover:bg-primary
                     hover:text-white!"
                >
                    <BiLinkExternal className="h-4 w-4" />
                    Open
                </Link>

                <button
                    type="button"
                    onClick={() => onCopy(playlist.share_token)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white/65
                    transition hover:bg-white/[0.09] hover:text-white"
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

function PlaylistSkeleton() {
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