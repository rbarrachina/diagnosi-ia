import "server-only";

import { z } from "zod";

const SOCRATA_URL =
  "https://analisi.transparenciacatalunya.cat/resource/kvmv-ahh4.json";
const EDUCATIONAL_SERVICES_URL =
  "https://raw.githubusercontent.com/rbarrachina/fitxa-centres-educatius/1a15844338d9de1293bf52b1f535ce5cece3815d/web/data/serveis-educatius.json";
export const EDUCATIONAL_SERVICES_SOURCE_REVISION =
  "1a15844338d9de1293bf52b1f535ce5cece3815d";

const socrataRowSchema = z.object({
  codi_centre: z.string().regex(/^\d{8}$/),
  denominaci_completa: z.string().trim().min(1).max(255),
  nom_municipi: z.string().trim().min(1).max(255),
  nom_delegaci: z.string().trim().min(1).max(255),
  nom_dm: z.string().trim().max(255).optional(),
});

const educationalServicesSchema = z.object({
  services: z.array(
    z.object({
      name: z.string().trim().min(1).max(255),
      district: z.string().trim().max(255),
      municipalities: z.array(z.string().trim().min(1).max(255)),
    }),
  ),
});

export type OpenCentreData = {
  officialCode: string;
  officialName: string;
  municipality: string;
  territorialArea: string;
  educationalService: string | null;
};

export type OpenCentreLookup =
  | { status: "ok"; data: OpenCentreData }
  | { status: "not_found" }
  | { status: "unavailable" };

export async function lookupCentreOpenData(email: string): Promise<OpenCentreLookup> {
  try {
    const query = new URLSearchParams({
      "$select":
        "codi_centre,denominaci_completa,nom_municipi,nom_delegaci,nom_dm",
      "$where": `lower(e_mail_centre) = '${escapeSoql(email.toLowerCase())}'`,
      "$order": "curs DESC, any DESC",
      "$limit": "1",
    });
    const response = await fetch(`${SOCRATA_URL}?${query.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return { status: "unavailable" };
    }

    const rows = z.array(socrataRowSchema).safeParse(await response.json());

    if (!rows.success) {
      return { status: "unavailable" };
    }

    const row = rows.data[0];

    if (!row) {
      return { status: "not_found" };
    }

    return {
      status: "ok",
      data: {
        officialCode: row.codi_centre,
        officialName: row.denominaci_completa,
        municipality: row.nom_municipi,
        territorialArea: row.nom_delegaci,
        educationalService: await lookupEducationalService(
          row.nom_municipi,
          row.nom_dm ?? "",
        ),
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}

async function lookupEducationalService(
  municipality: string,
  district: string,
): Promise<string | null> {
  try {
    const response = await fetch(EDUCATIONAL_SERVICES_URL, {
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return null;
    }

    const parsed = educationalServicesSchema.safeParse(await response.json());

    if (!parsed.success) {
      return null;
    }

    const normalizedMunicipality = normalizePlace(municipality);
    const normalizedDistrict = normalizePlace(district);
    const matches = parsed.data.services.filter((service) =>
      service.municipalities.some(
        (candidate) => normalizePlace(candidate) === normalizedMunicipality,
      ),
    );
    const districtMatch = matches.find(
      (service) =>
        service.district &&
        normalizePlace(service.district) === normalizedDistrict,
    );

    return (districtMatch ?? matches.find((service) => !service.district))?.name ?? null;
  } catch {
    return null;
  }
}

function normalizePlace(value: string): string {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[’',.()/-]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^(el|la|els|les|l)\s+/, "")
    .replace(/\s+(el|la|els|les)$/, "");
}

function escapeSoql(value: string): string {
  return value.replaceAll("'", "''");
}
