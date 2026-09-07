import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CentreEmailPolicyForm } from "@/components/create-space/centre-email-policy-form";

describe("centre email policy form", () => {
  it("offers one mutually exclusive domain choice", () => {
    render(
      <CentreEmailPolicyForm
        initialPolicy={{
          allowXtec: true,
          customDomain: null,
          configured: true,
        }}
      />,
    );

    const xtec = screen.getByRole("radio", { name: "@xtec.cat" });
    const custom = screen.getByRole("radio", { name: "Domini propi" });

    expect(xtec).toBeChecked();
    expect(custom).not.toBeChecked();

    fireEvent.click(custom);

    expect(custom).toBeChecked();
    expect(xtec).not.toBeChecked();
    expect(screen.getByRole("textbox", { name: "Domini propi" })).toBeVisible();
    expect(screen.queryByText(/podria respondre dues vegades/i)).not.toBeInTheDocument();
  });

  it("normalizes a legacy policy with both domains to the custom domain", () => {
    render(
      <CentreEmailPolicyForm
        initialPolicy={{
          allowXtec: true,
          customDomain: "escola.cat",
          configured: true,
        }}
      />,
    );

    expect(screen.getByRole("radio", { name: "Domini propi" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "@xtec.cat" })).not.toBeChecked();
  });
});
