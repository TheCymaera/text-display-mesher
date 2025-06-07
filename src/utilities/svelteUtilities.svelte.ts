import { debounce } from "./misc";

export function debouncedState<T>({delay, deps, value} :{ delay: number, deps: ()=>void, value: () => T }) {
	let state = $state(value());
	
	const debouncedUpdate = debounce(delay, () => {
		state = value()
	});

	$effect(() => {
		deps();
		debouncedUpdate();
	});

	return {
		get value() {
			return state;
		},

		invalidate() {
			debouncedUpdate();
		}
	}
}