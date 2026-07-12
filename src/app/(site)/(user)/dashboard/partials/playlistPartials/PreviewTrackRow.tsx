import React from "react";
import {ImFileText} from "react-icons/im";
import {BiMusic} from "react-icons/bi";
import {formatDuration, Track} from "../sections/CreatePersonalPlaylist";

export function PreviewTrackRow({
                                    index,
                                    track,
                                }: {
    index: number;
    track: Track;
}) {
    return (
        <div className="group flex items-center gap-4 rounded-xl p-3 transition hover:bg-white/[0.045]">
      <span className="w-6 text-right font-mono text-sm text-white/30">
        {index + 1}
      </span>

            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-white/5">
                {track.coverUrl ? (
                    <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <BiMusic className="h-4 w-4 text-white/30"/>
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-white/80 transition group-hover:text-primary">
                    {track.title}
                </p>

                <p className="truncate text-xs text-white/35">{track.artist}</p>
            </div>

            {track.description && (
                <div
                    className="hidden items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary md:flex">
                    <ImFileText className="h-3 w-3"/>
                    {track.description}
                </div>
            )}

            <div className="font-mono text-xs text-white/35">
                {formatDuration(track.duration)}
            </div>
        </div>
    );
}