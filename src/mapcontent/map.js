import React, { useEffect, useRef, useState } from "react";
import createDrawingManager from "./drawingManager"; // ✅ default export
import { convertTo31983, convertFrom31983 } from "./mapUtils";
import { createArcgisOverlayManager } from "./arcgisOverlayManager";
import { fetchArcgisData } from "./arcgisService";
import "./Map.css";

const Map = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const arcgisManager = useRef(createArcgisOverlayManager());

  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const addressInputRef = useRef(null);
  const [theme, setTheme] = useState("light");

  const handlePointSearch = () => {
    if (!latInput || !lngInput || !map) return;
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (drawingManager?.searchMarker) drawingManager.searchMarker.setMap(null);

    const marker = new google.maps.Marker({ position: { lat, lng }, map });
    drawingManager.searchMarker = marker;
    map.setCenter({ lat, lng });

    const delta = 0.0015;
    const envelope = convertTo31983(
      [
        [lng - delta, lat - delta],
        [lng + delta, lat + delta]
      ],
      "envelope"
    );

    fetchArcgisData(envelope, "esriGeometryEnvelope", arcgisManager.current.plotFeatures, map, convertFrom31983);
  };

  const clearAllOverlays = () => {
    arcgisManager.current.clear();
    if (drawingManager?.searchMarker) {
      drawingManager.searchMarker.setMap(null);
      drawingManager.searchMarker = null;
    }
    drawingManager?.clearUserOverlays();
  };

  useEffect(() => {
    const initMap = () => {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: -15.793889, lng: -47.882778 },
        zoom: 12
      });
      setMap(mapInstance);

      const dm = createDrawingManager(mapInstance, convertTo31983, (geometry, type, mapInstance) => {
        fetchArcgisData(geometry, type, arcgisManager.current.plotFeatures, mapInstance, convertFrom31983);
      });

      setDrawingManager(dm);
    };

    if (!document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=&libraries=drawing,places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      if (window.google && window.google.maps) initMap();
    }
  }, []);

  useEffect(() => {
    if (map && addressInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
        fields: ["geometry", "formatted_address"],
        componentRestrictions: { country: "br" }
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return alert("Endereço inválido");

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        if (drawingManager?.searchMarker) drawingManager.searchMarker.setMap(null);
        drawingManager.searchMarker = new google.maps.Marker({ position: { lat, lng }, map, title: place.formatted_address });
        map.setCenter({ lat, lng });

        const delta = 0.0015;
        const envelope = convertTo31983(
          [
            [lng - delta, lat - delta],
            [lng + delta, lat + delta]
          ],
          "envelope"
        );

        fetchArcgisData(envelope, "esriGeometryEnvelope", arcgisManager.current.plotFeatures, map, convertFrom31983);
      });
    }
  }, [map, drawingManager]);

  return (
    <div className={`map-container-wrapper ${theme}`}>
      <aside className="map-aside">
        <h4>Buscar por endereço</h4>
        <input type="text" ref={addressInputRef} value={addressInput} onChange={e => setAddressInput(e.target.value)} placeholder="Digite um endereço..." />
        <h4>Buscar por coordenadas</h4>
        <input type="number" value={latInput} onChange={e => setLatInput(e.target.value)} placeholder="-15.793889" />
        <input type="number" value={lngInput} onChange={e => setLngInput(e.target.value)} placeholder="-47.882778" />
        <button onClick={handlePointSearch}>Buscar</button>
        <button onClick={clearAllOverlays}>🗑 Limpar Todo o Mapa</button>
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>Alternar {theme === "light" ? "🌙 Dark" : "☀️ Light"} Mode</button>
      </aside>
      <div ref={mapRef} className="map-area" />
    </div>
  );
};

export default Map;
