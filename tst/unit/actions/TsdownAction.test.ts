import { TsdownAction } from "../../../src/actions/TsdownAction/TsdownAction.js";

describe("TsdownAction", () => {
    let action: TsdownAction;

    beforeEach(() => {
        action = new TsdownAction();
    });

    describe("name", () => {
        it("should return the action name", () => {
            expect(action.name).toBe("TsdownAction");
        });
    });

    describe("describe", () => {
        it("should return a description", () => {
            expect(action.describe()).toContain("tsdown");
        });
    });

    describe("validateOptions", () => {
        it("should return true for valid options with single entry", () => {
            const result = action.validateOptions({
                entry: "src/index.ts",
            });
            expect(result).toBe(true);
        });

        it("should return true for valid options with multiple entries", () => {
            const result = action.validateOptions({
                entry: ["src/index.ts", "src/cli.ts"],
            });
            expect(result).toBe(true);
        });

        it("should return false when entry is missing", () => {
            const result = action.validateOptions({
                entry: "",
            });
            expect(result).toBe(false);
        });

        it("should return false when entry array is empty", () => {
            const result = action.validateOptions({
                entry: [],
            });
            expect(result).toBe(false);
        });

        it("should return true for valid format string", () => {
            const result = action.validateOptions({
                entry: "src/index.ts",
                format: "esm",
            });
            expect(result).toBe(true);
        });

        it("should return true for valid format array", () => {
            const result = action.validateOptions({
                entry: "src/index.ts",
                format: ["esm", "cjs"],
            });
            expect(result).toBe(true);
        });

        it("should return false for invalid format", () => {
            const result = action.validateOptions({
                entry: "src/index.ts",
                format: "invalid" as "esm",
            });
            expect(result).toBe(false);
        });

        it("should return false for invalid format in array", () => {
            const result = action.validateOptions({
                entry: "src/index.ts",
                format: ["esm", "invalid" as "cjs"],
            });
            expect(result).toBe(false);
        });

        it("should return true for valid platform", () => {
            const result = action.validateOptions({
                entry: "src/index.ts",
                platform: "node",
            });
            expect(result).toBe(true);
        });

        it("should return false for invalid platform", () => {
            const result = action.validateOptions({
                entry: "src/index.ts",
                platform: "invalid" as "node",
            });
            expect(result).toBe(false);
        });

        it("should return true for sourcemap boolean", () => {
            const result = action.validateOptions({
                entry: "src/index.ts",
                sourcemap: true,
            });
            expect(result).toBe(true);
        });

        it("should return true for sourcemap inline", () => {
            const result = action.validateOptions({
                entry: "src/index.ts",
                sourcemap: "inline",
            });
            expect(result).toBe(true);
        });

        it("should return true with all valid options", () => {
            const result = action.validateOptions({
                entry: "src/index.ts",
                outDir: "dist",
                format: ["esm", "cjs"],
                dts: true,
                minify: true,
                sourcemap: true,
                clean: true,
                external: ["lodash"],
                target: "es2022",
                platform: "node",
                treeshake: true,
            });
            expect(result).toBe(true);
        });
    });

    describe("buildArgs", () => {
        // Access private method via any
        const buildArgs = (opts: Parameters<typeof action.validateOptions>[0]) => {
            return (action as any).buildArgs(opts);
        };

        it("should include entry point", () => {
            const args = buildArgs({ entry: "src/index.ts" });
            expect(args).toContain("src/index.ts");
        });

        it("should include multiple entry points", () => {
            const args = buildArgs({ entry: ["src/index.ts", "src/cli.ts"] });
            expect(args).toContain("src/index.ts");
            expect(args).toContain("src/cli.ts");
        });

        it("should add --out-dir for outDir", () => {
            const args = buildArgs({ entry: "src/index.ts", outDir: "dist" });
            expect(args).toContain("--out-dir");
            expect(args).toContain("dist");
        });

        it("should add --format for single format", () => {
            const args = buildArgs({ entry: "src/index.ts", format: "esm" });
            expect(args).toContain("--format");
            expect(args).toContain("esm");
        });

        it("should add --format for multiple formats", () => {
            const args = buildArgs({ entry: "src/index.ts", format: ["esm", "cjs"] });
            expect(args).toContain("--format");
            expect(args).toContain("esm,cjs");
        });

        it("should add --dts for dts option", () => {
            const args = buildArgs({ entry: "src/index.ts", dts: true });
            expect(args).toContain("--dts");
        });

        it("should add --minify for minify option", () => {
            const args = buildArgs({ entry: "src/index.ts", minify: true });
            expect(args).toContain("--minify");
        });

        it("should add --sourcemap for sourcemap true", () => {
            const args = buildArgs({ entry: "src/index.ts", sourcemap: true });
            expect(args).toContain("--sourcemap");
        });

        it("should add --sourcemap inline for inline sourcemap", () => {
            const args = buildArgs({ entry: "src/index.ts", sourcemap: "inline" });
            expect(args).toContain("--sourcemap");
            expect(args).toContain("inline");
        });

        it("should add --clean for clean option", () => {
            const args = buildArgs({ entry: "src/index.ts", clean: true });
            expect(args).toContain("--clean");
        });

        it("should add --external for each external package", () => {
            const args = buildArgs({ entry: "src/index.ts", external: ["lodash", "react"] });
            const externalCount = args.filter((a: string) => a === "--external").length;
            expect(externalCount).toBe(2);
            expect(args).toContain("lodash");
            expect(args).toContain("react");
        });

        it("should add --global-name for globalName", () => {
            const args = buildArgs({ entry: "src/index.ts", globalName: "MyLib" });
            expect(args).toContain("--global-name");
            expect(args).toContain("MyLib");
        });

        it("should add --target for target", () => {
            const args = buildArgs({ entry: "src/index.ts", target: "es2022" });
            expect(args).toContain("--target");
            expect(args).toContain("es2022");
        });

        it("should add --tsconfig for tsconfig", () => {
            const args = buildArgs({ entry: "src/index.ts", tsconfig: "tsconfig.build.json" });
            expect(args).toContain("--tsconfig");
            expect(args).toContain("tsconfig.build.json");
        });

        it("should add --watch for watch option", () => {
            const args = buildArgs({ entry: "src/index.ts", watch: true });
            expect(args).toContain("--watch");
        });

        it("should add --no-treeshake when treeshake is false", () => {
            const args = buildArgs({ entry: "src/index.ts", treeshake: false });
            expect(args).toContain("--no-treeshake");
        });

        it("should add --define for each define entry", () => {
            const args = buildArgs({ 
                entry: "src/index.ts", 
                define: { 
                    "process.env.NODE_ENV": '"production"',
                    "__VERSION__": '"1.0.0"'
                } 
            });
            const defineCount = args.filter((a: string) => a === "--define").length;
            expect(defineCount).toBe(2);
        });

        it("should add --platform for platform", () => {
            const args = buildArgs({ entry: "src/index.ts", platform: "browser" });
            expect(args).toContain("--platform");
            expect(args).toContain("browser");
        });

        it("should add --no-bundle when bundle is false", () => {
            const args = buildArgs({ entry: "src/index.ts", bundle: false });
            expect(args).toContain("--no-bundle");
        });

        it("should add --config for configPath", () => {
            const args = buildArgs({ entry: "src/index.ts", configPath: "tsdown.config.ts" });
            expect(args).toContain("--config");
            expect(args).toContain("tsdown.config.ts");
        });
    });
});
