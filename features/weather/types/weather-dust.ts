export type DustVisualIntensity =
  | "light"
  | "moderate"
  | "heavy";

export type DustCondition =
  | {
      status: "unavailable";

      isDusty: false;

      intensity: null;

      dustShare: null;
    }
  | {
      status: "not-dusty";

      isDusty: false;

      intensity: null;

      dustShare: number;
    }
  | {
      status: "dusty";

      isDusty: true;

      intensity: DustVisualIntensity;

      dustShare: number;
    };