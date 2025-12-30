import React, { ReactNode } from "react";
import { LanguageDebugToggle } from "../debug/LanguageDebugToggle";

interface LayoutProps {
    children: ReactNode;
    className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className = "" }) => {
    return (
        <div
            className="
        min-h-[100dvh]
        flex items-center justify-center

        /* 모바일: 여백도 surface로 통일 */
        bg-[var(--color-surface)]
        sm:bg-[var(--color-primary-bg)]

        /* 기본 여백: 모바일 0, 데스크탑 4 */
        p-0
        sm:p-4
      "
        >
            <LanguageDebugToggle />
            <div
                className={`
          w-full
          max-w-[520px] sm:max-w-md

          /* ✅ Mobile: 100dvh (Full Screen without vertical shrinking) */
          h-[100dvh]
          sm:h-[700px]

          /* ✅ Mobile: Top padding for safe area */
          pt-[env(safe-area-inset-top)]
          sm:pt-0

          flex flex-col
          overflow-hidden relative
          bg-[var(--color-surface)]

          /* PC 카드 프레임 */
          border-0 sm:border
          rounded-none sm:rounded-[var(--radius-xl)]
          shadow-none sm:shadow-[var(--shadow-xl)]
          ${className}
        `}
                style={{ borderColor: "var(--color-border)" }}
            >
                {children}
            </div>
        </div>
    );
};