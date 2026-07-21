"use client";

import { useState } from "react";

type AboutBiographyProps = {
  intro: string;
  paragraphs: Array<{
    title: string;
    text: string;
  }>;
  buttons: {
    expand: string;
    collapse: string;
  };
};

export function AboutBiography({
  intro,
  paragraphs,
  buttons,
}: AboutBiographyProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <p className="aboutIntro">{intro}</p>
      {isExpanded && paragraphs.length > 0 ? (
        <div className="aboutBiographyContent">
          {paragraphs.map((paragraph) => (
            <article key={paragraph.title} className="aboutBiographyBlock">
              <h3 className="aboutBiographyBlockTitle">{paragraph.title}</h3>
              <p className="aboutParagraph">{paragraph.text}</p>
            </article>
          ))}
        </div>
      ) : null}
      {paragraphs.length > 0 ? (
        <button
          className="aboutBiographyButton"
          type="button"
          aria-expanded={isExpanded}
          onClick={() => {
            setIsExpanded((current) => !current);
          }}
        >
          {isExpanded ? buttons.collapse : buttons.expand}
        </button>
      ) : null}
    </>
  );
}
