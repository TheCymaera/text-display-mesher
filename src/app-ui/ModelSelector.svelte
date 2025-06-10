<script lang="ts" module>
	import mountainrayModelURL from '../assets/mountainray/model.glb?url';
	import mountainrayJuvenileModelURL from '../assets/mountainray/juvenile_model.glb?url';
	import suzanneModelText from '../assets/suzanne/model.obj?raw';
	import utahTeapot from '../assets/utah-teapot/model.obj?raw';

	const mountainrayPromise = new GLTFLoader().loadAsync(mountainrayModelURL);
	const mountainrayJuvenilePromise = new GLTFLoader().loadAsync(mountainrayJuvenileModelURL);

	export const mountainrayMesh = fixGLTFMaterials((await mountainrayPromise).scene);
	export const mountainrayJuvenileMesh = fixGLTFMaterials((await mountainrayJuvenilePromise).scene);
	export const suzanneMesh = createObjMesh(suzanneModelText, new THREE.MeshStandardMaterial());
	export const utahTeapotMesh = createObjMesh(utahTeapot, new THREE.MeshStandardMaterial());
	suzanneMesh.applyMatrix4(new THREE.Matrix4().makeScale(0.5, 0.5, 0.5));
	utahTeapotMesh.applyMatrix4(new THREE.Matrix4().makeScale(0.3, 0.3, 0.3));
	mountainrayJuvenileMesh.applyMatrix4(new THREE.Matrix4().makeScale(0.5, 0.5, 0.5));

	function fixGLTFMaterials(mesh: THREE.Object3D) {
		// Recreate materials.
		// https://discourse.threejs.org/t/textured-objects-invisible-after-importing-as-gltf-from-blender/58277
		mesh.traverse((child) => {
			if (!(child instanceof THREE.Mesh)) return;

			const old = child.material as Partial<THREE.MeshStandardMaterial>;

			child.material = new THREE.MeshStandardMaterial({
				color: old.color,
				map: old.map,
				emissiveMap: old.emissiveMap,
				emissive: old.emissive,
				emissiveIntensity: old.emissiveIntensity,
			});
		});
		return mesh;
	}
	
	function createObjMesh(objText: string, material: THREE.Material) {
		const mesh = new OBJLoader().parse(objText);
		mesh.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.material = material;
			}
		});
		return mesh;
	}
</script>
<script lang="ts">
	import * as THREE from 'three';
	import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import Button from '../ui-components/Button.svelte';
	import FileField from '../ui-components/FileField.svelte';
	import TextureField from './TextureField.svelte';
	import { loadImageAsCanvas } from '../utilities/misc';
	
	let { mesh = $bindable(), onUpdateMaterial }: { mesh: THREE.Object3D, onUpdateMaterial: ()=>void } = $props();
	
	let textureInput: THREE.Color | THREE.Texture = $state(new THREE.Color(0xffffff));
	let emissionInput: THREE.Texture | undefined = $state(undefined);
	
	type Tab = 'obj' | 'gltf' | 'presets';
	let activeTab: Tab = $state('presets');
	
	const objFileMaterial = new THREE.MeshStandardMaterial();
	
	let modelFile: File | null = $state(null);
	let textureFiles: File[] = $state([]);
	let loadingError: { message: string, details: string, hint: string } | null = $state(null);
	
	const presetMeshes = [mountainrayMesh, suzanneMesh, utahTeapotMesh];
	
	// Update the objMaterial when texture or emission changes
	$effect(() => {
		objFileMaterial.color = new THREE.Color(0xffffff);
		objFileMaterial.map = null;
		objFileMaterial.emissiveMap = null;
		objFileMaterial.emissive = new THREE.Color(0x000000);
		objFileMaterial.emissiveIntensity = 0;
		
		if (textureInput instanceof THREE.Color) {
			objFileMaterial.color = textureInput;
		} else {
			objFileMaterial.map = textureInput;
		}
		
		if (emissionInput) {
			objFileMaterial.emissiveMap = emissionInput;
			objFileMaterial.emissive = new THREE.Color(0xffffff);
			objFileMaterial.emissiveIntensity = 1;
		}
		
		objFileMaterial.needsUpdate = true;
		onUpdateMaterial();
	});

	async function loadGLTF() {
		if (!modelFile) return;
		
		const contents = await modelFile.arrayBuffer()
		
			
		const textureMap = new Map<string, string>();
		for (const file of textureFiles) {
			const url = URL.createObjectURL(file);
			textureMap.set(file.name.toLowerCase(), url);
		}

		const loadManager = new THREE.LoadingManager();
		loadManager.setURLModifier((url) => {
			const filename = url.split('/').pop()!.toLowerCase();
			return textureMap.get(filename) ?? url
		});
		const loader = new GLTFLoader(loadManager);


		const loaded = await loader.parseAsync(contents, '').finally(() => {
			// Clean up
			for (const url of textureMap.values()) {
				URL.revokeObjectURL(url);
			}
		});

		mesh = fixGLTFMaterials(loaded.scene)
	}
