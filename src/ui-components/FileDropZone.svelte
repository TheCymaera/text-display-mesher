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

	let lastDroppedFileName = "No file selected";

	function openDialog(event: MouseEvent) {
		event.preventDefault();
		const input = document.createElement("input");
		input.type = "file";
		input.accept = accept;
		input.style.display = "none";
		input.id = id;
		input.addEventListener("change", handleFileChange);
		document.body.appendChild(input);
		input.click();
		document.body.removeChild(input);
	}

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			onChange(input.files[0]!);
			lastDroppedFileName = input.files[0]!.name;
		}
	}

	const id = generateElementID("file-field");
</script>

<div class={className}>
	<div 
		class="block mb-2 font-medium" 
	>
		{#if typeof label === 'string'}
			{label}
		{:else}
			{@render label()}
		{/if}
	</div>
	<div class="flex items-center gap-4">
		<button 
			class="
				max-w-max
				text-sm py-2 px-4 rounded border-0 font-semibold bg-onSurface/10 text-primary-500 hover:bg-primary-300/20
				cursor-pointer
			"
			onclick={openDialog}
		>
			Choose File
		</button>
		<!--<span class="text-sm text-onSurface/70">
			{lastDroppedFileName}
		</span>-->
	</div>
</div>
