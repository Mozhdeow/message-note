import React from "react";
import {BiMusic} from "react-icons/bi";
import {formatDuration} from "../sections/CreatePersonalPlaylist";

export function TrackPreviewHeader({
                                       coverUrl,
                                       title,
                                       artist,
                                       album,
                                       duration,
                                       description,
                                       tone = "purple",
                                   }: {
    coverUrl: string;
    title: string;
    artist: string;
    album: string;
    duration: number;
    description?: string;
    tone?: "purple" | "cyan";
}) {
    return (
        <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <BiMusic className="h-8 w-8 text-white/35" />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-black text-white">{title}</p>

                <p
                    className={`mt-1 truncate text-sm ${
                        tone === "cyan" ? "text-cyan-300" : "text-primary"
                    }`}
                >
                    {artist} <span className="text-white/35">• {album}</span>
                </p>

                {description && (
                    <p className="mt-2 line-clamp-2 text-sm text-white/45">
                        {description}
                    </p>
                )}

                <p className="mt-2 text-xs text-white/35">
                    Duration: {formatDuration(duration)}
                </p>
            </div>
        </div>
    );
}

