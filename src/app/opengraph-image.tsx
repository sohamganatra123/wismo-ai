import { ImageResponse } from "next/og";

export const alt = "Wismo.ai — Order question resolved";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const bars = [4, 8, 3, 6, 10, 4, 3, 9, 5, 3, 7, 4, 9, 3, 5, 8, 4, 7, 3, 10, 5, 3, 8, 4, 6, 3, 9];

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "58px 66px", color: "#171714", background: "#f7f4ea", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 34, letterSpacing: -2 }}>WISMO.ai</strong>
        <span style={{ padding: "12px 18px", color: "white", background: "#2457ff", fontSize: 17, letterSpacing: 2 }}>AUTONOMOUS WISMO</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 22, letterSpacing: 4 }}>ORDER QUESTION</span>
        <strong style={{ marginTop: 8, fontSize: 108, lineHeight: .82, letterSpacing: -8 }}>RESOLVED.</strong>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderTop: "2px solid #171714", paddingTop: 22 }}>
        <div style={{ height: 62, display: "flex", gap: 5, alignItems: "stretch" }}>{bars.map((width, index) => <span key={index} style={{ width, background: "#171714" }} />)}</div>
        <span style={{ fontSize: 18, letterSpacing: 2 }}>UNLOCKS BY SAFETY GATE</span>
      </div>
    </div>,
    size,
  );
}
