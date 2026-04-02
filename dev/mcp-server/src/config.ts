import { resolve } from "node:path";

export interface PluginConfig {
  key: string;
  path: string;
  slug: string | null;
  branch: string;
}

const PLUGINS_ROOT = process.env.PLUGINS_ROOT || "/Volumes/Projects/forms/wp-content/plugins";

export const plugins: PluginConfig[] = [
  { key: "fluentform",     path: "fluentform",                          slug: "fluentform",            branch: "dev" },
  { key: "fluentformpro",  path: "fluentformpro",                       slug: null,                    branch: "dev" },
  { key: "conversational", path: "fluent-conversational-js",             slug: null,                    branch: "dev" },
  { key: "signature",      path: "fluentform-signature",                 slug: "fluentform-signature",  branch: "release" },
  { key: "pdf",            path: "fluentforms-pdf",                      slug: "fluentforms-pdf",       branch: "master" },
  { key: "wpml",           path: "multilingual-forms-fluent-forms-wpml", slug: null,                    branch: "main" },
  { key: "mailpoet",       path: "fluent-forms-connector-for-mailpoet",  slug: null,                    branch: "master" },
  { key: "developer-docs", path: "fluentform-developer-docs",            slug: null,                    branch: "main" },
];

export const wporgSlugs = ["fluentform", "fluentforms-pdf", "fluentform-signature", "fluent-smtp"];

export function pluginAbsPath(plugin: PluginConfig): string {
  return resolve(PLUGINS_ROOT, plugin.path);
}

export function getPlugin(key: string): PluginConfig | undefined {
  return plugins.find((p) => p.key === key);
}
