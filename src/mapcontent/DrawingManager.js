// components/DrawingManager.jsx
import { useEffect } from "react";

const DrawingManager = ({ map }) => {
  useEffect(() => {
    if (!map || !window.google?.maps?.drawing) return;

    const manager = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.MARKER,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          window.google.maps.drawing.OverlayType.MARKER,
          window.google.maps.drawing.OverlayType.POLYGON,
          window.google.maps.drawing.OverlayType.RECTANGLE,
          window.google.maps.drawing.OverlayType.CIRCLE,
          window.google.maps.drawing.OverlayType.POLYLINE,
        ],
      },
      circleOptions: { fillColor: "red" },
      polygonOptions: { fillColor: "red" },
      markerOptions: {
        icon: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
      },
      map,
    });

    return () => manager.setMap(null); // cleanup
  }, [map]);

  return null; // não renderiza nada na tela
};

export default DrawingManager;
