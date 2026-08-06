/*
  LionGlobe — the locations graphic.

  A wireframe globe drawn around the ELSIAA lion: meridians and parallels in
  ELSIAA green over black and white, with the lion mark sitting inside the
  sphere and the live offices pinned on the surface. Pure SVG, so it scales
  to any size, costs nothing to load, and the pins stay crisp.

  Green / black / white only — no third colour enters the palette.
*/

const GREEN = "#1e6b3c";
const GREEN_LIGHT = "#2e9e58";

/** Offices, placed by longitude so the ring order matches the real world. */
const PINS: Array<{ name: string; lon: number; lat: number }> = [
  { name: "Los Angeles", lon: -118, lat: 34 },
  { name: "New York", lon: -74, lat: 41 },
  { name: "London", lon: 0, lat: 51 },
  { name: "Antwerp", lon: 4, lat: 51 },
  { name: "Geneva", lon: 6, lat: 46 },
  { name: "Tel Aviv", lon: 35, lat: 32 },
];

const R = 128; // sphere radius in viewBox units
const CX = 160;
const CY = 160;

/** Longitude/latitude → x/y on the visible face of an orthographic sphere. */
function project(lon: number, lat: number) {
  const l = (lon * Math.PI) / 180;
  const p = (lat * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(p) * Math.sin(l),
    y: CY - R * Math.sin(p),
    // cos of the angle from the viewer — < 0 means it is round the back
    front: Math.cos(p) * Math.cos(l),
  };
}

export function LionGlobe({ className = "" }: { className?: string }) {
  // meridians every 30°, drawn as ellipses squashed by their own longitude
  const meridians = [-90, -60, -30, 0, 30, 60, 90];
  // parallels every 30°, each a horizontal ellipse at its own height
  const parallels = [-60, -30, 0, 30, 60];

  return (
    <svg
      viewBox="0 0 320 320"
      className={className}
      role="img"
      aria-label="A wireframe globe around the ELSIAA lion, marked with the six ELSIAA offices"
    >
      <defs>
        {/* keeps the lion and the pins inside the sphere */}
        <clipPath id="lg-sphere">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
        <radialGradient id="lg-shade" cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="72%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef3ef" />
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={R} fill="url(#lg-shade)" />

      <g clipPath="url(#lg-sphere)">
        {/* parallels */}
        {parallels.map((lat) => {
          const p = (lat * Math.PI) / 180;
          const ry = R * Math.cos(p) * 0.26;
          return (
            <ellipse
              key={`p${lat}`}
              cx={CX}
              cy={CY - R * Math.sin(p)}
              rx={R * Math.cos(p)}
              ry={ry}
              fill="none"
              stroke={GREEN}
              strokeOpacity={lat === 0 ? 0.4 : 0.17}
              strokeWidth={lat === 0 ? 1.4 : 1}
            />
          );
        })}
        {/* meridians */}
        {meridians.map((lon) => (
          <ellipse
            key={`m${lon}`}
            cx={CX}
            cy={CY}
            rx={Math.abs(R * Math.sin((lon * Math.PI) / 180)) || 0.6}
            ry={R}
            fill="none"
            stroke={GREEN}
            strokeOpacity={lon === 0 ? 0.4 : 0.17}
            strokeWidth={lon === 0 ? 1.4 : 1}
          />
        ))}

        {/* the lion, inside the sphere */}
        <image
          href="/assets/elsiaa-lion-192.png"
          x={CX - 62}
          y={CY - 66}
          width="124"
          height="124"
          opacity="0.94"
          preserveAspectRatio="xMidYMid meet"
        />

        {/* offices — only those on the visible face */}
        {PINS.filter((o) => project(o.lon, o.lat).front > 0).map((o) => {
          const { x, y } = project(o.lon, o.lat);
          return (
            <g key={o.name}>
              <circle cx={x} cy={y} r="7" fill={GREEN} opacity="0.16">
                <animate
                  attributeName="r"
                  values="5;11;5"
                  dur="3.2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.22;0;0.22"
                  dur="3.2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx={x} cy={y} r="3.2" fill={GREEN_LIGHT} stroke="#ffffff" strokeWidth="1.2" />
            </g>
          );
        })}
      </g>

      {/* the rim, drawn last so it sits over everything */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#111111" strokeWidth="2" />
    </svg>
  );
}
