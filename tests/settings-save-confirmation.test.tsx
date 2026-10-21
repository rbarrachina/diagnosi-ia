import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmSubmitButton } from "@/app/admin/activation-button";

afterEach(() => vi.restoreAllMocks());
describe("unified settings save", () => {
  it.each(["internal", "external"])("only asks for confirmation when login mode changes to %s", (value) => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const submitted = vi.fn((event) => event.preventDefault());
    render(<form onSubmit={submitted}>
      <input name="loginMode" defaultValue={value} />
      <ConfirmSubmitButton className="" message="Canviar accés?" confirmWhenFieldChanges={{ name: "loginMode", initialValue: "internal" }}>Desa</ConfirmSubmitButton>
    </form>);
    fireEvent.click(screen.getByRole("button", { name: "Desa" }));
    expect(confirm).toHaveBeenCalledTimes(value === "internal" ? 0 : 1);
    expect(submitted).toHaveBeenCalledTimes(value === "internal" ? 1 : 0);
  });
});
