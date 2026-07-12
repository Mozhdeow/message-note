'use client';

import { usePlayer } from '@/context/MusicPlayerContext';
import Image from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { truncateText, useIsDesktop } from '@/utils/truncate';
import { formatTime } from '@/utils/formatTime';

export const PLACEHOLDER_COVER = '/images/placeholder-music.png';

const getMediaSrc = (rawUrl?: string | null) => {
    if (!rawUrl) return PLACEHOLDER_COVER;

    let url = rawUrl
        .replace('../public/', '')
        .replace('public/', '')
        .replace('action/', '')
        .trim();

    if (!url) return PLACEHOLDER_COVER;

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    if (url.startsWith('/')) {
        return url;
    }

    const apiBase = process.env.NEXT_PUBLIC_PHP_API || '';
    const cleanBase = apiBase.replace(/\/$/, '');
    const cleanUrl = url.replace(/^\//, '');

    return cleanBase ? `${cleanBase}/${cleanUrl}` : `/${cleanUrl}`;
};

export default function GlobalPlayer() {
    const isDesktop = useIsDesktop();

    const {
        currentMusic,
        isPlaying,
        togglePlay,
        next,
        prev,
        close,
        currentTime,
        duration,
        seek,
    } = usePlayer();

    const imgRef = useRef<HTMLImageElement | null>(null);
    const progressRef = useRef<HTMLDivElement | null>(null);

    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);

    const coverSrc = useMemo(() => {
        return getMediaSrc(currentMusic?.cover_image || currentMusic?.cover);
    }, [currentMusic]);

    const title = currentMusic?.name || currentMusic?.track_name || 'Unknown Track';
    const artist = currentMusic?.artist || currentMusic?.artist_name || 'Unknown Artist';

    const progressTime = isSeeking ? seekValue : currentTime;

    const progressPercent =
        duration > 0 ? Math.min((progressTime / duration) * 100, 100) : 0;

    useEffect(() => {
        if (!isSeeking) {
            setSeekValue(currentTime);
        }
    }, [currentTime, isSeeking]);

    useEffect(() => {
        if (!imgRef.current) return;

        if (isPlaying) {
            gsap.to(imgRef.current, {
                rotation: 360,
                duration: 10,
                repeat: -1,
                ease: 'linear',
            });
        } else {
            gsap.killTweensOf(imgRef.current);
        }

        return () => {
            if (imgRef.current) {
                gsap.killTweensOf(imgRef.current);
            }
        };
    }, [isPlaying, currentMusic?.id]);

    const getTimeFromPointer = (clientX: number) => {
        if (!progressRef.current || !duration) return 0;

        const rect = progressRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(x / rect.width, 1));

        return percent * duration;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!duration) return;

        const nextTime = getTimeFromPointer(e.clientX);

        setIsSeeking(true);
        setSeekValue(nextTime);
        seek(nextTime);

        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isSeeking || !duration) return;

        const nextTime = getTimeFromPointer(e.clientX);

        setSeekValue(nextTime);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!duration) return;

        const nextTime = getTimeFromPointer(e.clientX);

        setSeekValue(nextTime);
        seek(nextTime);
        setIsSeeking(false);

        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
    };

    // const seekBackward10 = () => {
    //     seek(Math.max(0, currentTime - 10));
    // };
    //
    // const seekForward10 = () => {
    //     if (!duration) return;
    //     seek(Math.min(duration - 0.1, currentTime + 10));
    // };

    if (!currentMusic) return null;

    return (
        <div
            className="
                fixed bottom-4 left-1/2 z-[999]
                -translate-x-1/2 w-[95%] max-w-7xl
                bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg text-white
                flex items-center justify-around sm:gap-8 gap-3
                sm:px-6 px-4 py-2.5 sm:py-3 rounded-full
            "
        >
            <div className="flex items-center gap-2 min-w-60 sm:gap-4">
                <Image
                    ref={imgRef}
                    src={coverSrc}
                    alt={title}
                    width={64}
                    height={64}
                    unoptimized
                    onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_COVER;
                    }}
                    className="rounded-full shadow-md w-16 h-16 object-cover sm:block hidden"
                />

                <div className="leading-tight">
                    <p className="font-medium">
                        {truncateText(title, isDesktop ? 20 : 9)}
                    </p>

                    <p className="text-sm text-gray-300">
                        {truncateText(artist, isDesktop ? 22 : 9)}
                    </p>
                </div>
            </div>

            <div className="relative flex sm:flex-row items-center gap-10 sm:justify-between w-full">
                {/*<button*/}
                {/*    type="button"*/}
                {/*    onClick={seekBackward10}*/}
                {/*    className="hidden sm:flex items-center justify-start rounded-full hover:bg-white/20 transition text-xs"*/}
                {/*>*/}
                {/*    -10*/}
                {/*</button>*/}

                <div className="w-full max-w-32 flex-1 relative items-center sm:max-w-2xl sm:mx-2 mx-1">
                    <div
                        ref={progressRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className={`relative w-full h-4 flex items-center ${
                            duration ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                    >
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                    width: `${progressPercent}%`,
                                }}
                            />
                        </div>

                        <div
                            className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-md shadow-primary/40"
                            style={{
                                left: `calc(${progressPercent}% - 8px)`,
                            }}
                        />
                    </div>

                    <div className="flex justify-between text-[11px] text-gray-300 pt-1">
                        <span>{formatTime(progressTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/*<button*/}
                {/*    type="button"*/}
                {/*    onClick={seekForward10}*/}
                {/*    className="hidden sm:flex   items-center justify-center rounded-full hover:bg-white/20 transition text-xs"*/}
                {/*>*/}
                {/*    +10*/}
                {/*</button>*/}

                <div className="flex items-center justify-center sm:gap-4 gap-2">
                    <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition"
                        onClick={prev}
                    >
                        ⏮
                    </button>

                    <button
                        type="button"
                        className="w-10 h-10 flex items-center justify-center bg-primary rounded-full shadow-md hover:bg-linear-to-t hover:from-third hover:to-primary transition"
                        onClick={togglePlay}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>

                    <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition"
                        onClick={next}
                    >
                        ⏭
                    </button>
                </div>

                <button
                    type="button"
                    onClick={close}
                    className="w-8 h-8 sm:relative absolute -top-4 sm:top-0 left-0 sm:flex items-center justify-center rounded-full hover:bg-white/20 transition"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}