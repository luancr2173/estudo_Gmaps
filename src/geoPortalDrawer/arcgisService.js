export const fetchArcgisData = async (
  geometry,
  geometryType,
  plotFeatures,
  mapInstance,
  proj4Convert,
  where = "1=1" // 👈 where opcional
) => {
  if (!mapInstance) return;

  const BASE_URL =
    "https://www.geoservicos.ide.df.gov.br/arcgis/rest/services/Aplicacoes/ENDERECAMENTO_ATIVIDADES_LUOS_PPCUB/FeatureServer/0/query";

  const params = new URLSearchParams({
    where, // 👈 agora dinâmico
    returnGeometry: "true",
    outFields: "*",
    f: "json"
  });

  // só adiciona geometry se foi passada
  if (geometry) {
    params.set("geometry", JSON.stringify(geometry));
    params.set("geometryType", geometryType);
    params.set("spatialRel", "esriSpatialRelIntersects");
  }

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    const data = await res.json();
    plotFeatures(data, mapInstance, proj4Convert);
  } catch (err) {
    console.error("Erro ao buscar dados ArcGIS:", err);
  }
};
