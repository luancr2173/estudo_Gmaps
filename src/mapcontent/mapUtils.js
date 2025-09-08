import proj4 from "proj4";

export const sirgas = "+proj=utm +zone=23 +south +datum=SIRGAS2000 +units=m +no_defs";
export const wgs84 = "EPSG:4326";

export const convertTo31983 = (coords, type) => {
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

// Converte SIRGAS → WGS84
export const convertFrom31983 = ([x, y]) => proj4(sirgas, wgs84, [x, y]);
