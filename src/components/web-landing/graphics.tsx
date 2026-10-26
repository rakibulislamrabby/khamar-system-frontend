import { Fragment, useId, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { C } from '@/components/web-landing/theme';

const PATHS: Record<string, string[]> = {
  home: ['M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  bird: [
    'M16 7h.01',
    'M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20',
    'm20 7 2 .5-2 .5',
    'M10 18v3',
    'M14 17.75V21',
    'M7 18a6 6 0 0 0 3.84-10.61',
  ],
  cash: ['M2 6h20v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z', 'M9.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0', 'M6 12h.01M18 12h.01'],
  receipt: ['M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z', 'M8 8h8M8 12h8M8 16h5'],
  grid: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'],
  plus: ['M12 5v14M5 12h14'],
  right: ['m9 18 6-6-6-6'],
  left: ['m15 18-6-6 6-6'],
  down: ['m6 9 6 6 6-6'],
  egg: ['M12 22c4.4 0 7-3 7-7.5C19 9 15.9 2 12 2S5 9 5 14.5C5 19 7.6 22 12 22z'],
  box: ['M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'm3.3 7 8.7 5 8.7-5', 'M12 22V12'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M5 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0', 'M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'],
  barn: ['M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z', 'M6 18h12M6 14h12', 'M6 22V10h12v12'],
  wheat: ['M2 22 16 8', 'M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z', 'M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z', 'M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z', 'M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z'],
  alert: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4M12 17h.01'],
  cal: ['M3 4h18v18H3z', 'M16 2v4M8 2v4M3 10h18'],
  lock: ['M3 11h18v11H3z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  pin: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', 'M9 10a3 3 0 1 0 6 0 3 3 0 0 0-6 0'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
  globe: ['M2 12a10 10 0 1 0 20 0 10 10 0 0 0-20 0', 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20'],
  check: ['M20 6 9 17l-5-5'],
  up: ['m22 7-8.5 8.5-5-5L2 17', 'M16 7h6v6'],
  shield: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'],
  leaf: ['M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z', 'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'],
  milk: ['M8 2h8M9 2v2.79a4 4 0 0 1-.67 2.22l-.66.99A4 4 0 0 0 7 10.22V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.78a4 4 0 0 0-.67-2.22l-.66-.99A4 4 0 0 1 15 4.79V2', 'M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0'],
  file: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8'],
  bolt: ['M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z'],
  user: ['M7 8a5 5 0 1 0 10 0 5 5 0 0 0-10 0', 'M20 21a8 8 0 0 0-16 0'],
  android: ['M5 16V9h14v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z', 'M8 18v3M16 18v3M3 10v5M21 10v5M7.5 4.5 9 7M16.5 4.5 15 7', 'M5 9a7 7 0 0 1 14 0'],
  phone: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z'],
  mail: ['M2 4h20v16H2z', 'm22 7-10 5L2 7'],
  cloud: ['M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'],
  x: ['M18 6 6 18M6 6l12 12'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
};

export function Icon({ name, size = 20, color = C.ink, sw = 2 }: { name: string; size?: number; color?: string; sw?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {(PATHS[name] ?? []).map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}

export function LogoMark({ size = 42 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="leaf" size={size * 0.52} color={C.forest} sw={2.4} />
    </View>
  );
}

export function Chip({ name, bg, fg, size = 44 }: { name: string; bg: string; fg: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={size * 0.46} color={fg} />
    </View>
  );
}

export function Avatar({ initials, bg, fg, size = 38 }: { initials: string; bg: string; fg: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: Math.round(size * 0.34), fontWeight: '700', color: fg }}>{initials}</Text>
    </View>
  );
}

function smooth(pts: number[], w: number, h: number) {
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const step = w / (pts.length - 1);
  const xy = pts.map((p, i) => [i * step, h - 6 - ((p - min) / (max - min || 1)) * (h - 14)] as const);
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1];
    const [x1, y1] = xy[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

export function Area({ w, h, pts, stroke, sw = 2.5 }: { w: number; h: number; pts: number[]; stroke: string; sw?: number }) {
  const id = useId().replace(/:/g, '');
  const d = smooth(pts, w, h);
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={stroke} stopOpacity="0.35" />
          <Stop offset="1" stopColor={stroke} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <Path d={d} stroke={stroke} strokeWidth={sw} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function Bars({ w, h, vals, color, muted }: { w: number; h: number; vals: number[]; color: string; muted: string }) {
  const gap = 4;
  const bw = (w - gap * (vals.length - 1)) / vals.length;
  const max = Math.max(...vals);
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {vals.map((v, i) => {
        const bh = Math.max(4, (v / max) * h);
        return <Rect key={i} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx={Math.min(4, bw / 2)} fill={i === vals.length - 1 ? color : muted} />;
      })}
    </Svg>
  );
}

export function PairBars({ w, h, pairs }: { w: number; h: number; pairs: [number, number][] }) {
  const gw = w / pairs.length;
  const bw = Math.min(14, gw / 3.4);
  const max = Math.max(...pairs.flat());
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <Line key={g} x1={0} x2={w} y1={h - g * h} y2={h - g * h} stroke={C.line} strokeDasharray="4 6" />
      ))}
      {pairs.map(([x, y], i) => {
        const cx = i * gw + gw / 2;
        const hx = (x / max) * (h - 4);
        const hy = (y / max) * (h - 4);
        return (
          <Fragment key={i}>
            <Rect x={cx - bw - 2} y={h - hx} width={bw} height={hx} rx={4} fill={C.padma} />
            <Rect x={cx + 2} y={h - hy} width={bw} height={hy} rx={4} fill="#F4A79C" />
          </Fragment>
        );
      })}
    </Svg>
  );
}

export function Ring({ size, pct, color, track, sw = 8 }: { size: number; pct: number; color: string; track: string; sw?: number }) {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={sw} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

export function Donut({ size, segs, sw = 16 }: { size: number; segs: { p: number; color: string }[]; sw?: number }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  let off = 0;
  const arcs = segs.map((seg) => {
    const len = (circ * seg.p) / 100;
    const item = { ...seg, dash: `${Math.max(0, len - 3)} ${circ}`, offset: -off };
    off += len;
    return item;
  });
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((seg) => (
        <Circle
          key={seg.color}
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={seg.color}
          strokeWidth={sw}
          fill="none"
          strokeDasharray={seg.dash}
          strokeDashoffset={seg.offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ))}
    </Svg>
  );
}

export function Track({ pct, color, track, h = 7 }: { pct: number; color: string; track: string; h?: number }) {
  return (
    <View style={{ height: h, borderRadius: h, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: h, borderRadius: h, backgroundColor: color }} />
    </View>
  );
}

export function Glow({ w, h, color, op = 0.3 }: { w: number; h: number; color: string; op?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={op} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

export function Wave({ fill, height = 72 }: { fill: string; height?: number }) {
  const d = `M0,34 C220,8 460,${height - 8} 720,36 C980,8 1220,${height - 10} 1440,32 L1440,${height} L0,${height} Z`;
  return (
    <View style={{ width: '100%', height, marginBottom: -1, overflow: 'hidden' }}>
      <Svg width="100%" height={height} viewBox={`0 0 1440 ${height}`} preserveAspectRatio="none">
        <Path d={d} fill={fill} />
      </Svg>
    </View>
  );
}

export function Stars({ count = 5, size = 16 }: { count?: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {Array.from({ length: count }, (_, i) => (
        <Svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" fill={C.gold} />
        </Svg>
      ))}
    </View>
  );
}

export function Qr({ size = 140, color = C.forest }: { size?: number; color?: string }) {
  const n = 25;
  const cell = size / n;
  let seed = 11;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const finder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  const dots: { x: number; y: number }[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && rnd() > 0.52) dots.push({ x, y });
  const finderBox = (x: number, y: number) => (
    <Fragment key={`${x}-${y}`}>
      <Rect x={x * cell} y={y * cell} width={7 * cell} height={7 * cell} rx={cell * 1.4} fill={color} />
      <Rect x={(x + 1) * cell} y={(y + 1) * cell} width={5 * cell} height={5 * cell} rx={cell} fill="#fff" />
      <Rect x={(x + 2) * cell} y={(y + 2) * cell} width={3 * cell} height={3 * cell} rx={cell * 0.6} fill={color} />
    </Fragment>
  );
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {dots.map((d) => (
        <Rect key={`${d.x}-${d.y}`} x={d.x * cell} y={d.y * cell} width={cell} height={cell} rx={cell * 0.25} fill={color} />
      ))}
      {finderBox(0, 0)}
      {finderBox(n - 7, 0)}
      {finderBox(0, n - 7)}
    </Svg>
  );
}

export function PhoneFrame({ width, height, children, bg = C.canvas }: { width: number; height: number; children: ReactNode; bg?: string }) {
  const r = Math.round(width * 0.16);
  return (
    <View style={{ width, height, borderRadius: r, backgroundColor: '#0A1310', padding: 8, boxShadow: '0 30px 70px rgba(4,20,14,0.4)' }}>
      <View style={{ flex: 1, borderRadius: r - 7, backgroundColor: bg, overflow: 'hidden' }}>
        {children}
        <View pointerEvents="none" style={{ position: 'absolute', top: 8, alignSelf: 'center', width: width * 0.3, height: 18, borderRadius: 9, backgroundColor: '#0A1310' }} />
      </View>
    </View>
  );
}

export function Contours({ w, h }: { w: number; h: number }) {
  const lines = Array.from({ length: 8 }, (_, i) => {
    const y = 16 + i * (h / 8);
    return `M-20 ${y} C ${w * 0.25} ${y - 36 + i * 4}, ${w * 0.5} ${y + 42 - i * 3}, ${w * 0.75} ${y - 8} S ${w + 40} ${y + 24}, ${w + 40} ${y + 8}`;
  });
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {lines.map((d) => (
        <Path key={d} d={d} stroke={C.lime} strokeOpacity={0.08} strokeWidth={1.4} fill="none" />
      ))}
    </Svg>
  );
}
