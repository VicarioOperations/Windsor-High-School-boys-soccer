import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
} from "remotion";

export const SOCCER_TOTAL_FRAMES = 660;

// Pitch coordinate helpers
const PITCH_LEFT = 50;
const PITCH_TOP = 50;
const PITCH_RIGHT = 1870;
const PITCH_BOTTOM = 1030;
const PITCH_W = PITCH_RIGHT - PITCH_LEFT; // 1820
const PITCH_H = PITCH_BOTTOM - PITCH_TOP; // 980

const px = (nx: number) => PITCH_LEFT + nx * PITCH_W;
const py = (ny: number) => PITCH_TOP + ny * PITCH_H;

// clamp helper
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// interpolate with clamp
function lerp(
  frame: number,
  start: number,
  end: number,
  from: number,
  to: number
): number {
  return interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

// Blue team: 5-3-2, attacks left -> right
const BLUE_BASE: { num: number; nx: number; ny: number }[] = [
  { num: 1, nx: 0.03, ny: 0.5 },   // GK
  { num: 2, nx: 0.21, ny: 0.12 },  // RWB
  { num: 4, nx: 0.22, ny: 0.32 },  // RCB
  { num: 5, nx: 0.2, ny: 0.5 },    // CCB
  { num: 7, nx: 0.22, ny: 0.68 },  // LCB
  { num: 3, nx: 0.21, ny: 0.88 },  // LWB
  { num: 8, nx: 0.41, ny: 0.28 },  // RM
  { num: 6, nx: 0.42, ny: 0.5 },   // CM/Hold
  { num: 10, nx: 0.41, ny: 0.72 }, // LM
  { num: 9, nx: 0.56, ny: 0.36 },  // RS
  { num: 11, nx: 0.56, ny: 0.64 }, // LS
];

// Red team: 4-4-2, defends right <-
const RED_BASE: { num: number; nx: number; ny: number }[] = [
  { num: 1, nx: 0.97, ny: 0.5 },   // GK
  { num: 2, nx: 0.79, ny: 0.88 },  // RB
  { num: 3, nx: 0.79, ny: 0.12 },  // LB — pushes high
  { num: 4, nx: 0.79, ny: 0.65 },  // RCB
  { num: 5, nx: 0.79, ny: 0.35 },  // LCB
  { num: 6, nx: 0.64, ny: 0.82 },  // RM
  { num: 7, nx: 0.64, ny: 0.18 },  // LM
  { num: 8, nx: 0.64, ny: 0.62 },  // CM
  { num: 10, nx: 0.64, ny: 0.38 }, // CM
  { num: 9, nx: 0.52, ny: 0.35 },  // RS
  { num: 11, nx: 0.52, ny: 0.65 }, // LS
];

// Pitch SVG markings
const PitchMarkings: React.FC = () => (
  <g>
    {/* Outer boundary */}
    <rect
      x={PITCH_LEFT}
      y={PITCH_TOP}
      width={PITCH_W}
      height={PITCH_H}
      fill="none"
      stroke="white"
      strokeWidth={3}
    />
    {/* Halfway line */}
    <line
      x1={960}
      y1={PITCH_TOP}
      x2={960}
      y2={PITCH_BOTTOM}
      stroke="white"
      strokeWidth={2}
    />
    {/* Center circle */}
    <circle
      cx={960}
      cy={540}
      r={130}
      fill="none"
      stroke="white"
      strokeWidth={2}
    />
    {/* Center spot */}
    <circle cx={960} cy={540} r={5} fill="white" />
    {/* Left penalty area */}
    <rect
      x={PITCH_LEFT}
      y={253}
      width={285}
      height={574}
      fill="none"
      stroke="white"
      strokeWidth={2}
    />
    {/* Right penalty area */}
    <rect
      x={1585}
      y={253}
      width={285}
      height={574}
      fill="none"
      stroke="white"
      strokeWidth={2}
    />
    {/* Left 6-yard box */}
    <rect
      x={PITCH_LEFT}
      y={407}
      width={95}
      height={266}
      fill="none"
      stroke="white"
      strokeWidth={2}
    />
    {/* Right 6-yard box */}
    <rect
      x={1775}
      y={407}
      width={95}
      height={266}
      fill="none"
      stroke="white"
      strokeWidth={2}
    />
    {/* Left goal */}
    <rect
      x={8}
      y={490}
      width={42}
      height={100}
      fill="none"
      stroke="white"
      strokeWidth={3}
    />
    {/* Right goal */}
    <rect
      x={1870}
      y={490}
      width={42}
      height={100}
      fill="none"
      stroke="white"
      strokeWidth={3}
    />
    {/* Left penalty spot */}
    <circle cx={241} cy={540} r={4} fill="white" />
    {/* Right penalty spot */}
    <circle cx={1679} cy={540} r={4} fill="white" />
    {/* Corner arcs — top-left */}
    <path
      d="M 50 65 A 15 15 0 0 1 65 50"
      fill="none"
      stroke="white"
      strokeWidth={2}
    />
    {/* Corner arc — top-right */}
    <path
      d="M 1855 50 A 15 15 0 0 1 1870 65"
      fill="none"
      stroke="white"
      strokeWidth={2}
    />
    {/* Corner arc — bottom-left */}
    <path
      d="M 65 1030 A 15 15 0 0 1 50 1015"
      fill="none"
      stroke="white"
      strokeWidth={2}
    />
    {/* Corner arc — bottom-right */}
    <path
      d="M 1870 1015 A 15 15 0 0 1 1855 1030"
      fill="none"
      stroke="white"
      strokeWidth={2}
    />
  </g>
);

interface PlayerDotProps {
  cx: number;
  cy: number;
  num: number;
  color: string;
  scale: number;
}

const PlayerDot: React.FC<PlayerDotProps> = ({ cx, cy, num, color, scale }) => {
  const r = 22;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
      <circle r={r} fill={color} stroke="white" strokeWidth={2.5} />
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={15}
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {num}
      </text>
    </g>
  );
};

