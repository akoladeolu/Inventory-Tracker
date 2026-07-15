"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
}

export function BarcodeScanner({
  open,
  onOpenChange,
  onScanSuccess,
  title = "Scan Barcode / QR Code",
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const VIEWPORT_ID = "scanner-viewport";

  useEffect(() => {
    if (!open) {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => {
              scannerRef.current = null;
            })
            .catch((err) => {
              console.error("Failed to stop scanner on close", err);
              scannerRef.current = null;
            });
        } else {
          scannerRef.current = null;
        }
      }
      return;
    }

    setIsInitializing(true);
    setHasCameraPermission(null);

    // Wait for the Dialog transition to mount DOM nodes
    const timer = setTimeout(() => {
      const html5Qrcode = new Html5Qrcode(VIEWPORT_ID);
      scannerRef.current = html5Qrcode;

      html5Qrcode
        .start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (width, height) => {
              const boxWidth = Math.min(width, height) * 0.8;
              const boxHeight = boxWidth * 0.6;
              return { width: boxWidth, height: boxHeight };
            },
          },
          async (decodedText) => {
            if (html5Qrcode.isScanning) {
              await html5Qrcode.stop();
            }
            scannerRef.current = null;
            onScanSuccess(decodedText);
            onOpenChange(false);
          },
          () => {
            // Ignore noise
          }
        )
        .then(() => {
          setHasCameraPermission(true);
          setIsInitializing(false);
        })
        .catch((err) => {
          console.error("Scanner initialization failed", err);
          setHasCameraPermission(false);
          setIsInitializing(false);
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [open, onOpenChange, onScanSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-black text-white border-0">
        <DialogHeader className="p-4 bg-charcoal border-b border-soft-black flex flex-row items-center justify-between text-white">
          <DialogTitle className="text-white text-base flex items-center gap-2">
            <Camera className="h-5 w-5 text-gold" />
            {title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-white hover:bg-soft-black h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="relative aspect-square w-full bg-black flex flex-col items-center justify-center">
          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
              <p className="text-sm text-gray-400">Requesting camera access...</p>
            </div>
          )}

          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center gap-3">
              <p className="text-sm text-error font-medium">Camera Access Denied</p>
              <p className="text-xs text-gray-400 max-w-[280px]">
                Please check your browser settings to grant camera access permission to this website.
              </p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mt-2 text-charcoal border-white/20 bg-white hover:bg-gray-100"
              >
                Close Scanner
              </Button>
            </div>
          )}

          {/* Scanner Viewport Element */}
          <div id={VIEWPORT_ID} className="w-full h-full object-cover [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

          {/* Scanning Guideline Overlays */}
          {hasCameraPermission && (
            <div className="absolute inset-0 pointer-events-none border-[30px] border-black/40 flex items-center justify-center">
              <div className="relative w-full h-3/5 border-2 border-dashed border-gold/70 rounded flex items-center justify-center">
                <div className="absolute h-0.5 w-4/5 bg-red-500/60 animate-bounce" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-charcoal text-center text-xs text-gray-400 border-t border-soft-black">
          Hold your product barcode or QR code inside the box to scan.
        </div>
      </DialogContent>
    </Dialog>
  );
}
