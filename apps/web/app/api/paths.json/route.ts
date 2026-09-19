import { atlas } from "@/lib/data";

export const dynamic = "force-static";

/** Every enumerated conversion path with its physics checks and search status. */
export function GET() {
  return Response.json(atlas().graph.paths);
}
