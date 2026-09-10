import { T } from "@/features/settings/components/translated-text";
import { APP } from "@/constants/app";

export function Footer() {
  return (
    <footer id="contact" className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <p className="font-semibold">
            {APP.name}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            <T text={APP.slogan} />
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {APP.name}<T text=". All rights reserved." /></p>
      </div>
    </footer>
  );
}
