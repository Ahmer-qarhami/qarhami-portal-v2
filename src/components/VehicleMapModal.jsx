import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Modal, Switch } from "antd";
import markerOffUrl from "../assets/map/sub-marker-2.png";
import markerOnUrl from "../assets/map/sub-marker-3.png";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// TEMP: dummy vehicle demo — static positions only, no live tracking. Revert soon.

const TOTAL_VEHICLES = 10000;

// Metro hubs across the US. Each hub's vehicles spread over its whole metro
// (radius in degrees of latitude) so pins look like a real fleet instead of
// dense blobs. `water` rejects points that
// would land in a bay, lake, ocean or across a border near that metro.
const US_HUBS = [
  {
    name: "Houston",
    lat: 29.76,
    lng: -95.37,
    radius: 0.75,
    weight: 0.06,
    water: (lat, lng) =>
      (lat < 29.7 && lng > -95.01) || // Galveston Bay
      (lat < 29.8 && lng > -94.93) || // Trinity Bay
      (lat < 29.58 && lng > -95.06) || // Clear Lake / Kemah
      (lat < 29.38 && lng > -95.15) || // West Bay / Galveston
      lat < 29.15 || // Gulf coast / Freeport marshes
      (lat > 29.91 && lat < 30.05 && lng > -95.19 && lng < -95.12) || // Lake Houston
      (lat > 30.35 && lat < 30.5 && lng > -95.66 && lng < -95.54), // Lake Conroe
  },
  // Rest of Texas
  {
    name: "Dallas-Fort Worth",
    lat: 32.8,
    lng: -96.95,
    radius: 0.455,
    weight: 0.07,
  },
  { name: "Austin", lat: 30.3, lng: -97.74, radius: 0.286, weight: 0.04 },
  { name: "San Antonio", lat: 29.45, lng: -98.5, radius: 0.325, weight: 0.04 },
  {
    name: "El Paso",
    lat: 31.83,
    lng: -106.4,
    radius: 0.13,
    weight: 0.008,
    water: (lat) => lat < 31.77,
  },
  { name: "Beaumont", lat: 30.08, lng: -94.13, radius: 0.13, weight: 0.006 },
  {
    name: "College Station",
    lat: 30.61,
    lng: -96.33,
    radius: 0.091,
    weight: 0.004,
  },
  { name: "Waco", lat: 31.55, lng: -97.15, radius: 0.104, weight: 0.004 },
  { name: "Tyler", lat: 32.35, lng: -95.3, radius: 0.091, weight: 0.003 },
  { name: "Lubbock", lat: 33.58, lng: -101.86, radius: 0.104, weight: 0.004 },
  {
    name: "Midland-Odessa",
    lat: 31.95,
    lng: -102.2,
    radius: 0.156,
    weight: 0.004,
  },
  {
    name: "Corpus Christi",
    lat: 27.72,
    lng: -97.45,
    radius: 0.078,
    weight: 0.004,
    water: (lat, lng) => lng > -97.38,
  },
  {
    name: "Laredo",
    lat: 27.55,
    lng: -99.47,
    radius: 0.078,
    weight: 0.003,
    water: (lat, lng) => lng < -99.51,
  },
  {
    name: "McAllen",
    lat: 26.22,
    lng: -98.23,
    radius: 0.13,
    weight: 0.004,
    water: (lat) => lat < 26.12,
  },
  { name: "Amarillo", lat: 35.2, lng: -101.85, radius: 0.091, weight: 0.003 },
  { name: "Killeen", lat: 31.1, lng: -97.73, radius: 0.091, weight: 0.003 },
  // Southwest / West
  { name: "Phoenix", lat: 33.45, lng: -112.07, radius: 0.39, weight: 0.03 },
  { name: "Tucson", lat: 32.22, lng: -110.93, radius: 0.156, weight: 0.006 },
  {
    name: "Albuquerque",
    lat: 35.1,
    lng: -106.62,
    radius: 0.156,
    weight: 0.006,
  },
  { name: "Las Vegas", lat: 36.15, lng: -115.17, radius: 0.182, weight: 0.012 },
  {
    name: "Los Angeles",
    lat: 34.05,
    lng: -118.1,
    radius: 0.39,
    weight: 0.025,
    water: (lat, lng) => lat < 34.01 - 0.8 * (lng + 118.49), // Pacific coastline
  },
  {
    name: "Sacramento",
    lat: 38.58,
    lng: -121.45,
    radius: 0.195,
    weight: 0.006,
  },
  {
    name: "San Jose",
    lat: 37.33,
    lng: -121.88,
    radius: 0.13,
    weight: 0.008,
    water: (lat) => lat > 37.42,
  },
  {
    name: "Portland",
    lat: 45.52,
    lng: -122.62,
    radius: 0.156,
    weight: 0.005,
    water: (lat) => lat > 45.59,
  },
  {
    name: "Seattle (Eastside)",
    lat: 47.6,
    lng: -122.15,
    radius: 0.117,
    weight: 0.006,
    water: (lat, lng) => lng < -122.21,
  },
  {
    name: "Salt Lake City",
    lat: 40.7,
    lng: -111.9,
    radius: 0.156,
    weight: 0.006,
    water: (lat, lng) => lat > 40.82 && lng < -111.95, // Great Salt Lake
  },
  { name: "Boise", lat: 43.6, lng: -116.25, radius: 0.104, weight: 0.003 },
  { name: "Denver", lat: 39.72, lng: -104.95, radius: 0.286, weight: 0.02 },
  // Central
  {
    name: "Oklahoma City",
    lat: 35.47,
    lng: -97.52,
    radius: 0.195,
    weight: 0.012,
  },
  { name: "Tulsa", lat: 36.12, lng: -95.95, radius: 0.13, weight: 0.006 },
  { name: "Kansas City", lat: 39.05, lng: -94.58, radius: 0.195, weight: 0.01 },
  { name: "Omaha", lat: 41.25, lng: -96.05, radius: 0.13, weight: 0.004 },
  { name: "Minneapolis", lat: 44.97, lng: -93.3, radius: 0.195, weight: 0.01 },
  {
    name: "Chicago",
    lat: 41.83,
    lng: -87.85,
    radius: 0.39,
    weight: 0.025,
    water: (lat, lng) => lat > 41.62 && lng > -87.62 - (lat - 41.88) * 0.5, // Lake Michigan
  },
  {
    name: "Milwaukee",
    lat: 43.02,
    lng: -88.0,
    radius: 0.104,
    weight: 0.004,
    water: (lat, lng) => lng > -87.9,
  },
  {
    name: "Detroit",
    lat: 42.42,
    lng: -83.25,
    radius: 0.195,
    weight: 0.01,
    water: (lat, lng) => lng > -83.05,
  },
  {
    name: "Indianapolis",
    lat: 39.77,
    lng: -86.16,
    radius: 0.156,
    weight: 0.007,
  },
  { name: "Columbus", lat: 39.96, lng: -83.0, radius: 0.156, weight: 0.007 },
  {
    name: "Cleveland",
    lat: 41.42,
    lng: -81.65,
    radius: 0.156,
    weight: 0.005,
    water: (lat, lng) => lat > 41.49 + (lng + 81.7) * 0.4, // Lake Erie
  },
  { name: "Cincinnati", lat: 39.15, lng: -84.5, radius: 0.13, weight: 0.005 },
  { name: "Louisville", lat: 38.22, lng: -85.65, radius: 0.13, weight: 0.004 },
  { name: "St. Louis", lat: 38.63, lng: -90.3, radius: 0.195, weight: 0.01 },
  // South / Southeast
  { name: "Memphis", lat: 35.12, lng: -89.95, radius: 0.156, weight: 0.007 },
  { name: "Nashville", lat: 36.16, lng: -86.78, radius: 0.182, weight: 0.01 },
  {
    name: "Little Rock",
    lat: 34.75,
    lng: -92.33,
    radius: 0.104,
    weight: 0.004,
  },
  {
    name: "New Orleans",
    lat: 29.99,
    lng: -90.15,
    radius: 0.117,
    weight: 0.008,
    water: (lat) => lat > 30.02,
  },
  {
    name: "Baton Rouge",
    lat: 30.45,
    lng: -91.13,
    radius: 0.117,
    weight: 0.005,
  },
  { name: "Jackson", lat: 32.3, lng: -90.18, radius: 0.091, weight: 0.003 },
  { name: "Birmingham", lat: 33.52, lng: -86.8, radius: 0.13, weight: 0.005 },
  { name: "Atlanta", lat: 33.78, lng: -84.4, radius: 0.39, weight: 0.025 },
  { name: "Charlotte", lat: 35.22, lng: -80.84, radius: 0.195, weight: 0.012 },
  { name: "Raleigh", lat: 35.82, lng: -78.7, radius: 0.156, weight: 0.007 },
  {
    name: "Jacksonville",
    lat: 30.3,
    lng: -81.7,
    radius: 0.156,
    weight: 0.006,
    water: (lat, lng) => lng > -81.45,
  },
  { name: "Orlando", lat: 28.53, lng: -81.38, radius: 0.182, weight: 0.01 },
  {
    name: "Tampa",
    lat: 28.05,
    lng: -82.38,
    radius: 0.104,
    weight: 0.008,
    water: (lat) => lat < 27.95,
  },
  {
    name: "Miami",
    lat: 25.78,
    lng: -80.36,
    radius: 0.13,
    weight: 0.012,
    water: (lat, lng) => lng > -80.2 || lng < -80.48, // Biscayne Bay / Everglades
  },
  // Northeast
  { name: "Washington DC", lat: 38.9, lng: -77.1, radius: 0.26, weight: 0.015 },
  {
    name: "Baltimore",
    lat: 39.33,
    lng: -76.7,
    radius: 0.13,
    weight: 0.005,
    water: (lat, lng) => lng > -76.55,
  },
  { name: "Philadelphia", lat: 40.0, lng: -75.2, radius: 0.195, weight: 0.012 },
  {
    name: "New York (North NJ)",
    lat: 40.85,
    lng: -74.25,
    radius: 0.182,
    weight: 0.02,
    water: (lat, lng) => lng > -74.02,
  },
  {
    name: "Long Island",
    lat: 40.78,
    lng: -73.5,
    radius: 0.13,
    weight: 0.008,
    water: (lat) => lat < 40.68 || lat > 40.88,
  },
  {
    name: "Boston (MetroWest)",
    lat: 42.3,
    lng: -71.4,
    radius: 0.156,
    weight: 0.008,
    water: (lat, lng) => lng > -71.05,
  },
  { name: "Pittsburgh", lat: 40.44, lng: -80.0, radius: 0.13, weight: 0.005 },
  {
    name: "Buffalo",
    lat: 42.9,
    lng: -78.8,
    radius: 0.091,
    weight: 0.003,
    water: (lat, lng) => lng < -78.88,
  },
];

