'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import gsap from 'gsap';

import Brain from './ui/Brain';
import Line from './ui/Line';
import ResponsiveTreeSlider from '@/components/ResponsiveTreeSlider';
import BottomMenu from '@/components/BottomMenu';

type LineVariant = 'blue' | 'pink' | 'purple' | 'orange';
type HoverLine = 'left' | 'right';

interface TrackFromApi {
    id: number;
    title?: string;
    artist?: string;
    album?: string;
    track_name?: string;
    artist_name?: string;
    album_name?: string;
    file_url?: string | null;
    cover_image?: string | null;
    lyrics?: string | null;
    description?: string | null;
    duration?: number | string | null;
}

interface MainTrackForBrain {
    id: number;
    track_name: string;
    artist_name: string;
    album_name?: string;
    file_url?: string;
    cover_image?: string;
    lyrics?: string;
    description?: string;
    duration?: number | string | null;
}

interface Category {
    id: number;
    name: string;
    description: string;
    sort_order?: number;
    tracks?: TrackFromApi[];
}

interface Playlist {
    id: number;
    title: string;
    receiver_name?: string;
    receiver_message?: string;
    cover_image?: string | null;
    share_token?: string;
    created_at?: string;
    main_track?: TrackFromApi | null;
    categories?: Category[];
}

interface ApiResponse {
    success: boolean;
    message?: string;
    playlist?: Playlist;
    categories?: Category[];
    main_track?: TrackFromApi | null;
}

interface TreeProps {
    password?: string | null;
    adminPreview?: boolean;
    tokenOverride?: string | null;
}


const LINE_CONFIGS: {
    variant: LineVariant;
    hoverLine?: HoverLine;
    duration?: number;
}[] = [
    { variant: 'blue' },
    { variant: 'pink' },
    { variant: 'purple', duration: 0.5 },
    { variant: 'orange', duration: 0.6 },
    { variant: 'orange', hoverLine: 'right', duration: 0.6 },
    { variant: 'purple', hoverLine: 'right', duration: 0.5 },
    { variant: 'pink', hoverLine: 'right' },
    { variant: 'blue', hoverLine: 'right' },
];

const getStoredPlaylistPassword = (token: string) => {
    if (typeof window === 'undefined') return '';

    const possibleKeys = [
        `playlist_password_${token}`,
        `playlistPassword_${token}`,
        `playlist-access-password-${token}`,
        'playlist_password',
        'playlistPassword',
    ];

    for (const key of possibleKeys) {
        const value = sessionStorage.getItem(key);
        if (value) return value;
    }

    return '';
};

const normalizeMainTrack = (track?: TrackFromApi | null): MainTrackForBrain | null => {
    if (!track) return null;

    const fileUrl = track.file_url || '';
    const name = track.track_name || track.title || '';

    if (!fileUrl && !name) return null;

    return {
        id: Number(track.id),
        track_name: name || 'Main Music',
        artist_name: track.artist_name || track.artist || 'Unknown Artist',
        album_name: track.album_name || track.album || '',
        file_url: fileUrl,
        cover_image: track.cover_image || '',
        lyrics: track.lyrics || '',
        description: track.description || '',
        duration: track.duration || 0,
    };
};

