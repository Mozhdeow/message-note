"use client";

import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BiLockAlt,
  BiMusic,
  BiPlay,
  BiShareAlt,
  BiSolidPlaylist,
} from "react-icons/bi";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Create your playlist",
    text: "Add songs into different categories and build a personal music collection.",
    icon: BiSolidPlaylist,
  },
  {
    title: "Protect it",
    text: "Set a password so only the person with access can open the playlist.",
    icon: BiLockAlt,
  },
  {
    title: "Share the link",
    text: "Send the generated link and let them unlock your message through music.",
    icon: BiShareAlt,
  },
];

export default function PlaylistShowcaseSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-showcase='text']", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
        y: 45,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });

      gsap.from("[data-showcase='card']", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 65%",
        },
        x: 80,
        y: 40,
        opacity: 0,
        rotate: 3,
        duration: 1.1,
        ease: "power4.out",
      });

      gsap.fromTo(
          "[data-showcase='feature']",
          {
            y: 30,
            autoAlpha: 0,
          },
          {
            scrollTrigger: {
              trigger: "[data-showcase='features-wrapper']",
              start: "top 85%",
              toggleActions: "play none none none",
            },
            y: 0,
            autoAlpha: 1,
            duration: 0.75,
            stagger: 0.12,
            ease: "power3.out",
          }
      );

      ScrollTrigger.refresh();

      gsap.to("[data-showcase='equalizer']", {
        scaleY: 0.35,
        transformOrigin: "bottom",
        duration: 0.55,
        stagger: {
          each: 0.08,
          repeat: -1,
          yoyo: true,
        },
        ease: "sine.inOut",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative min-h-screen px-6 pt-28 pb-10 md:px-12 lg:px-20"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">

        <div className="my-auto max-w-2xl">
          <p
            data-showcase="text"
            className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-secondary">
            How Message Note works
          </p>

          <h2
            data-showcase="text"
            className="font-display text-5xl font-black uppercase leading-[0.95] tracking-tighter text-white md:text-7xl">
            A playlist that feels like a message.
          </h2>

          <p
            data-showcase="text"
            className="mt-6 text-base font-medium leading-8 text-white/60 md:text-lg">
            Message Note lets users create a private music playlist and share it
            with someone through a generated link. The receiver enters the
            password, opens the playlist, and sees the songs with your personal
            note.
          </p>

          <div data-showcase="features-wrapper" className="mt-9 grid gap-4">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  data-showcase="feature"
                  className="group flex gap-4 rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/[0.075]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-white/50">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        <div
          data-showcase="card"
          className="relative mx-auto w-full max-w-[500px] lg:justify-self-end">
          <div className="absolute -inset-10 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-secondary/30 blur-2xl" />

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">

            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">
                  Private playlist
                </p>
                <h3 className="mt-1 text-2xl font-black text-white">
                  For Someone
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <BiMusic className="h-7 w-7" />
              </div>
            </div>

            <div className="relative mb-5 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/50 via-secondary-background to-black p-5">
              <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
                Locked
              </div>

              <div className="flex h-40 flex-col justify-end">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-white/50">
                  Message
                </p>
                <p className="text-xl font-black leading-tight text-white">
                  “Every song here says what I couldn’t.”
                </p>
              </div>
            </div>

            <div className="mb-5 flex items-end gap-1.5 rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
              {[24, 48, 30, 58, 34, 44, 26, 38, 54, 36, 62, 42 , 32 , 42 , 48 , 28 , 54].map(
                (height, index) => (
                  <span
                    key={index}
                    data-showcase="equalizer"
                    style={{ height: `${height}px` }}
                    className="w-full rounded-full bg-gradient-to-t from-primary to-secondary"
                  />
                )
              )}
            </div>

            <div className="space-y-3">
              {["Midnight Memories", "Soft Chaos", "Only For You"].map(
                (track, index) => (
                  <div
                    key={track}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black">
                        <BiPlay className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-white">{track}</p>
                        <p className="text-[11px] text-white/40">
                          Category {index + 1}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-white/35">
                      0{index + 2}:4{index}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}