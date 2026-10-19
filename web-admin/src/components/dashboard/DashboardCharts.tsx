'use client';

import React, { useRef, useState } from 'react';
import { SectionSummary } from '@/lib/types';

export const CHART_COLORS = {
  present: '#16A34A',
  absent: '#FDA4AF',
  notMarked: '#CBD5E1',
  accent: '#635BFF',
  track: '#EEF2F8',
};

type TooltipRow = { label: string; value: string; color?: string };
type TooltipState = { x: number; y: number; width: number; title: string; rows: TooltipRow[] };

function useChartTooltip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TooltipState | null>(null);

  const show = (e: React.MouseEvent, title: string, rows: TooltipRow[]) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    setTip({ x: e.clientX - box.left, y: e.clientY - box.top, width: box.width, title, rows });
  };
  const hide = () => setTip(null);

  return { containerRef, tip, show, hide };
}

function ChartTooltip({ tip }: { tip: TooltipState | null }) {
  if (!tip) return null;
  const flip = tip.x > tip.width - 200;
  return (
    <div
      className="pointer-events-none absolute z-20 w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs"
      style={{ left: flip ? tip.x - 196 : tip.x + 14, top: Math.max(tip.y - 12, 0) }}
    >
      <div className="font-semibold text-slate-900 mb-1 truncate">{tip.title}</div>
      {tip.rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-3 text-slate-600">
          <span className="flex items-center gap-1.5">
            {row.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />}
            {row.label}
          </span>
          <span className="font-semibold text-slate-900 tabular-nums">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Round a positive number up to a 1/2/5 x 10^n step so the axis reads cleanly. */
function niceMax(value: number) {
  if (value <= 0) return 10;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
}

export function sectionTitle(s: SectionSummary) {
  return `${s.class_name} · Sec ${s.section_name}`;
}

function shortSectionLabel(s: SectionSummary) {
  return `${s.class_name.replace(/^Grade\s*/i, 'G')}-${s.section_name}`;
}

/**
 * Stacked vertical bars: present (green) and absent (light red) per section for today.
 * Sections whose attendance has not been marked show a dashed outline of their enrolment.
 */
export function AttendanceBarChart({ sections }: { sections: SectionSummary[] }) {
  const { containerRef, tip, show, hide } = useChartTooltip();
  const [active, setActive] = useState<number | null>(null);

  const n = sections.length;
  const maxStudents = Math.max(1, ...sections.map((s) => s.total_students || 0));
  const yMax = niceMax(maxStudents);
  const W = Math.max(480, n * 56 + 56);
  const H = 240;
  const padL = 40;
  const padR = 8;
  const padT = 12;
  const padB = 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slot = plotW / n;
  const barW = Math.min(34, slot * 0.6);
  const yBase = padT + plotH;
  const yFor = (v: number) => yBase - (v / yMax) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));

  return (
    <div ref={containerRef} className="relative">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto min-w-[480px]"
          role="img"
          aria-label="Present and absent students per section today"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={padL}
                x2={W - padR}
                y1={yFor(t)}
                y2={yFor(t)}
                stroke="#E2E8F0"
                strokeDasharray={t === 0 ? undefined : '3 3'}
              />
              <text x={padL - 8} y={yFor(t) + 4} textAnchor="end" fontSize={10} fill="#718096">
                {t}
              </text>
            </g>
          ))}

          {sections.map((s, i) => {
            const present = s.present_count || 0;
            const absent = s.absent_count || 0;
            const enrolled = s.total_students || 0;
            const marked = present + absent > 0;
            const cx = padL + slot * i + slot / 2;
            const x = cx - barW / 2;
            const presentH = (present / yMax) * plotH;
            const absentH = (absent / yMax) * plotH;
            const pct = enrolled ? Math.round((present / enrolled) * 100) : 0;
            const rows: TooltipRow[] = [
              { label: 'Present', value: `${present}`, color: CHART_COLORS.present },
              { label: 'Absent', value: `${absent}`, color: CHART_COLORS.absent },
              { label: 'Attendance', value: marked ? `${pct}%` : 'Not marked' },
            ];
            const dimmed = active !== null && active !== i;

            return (
              <g
                key={`${s.class_id}_${s.section_id}`}
                opacity={dimmed ? 0.45 : 1}
                style={{ transition: 'opacity 150ms' }}
              >
                {!marked && enrolled > 0 && (
                  <rect
                    x={x}
                    y={yFor(enrolled)}
                    width={barW}
                    height={(enrolled / yMax) * plotH}
                    rx={4}
                    fill="none"
                    stroke={CHART_COLORS.notMarked}
                    strokeDasharray="4 3"
                  />
                )}
                {presentH > 0 && (
                  <rect x={x} y={yBase - presentH} width={barW} height={presentH} rx={4} fill={CHART_COLORS.present} />
                )}
                {absentH > 0 && (
                  <rect
                    x={x}
                    y={yBase - presentH - absentH}
                    width={barW}
                    height={absentH}
                    rx={4}
                    fill={CHART_COLORS.absent}
                  />
                )}
                <text x={cx} y={yBase + 16} textAnchor="middle" fontSize={11} fill="#718096">
                  {shortSectionLabel(s)}
                </text>
                <rect
                  x={padL + slot * i}
                  y={padT}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={(e) => {
                    setActive(i);
                    show(e, sectionTitle(s), rows);
                  }}
                  onMouseMove={(e) => show(e, sectionTitle(s), rows)}
                  onMouseLeave={() => {
                    setActive(null);
                    hide();
                  }}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <ChartTooltip tip={tip} />
    </div>
  );
}

export type DonutSlice = { label: string; value: number; color: string };

/** Donut chart over real counts. The centre shows the caller's headline value. */
export function DonutChart({
  slices,
  centerValue,
  centerLabel,
}: {
  slices: DonutSlice[];
  centerValue: string;
  centerLabel: string;
}) {
  const { containerRef, tip, show, hide } = useChartTooltip();
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const R = 70;
  const STROKE = 20;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div ref={containerRef} className="relative flex justify-center">
      <svg viewBox="0 0 200 200" className="w-48 h-48" role="img" aria-label={`${centerLabel}: ${centerValue}`}>
        <circle cx={100} cy={100} r={R} fill="none" stroke={CHART_COLORS.track} strokeWidth={STROKE} />
        {total > 0 &&
          slices.map((s) => {
            const len = (s.value / total) * C;
            const pct = Math.round((s.value / total) * 100);
            const el = (
              <circle
                key={s.label}
                cx={100}
                cy={100}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 100 100)"
                onMouseMove={(e) =>
                  show(e, s.label, [{ label: 'Students', value: `${s.value} (${pct}%)`, color: s.color }])
                }
                onMouseLeave={hide}
                style={{ cursor: 'default' }}
              />
            );
            offset += len;
            return el;
          })}
        <text x={100} y={98} textAnchor="middle" fontSize={26} fontWeight={700} fill="#17233D">
          {centerValue}
        </text>
        <text x={100} y={118} textAnchor="middle" fontSize={11} fill="#718096">
          {centerLabel}
        </text>
      </svg>
      <ChartTooltip tip={tip} />
    </div>
  );
}

/** Horizontal bars of enrolment per section. Bars are relative to the largest section. */
export function EnrollmentBars({ sections }: { sections: SectionSummary[] }) {
  const { containerRef, tip, show, hide } = useChartTooltip();
  const max = Math.max(1, ...sections.map((s) => s.total_students || 0));

  return (
    <div ref={containerRef} className="relative">
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {sections.map((s) => {
          const value = s.total_students || 0;
          return (
            <div
              key={`${s.class_id}_${s.section_id}`}
              className="group"
              onMouseMove={(e) =>
                show(e, sectionTitle(s), [{ label: 'Enrolled', value: `${value} students`, color: CHART_COLORS.accent }])
              }
              onMouseLeave={hide}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                <span className="truncate">{sectionTitle(s)}</span>
                <span className="font-semibold text-slate-900 tabular-nums ml-2">{value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 group-hover:bg-indigo-600 transition-all duration-500"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <ChartTooltip tip={tip} />
    </div>
  );
}
