"use client";
import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import TextShadow from "@/components/ui/TextShadow";
import gsap from "gsap";
import {truncateText, useIsDesktop} from "@/utils/truncate";

interface ModalProps {
    title?: string;
    titleClass?: string;
    closeModal?: () => void;
    children?: React.ReactNode;
    actions?: React.ReactNode;
    isOpen: boolean;
    modalClassName?: string;
    modalImgBg?: boolean
}

export default function Modal({
                                  actions,
                                  children,
                                  title,
                                  titleClass,
                                  closeModal,
                                  isOpen,
                                  modalClassName,
                                  modalImgBg = true
                              }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const desktopRef = useRef<HTMLDivElement>(null);
    const mobileRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);


    useLayoutEffect(() => {
        if (!mounted) return;

        const overlay = overlayRef.current;
        const desktop = desktopRef.current;
        const mobile = mobileRef.current;

        if (!overlay || !desktop || !mobile) return;

        gsap.set(desktop, {xPercent: -50, yPercent: -50});
        gsap.set(mobile, {yPercent: 0});

        if (isFirstRender.current) {
            isFirstRender.current = false;
            if (!isOpen) {
                gsap.set([overlay, desktop, mobile], {
                    visibility: "hidden",
                    pointerEvents: "none",
                    opacity: 0
                });
                gsap.set(desktop, {scale: 0.85, y: -40});
                gsap.set(mobile, {y: "100%"});
                return;
            }
        }

        if (isOpen) {
            gsap.set([overlay, desktop, mobile], {
                visibility: "visible",
                pointerEvents: "auto"
            });
            gsap.fromTo(overlay, {opacity: 0}, {opacity: 1, duration: 0.25});
            gsap.fromTo(desktop, {opacity: 0, scale: 0.85, y: -40}, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.35,
                ease: "power3.out"
            });
            gsap.fromTo(mobile, {opacity: 0, y: "100%"}, {opacity: 1, y: "0%", duration: 0.35, ease: "power3.out"});
        } else {
            gsap.to(overlay, {opacity: 0, duration: 0.25});
            gsap.to(desktop, {opacity: 0, scale: 0.85, y: -40, duration: 0.25, ease: "power2.in"});
            gsap.to(mobile, {
                opacity: 0,
                y: "100%",
                duration: 0.25,
                ease: "power2.in",
                onComplete: () => {
                    gsap.set([overlay, desktop, mobile], {visibility: "hidden", pointerEvents: "none"});
                }
            });
        }
    }, [isOpen, mounted]);
    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 pointer-events-none z-[9999] ">
            <div ref={overlayRef}
                 className="inset-0 fixed bg-background/60 h-screen w-full pointer-events-auto"
                 onClick={closeModal}
                 style={{zIndex: 1900}}
            />

            <div ref={desktopRef} className={`hidden sm:flex flex-col justify-between fixed top-1/2 left-1/2  pointer-events-auto rounded-xl bg-background
                py-8 px-10 max-w-3xl max-h-[80%] min-w-[500px] overflow-hidden border-2 border-background
                before:content-[''] before:absolute before:inset-0 before:bg-black/60 bg-[url('/images/modal-bg.png')] bg-cover bg-center bg-no-repeat`}
                 style={{zIndex: 1910}}>
                <div className={`flex items-center z-10 ${title ? "justify-between" : "justify-end"} mb-4`}>
                    {title && <TextShadow text={truncateText(title, 15)} className="text-4xl block"/>}
                    <button className="hover:text-rose-500/80 transition-colors text-xl" onClick={closeModal}>X</button>
                </div>
                <div className={`overflow-y-auto z-10 ${actions ? "mb-8" : "mb-0"} pb-2 pl-2 text-center`}>
                    {children}
                </div>

                {actions && <div className="absolute flex bottom-0 w-[86%] mt-auto py-4">{actions}</div>}
            </div>

            <div ref={mobileRef}
                 className={`sm:hidden fixed bottom-0 left-0 flex flex-col pointer-events-auto bg-[url('/images/modal-bg.png')] bg-cover bg-center bg-no-repeat
                 bg-[#0b0f19]
                 rounded-t-2xl pt-4 pb-0 px-6 w-full max-h-[92vh] min-h-[40vh] overflow-hidden
                 ${modalClassName || ""}
                 before:content-[''] before:absolute before:inset-0 before:bg-black/40`}
                 style={{zIndex: 2000}}
            >
                <div className="relative z-20 bg-gray-600 h-1.5 rounded-full w-12 mx-auto mb-6"/>

                <div className="relative z-20 flex items-center justify-center mb-4">
                    {title &&
                        <TextShadow text={truncateText(title, 15)} className="text-2xl font-bold text-white block"/>}
                </div>

                <div className={`relative z-20 overflow-y-auto ${actions ? "mb-24" : "mb-6"} text-left`}>
                    {children}
                </div>

                {actions && (
                    <div
                        className="absolute bottom-0 left-0 w-full px-6 py-5 z-30 bg-[#0b0f19]/95 backdrop-blur-md border-t border-white/10">
                        {actions}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
