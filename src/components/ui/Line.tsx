'use client';
import React, {useRef, useState} from 'react';
import clsx from 'clsx';
import {useLineAnimation} from "@/utils/animations";
import Circle from "@/components/Circle";
import Rectangle from "@/components/ui/Rectangle";


type Variant = 'blue' | 'pink' | 'purple' | 'orange';

const variants = {
    blue: {
        vLine: 'lg:w-[10vw] lg:min-w-[120px] lg:max-w-[250px] w-0 bg-blue-300 shadow-blue-300/80 before:bg-blue-300 after:bg-blue-300 h-[3px] ',
        hLine: 'lg:h-[18vh] lg:min-h-[120px] lg:max-h-[220px] h-[68vh] bg-blue-300 before:bg-blue-300 after:bg-blue-300',
        circle: 'bg-blue-300 shadow-blue-300 after:bg-blue-300 before:bg-blue-300',
        rectangle: 'border-blue-300',
        hoverLineColor: "bg-blue-400 before:bg-blue-400 after:bg-blue-400",
        rectangleHoverColor: 'hover:bg-[rgba(142,197,255,0.2)]',
    },

    pink: {
        vLine: 'lg:w-[20vw] lg:min-w-[180px] lg:max-w-[450px] w-0 bg-pink-400 h-[3px]',
        hLine: 'lg:h-[32vh] lg:min-h-[180px] lg:max-h-[380px] h-[68vh] bg-pink-400',
        circle: 'bg-pink-400 shadow-pink-400',
        rectangle: 'border-pink-400',
        hoverLineColor: 'bg-pink-500 before:bg-pink-500 after:bg-pink-500',
        rectangleHoverColor: 'hover:bg-[rgba(251,100,182,0.2)]',
    },

    purple: {
        vLine: 'lg:w-[30vw] lg:min-w-[220px] lg:max-w-[650px] w-0 bg-purple-500 h-[3px]',
        hLine: 'lg:h-[46vh] lg:min-h-[260px] lg:max-h-[540px] h-[68vh] bg-purple-500',
        circle: 'bg-purple-400 shadow-purple-500',
        rectangle: 'border-purple-500',
        hoverLineColor: 'bg-purple-600 before:bg-purple-600 after:bg-purple-600',
        rectangleHoverColor: 'hover:bg-[rgba(173,70,255,0.2)]',
    },

    orange: {
        vLine: 'lg:w-[40vw] lg:min-w-[280px] lg:max-w-[850px] w-0 bg-orange-400 h-[3px]',
        hLine: 'lg:h-[60vh] lg:min-h-[320px] lg:max-h-[700px] h-[68vh] bg-orange-400',
        circle: 'bg-orange-400 shadow-orange-400',
        rectangle: 'border-orange-400',
        hoverLineColor: 'bg-orange-500 before:bg-orange-500 after:bg-orange-500',
        rectangleHoverColor: 'hover:bg-[rgba(255,137,4,0.2)]',
    },
};

interface LineProps {
    hoverLine?: 'left' | 'right';
    duration?: number;
    id: number;
    modal?: boolean;
    variant?: Variant;
    classNameRectangle?: string
    classNameCContainer?: string;
    title?: string;
    description?: string;
}

const Line: React.FC<LineProps> = ({
                                       variant = 'blue',
                                       hoverLine = 'left',
                                       duration = 0.4,
                                       id,
                                       modal,
                                       classNameRectangle,classNameCContainer,description,
    title
                                   }) => {
    const {
        vLine,
        hLine,
        circle,
        rectangle,
        hoverLineColor,
        rectangleHoverColor,
    } = variants[variant];

    const lineHFillerRef = useRef<HTMLDivElement>(null);
    const lineVFillerRef = useRef<HTMLDivElement>(null);
    const lineCFillerRef = useRef<HTMLDivElement>(null);

    const [isOpen, setIsOpen] = useState(false);

    const {play, pause} = useLineAnimation({
        lineHFillerRef,
        lineVFillerRef,
        lineCFillerRef,
        hoverColor: rectangleHoverColor,
        duration,
    });

    return (
        <div className="relative flex items-end justify-center h-full">
            <div
                className={clsx(
                    hLine,
                    'w-[3px] rounded-full relative shadow-md'
                )}
            >
                <div
                    ref={lineHFillerRef}
                    className={clsx(
                        hoverLineColor,
                        "absolute bottom-0 w-full rounded-full before:absolute before:-inset-0 before:blur-md after:absolute after:-inset-0 after:blur-xl"
                    )}
                    style={{height: '0%'}}
                />
            </div>

            <div
                className={clsx(
                    vLine,
                    hoverLine === 'left' ? 'right-0' : 'left-0',
                    'absolute h-[3px] rounded-full top-0'
                )}
            >
                <div
                    ref={lineVFillerRef}
                    className={clsx(
                        hoverLineColor,
                        hoverLine === 'left' ? 'right-0' : 'left-0',
                        'absolute top-0 h-full rounded-full before:absolute before:-inset-0 before:blur-md after:absolute after:-inset-0 after:blur-xl'
                    )}
                    style={{width: '0%'}}
                />

                <div
                    className={clsx(
                        hoverLine === 'left'
                            ? 'lg:-left-3 left-2 rotate-270 lg:rotate-0'
                            : 'lg:-right-3 right-2 rotate-90 lg:rotate-0',
                        'absolute lg:top-0 top-[30vh] ',classNameCContainer
                    )}
                >
                    <Circle
                        lineRef={lineCFillerRef}
                        hoverLineColor={hoverLineColor}
                        className={circle}
                    />
                </div>

                <Rectangle
                    className={clsx(
                        hoverLine === 'left'
                            ? 'lg:-left-[90px] -left-3 rotate-90 '
                            : 'lg:-right-[90px] -right-3 lg:rotate-0 rotate-270',
                        'lg:rotate-0 lg:top-20 top-[30vh] transition-colors duration-300', classNameRectangle, rectangle,rectangleHoverColor
                    )}
                    hoverColor={rectangleHoverColor}
                    lineCFillerRef={lineCFillerRef}
                    lineHorizentalRef={lineHFillerRef}
                    lineVerticalRef={lineVFillerRef}
                    duration={duration}
                    id={id}
                    isOpen={isOpen}
                    closeModal={() => setIsOpen(false)}
                    openModal={() => setIsOpen(true)}
                    modal={modal}
                    onHover={play}
                    onLeave={pause}
                    title={title}
                    description={description}
                />
            </div>
        </div>
    );
};

export default React.memo(Line);