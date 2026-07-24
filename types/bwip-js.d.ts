declare module 'bwip-js' {
  export interface ToCanvasOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textxalign?: 'left' | 'center' | 'right';
    [key: string]: any;
  }

  export function toCanvas(
    canvas: HTMLCanvasElement | string,
    options: ToCanvasOptions
  ): void;

  const bwipjs: {
    toCanvas: typeof toCanvas;
  };

  export default bwipjs;
}
