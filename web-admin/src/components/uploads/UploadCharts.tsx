'use client';

import React, { useState } from 'react';
import { ChartTooltip, niceMax, useChartTooltip } from '@/components/dashboard/DashboardCharts';

export type ColumnItem = {
  label: string;
  value: number;
  color: string;
  /** Name shown in the tooltip title. Defaults to the label. */
  tooltip?: string;
  /** Text shown above the column. Defaults to the raw value. */
  valueLabel?: string;
  /** Extra tooltip rows. Defaults to a single row with the value. */
  rows?: { label: string; value: string; color?: string }[];
};

type ColumnChartProps = {
  items: ColumnItem[];
  height?: number;
  /** Tooltip row label used when an item has no custom rows. */
  unitLabel?: string;
  /**
   * When true (default) the chart scales to its card width. When false it keeps its
   * natural width, is centred, and scrolls horizontally only if the columns don't fit.
   */
  fluid?: boolean;
  /** Smallest natural width in SVG units. */
  minWidth?: number;
};

/**
 * Vertical column chart over real values. Zero-value columns still show their label
 * so the axis matches the category list. Hover shows a tooltip and dims the other columns.
 */
export function ColumnChart({
  items,
  height = 220,
  unitLabel = 'Resources',
  fluid = true,
  minWidth = 360,
}: ColumnChartProps) {
  const { containerRef, tip, show, hide } = useChartTooltip();
  const [active, setActive] = useState<number | null>(null);

  const n = items.length;
  const max = niceMax(Math.max(1, ...items.map((i) => i.value)));
  const W = Math.max(minWidth, n * 72 + 40);
  const H = height;
  const padL = 36;
  const padR = 8;
  const padT = 14;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slot = plotW / n;
  const barW = Math.min(44, slot * 0.56);
  const yBase = padT + plotH;
  const yFor = (v: number) => yBase - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  const svgClass = fluid ? 'w-full h-auto min-w-[360px]' : 'block mx-auto h-auto';
  const svgStyle = fluid ? undefined : { width: W };

  return (
    <div ref={containerRef} className="relative">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={svgClass}
          style={svgStyle}
          role="img"
          aria-label="Chart"
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

          {items.map((item, i) => {
            const cx = padL + slot * i + slot / 2;
            const x = cx - barW / 2;
            const h = (item.value / max) * plotH;
            const dimmed = active !== null && active !== i;
            const title = item.tooltip ?? item.label;
            const rows = item.rows ?? [{ label: unitLabel, value: `${item.value}`, color: item.color }];

            return (
              <g key={`${item.label}_${i}`} opacity={dimmed ? 0.45 : 1} style={{ transition: 'opacity 150ms' }}>
                {h > 0 && <rect x={x} y={yBase - h} width={barW} height={h} rx={6} fill={item.color} />}
                <text x={cx} y={yBase - h - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#17233D">
                  {item.valueLabel ?? item.value}
                </text>
                <text x={cx} y={yBase + 16} textAnchor="middle" fontSize={11} fill="#718096">
                  {item.label}
                </text>
                <rect
                  x={padL + slot * i}
                  y={padT}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={(e) => {
                    setActive(i);
                    show(e, title, rows);
                  }}
                  onMouseMove={(e) => show(e, title, rows)}
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
