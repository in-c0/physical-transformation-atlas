import { atlas } from "@/lib/data";

export const dynamic = "force-static";

export function GET() {
  return Response.json({ sources: atlas().graph.sources, verification: atlas().graph.source_verification });
}
