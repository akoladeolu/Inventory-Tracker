'use client';

import { useState, useEffect } from 'react';
import { generateBarcodeDataUrl } from '@/lib/labels/barcode-generator';

interface LabelPreviewProps {
  product: {
    name: string;
    sku: string;
    barcode?: string | null;
    selling_price: string | number;
    brand_name?: string;
    category_name?: string;
  };
  options: {
    format: 'code128' | 'qrcode' | 'both';
    includePrice: boolean;
    includeBrand: boolean;
    includeCategory: boolean;
  };
}

export function LabelPreview({ product, options }: LabelPreviewProps) {
  const [barcodeImage, setBarcodeImage] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);

  const barcodeValue = product.barcode || product.sku;

  useEffect(() => {
    const generate = async () => {
      try {
        if (options.format === 'code128' || options.format === 'both') {
          const img = await generateBarcodeDataUrl(barcodeValue, 'code128');
          setBarcodeImage(img);
        }
        if (options.format === 'qrcode' || options.format === 'both') {
          const img = await generateBarcodeDataUrl(barcodeValue, 'qrcode');
          setQrImage(img);
        }
      } catch (err) {
        console.error('Label barcode generation error:', err);
      }
    };
    generate();
  }, [barcodeValue, options.format]);

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `\u20A6${num.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
  };

  return (
    <div className="w-full aspect-[5/3] p-2 bg-white border border-gray-300 rounded flex flex-col justify-between items-center text-center select-none print:w-[50mm] print:h-[30mm] print:border-none print:shadow-none print:m-0 print:p-1 page-break-inside-avoid shadow-sm hover:shadow transition-shadow">
      {/* Brand / Header */}
      <div className="w-full flex justify-between items-center text-[8px] text-gray-500 font-bold uppercase tracking-wider">
        <span>TEEKEH</span>
        {options.includeBrand && product.brand_name && <span>{product.brand_name}</span>}
      </div>

      {/* Product Name */}
      <div className="text-[10px] font-bold text-gray-900 leading-tight truncate w-full">
        {product.name}
      </div>

      {/* Barcode Graphic */}
      <div className="my-1 flex items-center justify-center gap-1 w-full max-h-[14mm]">
        {barcodeImage && (options.format === 'code128' || options.format === 'both') && (
          <img src={barcodeImage} alt="Barcode" className="max-h-[12mm] object-contain" />
        )}
        {qrImage && (options.format === 'qrcode' || options.format === 'both') && (
          <img src={qrImage} alt="QR Code" className="w-[12mm] h-[12mm] object-contain" />
        )}
      </div>

      {/* Footer: Price & SKU */}
      <div className="w-full flex justify-between items-end text-[9px] border-t border-gray-200 pt-0.5">
        <span className="font-mono text-gray-600 font-medium">{product.sku}</span>
        {options.includePrice && (
          <span className="font-extrabold text-[#111827]">{formatPrice(product.selling_price)}</span>
        )}
      </div>
    </div>
  );
}
