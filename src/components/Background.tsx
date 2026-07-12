'use client'

import React, {useState, useEffect, useRef} from 'react'
import gsap from 'gsap'
import './app.css'

interface BackgroundProps {
    children: React.ReactNode
}

const NUM_STARS = 150
const NUM_SHOOTING_STARS = 5

export default function Background({children}: BackgroundProps) {
    const starsRef = useRef<HTMLDivElement>(null)
    const cloudsRef = useRef<HTMLDivElement>(null)
    const shootingStarsRef = useRef<HTMLDivElement>(null)


    const [starData] = useState(() => {
        const data = []
        for (let i = 0; i < NUM_STARS; i++) {
            data.push({
                id: i,
                top: Math.random() * 100,
                left: Math.random() * 100,
                size: Math.random() * 2 + 1,
                animationDuration: gsap.utils.random(1, 3),
            })
        }
        return data
    })

    useEffect(() => {
        if (!cloudsRef.current) return

        const clouds = cloudsRef.current.querySelectorAll('.cloud')

        clouds.forEach((cloud, i) => {
            gsap.to(cloud, {
                x: '200vw',
                duration: 24 + i * 10,
                repeat: -1,
                ease: 'linear',
                modifiers: {
                    x: gsap.utils.unitize(x => (parseFloat(x) % window.innerWidth) - 100),
                },
            })
        })
    }, [])

    useEffect(() => {
        if (!shootingStarsRef.current) return

        const container = shootingStarsRef.current
        container.innerHTML = ''

        for (let i = 0; i < NUM_SHOOTING_STARS; i++) {
            const star = document.createElement('div')
            star.className = 'shooting-star absolute'
            star.style.cssText = `
        position: absolute;
        height: 28px;
        width: 2px;
        border-radius: 1px;
        opacity: 0;
        background: linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,145,0.6));
      `

            container.appendChild(star)

            const startX = gsap.utils.random(-window.innerWidth * 0.4, window.innerWidth * 0.4)
            const startY = window.innerHeight + gsap.utils.random(50, 150)
            gsap.set(star, {x: startX, y: startY})

            const endX = startX + gsap.utils.random(-200, 200)
            const endY = -150

            const tl = gsap.timeline({
                repeat: -1,
                repeatDelay: gsap.utils.random(3, 8),
                delay: gsap.utils.random(0, 4),
            })

            tl.to(star, {
                opacity: 1,
                x: startX + (endX - startX) * 0.5,
                y: startY + (endY - startY) * 0.5,
                duration: 2,
                ease: 'power1.out',
            })

            tl.to(star, {
                opacity: 0.8,
                x: endX,
                y: endY,
                duration: 2,
                ease: 'power1.in',
                onComplete: () => {
                    gsap.set(star, {opacity: 0, x: startX, y: startY})
                },
            })
        }
    }, [])


    const clouds = Array.from({length: 4}, (_, i) => i + 1).map(c => (
        <div
            key={c}
            className="cloud absolute opacity-20"
            style={{
                top: `${30 + c * 10}%`,
                left: `${-160 * c}px`,
                width: '300px',
                height: '110px',
                background: 'radial-gradient(ellipse at center, white 0%, #ccc 50%, transparent 100%)',
                filter: 'blur(40px)',
                borderRadius: '50%',
                transform: 'scale(1.5)',
            }}
        />
    ))

    return (
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-[#020817] to-[#0b1b30]">

            <div ref={starsRef} className="absolute inset-0">
                {starData.map(star => (
                    <div
                        key={star.id}
                        className="absolute rounded-full bg-white sparkle"
                        style={{
                            top: `${star.top}%`,
                            left: `${star.left}%`,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            animation: `sparkle ${star.animationDuration}s infinite alternate ease-in-out`,
                        }}
                    />
                ))}
            </div>

            <div ref={cloudsRef} className="absolute inset-0 overflow-hidden pointer-events-none">
                {clouds}
            </div>

            <div ref={shootingStarsRef} className="absolute inset-0 pointer-events-none"/>

            <div className="relative ">{children}</div>
        </div>
    )
}