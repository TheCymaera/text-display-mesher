<script lang="ts">
import MainView from "./MainView.svelte";
import AppInfo from "./AppInfo.svelte";
import { fade } from "svelte/transition";

let hash = $state(window.location.hash);
</script>
<svelte:window 
	on:hashchange={()=> hash = window.location.hash}
/>
<svelte:boundary>
	<MainView />

	{#if hash === "#info"}
		<div 
			class="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto"
			transition:fade={{ duration: 200 }}
		>
			<div class="w-full max-w-2xl my-4 md:my-8 md:mt-[10vh]">
				<AppInfo />
			</div>
		</div>
	{/if}

	{#snippet failed(error)}
		<div class="
			absolute inset-0 p-3
			bg-black/50
			overflow-auto
		">
			<div class="
				bg-surfaceContainer text-onSurfaceContainer 
				p-4 rounded-md shadow-md
				w-full max-w-min m-auto
				overflow-auto
			">
				<h1 class="text-xl font-bold">Render Error</h1>
				<p class="whitespace-pre">{error instanceof Error ? error.stack : `${error}`}</p>
			</div>
		</div>
	{/snippet}
</svelte:boundary>