// Weighted toward the trucks/SUVs and sedans most commonly registered in
// Houston/Texas (F-150, Silverado, RAM 1500 and Tahoe/Tundra lead US and
// Texas sales charts), plus the top-selling US sedans and compact SUVs.
const CAR_MODELS = [
  "Ford F-150",
  "Ford F-150",
  "Ford F-150",
  "Chevrolet Silverado 1500",
  "Chevrolet Silverado 1500",
  "Ram 1500",
  "Ram 1500",
  "Toyota Tundra",
  "Toyota Tacoma",
  "GMC Sierra 1500",
  "Chevrolet Tahoe",
  "Chevrolet Suburban",
  "Toyota RAV4",
  "Toyota RAV4",
  "Toyota Highlander",
  "Honda CR-V",
  "Honda CR-V",
  "Ford Explorer",
  "Ford Escape",
  "Jeep Grand Cherokee",
  "Nissan Rogue",
  "Chevrolet Equinox",
  "GMC Yukon",
  "Toyota Camry",
  "Toyota Camry",
  "Honda Accord",
  "Honda Civic",
  "Honda Civic",
  "Toyota Corolla",
  "Toyota Corolla",
  "Nissan Altima",
  "Chevrolet Malibu",
  "Hyundai Elantra",
  "Kia Sportage",
  "Hyundai Tucson",
  "Dodge Charger",
];

