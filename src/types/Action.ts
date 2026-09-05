/**
 * Abstract base class for all kist actions.
 *
 * Subclasses implement a single unit of pipeline work (e.g. bundling
 * TypeScript/JavaScript with tsdown) and are instantiated once, then
 * exposed through the plugin package's default export (see `src/index.ts`)
 * so that kist's action registry can discover and run them by name. This
 * base class only supplies a consistent logging surface; it does not
 * implement {@link name}, {@link describe}, {@link validateOptions}, or
 * {@link execute} — concrete subclasses must provide all four.
 *
 * @typeParam TOptions - The action-specific options type, typically an
 * interface describing the fields accepted under `options:` for this
 * action in a kist.yaml pipeline step (e.g. `TsdownActionOptions`).
 */
export abstract class Action<TOptions = Record<string, unknown>> {
    /**
     * The unique name of this action. Used to prefix every log line (see
     * {@link logInfo}, {@link logWarning}, {@link logError},
     * {@link logDebug}) and to key the action in kist's action registry —
     * this is the value referenced by `action:` in a kist.yaml pipeline
     * step. Concrete subclasses must set this to a literal matching their
     * class name (e.g. `"TsdownAction"`).
     */
    abstract readonly name: string;

    /**
     * Returns a short, human-readable description of what this action
     * does. Surfaced by kist in help output and pipeline documentation, so
     * it should read as a single, self-contained sentence rather than
     * assuming surrounding context.
     *
     * @returns A one-sentence description of the action's behavior.
     */
    abstract describe(): string;

    /**
     * Validates the provided options before {@link execute} runs.
     * Implementations should check required fields and value types,
     * reporting each problem via {@link logError} and returning `false`
     * rather than throwing — this lets {@link execute} turn a validation
     * failure into a single, clearly-worded thrown `Error` instead of
     * letting kist surface a raw type-mismatch exception.
     *
     * @param options - The options to validate, as supplied by a kist.yaml
     * pipeline step.
     * @returns `true` if the options are valid and execution may proceed,
     * `false` otherwise.
     */
    abstract validateOptions(options: TOptions): boolean;

    /**
     * Executes the action with the provided options. This is where the
     * action's actual work happens (invoking a CLI, transforming files,
     * etc.). Implementations should call {@link validateOptions} first and
     * throw if it fails, so kist's pipeline runner halts on invalid
     * configuration rather than proceeding with partial or undefined
     * options.
     *
     * @param options - The action-specific options for this run.
     * @returns A promise that resolves once the action's work completes
     * successfully.
     * @throws Implementations should throw when options are invalid or the
     * underlying work fails, so kist can stop the pipeline and report the
     * error to the user.
     */
    abstract execute(options: TOptions): Promise<void>;

    /**
     * Logs an informational message, prefixed with the action's
     * {@link name}. Intended for normal, always-visible progress output
     * (e.g. "Bundling 2 entry point(s) with tsdown").
     *
     * @param message - The message to log.
     */
    protected logInfo(message: string): void {
        console.log(`[${this.name}] ${message}`);
    }

    /**
     * Logs a warning message, prefixed with the action's {@link name}.
     * Intended for recoverable issues that should be surfaced to the user
     * but do not stop execution.
     *
     * @param message - The warning message to log.
     */
    protected logWarning(message: string): void {
        console.warn(`[${this.name}] WARNING: ${message}`);
    }

    /**
     * Logs an error message, prefixed with the action's {@link name}.
     * Intended to be called immediately before rethrowing or throwing an
     * error from {@link execute}, so the console output captures both the
     * human-readable context and the underlying error object.
     *
     * @param message - A human-readable description of what failed.
     * @param error - The underlying error or rejection reason, if any.
     */
    protected logError(message: string, error?: unknown): void {
        console.error(`[${this.name}] ERROR: ${message}`, error || "");
    }

    /**
     * Logs a debug message, prefixed with the action's {@link name}. Only
     * emitted when the `DEBUG` environment variable is set to a truthy
     * value; otherwise this is a no-op. Use for verbose, developer-facing
     * detail that would be noisy in normal pipeline runs (e.g. the exact
     * CLI command being spawned).
     *
     * @param message - The debug message to log.
     */
    protected logDebug(message: string): void {
        if (process.env.DEBUG) {
            console.debug(`[${this.name}] DEBUG: ${message}`);
        }
    }
}

/**
 * Action options type - a generic record of key-value pairs. Concrete
 * actions should extend this with their own strongly-typed option fields
 * (see {@link TsdownActionOptions} in `TsdownAction.ts` for an example)
 * rather than relying on the untyped index signature directly.
 */
export type ActionOptionsType = Record<string, unknown>;

/**
 * Plugin interface for kist action packages. A package's default export
 * (see `src/index.ts`) should satisfy this interface so the kist CLI can
 * discover its metadata and the actions it registers.
 */
export interface ActionPlugin {
    /** Plugin package name (e.g. the npm package name) */
    name?: string;
    /** Plugin version, expected to follow semantic versioning */
    version: string;
    /** Short human-readable description of what the plugin provides */
    description?: string;
    /** Plugin author name or organization */
    author?: string;
    /** URL of the plugin's source repository */
    repository?: string;
    /** Keywords for discoverability (e.g. on npm) */
    keywords?: string[];
    /**
     * Static map of action names to action class constructors. Prefer
     * `registerActions()` for plugins that need to construct this map
     * dynamically; if both are present, callers should treat
     * `registerActions()` as authoritative.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actions?: Record<string, new () => Action<any>>;
    /**
     * Factory that returns the map of action names to action class
     * constructors registered by this plugin. Called by the kist CLI to
     * discover which actions the plugin provides.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerActions?: () => Record<string, new () => Action<any>>;
}
