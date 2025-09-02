import React, { useEffect, useRef } from "react";

const Map = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    const initMap = () => {
      new window.google.maps.Map(mapRef.current, {
        center: { lat: -15.793889, lng: -47.882778 }, // Brasília
        zoom: 12,
      });
    };

    // Só injeta se ainda não tiver script
    if (!document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=`; 
      script.async = true;
      script.defer = true;

      script.onload = () => {
        initMap(); // garante que só roda quando o Google Maps já carregou
      };

      document.body.appendChild(script);
    } else {
      // Se já tá carregado, inicializa direto
      if (window.google && window.google.maps) {
        initMap();
      }
    }
  }, []);

  return <div ref={mapRef} className="map-container" />;
};

export default Map;
