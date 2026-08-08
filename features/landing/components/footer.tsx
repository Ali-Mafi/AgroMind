import { APP } from "@/constants/app";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <p className="font-semibold">
            {APP.name}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {APP.slogan}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {APP.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}