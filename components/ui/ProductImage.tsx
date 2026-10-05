"use client";

import React, { useState, useEffect } from "react";
import { Package } from "lucide-react";

interface ProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  fill?: boolean;
  fallbackIconSize?: number;
  sizes?: string;
}

export function ProductImage({
  src,
  alt = "Product",
  className = "",
  fill = false,
  fallbackIconSize = 24,
  sizes,
  ...props
}: ProductImageProps) {
  const [error, setError] = useState(false);
  const safeSrc = src?.trim() || "";

  useEffect(() => {
    setError(false);
  }, [src]);

  if (error || !safeSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-300 ${
          fill ? "absolute inset-0 w-full h-full" : ""
        } ${className}`}
        aria-label={alt}
      >
        <Package size={fallbackIconSize} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      loading="lazy"
      onError={() => {
        setError(true);
      }}
      className={`${fill ? "absolute inset-0 w-full h-full object-cover" : ""} ${className}`}
      {...props}
    />
  );
}
