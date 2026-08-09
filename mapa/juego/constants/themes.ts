import type { LevelData } from '../types';

export const THEMES: Record<LevelData['theme'], {
  sky: string;
  fog: string;
  fogDensity: number;
  ambient: string;
  sun: string;
  backdrop: string;
  farA: string;
  farB: string;
  trunks: string;
  leaves: string;
  water: string;
  waterGlow: string;
  waterOpacity: number;
  floor: string;
}> = {
  reception: {
    sky: '#07120f', fog: '#0b2418', fogDensity: 0.018, ambient: '#173a2b', sun: '#c0f0d0',
    backdrop: '#07140e', farA: '#0d1c0d', farB: '#102612', trunks: '#173516', leaves: '#0e2e0e',
    water: '#081828', waterGlow: '#0d2a4a', waterOpacity: 0.7, floor: '#100c06',
  },
  cafetal: {
    sky: '#08120b', fog: '#16310f', fogDensity: 0.021, ambient: '#26401b', sun: '#d9f0bd',
    backdrop: '#0b1608', farA: '#19330f', farB: '#233b12', trunks: '#4b321b', leaves: '#243f13',
    water: '#10251f', waterGlow: '#1f5643', waterOpacity: 0.58, floor: '#160f08',
  },
  montanita: {
    sky: '#091216', fog: '#17231e', fogDensity: 0.016, ambient: '#263524', sun: '#e8dfaa',
    backdrop: '#111711', farA: '#202915', farB: '#263018', trunks: '#312612', leaves: '#253616',
    water: '#0c1b24', waterGlow: '#24475a', waterOpacity: 0.54, floor: '#15140c',
  },
  stairs: {
    sky: '#060c10', fog: '#20170f', fogDensity: 0.026, ambient: '#342317', sun: '#f4d39a',
    backdrop: '#100d0a', farA: '#2a2119', farB: '#35271c', trunks: '#4f3822', leaves: '#1f2b16',
    water: '#071826', waterGlow: '#15546a', waterOpacity: 0.8, floor: '#120d08',
  },
  river: {
    sky: '#061216', fog: '#082c2b', fogDensity: 0.022, ambient: '#123c39', sun: '#b9f4e1',
    backdrop: '#071817', farA: '#12302c', farB: '#173b34', trunks: '#263b35', leaves: '#145040',
    water: '#064051', waterGlow: '#15a5a5', waterOpacity: 0.88, floor: '#0b1615',
  },
};
