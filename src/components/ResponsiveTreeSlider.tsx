'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import gsap from 'gsap';

import Line from './ui/Line';
import Modal from '@/components/ui/Modal';

type LineVariant = 'blue' | 'pink' | 'purple' | 'orange';
type HoverLine = 'left' | 'right';

interface Track {
    id: number;
    track_name?: string;
    artist_name?: string;
    album_name?: string;
    file_url?: string | null;
    cover_image?: string | null;
    lyrics?: string | null;
    description?: string | null;
    duration?: number | string | null;
}

interface Category {
    id: number;
    name: string;
    description?: string | null;
    sort_order?: number;
    tracks?: Track[];
}

interface SliderItem extends Category {
    variant: LineVariant;
    hoverLine?: HoverLine;
}

interface SliderGroup {
    items: SliderItem[];
}

interface ResponsiveTreeSliderProps {
    categories: Category[];
}

const LINE_STYLE_CONFIGS: {
    variant: LineVariant;
    hoverLine?: HoverLine;
}[] = [
    { variant: 'blue', hoverLine: 'right' },
    { variant: 'pink', hoverLine: 'left' },
    { variant: 'purple', hoverLine: 'right' },
    { variant: 'orange', hoverLine: 'left' },
    { variant: 'blue', hoverLine: 'right' },
    { variant: 'pink', hoverLine: 'left' },
    { variant: 'purple', hoverLine: 'right' },
    { variant: 'orange', hoverLine: 'left' },
];

