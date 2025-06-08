import * as THREE from 'three';
import { lookAlongQuaternion, shearMatrix, translationMatrix } from './maths';
import { threeJSEmissiveShader, threeJSTextureShader, type TriangleShader } from './triangleShader';
import { benchmark, deepFreeze } from './misc';
import { getTrianglesFromGroup, getPolygonsFromMesh as getTrianglesFromMesh } from './getPolygonsFromMesh';

export interface TextDisplayBrightness {
	sky: number;
	block: number;
}

export interface TextDisplayEntity {
	color: THREE.Color;
	transform: THREE.Matrix4;
	brightness: TextDisplayBrightness;
}

export const unitSquare = deepFreeze(new THREE.Matrix4()
	.multiply(translationMatrix(-0.1 + 0.5, -0.5 + 0.5, 0))
	.scale(new THREE.Vector3(8.0, 4.0, 1)));

// Left aligned
export const unitTriangle = deepFreeze([
	// Left
	new THREE.Matrix4()
		.scale(new THREE.Vector3(0.5, 0.5, 0.5))
		.multiply(unitSquare),
	
	// Right
	new THREE.Matrix4()
		.scale(new THREE.Vector3(0.5, 0.5, 0.5))
		.multiply(translationMatrix(1, 0, 0))
		.multiply(shearMatrix({ yx: -1 }))
		.multiply(unitSquare),
	
	// Top
	new THREE.Matrix4()
		.scale(new THREE.Vector3(0.5, 0.5, 0.5))
		.multiply(translationMatrix(0, 1, 0))
		.multiply(shearMatrix({ xy: -1 }))
		.multiply(unitSquare),
]);

interface TextDisplayTriangleResult {
	transforms: THREE.Matrix4[];
	xAxis: THREE.Vector3;
	yAxis: THREE.Vector3;
	zAxis: THREE.Vector3;
	height: number;
	width: number;
	rotation: THREE.Quaternion;
	shear: number;
}

function textDisplayTriangle(
	point1: THREE.Vector3,
	point2: THREE.Vector3,
	point3: THREE.Vector3,
): TextDisplayTriangleResult {
	const p2 = point2.clone().sub(point1);
	const p3 = point3.clone().sub(point1);

	const zAxis = p2.clone().cross(p3).normalize();
	const xAxis = p2.clone().normalize();
	const yAxis = zAxis.clone().cross(xAxis).normalize();

	const width = p2.length();
	const height = p3.dot(yAxis);
	const p3Width = p3.dot(xAxis);

	const rotation = lookAlongQuaternion(zAxis.clone().multiplyScalar(-1), yAxis).conjugate()

	const shear = p3Width / width;

	const transform = new THREE.Matrix4()
		.multiply(translationMatrix(point1.x, point1.y, point1.z))
		.multiply(new THREE.Matrix4().makeRotationFromQuaternion(rotation))
		.scale(new THREE.Vector3(width, height, 1))
		.multiply(shearMatrix({ yx: shear }));

	const transforms = unitTriangle.map(unit => {
		return transform.clone().multiply(unit);
	});

	return {
		transforms,
		xAxis,
		yAxis,
		zAxis,
		height,
		width,
		rotation,
		shear,
	};
}

export function meshToTextDisplays(
	mesh: THREE.Mesh | THREE.Group,
	shadowProvider: (color: THREE.Color, normal: THREE.Vector3, emission: number) => THREE.Color,
): TextDisplayEntity[] {
	// using _ = benchmark("meshToTextDisplays");

	const triangulated = mesh instanceof THREE.Mesh ? getTrianglesFromMesh(mesh) : getTrianglesFromGroup(mesh);

	// Convert materials to shaders
	const materialsToShaders = new Map<THREE.Material, { texture: TriangleShader, emissive: TriangleShader }>();
	for (const triangle of triangulated) {
		const material = triangle.first.material;
		if (!materialsToShaders.has(material)) {
			const textureShader = threeJSTextureShader(material);
			const emissiveShader = threeJSEmissiveShader(material);
			materialsToShaders.set(material, { texture: textureShader, emissive: emissiveShader });
		}
	}

	return triangulated.flatMap(triangle => {
		const textDisplay = textDisplayTriangle(
			triangle.first.position,
			triangle.second.position,
			triangle.third.position,
		);

		const normal = textDisplay.zAxis
		const material = triangle.first.material;
		const shaders = materialsToShaders.get(material)!;
		
		const emissiveColor = shaders.emissive(triangle);
		const emission = emissiveColor.r + emissiveColor.g + emissiveColor.b / 3;
		
		
		const color = shadowProvider(shaders.texture(triangle), normal, emission)
		
		const brightness = {
			sky: 15,
			block: Math.round(emission * 15),
		};

		return textDisplay.transforms.map(transform => ({ color, transform, brightness }));
	});
}

export function createShadowProvider({ light, minBrightness, maxBrightness }: {
	light: THREE.Vector3,
	minBrightness: number,
	maxBrightness: number,
}) {
	return function shadowProvider(color: THREE.Color, normal: THREE.Vector3, emission: number): THREE.Color {
		const lightDot = normal.dot(light)
		const brightness = (lightDot + 1) / 2 * (maxBrightness - minBrightness) + minBrightness


		const brightnessAfterEmission = Math.min(1, brightness + emission);

		return new THREE.Color(
			color.r * brightnessAfterEmission,
			color.g * brightnessAfterEmission,
			color.b * brightnessAfterEmission
		);
	}
}