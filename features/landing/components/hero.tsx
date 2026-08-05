import { HERO } from "@/constants/landing";
import { AppContainer } from "@/components/layout/app-container";
import { Button } from "@/components/ui/button";
import { DEMO_FARM } from "@/features/landing/data/demo-farm";
import { FarmStatusCard } from "@/components/cards/farm-status-card";

export function Hero() {
  return (
    <section className="py-24">
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

            <div className="mt-10 flex gap-4">
              <Button size="lg">
                {HERO.primaryButton}
              </Button>

              <Button variant="outline" size="lg">
                {HERO.secondaryButton}
              </Button>
            </div>
          </div>

          {/* Right Side */}
                <div className="flex justify-center">
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