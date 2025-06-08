import * as THREE from "three"
import { Random } from "./misc"
import type { MeshTriangle } from "./getTrianglesFromMesh"

type UVColorProvider = (u: number, v: number) => THREE.Color
export type TriangleShader = (triangle: MeshTriangle) => THREE.Color

export function uvSamplerShader(colorProvider: UVColorProvider): TriangleShader {
	return (triangle: MeshTriangle) => sampleTriangle(colorProvider, triangle)
}

export function canvasSamplerShader(canvas: HTMLCanvasElement, flipY = true) {
	const context = canvas.getContext("2d", { willReadFrequently: true })!

	if (flipY) {
		return uvSamplerShader((u, v) => sampleCanvasColor(context, u, v));
	}

	return uvSamplerShader((u, v) => sampleCanvasColor(context, u, 1 - v));
}

export function threeJSTextureShader(material: THREE.Material): TriangleShader {
	if ('map' in material && material.map instanceof THREE.Texture) {
		return canvasSamplerShader(toCanvas(material.map.image), material.map.flipY);
	}

	if ('color' in material && material.color instanceof THREE.Color) {
		return flatColorShader(material.color);
	}

	return RANDOM_COLOR_SHADER;
}

export function threeJSEmissiveShader(material: THREE.Material): TriangleShader {
	if ('emissiveMap' in material && material.emissiveMap instanceof THREE.Texture &&
		'emissive' in material && material.emissive instanceof THREE.Color) {
		const canvas = canvasSamplerShader(toCanvas(material.emissiveMap.image), material.emissiveMap.flipY);
		const emissiveColor = material.emissive;
		
		return (triangle: MeshTriangle) => {
			const color = canvas(triangle);
			return color.multiply(emissiveColor);
		}
	}

	if ('emissive' in material && material.emissive instanceof THREE.Color) {
		return flatColorShader(material.emissive);
	}
	return flatColorShader(new THREE.Color(0x000000));
}

export function RANDOM_COLOR_SHADER(triangle: MeshTriangle): THREE.Color {
	const seed = hashCode(triangle.first.position) + hashCode(triangle.second.position) + hashCode(triangle.third.position)
	const random = new Random(seed)

	return new THREE.Color(
		random.nextFloat(),
		random.nextFloat(),
		random.nextFloat()
	)
}

export function flatColorShader(color: THREE.Color): TriangleShader {
	return () => color
}

function hashCode(vector: THREE.Vector3): number {
	return vector.x * 100 + vector.y * 10 + vector.z;
}

const barycentricCoordinateForSampling = [
	[0.333, 0.333, 0.334],

	[0, 0, 1],
	[1, 0, 0],
	[0, 1, 0],
	
	[0.25, 0.25, 0.5],
	[0.5, 0.25, 0.25],
	[0.25, 0.5, 0.25],

	[0.75, 0.125, 0.125],
	[0.125, 0.75, 0.125],
	[0.125, 0.125, 0.75],
] as const;

function sampleTriangle(
	uvColorProvider: UVColorProvider,
	triangle: MeshTriangle
): THREE.Color {
	let red = 0;
	let green = 0;
	let blue = 0;

	for (const [ba, bb, bc] of barycentricCoordinateForSampling) {
		// Convert to uv
		const u = triangle.first.uv.x * ba + triangle.second.uv.x * bb + triangle.third.uv.x * bc;
		const v = triangle.first.uv.y * ba + triangle.second.uv.y * bb + triangle.third.uv.y * bc;
		
		const color = uvColorProvider(u, v);

		red += color.r;
		green += color.g;
		blue += color.b;
	}

	const count = barycentricCoordinateForSampling.length;
	return new THREE.Color(red / count, green / count, blue / count);
}

function sampleCanvasColor(image: CanvasRenderingContext2D, x: number, y: number): THREE.Color {
	const pixelX = Math.floor(Math.min(Math.max(x, 0), 1) * (image.canvas.width - 1));
	const pixelY = Math.floor(Math.min(Math.max(1 - y, 0), 1) * (image.canvas.height - 1));
	
	const pixelData = image.getImageData(pixelX, pixelY, 1, 1).data;
	
	return new THREE.Color(
		pixelData[0]! / 255,
		pixelData[1]! / 255,
		pixelData[2]! / 255
	);
}

function toCanvas(image: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
	if (image instanceof HTMLCanvasElement) {
		return image;
	}

	const canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new Error("Failed to get canvas context");
	ctx.drawImage(image, 0, 0);
	return canvas;
}