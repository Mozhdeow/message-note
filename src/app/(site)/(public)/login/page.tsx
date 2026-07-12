import React from 'react';
import LoginForm from "./partials/LoginForm";
import Background from "@/components/Background";

function Page() {
    return (
        <Background>
            <div className="flex flex-col items-center justify-center w-full h-screen px-4">
                <LoginForm/>
            </div>
        </Background>

    );
}

export default Page;