import type { CSSProperties } from "react";
import { appName, brandLogo } from "../branding";

interface BrandLogoProps {
  size?: number;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function BrandLogo({
  size = 36,
  compact = false,
  className,
  style,
}: BrandLogoProps) {
  return (
    <span
      className={className}
      title={appName}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
        ...style,
      }}
    >
      <img
        src={brandLogo}
        alt={compact ? appName : ""}
        width={size}
        height={size}
        style={{ objectFit: "contain", flexShrink: 0 }}
      />
      {!compact && (
        <span
          style={{
            fontSize: Math.min(18, size / 2),
            fontWeight: 600,
            color: "var(--fn-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {appName}
        </span>
      )}
    </span>
  );
}
