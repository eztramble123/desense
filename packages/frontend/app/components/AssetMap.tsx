"use client";

import { useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Asset } from "../data/sample";

interface AssetMapProps {
  assets: Asset[];
}

export function AssetMap({ assets }: AssetMapProps) {
  const [hovered, setHovered] = useState<Asset | null>(null);

  return (
    <div className="rounded-xl overflow-hidden" style={{ height: 420 }}>
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ longitude: 18, latitude: 32, zoom: 1.6 }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: "100%", height: "100%" }}
      >
        {assets.map((asset) => (
          <Marker
            key={asset.id}
            longitude={asset.longitude}
            latitude={asset.latitude}
            anchor="center"
          >
            <button
              onMouseEnter={() => setHovered(asset)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: asset.deviceTypeLabel === "Commercial" ? 14 : 10,
                height: asset.deviceTypeLabel === "Commercial" ? 14 : 10,
                borderRadius: "50%",
                background: asset.deviceTypeLabel === "Commercial" ? "#2563eb" : "#60a5fa",
                border: "2px solid rgba(255,255,255,0.25)",
                boxShadow: `0 0 ${asset.deviceTypeLabel === "Commercial" ? "12px" : "8px"} ${asset.deviceTypeLabel === "Commercial" ? "#2563eb88" : "#60a5fa55"}`,
                cursor: "pointer",
              }}
            />
          </Marker>
        ))}

        {hovered && (
          <Popup
            longitude={hovered.longitude}
            latitude={hovered.latitude}
            anchor="bottom"
            offset={14}
            closeButton={false}
            closeOnClick={false}
            style={{ padding: 0 }}
          >
            <div style={{
              background: "#0a1530",
              border: "1px solid #152046",
              borderRadius: 10,
              padding: "12px 16px",
              minWidth: 200,
              fontFamily: "Barlow, system-ui, sans-serif",
            }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.38)", marginBottom: 4 }}>
                {hovered.deviceTypeLabel} · {hovered.region}
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
                {hovered.location}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                {[
                  ["Capacity",   `${hovered.capacityKw} kW`],
                  ["CF",         `${hovered.capacityFactor}%`],
                  ["Uptime",     `${hovered.sla.avgUptime.toFixed(1)}%`],
                  ["Batches",    `${hovered.sla.totalBatches}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 1 }}>{label}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
