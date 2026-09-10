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
    <span className={`inline-flex h-8 shrink-0 items-center gap-2.5 ${className}`}>
      <Image
        src="/brand/pofol-symbol.png"
        alt="Pofol"
        width={213}
        height={256}
        sizes="27px"
        loading="eager"
        className="h-8 w-auto"
      />
      <Image
        src="/brand/pofol-wordmark.png"
        alt=""
        width={565}
        height={187}
        sizes="85px"
        loading="eager"
        className="hidden h-7 w-auto sm:block"
      />
    </span>
  );
}
