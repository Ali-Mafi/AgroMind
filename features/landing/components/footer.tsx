import { T } from "@/features/settings/components/translated-text";
import { APP } from "@/constants/app";

export function Footer() {
  return (
    <footer id="contact" className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <p className="font-semibold">{APP.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <T text={APP.slogan} />
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div
            dangerouslySetInnerHTML={{
              __html: 
              `<a 
                referrerpolicy='origin' 
                target='_blank' 
                href='https://trustseal.enamad.ir/?id=8024287&Code=GGuR0pCbpfBTYSPKvDTV1QHV6hmsuXXc'
                class='cursor-pointer p-2 lg:p-4 flex items-center justify-center'
                style='border: 1px solid #e0e0e2, border-radius: 8px'>
                  <div role='img' style='width: 75px, height: 75px'>
                    <img 
                    referrerpolicy='origin' 
                    src='https://trustseal.enamad.ir/logo.aspx?id=8024287&Code=GGuR0pCbpfBTYSPKvDTV1QHV6hmsuXXc' 
                    alt='نماد اعتماد الکترونیک'
                    style='cursor:pointer' 
                    code='GGuR0pCbpfBTYSPKvDTV1QHV6hmsuXXc' 
                    width='75' 
                    height='75'>
                  </div>
              </a>`,
            }}
          />

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {APP.name}<T text=". All rights reserved." />
          </p>
        </div>
      </div>
    </footer>
  );
}
