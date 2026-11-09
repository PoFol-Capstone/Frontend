type Props = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 제목 오른쪽 버튼 등 */
  action?: React.ReactNode;
  /** true면 테두리 카드로 감싼다 */
  card?: boolean;
  className?: string;
  children: React.ReactNode;
};

export default function Section({ title, description, action, card, className = "", children }: Props) {
  return (
    <section className={`${card ? "card" : ""} ${className}`}>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900">{title}</h2>
          {description && <p className="mt-1.5 text-sm text-gray-500">{description}</p>}
        </div>
        {action}
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
