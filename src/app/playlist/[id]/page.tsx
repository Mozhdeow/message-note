'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { BiLockAlt, BiLoaderAlt, BiMusic } from 'react-icons/bi';

import Background from '@/components/Background';
import Tree from '@/components/Tree';
import Link from "next/link";

const getPasswordStorageKey = (token: string) => {
    return `playlist_password_${token}`;
};

export default function PlaylistPage() {
    const params = useParams();
    const token = params.id as string;

    const [password, setPassword] = useState('');
    const [unlockedPassword, setUnlockedPassword] = useState<string | null>(null);

    const [checkingStorage, setCheckingStorage] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setCheckingStorage(false);
            return;
        }

        const storedPassword = sessionStorage.getItem(getPasswordStorageKey(token));

        if (storedPassword) {
            setUnlockedPassword(storedPassword);
        }

        setCheckingStorage(false);
    }, [token]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const cleanPassword = password.trim();

        if (!cleanPassword) {
            setErrorMessage('Password is required.');
            return;
        }

        const apiBase = process.env.NEXT_PUBLIC_PHP_API;

        if (!apiBase) {
            setErrorMessage('API URL is not configured.');
            return;
        }

        setSubmitting(true);
        setErrorMessage('');

        try {
            const body = new URLSearchParams();
            body.append('action', 'get_public_playlist');
            body.append('token', token);
            body.append('password', cleanPassword);

            const res = await fetch(`${apiBase}/process.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: body.toString(),
            });

            const text = await res.text();

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                console.error('Invalid playlist access response:', text);
                throw new Error('Server returned an invalid response.');
            }

            if (!result.success) {
                throw new Error(result.message || 'Wrong playlist password.');
            }

            sessionStorage.setItem(getPasswordStorageKey(token), cleanPassword);
            setUnlockedPassword(cleanPassword);
            toast.success('Playlist unlocked.');
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Could not unlock this playlist.';

            setErrorMessage(message);
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (checkingStorage) {
        return (
            <Background>
                <div className="flex min-h-screen items-center justify-center text-white">
                    <div className="flex flex-col items-center gap-4">
                        <BiLoaderAlt className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm font-bold text-white/50">
                            Checking playlist access...
                        </p>
                    </div>
                </div>
            </Background>
        );
    }

    if (unlockedPassword) {
        return (
            <Background>
                <Tree password={unlockedPassword} />
            </Background>
        );
    }

    return (
        <Background>
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-7 text-center shadow-2xl shadow-primary/20 backdrop-blur-xl">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/20 blur-[90px]" />
                    <div className="pointer-events-none absolute -bottom-20 left-4 h-52 w-52 rounded-full bg-secondary/10 blur-[100px]" />

                    <div className="relative z-10">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary">
                            <BiLockAlt className="h-9 w-9" />
                        </div>

                        <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
                            Private Playlist
                        </p>

                        <h1 className="text-3xl font-black text-white">
                            Enter playlist password
                        </h1>

                        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-white/45">
                            This music note is protected. Enter the password to unlock the playlist.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                            <div className="text-left">
                                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/35">
                                    Password
                                </label>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        setErrorMessage('');
                                    }}
                                    placeholder="Enter password"
                                    className="
                                        w-full rounded-2xl border border-white/10
                                        bg-black/20 px-5 py-4
                                        text-white outline-none
                                        placeholder:text-white/25
                                        transition
                                        focus:border-primary/60 focus:bg-black/30
                                    "
                                />
                            </div>

                            {errorMessage && (
                                <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-sm font-bold text-red-300">
                                    {errorMessage}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="
                                    inline-flex w-full items-center justify-center gap-2
                                    rounded-full bg-primary px-6 py-4
                                    text-sm font-black uppercase tracking-wider text-white
                                    transition hover:bg-secondary
                                    disabled:cursor-not-allowed disabled:opacity-60
                                "
                            >
                                {submitting ? (
                                    <>
                                        <BiLoaderAlt className="h-5 w-5 animate-spin" />
                                        Unlocking...
                                    </>
                                ) : (
                                    <>
                                        <BiMusic className="h-5 w-5" />
                                        Unlock Playlist
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Background>
    );
}