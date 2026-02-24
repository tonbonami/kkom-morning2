import * as React from "react";
import { cn } from "@/lib/utils";

type CardVariant = "glass" | "accent" | "default";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * - glass: A안 라이트 글래스 기본 카드(권장)
   * - accent: 퀴즈/강조 카드(톤만 살짝 올림)
   * - default: shadcn 기본 카드(롤백/예외용)
   */
  variant?: CardVariant;

  /**
   * 모바일 탭 피드백 + 키보드 포커스 링 + 약한 hover
   * (Card 자체가 클릭 가능한 UI일 때만 켜는 것을 권장)
   */
  interactive?: boolean;
}

const CARD_VARIANTS: Record<CardVariant, string> = {
  // A안: 라이트 글래스 기본 (iOS 성능 고려: 모바일 blur 약하게)
  // 다크모드는 "깨짐 방지" 수준으로만 최소 대응
  glass: [
    "rounded-2xl",
    "border border-white/60 dark:border-white/10",
    "bg-white/75 dark:bg-slate-900/75",
    "text-card-foreground",
    "backdrop-blur-md sm:backdrop-blur-xl",
    "will-change-transform",
    "ring-1 ring-black/5 dark:ring-white/10",
    "shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
  ].join(" "),

  // 강조 카드: 유리 느낌 유지 + 살짝 더 선명한 테두리/배경
  accent: [
    "rounded-2xl",
    "border border-white/60 dark:border-white/10",
    "bg-white/85 dark:bg-slate-900/85",
    "text-card-foreground",
    "backdrop-blur-md sm:backdrop-blur-xl",
    "will-change-transform",
    "ring-1 ring-black/10 dark:ring-white/10",
    "shadow-[0_14px_40px_rgba(0,0,0,0.08)]",
  ].join(" "),

  // 기존 shadcn 기본 카드(예외/롤백용)
  default: "rounded-lg border bg-card text-card-foreground shadow-sm",
};

const CARD_INTERACTIVE = [
  "transition-transform transition-shadow duration-200",
  "active:scale-[0.99]",
  "hover:-translate-y-[1px] hover:shadow-[0_16px_50px_rgba(0,0,0,0.10)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
].join(" ");

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "glass", interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                (e.currentTarget as HTMLDivElement).click();
              }
            }
          : undefined
      }
      className={cn(
        CARD_VARIANTS[variant],
        interactive && CARD_INTERACTIVE,
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };