import Header from "@/components/Header";
import {ModalProvider} from "@/context/ModalContext";

export default function SiteLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <ModalProvider>
            <Header />
            {children}
            </ModalProvider>
        </>
    );
}