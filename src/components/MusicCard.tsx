'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import {PLACEHOLDER_COVER} from "@/components/GlobalPlayer";

type MusicItem = {
    id: number | string;
    name?: string;
    track_name?: string;
    artist?: string;
    artist_name?: string;
    album_name?: string;
    file?: string;
    file_url?: string;
    cover?: string;
    cover_image?: string;
    lyrics?: string;
    lyric?: string;
    description?: string;
    chat?: string;
    duration?: number | string | null;
};

type MusicCardProps = {
    music: MusicItem;
    index: number;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    currentMusic: MusicItem | null;
    seek: (time: number) => void;
    togglePlay: () => void;
    playMusic: (music: MusicItem, playlist: MusicItem[], index: number) => void;
    onLyrics: (music: MusicItem, index: number, type: 'lyrics' | 'chat') => void;
    onChat: (music: MusicItem, index: number, type: 'lyrics' | 'chat') => void;
    categoryMusic: MusicItem[];
};

const formatTime = (time: number) => {
    if (!time || Number.isNaN(time)) return '0:00';

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
        .toString()
        .padStart(2, '0');

    return `${minutes}:${seconds}`;
};


export default function MusicCard({
                                      music,
                                      index,
                                      isPlaying,
                                      currentTime,
                                      duration,
                                      currentMusic,
                                      seek,
                                      onLyrics,
                                      onChat,
                                      playMusic,
                                      togglePlay,
                                      categoryMusic,
                                  }: MusicCardProps) {
    const circleRef = useRef<HTMLImageElement>(null);

    const isCurrent = String(currentMusic?.id) === String(music.id);

    const title = music.track_name || music.name || 'Unknown Track';
    const artist = music.artist_name || music.artist || 'Unknown Artist';
    const cover = music.cover_image || music.cover || PLACEHOLDER_COVER;
    const hasLyrics = Boolean(music.lyrics || music.lyric);
    const hasChat = Boolean(music.description || music.chat);

    useEffect(() => {
        if (!circleRef.current) return;

        if (isPlaying && isCurrent) {
            gsap.to(circleRef.current, {
                rotation: 360,
                duration: 15,
                repeat: -1,
                ease: 'linear',
            });
        } else {
            gsap.killTweensOf(circleRef.current);
            gsap.set(circleRef.current, {
                rotation: 0,
            });
        }

        return () => {
            if (circleRef.current) {
                gsap.killTweensOf(circleRef.current);
            }
        };
    }, [isPlaying, isCurrent]);

    return (
        <div
            className={`group border border-primary rounded-full px-5 pt-5 pb-1 transition-all duration-300 ease-in-out bg-background/35 max-w-72 ${
                isPlaying && isCurrent ? 'playing-card rounded-b-lg h-full' : ''
            }`}
        >
            <div className="flex flex-col items-center justify-center">
                <div className="w-full aspect-square mb-4 rounded-md overflow-hidden relative h-full flex justify-center">
                    <Image
                        ref={circleRef}
                        src={cover || PLACEHOLDER_COVER}
                        alt={title}
                        width={240}
                        height={240}
                        className={`w-60 h-60 object-cover rounded-full ${
                            isPlaying && isCurrent ? 'circle' : ''
                        }`}
                        unoptimized
                    />

                    <div
                        className={`absolute w-24 h-24 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center 
                        transition-opacity duration-300 ${
                            isPlaying && isCurrent
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                if (isCurrent) {
                                    togglePlay();
                                } else {
                                    playMusic(music, categoryMusic, index);
                                }
                            }}
                            className="w-12 h-12 rounded-full bg-primary hover:bg-linear-to-t hover:from-third hover:to-primary flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary transition-colors cursor-pointer duration-200 shadow-lg ease-out"
                        >
                            {isPlaying && isCurrent ? (
                                <svg
                                    className="w-8 h-8 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                            ) : (
                                <svg
                                    className="w-8 h-8 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {isPlaying && isCurrent && (
                    <div className="w-full pb-4">
                        <h3 className="text-lg font-semibold text-white mb-1 text-center uppercase">
                            {title}
                        </h3>

                        <p className="text-gray-300 mb-3 text-center">{artist}</p>

                        <div className="flex-1 relative items-center max-w-2xl mx-2 mt-10">
                            <div className="w-full h-2 bg-white/40 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full"
                                    style={{
                                        width:
                                            duration > 0
                                                ? `${(currentTime / duration) * 100}%`
                                                : '0%',
                                    }}
                                />
                            </div>

                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                step="0.1"
                                value={currentTime}
                                onChange={(e) => seek(Number(e.currentTarget.value))}
                                onInput={(e) => seek(Number(e.currentTarget.value))}
                                disabled={!duration}
                                className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer appearance-none disabled:cursor-not-allowed"
                            />

                            <div className="flex justify-between text-[11px] text-gray-300 pt-1">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4 mt-4 w-full">
                            {hasLyrics && (
                                <button
                                    type="button"
                                    onClick={() => onLyrics(music, index, 'lyrics')}
                                    className="bg-primary/50 hover:bg-linear-to-l hover:from-third/50 hover:to-primary/50 text-white px-4 py-2 rounded-full text-sm transition-colors duration-200"
                                >
                                    lyric
                                </button>
                            )}

                            {hasChat && (
                                <button
                                    type="button"
                                    onClick={() => onChat(music, index, 'chat')}
                                    className="bg-third/40 hover:bg-third/60 text-white px-4 py-2 rounded-full text-sm transition-colors duration-200"
                                >
                                    chat
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}