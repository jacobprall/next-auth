// @ts-nocheck

/**
 * @type {import('typedoc').TypeDocOptions & import('typedoc-plugin-markdown').MarkdownTheme}
 */
module.exports = {
  entryPoints: ["src/index.ts"],
  entryPointStrategy: "expand",
  tsconfig: "./tsconfig.json",
  entryModule: "@auth/sqlitecloud-adapter",
  entryFileName: "../sqlitecloud-adapter.mdx",
  includeVersion: true,
  readme: 'none',
}
