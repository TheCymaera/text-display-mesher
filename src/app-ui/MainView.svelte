<script lang="ts">
import NumberField from '../ui-components/NumberField.svelte';
import * as THREE from 'three';
import MeshViewer from './MeshViewer.svelte';
import { createShadowProvider, meshToTextDisplays } from '../utilities/textDisplays';
import { textDisplayTrianglesToMesh } from '../utilities/textDisplayRendering';
import { textDisplaysToSummonCommands } from '../utilities/textDisplayCommands';
import Button from '../ui-components/Button.svelte';
import { debouncedState } from '../utilities/svelteUtilities.svelte';
import { fa5_solid_home, fa5_solid_info, fa5_brands_github } from 'fontawesome-svgs';
import CircleButton from '../ui-components/CircleButton.svelte';
import { githubRepositoryLink, homeLink } from './links';
import ModelSelector from './ModelSelector.svelte';

let meshView: "original" | "text" = $state("text");

// Inputs
let mesh: THREE.Group = $state.raw(new THREE.Group());
let lightPosition = $state({ x: 1, y: 1, z: 1 })
let minBrightness = $state(0.3);
let maxBrightness = $state(1.0);

$effect(() => {console.log("Mesh changed", mesh); });

const textDisplaysDebounced = debouncedState({
	delay: 150, 
	deps: () => [mesh, { ...lightPosition }, minBrightness, maxBrightness],	
	value: () => meshToTextDisplays(mesh, createShadowProvider({
		light: new THREE.Vector3(lightPosition.x, lightPosition.y, lightPosition.z).normalize(),
		minBrightness,
		maxBrightness,
	}))
})

const textDisplays = $derived(textDisplaysDebounced.value);
const summonCommandsDebounced = debouncedState({
	delay: 150, 
	deps: () => [textDisplays],
	value: () => textDisplaysToSummonCommands(textDisplays)
});
const summonCommands = $derived(summonCommandsDebounced.value);

function changeButtonText(event: MouseEvent, text: string) {
	const button = event.currentTarget as HTMLButtonElement;
	
	const originalText = button.textContent;
	if (originalText === text) return;

	button.textContent = text;
	setTimeout(() => button.textContent = originalText, 2000);
}
</script>

<div class="grid grid-cols-[25em_1fr]">
	<!-- Sidebar -->
	<div class="bg-surfaceContainer text-onSurfaceContainer p-4 overflow-y-auto">
		<!-- Model Selector Component -->
		<ModelSelector
			bind:mesh={mesh}
			onUpdateMaterial={() => {
				textDisplaysDebounced.invalidate();
			}}
		/>

		<br>
		
		<div class="pt-4 border-t border-t-divider">
			<h3 class="text-lg font-semibold">Lighting</h3>
		
			<div class="grid grid-cols-3 gap-4">
				<NumberField 
					label="X"
					bind:value={lightPosition.x}
				/>
				<NumberField 
					label="Y"
					bind:value={lightPosition.y}
				/>
				<NumberField 
					label="Z"
					bind:value={lightPosition.z}
				/>
			</div>
			<small class="opacity-80">Direction of the light source</small>
			<div class="mb-3"></div>
			
			<div class="grid grid-cols-2 gap-4">
				<NumberField
					label="Min Brightness"
					value={minBrightness}
					onInput={e => minBrightness = e.value}
					hint="Range: 0.0-1.0"
				/>
				
				<NumberField
					label="Max Brightness"
					value={maxBrightness}
					onInput={e => maxBrightness = e.value}
					hint="Range: 0.0-1.0"
				/>
			</div>
		</div>

		<br>

		<h2 class="text-xl font-bold mb-4">Output</h2>
		
		<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-3">
			<h3 class="font-bold text-lg">⚠️ Warning</h3>
			<p>Adding this many entities to your world can cause severe performance issues or even corrupt your save file. <strong>Always backup your world before using these commands.</strong></p>
		</div>
		
		<div class="bg-cyan-100 border border-cyan-400 text-cyan-700 px-4 py-3 rounded mb-3">
			<p>Commands are split into batches due to Minecraft's command length limits.</p>
		</div>
		
		<div>Text Displays: {textDisplays.length}</div>
		<div>Commands: {summonCommands.commands.length}</div>

		<br>

		<div>Command Lengths:</div>
		{@render range(summonCommands.commands.map(cmd => cmd.length))}

		<br>

		<div>Entities Per Command:</div>
		{@render range(summonCommands.batches.map(batch => batch.length))}
		<br>

		{#snippet range(items: number[])}
			<div>
				<span class="opacity-40">Min</span>
				{Math.min(...items)}
				<span class="ml-3 opacity-40">Max</span>
				{Math.max(...items)}
				<span class="ml-3 opacity-40">Avg</span>
				{Math.round(items.reduce((acc, item) => acc + item, 0) / items.length)}
			</div>
		{/snippet}

		<label class="flex justify-between items-center mb-2" for="summon-commands">
			<div class="font-medium">
				Commands
			</div>
			
			<div class="flex gap-2">
				<Button 
					variant={'outlined'} 
					className="!py-1 text-sm"
					onPress={(event) => {
						const commandText = summonCommands.commands.join('\n');
						navigator.clipboard.writeText(commandText);
						changeButtonText(event, 'Copied!');
					}}
				>
					Copy
				</Button>
			</div>
		</label>
		
		<textarea 
			id="summon-commands"
			value={summonCommands.commands.join('\n')}
			class="
				w-full p-3 font-mono whitespace-pre resize-none
				border-[.08rem] border-containerBorder rounded-md bg-transparent
				focus-visible:outline-[3px] outline-primary-500 outline-offset-[-3px]
			"
			rows={summonCommands.commands.length + 1}
			readonly
			onfocus={(e) => (e.target as HTMLTextAreaElement).select()}
		></textarea>
	</div>
	
	<!-- Model Viewer -->
	<div class="relative">
		<MeshViewer 
			modelData={meshView === 'original' ? mesh : textDisplayTrianglesToMesh(textDisplays)}
			lightPosition={meshView === 'original' ? new THREE.Vector3(lightPosition.x, lightPosition.y, lightPosition.z).normalize() : undefined}
		/>

		<div class="absolute top-3 right-3 flex items-center">
			<div class="rounded-md shadow-md">
				<Button 
					variant={meshView === 'original' ? 'filled' : 'outlined'}
					onPress={() => meshView = 'original'}
					className="mr-2"
				>
					Original
				</Button>
				<Button 
					variant={meshView === 'text' ? 'filled' : 'outlined'}
					onPress={() => meshView = 'text'}
				>
					Text Display
				</Button>
			</div>
		</div>

		<div class="absolute bottom-3 right-3 flex flex-col gap-3">
			<a href="{githubRepositoryLink}" target="_blank">
				<CircleButton 
					onPress={() => {}}
					label="GitHub Repository"
				>
					{@html fa5_brands_github}
				</CircleButton>
			</a>

			<a href="{homeLink}" target="_blank">
				<CircleButton 
					onPress={() => {}}
					label="Home"
				>
					{@html fa5_solid_home}
				</CircleButton>
			</a>

			<a href="#info">
				<CircleButton 
					onPress={() => {}}
					label="Show Information"
				>
					{@html fa5_solid_info}
				</CircleButton>
			</a>
		</div>
	</div>
</div>
