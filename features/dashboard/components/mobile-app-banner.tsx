"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Download, QrCode, CheckCircle2, ShieldCheck, Sparkles, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMobileAppModal } from "@/hooks/use-mobile-app-modal";
import { EAS_DIRECT_APK_URL } from "@/components/shared/mobile-app-modal";

export function MobileAppBanner() {
  const { openModal } = useMobileAppModal();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("teekeh_mobile_banner_dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("teekeh_mobile_banner_dismissed", "true");
  };

  if (isDismissed) return null;

  const apkDownloadUrl = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || EAS_DIRECT_APK_URL;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative overflow-hidden border-gold/30 bg-gradient-to-r from-charcoal via-[#18181B] to-charcoal text-white shadow-xl">
          {/* Dismiss / Cancel Button */}
          <button
            onClick={handleDismiss}
            type="button"
            aria-label="Dismiss banner"
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-text-secondary hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

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
                  onClick={openModal}
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
    </AnimatePresence>
  );
}
