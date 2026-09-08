import type { ReactNode } from "react";

import { AppLogoLink } from "@/components/brand/app-logo";
import { LanguageSelector } from "@/components/home/language-selector";
import { AppHeaderEffects } from "@/components/layout/app-header-effects";

type AppHeaderProps = {
  brandOpensInNewTab?: boolean;
  brandHref: string;
  children: ReactNode;
  controlsRef?: React.RefObject<HTMLDivElement | null>;
  showBrandLabelOnMobile?: boolean;
};

export function AppHeader({
  brandOpensInNewTab = false,
  brandHref,
  children,
  controlsRef,
  showBrandLabelOnMobile = false,
}: AppHeaderProps) {
  return (
    <>
      <a className="skip-link" href="#inici">
        Salta al contingut principal
      </a>
      <header
        className="app-header fixed inset-x-0 top-0 z-50 border-b"
        data-app-header
        data-scrolled="false"
      >
        <AppHeaderEffects />
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-2 px-5 sm:gap-3 sm:px-8 lg:px-10">
          <AppLogoLink
            href={brandHref}
            openInNewTab={brandOpensInNewTab}
            showLabelOnMobile={showBrandLabelOnMobile}
          />
          <div className="flex items-center gap-2" ref={controlsRef}>
            <LanguageSelector />
            {children}
          </div>
        </div>
      </header>
    </>
  );
}
