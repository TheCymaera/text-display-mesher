<script lang="ts">
  import { generateElementID } from "../utilities/misc";

	interface Props {
		label: string,
		value: string,
		onInput?: (color: string) => void,
		className?: string,
	}

	let {
		label,
		value = $bindable(),
		className = "",
		onInput = () => {},
	}: Props = $props();

	const id = generateElementID('color-field');
</script>

<div class={className}>
	<label class="block mb-2 font-medium" for={id}>
		{label}
	</label>
	<div class="grid grid-cols-[min-content_auto] gap-2 items-center">
		<input 
			type="color" 
			bind:value={value}
			oninput={() => onInput(value)}
			class="
				aspect-ratio-1 h-full
				border-[.08rem] border-containerBorder rounded-md bg-transparent
				focus-visible:outline-[3px] outline-primary-500 outline-offset-[-3px]
				cursor-pointer
			"
		/>
		<input 
			id={id}
			type="text" 
			bind:value={value}
			oninput={() => onInput(value)}
			class="
				flex-1
				p-3 border-[.08rem] border-containerBorder rounded-md bg-transparent
				focus-visible:outline-[3px] outline-primary-500 outline-offset-[-3px]
			"
			placeholder="#RRGGBB"
		/>
	</div>
</div>
