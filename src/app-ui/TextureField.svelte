<script lang="ts">
	import * as THREE from 'three';
	import Button from '../ui-components/Button.svelte';
	import FileField from '../ui-components/FileField.svelte';
	import ColorField from '../ui-components/ColorField.svelte';
	import { untrack } from 'svelte';
	import { createNoiseImage, flatColorCanvas, loadImageAsCanvas } from '../utilities/misc';

	const NOISE_TEXTURE = new THREE.CanvasTexture(createNoiseImage(100, 100));

	type ValueType = THREE.Texture | THREE.Color;
	type ValueTypeName = 'file' | 'color' | 'random';

	interface Props {
		label: string,
		onChange?: (value: ValueType) => void,
		value: ValueType,
		className?: string,
	}

	let {
		label = "Texture",
		onChange = () => {},
		value = $bindable(),
		className = "",
	}: Props = $props();

	function typeOf(value: ValueType): ValueTypeName {
		if (value === NOISE_TEXTURE) return 'random';
		if (value instanceof THREE.Color) return 'color';
		if (value instanceof THREE.Texture) return 'file';
		return 'color';
	}

	let selectedType: ValueTypeName = $state(typeOf(value));
	let didSwitchType: boolean = $state(false);

	$effect(()=>{
		value;
		untrack(()=>{
			if (didSwitchType) return;

			if (value instanceof THREE.Texture) {
				fileInput = value;
				selectedType = 'file';
			} else if (value instanceof THREE.Color) {
				colorInput = "#" + value.getHexString();
				selectedType = 'color';
			} else if (value === NOISE_TEXTURE) {
				selectedType = 'random';
			}
		})
	})
	
	let fileInput: THREE.Texture = $state(new THREE.CanvasTexture(flatColorCanvas(new THREE.Color(0xff00ff))));
	let colorInput: string = $state(value instanceof THREE.Color ? "#" + value.getHexString() : '#ffffff');

	function switchToType(type: 'file' | 'color' | 'random') {
		didSwitchType = true;
		value = ({
			file: fileInput,
			color: new THREE.Color(colorInput),
			random: NOISE_TEXTURE
		} as const)[type];
		onChange(value);
		selectedType = type;

		setTimeout(() => didSwitchType = false, 0);
	}
</script>

<div class={className}>
	<div class="font-medium mb-2">
		{label}
	</div>
		
	<div class="flex gap-2 mb-4">
		<Button 
			variant={selectedType === 'file' ? 'filled' : 'outlined'} 
			onPress={() => switchToType('file')}
			className="!py-1 text-sm"
		>
			File
		</Button>
		<Button 
			variant={selectedType === 'color' ? 'filled' : 'outlined'} 
			onPress={() => switchToType('color')}
			className="!py-1 text-sm"
		>
			Color
		</Button>
		<Button 
			variant={selectedType === 'random' ? 'filled' : 'outlined'} 
			onPress={() => switchToType('random')}
			className="!py-1 text-sm"
		>
			Random
		</Button>
	</div>

	{#if selectedType === 'file'}
		<FileField 
			label=""
			accept="image/*"
			onChange={async (files)=> {
				const file = files[0];
				if (!file) return;
				
				value = new THREE.CanvasTexture(await loadImageAsCanvas(file));
				onChange(value);
			}}
		/>
	{:else}
		<ColorField 
			label=""
			bind:value={colorInput}
			onInput={() => {
				value = new THREE.Color(colorInput);
				onChange(value);
			}}
		/>
	{/if}
</div>
