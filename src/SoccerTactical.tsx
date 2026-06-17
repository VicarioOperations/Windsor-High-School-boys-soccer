import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
} from "remotion";

export const SOCCER_TOTAL_FRAMES = 780; // 26s @ 30fps

// Windsor HS palette
const MAROON = "#8B0000";
const WHITE = "#FFFFFF";
const PITCH_GREEN = "#1a2e1a";
const GLOBAL_BG = "#0a0a0a";
const LABEL_BG = "rgba(10,10,10,0.75)";

// Pitch coordinate helpers
const PITCH_LEFT = 50;
const PITCH_TOP = 50;
const PITCH_RIGHT = 1870;
const PITCH_BOTTOM = 1030;
const PITCH_W = PITCH_RIGHT - PITCH_LEFT;
const PITCH_H = PITCH_BOTTOM - PITCH_TOP;

const px = (nx: number) => PITCH_LEFT + nx * PITCH_W;
const py = (ny: number) => PITCH_TOP + ny * PITCH_H;

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

function clamp(val: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, val));
}

// Our team (Windsor) — 5-3-2, attacks left → right
const BLUE_BASE: { num: number; nx: number; ny: number }[] = [
  { num: 1,  nx: 0.03, ny: 0.50 }, // GK
  { num: 2,  nx: 0.21, ny: 0.12 }, // RWB — runs into space
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
const RED_BASE: { num: number; nx: number; ny: number }[] = [
  { num: 1,  nx: 0.97, ny: 0.50 }, // GK
  { num: 2,  nx: 0.79, ny: 0.88 }, // RB
  { num: 3,  nx: 0.79, ny: 0.12 }, // LB — pushes high (top of screen)
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
    {/* Left penalty area */}
    <rect x={PITCH_LEFT} y={253} width={285} height={574} strokeWidth={2} />
    {/* Right penalty area */}
    <rect x={1585} y={253} width={285} height={574} strokeWidth={2} />
    {/* Left 6-yard box */}
    <rect x={PITCH_LEFT} y={407} width={95} height={266} strokeWidth={2} />
    {/* Right 6-yard box */}
    <rect x={1775} y={407} width={95} height={266} strokeWidth={2} />
    {/* Goals */}
    <rect x={8}    y={490} width={42} height={100} strokeWidth={3} />
    <rect x={1870} y={490} width={42} height={100} strokeWidth={3} />
    {/* Penalty spots */}
    <circle cx={241}  cy={540} r={4} fill={WHITE} stroke="none" />
    <circle cx={1679} cy={540} r={4} fill={WHITE} stroke="none" />
    {/* Corner arcs */}
    <path d="M 50 65 A 15 15 0 0 1 65 50"       strokeWidth={2} />
    <path d="M 1855 50 A 15 15 0 0 1 1870 65"   strokeWidth={2} />
    <path d="M 65 1030 A 15 15 0 0 1 50 1015"   strokeWidth={2} />
    <path d="M 1870 1015 A 15 15 0 0 1 1855 1030" strokeWidth={2} />
  </g>
);

interface PlayerDotProps {
  cx: number; cy: number; num: number;
  fillColor: string; strokeColor: string; textColor: string;
  scale: number;
}

const PlayerDot: React.FC<PlayerDotProps> = ({
  cx, cy, num, fillColor, strokeColor, textColor, scale,
}) => (
  <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
    <circle r={22} fill={fillColor} stroke={strokeColor} strokeWidth={3} />
    <text
      x={0} y={0}
      textAnchor="middle" dominantBaseline="central"
      fill={textColor} fontSize={15} fontWeight="bold"
      fontFamily="Arial Black, Arial, sans-serif"
    >
      {num}
    </text>
  </g>
);

interface LabelPillProps {
  cx: number; cy: number; text: string; opacity: number;
}

const LabelPill: React.FC<LabelPillProps> = ({ cx, cy, text, opacity }) => {
  const approxW = text.length * 9.5 + 28;
  return (
    <g opacity={opacity}>
      <rect
        x={cx - approxW / 2} y={cy - 18}
        width={approxW} height={36}
        rx={9} ry={9} fill={LABEL_BG}
        stroke={WHITE} strokeWidth={1.5}
      />
      <text
        x={cx} y={cy}
        textAnchor="middle" dominantBaseline="central"
        fill={WHITE} fontSize={17} fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {text}
      </text>
    </g>
  );
};

interface DashedArrowProps {
  x1: number; y1: number; x2: number; y2: number;
  progress: number; frame: number;
}

const DashedArrow: React.FC<DashedArrowProps> = ({ x1, y1, x2, y2, progress, frame }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const totalLen = Math.sqrt(dx * dx + dy * dy);
  const visLen = totalLen * clamp(progress, 0, 1);
  const angle = Math.atan2(dy, dx);
  const arrowLen = 16;
  const spread = Math.PI / 6;
  const tipX = x1 + (dx / totalLen) * visLen;
  const tipY = y1 + (dy / totalLen) * visLen;
  const ah1x = tipX - arrowLen * Math.cos(angle - spread);
  const ah1y = tipY - arrowLen * Math.sin(angle - spread);
  const ah2x = tipX - arrowLen * Math.cos(angle + spread);
  const ah2y = tipY - arrowLen * Math.sin(angle + spread);
  const dashOffset = -(frame * 2) % 18;

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={tipX} y2={tipY}
        stroke={WHITE} strokeWidth={3.5}
        strokeDasharray="12 6" strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
      {progress > 0.05 && (
        <polyline
          points={`${ah1x},${ah1y} ${tipX},${tipY} ${ah2x},${ah2y}`}
          fill="none" stroke={WHITE} strokeWidth={3.5}
          strokeLinejoin="round" strokeLinecap="round"
        />
      )}
    </g>
  );
};

