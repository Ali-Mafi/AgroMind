"use client";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { T } from "@/features/settings/components/translated-text";
import { useSettings } from "@/features/settings/context/settings-context";
import { MeasurementInput } from "@/features/settings/components/measurement-input";


import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, Plus, Trash2 } from "lucide-react";
import { useFarm } from "@/features/farms/context/farm-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FarmLocationPicker from "@/features/farms/components/farm-location-picker/farm-location-picker";
import type { FarmLocation, FarmType } from "@/features/farms/types/farms";
import type { IrrigationType } from "@/features/farms/constants/irrigation-types";
import { IrrigationTypeSelector } from "@/features/farms/components/irrigation-type-selector";

interface GardenPlant {
  id: number;
  name: string;
  quantity: string;
  spacing: string;
  age: string;
}

interface ReverseGeocodeResult {
  countryName?: string | null;
  city?: string | null;
  locality?: string | null;
}

async function resolveFarmLocationName(
  coordinates: FarmLocation,
): Promise<string> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
  });

  try {
    const response = await fetch(
      `/api/location?${params.toString()}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return "Pinned location";
    }

    const data =
      (await response.json()) as ReverseGeocodeResult;

    const locationParts = [
      data.locality,
      data.city,
      data.countryName,
    ].filter(
      (part): part is string =>
        Boolean(part?.trim()),
    );

    const uniqueParts = Array.from(
      new Set(
        locationParts.map((part) => part.trim()),
      ),
    );

    return (
      uniqueParts.join(", ") || "Pinned location"
    );
  } catch {
    return "Pinned location";
  }
}

function normalizePropertyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

export default function NewFarmPage() {
  const t = useTranslation();
  const { format } = useSettings();
  const { farms, addFarm } = useFarm();
  const [step, setStep] = useState(1);
  const [farmType, setFarmType] = useState<FarmType | null>(null);

  const router = useRouter();

  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] =
  useState<FarmLocation | undefined>();

  const [areaMode, setAreaMode] = useState<"direct" | "dimensions">(
    "direct",
  );
  const [area, setArea] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");

  const [crop, setCrop] = useState("");
  const [irrigationType, setIrrigationType] =
    useState<IrrigationType | "">("");
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

  const hasValidName = farmName.trim().length > 0;
  const hasDuplicateName = farms.some(
    (farm) =>
      normalizePropertyName(farm.name) ===
      normalizePropertyName(farmName),
  );
  const hasExactLocation = Boolean(coordinates);

  const canContinueStep2 =
    hasValidName &&
    hasExactLocation &&
    !hasDuplicateName;

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

    if (step === 2 && !canContinueStep2) {
      return;
    }

    setStep((current) => current + 1);
  };

  const previousStep = () => {
    if (step <= 1) return;
    setStep((current) => current - 1);
  };

  const handleCreateFarm = async () => {
    if (!farmType) return;
    if (hasDuplicateName) {
      setStep(2);
      return;
    }
    if (!farmName.trim() || !coordinates) {
      setStep(2);
      return;
    }

    const resolvedLocation =
      location.trim() ||
      (await resolveFarmLocationName(coordinates));

  const newFarm = {
    id: `${farmType}-${Date.now()}`,
    name: farmName.trim(),
    location: resolvedLocation,
    coordinates,
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
          <ArrowLeft className="h-4 w-4" /><T text="Back to Farms" /></Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary"><T text="Farm Management" /></p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"><T text="Add New" />{" "}{farmType === "garden" ? t("Garden") : t("Farm")}
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground"><T text="Add your information step by step." /></p>
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

              <p className="mt-2 text-xs text-muted-foreground"><T text="Step" />{" "}{item}
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
              <h2 className="text-xl font-bold"><T text="What do you want to manage?" /></h2>

              <p className="mt-1 text-sm text-muted-foreground"><T text="Choose the type of land you want to manage with AgroMind." /></p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFarmType("farm")}
                className={`group rounded-2xl border p-6 text-start transition-all ${
                  farmType === "farm"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "bg-background hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <div className="text-4xl">🌾</div>

                <h3 className="mt-4 text-lg font-bold"><T text="Farm" /></h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground"><T text="For agricultural land used for crops and larger-scale farming." /></p>

                {farmType === "farm" && (
                  <span className="mt-4 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"><T text="Selected" /></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFarmType("garden")}
                className={`group rounded-2xl border p-6 text-start transition-all ${
                  farmType === "garden"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "bg-background hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <div className="text-4xl">🌳</div>

                <h3 className="mt-4 text-lg font-bold"><T text="Garden" /></h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground"><T text="For gardens, orchards, and smaller cultivated areas." /></p>

                {farmType === "garden" && (
                  <span className="mt-4 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"><T text="Selected" /></span>
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
                  ? t("Farm Information")
                  : t("Garden Information")}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground"><T text="Add the basic information about your" />{" "}
                {farmType === "farm" ? t("farm") : t("garden")}.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="farm-name"
                  className="text-sm font-medium"
                >
                  {farmType === "farm" ? t("Farm Name") : t("Garden Name")}
                    <span className="ml-1 text-destructive">*</span>
                </label>

                <input
                  id="farm-name"
                  type="text"
                  value={farmName}
                  onChange={(event) => setFarmName(event.target.value)}
                  placeholder={
                    farmType === "farm"
                      ? t("e.g. North Field")
                      : t("e.g. Walnut Garden")
                  }
                  required
                  aria-required="true"
                  className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {hasDuplicateName ? (
                  <p className="mt-2 text-xs font-medium text-destructive"><T text="This name is already being used. Please choose a different name." /></p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground"><T text="A unique name is required for every farm or garden." /></p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="farm-location"
                    className="text-sm font-medium"
                  ><T text="Location" /></label>

                  <p className="mt-1 text-xs text-muted-foreground"><T text="Add a general location or select the exact position on the map." /></p>
                </div>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="farm-location"
                    type="text"
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder={t("e.g. Qazvin, Iran")}
                    className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium"><T text="Exact Location" /><span className="ml-1 text-destructive">*</span>
                  </p>

                  {coordinates && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><T text="Selected" /></span>
                  )}
                </div>

                <p className="text-xs leading-5 text-muted-foreground"><T text="Select the exact farm position on the map. This is required for location-based AgroMind features." /></p>

                <FarmLocationPicker
                  value={coordinates}
                  onChange={setCoordinates}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold"><T text="Area" /></h2>

              <p className="mt-1 text-sm text-muted-foreground"><T text="Enter the area directly or calculate it from the dimensions." /></p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAreaMode("direct")}
                className={`rounded-xl border p-4 text-start transition-all ${
                  areaMode === "direct"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
              >
                <p className="font-semibold"><T text="Enter area" /></p>

                <p className="mt-1 text-sm text-muted-foreground"><T text="Enter the total area directly." /></p>
              </button>

              <button
                type="button"
                onClick={() => setAreaMode("dimensions")}
                className={`rounded-xl border p-4 text-start transition-all ${
                  areaMode === "dimensions"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
              >
                <p className="font-semibold"><T text="Calculate from dimensions" /></p>

                <p className="mt-1 text-sm text-muted-foreground"><T text="Use length and width." /></p>
              </button>
            </div>

            {areaMode === "direct" && (
              <div>
                <label
                  htmlFor="area"
                  className="text-sm font-medium"
                ><T text="Area" /></label>

                <div className="relative mt-2">
                  <MeasurementInput kind="area"
                    id="area"
                    min="0"
                    value={area}
                    onValueChange={(canonical) => setArea(canonical)}
                    placeholder={format.input(6000, "area")}
                    className="w-full rounded-xl border bg-background px-3 py-2.5 pr-14 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{format.symbol("area")}</span>
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
                    ><T text="Length" /></label>

                    <div className="relative mt-2">
                      <MeasurementInput kind="length"
                        id="length"
                        min="0"
                        value={length}
                        onValueChange={(canonical) =>
                          setLength(canonical)
                        }
                        placeholder={format.input(100, "length")}
                        className="w-full rounded-xl border bg-background px-3 py-2.5 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{format.symbol("length")}</span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="width"
                      className="text-sm font-medium"
                    ><T text="Width" /></label>

                    <div className="relative mt-2">
                      <MeasurementInput kind="length"
                        id="width"
                        min="0"
                        value={width}
                        onValueChange={(canonical) =>
                          setWidth(canonical)
                        }
                        placeholder={format.input(60, "length")}
                        className="w-full rounded-xl border bg-background px-3 py-2.5 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{format.symbol("length")}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-primary/5 p-5">
                  <p className="text-sm text-muted-foreground"><T text="Estimated Area" /></p>

                  <p className="mt-1 text-2xl font-bold text-primary">
                    {format.measure(calculatedArea, "area")}
                  </p>

                  {calculatedArea > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format.measure(Number(length), "length")} × {format.measure(Number(width), "length")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {finalArea > 0 && areaMode === "direct" && (
              <div className="rounded-xl bg-primary/5 p-5">
                <p className="text-sm text-muted-foreground"><T text="Selected Area" /></p>

                <p className="mt-1 text-2xl font-bold text-primary">
                  {format.measure(finalArea, "area")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && farmType === "farm" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold"><T text="Crop" /></h2>

              <p className="mt-1 text-sm text-muted-foreground"><T text="Add the main crop grown on this farm." /></p>
            </div>

            <div>
              <label
                htmlFor="crop"
                className="text-sm font-medium"
              ><T text="Crop" /></label>

              <input
                id="crop"
                type="text"
                value={crop}
                onChange={(event) => setCrop(event.target.value)}
                placeholder={t("e.g. Forage Corn")}
                className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {/* STEP 4 GARDEN */}
        {step === 4 && farmType === "garden" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold"><T text="Plants & Trees" /></h2>

              <p className="mt-1 text-sm text-muted-foreground"><T text="Add up to 5 types of trees or plants in this garden." /></p>
            </div>

            {plants.length === 0 && (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="font-medium"><T text="No plants added yet" /></p>

                <p className="mt-1 text-sm text-muted-foreground"><T text="Add the tree or plant types you grow in this garden." /></p>
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
                      <p className="font-semibold"><T text="Plant / Tree" />{" "}{index + 1}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground"><T text="Add the details for this plant type." /></p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removePlant(plant.id)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t("Remove plant")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="text-sm font-medium"><T text="Plant / Tree Name" /></label>

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
                        placeholder={t("e.g. Late-blooming Persian walnut")}
                        className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium"><T text="Quantity" /></label>

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
                          placeholder={t("e.g. 250")}
                          className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium"><T text="Spacing" /></label>

                        <div className="relative mt-2">
                          <MeasurementInput kind="length"
                            min="0"
                            value={plant.spacing}
                            onValueChange={(canonical) =>
                              updatePlant(
                                plant.id,
                                "spacing",
                                canonical,
                              )
                            }
                            placeholder={format.input(6, "length")}
                            className="w-full rounded-xl border bg-background px-3 py-2.5 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />

                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{format.symbol("length")}</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium"><T text="Age" /></label>

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
                            placeholder={t("e.g. 4")}
                            className="w-full rounded-xl border bg-background px-3 py-2.5 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />

                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"><T text="yrs" /></span>
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
                <Plus className="h-4 w-4" /><T text="Add Plant / Tree" /></button>
            )}

            <p className="text-center text-xs text-muted-foreground">
              {plants.length}{" "}<T text="of 5 plant types added" /></p>
          </div>
        )}

        {/* STEP 5 FARM - IRRIGATION */}
          {step === 5 && farmType === "farm" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold"><T text="Irrigation" /></h2>

                <p className="mt-1 text-sm text-muted-foreground"><T text="Choose how this farm is irrigated." /></p>
              </div>

              <IrrigationTypeSelector
                value={irrigationType}
                onChange={setIrrigationType}
              />
            </div>
          )}

        {/* REVIEW */}
        {((step === 6 && farmType === "farm") ||
          (step === 5 && farmType === "garden")) && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold"><T text="Review" />{" "}{farmType === "farm" ? t("Farm") : t("Garden")}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground"><T text="Check your information before creating it." /></p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground"><T text="Type" /></p>

                <p className="mt-1 font-semibold capitalize">
                  {farmType}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground"><T text="Name" /></p>

                <p className="mt-1 font-semibold">
                  {farmName || t("Not specified")}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground"><T text="Location" /></p>

                <p className="mt-1 font-semibold">
                  {location || t("Not specified")}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground"><T text="Area" /></p>

                <p className="mt-1 font-semibold">
                  {finalArea > 0
                    ? format.measure(finalArea, "area")
                    : t("Not specified")}
                </p>
              </div>

              {farmType === "farm" && (
                <>
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground"><T text="Crop" /></p>

                    <p className="mt-1 font-semibold">
                      {crop || t("Not specified")}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground"><T text="Irrigation Type" /></p>

                    <p className="mt-1 font-semibold">
                      {irrigationType || t("Not specified")}
                    </p>
                  </div>
                </>
              )}

              {farmType === "garden" && (
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground"><T text="Plants / Trees" /></p>

                  {plants.length === 0 ? (
                    <p className="mt-1 font-semibold"><T text="No plants specified" /></p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {plants.map((plant) => (
                        <div
                          key={plant.id}
                          className="rounded-lg bg-muted/50 p-3"
                        >
                          <p className="font-semibold">
                            {plant.name || t("Unnamed plant")}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {plant.quantity || 0}{" "}<T text="plants ·" />{" "}
                            {format.measure(Number(plant.spacing) || 0, "length")}{" "}<T text="spacing ·" />{" "}
                            {plant.age || 0}{" "}<T text="years old" /></p>
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
              <Plus className="h-4 w-4" /><T text="Create" />{" "}{farmType === "farm" ? t("Farm") : t("Garden")}
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
            <ArrowLeft className="h-4 w-4" /><T text="Previous" /></button>

          {step < totalSteps && (
            <button
              type="button"
              onClick={nextStep}
              disabled={
                (step === 1 && !farmType) ||
                (step === 2 && !canContinueStep2)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            ><T text="Next" /><ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
