"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
    callbackUrl?: string;
    className?: string;
    variant?: "default" | "nav";
}

export default function LogoutButton({ callbackUrl = "/", className = "", variant = "default" }: LogoutButtonProps) {
    const handleLogout = () => signOut({ callbackUrl });

    if (variant === "nav") {
        return (
            <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border border-white/40 bg-white/10 backdrop-blur-md text-white text-sm font-semibold hover:bg-white hover:text-teal-900 hover:border-white transition-colors duration-200 shadow-sm shadow-black/20 ${className}`}
            >
                <LogOut size={14} />
                Log Out
            </button>
        );
    }

    return (
        <button
            onClick={handleLogout}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 w-full ${className}`}
        >
            <LogOut size={16} />
            Log Out
        </button>
    );
}
