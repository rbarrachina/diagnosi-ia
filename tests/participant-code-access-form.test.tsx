import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ParticipantCodeAccessForm } from "@/components/participants/code-access-form";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => push.mockClear());

describe("authenticated participant code access", () => {
  it("opens the questionnaire using the current session without starting OAuth", () => {
    render(<ParticipantCodeAccessForm authenticated />);
    fireEvent.change(screen.getByLabelText("Codi del qüestionari"), {
      target: { value: "c-7kx9-m2q8" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Accedeix" }));
    expect(push).toHaveBeenCalledExactlyOnceWith("/q/C-7KX9-M2Q8");
  });

  it("rejects an invalid format before navigating", () => {
    render(<ParticipantCodeAccessForm authenticated />);
    const input = screen.getByLabelText("Codi del qüestionari");
    fireEvent.change(input, { target: { value: "invalid" } });
    fireEvent.blur(input);
    expect(screen.getByRole("button", { name: "Accedeix" })).toBeDisabled();
    expect(screen.getByRole("alert")).toBeVisible();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(push).not.toHaveBeenCalled();
  });
});
