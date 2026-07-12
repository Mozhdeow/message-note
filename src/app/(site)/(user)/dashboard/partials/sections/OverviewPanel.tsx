"use client";

import React, {useEffect, useState} from "react";
import Link from "next/link";
import {
    BiBell,
    BiMusic,
    BiPlus,
    BiSolidPlaylist,
} from "react-icons/bi";
import {toast} from "sonner";

import type {ProfileUser} from "../ProfileTypes";
import GlassCard from "../GlassCard";
import ProfileSectionHeader from "../ProfileSectionHeader";

type DashboardSummary = {
    stats: {
        created_playlists: number;
        opened_playlists: number;
        unread_notifications: number;
    };
    latest_playlists: {
        id: number;
        title: string;
        cover_image?: string | null;
        share_token?: string;
        created_at: string;
        view_count?: number;
    }[];
};

const getImageUrl = (url?: string | null) => {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    const apiBase = process.env.NEXT_PUBLIC_PHP_API || "";
    const cleanBase = apiBase.replace(/\/$/, "");
    const cleanUrl = url.replace(/^\//, "");

    return cleanBase ? `${cleanBase}/${cleanUrl}` : `/${cleanUrl}`;
};

export default function OverviewPanel({user}: { user: ProfileUser }) {
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const displayName =
        user.full_name || user.username || user.email || "Message Note User";

    useEffect(() => {
        const loadDashboard = async () => {
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
                            action: "dashboard_summary",
                        }).toString(),
                    }
                );

                const text = await res.text();

                let result;

                try {
                    result = JSON.parse(text);
                } catch {
                    console.error("Invalid dashboard response:", text);
                    toast.error("Server returned an invalid response.");
                    return;
                }

                if (!result.success) {
                    toast.error(result.message || "Could not load dashboard.");
                    return;
                }

                setData(result.data);
            } catch (error) {
                console.error(error);
                toast.error("Something went wrong while loading dashboard.");
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    return (
        <div>
            <ProfileSectionHeader
                eyebrow="Dashboard"
                title={`Welcome, ${displayName}`}
                description="A quick look at your playlists, unlocked music notes and unread notifications."
            />

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-3">
                    <SkeletonCard/>
                    <SkeletonCard/>
                    <SkeletonCard/>
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <DashboardStatCard
                            title="Created Playlists"
                            value={data?.stats.created_playlists ?? 0}
                            icon={BiSolidPlaylist}
                            tone="primary"
                        />

                        <DashboardStatCard
                            title="Opened Playlists"
                            value={data?.stats.opened_playlists ?? 0}
                            icon={BiMusic}
                            tone="secondary"
                        />

                        <DashboardStatCard
                            title="Unread Notifications"
                            value={data?.stats.unread_notifications ?? 0}
                            icon={BiBell}
                            tone="pink"
                        />
                    </div>

                    <div className="mt-6">
                        <GlassCard>
                            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.3em] text-white/35">
                                        Latest Playlists
                                    </p>

                                    <h3 className="mt-2 text-2xl font-black text-white">
                                        Your recent music notes
                                    </h3>
                                </div>

                                <Link
                                    href="/dashboard/profile?tab=create-playlist"
                                    className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black!  transition hover:bg-primary hover:text-white!"
                                >
                                    <BiPlus className="h-5 w-5"/>
                                    Create Playlist
                                </Link>
                            </div>

                            {!data?.latest_playlists.length ? (
                                <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center">
                                    <p className="text-lg font-black text-white">
                                        No playlists yet.
                                    </p>

                                    <p className="mt-2 text-sm text-white/45">
                                        Create your first private playlist and share it with a password.
                                    </p>

                                    <Link
                                        href="/dashboard/profile?tab=create-playlist"
                                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-secondary"
                                    >
                                        <BiPlus className="h-5 w-5"/>
                                        Start Creating
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {data.latest_playlists.map((playlist) => (
                                        <PlaylistRow key={playlist.id} playlist={playlist}/>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    </div>
                </>
            )}
        </div>
    );
}

function DashboardStatCard({
                               title,
                               value,
                               icon: Icon,
                               tone,
                           }: {
    title: string;
    value: number;
    icon: React.ElementType;
    tone: "primary" | "secondary" | "pink";
}) {
    const tones = {
        primary: "bg-primary/15 text-primary",
        secondary: "bg-secondary/15 text-secondary",
        pink: "bg-pink-500/15 text-pink-300",
    };

    return (
        <GlassCard className="transition hover:-translate-y-1 hover:bg-white/[0.05]">
            <div
                className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}
            >
                <Icon className="h-6 w-6"/>
            </div>

            <p className="text-4xl font-black text-white">
                {String(value).padStart(2, "0")}
            </p>

            <p className="mt-2 text-xs font-black uppercase tracking-wider text-white/35">
                {title}
            </p>
        </GlassCard>
    );
}

function PlaylistRow({
                         playlist,
                     }: {
    playlist: {
        id: number;
        title: string;
        cover_image?: string | null;
        share_token?: string;
        created_at: string;
        view_count?: number;
    };
}) {
    const date = new Date(playlist.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:bg-white/[0.05]">
            <div className="flex min-w-0 items-center gap-4">
                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/15 text-primary">
                    {playlist.cover_image ? (
                        <img
                            src={getImageUrl(playlist.cover_image)}
                            alt={playlist.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <BiMusic className="h-7 w-7"/>
                    )}
                </div>

                <div className="min-w-0">
                    <h4 className="truncate font-black text-white">{playlist.title}</h4>

                    <p className="mt-1 text-xs text-white/35">
                        Created at {date}
                    </p>
                </div>
            </div>

            <div className="ml-4 flex shrink-0 items-center gap-3">
        <span
            className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/45 sm:inline-flex">
          {playlist.view_count ?? 0} views
        </span>

                <Link
                    href={`/playlist/${playlist.id}`}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black uppercase tracking-wider text-white/60 transition hover:bg-white/[0.1] hover:text-white"
                >
                    Open
                </Link>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <GlassCard>
            <div className="mb-5 h-12 w-12 animate-pulse rounded-2xl bg-white/10"/>
            <div className="h-9 w-20 animate-pulse rounded-xl bg-white/10"/>
            <div className="mt-3 h-4 w-32 animate-pulse rounded-xl bg-white/10"/>
        </GlassCard>
    );
}