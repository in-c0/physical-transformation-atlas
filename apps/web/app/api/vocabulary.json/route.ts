import { VOCABULARY } from "@pta/schema/vocabulary";
import { exportJson } from "@/lib/api";

export const dynamic = "force-static";

/** Every enumeration used in the exports, with a definition per value and where it appears. */
export function GET() {
  const enumerations = VOCABULARY;
  return exportJson("vocabulary", { enumerations }, enumerations.length);
}