// mulberry32: a small LCG showed visible arcs/lines once thousands of points
// were plotted, since consecutive outputs (angle, radius) were correlated.
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPlateNumber(rand) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let letterPart = "";
  for (let i = 0; i < 3; i++) {
    letterPart += letters[Math.floor(rand() * letters.length)];
  }
  const digitPart = String(Math.floor(rand() * 10000)).padStart(4, "0");
  return `${letterPart}-${digitPart}`;
}

// Rental/fleet cars sit parked most of the day, so only ~1 in 10 is running
// (app.qarhami.com's green ignition-ON marker with speed); the rest are white/OFF.
function buildIgnition(rand) {
  const on = rand() < 0.1;
  return {
    ignitionStatus: on ? "ON" : "OFF",
    speed: on ? 15 + Math.floor(rand() * 50) : 0,
  };
}

// Spreads a hub's vehicles over its whole metro. r = R * u^0.65 keeps a mild
// pull toward the core (real fleets thin out toward the suburbs) without the
// dense blobs a triangular falloff produced. Longitude is widened by
// 1/cos(lat) so the spread is round on the map; water hits are re-drawn.
function samplePoint(rand, hub) {
  const lngScale = 1 / Math.cos((hub.lat * Math.PI) / 180);
  for (let attempt = 0; attempt < 30; attempt++) {
    const r = hub.radius * Math.pow(rand(), 0.65);
    const angle = rand() * Math.PI * 2;
    const lat = hub.lat + r * Math.sin(angle);
    const lng = hub.lng + r * Math.cos(angle) * lngScale;
    if (!hub.water || !hub.water(lat, lng)) return { lat, lng };
  }
  return { lat: hub.lat, lng: hub.lng };
}

