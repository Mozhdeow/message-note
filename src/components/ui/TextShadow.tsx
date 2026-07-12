"use client";
import React, {useEffect, useRef} from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

interface IProps {
    className?: string;
    shadowColor?: string;
    text: string;
}

const COLORS = [
    "#8f7bff",
    "#23b1d8",
    "#dc5fe2",
    "#b733f9",
    "#a0de59",
    "#83d1ad",
    "#f7b500",
    "#ff7b7b",

];

gsap.registerPlugin(ScrollTrigger);

export default function TextShadow({className = "", text, shadowColor = "cosmic"}: IProps) {
    const words = text.split(" ");

    const boxRef = useRef(null);

    return (
        <div ref={boxRef} className={`name  ${className}`} style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px"
        }}>
            {words.map((letter, i) => (
                <div
                    key={i}
                    className={`${shadowColor} uppercase text-center`}
                    style={{"--color": COLORS[i % COLORS.length]} as React.CSSProperties}
                    data-text={letter}
                >
                    <span>{letter} </span>
                </div>
            ))}
        </div>
    );
}
