<script lang="ts">
	import Button from '../ui-components/Button.svelte';
	import { githubRepositoryLink, homeLink, youtubeEmbedLink } from './links.js';
</script>

<div class="bg-surfaceContainer text-onSurfaceContainer p-6 rounded-lg max-w-2xl mx-auto">
	<h1 class="text-2xl font-bold mb-4">Minecraft Text Display Mesher</h1>
	
	<p class="mb-4 opacity-80">
		This tool converts 3D meshes into Minecraft text displays. 
	</p>

	<p class="mb-6 opacity-80">
		All files are processed locally in your browser. I never receive your files.
	</p>
	
	<div class="mb-6">
		<h2 class="text-xl font-bold mb-2">How it works</h2>
		<div class="aspect-video max-w-140 mb-2">
			<iframe 
				class="w-full h-full rounded"
				src="{youtubeEmbedLink}" 
				title="Minecraft Text Display Models Explanation" 
				frameborder="0" 
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
				allowfullscreen>
			</iframe>
		</div>
	</div>
	
	<div class="mb-6">
		<h2 class="text-xl font-bold mb-2">GitHub Repository</h2>
		<a 
			href="{githubRepositoryLink}" 
			target="_blank" 
			class="text-primary-500 hover:underline"
		>
			{githubRepositoryLink}
		</a>
	</div>

	
	<div class="mb-6">
		<h2 class="text-xl font-bold mb-2">Other Tools</h2>
		<a 
			href="{homeLink}" 
			target="_blank" 
			class="text-primary-500 hover:underline"
		>
			{homeLink}
		</a>
	</div>
	
	<div class="mt-6 text-right">
		<Button 
			variant="filled" 
			onPress={() => window.location.hash = ""}
		>
			Close
		</Button>
	</div>
</div>
