import { CHECK_DEFINITIONS } from "@pta/physics";

export const dynamic = "force-static";

/** The seven physics checks as data: id, question, what each result means, which fields are read. */
export function GET() {
  return Response.json(CHECK_DEFINITIONS);
}
