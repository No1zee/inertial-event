"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function Greeting() {
    const [greeting, setGreeting] = useState("Welcome Back");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="pb-4 px-4 md:px-12 pt-8"
        >
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                {greeting}
            </h1>
            <p className="text-zinc-400 text-lg">
                Ready to dive back in?
            </p>
        </motion.div>
    );
}
