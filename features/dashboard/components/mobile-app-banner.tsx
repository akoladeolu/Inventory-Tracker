"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Smartphone, Download, QrCode, CheckCircle2, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function MobileAppBanner() {
  const [showQrModal, setShowQrModal] = useState(false);

  // Default APK download link (hosted directly in public/teekeh-scanner.apk)
  const apkDownloadUrl = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || "/teekeh-scanner.apk";

  const fullApkUrl = typeof window !== "undefined"
    ? (apkDownloadUrl.startsWith("http") ? apkDownloadUrl : `${window.location.origin}${apkDownloadUrl}`)
    : "https://inventory-tracker.vercel.app/teekeh-scanner.apk";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="relative overflow-hidden border-gold/30 bg-gradient-to-r from-charcoal via-[#18181B] to-charcoal text-white shadow-xl">
          {/* Subtle gold decorative background element */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              {/* Left Column: Icon & Info */}
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center shrink-0 shadow-lg shadow-gold/10">
                  <Smartphone className="h-7 w-7 text-gold" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold font-heading text-white tracking-tight">
                      TEEKEH Mobile Inventory Scanner
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-gold border border-gold/30">
                      <Sparkles className="h-2.5 w-2.5" /> Mobile App Available
                    </span>
                  </div>

                  <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
                    Equip store staff with high-speed barcode scanning, stock intake, and multi-payment POS checkout right on their smartphones.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Sub-second Barcode Scan
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Multi-Payment POS
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-gold" /> Role-Based Control
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                <Button
                  onClick={() => setShowQrModal(true)}
                  variant="outline"
                  className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold hover:border-gold font-bold shadow-sm"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Scan QR Code
                </Button>

                <a href={apkDownloadUrl} download target="_blank" rel="noopener noreferrer">
                  <Button className="bg-gold text-charcoal hover:bg-gold/90 font-extrabold shadow-md shadow-gold/20">
                    <Download className="mr-2 h-4 w-4" />
                    Download APK
                  </Button>
                </a>
              </div>

            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* QR Code & Installation Guide Dialog */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-md bg-charcoal border-border text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold font-heading text-white">
              <Smartphone className="h-5 w-5 text-gold" /> Download Mobile Scanner App
            </DialogTitle>
            <DialogDescription className="text-text-secondary text-xs">
              Follow these simple steps to install TEEKEH Scanner on your store devices.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 bg-[#09090B] border border-border rounded-2xl">
              <div className="bg-white p-3 rounded-xl shadow-lg border border-gold/30">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    fullApkUrl
                  )}`}
                  alt="Scan QR Code to Download TEEKEH Scanner APK"
                  className="w-44 h-44 object-contain"
                />
              </div>
              <p className="text-xs text-gold font-semibold mt-3 text-center">
                Point your smartphone camera at the QR code to install
              </p>
            </div>

            {/* Step by Step Guide */}
            <div className="space-y-3 bg-[#09090B] border border-border rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                Quick Setup Guide
              </h4>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold text-xs font-bold">1</span>
                <p className="text-xs text-text-secondary">
                  Scan the QR code or tap <strong className="text-white">Download APK</strong> on your phone browser.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold text-xs font-bold">2</span>
                <p className="text-xs text-text-secondary">
                  Tap <strong className="text-white">Install</strong> when prompted on your Android device.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold text-xs font-bold">3</span>
                <p className="text-xs text-text-secondary">
                  Open TEEKEH Scanner and log in with your staff or manager credentials.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowQrModal(false)}
              className="border-border text-text-secondary hover:text-white"
            >
              Close
            </Button>
            <a href={apkDownloadUrl} download target="_blank" rel="noopener noreferrer">
              <Button className="bg-gold text-charcoal hover:bg-gold/90 font-bold">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open Download Link
              </Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
