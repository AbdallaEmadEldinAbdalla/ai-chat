"use client";
import { BotIcon } from "./icons";

export const LoadingMessage = () => {
    return (
        <div className="flex flex-row gap-4 px-4 w-full md:w-[700px] md:px-0 first-of-type:pt-20">
            <div className="size-[24px] flex flex-col justify-center items-center shrink-0 text-zinc-400">
                <BotIcon />
            </div>

            <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-col space-y-2 flex-1">
                    <div className="space-y-2">
                        <div className="h-2 bg-gray-200 rounded-full w-3/4 animate-pulse" />
                        <div className="h-2 bg-gray-200 rounded-full w-3/4 animate-pulse" />
                        <div className="h-2 bg-gray-200 rounded-full w-1/2 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};
