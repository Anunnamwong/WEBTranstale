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
    <aside className="fixed sm:static inset-y-0 left-0 z-30 w-60 bg-white border-r border-neutral-200">
      <div className="h-16 flex items-center px-4 border-b border-neutral-200">
        <span className="font-semibold tracking-tight text-neutral-900">
          Project NextBase
        </span>
      </div>
      <nav className="p-2">
        {items.map((it) => {
          const active = router.pathname === it.href;
          return (
            <Link
              key={it.name}
              href={it.href}
              className={`group flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-1 transition-colors ${active ? "bg-indigo-50 text-indigo-700" : "hover:bg-neutral-50 text-neutral-700"}`}
            >
              <it.icon className="w-5 h-5" />
              <span className="flex-1">{it.name}</span>
              {active ? (
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default HomeSidebar;
