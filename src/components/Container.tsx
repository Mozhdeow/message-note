import React from 'react';

interface Props {
    children: React.ReactNode;
    className?: string;
}

export default function ContainerContent({children, className}: Props) {
    return (
        <div className={`${className} flex  w-full flex-wrap gap-8 sm:pt-32 sm:px-28 pt-20 pb-8`}>
            {children}
        </div>
    );
}
