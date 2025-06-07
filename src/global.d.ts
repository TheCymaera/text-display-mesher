import "vite/client";
import "vite-plugin-arraybuffer/types";
import "@total-typescript/ts-reset";
/// <reference types="svelte" />

declare global {
	interface ObjectConstructor {
		entries<T>(o: T): [keyof T, T[keyof T]][];
	}
}

