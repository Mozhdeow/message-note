'use client'

import Image from "next/image";
import login from "../../public/images/icons/login_vectorized.png"
import biography from "../../public/images/icons/biography_vectorized.png"
import playlist from "../../public/images/icons/playlist_vectorized.png"
import home from "../../public/images/icons/home_vectorized.png"
import {useEffect, useRef} from "react";
import gsap from "gsap";
import Link from "next/link";


const BottomMenu = () => {
    const menu = [
        {label: 'home', icon: home, url: '/'},
        {label: 'login', icon: login, url: '/login'},
        {label: 'bio', icon: biography, url: '/biography'},
        {label: 'playlists', icon: playlist, url: '/playlist'},
    ]

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {

        const items = containerRef.current?.querySelectorAll(".menu-item");

        items?.forEach((item: any) => {

            const icon = item.querySelector(".icon");
            const line = item.querySelector(".purple-line");
            const tooltip = item.querySelector(".tooltip");

            const tl = gsap.timeline({paused: true});

            tl.to(icon, {
                rotateY: 180,
                y: -12,
                duration: 0.5,
                ease: "power3.out",
                filter: "drop-shadow(0 0 10px rgba(168,85,247,0.8)) drop-shadow(0 0 30px rgba(168,85,247,0.5))"
            }, 0)

                .to(line, {
                    width: "30%",
                    borderRadius: "20px",
                    opacity: 1,
                    duration: 0.35,
                    ease: "power3.out"
                }, 0)

                .to(tooltip, {
                    opacity: 1,
                    y: -8,
                    duration: 0.35,
                    ease: "power3.out"
                }, 0);

            const enter = () => {
                tl.play();
            };

            const leave = () => {
                tl.reverse();
            };

            item.addEventListener("mouseenter", enter);
            item.addEventListener("mouseleave", leave);

        });

    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full flex items-center justify-center sm:gap-10 gap-6">
            {menu.map((item, i) => (
                <div key={i} className="menu-item relative flex flex-col items-center cursor-pointer">

                    <div
                        className="tooltip absolute -top-8 opacity-0 text-sm text-white bg-background/50 px-2.5 py-1 rounded-md backdrop-blur pointer-events-none">
                        {item.label}
                    </div>
                    <Link href={item.url}>
                        <div className="icon">
                            <Image
                                src={item.icon}
                                alt={item.label}
                                width={100}
                                height={100}
                                className="sm:w-[65px] w-14 sm:h-[65px] h-14 object-cover"
                            />
                        </div>
                    </Link>

                    <div className="purple-line w-0 opacity-0 h-[3px] rounded-full bg-primary"
                         style={{boxShadow: "0 0 10px rgba(168,85,247,.9),0 0 25px rgba(168,85,247,.8)"}}
                    />

                </div>
            ))}
        </div>
    );
};

export default BottomMenu;
