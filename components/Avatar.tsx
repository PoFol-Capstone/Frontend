import Image from "next/image";

const SIZE = {
  xs: { box: "h-5 w-5", text: "text-[10px]", px: 20 },
  sm: { box: "h-9 w-9", text: "text-xs", px: 36 },
  md: { box: "h-11 w-11", text: "text-sm", px: 44 },
  lg: { box: "h-28 w-28", text: "text-3xl", px: 112 },
} as const;

type Props = {
  src?: string | null;
  name: string;
  size: keyof typeof SIZE;
  className?: string;
};

export function Avatar({ src, name, size, className = "" }: Props) {
  const { box, text, px } = SIZE[size];

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 font-semibold text-gray-600 ${box} ${text} ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={`${px}px`}
          className="object-cover"
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}