</script>

<div>
	<h3 class="text-lg font-semibold">Model</h3>

	<!-- Tab Selector -->
	<div class="flex mb-4 border-b border-b-divider">
		{@render tabButton({
			text: 'Examples',
			active: activeTab === 'presets',
			onClick: () => activeTab = 'presets'
		})}
		{@render tabButton({
			text: 'OBJ',
			active: activeTab === 'obj',
			onClick: () => activeTab = 'obj'
		})}
		{@render tabButton({
			text: 'GLTF',
			active: activeTab === 'gltf',
			onClick: () => activeTab = 'gltf'
		})}
	</div>
	
	{@render {
		presets: presetTab,
		gltf: gltfTab,
		obj: objTab
	}[activeTab]()}
</div>

{#snippet tabButton(options: { text: string, active: boolean, onClick: () => void })}
	<button 
		class="
			py-2 px-4 border-b-3 transition-colors
			outline-[3px] outline-transparent focus-visible:outline-primary-500 outline-offset-[-3px]
			{options.active ? 'border-primary text-primary-500' : 'text-onSurfaceContainer border-transparent cursor-pointer'}
		" 
		onclick={options.onClick}
		>
		{options.text}
	</button>
{/snippet}


{#snippet presetTab()}
	<div class="flex flex-wrap gap-2">
		{#each [
			{ name: 'Mountainray', mesh: mountainrayMesh },
			{ name: 'Mountainray Juvenile', mesh: mountainrayJuvenileMesh },
			{ name: 'Suzanne', mesh: suzanneMesh },
			{ name: 'Utah Teapot', mesh: utahTeapotMesh }
		] as preset}
			<Button
				variant={preset.mesh === mesh ? 'filled' : 'outlined'}
				className="!py-1 !px-3 text-sm flex-shrink-0"
				onPress={() => mesh = preset.mesh}
			>
				{preset.name}
			</Button>
		{/each}
	</div>
{/snippet}

{#snippet gltfTab()}
	<div class="space-y-6">
		<FileField 
			label="GLTF/GLB Model File"
			accept=".gltf,.glb"
			onChange={async files => {
				const file = files[0];
				if (!file) return;
				
				modelFile = file;
				loadingError = null;

				try {
					await loadGLTF();
				} catch (error) {
					console.error('Failed to load GLTF model:', error);
					loadingError = {
						message: 'Failed to load GLTF model',
						details: error instanceof Error ? error.message : String(error),
						hint: file.name.endsWith('.gltf') ? 
							'Your GLTF file might reference external textures. Please upload them above.' :
							'There was a problem with your model file. Check the format and try again.'
					};
				}
			}}
		/>
		
		{#if modelFile && modelFile.name.endsWith('.gltf')}
			<div class="mt-4">
				<FileField 
					label="GLTF Assets"
					accept="image/*,,.bin"
					className="mb-3"
					multiple={true}
					onChange={async files => {
						textureFiles = [...files];
						
						try {
							await loadGLTF();
							loadingError = null;
						} catch (error) {
							console.error('Failed to load GLTF model with assets:', error);
							loadingError = {
								message: 'Failed to load GLTF model with assets',
								details: error instanceof Error ? error.message : String(error),
								hint: 'Make sure all referenced assets are included.'
							};
						}
					}}
				/>
			</div>
		{/if}
		
		{#if loadingError}
			<div class="p-3 bg-error-100 border border-error-300 rounded-md text-error-700">
				<div class="font-medium">{loadingError.message}</div>
				<div class="text-sm mt-1">{loadingError.hint}</div>
				<div class="text-xs mt-2 font-mono bg-black/5 p-2 rounded">{loadingError.details}</div>
			</div>
		{/if}
		
		<div class="text-sm opacity-70">
			GLTF/GLB file support is experimental. GLB files contain all needed textures, while GLTF files may require additional texture files.
		</div>
	</div>
{/snippet}

{#snippet objTab()}
	<div class="space-y-6">
		<FileField 
			label="OBJ Model File"
			accept=".obj"
			onChange={async files => {
				const file = files[0];
				if (!file) return;


				if (presetMeshes.includes(mesh)) {
					textureInput = new THREE.Color(0xffffff);
					emissionInput = undefined;
				}
				
				mesh = createObjMesh(await file?.text() ?? "", objFileMaterial)
			}}
		/>
		
		<TextureField 
			label="Texture"
			bind:value={textureInput}
		/>
		
		<FileField 
			accept="image/*"
			onChange={async files => {
				const file = files[0];

				if (file) {
					emissionInput = new THREE.CanvasTexture(await loadImageAsCanvas(file));
				} else {
					emissionInput = undefined;
				}
			}}
		>
			{#snippet label()}
				Emission Map <small class="opacity/70">(Optional)</small>
			{/snippet}
		</FileField>
	</div>
{/snippet}