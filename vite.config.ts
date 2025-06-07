import * as vite from "vite";
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default vite.defineConfig({
	base: "./",
	root: path.resolve(__dirname, "src"),
	publicDir: path.resolve(__dirname, "static"),

	resolve: {
		conditions: ["browser"]
	},

	build: {
		outDir: path.resolve(__dirname, "dist"),
		emptyOutDir: true,
		target: "esnext",
	},

	plugins: [
		tailwindcss(),
		svelte({
			configFile: path.resolve(__dirname, "svelte.config.js"),
		}),
	],
});