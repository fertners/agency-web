import type { ReactNode } from 'react';

export function Section({
  eyebrow,
  title,
  children,
  className = '',
  id,
}: Readonly<{
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
  id?: string;
}>) {
  return (
    <section id={id} className={`awa-section ${className}`}>
      <div className="awa-container">
        {eyebrow === undefined ? null : (
          <p className="awa-eyebrow">{eyebrow}</p>
        )}
        <h2 className="awa-section-title">{title}</h2>
        {children}
      </div>
    </section>
  );
}
