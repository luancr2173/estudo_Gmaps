export const createArcgisOverlayManager = () => {
  const overlays = [];

  const clear = () => {
    overlays.forEach(o => o.setMap(null));
    overlays.length = 0;
  };

  const plotFeatures = (data, mapInstance, proj4Convert) => {
    clear();
    if (!data.features) return;

    data.features.forEach(feature => {
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

      if (feature.geometry?.x && feature.geometry?.y) {
        const [lng, lat] = proj4Convert([feature.geometry.x, feature.geometry.y]);
        const marker = new google.maps.Marker({ position: { lat, lng }, map: mapInstance });
        overlays.push(marker);
      }
    });
  };

  return { plotFeatures, clear, overlays };
};