const ResponsiveTreeSlider: React.FC<ResponsiveTreeSliderProps> = ({ categories }) => {
    const params = useParams();
    const token = params.id as string;

    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);

    const sliderItems = useMemo<SliderItem[]>(() => {
        return categories.slice(0, 8).map((category, index) => ({
            ...category,
            variant: LINE_STYLE_CONFIGS[index]?.variant || 'blue',
            hoverLine: LINE_STYLE_CONFIGS[index]?.hoverLine,
        }));
    }, [categories]);

    const sliderGroups = useMemo<SliderGroup[]>(() => {
        const groups: SliderGroup[] = [];

        for (let i = 0; i < sliderItems.length; i += 2) {
            groups.push({
                items: sliderItems.slice(i, i + 2),
            });
        }

        return groups;
    }, [sliderItems]);

    const totalSlides = sliderGroups.length;

    const selectedCategory = useMemo(() => {
        if (!selectedCategoryId) return null;
        return categories.find((category) => category.id === selectedCategoryId) || null;
    }, [categories, selectedCategoryId]);

    const currentItems = sliderGroups[currentIndex]?.items || [];
    const leftItem = currentItems[0];
    const rightItem = currentItems[1];

    useEffect(() => {
        if (currentIndex > totalSlides - 1) {
            setCurrentIndex(0);
        }
    }, [currentIndex, totalSlides]);

    const closeModal = () => {
        setIsOpen(false);
    };

    const handleItemClick = (id: number) => {
        setSelectedCategoryId(id);
        setIsOpen(true);
    };

    const animateTransition = (nextIndex: number, direction: 'next' | 'prev') => {
        if (isAnimating || nextIndex === currentIndex) return;

        setIsAnimating(true);

        const left = leftRef.current;
        const right = rightRef.current;

        const exitLeftX = direction === 'next' ? -100 : 100;
        const exitRightX = direction === 'next' ? 100 : -100;
        const enterLeftX = direction === 'next' ? 100 : -100;
        const enterRightX = direction === 'next' ? -100 : 100;

        const tl = gsap.timeline({
            onComplete: () => {
                setCurrentIndex(nextIndex);

                requestAnimationFrame(() => {
                    gsap.fromTo(
                        leftRef.current,
                        { opacity: 0, x: enterLeftX },
                        {
                            opacity: 1,
                            x: 0,
                            duration: 0.4,
                            ease: 'power2.out',
                        }
                    );

                    gsap.fromTo(
                        rightRef.current,
                        { opacity: 0, x: enterRightX },
                        {
                            opacity: 1,
                            x: 0,
                            duration: 0.4,
                            ease: 'power2.out',
                            onComplete: () => setIsAnimating(false),
                        }
                    );
                });
            },
        });

        tl.to(left, {
            opacity: 0,
            x: exitLeftX,
            duration: 0.22,
            ease: 'power2.inOut',
        }).to(
            right,
            {
                opacity: 0,
                x: exitRightX,
                duration: 0.22,
                ease: 'power2.inOut',
            },
            '<'
        );
    };

    const nextSlide = () => {
        if (totalSlides <= 1) return;

        const nextIndex = currentIndex < totalSlides - 1 ? currentIndex + 1 : 0;
        animateTransition(nextIndex, 'next');
    };

    const prevSlide = () => {
        if (totalSlides <= 1) return;

        const nextIndex = currentIndex > 0 ? currentIndex - 1 : totalSlides - 1;
        animateTransition(nextIndex, 'prev');
    };

    if (!categories.length) {
        return (
            <div className="w-full min-h-[60vh] flex items-center justify-center text-white/70 text-center px-6">
                هنوز کتگوری‌ای برای این پلی‌لیست ثبت نشده.
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-[70vh] flex flex-col justify-center rounded-xl shadow-inner">
            <div className="relative w-full h-full flex items-center justify-center px-10">
                <div ref={leftRef} className="w-1/2 h-full flex items-center justify-center">
                    {leftItem && (
                        <div className="relative h-full flex items-center justify-center">
                            <button
                                type="button"
                                onClick={() => handleItemClick(leftItem.id)}
                                className="block"
                            >
                                <Line
                                    id={leftItem.id}
                                    variant={leftItem.variant}
                                    hoverLine={leftItem.hoverLine}
                                    title={leftItem.name}
                                    description={leftItem.description || ''}
                                    modal={false}
                                />
                            </button>
                        </div>
                    )}
                </div>

                <div
                    className="
                        absolute left-1/2 top-1/2 w-[3px] h-[70vh]
                        -translate-x-1/2 -translate-y-1/2 pointer-events-none
                        bg-rose-600 rounded-full shadow-md shadow-rose-600/50
                        before:content-[''] before:absolute before:-inset-1 before:bg-rose-600 before:opacity-60 before:blur-md
                        after:content-[''] after:absolute after:-inset-1 after:rounded-full after:bg-rose-600 after:opacity-50 after:blur-xl
                    "
                />

                <div ref={rightRef} className="w-1/2 h-full flex items-center justify-center">
                    {rightItem && (
                        <div className="w-full h-full flex items-center justify-center">
                            <button
                                type="button"
                                onClick={() => handleItemClick(rightItem.id)}
                                className="block"
                            >
                                <Line
                                    id={rightItem.id}
                                    variant={rightItem.variant}
                                    hoverLine={rightItem.hoverLine}
                                    title={rightItem.name}
                                    description={rightItem.description || ''}
                                    modal={false}
                                />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex justify-between items-center px-4">
                <button
                    type="button"
                    onClick={prevSlide}
                    disabled={totalSlides <= 1 || isAnimating}
                    className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
                        totalSlides <= 1 || isAnimating
                            ? 'bg-primary/30 text-white/70 cursor-not-allowed'
                            : 'bg-primary/50 text-white active:scale-95'
                    }`}
                >
                    ←
                </button>

                <span className="text-gray-600 font-semibold bg-white/80 px-3 py-1 rounded-full text-sm shadow-sm">
                    {currentIndex + 1} / {totalSlides}
                </span>

                <button
                    type="button"
                    onClick={nextSlide}
                    disabled={totalSlides <= 1 || isAnimating}
                    className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
                        totalSlides <= 1 || isAnimating
                            ? 'bg-primary/30 text-white/70 cursor-not-allowed'
                            : 'bg-primary/50 text-white active:scale-95'
                    }`}
                >
                    →
                </button>
            </div>

            <Modal
                isOpen={isOpen}
                closeModal={closeModal}
                title={selectedCategory?.name || 'category'}
                actions={
                    selectedCategoryId ? (
                        <Link
                            href={`/playlist/${token}/category/${selectedCategoryId}`}
                            className="uppercase text-white text-lg flex items-center justify-center h-full border-2 border-primary rounded-md w-full p-2 hover:bg-primary transition-colors"
                        >
                            category
                        </Link>
                    ) : null
                }
            >
                <div>
                    {selectedCategory?.description ? (
                        selectedCategory.description.split('\n').map((line, index) => (
                            <p key={index} className="text-right mb-2 text-lg font-vazir">
                                {line}
                            </p>
                        ))
                    ) : (
                        <p className="text-center text-white/60">توضیحی برای این کتگوری ثبت نشده.</p>
                    )}

                    {selectedCategory?.tracks?.length ? (
                        <div className="mt-5 border-t border-white/10 pt-4">
                            <p className="text-center text-white/70 mb-3">
                                تعداد موزیک‌ها: {selectedCategory.tracks.length}
                            </p>
                        </div>
                    ) : null}
                </div>
            </Modal>
        </div>
    );
};

export default ResponsiveTreeSlider;