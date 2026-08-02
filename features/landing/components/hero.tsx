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
            <span className="inline-flex rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
              🌱 AI Powered Agriculture
            </span>

            <h1 className="mt-6 text-5xl font-bold leading-tight text-gray-900">
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