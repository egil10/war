export type War = {
  id: string;
  name: string;
  start: number;
  end: number;
  sideA: string[];
  sideB: string[];
  winner: "A" | "B" | "draw";
  region?: string;
  sideAName?: string;
  sideBName?: string;
  outcome?: string;
  deaths?: number;
  wiki?: string;
  featured?: boolean;
};

export type ModeId =
  | "year"
  | "winner"
  | "flags"
  | "map"
  | "deadlier"
  | "earlier"
  | "region"
  | "pin"
  | "order";

export type Option = {
  label: string;
  sub?: string;
  correct: boolean;
};

export type Question = {
  mode: ModeId;
  prompt: string;
  hint?: string;
  flagsA?: string[];
  flagsB?: string[];
  options: Option[];
  fact: string;
  wiki: string;
  answer: string; // the correct option's label, restated on reveal
  war?: War; // subject war (single-war modes)
  warA?: War; // comparison modes
  warB?: War;
  // pin (timeline slider) mode
  domain?: [number, number];
  tolerance?: number;
  // order (sort) mode
  items?: War[]; // wars to sort, in their correct order
  orderBy?: "year" | "deaths";
  orderLabel?: string; // e.g. "earliest → latest"
};
