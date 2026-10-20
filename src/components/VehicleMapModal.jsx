import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Modal, Switch, Spin, Empty } from "antd";
import { getVehiclePositions } from "../api/Devices";
import markerOffUrl from "../assets/map/sub-marker-2.png";
import markerOnUrl from "../assets/map/sub-marker-3.png";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;


const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// Keep only vehicles with a usable coordinate pair.
function normalizeVehicles(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((r) => ({
      ...r,
      lat: Number(r.latitude),
      lng: Number(r.longitude),
    }))
    .filter(
      (v) =>
        Number.isFinite(v.lat) &&
        Number.isFinite(v.lng) &&
        !(v.lat === 0 && v.lng === 0) &&
        Math.abs(v.lat) <= 90 &&
        Math.abs(v.lng) <= 180,
    );
}

function toGeoJSON(vehicles) {
  return {
    type: "FeatureCollection",
    features: vehicles.map((v) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [v.lng, v.lat] },
      properties: {
        deviceSerial: v.deviceSerial,
        carName: v.carName || "",
        plateNumber: v.plateNumber || "",
        email: v.email || "",
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
        const { carName, plateNumber, deviceSerial, email } = feature.properties;
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
              <p class="popup-title">${escapeHtml(carName) || "Unnamed vehicle"} <b>${escapeHtml(plateNumber)}</b></p>
              <a
                class="popup-navigate"
                href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Navigate
              </a>
            </div>
            <div class="popup-address">Device: ${escapeHtml(deviceSerial)}</div>
            <div class="popup-address">Email: ${escapeHtml(email) || "-"}</div>
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

  const [vehicles, setVehicles] = useState(null); // null = not loaded yet
  const [loadError, setLoadError] = useState("");
  const geojson = useMemo(() => toGeoJSON(vehicles || []), [vehicles]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setVehicles(null);
    setLoadError("");
    getVehiclePositions()
      .then((rows) => {
        if (!cancelled) setVehicles(normalizeVehicles(rows));
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load vehicle locations",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const hasVehicles = !!vehicles && vehicles.length > 0;

  useEffect(() => {
    if (!open || !hasVehicles || mapRef.current || !mapContainerRef.current)
      return;

    const bounds = new mapboxgl.LngLatBounds();
    vehicles.forEach((v) => bounds.extend([v.lng, v.lat]));

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      bounds,
      fitBoundsOptions: { padding: 60, maxZoom: 13.5 },
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
  }, [open, hasVehicles]);

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
      title={`Vehicles on Map${vehicles ? ` (${vehicles.length})` : ""}`}
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
        {hasVehicles ? (
          <div
            ref={mapContainerRef}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {loadError ? (
              <Empty description={loadError} />
            ) : vehicles === null ? (
              <Spin tip="Loading vehicle locations..." />
            ) : (
              <Empty description="No vehicles with a known location" />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VehicleMapModal;
