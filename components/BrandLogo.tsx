import Image from "next/image";

type BrandLogoProps = {
  variant?: "header" | "symbol" | "full";
  className?: string;
};

/** Shared artwork and fixed dimensions keep the streaming header stable. */
export default function BrandLogo({
  variant = "header",
  className = "",
}: BrandLogoProps) {
  if (variant === "full") {
    return (
      <Image
        src="/brand/pofol-full.png"
        alt="Pofol — Share your story"
        width={552}
        height={635}
        sizes="(max-width: 640px) 160px, 192px"
        loading="eager"
        className={`h-auto w-40 sm:w-48 ${className}`}
      />
    );
  }

  if (variant === "symbol") {
    return (
      <Image
        src="/brand/pofol-symbol.png"
        alt="Pofol"
        width={213}
        height={256}
        sizes="47px"
        loading="eager"
        className={`h-14 w-auto ${className}`}
      />
    );
  }

  return (
    // Frame the artwork's transparent padding without modifying the supplied PNG.
    <span
      className={`relative inline-block aspect-[1020/353] h-6 shrink-0 overflow-hidden sm:h-8 ${className}`}
    >
      <Image
        src="/brand/main-logo-pofol.png"
        alt="Pofol"
        width={2172}
        height={724}
        sizes="(max-width: 639px) 148px, 197px"
        loading="eager"
        className="absolute h-auto max-w-none"
        style={{
          width: `${(2172 / 1020) * 100}%`,
          left: `${(-576 / 1020) * 100}%`,
          top: `${(-176 / 353) * 100}%`,
        }}
      />
    </span>
  );
}
