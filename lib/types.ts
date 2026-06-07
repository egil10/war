export type War = {
  id: string;
  name: string;
  start: number;
  end: number;
  region: string;
  sideAName: string;
  sideA: string[];
  sideBName: string;
  sideB: string[];
  winner: "A" | "B" | "draw";
  outcome: string;
  deaths: number;
  wiki: string;
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
