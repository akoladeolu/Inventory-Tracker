"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const images = [
  "/images/store_watches.png",
  "/images/store_bags.png",
  "/images/store_glasses.png",
];

export function AuthSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-charcoal">
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={src}
            alt="TEEKEH Store showcase"
            fill
            className={`object-cover ${
              index === currentIndex ? "animate-slow-zoom" : ""
            }`}
            priority={index === 0}
          />
        </div>
      ))}
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 z-20 bg-charcoal/60" />
      
      {/* Brand Overlay Text */}
      <div className="relative z-30 flex h-full flex-col items-center justify-center">
        <h1 className="mb-2 text-6xl font-bold text-white tracking-wider">TEEKEH</h1>
        <p className="text-xl text-gray-300 font-medium">Inventory Tracker</p>
      </div>
    </div>
  );
}
