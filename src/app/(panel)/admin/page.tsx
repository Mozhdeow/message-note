"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
    BiLoaderAlt,
    BiRefresh,
    BiSolidPlaylist,
    BiSupport,
    BiUser,
    BiHistory,
    BiRightArrowAlt,
} from "react-icons/bi";

type AdminDashboardSummary = {
    stats: {
        users_count: number;
        playlists_count: number;
        open_tickets_count: number;
        opened_playlists_count: number;
    };
    latest_open_tickets: {
        id: number;
        subject?: string | null;
        message: string;
        status: "open" | "answered" | "closed";
        created_at?: string | null;
        user_name?: string | null;
        user_email?: string | null;
    }[];
};

type Accent = "violet" | "fuchsia" | "amber" | "cyan";

const ACCENTS: Record<
    Accent,
    { icon: string; ring: string; bar: string; glow: string }
> = {
    violet: {
        icon: "bg-violet-500/15 text-violet-300 group-hover:bg-violet-500 group-hover:text-white",
        ring: "group-hover:shadow-violet-500/20",
        bar: "from-violet-500 to-violet-300",
        glow: "bg-violet-500/20",
    },
    fuchsia: {
        icon: "bg-fuchsia-500/15 text-fuchsia-300 group-hover:bg-fuchsia-500 group-hover:text-white",
        ring: "group-hover:shadow-fuchsia-500/20",
        bar: "from-fuchsia-500 to-fuchsia-300",
        glow: "bg-fuchsia-500/20",
    },
    amber: {
        icon: "bg-amber-500/15 text-amber-300 group-hover:bg-amber-500 group-hover:text-white",
        ring: "group-hover:shadow-amber-500/20",
        bar: "from-amber-500 to-amber-300",
        glow: "bg-amber-500/20",
    },
    cyan: {
        icon: "bg-cyan-500/15 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-white",
        ring: "group-hover:shadow-cyan-500/20",
        bar: "from-cyan-500 to-cyan-300",
        glow: "bg-cyan-500/20",
    },
};

