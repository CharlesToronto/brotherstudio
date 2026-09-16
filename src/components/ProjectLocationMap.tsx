"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Globe2, MapPinned, Search } from "lucide-react";
import maplibregl from "maplibre-gl";
import { normalizeGoogleMapsEmbedUrl } from "@/lib/googleMapsEmbed";
import { MaretsetWeather } from "@/components/MaretsetWeather";

type ProjectLocationMapProps = {
  projectId: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  mapEmbedUrl?: string | null;
  onLocationSaved?: (location: LocationSuggestion) => void;
  onMapEmbedUrlSaved?: (mapEmbedUrl: string | null) => void;
  adminMode?: boolean;
  canEdit?: boolean;
};

type LocationSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
};

type ProjectLocation = LocationSuggestion;

function hasCoordinates(latitude?: number | null, longitude?: number | null) {
  return typeof latitude === "number" && Number.isFinite(latitude) &&
    typeof longitude === "number" && Number.isFinite(longitude);
}

function getExternalMapUrl(location: ProjectLocation) {
  return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
}

function getGoogleEarthUrl(location: ProjectLocation | null, address: string) {
  if (location) {
    return `https://earth.google.com/web/@${location.latitude},${location.longitude},1400a,1200d,35y,0h,0t,0r`;
  }
  return `https://earth.google.com/web/search/${encodeURIComponent(address)}`;
}

