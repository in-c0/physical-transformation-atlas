import { VOCABULARY } from "@pta/schema/vocabulary";

export const dynamic = "force-static";

/** Every enumeration used in the exports, with a definition per value and where it appears. */
export function GET() {
  return Response.json(VOCABULARY);
}
