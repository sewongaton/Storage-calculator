import React, { useState } from 'react';
import { YearlyProjection } from '../../types/calculator';

interface ForecastChartProps {
  projections: YearlyProjection[];
  entitlementGb: number;
  targetBufferPercent: number;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  projections,
  entitlementGb,
  targetBufferPercent,
}) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  if (!projections || projections.length === 0) {
    return <div className="p-8 text-center text-slate-400">No projection data available.</div>;
  }

  // Calculate scaling
  const maxYearGb = Math.max(...projections.map((p) => p.totalGrossGb));
  const chartMax = Math.max(entitlementGb * 1.15, maxYearGb * 1.15);

  const chartHeight = 260;
  const chartWidth = 720;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 45;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const barWidth = Math.min(52, innerWidth / projections.length - 16);
  const stepX = innerWidth / projections.length;

  const getY = (valGb: number) => {
    return paddingTop + innerHeight - (valGb / chartMax) * innerHeight;
  };

  const entitlementY = getY(entitlementGb);
  const warningThresholdGb = entitlementGb * (1 - targetBufferPercent / 100);
  const warningY = getY(warningThresholdGb);

  const hoveredData = hoveredYear !== null ? projections.find((p) => p.year === hoveredYear) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Multi-Year Storage Growth Trajectory & Entitlement Threshold
          </h3>
          <p className="text-xs text-slate-500">
            Stacked gross storage consumption across Database, Audit logs, Attachments, and Non-PROD
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
            <span>Database</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-500" />
            <span>Audit / Journals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
            <span>Attachments</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" />
            <span>Non-PROD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500" />
            <span className="text-rose-600 font-medium">Entitlement</span>
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[580px] select-none"
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const val = chartMax * ratio;
            const y = getY(val);
            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono tabular-nums"
                >
                  {Math.round(val).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Warning Buffer Line (80%) */}
          <line
            x1={paddingLeft}
            y1={warningY}
            x2={chartWidth - paddingRight}
            y2={warningY}
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.7"
          />

          {/* Entitlement Line */}
          <line
            x1={paddingLeft}
            y1={entitlementY}
            x2={chartWidth - paddingRight}
            y2={entitlementY}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text
            x={chartWidth - paddingRight}
            y={entitlementY - 6}
            textAnchor="end"
            className="text-[10px] font-semibold fill-rose-600 font-mono"
          >
            Entitlement: {entitlementGb.toLocaleString()} GB
          </text>

          {/* Stacked Bars */}
          {projections.map((p, idx) => {
            const centerX = paddingLeft + idx * stepX + stepX / 2;
            const x = centerX - barWidth / 2;

            const dbHeight = (p.databaseGrossGb / chartMax) * innerHeight;
            const auditHeight = (p.auditGrossGb / chartMax) * innerHeight;
            const attHeight = (p.attachmentGrossGb / chartMax) * innerHeight;
            const npHeight = (p.nonProdTotalGb / chartMax) * innerHeight;

            let currentY = paddingTop + innerHeight;

            // Stack 1: DB
            currentY -= dbHeight;
            const dbY = currentY;

            // Stack 2: Audit
            currentY -= auditHeight;
            const auditY = currentY;

            // Stack 3: Attachments
            currentY -= attHeight;
            const attY = currentY;

            // Stack 4: Non-PROD
            currentY -= npHeight;
            const npY = currentY;

            const isHovered = hoveredYear === p.year;

            return (
              <g
                key={p.year}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredYear(p.year)}
                onMouseLeave={() => setHoveredYear(null)}
              >
                {/* Background highlight pill */}
                <rect
                  x={x - 6}
                  y={paddingTop}
                  width={barWidth + 12}
                  height={innerHeight}
                  fill={isHovered ? 'rgba(241, 245, 249, 0.8)' : 'transparent'}
                  rx="6"
                />

                {/* Stack segments */}
                <rect
                  x={x}
                  y={dbY}
                  width={barWidth}
                  height={Math.max(1, dbHeight)}
                  fill="#059669"
                  rx="2"
                />
                <rect
                  x={x}
                  y={auditY}
                  width={barWidth}
                  height={Math.max(1, auditHeight)}
                  fill="#14b8a6"
                  rx="2"
                />
                <rect
                  x={x}
                  y={attY}
                  width={barWidth}
                  height={Math.max(1, attHeight)}
                  fill="#f59e0b"
                  rx="2"
                />
                <rect
                  x={x}
                  y={npY}
                  width={barWidth}
                  height={Math.max(1, npHeight)}
                  fill="#6366f1"
                  rx="2"
                />

                {/* Year Label */}
                <text
                  x={centerX}
                  y={chartHeight - 16}
                  textAnchor="middle"
                  className={`text-xs font-mono font-medium ${
                    isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                  }`}
                >
                  Y{p.year}
                </text>

                {/* Total Value on Top */}
                <text
                  x={centerX}
                  y={npY - 6}
                  textAnchor="middle"
                  className={`text-[10px] font-mono tabular-nums ${
                    p.totalGrossGb > entitlementGb
                      ? 'fill-rose-600 font-semibold'
                      : 'fill-slate-600'
                  }`}
                >
                  {Math.round(p.totalGrossGb)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover inspection tooltip */}
        {hoveredData && (
          <div className="mt-3 p-3 bg-slate-900 text-white rounded-lg text-xs grid grid-cols-2 sm:grid-cols-5 gap-3 shadow-md animate-in fade-in duration-150">
            <div>
              <span className="text-slate-400 block text-[11px]">Selected Year</span>
              <span className="font-semibold text-white font-mono">Year {hoveredData.year}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Database + Audit</span>
              <span className="font-semibold text-emerald-400 font-mono tabular-nums">
                {Math.round(hoveredData.databaseGrossGb + hoveredData.auditGrossGb).toLocaleString()} GB
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Attachments</span>
              <span className="font-semibold text-amber-400 font-mono tabular-nums">
                {Math.round(hoveredData.attachmentGrossGb).toLocaleString()} GB
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Non-PROD Multiplier</span>
              <span className="font-semibold text-indigo-400 font-mono tabular-nums">
                {Math.round(hoveredData.nonProdTotalGb).toLocaleString()} GB
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Total Consumed</span>
              <span
                className={`font-semibold font-mono tabular-nums ${
                  hoveredData.totalGrossGb > entitlementGb ? 'text-rose-400' : 'text-white'
                }`}
              >
                {Math.round(hoveredData.totalGrossGb).toLocaleString()} GB (
                {Math.round(hoveredData.utilizationPercent)}%)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
