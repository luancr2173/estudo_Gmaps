import React, { useEffect, useRef, useState } from "react";
import DrawingManager from "./DrawingManager";

const Map = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    const initMap = () => {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: -15.793889, lng: -47.882778 }, // Brasília
        zoom: 12,
      });
      setMap(mapInstance); // salva no estado
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
      if (window.google && window.google.maps) {
        initMap();
      }
    }
  }, []);

  return (
    <>
      <div
        ref={mapRef}
        className="map-container"
        style={{ height: "100vh", width: "100%" }}
      />
      {map && <DrawingManager map={map} />}
    </>
  );
};

export default Map;
