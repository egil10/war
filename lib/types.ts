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
  | "region";

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
};
