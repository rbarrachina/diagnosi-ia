import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageSelector } from "@/components/home/language-selector";
import { LanguageSettingsProvider } from "@/components/i18n/language-settings-provider";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => {
  refresh.mockClear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }))));
});

describe("language selector", () => {
  it("does not render when it is globally hidden", () => {
    render(
      <LanguageSettingsProvider
        settings={{ selectorVisible: false, visibleLanguageCodes: ["CA"] }}
      >
        <LanguageSelector />
      </LanguageSettingsProvider>,
    );

    expect(
      screen.queryByRole("button", { name: "Idioma: Català" }),
    ).not.toBeInTheDocument();
  });

  it("only lists the globally selected languages", () => {
    render(
      <LanguageSettingsProvider
        settings={{
          selectorVisible: true,
          visibleLanguageCodes: ["CA", "ES"],
        }}
      >
        <LanguageSelector />
      </LanguageSettingsProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Idioma: Català" }),
    );

    const languageRegion = screen.getByRole("region", { name: "Idiomes" });
    expect(within(languageRegion).getByText("Català")).toBeInTheDocument();
    expect(within(languageRegion).getByText("Castellano")).toBeInTheDocument();
    expect(within(languageRegion).queryByText("Euskara")).not.toBeInTheDocument();
  });

  it("stores an explicit selection and refreshes without reading browser preferences", async () => {
    render(
      <LanguageSettingsProvider
        settings={{ selectorVisible: true, visibleLanguageCodes: ["CA", "ES"] }}
      >
        <LanguageSelector />
      </LanguageSettingsProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Idioma: Català" }));
    fireEvent.click(screen.getByRole("button", { name: /ES.*Castellano/ }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      "/api/language",
      expect.objectContaining({ body: JSON.stringify({ language: "ES" }), method: "POST" }),
    ));
    expect(refresh).toHaveBeenCalledOnce();
  });
});
