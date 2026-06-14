import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import orenburgDistricts from '../data/orenburg-districts.json';

/** Центр Оренбургской области [широта, долгота] — формат Leaflet */
const ORENBURG_CENTER = [52.35, 55.85];
const ORENBURG_BOUNDS = {
  southWest: [50.7, 50.8],
  northEast: [55.6, 62.4],
};

const DISTRICT_RINGS = orenburgDistricts.features.flatMap((feature) => {
  if (feature.geometry?.type === 'Polygon') {
    return [feature.geometry.coordinates[0]];
  }

  if (feature.geometry?.type === 'MultiPolygon') {
    return feature.geometry.coordinates.map((polygon) => polygon[0]);
  }

  return [];
});

function parseGeometry(geometry) {
  if (!geometry) {
    return null;
  }

  if (typeof geometry === 'string') {
    try {
      return JSON.parse(geometry);
    } catch {
      return null;
    }
  }

  return geometry;
}

/** Кольца поля в GeoJSON [lng, lat][] */
function getFieldRings(geometry) {
  const parsed = parseGeometry(geometry);

  if (!parsed) {
    return [];
  }

  if (parsed.type === 'Polygon') {
    const ring = parsed.coordinates[0];
    return ring?.length >= 3 ? [ring] : [];
  }

  if (parsed.type === 'MultiPolygon') {
    return parsed.coordinates
      .map((polygon) => polygon[0])
      .filter((ring) => ring?.length >= 3);
  }

  return [];
}

function ringToLatLngs(ring) {
  return ring.map(([lng, lat]) => [lat, lng]);
}

function getFieldBoundsPoints(geometry) {
  return getFieldRings(geometry).flat();
}

function closeRing(ring) {
  if (ring.length < 3) {
    return ring;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] === last[0] && first[1] === last[1]) {
    return ring;
  }

  return [...ring, first];
}

function isSameFieldId(left, right) {
  if (left === null || left === undefined || right === null || right === undefined) {
    return false;
  }

  return String(left) === String(right);
}

function isPointInsideBounds(lng, lat) {
  return (
    lng >= ORENBURG_BOUNDS.southWest[1]
    && lng <= ORENBURG_BOUNDS.northEast[1]
    && lat >= ORENBURG_BOUNDS.southWest[0]
    && lat <= ORENBURG_BOUNDS.northEast[0]
  );
}

