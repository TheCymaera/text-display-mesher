<script lang="ts">
import NumberField from '../ui-components/NumberField.svelte';
import * as THREE from 'three';
import MeshViewer from './MeshViewer.svelte';
import { createNoiseImage, loadImageAsCanvas } from '../utilities/misc';
import { meshToTextDisplays, textDisplaysToMesh, textDisplaysToSummonCommand } from '../utilities/textDisplays';
import suzanneModelText from '../assets/suzanne/model.obj?raw';
import mountainrayModelText from '../assets/mountainray/model.obj?raw';
import mountainrayTexture from '../assets/mountainray/texture.png?url';
import mountainrayEmission from '../assets/mountainray/emission.png?url';
import utahTeapot from '../assets/utah-teapot/model.obj?raw';
import Button from '../ui-components/Button.svelte';
import FileField from '../ui-components/FileDropZone.svelte';
import TextureField from './TextureField.svelte';
import { parseObjFileContents } from '../utilities/parseObjFile';
import { flatColorShader, canvasSamplerShader, RANDOM_COLOR_SHADER, shadowShader, threeJSMaterialSamplerShader } from '../utilities/triangleShader';


let meshView: "original" | "text" = $state("text");

// Inputs
let mesh = $state.raw(parseObjFileContents(""));
let textureInput: HTMLCanvasElement | THREE.Color | 'random' = $state.raw(new THREE.Color(0xffffff));
let emissionInput: HTMLCanvasElement | undefined = $state.raw(undefined);
let lightPosition = $state({ x: 1, y: 1, z: 1 })
let minBrightness = $state(0.5);
let maxBrightness = $state(1.0);

// Derived
const originalMeshMaterial = $derived.by(() => {
	const material = new THREE.MeshStandardMaterial();

	if (textureInput instanceof THREE.Color) {
		material.color = textureInput;
	}
	
	if (textureInput instanceof HTMLCanvasElement) {
		material.map = new THREE.CanvasTexture(textureInput);
	}
	
	if (textureInput === 'random') {
		material.map = new THREE.CanvasTexture(createNoiseImage(100, 100));
	}

	if (emissionInput) {
		material.emissiveMap = new THREE.CanvasTexture(emissionInput);
		material.emissive = new THREE.Color(0xffffff);
		material.emissiveIntensity = 1;
	}

	return material;
})

const textureShader = $derived.by(()=>{
	const base = //threeJSMaterialSamplerShader(originalMeshMaterial);
		textureInput instanceof HTMLCanvasElement ? canvasSamplerShader(textureInput) : 
		textureInput instanceof THREE.Color ? flatColorShader(textureInput) :
		RANDOM_COLOR_SHADER

	return shadowShader(base, {
		light: new THREE.Vector3(lightPosition.x, lightPosition.y, lightPosition.z).normalize(),
		minBrightness,
		maxBrightness,
	})
});
const emissionShader = $derived(emissionInput ? canvasSamplerShader(emissionInput) : flatColorShader(new THREE.Color(0x000000)));
const textDisplays = $derived(meshToTextDisplays(mesh, textureShader, emissionShader))
const textDisplayMesh = $derived(textDisplaysToMesh(textDisplays));
const summonCommands = $derived(textDisplaysToSummonCommand(textDisplays));

async function loadMountainray() {
	mesh = parseObjFileContents(mountainrayModelText);
	textureInput = await loadImageAsCanvas(mountainrayTexture);
	emissionInput = await loadImageAsCanvas(mountainrayEmission);
}

async function loadSuzanne() {
	mesh = parseObjFileContents(suzanneModelText);
	textureInput = new THREE.Color(0xffffff);
	emissionInput = undefined;
}

async function loadUtahTeapot() {
	mesh = parseObjFileContents(utahTeapot);
	textureInput = new THREE.Color(0xffffff);
	emissionInput = undefined;
}

loadMountainray()

</script>

<div class="grid grid-cols-[400px_1fr]">
	<!-- Sidebar -->
	<div class="bg-surfaceContainer text-onSurfaceContainer p-4 overflow-y-auto">
		<h2 class="text-xl font-bold mb-4">Model</h2>
		
		<div class="space-y-6">
			<FileField 
				label="OBJ Model File"
				accept=".obj"
				onChange={async file => mesh = parseObjFileContents(await file?.text() ?? "")}
			/>
			
			<TextureField 
				label="Texture"
				bind:value={textureInput}
			/>
			
			<FileField 
				accept="image/*"
				onChange={async file => emissionInput = file ? await loadImageAsCanvas(file) : undefined}
			>
				{#snippet label()}
					Emission Map <small class="opacity/70">(Optional)</small>
				{/snippet}
			</FileField>
			
			<div class="pt-4 border-t border-t-border">
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
				<small>Direction of the light source</small>
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
		</div>

		<br>


		<h2 class="text-xl font-bold mb-4">Output</h2>
		
		<div class="bg-red-100 text-red-800 p-3 rounded-md mb-4 border border-red-300">
			<h3 class="font-bold text-lg">⚠️ Warning</h3>
			<p>Adding this many entities to your world can cause severe performance issues or even corrupt your save file. <strong>Always backup your world before using these commands.</strong></p>
		</div>
		
		<div class="bg-sky-100 text-sky-800 p-3 rounded-md mb-4 border border-sky-300">
			<p>Commands are split into batches due to Minecraft's command length limits.</p>
		</div>
		
		<div>Text Displays: {textDisplays.length}</div>
		<div>Commands: {summonCommands.commands.length}</div>

		<br>

		<div>Min Command Length: {Math.min(...summonCommands.commands.map(cmd => cmd.length))}</div>
		<div>Max Command Length: {Math.max(...summonCommands.commands.map(cmd => cmd.length))}</div>
		<div>Average Command Length: {Math.round(summonCommands.commands.reduce((acc, cmd) => acc + cmd.length, 0) / summonCommands.commands.length)}</div>

		<br>

		<div>Min Batch Size: {Math.min(...summonCommands.batches.map(batch => batch.length))}</div>
		<div>Max Batch Size: {Math.max(...summonCommands.batches.map(batch => batch.length))}</div>
		<div>Average Batch Size: {Math.round(summonCommands.batches.reduce((acc, batch) => acc + batch.length, 0) / summonCommands.batches.length)}</div>

		
		<label for="summon-commands" class="block mb-2 font-medium mt-4">Summon Commands</label>
		<textarea 
			id="summon-commands"
			value={summonCommands.commands.join('\n')}
			class="
				w-full p-2 border border-border rounded-md whitespace-pre resize-none
				font-mono
			"
			rows={summonCommands.commands.length + 1}
			readonly
		></textarea>
	</div>
	
	<!-- Model Viewer -->
	<div class="relative">
		<MeshViewer 
			modelData={meshView === 'original' ? mesh.toThreeJS(originalMeshMaterial) : textDisplayMesh}
			lightPosition={meshView === 'original' ? new THREE.Vector3(lightPosition.x, lightPosition.y, lightPosition.z).normalize() : undefined}
		/>

		<div class="absolute top-4 right-4 rounded-md shadow-md">
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
</div>
