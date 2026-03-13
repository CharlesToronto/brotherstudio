"use client";

import { useState } from "react";

type AboutBiographyProps = {
  intro: string;
  paragraphs: string[];
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
  const [firstParagraph, ...remainingParagraphs] = paragraphs;

  return (
    <>
      <p className="aboutIntro">{intro}</p>
      {firstParagraph ? (
        <p className="aboutParagraph">{firstParagraph}</p>
      ) : null}
      {isExpanded && remainingParagraphs.length > 0 ? (
        <div className="aboutBiographyContent">
          {remainingParagraphs.map((paragraph) => (
            <p key={paragraph} className="aboutParagraph">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}
      {remainingParagraphs.length > 0 ? (
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