function buildDummyVehicles() {
  const rand = seededRandom(2024);
  const totalWeight = US_HUBS.reduce((sum, h) => sum + h.weight, 0);
  const counts = US_HUBS.map((hub) =>
    Math.round((hub.weight / totalWeight) * TOTAL_VEHICLES),
  );
  counts[0] += TOTAL_VEHICLES - counts.reduce((a, b) => a + b, 0); // rounding goes to Houston

  const vehicles = [];
  US_HUBS.forEach((hub, hubIndex) => {
    for (let i = 0; i < counts[hubIndex]; i++) {
      const id = vehicles.length + 1;
      vehicles.push({
        id,
        deviceSerial: `QM${String(830000 + id * 7).padStart(6, "0")}`,
        carName: CAR_MODELS[Math.floor(rand() * CAR_MODELS.length)],
        plateNumber: buildPlateNumber(rand),
        ...buildIgnition(rand),
        ...samplePoint(rand, hub),
      });
    }
  });

  return vehicles;
}

function toGeoJSON(vehicles) {
  return {
    type: "FeatureCollection",
    features: vehicles.map((v) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [v.lng, v.lat] },
      properties: {
        deviceSerial: v.deviceSerial,
        carName: v.carName,
        plateNumber: v.plateNumber,
        ignitionStatus: v.ignitionStatus,
        speed: v.ignitionStatus === "ON" ? `${v.speed}` : "",
      },
    })),
  };
}

const SOURCE_ID = "vehicles";

function loadMapImage(map, url) {
  return new Promise((resolve, reject) => {
    map.loadImage(url, (error, image) =>
      error ? reject(error) : resolve(image),
    );
  });
}

// Plain colored dot used only if a marker PNG fails to load, so vehicles
// still render instead of the whole layer silently disappearing.
function fallbackMarker(color) {
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

class FastNavigationControl extends mapboxgl.NavigationControl {
  onAdd(map) {
    const container = super.onAdd(map);
    this.mapForFastZoom = map;
    this.zoomInButton = container.querySelector(".mapboxgl-ctrl-zoom-in");
    this.zoomOutButton = container.querySelector(".mapboxgl-ctrl-zoom-out");
    this.zoomInButton?.addEventListener("click", this.handleZoomIn, true);
    this.zoomOutButton?.addEventListener("click", this.handleZoomOut, true);
    return container;
  }

  onRemove() {
    this.zoomInButton?.removeEventListener("click", this.handleZoomIn, true);
    this.zoomOutButton?.removeEventListener("click", this.handleZoomOut, true);
    this.mapForFastZoom = null;
    super.onRemove();
  }

  handleZoomIn = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.mapForFastZoom.zoomIn({ duration: 150 });
  };

  handleZoomOut = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.mapForFastZoom.zoomOut({ duration: 150 });
  };
}

