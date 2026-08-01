// ============================================================================
// Import
// ============================================================================

import { Action } from "../../types/Action.js";
import { spawn } from "child_process";
import path from "path";

// ============================================================================
// Types
// ============================================================================

/**
 * Output format(s) tsdown can emit for a bundle. Passed through verbatim to
 * tsdown's `--format` CLI flag (as a comma-separated list when multiple
 * formats are requested via {@link TsdownActionOptions.format}).
 *
 * - `"esm"` — native ES modules (`import`/`export`).
 * - `"cjs"` — CommonJS (`require`/`module.exports`), for Node consumers.
 * - `"iife"` — a single self-executing function, for direct `<script>` use
 *   in browsers; typically paired with {@link TsdownActionOptions.globalName}.
 */
export type TsdownFormat = "esm" | "cjs" | "iife";

/**
 * Configuration options for {@link TsdownAction}. Only `entry` is required;
 * every other field is optional and, unless noted otherwise, falls back to
 * tsdown's own CLI default when omitted (the flag simply isn't passed —
 * see {@link TsdownAction.buildArgs}).
 *
 * @example
 * ```yaml
 * # kist.yml
 * pipeline:
 *     stages:
 *         - name: build
 *           steps:
 *               - name: bundle
 *                 action: TsdownAction
 *                 options:
 *                     entry: ./src/index.ts
 *                     outDir: ./dist
 *                     format:
 *                         - esm
 *                         - cjs
 *                     dts: true
 *                     minify: true
 *                     sourcemap: true
 *                     clean: true
 *                     platform: node
 * ```
 */
export interface TsdownActionOptions {
    /**
     * Entry point file(s) for the bundle. A single path or an array of
     * paths, each resolved relative to `cwd` (or the process's current
     * working directory if `cwd` is not set). Required — {@link
     * TsdownAction.validateOptions} rejects a missing value or an empty
     * array.
     */
    entry: string | string[];

    /**
     * Output directory for the bundle, forwarded as `--out-dir` (default:
     * tsdown's own default output directory, typically `dist`).
     */
    outDir?: string;

    /**
     * Output format(s) to emit; a single {@link TsdownFormat} or an array
     * to build several formats in one run (default: tsdown's own default
     * format).
     */
    format?: TsdownFormat | TsdownFormat[];

    /** Generate TypeScript declaration (`.d.ts`) files alongside the bundle (default: false). */
    dts?: boolean;

    /** Minify the output bundle (default: false). */
    minify?: boolean;

    /**
     * Generate sourcemaps for the output. `true` writes a separate `.map`
     * file per output; `"inline"` embeds the map as a data URI in the
     * bundle itself (default: false — no sourcemap).
     */
    sourcemap?: boolean | "inline";

    /** Remove the contents of `outDir` before building (default: false). */
    clean?: boolean;

    /**
     * Package names to treat as external (not bundled); each entry is
     * forwarded as a separate `--external` flag. Consumers must have these
     * packages available at runtime (default: none — no packages are
     * treated as external beyond tsdown's own built-in Node.js handling).
     */
    external?: string[];

    /**
     * Global variable name to expose the bundle under when `format`
     * includes `"iife"`. Has no effect for `"esm"`/`"cjs"` output.
     */
    globalName?: string;

    /**
     * Target environment/ECMAScript version for downleveling and syntax
     * support (e.g. `"es2022"`, `"node18"`), forwarded as `--target`
     * (default: tsdown's own default target).
     */
    target?: string;

    /**
     * Path to a specific `tsconfig.json` to use, forwarded as `--tsconfig`
     * (default: tsdown auto-discovers the nearest `tsconfig.json`).
     */
    tsconfig?: string;

    /**
     * Rebuild on source file changes instead of exiting after the first
     * build. Intended for local development; not recommended for CI
     * pipelines since {@link TsdownAction.execute} awaits process exit
     * (default: false).
     */
    watch?: boolean;

    /**
     * Enable tree shaking to eliminate unused exports (default: true).
     * Only setting this to `false` has any effect — {@link
     * TsdownAction.buildArgs} passes `--no-treeshake` when explicitly
     * disabled, and otherwise relies on tsdown's own default of `true`.
     */
    treeshake?: boolean;

    /**
     * Global constant replacements applied at build time (e.g.
     * `{ "process.env.NODE_ENV": '"production"' }`); each entry is
     * forwarded as a separate `--define key=value` flag (default: none).
     */
    define?: Record<string, string>;

    /**
     * Environment variables to inline into the bundle. Declared for parity
     * with tsdown's own options, but currently **not** forwarded to the
     * CLI by {@link TsdownAction.buildArgs} — setting this field has no
     * effect until support is added.
     */
    env?: Record<string, string>;

