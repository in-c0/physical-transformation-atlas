import { CHECK_DEFINITIONS } from "@pta/physics/definitions";
import { exportJson } from "@/lib/api";

export const dynamic = "force-static";

/** The seven physics checks as a registry: id, label, definition, when each result is given, which fields are read, where the code is. */
export function GET() {
  return exportJson("checks", CHECK_DEFINITIONS, {}, { records: CHECK_DEFINITIONS.length, record_kind: "none" });
}
