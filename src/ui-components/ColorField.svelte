<script lang="ts">
  import { generateElementID } from "../utilities/misc";

	interface Props {
		label: string,
		value: string,
		onChange?: (color: string) => void,
		className?: string,
	}

	let {
		label,
		value = $bindable(),
		className = "",
		onChange = () => {},
	}: Props = $props();

	const id = generateElementID('color-field');
</script>

<div class={className}>
	<label class="block mb-2 font-medium" for={id}>
		{label}
	</label>
	<div class="flex items-center gap-3">
		<input 
			type="color" 
			bind:value={value}
			onchange={() => onChange(value)}
			class="w-10 h-10 rounded-md cursor-pointer border border-border overflow-hidden"
		/>
		<input 
			id={id}
			type="text" 
			bind:value={value}
			onchange={() => onChange(value)}
			class="flex-1 border border-border rounded-md px-3 py-2 text-sm"
			placeholder="#RRGGBB"
		/>
	</div>
</div>
