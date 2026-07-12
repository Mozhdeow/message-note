"use client";

import React, { FormEvent, useState } from "react";
import { toast } from "sonner";
import { BiLockAlt } from "react-icons/bi";
import CosmicPlaylistView from "./CosmicPlaylistView";

export type PublicTrack = {
    id: number;
    category_id?: number;
    title: string;
    artist: string;
    album: string;
    file_url: string | null;
    cover_image: string | null;
    lyrics: string | null;
    description: string | null;
    duration: number;
};

export type PublicCategory = {
    id: number;
    name: string;
    description: string | null;
    sort_order: number;
    tracks: PublicTrack[];
};

export type PublicPlaylist = {
    id: number;
    title: string;
    receiver_name: string | null;
    receiver_message: string | null;
    cover_image: string | null;
    share_token: string;
    created_at: string;
    main_track: PublicTrack | null;
    categories: PublicCategory[];
};

export default function PublicPlaylistPage({ token }: { token: string }) {
    const [password, setPassword] = useState("");
    const [playlist, setPlaylist] = useState<PublicPlaylist | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUnlock = async (e: FormEvent) => {
        e.preventDefault();

        if (!password.trim()) {
            toast.error("Enter playlist password.");
            return;
        }

        setLoading(true);
        const loadingToast = toast.loading("Unlocking playlist...");

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
                        action: "get_public_playlist",
                        token,
                        password,
                    }).toString(),
                }
            );

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error("Invalid playlist response:", text);
                toast.error("Server returned an invalid response.", {
                    id: loadingToast,
                });
                return;
            }

            if (!result.success) {
                toast.error(result.message || "Could not unlock playlist.", {
                    id: loadingToast,
                });
                return;
            }

            setPlaylist(result.playlist);

            toast.success("Playlist unlocked.", {
                id: loadingToast,
            });
        } catch (error) {
            console.error(error);

            toast.error("Something went wrong.", {
                id: loadingToast,
            });
        } finally {
            setLoading(false);
        }
    };

    if (playlist) {
        return <CosmicPlaylistView playlist={playlist} token={token} />;
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-white">
            <CosmicBackground />

            <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
                <form
                    onSubmit={handleUnlock}
                    className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.045] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                >
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary">
                            <BiLockAlt className="h-9 w-9" />
                        </div>

                        <p className="text-xs font-black uppercase tracking-[0.35em] text-secondary">
                            Private Playlist
                        </p>

                        <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-tighter text-white">
                            Unlock Music
                        </h1>

                        <p className="mt-4 text-sm leading-7 text-white/45">
                            Enter the password you received to open this private music note.
                        </p>
                    </div>

                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="Playlist password"
                        className="input-login"
                        disabled={loading}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-submit mt-5 w-full bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Unlocking..." : "Unlock Playlist"}
                    </button>
                </form>
            </main>
        </div>
    );
}

function CosmicBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-[#02081a]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(162,89,255,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(35,177,216,0.12),transparent_26%),linear-gradient(180deg,#020817_0%,#06152d_100%)]" />

            <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:90px_90px]" />
        </div>
    );
}