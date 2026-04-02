import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { plugins, pluginAbsPath } from "../config.js";

export interface TableColumn {
  name: string;
  type: string;
}

export interface TableSchema {
  table: string;
  columns: TableColumn[];
  plugin: string;
  file: string;
}

export function buildSchemaMap(): TableSchema[] {
  const schemas: TableSchema[] = [];

  for (const plugin of plugins) {
    const migrationsDir = join(pluginAbsPath(plugin), "database", "Migrations");
    if (!existsSync(migrationsDir)) continue;

    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".php"));

    for (const file of files) {
      const content = readFileSync(join(migrationsDir, file), "utf-8");
      const parsed = parseCreateStatements(content, plugin.key, file);
      schemas.push(...parsed);
    }
  }

  return schemas;
}

function parseCreateStatements(
  php: string,
  pluginKey: string,
  file: string
): TableSchema[] {
  const results: TableSchema[] = [];

  const tableMatches = php.matchAll(/\$wpdb->prefix\s*\.\s*['"](\w+)['"]/g);
  const tableNames = [...new Set([...tableMatches].map((m) => m[1]))];

  const createBlocks = php.matchAll(/CREATE TABLE \$table\s*\(([\s\S]*?)\)\s*\$/g);

  for (const block of createBlocks) {
    const body = block[1];
    const columns: TableColumn[] = [];

    const colMatches = body.matchAll(/`(\w+)`\s+([\w()]+)/g);
    for (const col of colMatches) {
      if (["PRIMARY", "KEY", "UNIQUE", "INDEX"].includes(col[1].toUpperCase())) continue;
      columns.push({ name: col[1], type: col[2] });
    }

    const tableName = tableNames[0] || "unknown";
    if (columns.length > 0) {
      results.push({ table: tableName, columns, plugin: pluginKey, file });
    }
  }

  return results;
}

export function findTable(schemas: TableSchema[], tableName: string): TableSchema | undefined {
  return schemas.find(
    (s) => s.table === tableName || s.table === tableName.replace("fluentform_", "")
  );
}

export function findColumn(
  schema: TableSchema,
  columnName: string
): TableColumn | undefined {
  return schema.columns.find((c) => c.name === columnName);
}
