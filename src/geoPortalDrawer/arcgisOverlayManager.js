export const createArcgisOverlayManager = () => {
  const overlays = [];

  const clear = () => {
    overlays.forEach(o => o.setMap(null));
    overlays.length = 0;
  };

  const plotFeatures = (input, mapInstance, proj4Convert) => {
    clear();

    // normalizar: pode ser objeto com features ou array
    const features = Array.isArray(input) ? input : input?.features || [];
    if (features.length === 0) return;

    features.forEach(feature => {
      // Polígonos
      if (feature.geometry?.rings) {
        const paths = feature.geometry.rings.map(ring =>
          ring.map(([x, y]) => {
            const [lng, lat] = proj4Convert([x, y]);
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
          map: mapInstance
        });

        overlays.push(polygon);
      }

      // Pontos isolados (coordenadas x/y)
      if (feature.geometry?.x && feature.geometry?.y) {
        const [lng, lat] = proj4Convert([feature.geometry.x, feature.geometry.y]);
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstance
        });
        overlays.push(marker);
      }
    });
  };

  return { plotFeatures, clear, overlays };
};
