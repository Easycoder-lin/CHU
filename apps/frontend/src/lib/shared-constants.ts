import { ProductId } from "@/types";

export const PRODUCT_OPTIONS: Array<{
    id: ProductId;
    name: string;
    desc: string;
    badge: string;
    service: string; // The generic service name e.g. "Netflix", "Spotify"
    period: 'mo' | 'yr';
    defaultPrice: number;
    seats: number;
}> = [
        {
            id: "NETFLIX_ANNUAL",
            name: "Netflix Premium (Annual)",
            desc: "4K UHD + HDR, 4 slots sharing group.",
            badge: "Video",
            service: "Netflix",
            period: "yr",
            defaultPrice: 60, // approximate share per year
            seats: 4
        },
        {
            id: "SPOTIFY_ANNUAL",
            name: "Spotify Family (Annual)",
            desc: "Ad-free music, 6 accounts family plan.",
            badge: "Music",
            service: "Spotify",
            period: "yr",
            defaultPrice: 30,
            seats: 6
        },
        {
            id: "YOUTUBE_PREMIUM_ANNUAL",
            name: "YouTube Premium (Annual)",
            desc: "Ad-free, Background play, YouTube Music.",
            badge: "Video",
            service: "YouTube",
            period: "yr",
            defaultPrice: 40,
            seats: 6
        },
        {
            id: "PRIME_VIDEO_ANNUAL",
            name: "Prime Video (Annual)",
            desc: "Movies, TV shows & Amazon Prime benefits.",
            badge: "Video",
            service: "Amazon Prime", // Note: ServiceType might need update or mapping
            period: "yr",
            defaultPrice: 35,
            seats: 3 // varies
        },
        {
            id: "DISNEY_BUNDLE_ANNUAL",
            name: "Disney+ Bundle (Annual)",
            desc: "Disney+, Hulu, and ESPN+ bundle.",
            badge: "Video",
            service: "Disney+",
            period: "yr",
            defaultPrice: 80,
            seats: 4
        },
        {
            id: "APPLE_ONE_ANNUAL",
            name: "Apple One Premier (Annual)",
            desc: "iCloud+, TV+, Music, Arcade, Fitness+.",
            badge: "Bundle",
            service: "Apple One",
            period: "yr",
            defaultPrice: 60,
            seats: 6
        },
        {
            id: "CHATGPT_ANNUAL",
            name: "ChatGPT Plus (Annual)",
            desc: "Shared access to GPT-4 & advanced features.",
            badge: "AI",
            service: "ChatGPT", // Note: ServiceType might need update
            period: "yr",
            defaultPrice: 150, // Higher value
            seats: 4 // hypothetical sharing
        },
        {
            id: "GEMINI_ANNUAL",
            name: "Gemini Advanced (Annual)",
            desc: "Google's most capable AI model.",
            badge: "AI",
            service: "Gemini", // Note: ServiceType might need update
            period: "yr",
            defaultPrice: 150,
            seats: 4
        },
    ];
