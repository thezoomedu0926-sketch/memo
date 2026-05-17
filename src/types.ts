export interface Stroke {
  id: string;
  points: number[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
  userId: string;
  timestamp: any;
}

export interface BoardConfig {
  id: string;
  name: string;
  backgroundImageUrl?: string;
}
