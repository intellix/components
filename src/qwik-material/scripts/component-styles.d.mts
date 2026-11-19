// Types for component-styles.mjs, imported by component-styles(-render).spec.
export declare const LAYER: string;
export declare const LAYER_ORDER: string;
export declare const COMPONENT_STYLES: Record<string, string>;
export declare const COMPONENT_STYLE_ENTRIES: string[];
export declare function wrapInLayer(css: string, options?: {compressed?: boolean}): string;
export declare function styleHookName(entry: string): string;
export declare function componentStylePaths(entry: string): {scss: string; module: string};
export declare function compileComponentStyles(entry: string): Promise<string>;
export declare function renderStylesModule(entry: string): Promise<string>;
export declare function writeComponentStyles(): Promise<string[]>;
export declare function staleComponentStyles(): Promise<string[]>;
export declare function staleMessage(stale: string[]): string;
