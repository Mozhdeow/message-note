'use client'
import React, { useRef } from "react";
import Link from "next/link";
import {truncateText, useIsDesktop} from "@/utils/truncate";
import StaggerLink from "@/components/ui/StaggerLink";
import Modal from "@/components/ui/Modal";
import {useRectangleAnimation} from "@/utils/animations";
import {useParams} from "next/navigation";


interface IProps {
    modal?: boolean;
    className?: string;
    hoverColor?: string;
    duration?: number;
    id: number;
    lineHorizentalRef: React.RefObject<HTMLDivElement | null>;
    lineVerticalRef: React.RefObject<HTMLDivElement | null>;
    lineCFillerRef: React.RefObject<HTMLDivElement | null>;
    isOpen: boolean;
    closeModal: () => void;
    openModal: () => void;
    onHover: () => void;
    onLeave: () => void;
    title?: string;
    description?: string;
}

function Rectangle({
                       modal = true,
                       className,
                       hoverColor = 'rgba(142,197,255,0.2)',
                       lineHorizentalRef,
                       lineVerticalRef,
                       lineCFillerRef,
                       duration = 0.4,
                       id,
                       isOpen,
                       closeModal,
                       openModal,
                       title,
                       description = ""
                   }: IProps) {

    const rectRef = useRef<HTMLDivElement>(null);
    const isDesktop = useIsDesktop();

    const { onHover, onLeave } = useRectangleAnimation({
        rectRef,
        lineHRef: lineHorizentalRef,
        lineVRef: lineVerticalRef,
        lineCRef: lineCFillerRef,
        hoverColor,
        duration,
    });
    const params = useParams();
    const playlistToken = params.id as string;


    return (
        <div className="relative flex items-center justify-center">
            <div
                className={`${className} absolute border w-[170px] sm:w-[140px] md:w-[160px] xl:w-[180px] h-10 sm:h-12 rounded backdrop-blur-sm`}
                ref={rectRef}
                onMouseEnter={onHover}
                onMouseLeave={onLeave}
            >
                <button onClick={openModal} className="flex items-center justify-center h-full w-full overflow-hidden">
                    <StaggerLink label={truncateText(title, isDesktop ? 12 : 10)} fontSize="lg:text-lg text-sm" />
                </button>

                {modal && (
                    <Modal
                        isOpen={isOpen}
                        closeModal={closeModal}
                        title={title}
                        actions={
                            <Link
                                href={`/playlist/${playlistToken}/category/${id}`}
                                className="uppercase text-white text-lg flex items-center justify-center h-full border-2 border-primary rounded-md w-full p-2 hover:bg-primary transition-colors"
                            >
                                 Go to Playlist
                            </Link>
                        }
                    >
                        <div className="lyrics-scroll min-h-[10vh] max-h-[60vh] overflow-y-auto px-6 flex items-center justify-center">
                            {description && (
                                description.split('\n').map((val, index) => (
                                    <p key={index} className="text-center mb-2 text-lg font-vazir text-gray-200">
                                        {val}
                                    </p>
                                ))
                            )}
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
}

export default Rectangle;