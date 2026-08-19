"use client";

import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Pencil,
  Ruler,
  Trash2,
  TreePine,
  Wheat,
  Droplets,
  Sprout,
  AlertTriangle,
} from "lucide-react";
import { use, useState } from "react";
import { useRouter } from "next/navigation";

import { useFarm } from "@/features/farms/context/farm-context";

interface FarmDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function FarmDetailsPage({
  params,
}: FarmDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { farms, deleteFarm } = useFarm();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const farm = farms.find((item) => item.id === id);

  if (!farm) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-0">
        <Link
          href="/farms"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Farms
        </Link>

        <section className="mt-8 rounded-2xl border bg-card p-6 text-center shadow-sm sm:mt-10 sm:p-10">
          <h1 className="text-2xl font-bold">Farm not found</h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            The selected farm or garden does not exist.
          </p>
        </section>
      </main>
    );
  }

  const isGarden = farm.type === "garden";

  const handleDelete = () => {
    deleteFarm(farm.id);
    setShowDeleteModal(false);
    router.push("/farms");
  };

  return (
    <>
      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-0">
        {/* Header */}
        <header className="space-y-6">
          {/* Back */}
          <Link
            href="/farms"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Farms
          </Link>

          {/* Header content */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              {/* Farm identity */}
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ${
                    isGarden
                      ? "bg-gold/15 text-gold"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {isGarden ? (
                    <TreePine className="h-6 w-6 sm:h-7 sm:w-7" />
                  ) : (
                    <Wheat className="h-6 w-6 sm:h-7 sm:w-7" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      isGarden
                        ? "bg-gold/15 text-gold"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {farm.type}
                  </span>

                  <h1 className="mt-3 wrap-break-word text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                    {farm.name}
                  </h1>

                  <div className="mt-3 flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

                    <span className="wrap-break-word">
                      {farm.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:shrink-0">
                <Link
                  href={`/farms/${farm.id}/edit`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Overview */}
        <section
          aria-label="Farm overview"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* Area */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Ruler className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Area</p>

                <p className="mt-1.5 text-xl font-bold tracking-tight">
                  {farm.area.toLocaleString()}{" "}
                  <span className="text-sm font-medium text-muted-foreground">
                    m²
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Type */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  isGarden
                    ? "bg-gold/15 text-gold"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {isGarden ? (
                  <TreePine className="h-5 w-5" />
                ) : (
                  <Wheat className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Type</p>

                <p className="mt-1.5 text-xl font-bold capitalize">
                  {farm.type}
                </p>
              </div>
            </div>
          </div>

          {/* Irrigation */}
          {!isGarden && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Droplets className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    Irrigation
                  </p>

                  <p className="mt-1.5 wrap-break-word text-base font-bold">
                    {farm.irrigationType || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Farm / Garden Information */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
          <div>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isGarden
                    ? "bg-gold/15 text-gold"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {isGarden ? (
                  <TreePine className="h-5 w-5" />
                ) : (
                  <Wheat className="h-5 w-5" />
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold sm:text-2xl">
                  {isGarden
                    ? "Garden Information"
                    : "Farm Information"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Detailed information about this{" "}
                  {isGarden ? "garden" : "farm"}.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {/* Name */}
            <div className="rounded-xl border bg-background p-4 sm:p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Name
              </p>

              <p className="mt-2 wrap-break-word text-sm font-semibold">
                {farm.name}
              </p>
            </div>

            {/* Location */}
            <div className="rounded-xl border bg-background p-4 sm:p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Location
              </p>

              <p className="mt-2 wrap-break-word text-sm font-semibold">
                {farm.location}
              </p>
            </div>

            {/* Area */}
            <div className="rounded-xl border bg-background p-4 sm:p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Area
              </p>

              <p className="mt-2 text-sm font-semibold">
                {farm.area.toLocaleString()} m²
              </p>
            </div>

            {/* Type */}
            <div className="rounded-xl border bg-background p-4 sm:p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Type
              </p>

              <p className="mt-2 text-sm font-semibold capitalize">
                {farm.type}
              </p>
            </div>

            {/* Crop */}
            {!isGarden && (
              <div className="rounded-xl border bg-background p-4 sm:p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  Crop
                </p>

                <p className="mt-2 wrap-break-word text-sm font-semibold leading-5">
                  {farm.crop?.name || "Not specified"}
                </p>
              </div>
            )}

            {/* Irrigation */}
            {!isGarden && (
              <div className="rounded-xl border bg-background p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      Irrigation Type
                    </p>

                    <p className="mt-2 wrap-break-word text-sm font-semibold leading-5">
                      {farm.irrigationType || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Garden Plants / Trees */}
        {isGarden && (
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Sprout className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-bold sm:text-2xl">
                    Plants / Trees
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Plants and trees currently managed in this garden.
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit rounded-full bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold">
                {farm.plants?.length ?? 0}{" "}
                {farm.plants?.length === 1 ? "item" : "items"}
              </span>
            </div>

            {farm.plants && farm.plants.length > 0 ? (
              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {farm.plants.map((plant) => (
                  <div
                    key={plant.id}
                    className="rounded-xl border bg-background p-4 sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                        <TreePine className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="wrap-break-word text-sm font-semibold">
                          {plant.name || "Unnamed plant"}
                        </p>

                        <div className="mt-3 grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Quantity
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {plant.quantity}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Spacing
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {plant.spacing} m
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Age
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {plant.age} yrs
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-xl border border-dashed p-6 text-center sm:p-8">
                <TreePine className="mx-auto h-8 w-8 text-muted-foreground" />

                <p className="mt-3 text-sm font-semibold">
                  No plants or trees added
                </p>

                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                  No plants or trees have been added to this garden yet.
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-farm-title"
            aria-describedby="delete-farm-description"
            className="w-full max-w-lg overflow-hidden rounded-3xl border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal header */}
            <div className="border-b bg-destructive/3 px-6 py-6 sm:px-7 sm:py-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <h2
                    id="delete-farm-title"
                    className="text-xl font-bold sm:text-2xl"
                  >
                    Delete {isGarden ? "Garden" : "Farm"}?
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    This action requires confirmation.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal body */}
            <div className="px-6 py-6 sm:px-7 sm:py-7">
              <p
                id="delete-farm-description"
                className="text-sm leading-6 text-muted-foreground"
              >
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-foreground">
                  {farm.name}
                </span>
                ? All information associated with this{" "}
                {isGarden ? "garden" : "farm"} will be removed from
                AgroMind.
              </p>

              <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

                  <p className="text-xs leading-5 text-destructive">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex flex-col-reverse gap-3 border-t bg-muted/20 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border bg-background px-5 py-2.5 text-sm font-semibold transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground shadow-sm transition-all hover:bg-destructive/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 sm:w-auto"
              >
                <Trash2 className="h-4 w-4" />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}