import { atlas } from "@/lib/data";
import { exportJson } from "@/lib/api";

export const dynamic = "force-static";

/** Every enumerated conversion route with its physics checks, structure and search status. */
export function GET() {
  const paths = atlas().graph.paths;
  return exportJson("paths", { paths }, paths.length);
}
