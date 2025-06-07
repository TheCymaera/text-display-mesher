<script lang="ts">
	import * as THREE from 'three';
	import Button from '../ui-components/Button.svelte';
	import FileField from '../ui-components/FileDropZone.svelte';
	import ColorField from '../ui-components/ColorField.svelte';
	import { untrack } from 'svelte';
	import { loadImageAsCanvas } from '../utilities/misc';

	type ValueType = HTMLCanvasElement | THREE.Color | 'random';
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
		if (value instanceof HTMLImageElement) return 'file';
		if (value instanceof THREE.Color) return 'color';
		if (value === 'random') return 'random';
		return 'color';
	}

	let selectedType: ValueTypeName = $state(typeOf(value));
	let didSwitchType: boolean = $state(false);

	$effect(()=>{
		value;
		untrack(()=>{
			if (didSwitchType) return;

			if (value instanceof HTMLCanvasElement) {
				fileInput = value;
				selectedType = 'file';
			} else if (value instanceof THREE.Color) {
				colorInput = "#" + value.getHexString();
				selectedType = 'color';
			} else if (value === 'random') {
				selectedType = 'random';
			}
		})
	})
	
	let fileInput: HTMLCanvasElement = $state(document.createElement('canvas'));
	let colorInput: string = $state(value instanceof THREE.Color ? "#" + value.getHexString() : '#ffffff');

	function switchToType(type: 'file' | 'color' | 'random') {
		didSwitchType = true;
		value = ({
			file: fileInput,
			color: new THREE.Color(colorInput),
			random: 'random'
		} as const)[type];
		onChange(value);
		selectedType = type;

		setTimeout(() => didSwitchType = false, 0);
	}
</script>

<div class={className}>
	<div class="flex justify-between items-center mb-2">
		<!-- svelte-ignore a11y_label_has_associated_control -->
		<label class="font-medium">
			{label}
		</label>
		
		<div class="flex gap-2">
			<Button 
				variant={selectedType === 'file' ? 'filled' : 'outlined'} 
				onPress={() => switchToType('file')}
				className="py-1 px-3 text-sm"
			>
				File
			</Button>
			<Button 
				variant={selectedType === 'color' ? 'filled' : 'outlined'} 
				onPress={() => switchToType('color')}
				className="py-1 px-3 text-sm"
			>
				Color
			</Button>
			<Button 
				variant={selectedType === 'random' ? 'filled' : 'outlined'} 
				onPress={() => switchToType('random')}
				className="py-1 px-3 text-sm"
			>
				Random
			</Button>
		</div>
	</div>

	{#if selectedType === 'file'}
		<FileField 
			label=""
			accept="image/*"
			onChange={async (file)=> {
				value = await loadImageAsCanvas(file);
				onChange(value);
			}}
		/>
	{:else}
		<ColorField 
			label=""
			bind:value={colorInput}
			onChange={() => {
				value = new THREE.Color(colorInput);
				onChange(value);
			}}
		/>
	{/if}
</div>
