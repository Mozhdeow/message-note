'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import gsap from 'gsap';

import Container from '@/components/Container';
import MusicCard from '@/components/MusicCard';
import { usePlayer } from '@/context/MusicPlayerContext';
import {BiMusic, BiX} from "react-icons/bi";
import {BsArrowLeft} from "react-icons/bs";
import {LuScrollText} from "react-icons/lu";
import {FiMessageCircle} from "react-icons/fi";

type TrackFromApi = {
    id: number;
    playlist_id?: number;
    category_id?: number | null;
    is_main?: number | boolean;

    title?: string;
    track_name?: string;
    artist?: string;
    artist_name?: string;
    album?: string;
    album_name?: string;

    file_url?: string | null;
    file?: string | null;

    cover_image?: string | null;
    cover?: string | null;

    lyrics?: string | null;
    lyric?: string | null;

    description?: string | null;
    chat?: string | null;

    duration?: number | string | null;
};

type Category = {
    id: number;
    name: string;
    description?: string | null;
    tracks?: TrackFromApi[];
};

type Playlist = {
    id: number;
    title: string;
    receiver_name?: string | null;
    receiver_message?: string | null;
    main_track?: TrackFromApi | null;
    categories?: Category[];
};

type ApiResponse = {
    success: boolean;
    message?: string;
    playlist?: Playlist;
    category?: Category;
    tracks?: TrackFromApi[];
};

type PlayerMusic = {
    id: number;
    name: string;
    track_name: string;
    artist: string;
    artist_name: string;
    album_name: string;
    file: string;
    file_url: string;
    cover: string;
    cover_image: string;
    lyrics: string;
    lyric: string;
    description: string;
    chat: string;
    duration?: number | string | null;
};

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

