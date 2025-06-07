<script lang="ts">
	import type { Snippet } from "svelte";
	import { generateElementID } from "../utilities/misc";

	interface Props {
		accept: string,
		label: string | Snippet,
		onChange?: (file: File) => void,
		className?: string,
	}

	let {
		accept,
		label,
		onChange = () => {},
		className = "",
	}: Props = $props();

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			onChange(input.files[0]!);
		}
	}

	const id = generateElementID("file-field");
</script>

<div class={className}>
	<label 
		class="block mb-2 font-medium" 
		for={id} 
	>
		{#if typeof label === 'string'}
			{label}
		{:else}
			{@render label()}
		{/if}
	</label>
	<input 
		type="file" 
		{accept}
		onchange={handleFileChange}
		{id}
		class="
			block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-onSurface/10 file:text-primary-500 hover:file:bg-primary-300/20
			cursor-pointer file:cursor-pointer
		"
	/>
</div>
