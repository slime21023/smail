import { builtinBlocks } from './builtins.js';
import type { BlockDefinition } from './types.js';

/** Registry entries are heterogeneous — each definition has its own props shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyBlockDefinition = BlockDefinition<any>;

export type BlockRegistry = ReadonlyMap<string, AnyBlockDefinition>;

/**
 * Build a block registry from the built-in blocks plus optional custom ones.
 * Custom definitions with the same `type` override built-ins.
 */
export function createRegistry(custom: AnyBlockDefinition[] = []): BlockRegistry {
	const registry = new Map<string, AnyBlockDefinition>();
	for (const def of [...builtinBlocks, ...custom]) {
		registry.set(def.type, def);
	}
	return registry;
}

export const defaultRegistry: BlockRegistry = createRegistry();
