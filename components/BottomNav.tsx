"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", icon: "🎮", label: "Spel" },
  { href: "/topplista", icon: "🏆", label: "Topplista" },
  { href: "/statistik", icon: "📊", label: "Statistik" },
  { href: "/grupper", icon: "👥", label: "Grupper" }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`nav-btn ${isActive ? "is-active" : ""}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
