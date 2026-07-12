'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import Modal from '@/components/ui/Modal';
import {usePlayer} from '@/context/MusicPlayerContext';

type MainTrack = {
    id: number | string;
    playlist_id?: number | string;
    category_id?: number | string | null;
    is_main?: number | boolean;

    track_name?: string;
    artist_name?: string;
    album_name?: string;
    file_url?: string;
    cover_image?: string;
    lyrics?: string;
    description?: string;
    duration?: number | string | null;

    audioName?: string;
    audioArtist?: string;
    audioAlbum?: string;
    audioFile?: string;
    audioCover?: string;
    audioLyric?: string;
};

type BrainProps = {
    mainTrack?: MainTrack | null;
};

const PLACEHOLDER_COVER = '/images/placeholder-music.png';

const toMediaUrl = (url?: string | null) => {
    if (!url) return '';

    const cleanUrl = url
        .replace('../public/', '')
        .replace('public/', '')
        .trim();

    if (!cleanUrl) return '';

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        return cleanUrl;
    }

    if (cleanUrl.startsWith('/images/')) {
        return cleanUrl;
    }

    const apiBase = process.env.NEXT_PUBLIC_PHP_API || '';
    const cleanBase = apiBase.replace(/\/$/, '');
    const finalUrl = cleanUrl.replace(/^\//, '');

    return cleanBase ? `${cleanBase}/${finalUrl}` : `/${finalUrl}`;
};

