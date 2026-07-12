'use client'
import { useEffect, useState } from "react";

export function useIsDesktop(breakpoint: number = 620) {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= breakpoint);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, [breakpoint]);

    return isDesktop;
}

export function truncateText(
    text: string | undefined,
    maxLength: number = 15,
    suffix: string = "..."
): string {
    if (!text) return "";

    return text.length > maxLength
        ? text.slice(0, maxLength) + suffix
        : text;
}
