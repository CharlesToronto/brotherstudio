type MyExperienceGalleryHeadingProps = {
  kicker: string;
  title: string;
};

export function MyExperienceGalleryHeading({
  kicker,
  title,
}: MyExperienceGalleryHeadingProps) {
  return (
    <div className="myExperienceGalleryHeading">
      <p className="myExperienceSectionKicker myExperienceGalleryHeadingKicker">{kicker}</p>
      <div className="myExperienceGalleryArcTitle" aria-label={title} role="img">
        <svg
          viewBox="0 0 1200 220"
          className="myExperienceGalleryArcTitleSvg"
          aria-hidden="true"
        >
          <path
            id="myexperience-gallery-arc"
            d="M 110 170 Q 600 30 1090 170"
            fill="none"
          />
          <text className="myExperienceGalleryArcTitleText">
            <textPath href="#myexperience-gallery-arc" startOffset="50%" textAnchor="middle">
              {title}
            </textPath>
          </text>
        </svg>
      </div>
    </div>
  );
}
