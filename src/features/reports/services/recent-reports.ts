import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type RecentReport = {
  id: string;
  domain: string;
  crawledAt: string;
  geoScore: number | null;
};

type CrawlSnapshot = Tables<"geo_crawl_snapshots">;

function getGeoScore(scores: CrawlSnapshot["scores"]): number | null {
  if (
    typeof scores !== "object" ||
    scores === null ||
    Array.isArray(scores) ||
    typeof scores.geo !== "number"
  ) {
    return null;
  }

  return scores.geo;
}

export async function loadRecentReports(): Promise<RecentReport[]> {
  const { data: snapshots, error: snapshotsError } = await supabase
    .from("geo_crawl_snapshots")
    .select("id, project_id, scores, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (snapshotsError) throw snapshotsError;
  if (!snapshots.length) return [];

  const projectIds = [...new Set(snapshots.map((snapshot) => snapshot.project_id))];
  const { data: projects, error: projectsError } = await supabase
    .from("geo_projects")
    .select("id, domain")
    .in("id", projectIds);

  if (projectsError) throw projectsError;

  const domains = new Map(projects.map((project) => [project.id, project.domain]));

  return snapshots.map((snapshot) => ({
    id: snapshot.id,
    domain: domains.get(snapshot.project_id) ?? snapshot.project_id,
    crawledAt: snapshot.created_at,
    geoScore: getGeoScore(snapshot.scores),
  }));
}
