type BadgeItem = { key: string; label: string };

type BadgeListProps = {
  items: BadgeItem[];
  max?: number;
  badgeClassName: string;
};

export function BadgeList({ items, max = 3, badgeClassName }: BadgeListProps) {
  if (items.length === 0) return null;

  const visibleItems = items.slice(0, max);
  const hiddenCount = items.length - max;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleItems.map((item) => (
        <span key={item.key} className={badgeClassName}>
          {item.label}
        </span>
      ))}
      {hiddenCount > 0 && <span className={badgeClassName}>+{hiddenCount}</span>}
    </div>
  );
}
