import packageJson from "@/package.json";
import tsconfig from "@/tsconfig.json";

describe("project bootstrap", () => {
  it("uses the expected package name", () => {
    expect(packageJson.name).toBe("diagnosi-ia");
  });

  it("keeps TypeScript strict mode enabled", () => {
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });
});
