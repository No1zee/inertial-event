import { motion } from "framer-motion";

interface BrandBlockProps {
    text: string;
    subtext?: string;
    gradient: string;
    icon?: React.ReactNode;
    bgImage?: string;
}

export function BrandBlock({ text, subtext, gradient, icon, bgImage }: BrandBlockProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`relative py-20 md:py-32 px-6 md:px-12 lg:px-16 overflow-hidden ${gradient}`}
        >
            {bgImage && (
                <div 
                    className="absolute inset-0 opacity-10 bg-cover bg-center mix-blend-overlay"
                    style={{ backgroundImage: `url(${bgImage})` }}
                />
            )}
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            
            <div className="relative z-10 max-w-4xl mx-auto text-center">
                {icon && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center mb-4"
                    >
                        {icon}
                    </motion.div>
                )}
                <motion.h2 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight"
                >
                    {text}
                </motion.h2>
                {subtext && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="text-zinc-300 text-sm md:text-base lg:text-lg"
                    >
                        {subtext}
                    </motion.p>
                )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        </motion.div>
    );
}
