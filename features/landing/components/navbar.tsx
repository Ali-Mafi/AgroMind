/* eslint-disable @next/next/no-img-element */
import { T } from "@/features/settings/components/translated-text";
import Link from "next/link";
import { APP } from "@/constants/app";
import { NAVIGATION } from "@/constants/navigation";
import { AppContainer } from "@/components/layout/app-container";
import { buttonVariants } from "@/components/ui/button";


export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95">
      <AppContainer>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}

          <Link href="/" className="flex items-center gap-2 transition hover:opacity-80">
            <img src="/logo/agromind-logo.png" alt="AgroMind" className="size-8 sm:size-11"/>
              <span className="font-heading text-base font-bold text-primary sm:text-2xl">
                {APP.name}
              </span>
          </Link>


          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {NAVIGATION.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-primary"
              >
                <T text={item.label} />
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            <Link href="/login" className={buttonVariants({ variant: "ghost", className: "min-h-11 px-2 text-xs sm:px-4 sm:text-sm" })}><T text="Sign In" /></Link>
            <a href="#install" className={buttonVariants({ className: "min-h-11 rounded-xl px-2.5 text-xs sm:px-4 sm:text-sm" })}><T text="Start managing" /></a>
          </div>
        </div>
      </AppContainer>
    </header>
  );
}
