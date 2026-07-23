import bwipjs from 'bwip-js';

export function generateBarcodeDataUrl(
  text: string,
  bcid: 'code128' | 'qrcode' | 'ean13' = 'code128',
  scale: number = 3
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      bwipjs.toCanvas(canvas, {
        bcid,
        text,
        scale,
        height: bcid === 'qrcode' ? 20 : 12,
        includetext: bcid !== 'qrcode',
        textxalign: 'center',
      });
      resolve(canvas.toDataURL('image/png'));
    } catch (err) {
      reject(err);
    }
  });
}