export function ProjectLocationMap({
  projectId,
  address = "",
  latitude = null,
  longitude = null,
  mapEmbedUrl = null,
  onLocationSaved,
  onMapEmbedUrlSaved,
  adminMode = false,
  canEdit = false,
}: ProjectLocationMapProps) {
  const isFrench = typeof document !== "undefined" && document.documentElement.lang.startsWith("fr");
  const copy = isFrench
    ? {
        title: "Adresse du projet",
        searchPlaceholder: "Rechercher l’adresse du projet",
        addressLabel: "Adresse du projet",
        searching: "Recherche...",
        search: "Rechercher",
        suggestions: "Suggestions d’adresses",
        saved: "Localisation enregistrée pour le projet.",
        embedSaved: "Lien Google Maps enregistré pour le projet.",
        unableToFind: "Impossible de trouver cette adresse.",
        unableToSave: "Impossible d’enregistrer cette localisation.",
        mapUnavailable: "Carte satellite indisponible",
        mapUnavailableHint: "Ajoutez un jeton Mapbox pour afficher la carte intégrée.",
        noAddress: "Aucune adresse de projet",
        noAddressHint: "Recherchez une adresse ci-dessus pour positionner le projet.",
        location: "Emplacement du projet",
        addressNotSet: "Adresse non définie",
        optionalHint: "L’adresse est facultative et peut être ajoutée à tout moment.",
        earth: "Ouvrir Google Earth",
        maps: "Ouvrir Google Maps",
        readOnly: "Mode lecture seule",
        embedLabel: "Lien Google Maps intégré",
        embedPlaceholder: "Collez l’URL ou le code <iframe> Google Maps ici",
        embedHint: "Depuis Google Maps : Partager → Intégrer une carte → Copier le HTML.",
        saveEmbed: "Enregistrer la carte",
        clearEmbed: "Supprimer le lien",
        invalidEmbed: "Collez un lien ou un code iframe Google Maps valide.",
      }
    : {
        title: "Project Address",
        searchPlaceholder: "Search a project address",
        addressLabel: "Project address",
        searching: "Searching...",
        search: "Search",
        suggestions: "Address suggestions",
        saved: "Location saved for the project.",
        embedSaved: "Google Maps link saved for the project.",
        unableToFind: "Unable to find this address.",
        unableToSave: "Unable to save this location.",
        mapUnavailable: "Satellite map unavailable",
        mapUnavailableHint: "Add a Mapbox token to display the embedded map.",
        noAddress: "No project address yet",
        noAddressHint: "Search for an address above to position the project.",
        location: "Project location",
        addressNotSet: "Address not set",
        optionalHint: "The address is optional and can be added at any time.",
        earth: "Open Google Earth",
        maps: "Open Google Maps",
        readOnly: "Read-only view",
        embedLabel: "Embedded Google Maps link",
        embedPlaceholder: "Paste the Google Maps URL or full <iframe> code here",
        embedHint: "In Google Maps: Share → Embed a map → Copy the HTML.",
        saveEmbed: "Save map",
        clearEmbed: "Remove link",
        invalidEmbed: "Paste a valid Google Maps embed link or iframe code.",
      };
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const autoLocatedAddressRef = useRef("");
  const [addressInput, setAddressInput] = useState(address);
  const [embedInput, setEmbedInput] = useState(mapEmbedUrl ?? "");
  const [savedEmbedUrl, setSavedEmbedUrl] = useState(mapEmbedUrl ?? "");
  const [location, setLocation] = useState<ProjectLocation | null>(
    hasCoordinates(latitude, longitude)
      ? { label: address, latitude: latitude as number, longitude: longitude as number }
      : null,
  );
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const locationEndpoint = `${adminMode ? "/api/projects" : "/api/project"}/${projectId}/location`;

  const saveLocation = useCallback(async (nextLocation: ProjectLocation) => {
    setLocation(nextLocation);
    setAddressInput(nextLocation.label);
    setSuggestions([]);
    setStatusMessage("");

    if (!canEdit) return;

    setIsSaving(true);
    setErrorMessage("");
    try {
      const response = await fetch(locationEndpoint, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: nextLocation.label,
          latitude: nextLocation.latitude,
          longitude: nextLocation.longitude,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? copy.unableToSave);
      onLocationSaved?.(nextLocation);
      setStatusMessage(copy.saved);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.unableToSave);
    } finally {
      setIsSaving(false);
    }
  }, [canEdit, copy.saved, copy.unableToSave, locationEndpoint, onLocationSaved]);

  const saveEmbed = useCallback(async (rawValue = embedInput) => {
    if (!canEdit) return;

    setIsSaving(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const normalizedUrl = rawValue.trim()
        ? normalizeGoogleMapsEmbedUrl(rawValue)
        : null;
      const response = await fetch(locationEndpoint, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mapEmbedUrl: normalizedUrl }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        project?: { mapEmbedUrl?: string | null };
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? copy.unableToSave);

      setSavedEmbedUrl(normalizedUrl ?? "");
      setEmbedInput(normalizedUrl ?? "");
      onMapEmbedUrlSaved?.(normalizedUrl ?? null);
      setStatusMessage(copy.embedSaved);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.invalidEmbed);
    } finally {
      setIsSaving(false);
    }
  }, [canEdit, copy.embedSaved, copy.invalidEmbed, copy.unableToSave, embedInput, locationEndpoint, onMapEmbedUrlSaved]);

  const selectSuggestion = useCallback(async (suggestion: LocationSuggestion) => {
    await saveLocation(suggestion);
  }, [saveLocation]);

  const resolveAddress = useCallback(async (query: string, autoSelect = false) => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) return;

    setIsSearching(true);
    setErrorMessage("");
    try {
      const response = await fetch(`/api/maps/search?q=${encodeURIComponent(normalizedQuery)}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as {
        suggestions?: LocationSuggestion[];
        error?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? copy.unableToFind);

      const nextSuggestions = payload?.suggestions ?? [];
      setSuggestions(nextSuggestions);
      if (autoSelect && nextSuggestions[0]) {
        await selectSuggestion(nextSuggestions[0]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to find this address.");
    } finally {
      setIsSearching(false);
    }
  }, [copy.unableToFind, selectSuggestion]);

  useEffect(() => {
    setAddressInput(address);
    setEmbedInput(mapEmbedUrl ?? "");
    setSavedEmbedUrl(mapEmbedUrl ?? "");
    if (hasCoordinates(latitude, longitude)) {
      setLocation({
        label: address,
        latitude: latitude as number,
        longitude: longitude as number,
      });
    } else {
      setLocation(null);
    }
  }, [address, latitude, longitude, mapEmbedUrl, projectId]);

  useEffect(() => {
    const initialAddress = address.trim();
    if (!initialAddress || location || autoLocatedAddressRef.current === initialAddress) return;
    autoLocatedAddressRef.current = initialAddress;
    void resolveAddress(initialAddress, true);
  }, [address, location, resolveAddress]);

  useEffect(() => {
    const container = mapContainerRef.current;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!container || !token || !location) return;

    const map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: [
              `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=${token}`,
            ],
            tileSize: 256,
            attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [{ id: "satellite-layer", type: "raster", source: "satellite" }],
      },
      attributionControl: false,
      cooperativeGestures: true,
      center: [location.longitude, location.latitude],
      zoom: 15,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    const markerNode = document.createElement("div");
    markerNode.className = "projectLocationMapMarker";
    new maplibregl.Marker({ element: markerNode })
      .setLngLat([location.longitude, location.latitude])
      .addTo(map);

    return () => map.remove();
  }, [location]);

  const mapTokenAvailable = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  const googleEarthUrl = getGoogleEarthUrl(location, addressInput.trim());

  return (
    <section className="projectLocationMap">
      <div className="projectLocationMapControls">
        <div className="projectLocationMapAddressEditor">
          <label htmlFor="project-map-address" className="projectLocationMapEmbedLabel">{copy.addressLabel}</label>
          <form className="projectLocationMapSearch" onSubmit={(event) => {
            event.preventDefault();
            void resolveAddress(addressInput, true);
          }}>
            <MapPinned aria-hidden="true" size={17} />
            <input
              id="project-map-address"
              value={addressInput}
              onChange={(event) => setAddressInput(event.target.value)}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.addressLabel}
            />
            <button type="submit" disabled={isSearching || isSaving || addressInput.trim().length < 3}>
              <Search aria-hidden="true" size={15} />
              {isSearching ? copy.searching : copy.search}
            </button>
          </form>
        </div>

        <div className="projectLocationMapEmbedEditor">
          <label htmlFor="project-map-embed" className="projectLocationMapEmbedLabel">{copy.embedLabel}</label>
          <input
            id="project-map-embed"
            type="text"
            value={embedInput}
            onChange={(event) => setEmbedInput(event.target.value)}
            placeholder={copy.embedPlaceholder}
            readOnly={!canEdit}
            aria-label={copy.embedLabel}
          />
          {canEdit ? (
            <div className="projectLocationMapEmbedActions">
              <button type="button" className="projectFeedbackAction" onClick={() => void saveEmbed()} disabled={isSaving}>
                {isSaving ? "..." : copy.saveEmbed}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div className="projectLocationMapSuggestions" role="listbox" aria-label={copy.suggestions}>
          {suggestions.map((suggestion) => (
            <button key={`${suggestion.latitude}-${suggestion.longitude}-${suggestion.label}`} type="button" onClick={() => void selectSuggestion(suggestion)}>
              <MapPinned aria-hidden="true" size={14} />
              <span>{suggestion.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {statusMessage ? <p className="projectFeedbackMessage">{statusMessage}</p> : null}
      {errorMessage ? <p className="projectFeedbackMessage projectFeedbackMessageError">{errorMessage}</p> : null}

      <div className="projectLocationMapLayout">
        <div className="projectLocationMapSurface">
          {savedEmbedUrl ? (
            <div className="projectLocationMapEmbed">
              <iframe
                src={savedEmbedUrl}
                title={copy.title}
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : location && mapTokenAvailable ? (
            <div ref={mapContainerRef} className="projectLocationMapCanvas" />
          ) : (
            <div className="projectLocationMapEmpty">
              <MapPinned aria-hidden="true" size={34} />
              <strong>{location ? copy.mapUnavailable : copy.noAddress}</strong>
              <span>{location ? copy.mapUnavailableHint : copy.noAddressHint}</span>
            </div>
          )}
        </div>

        <aside className="projectLocationMapDetails">
          <h3>{location?.label || addressInput || copy.addressNotSet}</h3>
          <p>{location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : copy.optionalHint}</p>
          {location ? (
            <div className="projectLocationMapWeather">
              <MaretsetWeather
                locale={isFrench ? "fr" : "en"}
                latitude={location.latitude}
                longitude={location.longitude}
                location={location.label}
                timezone="auto"
              />
            </div>
          ) : null}
          <div className="projectLocationMapActions">
            <a className="projectFeedbackAction" href={googleEarthUrl} target="_blank" rel="noreferrer">
              <Globe2 aria-hidden="true" size={15} />
              {copy.earth}
              <ExternalLink aria-hidden="true" size={13} />
            </a>
            {location ? (
              <a className="projectFeedbackAction projectFeedbackActionGhost" href={getExternalMapUrl(location)} target="_blank" rel="noreferrer">
                {copy.maps}
              </a>
            ) : null}
          </div>
          {!canEdit ? <small>{copy.readOnly}</small> : null}
        </aside>
      </div>
    </section>
  );
}
