import type * as THREE from "three";

let i = 0
export function generateElementID(name: string): string {
	return `${name}-${i++}`;
}

export async function loadImageAsCanvas(file: string | File) {
	const url = file instanceof File ? URL.createObjectURL(file) : file;

	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => {
			resolve(image);
		}
		image.onerror = (error)=> {
			reject(new Error(`Failed to load image from ${url}: ${error}`));
		}
		image.src = url;
	})
	.then(image => {
		const canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) throw new Error("Failed to get canvas context");
		ctx.drawImage(image, 0, 0);
		return canvas;
	})
	.finally(() => {
		if (file instanceof File) {
			URL.revokeObjectURL(url);
		}
	})
}


export class Random {
	private seed: number

	constructor(seed: number) {
		this.seed = seed
	}

	nextFloat() {
		let t = this.seed += 0x6D2B79F5;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	}

	nextInt(max: number): number {
		return Math.floor(this.nextFloat() * max);
	}
}

export function benchmark(name: string) {
	const start = performance.now();
	return {
		[Symbol.dispose] () {
			console.log(`Benchmark ${name} took ${performance.now() - start}ms`);
		}
	}
}

export function deepFreeze<T>(obj: T): Readonly<T> {
	if (obj && typeof obj === 'object') {
		Object.freeze(obj);
		for (const key of Object.keys(obj)) {
			const value = (obj as any)[key];
			if (value && typeof value === 'object') {
				deepFreeze(value);
			}
		}
	}
	return obj as Readonly<T>;
}

export function createNoiseImage(width: number, height: number): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error("Failed to get canvas context");

	const random = new Random(100);

	const imageData = ctx.createImageData(width, height);
	for (let i = 0; i < imageData.data.length; i += 4) {
		imageData.data[i] = Math.floor(random.nextFloat() * 255)
		imageData.data[i + 1] = Math.floor(random.nextFloat() * 255)
		imageData.data[i + 2] = Math.floor(random.nextFloat() * 255)
		imageData.data[i + 3] = 255;
	}
	ctx.putImageData(imageData, 0, 0);
	return canvas;
}

export function flatColorCanvas(color: THREE.Color) {
	const canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = 1;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error("Failed to get canvas context");

	ctx.fillStyle = `#${color.getHexString()}`;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	return canvas;
}

//export function debounce<T extends (...args: any[]) => void>(delay: number, func: T): T & { bump: () => void } {
//	let timeoutId: ReturnType<typeof setTimeout> | null = null;
//	let pendingArgs: any[] | null = null;
//	let pendingThis: any = null;

//	function bump() {
//		if (timeoutId !== null) {
//			clearTimeout(timeoutId);
//		}
		
//		if (pendingArgs) {
//			const args = pendingArgs;
//			const thisArg = pendingThis;
//			pendingArgs = null;
//			pendingThis = null;
//			timeoutId = setTimeout(() => {
//				timeoutId = null;
//				func.apply(thisArg, args);
//			}, delay);
//		}
//	}

//	const out = function(this: any, ...args: Parameters<T>) {
//		pendingArgs = args;
//		pendingThis = this;
//		bump();
//	} as unknown as T;
	
//	// @ts-expect-error Add method
//	out.bump = bump;
	
//	return out as ReturnType<typeof debounce<T>>
//}

export function debounce<T extends (...args: any[]) => void>(delay: number, func: T): T {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	function debounced(this: any, ...args: Parameters<T>) {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			timeoutId = null;
			func.apply(this, args);
		}, delay);
	}

	return debounced as T;
}