interface LabelPillProps {
  cx: number;
  cy: number;
  text: string;
  opacity: number;
}

const LabelPill: React.FC<LabelPillProps> = ({ cx, cy, text, opacity }) => {
  const approxWidth = text.length * 9 + 24;
  return (
    <g opacity={opacity}>
      <rect
        x={cx - approxWidth / 2}
        y={cy - 16}
        width={approxWidth}
        height={32}
        rx={8}
        ry={8}
        fill="rgba(0,0,0,0.65)"
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFD700"
        fontSize={16}
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {text}
      </text>
    </g>
  );
};

interface DashedArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number; // 0-1, how much of the arrow to show
  frame: number;
}

const DashedArrow: React.FC<DashedArrowProps> = ({
  x1,
  y1,
  x2,
  y2,
  progress,
  frame,
}) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const totalLen = Math.sqrt(dx * dx + dy * dy);
  const visLen = totalLen * clamp(progress, 0, 1);
  // Arrow head angle
  const angle = Math.atan2(dy, dx);
  const arrowLen = 14;
  const arrowAngle = Math.PI / 6;
  const tipX = x1 + (dx / totalLen) * visLen;
  const tipY = y1 + (dy / totalLen) * visLen;
  const ah1x = tipX - arrowLen * Math.cos(angle - arrowAngle);
  const ah1y = tipY - arrowLen * Math.sin(angle - arrowAngle);
  const ah2x = tipX - arrowLen * Math.cos(angle + arrowAngle);
  const ah2y = tipY - arrowLen * Math.sin(angle + arrowAngle);

  const dashOffset = -(frame * 2) % 18;

  return (
    <g>
      {/* Dashed line up to visLen */}
      <line
        x1={x1}
        y1={y1}
        x2={tipX}
        y2={tipY}
        stroke="#FFD700"
        strokeWidth={3}
        strokeDasharray="12 6"
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
      {/* Arrow head */}
      {progress > 0.05 && (
        <polyline
          points={`${ah1x},${ah1y} ${tipX},${tipY} ${ah2x},${ah2y}`}
          fill="none"
          stroke="#FFD700"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </g>
  );
};

interface PulseRingProps {
  cx: number;
  cy: number;
  frame: number;
  opacity: number;
}

const PulseRing: React.FC<PulseRingProps> = ({ cx, cy, frame, opacity }) => {
  const phase = (frame % 30) / 30; // 0..1 cycling every 30 frames
  const radius = 35 + phase * 50;
  const ringOpacity = (1 - phase) * 0.8 * opacity;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill="none"
      stroke="rgba(255,215,0,0.6)"
      strokeWidth={3}
      strokeDasharray="14 7"
      opacity={ringOpacity}
    />
  );
};

