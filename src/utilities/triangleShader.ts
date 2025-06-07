import * as THREE from "three"
import type { Triangle } from "./triangulatePolygon"
import { Random } from "./misc"

export type UVColorProvider = (u: number, v: number) => THREE.Color
export type TriangleShader = (triangle: Triangle, normal: THREE.Vector3) => THREE.Color

export function uvSamplerShader(colorProvider: UVColorProvider): TriangleShader {
	return (triangle: Triangle) => sampleTriangle(colorProvider, triangle)
}

export function canvasSamplerShader(canvas: HTMLCanvasElement): TriangleShader {
	const context = canvas.getContext("2d", { willReadFrequently: true })!
	return uvSamplerShader((u, v) => sampleCanvasColor(context, u, v));
}


export function threeJSMaterialSamplerShader(material: THREE.Material): TriangleShader {
	if (material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshStandardMaterial) {
		if (material.map) {
			let canvas: HTMLCanvasElement;
			if (material.map.image instanceof HTMLCanvasElement) {
				canvas = material.map.image;
			} else if (material.map.image instanceof HTMLImageElement) {
				canvas = document.createElement('canvas');
				canvas.width = material.map.image.width;
				canvas.height = material.map.image.height;
				const ctx = canvas.getContext('2d', { willReadFrequently: true });
				if (!ctx) throw new Error("Failed to get canvas context");
				ctx.drawImage(material.map.image, 0, 0);
			} else {
				throw new Error("Unsupported texture type for material map");
			}
			return canvasSamplerShader(canvas);
		}

		return flatColorShader(material.color);
	}

	return flatColorShader(new THREE.Color(0xff0000));
}

export function shadowShader(shader: TriangleShader, { light, minBrightness, maxBrightness }: {
	light: THREE.Vector3,
	minBrightness: number,
	maxBrightness: number,
}): TriangleShader {
	return function(triangle: Triangle, normal: THREE.Vector3): THREE.Color {
		const color = shader(triangle, normal)
		const lightDot = normal.dot(light)
		const brightness = (lightDot + 1) / 2 * (maxBrightness - minBrightness) + minBrightness

		return new THREE.Color(
			color.r * brightness,
			color.g * brightness,
			color.b * brightness,
		)
	}
}

export function RANDOM_COLOR_SHADER(triangle: Triangle): THREE.Color {
	const seed = hashCode(triangle.first.position) + hashCode(triangle.second.position) + hashCode(triangle.third.position)
	const random = new Random(seed)

	return new THREE.Color(
		random.nextFloat(),
		random.nextFloat(),
		random.nextFloat()
	)
}

export function flatColorShader(color: THREE.Color): TriangleShader {
	return ()=> color
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
	//image: CanvasRenderingContext2D,
	uvColorProvider: UVColorProvider,
	triangle: Triangle
): THREE.Color {
	let red = 0;
	let green = 0;
	let blue = 0;
	let count = 0;

	for (const [ba, bb, bc] of barycentricCoordinateForSampling) {
		// Convert to uv
		const u = triangle.first.uv.x * ba + triangle.second.uv.x * bb + triangle.third.uv.x * bc;
		const v = triangle.first.uv.y * ba + triangle.second.uv.y * bb + triangle.third.uv.y * bc;
		
		const color = uvColorProvider(u, v);

		red += color.r * 255;
		green += color.g * 255;
		blue += color.b * 255;
		count++;
	}

	return new THREE.Color(
		red / count / 255,
		green / count / 255,
		blue / count / 255
	);
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