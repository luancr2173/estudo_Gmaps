export const fetchArcgisData = async (geometry, geometryType, plotFeatures, mapInstance, proj4Convert) => {
  if (!mapInstance) return;

  const BASE_URL =
    "https://www.geoservicos.ide.df.gov.br/arcgis/rest/services/Aplicacoes/ENDERECAMENTO_ATIVIDADES_LUOS_PPCUB/FeatureServer/0/query";

  const params = new URLSearchParams({
    where: "1=1",
    geometry: JSON.stringify(geometry),
    geometryType,
    spatialRel: "esriSpatialRelIntersects",
    returnGeometry: "true",
    outFields: "*",
    f: "json"
  });

  try {
    const res = await fetch(`${BASE_URL}?${params}`);
    const data = await res.json();
    plotFeatures(data, mapInstance, proj4Convert);
  } catch (err) {
    console.error("Erro ao buscar dados ArcGIS:", err);
  }
};
