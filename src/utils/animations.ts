import {RefObject, useEffect, useRef} from "react";
import gsap from "gsap";

export const useBorderAnimation = (svgRef: RefObject<SVGSVGElement | null>) => {
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const path = svg.querySelector<SVGPathElement>('path[stroke="url(#gradient-color)"]');
        if (!path) return;

        const length = path.getTotalLength();

        const ctx = gsap.context(() => {
            gsap.set(path, {
                strokeDasharray: 95,
                strokeDashoffset: length,
                repeat: -1,
                ease: "linear",
                duration: 10,
            });

            gsap.to(path, {
                strokeDashoffset: 50,
                duration: 10,
                repeat: -1,
                ease: "linear",
            });
        }, svg);

        return () => ctx.revert();
    }, [svgRef]);
};

export const useCircleRotation = (elRef: RefObject<HTMLDivElement | null>) => {
    useEffect(() => {
        const el = elRef.current;
        if (!el) return;

        const ctx = gsap.context(() => {
            gsap.to(el, {
                rotation: 360,
                duration: 15,
                repeat: -1,
                ease: "linear",
            });
        }, el);

        return () => ctx.revert();
    }, [elRef]);
};

interface LineProps {
    lineHFillerRef: RefObject<HTMLDivElement | null>;
    lineVFillerRef: RefObject<HTMLDivElement | null>;
    lineCFillerRef: RefObject<HTMLDivElement | null>;
    hoverColor: string;
    duration?: number;
}

// export const useLineAnimation = ({
//                                      lineHFillerRef,
//                                      lineVFillerRef,
//                                      lineCFillerRef,
//                                      hoverColor,
//                                      duration = 0.4,
//                                  }: LineProps) => {
//     const tl = gsap.timeline({paused: true});
//
//     useEffect(() => {
//         const ctx = gsap.context(() => {
//             tl.to(
//                 lineHFillerRef.current,
//                 {height: "100%", duration, ease: "power1.inOut"},
//                 0
//             )
//                 .to(
//                     lineVFillerRef.current,
//                     {width: "100%", duration, ease: "power1.inOut"},
//                     `+=${duration}`
//                 )
//                 .to(
//                     lineCFillerRef.current,
//                     {height: "100%", duration, ease: "power1.inOut"},
//                     `+=${duration}`
//                 )
//                 .to(
//                     lineCFillerRef.current,
//                     {backgroundColor: hoverColor, duration: 0.2},
//                     0
//                 );
//         });
//
//         return () => ctx.revert();
//     }, [lineHFillerRef, lineVFillerRef, lineCFillerRef, hoverColor, duration]);
//
//     const play = () => tl.play();
//     const pause = () => tl.pause();
//
//     return {play, pause};
// };

export const useLineAnimation = ({
                                     lineHFillerRef,
                                     lineVFillerRef,
                                     lineCFillerRef,
                                     hoverColor,
                                     duration = 0.4,
                                 }: LineProps) => {

    const tl = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {

        tl.current = gsap.timeline({paused: true});

        tl.current
            .to(
                lineHFillerRef.current,
                {
                    height: "100%",
                    duration,
                    ease: "power1.inOut",
                },
                0
            )
            .to(
                lineVFillerRef.current,
                {
                    width: "100%",
                    duration,
                    ease: "power1.inOut",
                },
                duration
            )
            .to(
                lineCFillerRef.current,
                {
                    height: "100%",
                    duration,
                    ease: "power1.inOut",
                },
                duration * 2
            )
            .to(
                lineCFillerRef.current,
                {
                    backgroundColor: hoverColor,
                    duration: 0.2,
                },
                0
            );

        return () => {
            tl.current?.kill();
        };

    }, []);

    const play = () => {
        tl.current?.play();
    };

    const pause = () => {
        tl.current?.reverse();
    };

    return {play, pause};
};

type RectangleProps = {
    rectRef: RefObject<HTMLDivElement | null>;
    lineHRef: RefObject<HTMLDivElement | null>;
    lineVRef: RefObject<HTMLDivElement | null>;
    lineCRef: RefObject<HTMLDivElement | null>;
    hoverColor: string;
    duration: number;
};


// export const useRectangleAnimation = ({
//                                           rectRef,
//                                           lineHRef,
//                                           lineVRef,
//                                           lineCRef,
//                                           hoverColor,
//                                           duration,
//                                       }: RectangleProps) => {
//     const onHover = () => {
//         gsap.to(rectRef.current, {
//             backgroundColor: hoverColor,
//             duration: 0.4,
//             ease: "power2.out",
//         });
//         gsap.to(lineHRef.current, {height: "100%", duration, ease: "power1.inOut"});
//         gsap.to(lineVRef.current, {
//             width: "100%",
//             delay: duration,
//             duration,
//             ease: "power1.inOut",
//         });
//         gsap.to(lineCRef.current, {
//             height: "100%",
//             delay: duration * 2,
//             duration,
//             ease: "power1.inOut",
//         });
//     };
//
//     const onLeave = () => {
//         const ctx = gsap.context(() => {
//             gsap.to(rectRef.current, {
//                 backgroundColor: "transparent",
//                 duration: 0.4,
//                 ease: "power2.in",
//             });
//             gsap.to(lineHRef.current, {
//                 height: "0%",
//                 delay: duration * 2,
//                 duration,
//                 ease: "power1.in",
//             });
//             gsap.to(lineVRef.current, {
//                 width: "0%",
//                 delay: duration,
//                 duration,
//                 ease: "power1.in",
//             });
//             gsap.to(lineCRef.current, {
//                 height: "0%",
//                 duration,
//                 ease: "power1.in",
//             });
//         });
//         return () => ctx.revert();
//     };
//
//     return {onHover, onLeave};
// };

export const useRectangleAnimation = ({
                                          rectRef,
                                          lineHRef,
                                          lineVRef,
                                          lineCRef,
                                          hoverColor,
                                          duration,
                                      }: RectangleProps) => {

    const tl = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {

        tl.current = gsap.timeline({paused: true});

        tl.current
            .to(rectRef.current, {
                backgroundColor: hoverColor,
                duration: 0.3,
                ease: "power2.out",
            }, 0)

            .to(lineHRef.current, {
                height: "100%",
                duration,
                ease: "power1.inOut",
            }, 0)

            .to(lineVRef.current, {
                width: "100%",
                duration,
                ease: "power1.inOut",
            }, duration)

            .to(lineCRef.current, {
                height: "100%",
                duration,
                ease: "power1.inOut",
            }, duration * 2);

        return () => {
            tl.current?.kill();
        };

    }, []);

    const onHover = () => {
        tl.current?.play();
    };

    const onLeave = () => {
        tl.current?.reverse();
    };

    return {onHover, onLeave};
};