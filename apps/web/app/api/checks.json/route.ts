import { CHECK_DEFINITIONS } from "@pta/physics/definitions";
import { exportJson } from "@/lib/api";

export const dynamic = "force-static";

/** The seven physics checks as data: id, question, what each result means, which fields are read. */
export function GET() {
  const checks = CHECK_DEFINITIONS;
  return exportJson("checks", { checks }, checks.length);
}