    /**
     * Target platform, forwarded as `--platform`. Affects how tsdown
     * resolves built-ins and shims (default: tsdown's own default,
     * typically `"node"`).
     */
    platform?: "node" | "browser" | "neutral";

    /**
     * Bundle dependencies from `node_modules` into the output rather than
     * leaving `require`/`import` calls to be resolved at runtime (default:
     * true). Only setting this to `false` has any effect — {@link
     * TsdownAction.buildArgs} passes `--no-bundle` when explicitly
     * disabled.
     */
    bundle?: boolean;

    /**
     * Package names to exclude from bundling even when {@link bundle} is
     * enabled; each entry is forwarded as a separate `--no-external` flag
     * (default: none).
     */
    noExternal?: string[];

    /**
     * Working directory the tsdown process is spawned in, and the base
     * that relative `entry` paths are resolved against (default:
     * `process.cwd()`).
     */
    cwd?: string;

    /**
     * Suppress tsdown's own stdout/stderr output by running the spawned
     * process with `stdio: "ignore"` instead of `"inherit"` (default:
     * false — tsdown's output is streamed through).
     */
    silent?: boolean;

    /**
     * Path to a tsdown config file (e.g. `tsdown.config.ts`), forwarded as
     * `--config` (default: tsdown auto-discovers a config file in `cwd`).
     */
    configPath?: string;
}

// ============================================================================
// Classes
// ============================================================================

/**
 * Action for bundling TypeScript/JavaScript using tsdown (Rolldown-based
 * bundler). Rather than importing tsdown's programmatic API, this action
 * spawns tsdown as a child process with CLI flags translated from {@link
 * TsdownActionOptions} (see {@link buildArgs}), so behavior tracks tsdown's
 * own CLI exactly and stdout/stderr can be streamed straight through to the
 * kist pipeline log.
 */
export class TsdownAction extends Action<TsdownActionOptions> {
    readonly name = "TsdownAction";

    /**
     * Provides a description of the action.
     *
     * @returns A one-sentence description of the action's behavior.
     */
    describe(): string {
        return "Bundle TypeScript/JavaScript files using tsdown (Rolldown-based bundler)";
    }

    /**
     * Validates the action options before {@link execute} builds CLI
     * arguments from them. Checks are limited to what would otherwise
     * produce a confusing tsdown CLI error or silently do nothing (missing
     * entry, unrecognized `format`/`platform`/`sourcemap` values); fields
     * not checked here are assumed to be validated by tsdown itself when
     * the process runs.
     *
     * @param options - The options to validate.
     * @returns `true` if the options are valid, `false` otherwise (with the
     * specific problem reported via {@link logError}).
     */
    validateOptions(options: TsdownActionOptions): boolean {
        if (!options.entry) {
            this.logError("Invalid options: 'entry' is required");
            return false;
        }

        if (Array.isArray(options.entry) && options.entry.length === 0) {
            this.logError("Invalid options: 'entry' must have at least one entry point");
            return false;
        }

        if (options.format) {
            const formats = Array.isArray(options.format) ? options.format : [options.format];
            const validFormats: TsdownFormat[] = ["esm", "cjs", "iife"];
            for (const format of formats) {
                if (!validFormats.includes(format)) {
                    this.logError(`Invalid options: 'format' must be one of: ${validFormats.join(", ")}`);
                    return false;
                }
            }
        }

        if (options.platform && !["node", "browser", "neutral"].includes(options.platform)) {
            this.logError("Invalid options: 'platform' must be one of: node, browser, neutral");
            return false;
        }

        if (options.sourcemap !== undefined && 
            typeof options.sourcemap !== "boolean" && 
            options.sourcemap !== "inline") {
            this.logError("Invalid options: 'sourcemap' must be boolean or 'inline'");
            return false;
        }

        return true;
    }

    /**
     * Executes the tsdown bundling action: validates options, translates
     * them into tsdown CLI arguments, and spawns tsdown as a child process
     * in `options.cwd` (or the current working directory).
     *
     * @param options - The bundling options for this run.
     * @returns A promise that resolves once tsdown exits successfully.
     * @throws {Error} If `options` fail {@link validateOptions}, or if the
     * spawned tsdown process exits with a non-zero code or fails to start
     * (see {@link runTsdown}).
     */
    async execute(options: TsdownActionOptions): Promise<void> {
        if (!this.validateOptions(options)) {
            throw new Error("Invalid options provided to TsdownAction");
        }

        const args = this.buildArgs(options);
        const cwd = options.cwd || process.cwd();

        const entries = Array.isArray(options.entry) ? options.entry : [options.entry];
        this.logInfo(`Bundling ${entries.length} entry point(s) with tsdown`);

        try {
            await this.runTsdown(args, cwd, options.silent);
            this.logInfo("Bundle completed successfully");
        } catch (error) {
            this.logError("tsdown bundling failed.", error);
            throw error;
        }
    }