// Source, layers and marker assets mirror app.qarhami.com's dashboard map
// (app.qarhami-v2.2/src/Components/Map/MapV3.jsx) so the look matches 1:1.
function addVehicleLayers(map, geojson) {
  if (map.getSource(SOURCE_ID)) return;

  Promise.allSettled([
    loadMapImage(map, markerOffUrl),
    loadMapImage(map, markerOnUrl),
  ])
    .then(([off, on]) => {
      if (off.status === "rejected" || on.status === "rejected") {
        console.error(
          "Vehicle marker icon failed to load; using fallback dots.",
          off.reason || on.reason,
        );
      }
      if (map.getSource(SOURCE_ID)) return;
      if (!map.hasImage("marker-off")) {
        map.addImage(
          "marker-off",
          off.status === "fulfilled" ? off.value : fallbackMarker("#5933E5"),
        );
      }
      if (!map.hasImage("marker-on")) {
        map.addImage(
          "marker-on",
          on.status === "fulfilled" ? on.value : fallbackMarker("#10B981"),
        );
      }

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: geojson,
        cluster: false,
        maxzoom: 14,
      });

      map.addLayer({
        id: "unclustered-point",
        type: "symbol",
        source: SOURCE_ID,
        layout: {
          "icon-image": [
            "case",
            ["==", ["get", "ignitionStatus"], "ON"],
            "marker-on",
            "marker-off",
          ],
          "icon-size": 0.7,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });

      map.addLayer({
        id: "vehicle-labels",
        type: "symbol",
        source: SOURCE_ID,
        minzoom: 17,
        layout: {
          "text-field": [
            "format",
            ["get", "carName"],
            { "font-scale": 1.1 },
            " ",
            {},
            ["get", "plateNumber"],
            { "font-scale": 1.1 },
          ],
          "text-font": ["Poppins SemiBold", "Arial Unicode MS Regular"],
          "text-size": 10,
          "text-offset": [0, 3.2],
          "text-anchor": "top",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-optional": true,
          "text-max-width": 10,
          "text-line-height": 1.2,
        },
        paint: {
          "text-color": "#5933E5",
        },
      });

      map.addLayer({
        id: "speed-label",
        type: "symbol",
        source: SOURCE_ID,
        minzoom: 17,
        filter: ["==", ["get", "ignitionStatus"], "ON"],
        layout: {
          "text-field": ["concat", ["to-string", ["get", "speed"]]],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-size": 14,
          "text-offset": [0, -3],
          "text-anchor": "center",
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#098568",
          "text-halo-color": "#E7F8F4",
          "text-halo-width": 4,
          "text-halo-blur": 2,
        },
      });

      map.on("mouseenter", "unclustered-point", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "unclustered-point", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "unclustered-point", (e) => {
        const feature = e.features[0];
        const { carName, plateNumber, deviceSerial } = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;

        new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: true,
          className: "custom-popup",
          offset: 40,
        })
          .setLngLat([lng, lat])
          .setHTML(
            `
          <div class="popup-container">
            <div class="popup-header">
              <p class="popup-title">${carName} <b>${plateNumber}</b></p>
              <a
                class="popup-navigate"
                href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Navigate
              </a>
            </div>
            <div class="popup-address">Device: ${deviceSerial}</div>
          </div>
        `,
          )
          .addTo(map);
      });
    })
    .catch((error) => {
      console.error("Failed to add vehicle layers:", error);
    });
}

const VehicleMapModal = ({ open, onClose }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapStyle, setMapStyle] = useState(
    "mapbox://styles/mapbox/streets-v11",
  );

  const vehicles = useMemo(buildDummyVehicles, []);
  const geojson = useMemo(() => toGeoJSON(vehicles), [vehicles]);

  useEffect(() => {
    if (!open || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-95.3698, 29.7604], // Downtown Houston
      zoom: 13.5,
      crossSourceCollisions: false,
      fadeDuration: 0,
    });
    mapRef.current = map;
    map.addControl(new FastNavigationControl(), "bottom-right");

    map.on("load", () => addVehicleLayers(map, geojson));

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isFirstStyleRender = useRef(true);
  useEffect(() => {
    if (isFirstStyleRender.current) {
      isFirstStyleRender.current = false;
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(mapStyle);
    map.once("style.load", () => addVehicleLayers(map, geojson));
  }, [mapStyle, geojson]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: 1100, top: 20 }}
      styles={{ body: { padding: 0, height: "75vh" } }}
      title="Vehicles on Map"
      destroyOnClose
    >
      <div className="relative w-full h-full">
        <div className="absolute right-4 top-4 z-10 bg-white rounded-full shadow px-3 py-1 flex items-center gap-2">
          <span className="text-xs text-gray-600">Satellite</span>
          <Switch
            size="small"
            checked={
              mapStyle === "mapbox://styles/mapbox/satellite-streets-v12"
            }
            onChange={(checked) =>
              setMapStyle(
                checked
                  ? "mapbox://styles/mapbox/satellite-streets-v12"
                  : "mapbox://styles/mapbox/streets-v11",
              )
            }
            style={{
              backgroundColor: mapStyle.includes("satellite")
                ? "#5933e5"
                : undefined,
            }}
          />
        </div>
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </Modal>
  );
};

export default VehicleMapModal;
