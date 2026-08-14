/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { APP } from "@/constants/app";
import { NAVIGATION } from "@/constants/navigation";
import { AppContainer } from "@/components/layout/app-container";
import { Button } from "@/components/ui/button";


export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <AppContainer>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}

          <Link href="/" className="flex items-center gap-2 transition hover:opacity-80">
            <img src="/logo/agromind-logo.png" alt="AgroMind" className="h-13 w-13"/>
              <span className="text-2xl font-bold text-green-700">
                {APP.name}
              </span>
          </Link>


          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {NAVIGATION.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 transition hover:text-green-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost">Sign In</Button>

            <Button>Get Started</Button>
          </div>
        </div>
      </AppContainer>
    </header>
  );
}