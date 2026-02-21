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
            offset={16}
            closeButton={false}
            closeOnClick={false}
          >
            <div style={{
              background: "#060e24",
              border: "1px solid #1a2d50",
              borderRadius: 8,
              padding: "10px 14px",
              minWidth: 180,
              fontFamily: "Barlow, system-ui, sans-serif",
            }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 5 }}>
                {hovered.deviceTypeLabel} · {hovered.region}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 10, lineHeight: 1.3 }}>
                {hovered.location}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  [`${(hovered.sla.avgOutput * 48 / 1000).toFixed(1)} kWh`, "Total (24h)"],
                  [`${(hovered.sla.avgOutput / 500).toFixed(1)} kW`,        "Avg Load"],
                  [`${hovered.sla.avgUptime.toFixed(0)}%`,                  "Uptime"],
                ].map(([value, label]) => (
                  <div key={label} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{value}</span>
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
