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

export function createFlatColorImage(color: THREE.Color): HTMLCanvasElement {
	const width = 1;
	const height = 1;

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error("Failed to get canvas context");

	ctx.fillStyle = color.getStyle();
	ctx.fillRect(0, 0, width, height);
	return canvas;
}