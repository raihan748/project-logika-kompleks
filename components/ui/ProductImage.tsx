"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Package } from "lucide-react";

interface ProductImageProps extends Omit<ImageProps, "onError"> {
  fallbackIconSize?: number;
}

export function ProductImage({
  src,
  alt,
  className,
  fallbackIconSize = 24,
  ...props
}: ProductImageProps) {
  const [error, setError] = useState(false);
  const safeSrc = src || "";

  if (error || !safeSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-300 ${className}`}
        aria-label={alt}
      >
        <Package size={fallbackIconSize} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image
      src={safeSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}
