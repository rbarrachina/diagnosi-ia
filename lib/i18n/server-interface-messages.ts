import "server-only";

import { cache } from "react";
import { getCurrentLanguage } from "@/lib/i18n/locale";
import { createInterfaceTranslator } from "@/lib/i18n/interface-messages";

export const getServerInterfaceTranslator = cache(async () =>
  createInterfaceTranslator(await getCurrentLanguage()),
);
