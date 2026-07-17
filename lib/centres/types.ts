export type CentreSourceStatus = "pending" | "ok" | "not_found" | "unavailable";

export type CentreProfile = {
  id: string;
  email: string;
  accountDisplayName: string | null;
  officialCode: string | null;
  officialName: string | null;
  municipality: string | null;
  territorialArea: string | null;
  educationalService: string | null;
  sourceStatus: CentreSourceStatus;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  profileConfirmedAt: string | null;
  allowXtec: boolean;
  customDomain: string | null;
  emailPolicyConfiguredAt: string | null;
  displayName: string;
};

export type CentreEmailPolicy = {
  allowXtec: boolean;
  customDomain: string | null;
  configured: boolean;
};
