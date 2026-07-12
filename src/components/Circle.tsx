'use client'

import gsap from 'gsap';
import React, {useEffect, useRef} from "react";

interface IProps {
    hoverLineColor?: string
    className?: string
    lineRef: React.RefObject<HTMLDivElement | null>
}

function Circle({hoverLineColor, className, lineRef}: IProps) {
    const circleRef = useRef<HTMLDivElement>(null);

    const svgRef = useRef<SVGSVGElement >(null);

    useEffect(() => {
        const svgElement = svgRef.current;
        if (!svgElement) return;

        const path = svgElement.querySelector('path');

        if (!path) return;

        const length = path.getTotalLength();


        gsap.set(path, {
            strokeDasharray: 30,
            strokeDashoffset: length,
            repeat: -1,
            ease: "linear",
            duration: 5
        });

        gsap.to(path, {
            strokeDashoffset: 0,
            duration: 5,
            repeat: -1,
            ease: "linear"
        });

        gsap.fromTo('.circle', {
            scale: 0.9,
            duration: 4,
        }, {
            top: 200,
            duration: 4,
            scale: 1.2,
            repeat: -1,
            ease: "bounce",
        })

    }, []);

    return (
        <div className="relative flex items-center justify-center flex-col sm:w-7 w-5"
        >
            <svg
                ref={svgRef}
                className="absolute top-4 sm:top-[22px] left-0 w-full h-full"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor: '#FFFFFF', stopOpacity: 1}}/>
                        <stop offset="100%" style={{stopColor: '#A259FFC9', stopOpacity: 1}}/>
                    </linearGradient>


                    <filter id="circleGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                <path
                    d="M 50, 5 A 45,45 0 1,1 49.99,5"
                    stroke="url(#circleGradient)"
                    strokeWidth="3"
                    strokeDasharray="10 10"
                    filter="url(#circleGlow)"
                />
            </svg>

            <div ref={circleRef} className=" z-10 flex flex-col items-center">
                <div className={`${className} z-20 sm:h-7 h-6 w-1 sm:mb-[14px] mb-2 relative rounded-full`}>
                    <div
                        ref={lineRef}
                        className={`${hoverLineColor} absolute top-0 h-full  w-full  rounded-full 
                            before:content-[''] before:absolute before:-inset-0 before:rounded-full before:blur-md
                            after:content-[''] after:absolute after:-inset-0 after:rounded-full after:blur-xl`}
                        style={{height: '0%'}}
                    />
                </div>
                <div className="bg-white rounded-full w-2 h-2 sm:w-3 sm:h-3 circle
                 shadow-md shadow-white/50
                    before:content-[''] before:absolute before:-inset-0  before:bg-white before:opacity-40 before:blur-sm
                    after:content-[''] after:absolute after:-inset-0 after:rounded-full after:bg-white after:opacity-40 after:blur-lg
                "/>
            </div>
        </div>
    );
}

export default Circle;