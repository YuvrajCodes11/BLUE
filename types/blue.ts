export type Role =
  | "Government Admin"
  | "KFS Officer"
  | "County Officer"
  | "BMU Manager"
  | "Ranger"
  | "NGO Program Manager"
  | "Donor"
  | "Fisher";

export type Metric = {
  label: string;
  value: string;
  delta: string;
};

export type PlatformModule = {
  title: string;
  body: string;
  accent: string;
};

export type GisPoint = {
  label: string;
  x: number;
  y: number;
  kind: "landing" | "zone" | "conservation" | "route";
};

export type DashboardSignal = {
  label: string;
  value: number;
};
