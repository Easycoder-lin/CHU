import React from "react"
import { ArrowRight, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModeCardProps {
    title: string
    description: string
    icon: LucideIcon
    onClick: () => void
    gradient: string
    iconColor: string
    shadowColor: string
    buttonText: string
}

export function ModeCard({
    title,
    description,
    icon: Icon,
    onClick,
    gradient,
    iconColor,
    shadowColor,
    buttonText,
}: ModeCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative bg-white rounded-3xl p-8 text-left border-2 border-transparent",
                "transition-all duration-300 hover:-translate-y-1",
                "hover:shadow-xl",
                iconColor === "text-[#FF6B6B]" ? "hover:border-[#FF6B6B]" : "", // Dynamic border slightly tricky with props, using conditional or strict tailwind
                // Simplifying hover border for now to generic or pass a className
                "hover:border-primary/20",
                shadowColor // Passing raw classes like "shadow-lg shadow-orange-100/50"
            )}
        >
            <div
                className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110",
                    gradient,
                    shadowColor.replace("/50", "") // Hacky but works for demo, better to pass separate props
                )}
            >
                <Icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
            <div
                className={cn(
                    "flex items-center font-semibold group-hover:gap-3 gap-2 transition-all",
                    iconColor
                )}
            >
                <span>{buttonText}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
        </button>
    )
}
