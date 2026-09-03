import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const centreProfilesSource = readFileSync(
  join(process.cwd(), "lib/centres/centre-profiles.ts"),
  "utf8",
);
const createSpaceRouteSource = readFileSync(
  join(process.cwd(), "app/api/spaces/route.ts"),
  "utf8",
);
const callbackRouteSource = readFileSync(
  join(process.cwd(), "app/auth/callback/route.ts"),
  "utf8",
);

describe("responsible centre profiles", () => {
  it("creates profiles for every responsible allowed by the global access policy", () => {
    const registrationFunction = centreProfilesSource.slice(
      centreProfilesSource.indexOf(
        "export async function registerResponsibleCentreAccount",
      ),
      centreProfilesSource.indexOf(
        "export async function getCentreProfileForUser",
      ),
    );

    expect(registrationFunction).toContain("canUseResponsibleAccess(user)");
    expect(registrationFunction).toContain("allowNonCentre: true");
    expect(callbackRouteSource).toContain("registerResponsibleCentreAccount");
    expect(callbackRouteSource).toContain('statePayload.purpose !== "participant"');
  });

  it("does not create diagnostic spaces without a centre profile", () => {
    expect(createSpaceRouteSource).toContain("if (!centre)");
    expect(createSpaceRouteSource).toContain("centre.id");
    expect(createSpaceRouteSource).not.toContain("centre?.id ?? null");
  });

  it("keeps the automatic repair of existing owner spaces without a centre", () => {
    expect(centreProfilesSource).toContain("update diagnostic_spaces");
    expect(centreProfilesSource).toContain("where owner_user_id = ?");
    expect(centreProfilesSource).toContain("and centre_id is null");
  });
});
