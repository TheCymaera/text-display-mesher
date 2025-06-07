<script lang="ts">
	import { buttonVariants, buttonBehaviour } from "./buttonVariants.js";

	interface Props {
		type?: "button" | "submit",
		variant?: keyof typeof buttonVariants,
		onPress?: (originalEvent: MouseEvent & { currentTarget: HTMLButtonElement }) => void,
		disabled?: boolean,
		on?: boolean,
		className?: string,
		children?: import('svelte').Snippet
	}

	let {
		type = "button",
		variant = "filled",
		onPress = () => {},
		disabled = false,
		on = false,
		className = "",
		children
	}: Props = $props();

	let button: HTMLButtonElement;
	export function focus() {
		button.focus();
	}
</script>
<button 
	bind:this={button}
	use:buttonBehaviour
	type="{type}"
	class="{className} {buttonVariants[variant]}"
	onclick={onPress}
	disabled={disabled} 
	data-on={on ? "" : undefined}
>
	{@render children?.()}
</button>