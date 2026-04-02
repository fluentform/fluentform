import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { wporgSlugs } from "../config.js";
import { fetchPluginInfo, fetchReviews } from "../utils/wporg-api.js";

export function registerWporgTools(server: McpServer): void {
  server.tool(
    "wporg_stats",
    "Fetch live stats from WordPress.org for one or all tracked plugins: active installs, rating, version, support threads, etc.",
    {
      slug: z
        .string()
        .optional()
        .describe(
          `Plugin slug to query. If omitted, stats are fetched for all tracked slugs: ${wporgSlugs.join(", ")}.`
        ),
    },
    async ({ slug }) => {
      const slugsToFetch = slug ? [slug] : wporgSlugs;
      const results = await Promise.all(
        slugsToFetch.map(async (s) => {
          const info = await fetchPluginInfo(s);
          if (!info) return { slug: s, error: "Not found or API unavailable" };
          return {
            slug: s,
            name: info.name,
            version: info.version,
            active_installs: info.active_installs,
            rating: `${info.rating}/100 (${info.num_ratings} ratings)`,
            last_updated: info.last_updated,
            tested_up_to: info.tested,
            requires_wp: info.requires,
            requires_php: info.requires_php,
            support_threads: info.support_threads,
            support_threads_resolved: info.support_threads_resolved,
          };
        })
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "wporg_reviews",
    "Fetch recent reviews from WordPress.org for a plugin. Returns reviewer name, star rating, date, and review excerpt.",
    {
      slug: z
        .string()
        .describe(
          `Plugin slug to fetch reviews for (e.g. "fluentform", "fluentforms-pdf", "fluentform-signature").`
        ),
      count: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .default(10)
        .describe("Number of reviews to return (1–50, default 10)."),
    },
    async ({ slug, count }) => {
      const reviews = await fetchReviews(slug, count);

      if (reviews.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No reviews found for plugin "${slug}".`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(reviews, null, 2),
          },
        ],
      };
    }
  );
}
