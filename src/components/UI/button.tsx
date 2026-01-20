"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
    size?: "sm" | "md" | "lg";
    state?: "default" | "loading" | "success" | "error";
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    className,
    variant = "primary",
    size = "md",
    state = "default",
    children,
    disabled,
    ...props
}, ref) => {

    const variants = {
        primary: "bg-white text-black hover:bg-zinc-200 shadow-lg hover:shadow-xl",
        secondary: "bg-zinc-800 text-white border border-white/10 hover:bg-zinc-700 hover:border-white/20",
        ghost: "bg-transparent text-zinc-300 hover:text-white hover:bg-white/5",
        danger: "bg-red-600 text-white hover:bg-red-500 shadow-red-900/20",
        outline: "bg-transparent border border-zinc-700 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-500"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-6 py-3 text-sm font-semibold",
        lg: "px-8 py-4 text-base font-bold"
    };

    const widthMap = {
        default: "auto",
        loading: "auto",
        success: "auto",
        error: "auto"
    }

    return (
        <motion.button
            ref={ref}
            className={cn(
                "relative rounded-full inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={state === 'loading' || disabled}
            whileHover={state === 'default' && !disabled ? { scale: 1.02, y: -1 } : {}}
            whileTap={state === 'default' && !disabled ? { scale: 0.98 } : {}}
            layout
            {...props as any} // Cast to any to avoid complex framer-motion type conflicts with ref
        >
            {state === 'loading' && (
                <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                </motion.div>
            )}

            {children}

            {state === 'success' && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-2 text-green-500"
                >
                    <Check size={18} />
                </motion.div>
            )}
        </motion.button>
    );
});

Button.displayName = "Button";