const formatDate = (value?: string | null) => {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function AdminDashboardPage() {
    const [data, setData] = useState<AdminDashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_PHP_API}/process.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    action: "admin_dashboard_summary",
                }).toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid admin dashboard response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!result.success) {
                throw new Error(result.message || "Could not load dashboard.");
            }

            setData(result.data);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while loading dashboard.";

            console.error(error);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const statValues = [
        data?.stats.users_count ?? 0,
        data?.stats.playlists_count ?? 0,
        data?.stats.open_tickets_count ?? 0,
        data?.stats.opened_playlists_count ?? 0,
    ];
    const maxStat = Math.max(1, ...statValues);

    return (
        <div className="relative space-y-6">

            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />
                <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-cyan-500/[0.06] blur-[120px]" />
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-secondary-background/30 p-7 backdrop-blur-xl">
                <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/10 blur-3xl" />

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                            </span>
                            Admin Overview
                        </p>

                        <h1 className="text-4xl font-black text-white">
                            Admin Dashboard
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                            Quick control center for users, playlists and support tickets.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadDashboard}
                        disabled={loading}
                        className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-secondary-background/50 px-5 py-3 text-xs font-black uppercase
                         tracking-wider text-white/80 transition hover:bg-white hover:text-secondary-background disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <BiLoaderAlt className="h-5 w-5 animate-spin" />
                        ) : (
                            <BiRefresh className="h-5 w-5" />
                        )}
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatSkeleton />
                    <StatSkeleton />
                    <StatSkeleton />
                    <StatSkeleton />
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Users"
                        value={data?.stats.users_count ?? 0}
                        icon={BiUser}
                        href="/admin/users"
                        accent="violet"
                        percent={(statValues[0] / maxStat) * 100}
                    />

                    <StatCard
                        title="Playlists"
                        value={data?.stats.playlists_count ?? 0}
                        icon={BiSolidPlaylist}
                        href="/admin/playlists"
                        accent="fuchsia"
                        percent={(statValues[1] / maxStat) * 100}
                    />

                    <StatCard
                        title="Open Tickets"
                        value={data?.stats.open_tickets_count ?? 0}
                        icon={BiSupport}
                        href="/admin/tickets"
                        accent="amber"
                        percent={(statValues[2] / maxStat) * 100}
                        highlight={(data?.stats.open_tickets_count ?? 0) > 0}
                    />

                    <StatCard
                        title="Opened Records"
                        value={data?.stats.opened_playlists_count ?? 0}
                        icon={BiHistory}
                        href="/admin/playlists?tab=opened"
                        accent="cyan"
                        percent={(statValues[3] / maxStat) * 100}
                    />
                </div>
            )}

            <div className="rounded-[2rem] border border-white/10 bg-secondary-background/30 p-5 backdrop-blur-xl">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/35">
                            Support
                        </p>

                        <h2 className="mt-2 text-2xl font-black text-white">
                            Latest open tickets
                        </h2>
                    </div>

                    <Link
                        href="/admin/tickets"
                        className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black! transition
                         hover:bg-primary hover:text-white!"
                    >
                        <BiSupport className="h-5 w-5" />
                        Manage Tickets
                    </Link>
                </div>

                {loading ? (
                    <div className="grid gap-3">
                        <TicketSkeleton />
                        <TicketSkeleton />
                        <TicketSkeleton />
                    </div>
                ) : !data?.latest_open_tickets.length ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-10 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                            <BiSupport className="h-7 w-7" />
                        </div>
                        <p className="text-lg font-black text-white">
                            No open tickets.
                        </p>

                        <p className="mt-2 text-sm text-white/45">
                            Everything looks clear for now.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {data.latest_open_tickets.map((ticket) => (
                            <TicketRow key={ticket.id} ticket={ticket} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({
                      title,
                      value,
                      icon: Icon,
                      href,
                      accent,
                      percent,
                      highlight,
                  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    href: string;
    accent: Accent;
    percent: number;
    highlight?: boolean;
}) {
    const a = ACCENTS[accent];

    return (
        <Link
            href={href}
            className={`group relative overflow-hidden rounded-[2rem] border p-5 backdrop-blur-xl shadow-lg shadow-transparent transition
            hover:-translate-y-1 hover:bg-secondary-background ${a.ring}
            ${highlight ? "border-amber-400/30 bg-amber-500/[0.04]" : "border-white/10 bg-secondary-background/30"}`}
        >
            <div className={`pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full ${a.glow} blur-3xl opacity-0 transition-opacity group-hover:opacity-100`} />

            <div className="relative flex items-start justify-between">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl transition ${a.icon}`}>
                    <Icon className="h-6 w-6" />
                </div>

                <BiRightArrowAlt className="h-5 w-5 -translate-x-1 text-white/0 transition group-hover:translate-x-0 group-hover:text-white/30" />
            </div>

            <p className="text-4xl font-black tabular-nums text-white">
                {String(value).padStart(2, "0")}
            </p>

            <p className="mt-2 text-xs font-black uppercase tracking-wider text-white/35">
                {title}
            </p>

            <div className="relative mt-4 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${a.bar} transition-all duration-700`}
                    style={{ width: `${Math.max(6, percent)}%` }}
                />
            </div>
        </Link>
    );
}

function TicketRow({
                       ticket,
                   }: {
    ticket: {
        id: number;
        subject?: string | null;
        message: string;
        created_at?: string | null;
        user_name?: string | null;
        user_email?: string | null;
    };
}) {
    const initial = (ticket.user_name || ticket.user_email || "?")
        .trim()
        .charAt(0)
        .toUpperCase();

    return (
        <Link
            href="/admin/tickets"
            className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-amber-400/20
            hover:bg-white/[0.055] sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xs font-black text-white/70">
                    {initial}
                </div>

                <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            Open
                        </span>

                        <span className="text-[10px] font-black uppercase tracking-wider text-white/25">
                            #{ticket.id}
                        </span>
                    </div>

                    <h3 className="truncate font-black text-white">
                        {ticket.subject || "No subject"}
                    </h3>

                    <p className="mt-1 line-clamp-1 text-xs leading-5 text-white/40">
                        {ticket.message}
                    </p>
                </div>
            </div>

            <div className="shrink-0 pl-12 text-left sm:pl-0 sm:text-right">
                <p className="text-xs font-bold text-white/55">
                    {ticket.user_name || ticket.user_email || "Unknown user"}
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/25">
                    {formatDate(ticket.created_at)}
                </p>
            </div>
        </Link>
    );
}

function StatSkeleton() {
    return (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
            <div className="mb-5 h-12 w-12 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-10 w-20 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-3 h-4 w-32 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-4 h-1 w-full animate-pulse rounded-full bg-white/10" />
        </div>
    );
}

function TicketSkeleton() {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="h-5 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-6 w-1/2 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-3 h-4 w-full animate-pulse rounded-xl bg-white/10" />
        </div>
    );
}