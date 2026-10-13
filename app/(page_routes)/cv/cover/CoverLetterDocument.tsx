import type { CSSProperties, Ref } from "react";
import { color, margin, sheet, text } from "../design";

// The printable cover letter — one physical A4 page, styled from ../design so it
// shares the résumé's visual language. Consumes the plain-text draft produced by
// buildCoverLetter() and typesets it: letterhead, date, greeting, body, sign-off.

const mm = (n: number) => `${n}mm`;

type LetterParts = {
  name: string;
  contact: string[];
  date: string;
  greeting: string;
  body: string[];
  closing: string;
  signature: string;
};

/** buildCoverLetter() emits a stable block layout separated by blank lines:
 *  [ name+contact, date, greeting, ...paragraphs, "<sign-off>\n<name>" ]. */
function parseLetter(raw: string): LetterParts {
  const blocks = raw.trim().split(/\n{2,}/);
  const head = (blocks[0] ?? "").split("\n");
  const tail = (blocks[blocks.length - 1] ?? "").split("\n");
  const body = blocks.slice(3, -1);
  return {
    name: head[0] ?? "",
    contact: head.slice(1),
    date: blocks[1] ?? "",
    greeting: blocks[2] ?? "",
    body: body.length > 0 ? body : blocks.slice(3),
    closing: tail[0] ?? "Sincerely,",
    signature: tail[1] ?? head[0] ?? "",
  };
}

export function CoverLetterDocument({
  letter,
  company,
  sheetRef,
}: {
  letter: string | null;
  company?: string;
  sheetRef?: Ref<HTMLElement>;
}) {
  const pad: CSSProperties = { padding: `${mm(margin.letterY)} ${mm(margin.letterX)}` };

  if (!letter || !letter.trim()) {
    return (
      <article ref={sheetRef} className={sheet.frame} style={sheet.style}>
        <div className={sheet.topRule} />
        <div className="flex h-full flex-col items-center justify-center px-16 text-center" style={pad}>
          <p className={text.letterGreeting}>No cover letter yet</p>
          <p className={`mt-2 ${text.letterBody} text-zinc-500`}>
            Add a company in the <span className="font-semibold">Cover letter</span> panel — or paste a job posting — and
            the draft appears here, ready to print on its own A4 page.
          </p>
        </div>
      </article>
    );
  }

  const p = parseLetter(letter);

  return (
    <article ref={sheetRef} className={sheet.frame} style={sheet.style}>
      <div className={sheet.topRule} />

      <div className="flex h-full flex-col" style={pad}>
        <header>
          <h1 className={text.letterName}>{p.name}</h1>
          {p.contact.map((line, i) => (
            <p key={i} className={`${i === 0 ? "mt-1.5" : "mt-0.5"} ${text.letterContact}`}>
              {line}
            </p>
          ))}
          <span className={`mt-4 block h-px w-full ${color.hairlineBg}`} />
        </header>

        <p className={`mt-6 ${text.letterMeta}`}>{p.date}</p>
        <p className={`mt-6 ${text.letterGreeting}`}>{p.greeting}</p>

        <div className="mt-3 space-y-3">
          {p.body.map((para, i) => (
            <p key={i} className={text.letterBody}>
              {para}
            </p>
          ))}
        </div>

        <div className="mt-6">
          <p className={text.letterBody}>{p.closing}</p>
          <p className={`mt-8 ${text.letterSignName}`}>{p.signature}</p>
        </div>

        <div className="mt-auto pt-4">
          <span className={`block h-px w-full ${color.hairlineBg}`} />
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className={`truncate ${text.footer}`}>{p.name}</p>
            <p className={`shrink-0 ${text.footer}`}>{company ? `Cover letter · ${company}` : "Cover letter"}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
