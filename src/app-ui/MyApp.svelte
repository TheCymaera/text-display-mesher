<script lang="ts">
  import ModelLoaderContainer from "./MainView.svelte";

</script>
<svelte:boundary>
	<ModelLoaderContainer />

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