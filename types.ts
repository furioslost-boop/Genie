
export type Platform = 'Meta' | 'Google' | 'LinkedIn' | 'TikTok';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '4:5';

export interface AdTemplate {
  id: string;
  name: string;
  layers: EditorLayer[];
  aspectRatio: AspectRatio;
}

export interface BrandAssets {
  colors: string[]; // Suporta até 10 cores
  moodboardImage?: string; // base64
  extractedStyle?: string;
}

export interface EditorLayer {
  id: string;
  type: 'text' | 'button' | 'shape';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  fontFamily: string;
  borderRadius?: number;
  padding?: number;
  opacity?: number;
}

export interface AdRequest {
  productName: string;
  description: string;
  creativeDirection: string;
  targetAudience: string;
  platform: Platform;
  aspectRatio: AspectRatio;
  ultraSpeed: boolean;
  tone: string;
  goal: string;
  quantity: number;
  brandAssets?: BrandAssets;
}

export interface AdCopy {
  headline: string;
  primaryText: string;
  cta: string;
  hook: string;
}

export interface AdCreative {
  id: string;
  copy: AdCopy;
  imageUrl: string;
  platform: Platform;
  aspectRatio: AspectRatio;
  timestamp: number;
  layers?: EditorLayer[];
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
