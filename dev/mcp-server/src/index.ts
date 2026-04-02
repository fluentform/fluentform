#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerRegistryTools } from "./tools/registry.js";
import { registerHookTools } from "./tools/hooks.js";
import { registerImpactTools } from "./tools/impact.js";
import { registerReleaseTools } from "./tools/release.js";
import { registerWporgTools } from "./tools/wporg.js";
import { registerIntegrityTools } from "./tools/integrity.js";

const server = new McpServer(
  { name: "fluentform-ecosystem", version: "1.0.0" },
  {
    capabilities: { tools: {} },
    instructions: "FluentForm ecosystem tools: plugin registry, hook search, impact analysis, release readiness, WordPress.org stats, and cross-plugin integrity checks.",
  }
);

registerRegistryTools(server);
registerHookTools(server);
registerImpactTools(server);
registerReleaseTools(server);
registerWporgTools(server);
registerIntegrityTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
