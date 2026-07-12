'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

type MusicItem = {
    id: number | string;
    name?: string;
    track_name?: string;
    artist?: string;
    artist_name?: string;
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

interface PlayerContextType {
    currentMusic: MusicItem | null;
    isPlaying: boolean;
    playMusic: (music: MusicItem, list: MusicItem[], index: number) => void;
    togglePlay: () => void;
    next: () => void;
    prev: () => void;
    close: () => void;
    currentTime: number;
    duration: number;
    seek: (t: number) => void;
}

const MusicPlayerContext = createContext<PlayerContextType | null>(null);

export const usePlayer = () => {
    const ctx = useContext(MusicPlayerContext);

    if (!ctx) {
        throw new Error('usePlayer must be used inside MusicPlayerProvider');
    }

    return ctx;
};

const resolveMediaSrc = (rawUrl?: string | null) => {
    if (!rawUrl) return '';

    let url = rawUrl
        .replace('../public/', '')
        .replace('public/', '')
        .trim();

    const apiBase = process.env.NEXT_PUBLIC_PHP_API || '';
    const cleanBase = apiBase.replace(/\/$/, '');

    let fileName = '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
            const parsed = new URL(url);
            fileName = parsed.pathname.split('/').pop() || '';
        } catch {
            fileName = '';
        }
    } else {
        const cleanUrl = url.replace(/^\//, '');
        fileName = cleanUrl.split('/').pop() || '';
    }

    if (!fileName) return '';

    return `${cleanBase}/stream.php?file=${encodeURIComponent(fileName)}`;
};
export const MusicPlayerProvider = ({ children }: { children: React.ReactNode }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastSrcRef = useRef<string>('');

    const playlistRef = useRef<MusicItem[]>([]);
    const indexRef = useRef<number>(0);

    const [currentMusic, setCurrentMusic] = useState<MusicItem | null>(null);
    const [playlist, setPlaylist] = useState<MusicItem[]>([]);
    const [index, setIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        playlistRef.current = playlist;
    }, [playlist]);

    useEffect(() => {
        indexRef.current = index;
    }, [index]);

    const playMusic = useCallback((music: MusicItem, list: MusicItem[], i: number) => {
        setPlaylist(list);
        setIndex(i);
        playlistRef.current = list;
        indexRef.current = i;

        setCurrentMusic(music);
        setIsPlaying(true);
    }, []);

    const togglePlay = useCallback(() => {
        setIsPlaying((prev) => !prev);
    }, []);

    const next = useCallback(() => {
        const list = playlistRef.current;
        if (!list.length) return;

        const nextIndex = (indexRef.current + 1) % list.length;

        indexRef.current = nextIndex;
        setIndex(nextIndex);
        setCurrentMusic(list[nextIndex]);
        setIsPlaying(true);
    }, []);

    const prev = useCallback(() => {
        const list = playlistRef.current;
        if (!list.length) return;

        const prevIndex = indexRef.current - 1 < 0 ? list.length - 1 : indexRef.current - 1;

        indexRef.current = prevIndex;
        setIndex(prevIndex);
        setCurrentMusic(list[prevIndex]);
        setIsPlaying(true);
    }, []);

    const close = useCallback(() => {
        const audio = audioRef.current;

        setIsPlaying(false);
        setCurrentMusic(null);
        setCurrentTime(0);
        setDuration(0);
        setPlaylist([]);
        setIndex(0);

        playlistRef.current = [];
        indexRef.current = 0;
        lastSrcRef.current = '';

        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.removeAttribute('src');
            audio.load();
        }
    }, []);

    const seek = useCallback((t: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        const audioDuration = Number.isFinite(audio.duration) ? audio.duration : duration;

        let safeTime = Number(t);

        if (!Number.isFinite(safeTime)) return;

        if (audioDuration > 0) {
            safeTime = Math.max(0, Math.min(safeTime, audioDuration - 0.05));
        } else {
            safeTime = Math.max(0, safeTime);
        }

        audio.currentTime = safeTime;
        setCurrentTime(safeTime);
    }, [duration]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentMusic) return;

        const rawFile = currentMusic.file || currentMusic.file_url || '';
        const src = resolveMediaSrc(rawFile);

        if (!src) {
            console.error('No audio src:', currentMusic);
            setIsPlaying(false);
            return;
        }

        if (lastSrcRef.current !== src) {
            lastSrcRef.current = src;
            audio.pause();
            audio.src = src;
            audio.currentTime = 0;
            setCurrentTime(0);
            setDuration(0);
            audio.load();
        }

        if (isPlaying) {
            audio.play().catch((error) => {
                console.error('Audio play error:', error);
                console.error('Audio src:', src);
                setIsPlaying(false);
            });
        } else {
            audio.pause();
        }
    }, [currentMusic, isPlaying]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            setCurrentTime(audio.currentTime || 0);
        };

        const updateDuration = () => {
            const audioDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
            setDuration(audioDuration);
        };

        const ended = () => {
            const list = playlistRef.current;

            if (list.length <= 1) {
                audio.pause();
                audio.currentTime = 0;
                setIsPlaying(false);
                setCurrentTime(0);
                return;
            }

            next();
        };

        const onError = () => {
            console.error('Audio element error:', audio.error);
            console.error('Audio src:', audio.src);
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('durationchange', updateDuration);
        audio.addEventListener('canplay', updateDuration);
        audio.addEventListener('ended', ended);
        audio.addEventListener('error', onError);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('durationchange', updateDuration);
            audio.removeEventListener('canplay', updateDuration);
            audio.removeEventListener('ended', ended);
            audio.removeEventListener('error', onError);
        };
    }, [next]);

    return (
        <MusicPlayerContext.Provider
            value={{
                currentMusic,
                isPlaying,
                playMusic,
                togglePlay,
                next,
                prev,
                close,
                currentTime,
                duration,
                seek,
            }}
        >
            {children}
            <audio ref={audioRef} preload="metadata" playsInline />
        </MusicPlayerContext.Provider>
    );
};