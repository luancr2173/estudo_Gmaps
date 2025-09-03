import React, { useEffect, useRef, useState, useCallback } from "react";
import proj4 from "proj4";

const Map = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [overlays, setOverlays] = useState([]);

  // Projeções
  const sirgas = "+proj=utm +zone=23 +south +datum=SIRGAS2000 +units=m +no_defs";
  const wgs84 = "EPSG:4326"; // lat/lng

  // converte resultados ArcGIS de volta pra Lat/Lng 
  const plotFeatures = useCallback((data, mapInstance) => {
    setOverlays(prevOverlays => {
      // Limpa overlays antigos do mapa
      prevOverlays.forEach((o) => o.setMap(null));

      const newOverlays = [];
      if (!data.features) {
        return newOverlays; // Retorna o novo estado (array vazio)
      }

      data.features.forEach((feature) => {
        // polígono
        if (feature.geometry?.rings) {
          const paths = feature.geometry.rings.map((ring) =>
            ring.map(([x, y]) => {
              const [lng, lat] = proj4(sirgas, wgs84, [x, y]);
              return { lat, lng };
            })
          );

          const polygon = new window.google.maps.Polygon({
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

          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
          });

          newOverlays.push(marker);
        }
      });

      return newOverlays; // Retorna o novo estado
    });
  }, []);

  // faz a query ArcGIS
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
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      plotFeatures(data, mapInstance);
    } catch (error) {
      console.error("Falha ao buscar dados do ArcGIS:", error);
    }
  }, [plotFeatures]);

  // converte Lat/Lng → EPSG:31983 para enviar ao ArcGIS
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

  useEffect(() => {
    const initMap = () => {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: -15.793889, lng: -47.882778 },
        zoom: 12,
      });
      setMap(mapInstance);

      const drawingManager = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: window.google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            window.google.maps.drawing.OverlayType.POLYGON,
            window.google.maps.drawing.OverlayType.RECTANGLE,
            window.google.maps.drawing.OverlayType.MARKER,
            window.google.maps.drawing.OverlayType.POLYLINE,
          ],
        },
        map: mapInstance,
      });

      window.google.maps.event.addListener(
        drawingManager,
        "overlaycomplete",
        (event) => {
          if (event.type === "polygon") {
            const path = event.overlay.getPath().getArray();
            const coords = path.map((latlng) => [latlng.lng(), latlng.lat()]);
            coords.push(coords[0]); // fecha polígono
            const geojson = convertTo31983(coords, "polygon");
            fetchData(geojson, "esriGeometryPolygon", mapInstance);
          }

          if (event.type === "rectangle") {
            const bounds = event.overlay.getBounds();
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const envelopeCoords = [
              [sw.lng(), sw.lat()],
              [ne.lng(), ne.lat()],
            ];
            const envelope = convertTo31983(envelopeCoords, "envelope");
            fetchData(envelope, "esriGeometryEnvelope", mapInstance);
          }
        }
      );
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
    <div
      ref={mapRef}
      style={{ height: "100vh", width: "100%" }}
      className="map-container"
    />
  );
};

export default Map;
