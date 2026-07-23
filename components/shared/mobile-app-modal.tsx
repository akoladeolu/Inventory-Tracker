"use client";

import { useState } from "react";
import { Smartphone, Download, QrCode, Copy, Check, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMobileAppModal } from "@/hooks/use-mobile-app-modal";
import { toast } from "sonner";

export const EAS_BUILD_PAGE_URL = "https://expo.dev/accounts/akoladeolu/projects/mobile/builds/a7600e4a-885f-43cc-964a-057fa4f528d7";
export const EAS_DIRECT_APK_URL = "https://expo.dev/artifacts/eas/a7600e4a-885f-43cc-964a-057fa4f528d7.apk";

export function MobileAppModal() {
  const { isOpen, closeModal } = useMobileAppModal();
  const [copied, setCopied] = useState(false);

  const apkUrl = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || EAS_DIRECT_APK_URL;
  const qrTargetUrl = process.env.NEXT_PUBLIC_EXPO_BUILD_URL || EAS_BUILD_PAGE_URL;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrTargetUrl);
    setCopied(true);
    toast.success("Download link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-lg bg-charcoal border-gold/30 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" /> Official Companion App
          </div>
          <DialogTitle className="flex items-center gap-2.5 text-2xl font-bold font-heading text-white tracking-tight">
            <Smartphone className="h-6 w-6 text-gold" /> TEEKEH Mobile Inventory Scanner
          </DialogTitle>
          <DialogDescription className="text-text-secondary text-sm">
            Scan high-speed barcodes, track stock movements, and manage sales anywhere in your retail store.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-4">
          {/* Dual Action Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Mobile Phone Scan */}
            <div className="flex flex-col items-center justify-between p-4 bg-[#09090B] border border-border rounded-xl text-center space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gold">
                <QrCode className="h-4 w-4" /> Scan for Mobile
              </div>
              <div className="bg-white p-2.5 rounded-xl shadow-md border border-gold/30">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    qrTargetUrl
                  )}`}
                  alt="Scan QR Code for TEEKEH Scanner Mobile APK"
                  className="w-36 h-36 object-contain"
                />
              </div>
              <p className="text-[11px] text-text-secondary leading-tight">
                Scan with your phone camera to download & install directly.
              </p>
            </div>

            {/* Right: Laptop/Desktop Direct APK Download */}
            <div className="flex flex-col justify-between p-4 bg-[#09090B] border border-border rounded-xl space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
                  <Download className="h-4 w-4 text-gold" /> Laptop / Desktop Download
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Downloading on your computer? Save the Android APK directly to your laptop for emulator testing or device transfer.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <a href={apkUrl} download target="_blank" rel="noopener noreferrer" className="block w-full">
                  <Button className="w-full bg-gold text-charcoal hover:bg-gold/90 font-bold shadow-md shadow-gold/10">
                    <Download className="mr-2 h-4 w-4" />
                    Download APK File
                  </Button>
                </a>

                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="w-full border-border text-text-secondary hover:text-white hover:bg-white/5 text-xs h-9"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5 text-success" /> Copied Link!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Download Link
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>

          {/* Quick Guide */}
          <div className="bg-[#09090B] border border-border/80 rounded-xl p-3.5 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold">
              Quick Setup Instructions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold text-[10px] font-bold">1</span>
                <span>Scan QR or click Download APK</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold text-[10px] font-bold">2</span>
                <span>Open APK & tap Install</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold text-[10px] font-bold">3</span>
                <span>Log in with store credentials</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between pt-2 border-t border-border/50">
          <a
            href={qrTargetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gold hover:underline inline-flex items-center gap-1"
          >
            View EAS Build Page <ExternalLink className="h-3 w-3" />
          </a>
          <Button
            variant="outline"
            onClick={closeModal}
            className="border-border text-text-secondary hover:text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
