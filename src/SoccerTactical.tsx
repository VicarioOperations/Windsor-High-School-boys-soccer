import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
} from "remotion";

// 40 seconds — educational pace: animation runs to ~36s, audio ends ~35s,
// end card holds in silence for the final 4-5 seconds so players can read.
export const SOCCER_TOTAL_FRAMES = 1200;

const MAROON = "#8B0000";
const WHITE = "#FFFFFF";
const PITCH_GREEN = "#1a2e1a";
const GLOBAL_BG = "#0a0a0a";

const PITCH_LEFT = 50;
const PITCH_TOP = 50;
const PITCH_RIGHT = 1870;
const PITCH_BOTTOM = 1030;
const PITCH_W = PITCH_RIGHT - PITCH_LEFT;
const PITCH_H = PITCH_BOTTOM - PITCH_TOP;

const px = (nx: number) => PITCH_LEFT + nx * PITCH_W;
const py = (ny: number) => PITCH_TOP + ny * PITCH_H;

function lerp(frame: number, s: number, e: number, from: number, to: number) {
  return interpolate(frame, [s, e], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// Our team (Windsor) — 5-3-2, attacks left → right
const BLUE_BASE = [
  { num: 1,  nx: 0.03, ny: 0.50 }, // GK
  { num: 2,  nx: 0.21, ny: 0.12 }, // RWB — runs into channel
  { num: 4,  nx: 0.22, ny: 0.32 }, // RCB
  { num: 5,  nx: 0.20, ny: 0.50 }, // CCB
  { num: 7,  nx: 0.22, ny: 0.68 }, // LCB
  { num: 3,  nx: 0.21, ny: 0.88 }, // LWB
  { num: 8,  nx: 0.41, ny: 0.28 }, // RM
  { num: 6,  nx: 0.42, ny: 0.50 }, // Holding mid — plays through ball
  { num: 10, nx: 0.41, ny: 0.72 }, // LM
  { num: 9,  nx: 0.56, ny: 0.36 }, // RS — makes run
  { num: 11, nx: 0.56, ny: 0.64 }, // LS
];

// Opposition — 4-4-2, defends right ←
const RED_BASE = [
  { num: 1,  nx: 0.97, ny: 0.50 }, // GK
  { num: 2,  nx: 0.79, ny: 0.88 }, // RB
  { num: 3,  nx: 0.79, ny: 0.12 }, // LB — steps up high (top of screen)
  { num: 4,  nx: 0.79, ny: 0.65 }, // RCB
  { num: 5,  nx: 0.79, ny: 0.35 }, // LCB
  { num: 6,  nx: 0.64, ny: 0.82 }, // RM
  { num: 7,  nx: 0.64, ny: 0.18 }, // LM
  { num: 8,  nx: 0.64, ny: 0.62 }, // CM
  { num: 10, nx: 0.64, ny: 0.38 }, // CM
  { num: 9,  nx: 0.52, ny: 0.35 }, // RS
  { num: 11, nx: 0.52, ny: 0.65 }, // LS
];

const PitchMarkings: React.FC = () => (
  <g stroke={WHITE} fill="none">
    <rect x={PITCH_LEFT} y={PITCH_TOP} width={PITCH_W} height={PITCH_H} strokeWidth={3} />
    <line x1={960} y1={PITCH_TOP} x2={960} y2={PITCH_BOTTOM} strokeWidth={2} />
    <circle cx={960} cy={540} r={130} strokeWidth={2} />
    <circle cx={960} cy={540} r={5} fill={WHITE} stroke="none" />
    <rect x={PITCH_LEFT} y={253} width={285} height={574} strokeWidth={2} />
    <rect x={1585}       y={253} width={285} height={574} strokeWidth={2} />
    <rect x={PITCH_LEFT} y={407} width={95}  height={266} strokeWidth={2} />
    <rect x={1775}       y={407} width={95}  height={266} strokeWidth={2} />
    <rect x={8}    y={490} width={42} height={100} strokeWidth={3} />
    <rect x={1870} y={490} width={42} height={100} strokeWidth={3} />
    <circle cx={241}  cy={540} r={4} fill={WHITE} stroke="none" />
    <circle cx={1679} cy={540} r={4} fill={WHITE} stroke="none" />
    <path d="M 50 65 A 15 15 0 0 1 65 50"           strokeWidth={2} />
    <path d="M 1855 50 A 15 15 0 0 1 1870 65"       strokeWidth={2} />
    <path d="M 65 1030 A 15 15 0 0 1 50 1015"       strokeWidth={2} />
    <path d="M 1870 1015 A 15 15 0 0 1 1855 1030"   strokeWidth={2} />
  </g>
);

interface PlayerDotProps {
  cx: number; cy: number; num: number;
  fillColor: string; strokeColor: string; textColor: string; scale: number;
}
const PlayerDot: React.FC<PlayerDotProps> = ({ cx, cy, num, fillColor, strokeColor, textColor, scale }) => (
  <g transform={`translate(${cx},${cy}) scale(${scale})`}>
    <circle r={22} fill={fillColor} stroke={strokeColor} strokeWidth={3} />
    <text x={0} y={0} textAnchor="middle" dominantBaseline="central"
      fill={textColor} fontSize={15} fontWeight="bold"
      fontFamily="Arial Black, Arial, sans-serif">
      {num}
    </text>
  </g>
);

interface LabelPillProps { cx: number; cy: number; text: string; opacity: number; }
const LabelPill: React.FC<LabelPillProps> = ({ cx, cy, text, opacity }) => {
  const w = text.length * 9.5 + 28;
  return (
    <g opacity={opacity}>
      <rect x={cx - w / 2} y={cy - 18} width={w} height={36} rx={9}
        fill="rgba(10,10,10,0.80)" stroke={WHITE} strokeWidth={1.5} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fill={WHITE} fontSize={17} fontWeight="bold" fontFamily="Arial, sans-serif">
        {text}
      </text>
    </g>
  );
};

interface DashedArrowProps {
  x1: number; y1: number; x2: number; y2: number; progress: number; frame: number;
}
const DashedArrow: React.FC<DashedArrowProps> = ({ x1, y1, x2, y2, progress, frame }) => {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const vis = len * clamp(progress, 0, 1);
  const angle = Math.atan2(dy, dx);
  const aLen = 16, spread = Math.PI / 6;
  const tipX = x1 + (dx / len) * vis, tipY = y1 + (dy / len) * vis;
  const offset = -(frame * 1.5) % 18;
  return (
    <g>
      <line x1={x1} y1={y1} x2={tipX} y2={tipY}
        stroke={WHITE} strokeWidth={3.5}
        strokeDasharray="12 6" strokeDashoffset={offset} strokeLinecap="round" />
      {progress > 0.05 && (
        <polyline
          points={`${tipX - aLen * Math.cos(angle - spread)},${tipY - aLen * Math.sin(angle - spread)} ${tipX},${tipY} ${tipX - aLen * Math.cos(angle + spread)},${tipY - aLen * Math.sin(angle + spread)}`}
          fill="none" stroke={WHITE} strokeWidth={3.5}
          strokeLinejoin="round" strokeLinecap="round" />
      )}
    </g>
  );
};

interface PulseRingProps { cx: number; cy: number; frame: number; opacity: number; }
const PulseRing: React.FC<PulseRingProps> = ({ cx, cy, frame, opacity }) => {
  const phase = (frame % 45) / 45; // slower pulse cycle
  const radius = 38 + phase * 58;
  const alpha = (1 - phase) * 0.80 * opacity;
  return (
    <circle cx={cx} cy={cy} r={radius} fill="none"
      stroke={`rgba(255,255,255,${alpha})`} strokeWidth={3} strokeDasharray="14 7" />
  );
};

interface AssignmentRowProps {
  y: number; number: number; role: string; action: string; opacity: number;
}
const AssignmentRow: React.FC<AssignmentRowProps> = ({ y, number, role, action, opacity }) => (
  <g opacity={opacity}>
    <circle cx={660} cy={y} r={28} fill={WHITE} stroke={MAROON} strokeWidth={3} />
    <text x={660} y={y} textAnchor="middle" dominantBaseline="central"
      fill={MAROON} fontSize={20} fontWeight="900"
      fontFamily="Arial Black, Arial, sans-serif">
      {number}
    </text>
    <text x={710} y={y - 13} textAnchor="start"
      fill={MAROON} fontSize={22} fontWeight="900" letterSpacing={3}
      fontFamily="Arial Black, Arial, sans-serif">
      {role}
    </text>
    <text x={710} y={y + 14} textAnchor="start"
      fill={WHITE} fontSize={22} fontFamily="Arial, sans-serif">
      {action}
    </text>
  </g>
);

export const SoccerTactical: React.FC = () => {
  const frame = useCurrentFrame();

  // ── TITLE (0–90, 3s) ─────────────────────────────────────────────────────
  const titleOpacity = interpolate(frame, [0, 20, 72, 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // ── PITCH FADE IN (90–180) ───────────────────────────────────────────────
  const pitchOpacity = interpolate(frame, [90, 180], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Player spring-in starts at frame 120 (staggered per player)
  const playerSpring = (offset: number) =>
    spring({ frame: frame - 120 - offset, fps: 30, config: { stiffness: 80, damping: 22 } });

  // ── RED 3 POSITION ───────────────────────────────────────────────────────
  // Phase 1: stays put until 270, then slowly steps up (270–450)
  // Phase 2: resets at 510–630
  // Phase 3: steps up again at 660–780, stays high
  let red3Nx = 0.79, red3Ny = 0.12;

  if (frame >= 270 && frame < 510) {
    const t = lerp(frame, 270, 440, 0, 1); // slow deliberate walk up
    red3Nx = interpolate(t, [0, 1], [0.79, 0.50]);
    red3Ny = interpolate(t, [0, 1], [0.12, 0.09]);
  } else if (frame >= 510 && frame < 660) {
    const t = lerp(frame, 530, 630, 0, 1);
    red3Nx = interpolate(t, [0, 1], [0.50, 0.79]);
    red3Ny = interpolate(t, [0, 1], [0.09, 0.12]);
  } else if (frame >= 660) {
    const t = lerp(frame, 660, 780, 0, 1);
    red3Nx = interpolate(t, [0, 1], [0.79, 0.50]);
    red3Ny = interpolate(t, [0, 1], [0.12, 0.09]);
    if (frame >= 780) { red3Nx = 0.50; red3Ny = 0.09; }
  }

  // ── BALL ─────────────────────────────────────────────────────────────────
  const blue6X = px(0.42), blue6Y = py(0.50);
  const ballTargetX = px(0.74), ballTargetY = py(0.10);
  const ballAppear = spring({ frame: frame - 630, fps: 30, config: { stiffness: 100, damping: 18 } });
  const flyT = lerp(frame, 900, 975, 0, 1);
  const ballX = frame < 900 ? blue6X : interpolate(flyT, [0, 1], [blue6X, ballTargetX]);
  const rawY  = frame < 900 ? blue6Y : interpolate(flyT, [0, 1], [blue6Y, ballTargetY]);
  const arcY  = frame >= 900 && frame < 990
    ? rawY - Math.sin(flyT * Math.PI) * 90 : rawY;
  const showBall = frame >= 630;
  const ballScale = showBall ? clamp(ballAppear, 0, 1) : 0;

  // ── PULSE RING (750–930) ─────────────────────────────────────────────────
  const pulseOpacity = interpolate(frame, [750, 780, 900, 930], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // ── BLUE 2 RUN (780–960) ─────────────────────────────────────────────────
  const b2t = lerp(frame, 780, 950, 0, 1);
  const blue2Nx = frame < 780 ? 0.21 : interpolate(b2t, [0, 1], [0.21, 0.76]);
  const blue2Ny = frame < 780 ? 0.12 : interpolate(b2t, [0, 1], [0.12, 0.09]);
  const blue2Arrow = frame < 780 ? 0 : lerp(frame, 780, 960, 0, 1);

  // ── BLUE 9 RUN (810–960) ─────────────────────────────────────────────────
  const b9t = lerp(frame, 810, 950, 0, 1);
  const blue9Nx = frame < 810 ? 0.56 : interpolate(b9t, [0, 1], [0.56, 0.72]);
  const blue9Ny = frame < 810 ? 0.36 : interpolate(b9t, [0, 1], [0.36, 0.20]);
  const blue9Arrow = frame < 810 ? 0 : lerp(frame, 810, 960, 0, 1);

  // ── LABELS ───────────────────────────────────────────────────────────────
  // "Happens most of the game" (420–570)
  const habitOpacity = interpolate(frame, [420, 450, 540, 570], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  // "2v1 in behind" (990–1110)
  const label2v1Opacity = interpolate(frame, [990, 1020, 1080, 1110], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // ── END CARD (1080–1200) ──────────────────────────────────────────────────
  // Audio ends ~35s (frame 1050). End card starts fading in at 1080.
  // Players can read in silence for the final seconds.
  const endOverlay = interpolate(frame, [1080, 1120], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const fade = (a: number, b: number) =>
    interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const headlineOpacity = fade(1115, 1140);
  const row1Opacity     = fade(1135, 1155);
  const row2Opacity     = fade(1150, 1170);
  const row3Opacity     = fade(1165, 1185);
  const triggerOpacity  = fade(1180, 1200);

  // ── PLAYER ARRAYS ─────────────────────────────────────────────────────────
  const bluePositions = BLUE_BASE.map((p) => {
    if (p.num === 2) return { ...p, nx: blue2Nx, ny: blue2Ny };
    if (p.num === 9) return { ...p, nx: blue9Nx, ny: blue9Ny };
    return p;
  });
  const redPositions = RED_BASE.map((p) =>
    p.num === 3 ? { ...p, nx: red3Nx, ny: red3Ny } : p
  );

  return (
    <AbsoluteFill style={{ background: GLOBAL_BG }}>

      {/* ── TITLE CARD ── */}
      {titleOpacity > 0 && (
        <AbsoluteFill style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          opacity: titleOpacity,
        }}>
          <div style={{
            color: WHITE, fontSize: 78, fontWeight: "900",
            fontFamily: "Arial Black, Arial, sans-serif",
            textAlign: "center", letterSpacing: 1,
          }}>
            Their habit:
          </div>
          <div style={{
            color: MAROON, fontSize: 62, fontWeight: "900",
            fontFamily: "Arial Black, Arial, sans-serif",
            textAlign: "center", marginTop: 16,
          }}>
            the left back steps up.
          </div>
        </AbsoluteFill>
      )}

      {/* ── PITCH ── */}
      <AbsoluteFill style={{ opacity: pitchOpacity }}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080"
          style={{ position: "absolute", top: 0, left: 0 }}>

          <rect x={PITCH_LEFT} y={PITCH_TOP} width={PITCH_W} height={PITCH_H} fill={PITCH_GREEN} />
          {Array.from({ length: 10 }).map((_, i) => (
            <rect key={i}
              x={PITCH_LEFT + (i * PITCH_W) / 10} y={PITCH_TOP}
              width={PITCH_W / 10} height={PITCH_H}
              fill={i % 2 === 0 ? "rgba(0,0,0,0.06)" : "transparent"} />
          ))}

          <PitchMarkings />

          {/* Pulse ring */}
          {pulseOpacity > 0 && (
            <>
              <PulseRing cx={px(0.68)} cy={py(0.10)} frame={frame} opacity={pulseOpacity} />
              <PulseRing cx={px(0.68)} cy={py(0.10)} frame={(frame + 22) % 45} opacity={pulseOpacity * 0.4} />
            </>
          )}

          {/* Run arrows — behind players */}
          {blue2Arrow > 0 && (
            <DashedArrow x1={px(0.21)} y1={py(0.12)} x2={px(0.76)} y2={py(0.09)}
              progress={blue2Arrow} frame={frame} />
          )}
          {blue9Arrow > 0 && (
            <DashedArrow x1={px(0.56)} y1={py(0.36)} x2={px(0.72)} y2={py(0.20)}
              progress={blue9Arrow} frame={frame} />
          )}

          {/* Opposition (maroon) */}
          {redPositions.map((p, i) => (
            <PlayerDot key={`red-${p.num}`}
              cx={px(p.nx)} cy={py(p.ny)} num={p.num}
              fillColor={MAROON} strokeColor={WHITE} textColor={WHITE}
              scale={clamp(playerSpring(i * 5), 0, 1.15)} />
          ))}

          {/* Windsor team (white) */}
          {bluePositions.map((p, i) => (
            <PlayerDot key={`blue-${p.num}`}
              cx={px(p.nx)} cy={py(p.ny)} num={p.num}
              fillColor={WHITE} strokeColor={MAROON} textColor={MAROON}
              scale={clamp(playerSpring(i * 5 + 2), 0, 1.15)} />
          ))}

          {/* Ball */}
          {showBall && (
            <g transform={`translate(${ballX},${arcY}) scale(${ballScale})`}>
              <circle r={11} fill={WHITE} stroke="#333" strokeWidth={2} />
              <path d="M -7 -4 Q 0 0 -7 4" fill="none" stroke="#bbb" strokeWidth={1.5} />
              <path d="M  7 -4 Q 0 0  7 4" fill="none" stroke="#bbb" strokeWidth={1.5} />
            </g>
          )}

          {/* "Happens most of the game" label */}
          {habitOpacity > 0 && (
            <LabelPill cx={px(0.52)} cy={py(0.03)}
              text="Happens most of the game" opacity={habitOpacity} />
          )}

          {/* "2v1 in behind" label */}
          {label2v1Opacity > 0 && (
            <LabelPill cx={px(0.78)} cy={py(0.05)}
              text="2v1 in behind" opacity={label2v1Opacity} />
          )}

          {/* Formation labels */}
          {frame >= 180 && pitchOpacity > 0.5 && (
            <>
              <text x={px(0.25)} y={PITCH_TOP - 12} textAnchor="middle"
                fill={WHITE} fontSize={22} fontWeight="bold" fontFamily="Arial, sans-serif">
                US — 5-3-2
              </text>
              <text x={px(0.75)} y={PITCH_TOP - 12} textAnchor="middle"
                fill={MAROON} fontSize={22} fontWeight="bold" fontFamily="Arial, sans-serif">
                THEM — 4-4-2
              </text>
            </>
          )}
        </svg>
      </AbsoluteFill>

      {/* ── END CARD ── */}
      {endOverlay > 0 && (
        <AbsoluteFill style={{ background: `rgba(10,10,10,${endOverlay * 0.94})` }}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080"
            style={{ position: "absolute", top: 0, left: 0 }}>

            {/* Left maroon accent bar */}
            <rect x={560} y={160} width={8} height={760} fill={MAROON} rx={4} />

            {/* "YOUR ASSIGNMENT" */}
            <g opacity={headlineOpacity}>
              <text x={620} y={250} textAnchor="start" dominantBaseline="central"
                fill={WHITE} fontSize={52} fontWeight="900" letterSpacing={6}
                fontFamily="Arial Black, Arial, sans-serif">
                YOUR ASSIGNMENT
              </text>
              <line x1={620} y1={278} x2={1360} y2={278} stroke={MAROON} strokeWidth={3} />
            </g>

            <AssignmentRow y={370} number={2}  role="WINGBACK" action="Run the channel — every time."          opacity={row1Opacity} />
            <AssignmentRow y={490} number={9}  role="STRIKER"  action="Get in behind — every time."           opacity={row2Opacity} />
            <AssignmentRow y={610} number={6}  role="SIX"      action="Read it first. Play the ball on time." opacity={row3Opacity} />

            <line x1={620} y1={675} x2={1360} y2={675}
              stroke={`rgba(139,0,0,${triggerOpacity})`} strokeWidth={2} />

            <g opacity={triggerOpacity}>
              <text x={620} y={725} textAnchor="start" dominantBaseline="central"
                fill="rgba(255,255,255,0.65)" fontSize={28} fontFamily="Arial, sans-serif">
                Trigger:
              </text>
              <text x={730} y={725} textAnchor="start" dominantBaseline="central"
                fill={WHITE} fontSize={28} fontWeight="bold" fontFamily="Arial, sans-serif">
                their left back steps up.
              </text>
              <text x={620} y={790} textAnchor="start" dominantBaseline="central"
                fill={WHITE} fontSize={40} fontWeight="900"
                fontFamily="Arial Black, Arial, sans-serif">
                Know your role. Execute it.
              </text>
            </g>

          </svg>
        </AbsoluteFill>
      )}

    </AbsoluteFill>
  );
};