function isPointInsideRing(lng, lat, ring) {
  let isInside = false;

  for (let index = 0, previousIndex = ring.length - 1; index < ring.length; previousIndex = index, index += 1) {
    const [currentLng, currentLat] = ring[index];
    const [previousLng, previousLat] = ring[previousIndex];

    const intersects = (
      (currentLat > lat) !== (previousLat > lat)
      && lng < ((previousLng - currentLng) * (lat - currentLat)) / ((previousLat - currentLat) || Number.EPSILON) + currentLng
    );

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function isPointInsideOrenburgDistricts(lng, lat) {
  return DISTRICT_RINGS.some((ring) => isPointInsideRing(lng, lat, ring));
}

function boundsFromPoints(points) {
  const latLngs = points.map(([lng, lat]) => [lat, lng]);

  if (!latLngs.length) {
    return null;
  }

  return L.latLngBounds(latLngs);
}

export default function FieldMap({
  fields,
  draftPoints = [],
  onAddDraftPoint,
  onRemoveDraftPoint,
  onSelectField,
  selectedFieldId,
  drawingContour = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef(null);
  const propsRef = useRef({});
  const hasFitAllFieldsRef = useRef(false);
  const prevRegistryCountRef = useRef(0);

  const [mapReady, setMapReady] = useState(false);
  const [renderedFieldCount, setRenderedFieldCount] = useState(0);

  propsRef.current = {
    fields,
    draftPoints,
    onAddDraftPoint,
    onRemoveDraftPoint,
    onSelectField,
    selectedFieldId,
    drawingContour,
  };

  const clearLayers = useCallback(() => {
    layersRef.current?.clearLayers();
  }, []);

  const renderLayers = useCallback((map) => {
    const {
      fields: fieldList,
      draftPoints: draft,
      onAddDraftPoint: onAdd,
      onSelectField: onSelect,
      selectedFieldId: selectedId,
      drawingContour: isDrawingActive,
      onRemoveDraftPoint: onRemove,
    } = propsRef.current;

    const isDrawingContour = Boolean(onAdd) && (isDrawingActive || draft.length > 0);
    const group = layersRef.current;

    if (!group) {
      return 0;
    }

    clearLayers();

    for (const ring of DISTRICT_RINGS) {
      L.polyline(ringToLatLngs(closeRing(ring)), {
        color: '#355c31',
        weight: 1,
        opacity: 0.55,
        interactive: false,
      }).addTo(group);
    }

    let renderedFields = 0;

    for (const field of fieldList) {
      if (field.id === 'preview') {
        continue;
      }

      const rings = getFieldRings(field.geometry);

      for (const ring of rings) {
        const isSelected = isSameFieldId(field.id, selectedId);
        const polygon = L.polygon(ringToLatLngs(closeRing(ring)), {
          color: '#ffffff',
          weight: isSelected ? 4 : 2,
          fillColor: isSelected ? '#ffe100' : '#e63946',
          fillOpacity: 0.67,
          interactive: !isDrawingContour,
        }).addTo(group);

        if (!isDrawingContour && onSelect) {
          polygon.on('click', () => onSelect(field.id));
        }

        renderedFields += 1;
      }
    }

    for (const field of fieldList) {
      if (field.id !== 'preview') {
        continue;
      }

      const rings = getFieldRings(field.geometry);

      for (const ring of rings) {
        L.polygon(ringToLatLngs(closeRing(ring)), {
          color: '#ffffff',
          weight: 3,
          fillColor: '#ffce1f',
          fillOpacity: 0.67,
          interactive: false,
        }).addTo(group);
      }
    }

    if (draft.length >= 2) {
      L.polyline(
        draft.map((point) => [point.lat, point.lng]),
        {
          color: '#dc2626',
          weight: 3,
          dashArray: '8 8',
        },
      ).addTo(group);
    }

    for (let index = 0; index < draft.length; index += 1) {
      const point = draft[index];
      const marker = L.marker([point.lat, point.lng], {
        icon: L.divIcon({
          className: 'field-map-draft-marker',
          html: `<span>${index + 1}</span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
        interactive: true,
      }).addTo(group);

      marker.on('click', () => {
        onRemove?.(index);
      });
    }

    return renderedFields;
  }, [clearLayers]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return undefined;
    }

    const map = L.map(containerRef.current, {
      center: ORENBURG_CENTER,
      zoom: 8,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.attributionControl?.setPrefix(false);

    layersRef.current = L.layerGroup().addTo(map);

    map.on('click', (event) => {
      const { onAddDraftPoint: onAddPoint } = propsRef.current;

      if (!onAddPoint) {
        return;
      }

      const { lat, lng } = event.latlng;

      if (!isPointInsideBounds(lng, lat) || !isPointInsideOrenburgDistricts(lng, lat)) {
        return;
      }

      onAddPoint({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      });
    });

    mapRef.current = map;
    setMapReady(true);

    const count = renderLayers(map);
    setRenderedFieldCount(count);

    return () => {
      clearLayers();
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
      hasFitAllFieldsRef.current = false;
      prevRegistryCountRef.current = 0;
      setMapReady(false);
      setRenderedFieldCount(0);
    };
  }, [clearLayers, renderLayers]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    const map = mapRef.current;
    const count = renderLayers(map);
    setRenderedFieldCount(count);

    const {
      fields: fieldList,
      selectedFieldId: activeId,
      draftPoints: draft,
      onAddDraftPoint: onAdd,
    } = propsRef.current;

    if (onAdd && draft.length > 0) {
      return;
    }

    const registryCount = fieldList.filter((field) => field.id !== 'preview').length;

    if (prevRegistryCountRef.current === 0 && registryCount > 0) {
      hasFitAllFieldsRef.current = false;
    }

    prevRegistryCountRef.current = registryCount;

    if (registryCount > 0 && count === 0) {
      return;
    }

    const selectedField = fieldList.find((field) => isSameFieldId(field.id, activeId));
    const selectedPositions = getFieldBoundsPoints(selectedField?.geometry);

    if (selectedPositions.length) {
      const bounds = boundsFromPoints(selectedPositions);

      if (bounds) {
        hasFitAllFieldsRef.current = true;
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      return;
    }

    const allPositions = fieldList
      .filter((field) => field.id !== 'preview')
      .flatMap((field) => getFieldBoundsPoints(field.geometry));

    if (allPositions.length && !hasFitAllFieldsRef.current) {
      const bounds = boundsFromPoints(allPositions);

      if (bounds) {
        hasFitAllFieldsRef.current = true;
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 12 });
      }
    }
  }, [fields, draftPoints, selectedFieldId, drawingContour, mapReady, renderLayers]);

  const registryCount = fields.filter((field) => field.id !== 'preview').length;

  return (
    <div className="map-card">
      <div className="section-header">
        <div>
          <h2>Карта полей</h2>
          <p className="section-header__hint map-card__provider">
            Геоданные: OpenStreetMap (Leaflet)
          </p>
        </div>
        <span className="map-card__region">
          Оренбургская область
          {registryCount > 0 ? ` · ${registryCount} в реестре` : ''}
          {mapReady && renderedFieldCount > 0 ? ` · ${renderedFieldCount} на карте` : ''}
        </span>
      </div>

      <div
        className={`map-container${draftPoints.length > 0 || onAddDraftPoint ? ' map-container--drawing' : ''}`}
        ref={containerRef}
      />

      {mapReady && registryCount > 0 && renderedFieldCount === 0 ? (
        <p className="map-card__drawing-hint map-card__drawing-hint--warn">
          Поля загружены, но контуры не отрисованы. Обновите страницу (F5) или проверьте геометрию в БД.
        </p>
      ) : null}

      {onAddDraftPoint ? (
        <p className="map-card__drawing-hint">
          {draftPoints.length === 0
            ? 'Кликните по карте внутри Оренбургской области, чтобы поставить первую точку контура (минимум 3).'
            : `Точек контура: ${draftPoints.length}. Клик — добавить, клик по метке — удалить.`}
        </p>
      ) : null}
    </div>
  );
}
