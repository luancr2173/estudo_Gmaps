export const createDrawingManager = (mapInstance, convertTo31983, fetchData) => {
  const userOverlays = []; 

  const drawingManager = new window.google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: true,
    drawingControlOptions: {
      position: window.google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        window.google.maps.drawing.OverlayType.POLYGON,
        window.google.maps.drawing.OverlayType.RECTANGLE,
        window.google.maps.drawing.OverlayType.CIRCLE,
        window.google.maps.drawing.OverlayType.MARKER, // marcador
        window.google.maps.drawing.OverlayType.POLYLINE,
      ],
    },
    map: mapInstance,
  });

  drawingManager.searchMarker = null; // 👈 marcador de busca único

  const handleOverlay = (event) => {
    userOverlays.push(event.overlay);

    if (event.type === "marker") {
      // remove marcador anterior
      if (drawingManager.searchMarker) {
        drawingManager.searchMarker.setMap(null);
        userOverlays.splice(userOverlays.indexOf(drawingManager.searchMarker), 1);
      }

      drawingManager.searchMarker = event.overlay; // define como marcador de busca
      const position = event.overlay.getPosition();
      const point = convertTo31983([position.lng(), position.lat()], "point");
      fetchData(point, "esriGeometryPoint", mapInstance);
    }

    if (event.type === "polygon") {
      const path = event.overlay.getPath().getArray();
      const coords = path.map((latlng) => [latlng.lng(), latlng.lat()]);
      coords.push(coords[0]);
      const geojson = convertTo31983(coords, "polygon");
      fetchData(geojson, "esriGeometryPolygon", mapInstance);
    }

    if (event.type === "rectangle" || event.type === "circle") {
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
  };

  window.google.maps.event.addListener(drawingManager, "overlaycomplete", handleOverlay);

  drawingManager.clearUserOverlays = () => {
    userOverlays.forEach((overlay) => overlay.setMap(null));
    userOverlays.length = 0;
    drawingManager.searchMarker = null; // reset marcador de busca
  };

  return drawingManager;
};
