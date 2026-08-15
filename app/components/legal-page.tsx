import Link from "next/link";
import type { ReactNode } from "react";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  sections: LegalSection[];
  lastReviewed?: string;
};

const policyLinks = [
  { href: "/payments", label: "Payments & terms" },
  { href: "/returns", label: "Returns & cancellations" },
  { href: "/cookie", label: "Cookie policy" },
  { href: "/privacy", label: "Privacy policy" },
];

export function LegalPage({ eyebrow, title, summary, sections, lastReviewed = "15 August 2026" }: LegalPageProps) {
  return (
    <main className="legalPage">
      <header className="legalHero">
        <div className="legalHeroMeta">
          <p>{eyebrow}</p>
          <span>Malabar Coast · Holytown</span>
        </div>
        <h1>{title}</h1>
        <div className="legalHeroSummary">
          <p>{summary}</p>
          <time dateTime="2026-08-15">Last reviewed {lastReviewed}</time>
        </div>
      </header>

      <div className="legalLayout">
        <aside className="legalIndex" aria-label="On this page">
          <p>On this page</p>
          <nav>
            {sections.map((section, index) => (
              <a href={`#${section.id}`} key={section.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <article className="legalDocument">
          {sections.map((section, index) => (
            <section id={section.id} key={section.id}>
              <div className="legalSectionHeading">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{section.title}</h2>
              </div>
              <div className="legalSectionBody">{section.content}</div>
            </section>
          ))}
        </article>
      </div>

      <nav className="legalPolicyNav" aria-label="Legal and policy pages">
        <p>Policies & information</p>
        <div>
          {policyLinks.map((link) => (
            <Link href={link.href} key={link.href}>{link.label}<span aria-hidden="true">↗</span></Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
