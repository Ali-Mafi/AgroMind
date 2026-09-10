/* eslint-disable @next/next/no-img-element */
import { T } from "@/features/settings/components/translated-text";
import Link from "next/link";
import { APP } from "@/constants/app";
import { NAVIGATION } from "@/constants/navigation";
import { AppContainer } from "@/components/layout/app-container";
import { buttonVariants } from "@/components/ui/button";


export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <AppContainer>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}

          <Link href="/" className="flex items-center gap-2 transition hover:opacity-80">
            <img src="/logo/agromind-logo.png" alt="AgroMind" className="size-10 sm:size-11"/>
              <span className="font-heading text-xl font-bold text-primary sm:text-2xl">
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
                <T text={item.label} />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className={buttonVariants({ variant: "ghost", className: "hidden sm:inline-flex" })}><T text="Sign In" /></Link>
            <Link href="/farms/new" className={buttonVariants({ className: "min-h-9 rounded-xl px-4" })}><T text="Get Started" /></Link>
          </div>
        </div>
      </AppContainer>
    </header>
  );
}
