"use client";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { T } from "@/features/settings/components/translated-text";
import { useSettings } from "@/features/settings/context/settings-context";
import { MeasurementInput } from "@/features/settings/components/measurement-input";


import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  TreePine,
  Wheat,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import FarmLocationPicker from "@/features/farms/components/farm-location-picker/farm-location-picker";
import { IrrigationTypeSelector } from "@/features/farms/components/irrigation-type-selector";
import { useFarm } from "@/features/farms/context/farm-context";

import {
  normalizeIrrigationType,
  type IrrigationType,
} from "@/features/farms/constants/irrigation-types";

import type {
  FarmLocation,
  GardenPlant,
} from "@/features/farms/types/farms";

interface FormState {
  name: string;
  location: string;
  coordinates?: FarmLocation;
  area: string;
  crop: string;
  irrigationType: IrrigationType | "";
  plants: GardenPlant[];
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
        locationParts.map((part) =>
          part.trim(),
        ),
      ),
    );

    return (
      uniqueParts.join(", ") ||
      "Pinned location"
    );
  } catch {
    return "Pinned location";
  }
}

function normalizePropertyName(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

export default function EditFarmPage() {
  const t = useTranslation();
  const { format } = useSettings();
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const {
    farms,
    updateFarm,
  } = useFarm();

  const farm = farms.find(
    (item) => item.id === params.id,
  );

  const [form, setForm] =
    useState<FormState>({
      name: "",
      location: "",
      coordinates: undefined,
      area: "",
      crop: "",
      irrigationType: "",
      plants: [],
    });

  const [initialForm, setInitialForm] =
    useState<FormState>({
      name: "",
      location: "",
      coordinates: undefined,
      area: "",
      crop: "",
      irrigationType: "",
      plants: [],
    });

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    showUnsavedDialog,
    setShowUnsavedDialog,
  ] = useState(false);

  useEffect(() => {
    if (!farm) return;

    const initialState: FormState = {
      name: farm.name,
      location: farm.location,
      coordinates: farm.coordinates,
      area: String(farm.area),

      crop:
        farm.crop?.name ?? "",

      irrigationType:
        normalizeIrrigationType(
          farm.irrigationType,
        ),

      plants: farm.plants
        ? farm.plants.map((plant) => ({
            ...plant,
          }))
        : [],
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(initialState);

    setInitialForm(initialState);
  }, [farm]);

  if (!farm) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/farms"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" /><T text="Back to Farms" /></Link>

        <section className="mt-8 rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-10">
          <h1 className="text-2xl font-bold"><T text="Farm not found" /></h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground"><T text="The selected farm or garden does not exist." /></p>
        </section>
      </main>
    );
  }

  const isGarden =
    farm.type === "garden";

  const isDirty =
    JSON.stringify(form) !==
    JSON.stringify(initialForm);

  const hasDuplicateName =
    farms.some(
      (item) =>
        item.id !== farm.id &&
        normalizePropertyName(
          item.name,
        ) ===
          normalizePropertyName(
            form.name,
          ),
    );

  const areaValue =
    Number(form.area);

  const nameErrorMessage =
    !form.name.trim()
      ? "Name is required."
      : hasDuplicateName
        ? "This name is already being used. Please choose a different name."
        : undefined;

  const areaErrorMessage =
    !form.area.trim()
      ? "Area is required."
      : !Number.isFinite(
            areaValue,
          ) || areaValue <= 0
        ? "Area must be greater than 0."
        : undefined;

  const coordinatesErrorMessage =
    !form.coordinates
      ? "Exact location is required."
      : undefined;

  const hasValidationError =
    Boolean(
      nameErrorMessage ||
        areaErrorMessage ||
        coordinatesErrorMessage,
    );

  const canSaveChanges =
    isDirty &&
    !isSaving &&
    !hasValidationError;

  const updateField = <
    K extends keyof FormState,
  >(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addPlant = () => {
    if (
      form.plants.length >= 5
    ) {
      return;
    }

    setForm((current) => ({
      ...current,

      plants: [
        ...current.plants,

        {
          id: `plant-${Date.now()}`,
          name: "",
          quantity: 0,
          spacing: 0,
          age: 0,
        },
      ],
    }));
  };

  const updatePlant = (
    plantId: string,
    field: keyof GardenPlant,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,

      plants:
        current.plants.map(
          (plant) => {
            if (
              plant.id !== plantId
            ) {
              return plant;
            }

            if (
              field === "name"
            ) {
              return {
                ...plant,
                name: value,
              };
            }

            return {
              ...plant,
              [field]:
                Number(value) || 0,
            };
          },
        ),
    }));
  };

  const removePlant = (
    plantId: string,
  ) => {
    setForm((current) => ({
      ...current,

      plants:
        current.plants.filter(
          (plant) =>
            plant.id !== plantId,
        ),
    }));
  };

  const saveChanges =
    async () => {
      if (
        !canSaveChanges ||
        !form.coordinates
      ) {
        return;
      }

      setIsSaving(true);

      const area =
        Number(form.area);

      const resolvedLocation =
        form.location.trim() ||
        (await resolveFarmLocationName(
          form.coordinates,
        ));

      updateFarm(farm.id, {
        name: form.name.trim(),

        location:
          resolvedLocation,

        coordinates:
          form.coordinates,

        area,

        crop:
          !isGarden &&
          form.crop.trim()
            ? {
                id:
                  farm.crop?.id ??
                  `crop-${farm.id}`,

                name:
                  form.crop.trim(),
              }
            : undefined,

        irrigationType:
          form.irrigationType ||
          undefined,

        plants: isGarden
          ? form.plants.map(
              (plant) => ({
                ...plant,
              }),
            )
          : undefined,
      });

      setInitialForm({
        name:
          form.name.trim(),

        location:
          resolvedLocation,

        coordinates:
          form.coordinates,

        area:
          String(area),

        crop:
          form.crop.trim(),

        irrigationType:
          form.irrigationType,

        plants: isGarden
          ? form.plants.map(
              (plant) => ({
                ...plant,
              }),
            )
          : [],
      });

      setShowUnsavedDialog(
        false,
      );

      router.push(
        `/farms/${farm.id}`,
      );
    };

  const handleNavigation =
    () => {
      if (!isDirty) {
        router.push(
          `/farms/${farm.id}`,
        );

        return;
      }

      setShowUnsavedDialog(
        true,
      );
    };

  const discardChanges =
    () => {
      setShowUnsavedDialog(
        false,
      );

      router.push(
        `/farms/${farm.id}`,
      );
    };

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-0">
      {/* Header */}
      <header className="space-y-6">
        <button
          type="button"
          onClick={
            handleNavigation
          }
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" /><T text="Back to" />{" "}
          {isGarden
            ? t("Garden")
            : t("Farm")}
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              isGarden
                ? "bg-gold/15 text-gold"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isGarden ? (
              <TreePine className="h-6 w-6" />
            ) : (
              <Wheat className="h-6 w-6" />
            )}
          </div>

          <div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                isGarden
                  ? "bg-gold/15 text-gold"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {farm.type}
            </span>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"><T text="Edit" />{" "}
              {isGarden
                ? t("Garden")
                : t("Farm")}
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground"><T text="Update the information for" />{" "}
              {farm.name}.
            </p>
          </div>
        </div>
      </header>

      {/* Form */}
      <form
        onSubmit={(event) => {
          event.preventDefault();

          void saveChanges();
        }}
        className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7 lg:p-8"
      >
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label
              htmlFor="farm-name"
              className="text-sm font-medium"
            ><T text="Name" /></label>

            <input
              id="farm-name"
              type="text"
              value={form.name}
              onChange={(
                event,
              ) =>
                updateField(
                  "name",
                  event.target
                    .value,
                )
              }
              aria-invalid={Boolean(
                nameErrorMessage,
              )}
              className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 aria-invalid:border-destructive aria-invalid:focus:border-destructive aria-invalid:focus:ring-destructive/15"
            />

            {nameErrorMessage && (
              <p className="mt-2 text-xs font-medium text-destructive">
                <T text={nameErrorMessage} />
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="farm-location"
              className="text-sm font-medium"
            ><T text="Location" /></label>

            <input
              id="farm-location"
              type="text"
              value={
                form.location
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "location",
                  event.target
                    .value,
                )
              }
              className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <p className="mt-2 text-xs leading-5 text-muted-foreground"><T text="Optional. Leave this blank to detect the location name automatically from the map." /></p>
          </div>

          {/* Exact Location */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium"><T text="Exact Location" /></p>

                <p className="mt-1 text-xs text-muted-foreground"><T text="Change the exact position of this property on the map." /></p>
              </div>

              {form.coordinates && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><T text="Selected" /></span>
              )}
            </div>

            <FarmLocationPicker
              value={
                form.coordinates
              }
              onChange={(
                coordinates,
              ) =>
                updateField(
                  "coordinates",
                  coordinates,
                )
              }
            />

            {coordinatesErrorMessage && (
              <p className="text-xs font-medium text-destructive">
                {
                  t(coordinatesErrorMessage ?? "")
                }
              </p>
            )}
          </div>

          {/* Area */}
          <div>
            <label
              htmlFor="farm-area"
              className="text-sm font-medium"
            ><T text="Area" /></label>

            <div className="relative mt-2">
              <MeasurementInput kind="area"
                id="farm-area"
                min="0"
                step="any"
                value={
                  form.area
                }
                onValueChange={(canonical) =>
                  updateField(
                    "area",
                    canonical,
                  )
                }
                aria-invalid={Boolean(
                  areaErrorMessage,
                )}
                className="w-full rounded-xl border bg-background px-3 py-2.5 pr-14 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 aria-invalid:border-destructive aria-invalid:focus:border-destructive aria-invalid:focus:ring-destructive/15"
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{format.symbol("area")}</span>
            </div>

            {areaErrorMessage && (
              <p className="mt-2 text-xs font-medium text-destructive">
                <T text={areaErrorMessage} />
              </p>
            )}
          </div>

          {/* Crop */}
          {!isGarden && (
            <div>
              <label
                htmlFor="farm-crop"
                className="text-sm font-medium"
              ><T text="Crop" /></label>

              <input
                id="farm-crop"
                type="text"
                value={
                  form.crop
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "crop",
                    event.target
                      .value,
                  )
                }
                className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          {/* Irrigation Type */}
          <div>
            <label className="text-sm font-medium"><T text="Irrigation Type" /></label>

            <div className="mt-2">
              <IrrigationTypeSelector
                value={
                  form.irrigationType
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "irrigationType",
                    value,
                  )
                }
              />
            </div>
          </div>

          {/* Garden Plants */}
          {isGarden && (
            <div className="space-y-5 border-t pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold"><T text="Plants / Trees" /></h2>

                  <p className="mt-1 text-sm text-muted-foreground"><T text="Manage the plants and trees in this garden." /></p>
                </div>

                <button
                  type="button"
                  onClick={
                    addPlant
                  }
                  disabled={
                    form.plants
                      .length >= 5
                  }
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /><T text="Add" /></button>
              </div>

              <div className="space-y-4">
                {form.plants.map(
                  (plant) => (
                    <div
                      key={
                        plant.id
                      }
                      className="rounded-xl border bg-background p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold"><T text="Plant / Tree" /></p>

                        <button
                          type="button"
                          onClick={() =>
                            removePlant(
                              plant.id,
                            )
                          }
                          className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          aria-label={t("Remove plant")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {/* Plant name */}
                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`plant-name-${plant.id}`}
                            className="text-xs font-medium text-muted-foreground"
                          ><T text="Name" /></label>

                          <input
                            id={`plant-name-${plant.id}`}
                            type="text"
                            value={
                              plant.name
                            }
                            onChange={(
                              event,
                            ) =>
                              updatePlant(
                                plant.id,
                                "name",
                                event
                                  .target
                                  .value,
                              )
                            }
                            className="mt-2 w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        {/* Quantity */}
                        <div>
                          <label
                            htmlFor={`plant-quantity-${plant.id}`}
                            className="text-xs font-medium text-muted-foreground"
                          ><T text="Quantity" /></label>

                          <input
                            id={`plant-quantity-${plant.id}`}
                            type="number"
                            min="0"
                            value={
                              plant.quantity
                            }
                            onChange={(
                              event,
                            ) =>
                              updatePlant(
                                plant.id,
                                "quantity",
                                event
                                  .target
                                  .value,
                              )
                            }
                            className="mt-2 w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        {/* Spacing */}
                        <div>
                          <label
                            htmlFor={`plant-spacing-${plant.id}`}
                            className="text-xs font-medium text-muted-foreground"
                          ><T text="Spacing" /></label>

                          <div className="relative mt-2">
                            <MeasurementInput kind="length"
                              id={`plant-spacing-${plant.id}`}
                              min="0"
                              step="any"
                              value={
                                plant.spacing
                              }
                              onValueChange={(canonical) =>
                                updatePlant(
                                  plant.id,
                                  "spacing",
                                  canonical,
                                )
                              }
                              className="w-full rounded-xl border bg-card px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />

                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{format.symbol("length")}</span>
                          </div>
                        </div>

                        {/* Age */}
                        <div>
                          <label
                            htmlFor={`plant-age-${plant.id}`}
                            className="text-xs font-medium text-muted-foreground"
                          ><T text="Age" /></label>

                          <div className="relative mt-2">
                            <input
                              id={`plant-age-${plant.id}`}
                              type="number"
                              min="0"
                              step="any"
                              value={
                                plant.age
                              }
                              onChange={(
                                event,
                              ) =>
                                updatePlant(
                                  plant.id,
                                  "age",
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="w-full rounded-xl border bg-card px-3 py-2.5 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />

                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"><T text="yrs" /></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                )}

                {form.plants
                  .length ===
                  0 && (
                  <div className="rounded-xl border border-dashed p-6 text-center">
                    <TreePine className="mx-auto h-8 w-8 text-muted-foreground" />

                    <p className="mt-3 text-sm font-medium"><T text="No plants or trees added" /></p>

                    <p className="mt-1 text-xs text-muted-foreground"><T text="Add the plants or trees managed in this garden." /></p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={
              handleNavigation
            }
            className="inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium transition hover:bg-muted"
          ><T text="Cancel" /></button>

          <button
            type="submit"
            disabled={
              !canSaveChanges
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />

            {isSaving
              ? t("Saving...")
              : t("Save Changes")}
          </button>
        </div>
      </form>

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6 sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-changes-title"
        >
          <div className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-2xl sm:p-8">
            <div>
              <h2
                id="unsaved-changes-title"
                className="text-xl font-bold tracking-tight sm:text-2xl"
              ><T text="Unsaved Changes" /></h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground"><T text="You have unsaved changes. Do you want to save them before leaving this page?" /></p>

              {hasValidationError && (
                <p className="mt-3 text-xs font-medium leading-5 text-destructive"><T text="Fix the validation errors before saving. You can still discard the changes." /></p>
              )}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {/* Cancel */}
              <button
                type="button"
                onClick={() =>
                  setShowUnsavedDialog(
                    false,
                  )
                }
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              ><T text="Cancel" /></button>

              {/* Discard */}
              <button
                type="button"
                onClick={
                  discardChanges
                }
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-destructive/30 px-4 text-sm font-semibold text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
              ><T text="Discard Changes" /></button>

              {/* Save */}
              <button
                type="button"
                onClick={() => {
                  void saveChanges();
                }}
                disabled={
                  !canSaveChanges
                }
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4 shrink-0" />

                <span>
                  {isSaving
                    ? t("Saving...")
                    : t("Save Changes")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
