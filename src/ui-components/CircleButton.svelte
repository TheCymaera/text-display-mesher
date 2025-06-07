<script lang="ts">
	import { buttonVariants } from "./buttonVariants.js";

	interface Props {
		label?: string,
		onPress: () => void,
		disabled?: boolean,
		className?: string,
		children?: import('svelte').Snippet
	}

	let {
		label = "",
		onPress,
		disabled = false,
		className = "",
		children
	}: Props = $props();
</script>
<button 
	onclick={onPress}
	title={label}
	disabled={disabled}
	class="
	{buttonVariants.filled} shadow-md/30
	text-lg w-14 h-14 grid place-items-center
	{className}
">
	{@render children?.()}
</button>