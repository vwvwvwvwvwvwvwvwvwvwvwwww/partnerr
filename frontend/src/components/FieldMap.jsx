import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import orenburgDistricts from '../data/orenburg-districts.json';

const ORENBURG_CENTER = [52.35, 55.85];
const ORENBURG_BOUNDS = [
  [50.7, 50.8],
  [55.6, 62.4],
];
const WORLD_RING = [
  [-85, -180],
  [-85, 180],
  [85, 180],
  [85, -180],
];
const ORENBURG_DISTRICT_RINGS = orenburgDistricts.features.flatMap((feature) => {
  if (feature.geometry?.type === 'Polygon') {
    return [feature.geometry.coordinates[0].map(([lng, lat]) => [lat, lng])];
  }

  if (feature.geometry?.type === 'MultiPolygon') {
    return feature.geometry.coordinates.map((polygon) => polygon[0].map(([lng, lat]) => [lat, lng]));
  }

  return [];
});
const OUTSIDE_MASK = [
  WORLD_RING,
  ...ORENBURG_DISTRICT_RINGS,
];
const draftVertexIcon = L.divIcon({
  className: 'field-map__vertex-icon',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function toLeafletPositions(geometry) {
  if (!geometry) {
    return [];
  }

  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates[0][0].map(([lng, lat]) => [lat, lng]);
  }

  return [];
}

function getFieldStyle(fieldId, selectedFieldId) {
  if (fieldId === 'preview') {
    return {
      color: '#ffce1f',
      fillColor: '#ffce1f',
      fillOpacity: 0.16,
      dashArray: '8 6',
      weight: 3,
    };
  }

  if (fieldId === selectedFieldId) {
    return {
      color: '#ffe100',
      fillColor: '#ffe100',
      fillOpacity: 0.42,
      weight: 4,
    };
  }

  return {
    color: '#e66b6b',
    fillColor: '#ef8a8a',
    fillOpacity: 0.28,
    weight: 1.6,
  };
}

function isPointInsideBounds(point, bounds) {
  const [[southLat, westLng], [northLat, eastLng]] = bounds;

  return (
    point.lat >= southLat &&
    point.lat <= northLat &&
    point.lng >= westLng &&
    point.lng <= eastLng
  );
}

function isPointInsidePolygon(point, polygon) {
  let isInside = false;

  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const [currentLat, currentLng] = polygon[index];
    const [previousLat, previousLng] = polygon[previousIndex];

    const intersects = (
      (currentLng > point.lng) !== (previousLng > point.lng) &&
      point.lat < ((previousLat - currentLat) * (point.lng - currentLng)) / ((previousLng - currentLng) || Number.EPSILON) + currentLat
    );

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function DraftEvents({ onAddDraftPoint, allowedBounds, allowedPolygons }) {
  useMapEvents({
    click(event) {
      if (!isPointInsideBounds(event.latlng, allowedBounds)) {
        return;
      }

      if (!allowedPolygons.some((polygon) => isPointInsidePolygon(event.latlng, polygon))) {
        return;
      }

      onAddDraftPoint({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

function MapFocusController({ selectedField }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedField?.geometry) {
      return;
    }

    const positions = toLeafletPositions(selectedField.geometry);

    if (!positions.length) {
      return;
    }

    map.fitBounds(positions, {
      padding: [32, 32],
      maxZoom: 15,
    });
  }, [map, selectedField]);

  return null;
}

export default function FieldMap({
  fields,
  draftPoints = [],
  onAddDraftPoint,
  onMoveDraftPoint,
  onRemoveDraftPoint,
  onSelectField,
  selectedFieldId,
  contourMode = 'create',
}) {
  const selectedField = fields.find((field) => field.id === selectedFieldId);

  return (
    <div className="map-card">
      <div className="section-header">
        <div>
          <h2>Карта полей</h2>
        </div>
        <span className="map-card__region">Оренбургская область</span>
      </div>

      <MapContainer
        bounds={ORENBURG_BOUNDS}
        boundsOptions={{ padding: [0, 0] }}
        center={ORENBURG_CENTER}
        zoom={8}
        minZoom={8}
        maxZoom={17}
        maxBounds={ORENBURG_BOUNDS}
        maxBoundsViscosity={1}
        worldCopyJump={false}
        scrollWheelZoom
        className="map-container"
      >
        <DraftEvents
          allowedBounds={ORENBURG_BOUNDS}
          allowedPolygons={ORENBURG_DISTRICT_RINGS}
          onAddDraftPoint={onAddDraftPoint}
        />
        <MapFocusController selectedField={selectedField} />
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          bounds={ORENBURG_BOUNDS}
          noWrap
        />

        <Polygon
          positions={OUTSIDE_MASK}
          pathOptions={{
            stroke: false,
            fillColor: '#102015',
            fillOpacity: 0.34,
          }}
        />

        {ORENBURG_DISTRICT_RINGS.map((ring, index) => (
          <Polygon
            key={`district-outline-${index}`}
            positions={ring}
            pathOptions={{
              color: 'rgba(32, 50, 38, 0.6)',
              weight: 1,
              fill: false,
            }}
          />
        ))}

        {draftPoints.length > 1 ? (
          <Polyline
            positions={draftPoints.map((point) => [point.lat, point.lng])}
            pathOptions={{ color: '#dc2626', dashArray: '6 6' }}
          />
        ) : null}

        {draftPoints.map((point, index) => (
          <Marker
            draggable
            eventHandlers={{
              dragend: (event) => {
                const latlng = event.target.getLatLng();
                onMoveDraftPoint?.(index, {
                  lat: Number(latlng.lat.toFixed(6)),
                  lng: Number(latlng.lng.toFixed(6)),
                });
              },
              click: () => onRemoveDraftPoint?.(index),
            }}
            icon={draftVertexIcon}
            key={`${point.lat}-${point.lng}-${index}`}
            position={[point.lat, point.lng]}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {contourMode === 'edit'
                ? 'Точка границы: перетащите или нажмите для удаления'
                : 'Точка контура: перетащите или нажмите для удаления'}
            </Tooltip>
          </Marker>
        ))}

        {fields.map((field) => {
          const positions = toLeafletPositions(field.geometry);

          if (!positions.length) {
            return null;
          }

          return (
            <Polygon
              key={field.id}
              eventHandlers={field.id !== 'preview' && onSelectField ? { click: () => onSelectField(field.id) } : undefined}
              positions={positions}
              pathOptions={getFieldStyle(field.id, selectedFieldId)}
            >
              <Tooltip className="field-map__label" direction="center" permanent>
                {field.name}
              </Tooltip>
              <Popup>
                <strong>{field.name}</strong>
                <br />
                {field.areaHa} га
                <br />
                {field.status}
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>
    </div>
  );
}
