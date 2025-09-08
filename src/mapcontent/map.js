import React, { useEffect, useRef, useState, useCallback } from "react";
import proj4 from "proj4";
import { createDrawingManager } from "./drawingManager";
import "./Map.css";

const Map = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [theme, setTheme] = useState("light");
  const [drawingManager, setDrawingManager] = useState(null);

  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const addressInputRef = useRef(null);

  const arcgisOverlays = useRef([]);
  const sirgas = "+proj=utm +zone=23 +south +datum=SIRGAS2000 +units=m +no_defs";
  const wgs84 = "EPSG:4326";
  
  // Desenha features do ArcGIS
  const plotFeatures = useCallback((data, mapInstance) => {
    arcgisOverlays.current.forEach((o) => o.setMap(null));
    arcgisOverlays.current = [];

    if (!data.features) return;

    data.features.forEach((feature) => {
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
        arcgisOverlays.current.push(polygon);
      }

      if (feature.geometry?.x && feature.geometry?.y) {
        const [lng, lat] = proj4(sirgas, wgs84, [
          feature.geometry.x,
          feature.geometry.y,
        ]);
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstance,
        });
        arcgisOverlays.current.push(marker);
      }
    });
  }, []);

  // Consulta ArcGIS
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

      try {
        const res = await fetch(`${BASE_URL}?${params}`);
        const data = await res.json();
        plotFeatures(data, mapInstance);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      }
    },
    [plotFeatures]
  );

  // Conversão para 31983 (SIRGAS2000/UTM zone 23S)
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

  // Busca por coordenadas
  const handlePointSearch = () => {
    if (!latInput || !lngInput || !map) return;
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (drawingManager?.searchMarker) {
      drawingManager.searchMarker.setMap(null);
    }

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      title: "Ponto buscado",
    });
    drawingManager.searchMarker = marker;
    map.setCenter({ lat, lng });

    // Envelope aumentado para garantir interseção
    const delta = 0.0015;
    const envelopeCoords = [
      [lng - delta, lat - delta],
      [lng + delta, lat + delta],
    ];
    const envelope = convertTo31983(envelopeCoords, "envelope");

    fetchData(envelope, "esriGeometryEnvelope", map);
  };

  // Limpar tudo
  const clearAllOverlays = () => {
    arcgisOverlays.current.forEach((overlay) => overlay.setMap(null));
    arcgisOverlays.current = [];

    if (drawingManager?.searchMarker) {
      drawingManager.searchMarker.setMap(null);
      drawingManager.searchMarker = null;
    }

    drawingManager?.clearUserOverlays();
  };

  // Inicializa mapa
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=&libraries=drawing,places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      document.body.appendChild(script);
    } else {
      if (window.google && window.google.maps) initMap();
    }
  }, [fetchData]);

  // Autocomplete de endereços
  useEffect(() => {
    if (map && window.google && addressInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          fields: ["geometry", "formatted_address"],
          componentRestrictions: { country: "br" },
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          alert("Endereço inválido");
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        if (drawingManager?.searchMarker) {
          drawingManager.searchMarker.setMap(null);
        }

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: place.formatted_address,
        });
        drawingManager.searchMarker = marker;
        map.setCenter({ lat, lng });

        // Envelope mais amplo para interseção confiável
        const delta = 0.0015;
        const envelopeCoords = [
          [lng - delta, lat - delta],
          [lng + delta, lat + delta],
        ];
        const envelope = convertTo31983(envelopeCoords, "envelope");

        fetchData(envelope, "esriGeometryEnvelope", map);
      });
    }
  }, [map, drawingManager, fetchData]);

  return (
    <div className={`map-container-wrapper ${theme}`}>
      <aside className="map-aside">
        <div className="title">🎯 Buscas</div>

        <h4>Buscar por endereço</h4>
        <input
          type="text"
          ref={addressInputRef}
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          placeholder="Digite um endereço..."
        />

        <hr />

        <h4>Buscar por coordenadas</h4>
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

        <button className="secondary" onClick={clearAllOverlays}>
          🗑 Limpar Todo o Mapa
        </button>

        <hr />
        <button
          className="toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          Alternar para {theme === "light" ? "🌙 Dark" : "☀️ Light"} Mode
        </button>
      </aside>

      <div ref={mapRef} className="map-area" />
    </div>
  );
};

export default Map;