const Brain: React.FC<BrainProps> = ({mainTrack}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [modalType, setModalType] = useState<'chat' | 'lyrics'>('chat');

    const ringRef = useRef<HTMLDivElement | null>(null);
    const glowRef = useRef<HTMLDivElement | null>(null);
    const hasAutoPlayed = useRef(false);

    const {playMusic, currentMusic} = usePlayer();

    const music = useMemo(() => {
        if (!mainTrack) return null;

        const name = mainTrack.track_name || mainTrack.audioName || 'Main Music';
        const artist = mainTrack.artist_name || mainTrack.audioArtist || 'Unknown Artist';
        const album = mainTrack.album_name || mainTrack.audioAlbum || '';
        const file = mainTrack.file_url || mainTrack.audioFile || '';
        const cover = mainTrack.cover_image || mainTrack.audioCover || '';
        const lyrics = mainTrack.lyrics || mainTrack.audioLyric || '';
        const description = mainTrack.description || '';

        return {
            id: mainTrack.id,
            name,
            track_name: name,
            artist,
            artist_name: artist,
            album_name: album,
            file,
            file_url: file,
            cover: toMediaUrl(cover) || PLACEHOLDER_COVER,
            cover_image: toMediaUrl(cover) || PLACEHOLDER_COVER,
            lyrics,
            lyric: lyrics,
            description,
            chat: description,
            category: 'brain',
            isBrain: true,
        };
    }, [mainTrack]);

    useEffect(() => {
        if (!ringRef.current) return;

        gsap.to(ringRef.current, {
            rotation: 360,
            duration: 8,
            repeat: -1,
            ease: 'linear',
        });

        return () => {
            if (ringRef.current) {
                gsap.killTweensOf(ringRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!glowRef.current) return;

        gsap.to(glowRef.current, {
            scale: 1.08,
            opacity: 0.85,
            duration: 1.4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
        });

        return () => {
            if (glowRef.current) {
                gsap.killTweensOf(glowRef.current);
            }
        };
    }, []);

    const handleOpen = () => {
        if (!music) return;

        setModalType('chat');
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        if (isOpen && music && !hasAutoPlayed.current) {
            playMusic(music, [music], 0);
            hasAutoPlayed.current = true;
        }

        if (!isOpen) {
            hasAutoPlayed.current = false;
        }
    }, [isOpen, music, playMusic]);

    useEffect(() => {
        if (!isOpen || !music) return;

        const audio = document.querySelector('audio');
        if (!audio) return;

        const handleEnded = () => {
            if (String(currentMusic?.id) !== String(music.id)) return;

            setTimeout(() => {
                playMusic(music, [music], 0);
            }, 50);
        };

        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('ended', handleEnded);
        };
    }, [isOpen, music, currentMusic?.id, playMusic]);

    const hasLyrics = Boolean(music?.lyrics);
    const hasChat = Boolean(music?.description);

    return (
        <div className="flex items-center justify-center">
            <button
                type="button"
                onClick={handleOpen}
                disabled={!music}
                className={`relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full transition duration-300 ${
                    music
                        ? 'cursor-pointer hover:scale-110 active:scale-95'
                        : 'cursor-not-allowed opacity-40'
                }`}
            >
                <div
                    ref={glowRef}
                    className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
                />

                <div
                    ref={ringRef}
                    className="
                        absolute inset-0 rounded-full
                        border-2 border-transparent
                        bg-[conic-gradient(from_0deg,#A259FF,#ff4fb8,#38bdf8,#A259FF)]
                        p-[2px]
                    "
                >
                    <div className="h-full w-full rounded-full bg-black/80"/>
                </div>

                <div
                    className="relative z-10 flex h-[82px] w-[82px] sm:h-[94px] sm:w-[94px] items-center justify-center rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md">
                    <Image
                        src="/images/head-brain_vectorized.png"
                        alt="main music"
                        width={200}
                        height={200}
                        priority
                        className="w-16 sm:w-20 drop-shadow-[0_0_18px_rgba(162,89,255,0.65)]"
                    />
                </div>
            </button>

            {music && (
                <Modal
                    isOpen={isOpen}
                    closeModal={closeModal}
                    title={music.name}
                >
                    <div className="flex flex-col items-center text-center">
                        <div
                            className="relative mb-5 h-28 w-28 overflow-hidden rounded-full border border-primary/40 shadow-2xl shadow-primary/20">
                            <Image
                                src={music.cover_image || PLACEHOLDER_COVER}
                                alt={music.name}
                                width={160}
                                height={160}
                                unoptimized
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <h2 className="text-xl font-black text-white">
                            {music.name}
                        </h2>

                        <p className="mt-1 text-sm font-bold text-white/50">
                            {music.artist}
                        </p>

                        {music.album_name && (
                            <p className="mt-1 text-xs text-white/30">
                                {music.album_name}
                            </p>
                        )}

                        <div className="mt-6 mb-5 flex justify-center gap-3">
                            {hasChat && (
                                <button
                                    type="button"
                                    onClick={() => setModalType('chat')}
                                    className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                                        modalType === 'chat'
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                    }`}
                                >
                                    chat
                                </button>
                            )}

                            {hasLyrics && (
                                <button
                                    type="button"
                                    onClick={() => setModalType('lyrics')}
                                    className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                                        modalType === 'lyrics'
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                    }`}
                                >
                                    lyric
                                </button>
                            )}

                        </div>

                        <div className="mb-4 h-1.5 w-20 rounded-full bg-third"/>

                        <div className="lyrics-scroll max-h-[45vh] w-full overflow-y-auto px-4 sm:px-8">
                            {modalType === 'chat' && (
                                <>
                                    {music.description.split('\n').map((line, index) => (
                                        <p
                                            key={index}
                                            className="mb-2 text-center text-lg leading-8 text-white/85"
                                        >
                                            {line}
                                        </p>
                                    ))}
                                </>
                            )}

                            {modalType === 'lyrics' && (
                                <>
                                    {hasLyrics ? (
                                        music.lyrics.split('\n').map((line, index) => (
                                            <p
                                                key={index}
                                                className="mb-2 text-center text-lg leading-8 text-white/85"
                                            >
                                                {line}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-center text-white/50">
                                            Lyric برای این موزیک ثبت نشده.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Brain;