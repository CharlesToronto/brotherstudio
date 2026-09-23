"use client";

import { useEffect, useRef, useState } from "react";

type PlantazAvailabilityExplorerProps = {
  imageUrl: string | null;
};

const zones = [
  "M518 634L626.182 650L671 657.5V779.5L374.5 844L100.5 753L518 695V634Z",
  "M796 671L1068 716.5L1588.5 633.5V741L1862 784L1171 1049.5L849 963L540.5 875.5L796 811V671Z",
  "M507.5 462H629H666V600.5L563.5 610.5H528L404.5 590L507.5 574V462Z",
  "M814 471H1070H1245.5L1550 460V603.5L1582 610.5L1400 640L1237 658.5L1070 683.5L711.5 632.5L814 619V471Z",
  "M740.5 205.5L861.5 188L685.5 420H544.688H444.5H494.594V389L600.5 312V245.5L679 235H696.5L740.5 205.5Z",
  "M862 188L1061 159L1271.5 188L1308 217L1425.5 233.5V300L1551.5 389.5V420H1129.59H1014.91H686.5L862 188Z",
];

const apartments = ["01", "02", "03", "04", "05", "06"];
const apartmentDetails = [
  { surface: "82 m²", rooms: "3.5 pièces", status: "Disponible", balcony: "Non", terrace: "Oui" },
  { surface: "82 m²", rooms: "3.5 pièces", status: "Disponible", balcony: "Non", terrace: "Oui" },
  { surface: "82 m²", rooms: "3.5 pièces", status: "Disponible", balcony: "Oui", terrace: "Non" },
  { surface: "82 m²", rooms: "3.5 pièces", status: "Disponible", balcony: "Oui", terrace: "Non" },
  { surface: "51 m²", rooms: "2.5 pièces", status: "Disponible", balcony: "Oui", terrace: "Non" },
  { surface: "51 m²", rooms: "2.5 pièces", status: "Disponible", balcony: "Oui", terrace: "Non" },
];

export function PlantazAvailabilityExplorer({ imageUrl }: PlantazAvailabilityExplorerProps) {
  const [activeUnit, setActiveUnit] = useState<number | null>(null);
  const [tableScroll, setTableScroll] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const tableWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const handleTableScroll = () => {
    const element = tableWrapRef.current;
    if (!element) return;
    const maxScroll = element.scrollWidth - element.clientWidth;
    setTableScroll(maxScroll > 0 ? Math.round((element.scrollLeft / maxScroll) * 100) : 100);
  };

  return (
    <section className="plantazSection plantazApartment" id="appartement">
      <div className="plantazApartmentCopy">
        <div className="plantazApartmentIntro">
          <p className="plantazEyebrow">Disponibilité</p>
          <h2>Appartements disponibles</h2>
          <p>Un lieu à découvrir avec une attention portée aux usages, à la lumière et au rapport intérieur-extérieur.</p>
        </div>
        <p className="plantazAvailabilityHint">Survolez un appartement pour localiser sa zone sur l’image.</p>
      </div>

      <div className="plantazApartmentVisual plantazApartmentVisual--original">
        {imageUrl ? <img src={imageUrl} alt="Vue extérieure Plantaz 01" /> : null}
        <svg className="plantazApartmentZones" viewBox="0 0 2048 1137" role="img" aria-label="Zones des appartements Plantaz">
          {zones.map((path, index) => (
            <path
              key={apartments[index]}
              className={activeUnit === index ? "is-active" : ""}
              d={path}
              tabIndex={0}
              onMouseEnter={() => { if (!isMobile) setActiveUnit(index); }}
              onMouseLeave={() => { if (!isMobile) setActiveUnit(null); }}
              onClick={() => setActiveUnit(index)}
              onFocus={() => setActiveUnit(index)}
              onBlur={() => setActiveUnit(null)}
              aria-label={`Appartement ${apartments[index]}`}
            />
          ))}
        </svg>
        {activeUnit !== null ? <span className="plantazApartmentZoneLabel">Appartement {apartments[activeUnit]}</span> : null}
      </div>

      <div className="plantazAvailabilityScrollHint" aria-label={`Défilement horizontal du tableau : ${tableScroll}%`}>
        <span>Faites glisser pour voir le tableau</span><strong>{tableScroll}%</strong>
        <span className="plantazAvailabilityScrollTrack" aria-hidden="true"><i style={{ width: `${tableScroll}%` }} /></span>
      </div>
      <div className="plantazAvailabilityTableWrap" ref={tableWrapRef} onScroll={handleTableScroll}>
        <table className="plantazAvailabilityTable">
          <caption>Disponibilité des appartements Plantaz</caption>
          <thead>
            <tr>
              <th scope="col">Appartement</th><th scope="col">Prix</th><th scope="col">Surface</th><th scope="col">Pièces</th><th scope="col">Balcon</th><th scope="col">Terrasse</th><th scope="col">Disponibilité</th>
            </tr>
          </thead>
          <tbody>
            {apartments.map((unit, index) => (
              <tr
                key={unit}
                className={activeUnit === index ? "is-active" : ""}
                onMouseEnter={() => { if (!isMobile) setActiveUnit(index); }}
                onMouseLeave={() => { if (!isMobile) setActiveUnit(null); }}
                onClick={() => setActiveUnit(index)}
                onFocus={() => setActiveUnit(index)}
                onBlur={() => setActiveUnit(null)}
              >
                <th scope="row"><button type="button" onFocus={() => setActiveUnit(index)} aria-label={`Afficher la zone de l'appartement ${unit}`}>Appartement {unit}</button></th>
                <td>Sur demande</td><td>{apartmentDetails[index].surface}</td><td>{apartmentDetails[index].rooms}</td>
                <td>{apartmentDetails[index].balcony}</td><td>{apartmentDetails[index].terrace}</td>
                <td><span className={apartmentDetails[index].status === "Disponible" ? "plantazAvailabilityStatus plantazAvailabilityStatus--available" : "plantazAvailabilityStatus"}>{apartmentDetails[index].status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
