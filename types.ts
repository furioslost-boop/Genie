
export type Platform = 'Meta' | 'Google' | 'LinkedIn' | 'TikTok';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '4:5';

export interface EditorLayer {
  id: string;
  type: 'text' | 'button';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  opacity?: number;
  backgroundColor?: string;
  borderRadius?: number;
}

export interface BrandAssets {
  colors: string[]; 
  moodboardImages?: string[]; // array de base64
  extractedStyle?: string;
  figmaUrl?: string;
  figmaToken?: string;
  brandUrl?: string; // Novo: URL do site ou Instagram
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
