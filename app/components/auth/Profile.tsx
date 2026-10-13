"use client";

import { useSession } from "next-auth/react";
import { User } from "lucide-react";
import Image from "next/image";

export default function Profile() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-sm">
                <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    if (!session?.user) {
        return null;
    }

    const { name, email, image } = session.user;

    return (
        <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
                {image ? (
                    <Image
                        src={image}
                        alt={name || "User profile"}
                        fill
                        className="object-cover"
                        sizes="56px"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <User size={24} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                )}
            </div>
            <div>
                <p className="font-semibold text-zinc-900 dark:text-white">{name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
            </div>
        </div>
    );
}
