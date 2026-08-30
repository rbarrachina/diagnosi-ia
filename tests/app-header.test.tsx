import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppHeader } from "@/components/layout/app-header";

describe("app header brand link", () => {
  it("can open the home page in a new tab for the public questionnaire", () => {
    render(
      <AppHeader brandHref="/" brandOpensInNewTab showBrandLabelOnMobile>
        <span>Control</span>
      </AppHeader>,
    );

    expect(
      screen.getByRole("link", { name: "Torna a l’inici de Diagnosi IA" }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("link", { name: "Torna a l’inici de Diagnosi IA" }),
    ).toHaveAttribute("rel", "noreferrer");
  });

  it("keeps same-tab navigation as the default for the rest of the app", () => {
    render(
      <AppHeader brandHref="/">
        <span>Control</span>
      </AppHeader>,
    );

    expect(
      screen.getByRole("link", { name: "Torna a l’inici de Diagnosi IA" }),
    ).not.toHaveAttribute("target");
  });
});
