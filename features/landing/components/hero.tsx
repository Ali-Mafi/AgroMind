import { HERO } from "@/constants/landing";
import { AppContainer } from "@/components/layout/app-container";
import { Button } from "@/components/ui/button";
import { DEMO_FARM } from "@/features/landing/data/demo-farm";
import { FarmStatusCard } from "@/components/cards/farm-status-card";


export function Hero() {
  return (
    <section className="py-24 relative overflow-hidden ">

    <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-background to-background" />

    <div className="absolute -top-24 right-0 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

    <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-green-400/10 blur-3xl" />



      <AppContainer>
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left Side */}
          <div>
            <div className="mb-6 inline-flex items-center rounded-full border border-green-200 bg-green-50 px-4 py-2">
              <span className="mr-2 text-lg">🌱</span>

              <span className="font-medium text-green-700">
                AI-Powered Precision Agriculture
              </span>
            </div>

            <h1 className="font-heading text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              {HERO.title}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              {HERO.subtitle}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" className="h-12 px-8 rounded-2xl font-semibold shadow-sm hover:scale-[1.02] transition-all duration-200">
                {HERO.primaryButton}
              </Button>

              <Button variant="outline" size="lg" className="h-12 px-8 rounded-2xl hover:bg-primary/5 transition-all duration-200">
                {HERO.secondaryButton}
              </Button>
            </div>
          </div>

          {/* Right Side */}
                <div className="mx-auto w-full max-w-md">
                <FarmStatusCard
                    farmName={DEMO_FARM.name}
                    location="Zaqeh, Qazvin"
                    moisture={DEMO_FARM.moisture}
                    temperature={27}
                    humidity={61}
                    weather={DEMO_FARM.weather}
                    recommendation={DEMO_FARM.recommendation}
                />

                </div>



        </div>
      </AppContainer>
    </section>
  );
}