interface PulseRingProps { cx: number; cy: number; frame: number; opacity: number; }

const PulseRing: React.FC<PulseRingProps> = ({ cx, cy, frame, opacity }) => {
  const phase = (frame % 30) / 30;
  const radius = 38 + phase * 55;
  const ringOpacity = (1 - phase) * 0.85 * opacity;
  return (
    <circle
      cx={cx} cy={cy} r={radius}
      fill="none" stroke={`rgba(255,255,255,${ringOpacity})`}
      strokeWidth={3} strokeDasharray="14 7"
    />
  );
};

// End-card row for player assignment
interface AssignmentRowProps {
  y: number; number: number; role: string; action: string; opacity: number;
}

const AssignmentRow: React.FC<AssignmentRowProps> = ({ y, number, role, action, opacity }) => (
  <g opacity={opacity}>
    {/* Number circle */}
    <circle cx={660} cy={y} r={28} fill={WHITE} stroke={MAROON} strokeWidth={3} />
    <text
      x={660} y={y} textAnchor="middle" dominantBaseline="central"
      fill={MAROON} fontSize={20} fontWeight="900"
      fontFamily="Arial Black, Arial, sans-serif"
    >
      {number}
    </text>
    {/* Role label */}
    <text
      x={710} y={y - 12}
      textAnchor="start" dominantBaseline="auto"
      fill={MAROON} fontSize={22} fontWeight="900"
      fontFamily="Arial Black, Arial, sans-serif"
      letterSpacing={3}
    >
      {role}
    </text>
    {/* Action description */}
    <text
      x={710} y={y + 14}
      textAnchor="start" dominantBaseline="auto"
      fill={WHITE} fontSize={22}
      fontFamily="Arial, sans-serif"
    >
      {action}
    </text>
  </g>
);

