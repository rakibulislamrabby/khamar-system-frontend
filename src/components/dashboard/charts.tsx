import { Fragment, useId, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { compact } from '@/components/dashboard/format';
import { C, FONT } from '@/components/dashboard/theme';

function useWidth(initial = 600) {
  const [w, setW] = useState(initial);
  const onLayout = (e: { nativeEvent: { layout: { width: number } } }) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next > 0 && next !== w) setW(next);
  };
  return { w, onLayout };
}

function niceMax(v: number) {
  if (v <= 0) return 1000;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 1.2 ? 1.2 : n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 3 ? 3 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 6 ? 6 : n <= 8 ? 8 : 10;
  return step * p;
}

export type PairPoint = { label: string; a: number; b: number };

/** Grouped income (padma) vs expense (coral) bars with a y-axis, like Figma W03 / W08. */
export function PairBarChart({ data, height = 230, colors = [C.padma, '#F4A79C'] }: { data: PairPoint[]; height?: number; colors?: [string, string] }) {
  const { w, onLayout } = useWidth();
  const axisW = 40;
  const labelH = 24;
  const plotH = height - labelH;
  const plotW = Math.max(100, w - axisW);
  const max = niceMax(Math.max(...data.flatMap((d) => [d.a, d.b]), 0));
  const gw = plotW / Math.max(1, data.length);
  const bw = Math.max(6, Math.min(22, gw / 3.2));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <View onLayout={onLayout} style={{ width: '100%', height }}>
      <Svg width={w} height={height}>
        {ticks.map((t) => {
          const y = plotH - t * (plotH - 8);
          return (
            <Fragment key={t}>
              <Line x1={axisW} x2={w} y1={y} y2={y} stroke={C.line} strokeDasharray={t === 0 ? undefined : '4 6'} />
              <SvgText x={0} y={y + 4} fontSize={11} fill={C.faint} fontFamily={FONT}>
                {compact(max * t)}
              </SvgText>
            </Fragment>
          );
        })}
        {data.map((d, i) => {
          const cx = axisW + i * gw + gw / 2;
          const ha = (d.a / max) * (plotH - 8);
          const hb = (d.b / max) * (plotH - 8);
          return (
            <Fragment key={`${d.label}-${i}`}>
              <Rect x={cx - bw - 2} y={plotH - ha} width={bw} height={Math.max(0, ha)} rx={Math.min(5, bw / 2)} fill={colors[0]} />
              <Rect x={cx + 2} y={plotH - hb} width={bw} height={Math.max(0, hb)} rx={Math.min(5, bw / 2)} fill={colors[1]} />
              <SvgText x={cx} y={height - 6} fontSize={11} fill={C.faint} fontFamily={FONT} textAnchor="middle">
                {d.label}
              </SvgText>
            </Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

/** Single-series bars; the highlighted index is drawn solid (Figma W05 daily mortality style). */
export function BarChart({
  data,
  height = 150,
  color = C.coral,
  muted = C.coralSoft,
  highlight,
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
  muted?: string;
  highlight?: number;
}) {
  const { w, onLayout } = useWidth();
  const labelH = 22;
  const plotH = height - labelH;
  const max = Math.max(1, ...data.map((d) => d.value));
  const gw = w / Math.max(1, data.length);
  const bw = Math.max(8, Math.min(40, gw * 0.62));
  const hi = highlight ?? data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  return (
    <View onLayout={onLayout} style={{ width: '100%', height }}>
      <Svg width={w} height={height}>
        {data.map((d, i) => {
          const cx = i * gw + gw / 2;
          const h = d.value > 0 ? Math.max(6, (d.value / max) * (plotH - 4)) : 4;
          return (
            <Fragment key={`${d.label}-${i}`}>
              <Rect x={cx - bw / 2} y={plotH - h} width={bw} height={h} rx={6} fill={i === hi && d.value > 0 ? color : muted} />
              <SvgText x={cx} y={height - 5} fontSize={10.5} fill={C.faint} fontFamily={FONT} textAnchor="middle">
                {d.label}
              </SvgText>
            </Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

/** Tiny 7-bar trend that sits next to KPI values. */
export function SparkBars({ vals, color, muted, w = 64, h = 34 }: { vals: number[]; color: string; muted: string; w?: number; h?: number }) {
  const max = Math.max(1, ...vals);
  const bw = 4;
  const gap = (w - bw * vals.length) / Math.max(1, vals.length - 1);
  return (
    <Svg width={w} height={h}>
      {vals.map((v, i) => {
        const bh = Math.max(4, (v / max) * h);
        return <Rect key={i} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx={2} fill={i === vals.length - 1 ? color : muted} />;
      })}
    </Svg>
  );
}

function smoothPath(pts: number[], w: number, h: number, pad = 4) {
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const step = w / Math.max(1, pts.length - 1);
  const xy = pts.map((p, i) => [i * step, h - pad - ((p - min) / (max - min || 1)) * (h - pad * 2)] as const);
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1];
    const [x1, y1] = xy[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

export function AreaSpark({ pts, stroke, h = 40, fill = true }: { pts: number[]; stroke: string; h?: number; fill?: boolean }) {
  const { w, onLayout } = useWidth(200);
  const id = useId().replace(/:/g, '');
  const safe = pts.length > 1 ? pts : [0, 0];
  const d = smoothPath(safe, w, h);
  return (
    <View onLayout={onLayout} style={{ width: '100%', height: h }}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stroke} stopOpacity="0.32" />
            <Stop offset="1" stopColor={stroke} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {fill ? <Path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} /> : null}
        <Path d={d} stroke={stroke} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export function Ring({ size, pct, color, track, sw = 8, children }: { size: number; pct: number; color: string; track: string; sw?: number; children?: React.ReactNode }) {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={sw} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * v) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function Donut({ size, segs, sw = 18, children }: { size: number; segs: Array<{ p: number; color: string }>; sw?: number; children?: React.ReactNode }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  let off = 0;
  const total = segs.reduce((s, x) => s + x.p, 0) || 1;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#EEF2EF" strokeWidth={sw} fill="none" />
        {segs.map((seg, i) => {
          const len = (circ * seg.p) / total;
          const dash = `${Math.max(0, len - (segs.length > 1 ? 3 : 0))} ${circ}`;
          const el = (
            <Circle
              key={`${seg.color}-${i}`}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={seg.color}
              strokeWidth={sw}
              fill="none"
              strokeDasharray={dash}
              strokeDashoffset={-off}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          off += len;
          return el;
        })}
      </Svg>
      {children}
    </View>
  );
}

/** Thin sparkline for table rows (dairy 7-day milk trend). */
export function TrendLine({ pts, color = C.sky, w = 80, h = 26 }: { pts: number[]; color?: string; w?: number; h?: number }) {
  const id = useId().replace(/:/g, '');
  if (pts.length < 2 || pts.every((p) => p === 0)) {
    return (
      <Svg width={w} height={h}>
        <Line x1={0} x2={w} y1={h / 2} y2={h / 2} stroke={C.line} strokeDasharray="3 4" />
      </Svg>
    );
  }
  const d = smoothPath(pts, w, h, 3);
  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.28" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <Path d={d} stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}
