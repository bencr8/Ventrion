"use client";

import React from "react";
import { MessageSquare, Github, Twitter, Send, Globe, BookOpen } from "lucide-react";

export function SocialsSection() {
  const socials = [
    {
      name: "GitHub",
      description: "Inspect the open-source Anchor contracts and client SDK.",
      href: "https://github.com/bencr8/Ventrion",
      icon: Github,
      tag: "Source Code",
    },
    {
      name: "Twitter / X",
      description: "Follow real-time launch announcements, venture spotlights, and research.",
      href: "https://x.com/VentrionLabs",
      icon: Twitter,
      tag: "Announcements",
    },
    {
      name: "Telegram / Community",
      description: "Connect directly with the core engineering team and fellow founders.",
      href: "https://t.me/VentrionProtocol",
      icon: Send,
      tag: "Founders Chat",
    },
    {
      name: "Documentation",
      description: "Deep dive into the 47KB Main Manifesto and math specification.",
      href: "/documentation",
      icon: BookOpen,
      tag: "Manifesto",
    },
  ];

  return (
    <section className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 py-16 select-none">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111113] font-jakarta">
          Join the Ventrion Ecosystem
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#6E6964] font-jakarta">
          Built openly on Solana for serious builders, long-term backers, and institutional capital.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {socials.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group p-6 rounded-[26px] bg-white/80 border border-black/[0.06] hover:border-black/[0.15] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-black/[0.05] flex items-center justify-center text-[#111113] group-hover:scale-105 group-hover:bg-[#FF5C18] group-hover:text-white transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#8E8B88] uppercase tracking-wider">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#111113] font-jakarta group-hover:text-[#FF5C18] transition-colors">
                  {item.name}
                </h3>
                <p className="mt-1.5 text-xs text-[#6E6964] leading-relaxed">
                  {item.description}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#111113] group-hover:text-[#FF5C18] transition-colors">
                <span>Connect</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
