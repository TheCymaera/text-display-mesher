<script lang="ts">
	interface Props {
		type?: string,
		value: number,
		label?: string,
		hideLabel?: boolean,
		placeholder?: string,
		readonly?: boolean,
		hint?: string,
		error?: string,
		nullValue?: number,
		emptyIfNull?: boolean,
		className?: string,
		boxClassName?: string,
		onInput?: (event: { value: number}) => void,
		leadingIcon?: import('svelte').Snippet
		trailingIcon?: import('svelte').Snippet
	}

	let {
		type = "text",
		value = $bindable(),
		label = "",
		hideLabel = false,
		placeholder = "",
		readonly = false,
		hint = "",
		error = "",
		nullValue = 0,
		emptyIfNull = false,
		onInput = () => {},
		className = "",
		boxClassName = "",
		leadingIcon,
		trailingIcon
	}: Props = $props();

	let input: HTMLInputElement;
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		emptyIfNull; nullValue; value;
		
		if (!input) return
		if (document.activeElement === input) return
		
		input.value = (emptyIfNull && value === nullValue) ? "" : `${value}`
	});

</script>

<label class="block {className}">
	<div style:display={hideLabel ? "none" : ""}>
		{label}
	</div>
	<div class="inputContainer">
		<input 
			type={type}
			inputmode="decimal"
			class="
				w-full p-3 border-[.08rem] border-containerBorder rounded-md bg-transparent
				focus-visible:outline-[3px] outline-primary-500 outline-offset-[-3px]
				disabled:opacity-50
				{boxClassName}
				{className.includes("absolute") ? "absolute inset-0" : ""}
			"
			disabled={readonly} 
			placeholder="{placeholder || nullValue.toString()}"
			bind:this={input} 
			oninput={()=>{
				const parsed = parseFloat(input.value)
				value = isNaN(parsed) ? nullValue : parsed;
				onInput({ value });
			}}
		/>
		<div class="flex justify-end items-center pointer-events-none">
			{@render trailingIcon?.()}
		</div>
		<div class="flex justify-start items-center pointer-events-none">
			{@render leadingIcon?.()}
		</div>
	</div>
	<output class="pl-1" style:display={(error || hint) ? "" : "none"}>
		<small class="whitespace-pre {error ? "text-red-500" : ""}">{error || hint}</small>
	</output>
</label>
<style>
.inputContainer {
	display: grid;
}

.inputContainer > * {
	grid-area: 1 / 1;
}
</style>