import Link from "next/link";
import Image from "next/image";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
  className?: string;
}

export function BrandLogo({
  size = "md",
  showText = true,
  href,
  className = "",
}: BrandLogoProps) {
  const sizeMap = {
    sm: { box: "h-8 w-8", icon: 32, text: "text-lg" },
    md: { box: "h-10 w-10", icon: 40, text: "text-xl" },
    lg: { box: "h-12 w-12", icon: 48, text: "text-2xl" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <span className={`flex items-center gap-2.5 select-none ${href ? "" : className}`}>
      <span
        className={`relative ${currentSize.box} rounded-xl sm:rounded-2xl overflow-hidden shadow-md shadow-primary/20 ring-1 ring-primary/20 shrink-0`}
      >
        <Image
          src="/icon.svg"
          alt={showText ? "" : "moniii"}
          width={currentSize.icon}
          height={currentSize.icon}
          className="w-full h-full object-cover"
          priority
        />
      </span>

      {showText && (
        <span className={`font-extrabold tracking-tight leading-none text-foreground ${currentSize.text}`}>
          mon<span className="text-primary">iii</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={`inline-flex rounded-xl ${className}`}>
        {content}
      </Link>
    );
  }

  return content;
}
