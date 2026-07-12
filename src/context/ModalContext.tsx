'use client'
import React, {createContext, useContext, useState} from "react";

interface Props {
    open: boolean
    toggle: (id?: string) => void
    selectedId: string | null
}

const ModalContext = createContext<Props | null>(null)

export const useModal = () => {
    const ctx = useContext(ModalContext)
    if (!ctx) throw new Error('useModal must be used inside provider')
    return ctx
}

export function ModalProvider({children}: { children: React.ReactNode }) {

    const [open, setOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const toggle = (id?: string) => {
        if (typeof id === "string") {
            setSelectedId(id);
        }
        setOpen(prev => !prev);
    };


    return (
        <ModalContext.Provider
            value={{
                open,
                toggle,
                selectedId,
            }}
        >
            {children}
        </ModalContext.Provider>
    )
}