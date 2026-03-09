"use client";

import { Card, CardBody } from "@heroui/react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { pctChange } from "@/lib/comparison";

/**
 * KPI Card with optional YTM/YTY comparison badge
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string|number} props.value - formatted display value
 * @param {string} [props.unit]
 * @param {"primary"|"success"|"warning"|"danger"|"default"} [props.color]
 * @param {string} [props.subtitle]
 * @param {number} [props.currentRaw] - raw numeric value for comparison calc
 * @param {number} [props.previousRaw] - raw numeric value from previous period
 * @param {boolean} [props.invertColor] - true if lower is better (e.g. cost, overdue)
 */
export default function CompareKpiCard({
  title,
  value,
  unit,
  color = "default",
  subtitle,
  currentRaw,
  previousRaw,
  invertColor = false,
}) {
  const colorClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    default: "",
  };

  const change = currentRaw != null && previousRaw != null
    ? pctChange(currentRaw, previousRaw)
    : null;

  const showBadge = change !== null;
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  // Determine badge color: green = good, red = bad
  // invertColor flips the meaning (lower = good, e.g. costs)
  let badgeColor = "text-muted-foreground";
  let bgColor = "bg-default-100";
  if (!isNeutral && showBadge) {
    const isGood = invertColor ? isNegative : isPositive;
    badgeColor = isGood ? "text-success" : "text-danger";
    bgColor = isGood ? "bg-success-50" : "bg-danger-50";
  }

  return (
    <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
      <CardBody className="gap-1">
        <p className="text-xs text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className={`text-xs font-light ${colorClass[color] || ""}`}>
            {value}
          </p>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
        {showBadge && (
          <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-light w-fit ${badgeColor} ${bgColor}`}>
            {isPositive && <TrendingUp size={12} />}
            {isNegative && <TrendingDown size={12} />}
            {isNeutral && <Minus size={12} />}
            <span>{isPositive ? "+" : ""}{change}%</span>
          </div>
        )}
        {subtitle && !showBadge && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardBody>
    </Card>
  );
}
