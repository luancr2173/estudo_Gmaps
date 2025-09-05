// drawingManager.js
export const createDrawingManager = (mapInstance, convertTo31983, fetchData) => {
  const drawingManager = new window.google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: true,
    drawingControlOptions: {
      position: window.google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        window.google.maps.drawing.OverlayType.POLYGON,
        window.google.maps.drawing.OverlayType.RECTANGLE,
        window.google.maps.drawing.OverlayType.CIRCLE,
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
        coords.push(coords[0]); // fecha o polígono
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

      if (event.type === "circle") {
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

      if (event.type === "marker") {
        const position = event.overlay.getPosition();
        const point = convertTo31983(
          [position.lng(), position.lat()],
          "point"
        );
        fetchData(point, "esriGeometryPoint", mapInstance);
      }
    }
  );

  return drawingManager;
};
