import Link from "next/link";

type AppLogoLinkProps = {
  href: string;
  openInNewTab?: boolean;
  showLabelOnMobile?: boolean;
};

export function AppLogoLink({
  href,
  openInNewTab = false,
  showLabelOnMobile = false,
}: AppLogoLinkProps) {
  return (
    <Link
      aria-label="Torna a l’inici de Diagnosi IA"
      className="group inline-flex items-center gap-3 font-semibold tracking-[-0.02em]"
      href={href}
      rel={openInNewTab ? "noreferrer" : undefined}
      target={openInNewTab ? "_blank" : undefined}
    >
      <AppLogoMark animated />
      <span className={`${showLabelOnMobile ? "inline" : "hidden sm:inline"} text-base`}>
        Diagnosi IA
      </span>
    </Link>
  );
}

export function AppLogoMark({
  animated = false,
  size = "default",
}: {
  animated?: boolean;
  size?: "default" | "large";
}) {
  return (
    <span
      className={`app-logo-mark inline-flex shrink-0 items-center justify-center text-white shadow-lg shadow-blue-500/20 ${
        size === "large" ? "h-16 w-16 rounded-[1.35rem]" : "h-9 w-9 rounded-xl"
      } ${
        animated
          ? "transition group-hover:-rotate-3 group-hover:scale-105"
          : ""
      }`}
    >
      <SparkIcon large={size === "large"} />
    </span>
  );
}

function SparkIcon({ large }: { large: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={large ? "h-8 w-8" : "h-5 w-5"}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"
        fill="currentColor"
      />
      <path
        d="m18.5 16 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"
        fill="currentColor"
        opacity=".72"
      />
    </svg>
  );
}
