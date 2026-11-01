export interface Chapter {
  id: number;
  slug: string;
  videoSrc: string;
  tagline: string;
  heading: string;
  description: string;
  specsHighlight?: string;
  bgTheme: 'white' | 'transition' | 'black';
  videoDuration: number; // in seconds
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
  borderHex?: string;
  description: string;
}
