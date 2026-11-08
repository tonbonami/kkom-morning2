// src/lib/honeybraryTheme.ts
import type React from 'react';

export const HONEY: {
  ground: string;
  paper: string;
  paperStyle: React.CSSProperties;
  card: string;
  ink: string;
  muted: string;
  faint: string;
  line: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  accentSoftInk: string;
  bar: string;
  barTrack: string;
  star: string;
  starEmpty: string;
  seal: string;
  sealInk: string;
  sheet: string;
  shadowCard: string;
  crit: string;
} = {
  ground: '#FAF6F0',
  paper: '#F8E7BE',
  paperStyle: {
    backgroundColor: '#F8E7BE',
    boxShadow: 'inset 0 0 28px rgba(186,142,60,.25), inset 0 0 0 1px rgba(186,142,60,.35)',
  },
  card: '#FFFFFF',
  ink: '#2E1D26',
  muted: '#6E5457',
  faint: '#806668',
  line: '#E4D2D2',
  accent: '#B36214',
  accentInk: '#FFFFFF',
  accentSoft: '#F6E8CF',
  accentSoftInk: '#6B3E0C',
  bar: '#C97A1E',
  barTrack: '#EFE2D3',
  star: '#E69B24',
  starEmpty: '#E8D7C7',
  seal: '#EDD19A',
  sealInk: '#61400A',
  sheet: '#FAF6F0',
  shadowCard: '0 1px 3px rgba(70,50,40,.06), 0 8px 20px -10px rgba(70,50,40,.12)',
  crit: '#C9524F',
};
