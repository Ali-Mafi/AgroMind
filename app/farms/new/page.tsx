"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, Plus, Trash2 } from "lucide-react";
import { useFarm } from "@/features/farms/context/farm-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FarmType = "farm" | "garden";

interface GardenPlant {
  id: number;
  name: string;
  quantity: string;
  spacing: string;
  age: string;
}

export default function NewFarmPage() {
  const { addFarm } = useFarm();
  const [step, setStep] = useState(1);
  const [farmType, setFarmType] = useState<FarmType | null>(null);

  const router = useRouter();

  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");

  const [areaMode, setAreaMode] = useState<"direct" | "dimensions">(
    "direct",
  );
  const [area, setArea] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");

  const [crop, setCrop] = useState("");
  const [irrigationType, setIrrigationType] = useState("");

  const [plants, setPlants] = useState<GardenPlant[]>([]);

  const calculatedArea = useMemo(() => {
    const parsedLength = Number(length);
    const parsedWidth = Number(width);

    if (parsedLength > 0 && parsedWidth > 0) {
      return parsedLength * parsedWidth;
    }

    return 0;
  }, [length, width]);

  const finalArea =
    areaMode === "dimensions" ? calculatedArea : Number(area) || 0;

  const totalSteps = farmType === "farm" ? 6 : 5;

  const addPlant = () => {
    if (plants.length >= 5) return;

    setPlants((current) => [
      ...current,
      {
        id: Date.now(),
        name: "",
        quantity: "",
        spacing: "",
        age: "",
      },
    ]);
  };

  const removePlant = (id: number) => {
    setPlants((current) => current.filter((plant) => plant.id !== id));
  };

  const updatePlant = (
    id: number,
    field: keyof Omit<GardenPlant, "id">,
    value: string,
  ) => {
    setPlants((current) =>
      current.map((plant) =>
        plant.id === id
          ? {
              ...plant,
              [field]: value,
            }
          : plant,
      ),
    );
  };

  const nextStep = () => {
    if (step >= totalSteps) return;

    if (step === 1 && !farmType) return;

    setStep((current) => current + 1);
  };

  const previousStep = () => {
    if (step <= 1) return;
    setStep((current) => current - 1);
  };

  const handleCreateFarm = () => {
  if (!farmType) return;

  const newFarm = {
    id: `${farmType}-${Date.now()}`,
    name:
      farmName.trim() ||
      (farmType === "farm" ? "New Farm" : "New Garden"),
    location: location.trim() || "Not specified",
    area: finalArea,
    type: farmType,
    ...(farmType === "farm"
      ? {
          crop: crop.trim()
            ? {
                id: `crop-${Date.now()}`,
                name: crop.trim(),
              }
            : undefined,
          irrigationType: irrigationType || undefined,
        }
      : {
          plants: plants.map((plant) => ({
            id: `plant-${plant.id}`,
            name: plant.name.trim() || "Unnamed plant",
            quantity: Number(plant.quantity) || 0,
            spacing: Number(plant.spacing) || 0,
            age: Number(plant.age) || 0,
          })),
        }),
  };

  addFarm(newFarm);
  router.push(`/farms/${newFarm.id}`);
};

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-0">      
      <div className="space-y-1">
        <Link
          href="/farms"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Farms
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">
          Farm Management
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Add New {farmType === "garden" ? "Garden" : "Farm"}
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Add your information step by step.
        </p>
      </div>

      {/* Progress */}
      <div
        className="grid grid-cols-5 gap-2 px-1 sm:gap-3"  
        style={{
          gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: totalSteps }, (_, index) => index + 1).map(
          (item) => (
            <div key={item}>
              <div
                className={`h-2 rounded-full transition-colors ${
                  item <= step ? "bg-primary" : "bg-muted"
                }`}
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Step {item}
              </p>
            </div>
          ),
        )}
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">
                What do you want to manage?
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Choose the type of land you want to manage with AgroMind.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFarmType("farm")}
                className={`group rounded-2xl border p-6 text-left transition-all ${
                  farmType === "farm"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "bg-background hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <div className="text-4xl">🌾</div>

                <h3 className="mt-4 text-lg font-bold">Farm</h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  For agricultural land used for crops and larger-scale
                  farming.
                </p>

                {farmType === "farm" && (
                  <span className="mt-4 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Selected
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFarmType("garden")}
                className={`group rounded-2xl border p-6 text-left transition-all ${
                  farmType === "garden"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "bg-background hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <div className="text-4xl">🌳</div>

                <h3 className="mt-4 text-lg font-bold">Garden</h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  For gardens, orchards, and smaller cultivated areas.
                </p>

                {farmType === "garden" && (
                  <span className="mt-4 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Selected
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">
                {farmType === "farm"
                  ? "Farm Information"
                  : "Garden Information"}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Add the basic information about your{" "}
                {farmType === "farm" ? "farm" : "garden"}.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="farm-name"
                  className="text-sm font-medium"
                >
                  {farmType === "farm" ? "Farm Name" : "Garden Name"}
                </label>

                <input
                  id="farm-name"
                  type="text"
                  value={farmName}
                  onChange={(event) => setFarmName(event.target.value)}
                  placeholder={
                    farmType === "farm" ? "e.g. My Farm" : "e.g. My Garden"
                  }
                  className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="farm-location"
                  className="text-sm font-medium"
                >
                  Location
                </label>

                <div className="relative mt-2">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="farm-location"
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="e.g. Qazvin, Iran"
                    className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Area</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Enter the area directly or calculate it from the dimensions.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAreaMode("direct")}
                className={`rounded-xl border p-4 text-left transition-all ${
                  areaMode === "direct"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
              >
                <p className="font-semibold">Enter area</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the total area directly.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAreaMode("dimensions")}
                className={`rounded-xl border p-4 text-left transition-all ${
                  areaMode === "dimensions"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
              >
                <p className="font-semibold">Calculate from dimensions</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Use length and width.
                </p>
              </button>
            </div>

            {areaMode === "direct" && (
              <div>
                <label
                  htmlFor="area"
                  className="text-sm font-medium"
                >
                  Area
                </label>

                <div className="relative mt-2">
                  <input
                    id="area"
                    type="number"
                    min="0"
                    value={area}
                    onChange={(event) => setArea(event.target.value)}
                    placeholder="e.g. 6000"
                    className="w-full rounded-xl border bg-background px-3 py-2.5 pr-14 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    m²
                  </span>
                </div>
              </div>
            )}

            {areaMode === "dimensions" && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="length"
                      className="text-sm font-medium"
                    >
                      Length
                    </label>

                    <div className="relative mt-2">
                      <input
                        id="length"
                        type="number"
                        min="0"
                        value={length}
                        onChange={(event) =>
                          setLength(event.target.value)
                        }
                        placeholder="e.g. 100"
                        className="w-full rounded-xl border bg-background px-3 py-2.5 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        m
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="width"
                      className="text-sm font-medium"
                    >
                      Width
                    </label>

                    <div className="relative mt-2">
                      <input
                        id="width"
                        type="number"
                        min="0"
                        value={width}
                        onChange={(event) =>
                          setWidth(event.target.value)
                        }
                        placeholder="e.g. 60"
                        className="w-full rounded-xl border bg-background px-3 py-2.5 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-primary/5 p-5">
                  <p className="text-sm text-muted-foreground">
                    Estimated Area
                  </p>

                  <p className="mt-1 text-2xl font-bold text-primary">
                    {calculatedArea.toLocaleString()} m²
                  </p>

                  {calculatedArea > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {length}m × {width}m
                    </p>
                  )}
                </div>
              </div>
            )}

            {finalArea > 0 && areaMode === "direct" && (
              <div className="rounded-xl bg-primary/5 p-5">
                <p className="text-sm text-muted-foreground">
                  Selected Area
                </p>

                <p className="mt-1 text-2xl font-bold text-primary">
                  {finalArea.toLocaleString()} m²
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && farmType === "farm" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Crop</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Add the main crop grown on this farm.
              </p>
            </div>

            <div>
              <label
                htmlFor="crop"
                className="text-sm font-medium"
              >
                Crop
              </label>

              <input
                id="crop"
                type="text"
                value={crop}
                onChange={(event) => setCrop(event.target.value)}
                placeholder="e.g. Forage Corn"
                className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {/* STEP 4 GARDEN */}
        {step === 4 && farmType === "garden" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Plants & Trees</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Add up to 5 types of trees or plants in this garden.
              </p>
            </div>

            {plants.length === 0 && (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="font-medium">No plants added yet</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Add the tree or plant types you grow in this garden.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {plants.map((plant, index) => (
                <div
                  key={plant.id}
                  className="rounded-2xl border bg-background p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        Plant / Tree {index + 1}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Add the details for this plant type.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removePlant(plant.id)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove plant"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        Plant / Tree Name
                      </label>

                      <input
                        type="text"
                        value={plant.name}
                        onChange={(event) =>
                          updatePlant(
                            plant.id,
                            "name",
                            event.target.value,
                          )
                        }
                        placeholder="e.g. Late-blooming Persian walnut"
                        className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium">
                          Quantity
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={plant.quantity}
                          onChange={(event) =>
                            updatePlant(
                              plant.id,
                              "quantity",
                              event.target.value,
                            )
                          }
                          placeholder="e.g. 250"
                          className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Spacing
                        </label>

                        <div className="relative mt-2">
                          <input
                            type="number"
                            min="0"
                            value={plant.spacing}
                            onChange={(event) =>
                              updatePlant(
                                plant.id,
                                "spacing",
                                event.target.value,
                              )
                            }
                            placeholder="e.g. 6"
                            className="w-full rounded-xl border bg-background px-3 py-2.5 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />

                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            m
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Age
                        </label>

                        <div className="relative mt-2">
                          <input
                            type="number"
                            min="0"
                            value={plant.age}
                            onChange={(event) =>
                              updatePlant(
                                plant.id,
                                "age",
                                event.target.value,
                              )
                            }
                            placeholder="e.g. 4"
                            className="w-full rounded-xl border bg-background px-3 py-2.5 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />

                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            yrs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {plants.length < 5 && (
              <button
                type="button"
                onClick={addPlant}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" />
                Add Plant / Tree
              </button>
            )}

            <p className="text-center text-xs text-muted-foreground">
              {plants.length} of 5 plant types added
            </p>
          </div>
        )}

        {/* STEP 5 FARM - IRRIGATION */}
        {step === 5 && farmType === "farm" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Irrigation</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Choose how this farm is irrigated.
              </p>
            </div>

            <div>
              <label
                htmlFor="irrigation-type"
                className="text-sm font-medium text-foreground"
              >
                Irrigation Type
              </label>

              <div className="relative mt-2">
                <select
                  id="irrigation-type"
                  value={irrigationType}
                  onChange={(event) => setIrrigationType(event.target.value)}
                  className="
                    w-full appearance-none rounded-xl
                    border border-border
                    bg-background
                    px-3.5 py-3 pr-10
                    text-sm text-foreground
                    shadow-sm
                    outline-none
                    transition-all duration-200 ease-out
                    hover:border-primary/40
                    hover:shadow-[0_2px_8px_rgba(34,197,94,0.08)]
                    focus:border-primary
                    focus:ring-4 focus:ring-primary/10
                    focus:shadow-[0_4px_14px_rgba(34,197,94,0.12)]
                    cursor-pointer
                  "
                >
                  <option value="" disabled>
                    Select irrigation type
                  </option>

                  <option value="flood">Flood Irrigation</option>
                  <option value="drip">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler Irrigation</option>
                  <option value="other">Other</option>
                </select>

                <svg
                  className="
                    pointer-events-none
                    absolute right-3.5 top-1/2
                    h-4 w-4
                    -translate-y-1/2
                    text-muted-foreground
                    transition-transform duration-200
                  "
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* REVIEW */}
        {((step === 6 && farmType === "farm") ||
          (step === 5 && farmType === "garden")) && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">
                Review {farmType === "farm" ? "Farm" : "Garden"}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Check your information before creating it.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Type
                </p>

                <p className="mt-1 font-semibold capitalize">
                  {farmType}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Name
                </p>

                <p className="mt-1 font-semibold">
                  {farmName || "Not specified"}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Location
                </p>

                <p className="mt-1 font-semibold">
                  {location || "Not specified"}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Area
                </p>

                <p className="mt-1 font-semibold">
                  {finalArea > 0
                    ? `${finalArea.toLocaleString()} m²`
                    : "Not specified"}
                </p>
              </div>

              {farmType === "farm" && (
                <>
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">
                      Crop
                    </p>

                    <p className="mt-1 font-semibold">
                      {crop || "Not specified"}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">
                      Irrigation Type
                    </p>

                    <p className="mt-1 font-semibold">
                      {irrigationType || "Not specified"}
                    </p>
                  </div>
                </>
              )}

              {farmType === "garden" && (
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Plants / Trees
                  </p>

                  {plants.length === 0 ? (
                    <p className="mt-1 font-semibold">
                      No plants specified
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {plants.map((plant) => (
                        <div
                          key={plant.id}
                          className="rounded-lg bg-muted/50 p-3"
                        >
                          <p className="font-semibold">
                            {plant.name || "Unnamed plant"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {plant.quantity || 0} plants ·{" "}
                            {plant.spacing || 0}m spacing ·{" "}
                            {plant.age || 0} years old
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCreateFarm}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create {farmType === "farm" ? "Farm" : "Garden"}
            </button>
          </div>
        )}

        {/* NAVIGATION */}
        <div className="mt-8 flex justify-between gap-3">
          <button
            type="button"
            onClick={previousStep}
            disabled={step === 1}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {step < totalSteps && (
            <button
              type="button"
              onClick={nextStep}
              disabled={step === 1 && !farmType}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>
    </main>
  );
}