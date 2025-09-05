/* global google */
import React, { useEffect, useRef, useState, useCallback } from "react";
import proj4 from "proj4";
import { createDrawingManager } from "./drawingManager";
import "./Map.css";

const Map = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [overlays, setOverlays] = useState([]);
  const [theme, setTheme] = useState("light");
  const [drawingManager, setDrawingManager] = useState(null);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");

  const sirgas = "+proj=utm +zone=23 +south +datum=SIRGAS2000 +units=m +no_defs";
  const wgs84 = "EPSG:4326";

  const plotFeatures = useCallback((data, mapInstance) => {
    setOverlays(prev => {
      prev.forEach(o => o.setMap(null));
      const newOverlays = [];
      if (!data.features) return newOverlays;

      data.features.forEach(feature => {
        // Polígono
        if (feature.geometry?.rings) {
          const paths = feature.geometry.rings.map(ring =>
            ring.map(([x, y]) => {
              const [lng, lat] = proj4(sirgas, wgs84, [x, y]);
              return { lat, lng };
            })
          );
          const polygon = new google.maps.Polygon({
            paths,
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            map: mapInstance,
          });
          newOverlays.push(polygon);
        }

        // Ponto
        if (feature.geometry?.x && feature.geometry?.y) {
          const [lng, lat] = proj4(sirgas, wgs84, [
            feature.geometry.x,
            feature.geometry.y,
          ]);
          const marker = new google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
          });
          newOverlays.push(marker);
        }
      });

      return newOverlays;
    });
  }, []);

  const fetchData = useCallback(async (geometry, geometryType, mapInstance) => {
    const BASE_URL =
      "https://www.geoservicos.ide.df.gov.br/arcgis/rest/services/Aplicacoes/ENDERECAMENTO_ATIVIDADES_LUOS_PPCUB/FeatureServer/0/query";

    const params = new URLSearchParams({
      where: "1=1",
      geometry: JSON.stringify(geometry),
      geometryType,
      spatialRel: "esriSpatialRelIntersects",
      returnGeometry: "true",
      outFields: "*",
      f: "json",
    });

    const url = `${BASE_URL}?${params.toString()}`;
    console.log("Consulta:", url);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      plotFeatures(data, mapInstance);
    } catch (error) {
      console.error("Falha ao buscar dados do ArcGIS:", error);
    }
  }, [plotFeatures]);

  const convertTo31983 = (coords, type) => {
    if (type === "polygon") {
      return {
        rings: [coords.map(([lng, lat]) => proj4(wgs84, sirgas, [lng, lat]))],
        spatialReference: { wkid: 31983 },
      };
    }
    if (type === "envelope") {
      const [sw, ne] = coords;
      const [xmin, ymin] = proj4(wgs84, sirgas, sw);
      const [xmax, ymax] = proj4(wgs84, sirgas, ne);
      return { xmin, ymin, xmax, ymax, spatialReference: { wkid: 31983 } };
    }
    if (type === "point") {
      const [lng, lat] = coords;
      const [x, y] = proj4(wgs84, sirgas, [lng, lat]);
      return { x, y, spatialReference: { wkid: 31983 } };
    }
  };

  const handlePointSearch = () => {
    if (!latInput || !lngInput || !map || !drawingManager) return;

    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    // Remove marcador antigo de busca
    if (drawingManager.searchMarker) {
      drawingManager.searchMarker.setMap(null);
    }

    // Cria marcador de busca
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      animation: google.maps.Animation.DROP, // animação do marcador
    });
    drawingManager.searchMarker = marker;

    // Raio de 100m
    const delta = 0.0009; // ~100m
    const envelopeCoords = [
      [lng - delta, lat - delta],
      [lng + delta, lat + delta],
    ];
    const envelope = convertTo31983(envelopeCoords, "envelope");

    fetchData(envelope, "esriGeometryEnvelope", map);

    // Faz o "fly to target"
    const target = new google.maps.LatLng(lat, lng);
    map.panTo(target); // centraliza
    map.setZoom(16);   // ajusta zoom próximo
  };


  useEffect(() => {
    const initMap = () => {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: -15.793889, lng: -47.882778 },
        zoom: 12,
      });
      setMap(mapInstance);

      const dm = createDrawingManager(mapInstance, convertTo31983, fetchData);
      setDrawingManager(dm);
    };

    if (!document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=&libraries=drawing`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      document.body.appendChild(script);
    } else {
      if (window.google && window.google.maps) initMap();
    }
  }, [fetchData]);

  return (
    <div className={`map-container-wrapper ${theme}`}>
      <aside className="map-aside">
        <div className="title">🎯 Buscas por Coordenadas</div>
        <div className="hint">ArcGIS + Google Maps, modo sniper.</div>

        <hr />

        <h4>Buscar por ponto</h4>
        <label>Latitude</label>
        <input
          type="number"
          value={latInput}
          onChange={(e) => setLatInput(e.target.value)}
          placeholder="-15.793889"
        />
        <label>Longitude</label>
        <input
          type="number"
          value={lngInput}
          onChange={(e) => setLngInput(e.target.value)}
          placeholder="-47.882778"
        />
        <button className="primary" onClick={handlePointSearch}>
          Buscar
        </button>

        <hr />

        <h4>Buscar por polígono</h4>
        <textarea rows="3" placeholder="[[lng,lat], [lng,lat], ...]" />
        <button className="primary">Buscar</button>

        <button
          className="toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          Alternar para {theme === "light" ? "🌙 Dark" : "☀️ Light"} Mode
        </button>

        <hr />
        <button
          className="secondary"
          onClick={() => drawingManager?.clearUserOverlays()}
        >
          🗑 Limpar desenhos do usuário
        </button>
      </aside>

      <div ref={mapRef} className="map-area" />
    </div>
  );
};

export default Map;
