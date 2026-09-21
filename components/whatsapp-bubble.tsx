"use client";

import { MessageCircle } from "lucide-react";
import { waLink } from "@/config";

export function WhatsAppBubble() {
  return (
    <a
      href={waLink("Hello Amata, I would like to enquire about a property.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Amata on WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/20 ring-4 ring-white transition hover:-translate-y-1 hover:bg-[#20bd5a] print:hidden"
    >
      <MessageCircle className="size-7" fill="currentColor" />
      <span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-[#25D366]/35" />
    </a>
  );
}
