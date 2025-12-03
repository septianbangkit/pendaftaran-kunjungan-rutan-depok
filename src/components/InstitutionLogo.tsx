import { cn } from "@/lib/utils";

interface InstitutionLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

export const InstitutionLogo = ({ size = "md", className }: InstitutionLogoProps) => {
  return (
    <div className={cn(
      "relative flex items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dark shadow-lg",
      sizeClasses[size],
      className
    )}>
      {/* Garuda-inspired emblem placeholder */}
      <svg
        viewBox="0 0 100 100"
        className="w-3/4 h-3/4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield shape */}
        <path
          d="M50 5 L85 25 L85 60 Q85 85 50 95 Q15 85 15 60 L15 25 Z"
          fill="hsl(213 55% 18%)"
          stroke="hsl(43 75% 40%)"
          strokeWidth="2"
        />
        {/* Star */}
        <path
          d="M50 20 L53 30 L64 30 L55 37 L59 48 L50 41 L41 48 L45 37 L36 30 L47 30 Z"
          fill="hsl(43 70% 50%)"
        />
        {/* Building icon */}
        <rect x="35" y="52" width="30" height="28" fill="hsl(43 70% 50%)" rx="2" />
        <rect x="40" y="57" width="6" height="8" fill="hsl(213 55% 18%)" rx="1" />
        <rect x="54" y="57" width="6" height="8" fill="hsl(213 55% 18%)" rx="1" />
        <rect x="45" y="68" width="10" height="12" fill="hsl(213 55% 18%)" rx="1" />
        {/* Roof */}
        <path
          d="M30 54 L50 40 L70 54"
          stroke="hsl(43 70% 50%)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
