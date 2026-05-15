const EARTH_RADIUS = 6378137;

function toMercatorPoint(lat, lng) {
  const limitedLat = Math.max(Math.min(lat, 89.5), -89.5);
  const latRad = (limitedLat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  return {
    x: EARTH_RADIUS * lngRad,
    y: EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + latRad / 2)),
  };
}

export function calculatePolygonAreaSqMeters(points) {
  if (!Array.isArray(points) || points.length < 3) {
    return 0;
  }

  const projectedPoints = points.map((point) => toMercatorPoint(point.lat, point.lng));
  let area = 0;

  for (let index = 0; index < projectedPoints.length; index += 1) {
    const current = projectedPoints[index];
    const next = projectedPoints[(index + 1) % projectedPoints.length];

    area += current.x * next.y - next.x * current.y;
  }

  return Math.abs(area / 2);
}

export function convertSqMetersToHectares(areaSqMeters) {
  return areaSqMeters / 10000;
}