const getMediaUrl = (url?: string | null) => {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    const apiBase = process.env.NEXT_PUBLIC_PHP_API || '';
    const cleanBase = apiBase.replace(/\/$/, '');
    const cleanUrl = url
        .replace('../public/', '')
        .replace('public/', '')
        .replace(/^\//, '');

    if (!cleanBase) {
        return `/${cleanUrl}`;
    }

    return `${cleanBase}/${cleanUrl}`;
};

const normalizeTrack = (track: TrackFromApi): PlayerMusic => {
    const name = track.track_name || track.title || 'Unknown Track';
    const artist = track.artist_name || track.artist || 'Unknown Artist';
    const cover = track.cover_image || track.cover || '';
    const file = track.file_url || track.file || '';
    const lyrics = track.lyrics || track.lyric || '';
    const description = track.description || track.chat || '';

    return {
        id: Number(track.id),
        name,
        track_name: name,
        artist,
        artist_name: artist,
        album_name: track.album_name || track.album || '',
        file: getMediaUrl(file),
        file_url: getMediaUrl(file),
        cover: getMediaUrl(cover),
        cover_image: getMediaUrl(cover),
        lyrics,
        lyric: lyrics,
        description,
        chat: description,
        duration: track.duration || 0,
    };
};

export default function CategoryTracksPage() {
    const params = useParams();
    const router = useRouter();

    const token = params.id as string;
    const categoryId = params.categoryId as string;

    const [category, setCategory] = useState<Category | null>(null);
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [tracks, setTracks] = useState<PlayerMusic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const [contentModal, setContentModal] = useState<{
        open: boolean;
        type: 'lyrics' | 'chat';
        music: PlayerMusic | null;
    }>({
        open: false,
        type: 'lyrics',
        music: null,
    });

    const {
        currentMusic,
        isPlaying,
        currentTime,
        duration,
        togglePlay,
        seek,
        playMusic,
    } = usePlayer();

    const categoryTitle = useMemo(() => {
        return category?.name || `Category ${categoryId}`;
    }, [category, categoryId]);

    useEffect(() => {
        const fetchCategoryTracks = async () => {
            setIsLoading(true);
            setErrorMessage('');

            const apiBase = process.env.NEXT_PUBLIC_PHP_API;

            if (!apiBase) {
                setErrorMessage('NEXT_PUBLIC_PHP_API داخل env تنظیم نشده.');
                setIsLoading(false);
                return;
            }

            const endpoint = `${apiBase}/process.php`;

            try {
                const savedPassword = getStoredPlaylistPassword(token);


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
                        body,
                    });

                    const data: ApiResponse = await res.json();

                    if (!data.success || !data.playlist) {
                        throw new Error(data.message || 'خطا در دریافت پلی‌لیست.');
                    }

                    const selectedCategory =
                        data.playlist.categories?.find(
                            (item) => Number(item.id) === Number(categoryId)
                        ) || null;

                    if (!selectedCategory) {
                        throw new Error('این کتگوری داخل پلی‌لیست پیدا نشد.');
                    }

                    setPlaylist(data.playlist);
                    setCategory(selectedCategory);
                    setTracks((selectedCategory.tracks || []).map(normalizeTrack));
                    return;
                }

                const fallbackBody = new URLSearchParams();
                fallbackBody.append('action', 'get_category_tracks');

                const fallbackRes = await fetch(
                    `${endpoint}?category_id=${encodeURIComponent(categoryId)}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        credentials: 'include',
                        body: fallbackBody.toString(),
                    }
                );

                const fallbackData: ApiResponse = await fallbackRes.json();

                if (!fallbackData.success) {
                    throw new Error(fallbackData.message || 'خطا در دریافت موزیک‌های کتگوری.');
                }

                setCategory(
                    fallbackData.category || {
                        id: Number(categoryId),
                        name: `Category ${categoryId}`,
                    }
                );

                setTracks((fallbackData.tracks || []).map(normalizeTrack));
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'ارتباط با سرور برقرار نشد.';

                console.error('Category fetch error:', error);
                setErrorMessage(message);
                setTracks([]);
                setCategory(null);
                setPlaylist(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (token && categoryId) {
            fetchCategoryTracks();
        }
    }, [token, categoryId]);

    useEffect(() => {
        if (!isLoading && tracks.length > 0) {
            gsap.fromTo(
                '.track-card',
                {
                    opacity: 0,
                    y: 50,
                    scale: 0.9,
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    stagger: 0.1,
                    duration: 0.6,
                    ease: 'power3.out',
                }
            );
        }
    }, [isLoading, tracks]);

    const openLyrics = (music: PlayerMusic) => {
        setContentModal({
            open: true,
            type: 'lyrics',
            music,
        });
    };

    const openChat = (music: PlayerMusic) => {
        setContentModal({
            open: true,
            type: 'chat',
            music,
        });
    };

    const closeContentModal = () => {
        setContentModal({
            open: false,
            type: 'lyrics',
            music: null,
        });
    };

    if (isLoading) {
        return (
            <Container>
                <div className="min-h-screen flex items-center justify-center text-purple-400">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-t-2 border-purple-500 rounded-full animate-spin" />
                        <p>Loading cosmic tracks...</p>
                    </div>
                </div>
            </Container>
        );
    }

    if (errorMessage) {
        return (
            <Container>
                <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 text-white">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                        <BiMusic className="h-8 w-8" />
                    </div>

                    <h1 className="text-2xl font-black mb-3">Category Error</h1>
                    <p className="max-w-md text-white/60 leading-7">{errorMessage}</p>

                    <button
                        type="button"
                        onClick={() => router.push(`/playlist/${token}`)}
                        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-secondary"
                    >
                        <BsArrowLeft size={18} />
                        Back to playlist
                    </button>
                </div>
            </Container>
        );
    }

    return (
        <Container className="pb-28">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-10">
                <button
                    type="button"
                    onClick={() => router.push(`/playlist/${token}`)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
                >
                    <div className="p-2 bg-white/5 rounded-full group-hover:bg-purple-500/20 transition-all">
                        <BsArrowLeft size={20} />
                    </div>
                    <span>Back to Cosmic Tree</span>
                </button>

                <div className="mb-12 border-b border-white/10 pb-6">
                    {playlist?.title && (
                        <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
                            {playlist.title}
                        </p>
                    )}

                    <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        {categoryTitle}
                    </h1>

                    {category?.description && (
                        <p className="text-gray-400 mt-4 max-w-3xl leading-7">
                            {category.description}
                        </p>
                    )}

                    <p className="text-gray-500 mt-3 text-sm">
                        {tracks.length} track{tracks.length === 1 ? '' : 's'} in this sector
                    </p>
                </div>

                {tracks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md">
                        <BiMusic className="w-16 h-16 text-purple-500/30 mb-4" />
                        <h2 className="text-xl text-white mb-2">Silence in this sector</h2>
                        <p className="text-gray-400">
                            No tracks have been uploaded to this category yet.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center sm:justify-start gap-8">
                        {tracks.map((track, index) => (
                            <div key={track.id} className="track-card">
                                <MusicCard
                                    music={track}
                                    index={index}
                                    isPlaying={isPlaying}
                                    currentTime={currentTime}
                                    duration={duration}
                                    currentMusic={currentMusic}
                                    seek={seek}
                                    playMusic={playMusic}
                                    togglePlay={togglePlay}
                                    onLyrics={() => openLyrics(track)}
                                    onChat={() => openChat(track)}
                                    categoryMusic={tracks}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {contentModal.open && contentModal.music && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
                    <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#11111a]/95 p-6 shadow-2xl shadow-primary/20">
                        <button
                            type="button"
                            onClick={closeContentModal}
                            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                        >
                            <BiX size={18} />
                        </button>

                        <div className="mb-6 flex items-center gap-3 pr-12">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                                {contentModal.type === 'lyrics' ? (
                                    <LuScrollText size={24} />
                                ) : (
                                    <FiMessageCircle size={24} />
                                )}
                            </div>

                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/35">
                                    {contentModal.type === 'lyrics' ? 'Lyrics' : 'Message'}
                                </p>
                                <h3 className="text-xl font-black text-white">
                                    {contentModal.music.name}
                                </h3>
                            </div>
                        </div>

                        <div className="max-h-[55vh] overflow-y-auto px-2 text-center leading-8 text-white/80">
                            {(contentModal.type === 'lyrics'
                                    ? contentModal.music.lyrics
                                    : contentModal.music.description
                            )
                                ?.split('\n')
                                .map((line, index) => (
                                    <p key={index} className="mb-2">
                                        {line}
                                    </p>
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
}