function Tree({
                  password = null,
                  adminPreview = false,
                  tokenOverride = null,
              }: TreeProps) {
    const params = useParams();
    const routeToken = params.id as string;
    const token = tokenOverride || routeToken;

    const lineRef = useRef<HTMLDivElement>(null);

    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [mainTrack, setMainTrack] = useState<MainTrackForBrain | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const visibleCategories = useMemo(() => {
        return categories.slice(0, 8);
    }, [categories]);

    const leftCategories = useMemo(() => {
        return visibleCategories.slice(0, 4);
    }, [visibleCategories]);

    const rightCategories = useMemo(() => {
        return visibleCategories.slice(4, 8);
    }, [visibleCategories]);

    useEffect(() => {
        const fetchPlaylist = async () => {
            setIsLoading(true);
            setErrorMessage('');

            if (!token) {
                setErrorMessage('Invalid playlist token.');
                setIsLoading(false);
                return;
            }

            const apiBase = process.env.NEXT_PUBLIC_PHP_API;

            if (!apiBase) {
                setErrorMessage('API URL is not configured.');
                setIsLoading(false);
                return;
            }

            const endpoint = `${apiBase}/process.php`;
            const savedPassword = password || getStoredPlaylistPassword(token);

            try {
                if (adminPreview) {
                    const body = new URLSearchParams();
                    body.append("action", "admin_get_playlist_preview");
                    body.append("token", token);

                    const res = await fetch(endpoint, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        credentials: "include",
                        body: body.toString(),
                    });

                    const data: ApiResponse = await res.json();

                    if (!data.success || !data.playlist) {
                        throw new Error(data.message || "Could not load admin playlist preview.");
                    }

                    setPlaylist(data.playlist);
                    setCategories(data.playlist.categories || data.categories || []);
                    setMainTrack(normalizeMainTrack(data.playlist.main_track || data.main_track || null));

                    return;
                }
                if (savedPassword) {
                    const body = new URLSearchParams();
                    body.append('action', 'get_public_playlist');
                    body.append('token', token);
                    body.append('password', savedPassword);

                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        credentials: 'include',
                        body: body.toString(),
                    });

                    const data: ApiResponse = await res.json();

                    if (!data.success || !data.playlist) {
                        throw new Error(data.message || 'Could not load playlist.');
                    }

                    setPlaylist(data.playlist);
                    setCategories(data.playlist.categories || []);
                    setMainTrack(normalizeMainTrack(data.playlist.main_track));

                    return;
                }

                const fallbackBody = new URLSearchParams();
                fallbackBody.append('action', 'get_playlist_data');
                fallbackBody.append('token', token);

                const fallbackRes = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    credentials: 'include',
                    body: fallbackBody.toString(),
                });

                const fallbackData: ApiResponse = await fallbackRes.json();

                if (!fallbackData.success) {
                    throw new Error(fallbackData.message || 'Could not load playlist data.');
                }

                const nextPlaylist = fallbackData.playlist || null;
                const nextCategories =
                    fallbackData.categories ||
                    nextPlaylist?.categories ||
                    [];

                const nextMainTrack =
                    fallbackData.main_track ||
                    nextPlaylist?.main_track ||
                    null;

                setPlaylist(nextPlaylist);
                setCategories(nextCategories);
                setMainTrack(normalizeMainTrack(nextMainTrack));
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'Could not connect to the server.';

                console.error('Tree fetch error:', error);
                setErrorMessage(message);
                setPlaylist(null);
                setCategories([]);
                setMainTrack(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlaylist();
    }, [token, password, adminPreview]);

    useEffect(() => {
        if (!lineRef.current || isLoading) return;

        gsap.fromTo(
            lineRef.current,
            {
                scaleY: 0,
                transformOrigin: 'bottom center',
                opacity: 0,
            },
            {
                scaleY: 1,
                opacity: 1,
                duration: 2.5,
                ease: 'power3.out',
            }
        );
    }, [isLoading]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Loading your cosmic journey...
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 text-white">
                <p className="text-xl font-semibold mb-3">Error</p>
                <p className="text-white/70">{errorMessage}</p>
            </div>
        );
    }

    return (
        <div
            dir="ltr"
            className="relative min-h-screen overflow-hidden w-full flex flex-col items-center px-4 md:px-6 xl:px-10"
        >
            <div className="relative z-30 w-[180px] sm:w-[240px] md:w-[280px] h-[96px] sm:h-[106px] md:h-[100px] flex items-center justify-center mt-8 md:mt-10">
                <Brain mainTrack={mainTrack} />
            </div>

            {playlist?.title && (
                <div className="relative z-30 text-center mt-3 mb-2">
                    <h1 className="text-white text-xl sm:text-2xl font-semibold">
                        {playlist.title}
                    </h1>

                    {playlist.receiver_name && (
                        <p className="text-white/60 text-sm mt-1">
                            For {playlist.receiver_name}
                        </p>
                    )}
                </div>
            )}

            <div className="lg:hidden w-full flex-1 flex items-center justify-center">
                <ResponsiveTreeSlider categories={visibleCategories} />
            </div>

            <div className="hidden lg:block absolute inset-x-0 top-[220px] bottom-[100px] z-10 pointer-events-none">
                <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex items-center justify-center">
                    <div className="absolute h-full w-[3px] bg-rose-600 rounded-full opacity-30" />

                    <div
                        ref={lineRef}
                        className="relative h-full w-[3px] bg-rose-600 rounded-full shadow-md shadow-rose-600/50 before:content-[''] before:absolute before:-inset-1 before:bg-rose-600
                         before:opacity-60 before:blur-md after:content-[''] after:absolute after:-inset-1 after:bg-rose-600 after:opacity-50 after:blur-xl"
                    />
                </div>
            </div>

            <div className="hidden lg:flex relative z-20 w-full max-w-[1700px] flex-1 items-end justify-center gap-[2.5vw] pb-[100px]">
                <div className="flex flex-1 items-end justify-end gap-[2.5vw] ">
                    {leftCategories.map((cat, index) => {
                        const config = LINE_CONFIGS[index];

                        return (
                            <Line
                                key={cat.id}
                                id={cat.id}
                                variant={config.variant}
                                duration={config.duration}
                                title={cat.name}
                                description={cat.description}
                            />
                        );
                    })}
                </div>

                <div className="w-[10px] shrink-0" />

                <div className="flex flex-1 items-end justify-start gap-[2.5vw] ">
                    {rightCategories.map((cat, index) => {
                        const config = LINE_CONFIGS[index + 4];

                        return (
                            <Line
                                key={cat.id}
                                id={cat.id}
                                variant={config.variant}
                                hoverLine={config.hoverLine}
                                duration={config.duration}
                                title={cat.name}
                                description={cat.description}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-30 w-full flex items-center justify-center">
                <div className="lg:w-[40vw] w-[85vw] h-[50px] sm:h-[70px] md:h-[100px] flex items-center justify-center border-2 border-rose-600 shadow-2xl shadow-rose-600/70 px-4
                 rounded-lg bg-black/10 backdrop-blur-sm">
                    <BottomMenu />
                </div>
            </div>
        </div>
    );
}

export default Tree;