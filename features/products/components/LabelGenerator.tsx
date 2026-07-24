'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Tag } from 'lucide-react';
import { LabelPreview } from './LabelPreview';

interface LabelGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: {
    id: string;
    name: string;
    sku: string;
    barcode?: string | null;
    selling_price: string | number;
    brand_name?: string;
    category_name?: string;
  }[];
}

export function LabelGenerator({ open, onOpenChange, products }: LabelGeneratorProps) {
  const [copies, setCopies] = useState(1);
  const [format, setFormat] = useState<'code128' | 'qrcode' | 'both'>('code128');
  const [includePrice, setIncludePrice] = useState(true);
  const [includeBrand, setIncludeBrand] = useState(true);
  const [labelsPerRow, setLabelsPerRow] = useState<number>(3);

  const handlePrint = () => {
    window.print();
  };

  const labelsToPrint = products.flatMap((p) => Array(copies).fill(p));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#C8A348]" />
            Barcode & Label Printing
          </DialogTitle>
        </DialogHeader>

        {/* Options Row */}
        <div className="flex flex-wrap items-end gap-4 py-3 bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs">Barcode Format</Label>
            <Select value={format} onValueChange={(v: any) => setFormat(v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="code128">Barcode (Code 128)</SelectItem>
                <SelectItem value="qrcode">QR Code</SelectItem>
                <SelectItem value="both">Barcode + QR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[100px]">
            <Label className="text-xs">Copies per item</Label>
            <input
              type="number"
              min={1}
              max={50}
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full h-9 px-3 border border-[#E5E7EB] rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#C8A348] focus:border-[#C8A348]"
            />
          </div>

          <div className="flex-1 min-w-[120px]">
            <Label className="text-xs">Labels Per Row</Label>
            <Select value={String(labelsPerRow)} onValueChange={(v) => v && setLabelsPerRow(parseInt(v))}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
                <SelectItem value="4">4 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-shrink-0 flex flex-col justify-end gap-1.5 pb-0.5 min-w-[150px]">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Include Fields</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={includePrice}
                  onChange={(e) => setIncludePrice(e.target.checked)}
                  className="rounded border-gray-300 text-[#C8A348] focus:ring-[#C8A348]"
                />
                Price
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={includeBrand}
                  onChange={(e) => setIncludeBrand(e.target.checked)}
                  className="rounded border-gray-300 text-[#C8A348] focus:ring-[#C8A348]"
                />
                Brand
              </label>
            </div>
          </div>
        </div>

        {/* Print Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 border border-[#E5E7EB] rounded-xl bg-gray-50 min-h-[300px]">
          <div
            className="print-area grid gap-4 justify-items-center"
            style={{
              gridTemplateColumns: `repeat(${labelsPerRow}, minmax(0, 1fr))`,
            }}
          >
            {labelsToPrint.map((prod, idx) => (
              <LabelPreview
                key={`${prod.id}-${idx}`}
                product={prod}
                options={{
                  format,
                  includePrice,
                  includeBrand,
                  includeCategory: false,
                }}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-[#C8A348] hover:bg-[#B8933E] text-white font-semibold">
            <Printer className="w-4 h-4 mr-2" />
            Print ({labelsToPrint.length} Labels)
          </Button>
        </DialogFooter>

        {/* CSS for print mode */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              display: grid !important;
              grid-template-columns: repeat(${labelsPerRow}, 50mm) !important;
              gap: 4mm !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print-area > div {
              width: 50mm !important;
              height: 30mm !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
