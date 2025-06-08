<script lang="ts" module>
	import mountainrayModelURL from '../assets/mountainray/model.glb?url';

	const mountainrayMesh = fixGLTFMesh((await new GLTFLoader().loadAsync(mountainrayModelURL)).scene);

	function fixGLTFMesh(mesh: THREE.Group): THREE.Group {
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

</script>
<script lang="ts">
	import * as THREE from 'three';
	import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import Button from '../ui-components/Button.svelte';
	import FileDropZone from '../ui-components/FileDropZone.svelte';
	import TextureField from './TextureField.svelte';
	import { loadImageAsCanvas } from '../utilities/misc';
	
	// Import preset models
	import suzanneModelText from '../assets/suzanne/model.obj?raw';
	import utahTeapot from '../assets/utah-teapot/model.obj?raw';
	
	// Props
	let { mesh = $bindable(), onUpdateMaterial }: { mesh: THREE.Group, onUpdateMaterial: ()=>void } = $props();
	
	let textureInput: THREE.Color | THREE.Texture = $state(new THREE.Color(0xffffff));
	let emissionInput: THREE.Texture | undefined = $state(undefined);
	
	// Tabs
	type Tab = 'obj' | 'gltf' | 'presets';
	let activeTab: Tab = $state('presets');
	
	// Create a material for OBJ models
	const objMaterial = new THREE.MeshStandardMaterial();
	
	// Create preset materials to avoid linking with objMaterial
	//const mountainrayMaterial = new THREE.MeshStandardMaterial();
	const suzanneMaterial = new THREE.MeshStandardMaterial();
	const teapotMaterial = new THREE.MeshStandardMaterial();
	
	// Create preset meshes with their own materials
	//const mountainrayMesh = createObjMesh(mountainrayModelText, mountainrayMaterial);
	const suzanneMesh = createObjMesh(suzanneModelText, suzanneMaterial);
	const utahTeapotMesh = createObjMesh(utahTeapot, teapotMaterial);
	
	// Apply transformations to preset meshes
	suzanneMesh.applyMatrix4(new THREE.Matrix4().makeScale(0.5, 0.5, 0.5));
	utahTeapotMesh.applyMatrix4(new THREE.Matrix4().makeScale(0.3, 0.3, 0.3));
	utahTeapotMesh.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -0.3, 0));
	
	const presetMeshes = [mountainrayMesh, suzanneMesh, utahTeapotMesh];
	
	// Update the objMaterial when texture or emission changes
	$effect(() => {
		objMaterial.color = new THREE.Color(0xffffff);
		objMaterial.map = null;
		objMaterial.emissiveMap = null;
		objMaterial.emissive = new THREE.Color(0x000000);
		objMaterial.emissiveIntensity = 0;
		
		if (textureInput instanceof THREE.Color) {
			objMaterial.color = textureInput;
		} else {
			objMaterial.map = textureInput;
		}
		
		if (emissionInput) {
			objMaterial.emissiveMap = emissionInput;
			objMaterial.emissive = new THREE.Color(0xffffff);
			objMaterial.emissiveIntensity = 1;
		}
		
		objMaterial.needsUpdate = true;
		onUpdateMaterial();
	});
	
	function createObjMesh(objText: string, material: THREE.Material): THREE.Group {
		const mesh = new OBJLoader().parse(objText);
		mesh.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.material = material;
			}
		});
		return mesh;
	}
	
	//(async () => {
	//	mountainrayMaterial.map = new THREE.CanvasTexture(await loadImageAsCanvas(mountainrayTexture));
	//	mountainrayMaterial.emissiveMap = new THREE.CanvasTexture(await loadImageAsCanvas(mountainrayEmission));
	//	mountainrayMaterial.emissive = new THREE.Color(0xffffff);
	//	mountainrayMaterial.emissiveIntensity = 1;
	//	mountainrayMaterial.needsUpdate = true;
	//})();

	suzanneMaterial.color = new THREE.Color(0xffffff);
	suzanneMaterial.map = null;
	suzanneMaterial.emissiveMap = null;
	suzanneMaterial.emissive = new THREE.Color(0x000000);
	suzanneMaterial.emissiveIntensity = 0;

	teapotMaterial.color = new THREE.Color(0xffffff);
	teapotMaterial.map = null;
	teapotMaterial.emissiveMap = null;
	teapotMaterial.emissive = new THREE.Color(0x000000);
	teapotMaterial.emissiveIntensity = 0;
	
	// Initialize with mountainray
	mesh = mountainrayMesh;
</script>

<div>
	<h3 class="text-lg font-semibold">Model</h3>

	<!-- Tab Selector -->
	<div class="flex space-x-2 mb-4 border-b border-b-divider">
		<button 
			class="py-2 px-4 border-b-2 {activeTab === 'presets' ? 'border-primary text-primary-500' : 'text-onSurfaceContainer border-transparent cursor-pointer'}" 
			onclick={() => activeTab = 'presets'}>
			Examples
		</button>
		<button 
			class="py-2 px-4 border-b-2 {activeTab === 'obj' ? 'border-primary text-primary-500' : 'text-onSurfaceContainer border-transparent cursor-pointer'}" 
			onclick={() => activeTab = 'obj'}>
			OBJ
		</button>
		<button 
			class="py-2 px-4 border-b-2 {activeTab === 'gltf' ? 'border-primary text-primary-500' : 'text-onSurfaceContainer border-transparent cursor-pointer'}" 
			onclick={() => activeTab = 'gltf'}>
			GLTF
		</button>
	</div>
	
	{@render {
		presets: presetTab,
		gltf: gltfTab,
		obj: objTab
	}[activeTab]()}
</div>


{#snippet presetTab()}
	<div class="grid grid-cols-3 gap-2 mb-4">
		{#each [
			{ name: 'Mountainray', mesh: mountainrayMesh },
			{ name: 'Suzanne', mesh: suzanneMesh },
			{ name: 'Utah Teapot', mesh: utahTeapotMesh }
		] as preset}
			<Button
				variant={preset.mesh === mesh ? 'filled' : 'outlined'}
				className="!py-1 !px-0 text-sm"
				onPress={() => mesh = preset.mesh}
			>
				{preset.name}
			</Button>
		{/each}
	</div>
{/snippet}

{#snippet gltfTab()}
	<div class="space-y-6">
		<FileDropZone 
			label="GLTF/GLB Model File"
			accept=".gltf,.glb"
			onChange={async file => {
				if (file) {
					const contents = file.name.endsWith('.glb') ? 
							await file.arrayBuffer() : 
							await file.text();

					try {
						mesh = fixGLTFMesh((await new GLTFLoader().parseAsync(contents, '')).scene);
					} catch (error) {
						console.error('Failed to load GLTF model:', error);
						alert('Failed to load GLTF model. Check console for details.');
					}
				}
			}}
		/>
		<div class="text-sm opacity-70">
			GLTF/GLTB file support is experimental.
		</div>
	</div>
{/snippet}

{#snippet objTab()}
	<div class="space-y-6">
		<FileDropZone 
			label="OBJ Model File"
			accept=".obj"
			onChange={async file => {
				if (presetMeshes.includes(mesh)) {
					textureInput = new THREE.Color(0xffffff);
					emissionInput = undefined;
				}
				
				mesh = createObjMesh(await file?.text() ?? "", objMaterial)
			}}
		/>
		
		<TextureField 
			label="Texture"
			bind:value={textureInput}
		/>
		
		<FileDropZone 
			accept="image/*"
			onChange={async file => {
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
		</FileDropZone>
	</div>
{/snippet}