export const SoccerTactical: React.FC = () => {
  const frame = useCurrentFrame();

  // ===================== PHASE CALCULATIONS =====================

  // Title phase: 0-75 (title text)
  const titleOpacity = interpolate(
    frame,
    [0, 15, 60, 75],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Pitch fade in: 75-135
  const pitchOpacity = interpolate(
    frame,
    [75, 135],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Player spring-in: starts at frame 90, each player has slight offset
  const playerSpringBase = (offset: number) =>
    spring({
      frame: frame - 90 - offset,
      fps: 30,
      config: { stiffness: 100, damping: 20 },
    });

  // Red 3 movement — first push high: 135-225
  // Red 3 base: (0.79, 0.12), high: (0.50, 0.09)
  const red3FirstPushProgress = lerp(frame, 155, 215, 0, 1);
  const red3FirstNx = interpolate(red3FirstPushProgress, [0, 1], [0.79, 0.5]);
  const red3FirstNy = interpolate(red3FirstPushProgress, [0, 1], [0.12, 0.09]);

  // "Happens most of the game" label: 225-285
  const labelFirstOpacity = interpolate(
    frame,
    [225, 240, 265, 285],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Red 3 reset (spring back): 285-360
  const red3ResetProgress = lerp(frame, 295, 355, 0, 1);
  const red3ResetNx = interpolate(red3ResetProgress, [0, 1], [0.5, 0.79]);
  const red3ResetNy = interpolate(red3ResetProgress, [0, 1], [0.09, 0.12]);

  // Determine red 3 position across all phases
  let red3Nx = 0.79;
  let red3Ny = 0.12;
  if (frame >= 155 && frame < 285) {
    red3Nx = red3FirstNx;
    red3Ny = red3FirstNy;
  } else if (frame >= 285 && frame < 365) {
    red3Nx = red3ResetNx;
    red3Ny = red3ResetNy;
  } else if (frame >= 365) {
    // Second push high (simultaneous with blue 6 getting ball)
    const red3SecondProgress = lerp(frame, 365, 410, 0, 1);
    red3Nx = interpolate(red3SecondProgress, [0, 1], [0.79, 0.5]);
    red3Ny = interpolate(red3SecondProgress, [0, 1], [0.12, 0.09]);
    if (frame >= 410) {
      red3Nx = 0.5;
      red3Ny = 0.09;
    }
  }

  // Ball position — appears at blue 6 at frame 360-420
  const ballAppearScale = spring({
    frame: frame - 360,
    fps: 30,
    config: { stiffness: 120, damping: 18 },
  });

  // Ball at blue 6 position until frame 510
  const blue6X = px(0.42);
  const blue6Y = py(0.5);

  // Ball flies to channel: 510-570
  const ballTargetX = px(0.74);
  const ballTargetY = py(0.1);
  const ballFlyProgress = lerp(frame, 510, 565, 0, 1);
  const ballX =
    frame < 510
      ? blue6X
      : interpolate(ballFlyProgress, [0, 1], [blue6X, ballTargetX]);
  const ballY =
    frame < 510
      ? blue6Y
      : interpolate(ballFlyProgress, [0, 1], [blue6Y, ballTargetY]);
  // Slight arc: offset Y midpoint up
  const ballArcY =
    frame >= 510 && frame < 570
      ? ballY - Math.sin(ballFlyProgress * Math.PI) * 80
      : ballY;

  const showBall = frame >= 360;
  const ballScale = showBall ? clamp(ballAppearScale, 0, 1) : 0;

  // Pulse ring at (0.68, 0.10): 420-540
  const pulseRingOpacity = interpolate(
    frame,
    [420, 435, 525, 540],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Blue 2 run: (0.21, 0.12) -> (0.76, 0.09): 450-540
  const blue2RunProgress = lerp(frame, 450, 535, 0, 1);
  const blue2Nx =
    frame < 450
      ? 0.21
      : interpolate(blue2RunProgress, [0, 1], [0.21, 0.76]);
  const blue2Ny =
    frame < 450
      ? 0.12
      : interpolate(blue2RunProgress, [0, 1], [0.12, 0.09]);

  // Blue 9 run: (0.56, 0.36) -> (0.72, 0.20): 450-540
  const blue9RunProgress = lerp(frame, 455, 535, 0, 1);
  const blue9Nx =
    frame < 455
      ? 0.56
      : interpolate(blue9RunProgress, [0, 1], [0.56, 0.72]);
  const blue9Ny =
    frame < 455
      ? 0.36
      : interpolate(blue9RunProgress, [0, 1], [0.36, 0.2]);

  // Dashed run arrow: blue 2
  const blue2ArrowProgress = frame < 450 ? 0 : lerp(frame, 450, 540, 0, 1);
  // Dashed run arrow: blue 9
  const blue9ArrowProgress = frame < 455 ? 0 : lerp(frame, 455, 540, 0, 1);

  // "2v1 in behind" label: 570-630
  const label2v1Opacity = interpolate(
    frame,
    [570, 585, 620, 630],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // End frame overlay: 630-660
  const endOverlayOpacity = interpolate(
    frame,
    [630, 650],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const endTextOpacity = interpolate(
    frame,
    [640, 658],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ===================== PLAYER POSITIONS =====================

  // Compute current positions for each blue player
  const bluePositions = BLUE_BASE.map((p) => {
    if (p.num === 2) {
      return { ...p, nx: blue2Nx, ny: blue2Ny };
    }
    if (p.num === 9) {
      return { ...p, nx: blue9Nx, ny: blue9Ny };
    }
    return p;
  });

  const redPositions = RED_BASE.map((p) => {
    if (p.num === 3) {
      return { ...p, nx: red3Nx, ny: red3Ny };
    }
    return p;
  });

  // ===================== RENDER =====================

  return (
    <AbsoluteFill style={{ background: "#0f1923" }}>
      {/* Audio muxed via ffmpeg post-render (macOS 13 compositor compat) */}

      {/* Title card */}
      {titleOpacity > 0 && (
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: titleOpacity,
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: 72,
              fontWeight: "bold",
              fontFamily: "Arial, sans-serif",
              textAlign: "center",
              lineHeight: 1.3,
              textShadow: "0 2px 12px rgba(0,0,0,0.7)",
            }}
          >
            Their habit:
          </div>
          <div
            style={{
              color: "#FFD700",
              fontSize: 58,
              fontWeight: "bold",
              fontFamily: "Arial, sans-serif",
              textAlign: "center",
              marginTop: 12,
              textShadow: "0 2px 12px rgba(0,0,0,0.7)",
            }}
          >
            the left back steps up.
          </div>
        </AbsoluteFill>
      )}

      {/* Pitch + animation */}
      <AbsoluteFill style={{ opacity: pitchOpacity }}>
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Pitch background */}
          <rect
            x={PITCH_LEFT}
            y={PITCH_TOP}
            width={PITCH_W}
            height={PITCH_H}
            fill="#2d8a4e"
          />

          {/* Subtle alternating grass stripes */}
          {Array.from({ length: 10 }).map((_, i) => (
            <rect
              key={i}
              x={PITCH_LEFT + (i * PITCH_W) / 10}
              y={PITCH_TOP}
              width={PITCH_W / 10}
              height={PITCH_H}
              fill={i % 2 === 0 ? "rgba(0,0,0,0.04)" : "transparent"}
            />
          ))}

          {/* Pitch markings */}
          <PitchMarkings />

          {/* Pulse ring at the exploited space */}
          {pulseRingOpacity > 0 && (
            <>
              <PulseRing
                cx={px(0.68)}
                cy={py(0.1)}
                frame={frame}
                opacity={pulseRingOpacity}
              />
              <PulseRing
                cx={px(0.68)}
                cy={py(0.1)}
                frame={(frame + 15) % 30}
                opacity={pulseRingOpacity * 0.5}
              />
            </>
          )}

          {/* Dashed run arrows — drawn UNDER players */}
          {blue2ArrowProgress > 0 && (
            <DashedArrow
              x1={px(0.21)}
              y1={py(0.12)}
              x2={px(0.76)}
              y2={py(0.09)}
              progress={blue2ArrowProgress}
              frame={frame}
            />
          )}
          {blue9ArrowProgress > 0 && (
            <DashedArrow
              x1={px(0.56)}
              y1={py(0.36)}
              x2={px(0.72)}
              y2={py(0.2)}
              progress={blue9ArrowProgress}
              frame={frame}
            />
          )}

          {/* Red players */}
          {redPositions.map((p, i) => {
            const scale = clamp(playerSpringBase(i * 4), 0, 1.2);
            return (
              <PlayerDot
                key={`red-${p.num}`}
                cx={px(p.nx)}
                cy={py(p.ny)}
                num={p.num}
                color="#e02020"
                scale={scale}
              />
            );
          })}

          {/* Blue players */}
          {bluePositions.map((p, i) => {
            const scale = clamp(playerSpringBase(i * 4 + 2), 0, 1.2);
            return (
              <PlayerDot
                key={`blue-${p.num}`}
                cx={px(p.nx)}
                cy={py(p.ny)}
                num={p.num}
                color="#1e56c8"
                scale={scale}
              />
            );
          })}

          {/* Ball */}
          {showBall && (
            <g transform={`translate(${ballX}, ${ballArcY}) scale(${ballScale})`}>
              <circle r={10} fill="white" stroke="#333" strokeWidth={2} />
              {/* Ball seam lines */}
              <path
                d="M -6 -4 Q 0 0 -6 4"
                fill="none"
                stroke="#aaa"
                strokeWidth={1.5}
              />
              <path
                d="M 6 -4 Q 0 0 6 4"
                fill="none"
                stroke="#aaa"
                strokeWidth={1.5}
              />
            </g>
          )}

          {/* "Happens most of the game" label near red 3 high position */}
          {labelFirstOpacity > 0 && (
            <LabelPill
              cx={px(0.52)}
              cy={py(0.03)}
              text="Happens most of the game"
              opacity={labelFirstOpacity}
            />
          )}

          {/* "2v1 in behind" label */}
          {label2v1Opacity > 0 && (
            <LabelPill
              cx={px(0.78)}
              cy={py(0.05)}
              text="2v1 in behind"
              opacity={label2v1Opacity}
            />
          )}

          {/* Team formation labels (shown from frame 135 onward) */}
          {frame >= 135 && pitchOpacity > 0.5 && (
            <>
              <text
                x={px(0.25)}
                y={PITCH_TOP - 12}
                textAnchor="middle"
                fill="#1e56c8"
                fontSize={22}
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
              >
                US — 5-3-2
              </text>
              <text
                x={px(0.75)}
                y={PITCH_TOP - 12}
                textAnchor="middle"
                fill="#e02020"
                fontSize={22}
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
              >
                THEM — 4-4-2
              </text>
            </>
          )}
        </svg>
      </AbsoluteFill>

      {/* End frame overlay */}
      {endOverlayOpacity > 0 && (
        <AbsoluteFill
          style={{
            background: `rgba(15,25,35,${endOverlayOpacity})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ opacity: endTextOpacity, textAlign: "center" }}>
            <div
              style={{
                color: "#FFD700",
                fontSize: 54,
                fontWeight: "bold",
                fontFamily: "Arial, sans-serif",
                marginBottom: 20,
                letterSpacing: 2,
              }}
            >
              Wingback ② · Striker ⑨ · Six ⑥
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 40,
                fontFamily: "Arial, sans-serif",
                marginBottom: 14,
              }}
            >
              When their left back steps up —
            </div>
            <div
              style={{
                color: "white",
                fontSize: 50,
                fontWeight: "bold",
                fontFamily: "Arial, sans-serif",
                textShadow: "0 0 20px rgba(255,215,0,0.4)",
              }}
            >
              Attack this space.
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
