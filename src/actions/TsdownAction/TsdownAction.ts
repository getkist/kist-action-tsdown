import { Action } from "../../types/Action.js";
import { spawn } from "child_process";
import path from "path";

/**
 * Output format types supported by tsdown
 */
export type TsdownFormat = "esm" | "cjs" | "iife";

/**
 * Options for the TsdownAction
 */
export interface TsdownActionOptions {
    /**
     * Entry point file(s) for the bundle
     */
    entry: string | string[];

    /**
     * Output directory for the bundle
     */
    outDir?: string;

    /**
     * Output format(s): esm, cjs, or iife
     */
    format?: TsdownFormat | TsdownFormat[];

    /**
     * Generate TypeScript declaration files
     */
    dts?: boolean;

    /**
     * Minify the output
     */
    minify?: boolean;

    /**
     * Generate sourcemaps
     */
    sourcemap?: boolean | "inline";

    /**
     * Clean output directory before build
     */
    clean?: boolean;

    /**
     * External packages to exclude from bundle
     */
    external?: string[];

    /**
     * Global variable names for external packages (for iife/umd)
     */
    globalName?: string;

    /**
     * Target environment
     */
    target?: string;

    /**
     * Path to tsconfig.json
     */
    tsconfig?: string;

    /**
     * Watch mode
     */
    watch?: boolean;

    /**
     * Enable tree shaking
     */
    treeshake?: boolean;

    /**
     * Define global constants
     */
    define?: Record<string, string>;

    /**
     * Environment variables to inline
     */
    env?: Record<string, string>;

    /**
     * Platform target: node or browser
     */
    platform?: "node" | "browser" | "neutral";

    /**
     * Bundle packages from node_modules
     */
    bundle?: boolean;

    /**
     * Skip node_modules bundling (noExternal)
     */
    noExternal?: string[];

    /**
     * Working directory
     */
    cwd?: string;

    /**
     * Silence output
     */
    silent?: boolean;

    /**
     * Path to tsdown config file
     */
    configPath?: string;
}

/**
 * Action for bundling TypeScript/JavaScript using tsdown (Rolldown-based bundler).
 */
export class TsdownAction extends Action<TsdownActionOptions> {
    readonly name = "TsdownAction";

    describe(): string {
        return "Bundle TypeScript/JavaScript files using tsdown (Rolldown-based bundler)";
    }

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
     * Build tsdown CLI arguments from options
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
     * Run tsdown with the given arguments
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
