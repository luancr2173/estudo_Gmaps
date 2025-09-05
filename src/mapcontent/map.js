/* global google */
import React, { useEffect, useRef, useState, useCallback } from "react";
import proj4 from "proj4";
import { createDrawingManager } from "./drawingManager";
import "./Map.css";

const Map = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [overlays, setOverlays] = useState([]);
  const [theme, setTheme] = useState("light"); // controla tema

  // Projeções
  const sirgas = "+proj=utm +zone=23 +south +datum=SIRGAS2000 +units=m +no_defs";
  const wgs84 = "EPSG:4326";

  // Converte resultados do ArcGIS → Lat/Lng
  const plotFeatures = useCallback((data, mapInstance) => {
    setOverlays((prevOverlays) => {
      prevOverlays.forEach((o) => o.setMap(null));
      const newOverlays = [];
      if (!data.features) return newOverlays;

      data.features.forEach((feature) => {
        // polígono
        if (feature.geometry?.rings) {
          const paths = feature.geometry.rings.map((ring) =>
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

        // ponto
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

  // Busca dados no ArcGIS
  const fetchData = useCallback(
    async (geometry, geometryType, mapInstance) => {
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
    },
    [plotFeatures]
  );

  // Converte Lat/Lng → EPSG:31983
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
  };

  // Inicializa o mapa
  useEffect(() => {
    const initMap = () => {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: -15.793889, lng: -47.882778 },
        zoom: 12,
      });
      setMap(mapInstance);

      // usa o módulo já criado 🐙
      createDrawingManager(mapInstance, convertTo31983, fetchData);
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
      {/* Painel lateral */}
      <aside className="map-aside">
        <div className="title">🎯 Buscas por Coordenadas</div>
        <div className="hint">ArcGIS + Google Maps, modo sniper.</div>

        <hr />

        <h4>Buscar por ponto</h4>
        <label>Latitude</label>
        <input type="number" placeholder="-15.793889" />
        <label>Longitude</label>
        <input type="number" placeholder="-47.882778" />
        <button className="primary">Buscar</button>

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
      </aside>

      {/* Área do mapa */}
      <div ref={mapRef} className="map-area" />
    </div>
  );
};

export default Map;
