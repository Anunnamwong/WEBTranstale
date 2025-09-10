import { HomeIcon, LanguageIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

const HomeSidebar: React.FC = () => {
  const router = useRouter();

  const items = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Translate", href: "/home", icon: LanguageIcon },
    { name: "Load Test", href: "/home2", icon: LanguageIcon },
    { name: "Moderation", href: "/moderation", icon: LanguageIcon },
  ];

  return (
    <aside className="fixed sm:static inset-y-0 left-0 z-30 w-56 bg-white border-r shadow-sm">
      <div className="h-16 flex items-center px-4 border-b">
        <span className="font-semibold">Translator</span>
      </div>
      <nav className="p-2">
        {items.map((it) => (
          <Link
            key={it.name}
            href={it.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-1 transition-colors
              ${router.pathname === it.href ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"}
            `}
          >
            <it.icon className="w-5 h-5" />
            <span>{it.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default HomeSidebar;