export const SoccerTactical: React.FC = () => {
  const frame = useCurrentFrame();

  // ── TITLE (0-75) ──────────────────────────────────────────────
  const titleOpacity = interpolate(frame, [0, 15, 60, 75], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // ── PITCH FADE IN (75-135) ────────────────────────────────────
  const pitchOpacity = interpolate(frame, [75, 135], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // ── PLAYER SPRING-IN (offset per player, starts frame 90) ────
  const playerSpring = (offset: number) =>
    spring({ frame: frame - 90 - offset, fps: 30, config: { stiffness: 100, damping: 20 } });

  // ── RED 3 MOVEMENT ────────────────────────────────────────────
  let red3Nx = 0.79;
  let red3Ny = 0.12;
  if (frame >= 155 && frame < 285) {
    // First push high
    const t = lerp(frame, 155, 215, 0, 1);
    red3Nx = interpolate(t, [0, 1], [0.79, 0.50]);
    red3Ny = interpolate(t, [0, 1], [0.12, 0.09]);
  } else if (frame >= 285 && frame < 365) {
    // Reset
    const t = lerp(frame, 295, 355, 0, 1);
    red3Nx = interpolate(t, [0, 1], [0.50, 0.79]);
    red3Ny = interpolate(t, [0, 1], [0.09, 0.12]);
  } else if (frame >= 365) {
    // Second push high (stays there)
    const t = lerp(frame, 365, 410, 0, 1);
    red3Nx = interpolate(t, [0, 1], [0.79, 0.50]);
    red3Ny = interpolate(t, [0, 1], [0.12, 0.09]);
  }

  // ── BALL ──────────────────────────────────────────────────────
  const blue6X = px(0.42);
  const blue6Y = py(0.50);
  const ballTargetX = px(0.74);
  const ballTargetY = py(0.10);
  const ballAppearScale = spring({ frame: frame - 360, fps: 30, config: { stiffness: 120, damping: 18 } });
  const ballFlyProgress = lerp(frame, 510, 565, 0, 1);
  const rawBallX = frame < 510 ? blue6X : interpolate(ballFlyProgress, [0, 1], [blue6X, ballTargetX]);
  const rawBallY = frame < 510 ? blue6Y : interpolate(ballFlyProgress, [0, 1], [blue6Y, ballTargetY]);
  const ballArcOffset = frame >= 510 && frame < 570 ? -Math.sin(ballFlyProgress * Math.PI) * 80 : 0;
  const ballX = rawBallX;
  const ballY = rawBallY + ballArcOffset;
  const showBall = frame >= 360;
  const ballScale = showBall ? clamp(ballAppearScale, 0, 1) : 0;

  // ── PULSE RING (420-540) ──────────────────────────────────────
  const pulseOpacity = interpolate(frame, [420, 435, 525, 540], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // ── BLUE 2 RUN (450-540) ─────────────────────────────────────
  const blue2t = lerp(frame, 450, 535, 0, 1);
  const blue2Nx = frame < 450 ? 0.21 : interpolate(blue2t, [0, 1], [0.21, 0.76]);
  const blue2Ny = frame < 450 ? 0.12 : interpolate(blue2t, [0, 1], [0.12, 0.09]);
  const blue2Arrow = frame < 450 ? 0 : lerp(frame, 450, 540, 0, 1);

  // ── BLUE 9 RUN (455-540) ─────────────────────────────────────
  const blue9t = lerp(frame, 455, 535, 0, 1);
  const blue9Nx = frame < 455 ? 0.56 : interpolate(blue9t, [0, 1], [0.56, 0.72]);
  const blue9Ny = frame < 455 ? 0.36 : interpolate(blue9t, [0, 1], [0.36, 0.20]);
  const blue9Arrow = frame < 455 ? 0 : lerp(frame, 455, 540, 0, 1);

  // ── LABELS ───────────────────────────────────────────────────
  const habitLabelOpacity = interpolate(frame, [225, 240, 265, 285], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  // "2v1 in behind" — extended hold through 650
  const label2v1Opacity = interpolate(frame, [570, 585, 640, 650], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // ── END OVERLAY (640-660 fade in) ────────────────────────────
  const endOverlayOpacity = interpolate(frame, [640, 665], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // ── END CARD ELEMENTS (staggered) ────────────────────────────
  const fade = (a: number, b: number) =>
    interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const headlineOpacity   = fade(665, 685);
  const row1Opacity       = fade(685, 705);
  const row2Opacity       = fade(700, 720);
  const row3Opacity       = fade(715, 735);
  const triggerOpacity    = fade(740, 760);

  // ── PLAYER ARRAYS ────────────────────────────────────────────
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

      {/* ── PITCH + ANIMATION ── */}
      <AbsoluteFill style={{ opacity: pitchOpacity }}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080"
          style={{ position: "absolute", top: 0, left: 0 }}>

          {/* Pitch surface */}
          <rect x={PITCH_LEFT} y={PITCH_TOP} width={PITCH_W} height={PITCH_H} fill={PITCH_GREEN} />
          {/* Subtle alternating stripes */}
          {Array.from({ length: 10 }).map((_, i) => (
            <rect key={i}
              x={PITCH_LEFT + (i * PITCH_W) / 10} y={PITCH_TOP}
              width={PITCH_W / 10} height={PITCH_H}
              fill={i % 2 === 0 ? "rgba(0,0,0,0.06)" : "transparent"}
            />
          ))}

          <PitchMarkings />

          {/* Pulse ring on open space */}
          {pulseOpacity > 0 && (
            <>
              <PulseRing cx={px(0.68)} cy={py(0.10)} frame={frame} opacity={pulseOpacity} />
              <PulseRing cx={px(0.68)} cy={py(0.10)} frame={(frame + 15) % 30} opacity={pulseOpacity * 0.45} />
            </>
          )}

          {/* Run arrows — behind players */}
          {blue2Arrow > 0 && (
            <DashedArrow
              x1={px(0.21)} y1={py(0.12)}
              x2={px(0.76)} y2={py(0.09)}
              progress={blue2Arrow} frame={frame}
            />
          )}
          {blue9Arrow > 0 && (
            <DashedArrow
              x1={px(0.56)} y1={py(0.36)}
              x2={px(0.72)} y2={py(0.20)}
              progress={blue9Arrow} frame={frame}
            />
          )}

          {/* Opposition (maroon) */}
          {redPositions.map((p, i) => (
            <PlayerDot
              key={`red-${p.num}`}
              cx={px(p.nx)} cy={py(p.ny)} num={p.num}
              fillColor={MAROON} strokeColor={WHITE} textColor={WHITE}
              scale={clamp(playerSpring(i * 4), 0, 1.2)}
            />
          ))}

          {/* Our team (white) */}
          {bluePositions.map((p, i) => (
            <PlayerDot
              key={`blue-${p.num}`}
              cx={px(p.nx)} cy={py(p.ny)} num={p.num}
              fillColor={WHITE} strokeColor={MAROON} textColor={MAROON}
              scale={clamp(playerSpring(i * 4 + 2), 0, 1.2)}
            />
          ))}

          {/* Ball */}
          {showBall && (
            <g transform={`translate(${ballX}, ${ballY}) scale(${ballScale})`}>
              <circle r={11} fill={WHITE} stroke="#333" strokeWidth={2} />
              <path d="M -7 -4 Q 0 0 -7 4" fill="none" stroke="#bbb" strokeWidth={1.5} />
              <path d="M  7 -4 Q 0 0  7 4" fill="none" stroke="#bbb" strokeWidth={1.5} />
            </g>
          )}

          {/* "Happens most of the game" */}
          {habitLabelOpacity > 0 && (
            <LabelPill cx={px(0.52)} cy={py(0.03)} text="Happens most of the game" opacity={habitLabelOpacity} />
          )}

          {/* "2v1 in behind" */}
          {label2v1Opacity > 0 && (
            <LabelPill cx={px(0.78)} cy={py(0.05)} text="2v1 in behind" opacity={label2v1Opacity} />
          )}

          {/* Formation labels */}
          {frame >= 135 && pitchOpacity > 0.5 && (
            <>
              <text x={px(0.25)} y={PITCH_TOP - 12} textAnchor="middle"
                fill={WHITE} fontSize={22} fontWeight="bold"
                fontFamily="Arial, sans-serif">
                US — 5-3-2
              </text>
              <text x={px(0.75)} y={PITCH_TOP - 12} textAnchor="middle"
                fill={MAROON} fontSize={22} fontWeight="bold"
                fontFamily="Arial, sans-serif">
                THEM — 4-4-2
              </text>
            </>
          )}
        </svg>
      </AbsoluteFill>

      {/* ── END CARD OVERLAY ── */}
      {endOverlayOpacity > 0 && (
        <AbsoluteFill style={{ background: `rgba(10,10,10,${endOverlayOpacity * 0.94})` }}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080"
            style={{ position: "absolute", top: 0, left: 0 }}>

            {/* Maroon accent bar left edge */}
            <rect x={560} y={160} width={8} height={760} fill={MAROON} rx={4} />

            {/* "YOUR ASSIGNMENT" headline */}
            <g opacity={headlineOpacity}>
              <text x={620} y={250}
                textAnchor="start" dominantBaseline="central"
                fill={WHITE} fontSize={52} fontWeight="900"
                fontFamily="Arial Black, Arial, sans-serif"
                letterSpacing={6}
              >
                YOUR ASSIGNMENT
              </text>
              {/* underline */}
              <line x1={620} y1={278} x2={1360} y2={278} stroke={MAROON} strokeWidth={3} />
            </g>

            {/* Player rows */}
            <AssignmentRow y={360} number={2}  role="WINGBACK" action="Run the channel early"      opacity={row1Opacity} />
            <AssignmentRow y={470} number={9}  role="STRIKER"  action="Get in behind"              opacity={row2Opacity} />
            <AssignmentRow y={580} number={6}  role="SIX"      action="Play the through ball on time" opacity={row3Opacity} />

            {/* Divider */}
            <line x1={620} y1={650} x2={1360} y2={650} stroke={`rgba(139,0,0,${triggerOpacity})`} strokeWidth={2} />

            {/* Trigger line */}
            <g opacity={triggerOpacity}>
              <text x={620} y={700}
                textAnchor="start" dominantBaseline="central"
                fill={`rgba(255,255,255,0.7)`} fontSize={28}
                fontFamily="Arial, sans-serif"
              >
                Trigger:
              </text>
              <text x={730} y={700}
                textAnchor="start" dominantBaseline="central"
                fill={WHITE} fontSize={28} fontWeight="bold"
                fontFamily="Arial, sans-serif"
              >
                their left back steps up.
              </text>

              <text x={620} y={760}
                textAnchor="start" dominantBaseline="central"
                fill={WHITE} fontSize={38} fontWeight="900"
                fontFamily="Arial Black, Arial, sans-serif"
              >
                Know your job. Execute it.
              </text>
            </g>

          </svg>
        </AbsoluteFill>
      )}

    </AbsoluteFill>
  );
};