    /**
     * Translates {@link TsdownActionOptions} into the equivalent tsdown CLI
     * argument list. Options are only appended when explicitly set (or, for
     * `treeshake`/`bundle`, only when explicitly disabled) — omitted
     * options are left for tsdown's own CLI defaults to apply. Note that
     * `options.env` is intentionally not handled here (see its field doc on
     * {@link TsdownActionOptions.env}); `cwd` and `silent` are also excluded
     * since they configure the spawned process itself rather than being
     * passed as CLI flags (see {@link execute} and {@link runTsdown}).
     *
     * @param options - The already-validated action options.
     * @returns The argument list to pass to the tsdown CLI, entry points
     * first followed by flags.
     */
    private buildArgs(options: TsdownActionOptions): string[] {
        const args: string[] = [];

        // Entry points
        const entries = Array.isArray(options.entry) ? options.entry : [options.entry];
        args.push(...entries);

        if (options.configPath) {
            args.push("--config", options.configPath);
        }

        if (options.outDir) {
            args.push("--out-dir", options.outDir);
        }

        if (options.format) {
            const formats = Array.isArray(options.format) ? options.format : [options.format];
            args.push("--format", formats.join(","));
        }

        if (options.dts) {
            args.push("--dts");
        }

        if (options.minify) {
            args.push("--minify");
        }

        if (options.sourcemap !== undefined) {
            if (options.sourcemap === true) {
                args.push("--sourcemap");
            } else if (options.sourcemap === "inline") {
                args.push("--sourcemap", "inline");
            }
        }

        if (options.clean) {
            args.push("--clean");
        }

        if (options.external && options.external.length > 0) {
            for (const ext of options.external) {
                args.push("--external", ext);
            }
        }

        if (options.globalName) {
            args.push("--global-name", options.globalName);
        }

        if (options.target) {
            args.push("--target", options.target);
        }

        if (options.tsconfig) {
            args.push("--tsconfig", options.tsconfig);
        }

        if (options.watch) {
            args.push("--watch");
        }

        if (options.treeshake === false) {
            args.push("--no-treeshake");
        }

        if (options.define) {
            for (const [key, value] of Object.entries(options.define)) {
                args.push("--define", `${key}=${value}`);
            }
        }

        if (options.platform) {
            args.push("--platform", options.platform);
        }

        if (options.bundle === false) {
            args.push("--no-bundle");
        }

        if (options.noExternal && options.noExternal.length > 0) {
            for (const pkg of options.noExternal) {
                args.push("--no-external", pkg);
            }
        }

        return args;
    }

    /**
     * Spawns tsdown as a child process with the given CLI arguments and
     * resolves once it exits. Prefers invoking the locally-installed
     * `tsdown/dist/cli.mjs` entry directly via `node` (fast, no extra
     * resolution step); if that module can't be resolved (e.g. tsdown is
     * only available via `npx` rather than as a direct dependency), it
     * falls back to running `npx tsdown` through a shell.
     *
     * @param args - The CLI arguments to pass to tsdown, as built by
     * {@link buildArgs}.
     * @param cwd - The working directory to spawn the process in.
     * @param silent - When `true`, the child process's stdio is set to
     * `"ignore"` instead of `"inherit"`, suppressing tsdown's own output.
     * @returns A promise that resolves when tsdown exits with code `0`.
     * @throws {Error} Rejects if tsdown exits with a non-zero code, or if
     * the child process itself fails to spawn (e.g. neither `node` nor
     * `npx` is available).
     */
    private runTsdown(args: string[], cwd: string, silent?: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            // Try to find tsdown binary
            let tsdownBin: string;
            try {
                tsdownBin = require.resolve("tsdown/dist/cli.mjs");
            } catch {
                // Fallback to npx
                tsdownBin = "tsdown";
            }

            this.logDebug(`Running: tsdown ${args.join(" ")}`);

            const isNpx = tsdownBin === "tsdown";
            const command = isNpx ? "npx" : "node";
            const spawnArgs = isNpx ? ["tsdown", ...args] : [tsdownBin, ...args];

            const child = spawn(command, spawnArgs, {
                cwd,
                stdio: silent ? "ignore" : "inherit",
                shell: isNpx,
            });

            child.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`tsdown exited with code ${code}`));
                }
            });

            child.on("error", (error) => {
                reject(error);
            });
        });
    }
}
