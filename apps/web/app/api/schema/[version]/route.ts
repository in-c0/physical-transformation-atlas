import { exportJsonSchema } from "@pta/schema/export-schema";
import { SCHEMA_VERSION, SITE } from "@/lib/api";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ version: `v${SCHEMA_VERSION}.json` }];
}

/** The JSON Schema of every export, generated from the zod definitions. */
export function GET() {
  return Response.json(exportJsonSchema(SCHEMA_VERSION, SITE));
}
