import * as THREE from 'three';
import type { Mesh, MeshPolygon } from './mesh';
import { triangleNormal, triangulatePolygon as triangulatePolygon } from './triangulatePolygon';
import { lookAlongQuaternion, shearMatrix, translationMatrix } from './maths';
import { type TriangleShader } from './triangleShader';
import { benchmark, deepFreeze } from './misc';

export interface TextDisplayBrightness {
	sky: number;
	block: number;
}

export interface TextDisplayEntity {
	color: THREE.Color;
	transform: THREE.Matrix4;
	brightness: TextDisplayBrightness;
}


const unitSquare = deepFreeze(new THREE.Matrix4()
	.multiply(translationMatrix(-0.1 + 0.5, -0.5 + 0.5, 0))
	.scale(new THREE.Vector3(8.0, 4.0, 1)));

// Left aligned
const unitTriangle = deepFreeze([
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

export function meshToTextDisplays(mesh: Mesh, textureShader: TriangleShader, emissiveShader: TriangleShader): TextDisplayEntity[] {
	using _ = benchmark("meshToTextDisplays");
	
	const triangulated = mesh.faces.flatMap((polygon: MeshPolygon) => {
		return triangulatePolygon(polygon);
	});

	return triangulated.flatMap(triangle => {
		const textDisplay = textDisplayTriangle(
			triangle.first.position,
			triangle.second.position,
			triangle.third.position,
		);

		const normal = textDisplay.zAxis
		
		const color = textureShader(triangle, normal);
		const emissiveColor = emissiveShader(triangle, normal);
		const emission = emissiveColor.r + emissiveColor.g + emissiveColor.b / 3;
		const brightness = {
			sky: 15,
			block: Math.round(emission * 15),
		};

		return textDisplay.transforms.map(transform => ({ color, transform, brightness }));
	});
}

const textDisplayMesh = new THREE.Mesh(
	new THREE.PlaneGeometry(1, 1)
	.translate(0.5, 0.5, 0)
	.applyMatrix4(unitSquare.clone().invert()),
);


export function textDisplaysToMesh(textDisplays: TextDisplayEntity[]) {
	using _ = benchmark("textDisplaysToMesh");

	const group = new THREE.Group();

	for (const { color, transform, brightness } of textDisplays) {
		const mesh = textDisplayMesh.clone();
		mesh.matrixAutoUpdate = false;

		const material = new THREE.MeshStandardMaterial();
		material.color = color;
		material.emissive = color;
		material.emissiveIntensity = brightness.block / 15;
		material.flatShading = true;

		mesh.material = material;
		mesh.applyMatrix4(transform);
		group.add(mesh);
	}

	return group;
}


export function textDisplaysToSummonCommand(textDisplays: TextDisplayEntity[], {
	//maxPassengers = Infinity,
	maxCommandLength = 32500,
}= {}) {
	using _ = benchmark("textDisplaysToSummonCommand");

	const commands: string[] = [];
	const containerPosition = "~ ~ ~";

	const summonCommand = (batch: TextDisplayEntity[])=>{
		if (batch.length === 0) return "";

		const containerNBT = textDisplayNBT(batch[0]!);
		const passengersNBT = batch.slice(1).map(i => nbtToString(textDisplayNBT(i))).join(",")

		delete containerNBT.id;
		if (passengersNBT.length) containerNBT.Passengers = `[${passengersNBT}]`;
		return `summon minecraft:text_display ${containerPosition} ${nbtToString(containerNBT)}`;
	}
	const batchFits = (command: string, _batch: TextDisplayEntity[]) => {
		return command.length <= maxCommandLength;// && batch.length <= maxPassengers;
	}

	let added = 0;
	
	let expectedBatchSize = maxCommandLength / 100;

	const batches: TextDisplayEntity[][] = [];

	while (added < textDisplays.length) {
		// Create batch with expected size
		const currentBatch = textDisplays.slice(added, Math.min(added + expectedBatchSize, textDisplays.length));
		added += currentBatch.length;
		
		
		let currentCommand;

		// keep adding to the current batch until it no longer fits
		while (batchFits(currentCommand = summonCommand(currentBatch), currentBatch) && added < textDisplays.length) {
			currentBatch.push(textDisplays[added]!);
			added++;
		}

		// pop until it fits again
		while (!batchFits(currentCommand = summonCommand(currentBatch), currentBatch) && currentBatch.length > 0) {
			currentBatch.pop();
			added--;
		}

		// add the current batch to the commands
		expectedBatchSize = currentBatch.length;
		commands.push(currentCommand);
		batches.push(currentBatch);
	}

	return { commands, batches };
}

function nbtToString(components: Record<string, string>): string {
	return `{${Object.entries(components).map(([key, value]) => `${key}:${value}`).join(",")}}`;
}

function textDisplayNBT(textDisplay: TextDisplayEntity) {
	//const colorCode = "#" + textDisplay.color.getHexString().padStart(6, '0');
	const colorCode = colorToSignedInt(textDisplay.color, 1);
	const roundToFloat = (value: number): string => {
		const pow = 1_0000000;
		const rounded = Math.round(value * pow) / pow;
		return rounded + "f";
	};

	const reordered = [
		textDisplay.transform.elements[0],
		textDisplay.transform.elements[4],
		textDisplay.transform.elements[8],
		textDisplay.transform.elements[12],
		textDisplay.transform.elements[1],
		textDisplay.transform.elements[5],
		textDisplay.transform.elements[9],
		textDisplay.transform.elements[13],
		textDisplay.transform.elements[2],
		textDisplay.transform.elements[6],
		textDisplay.transform.elements[10],
		textDisplay.transform.elements[14],
		textDisplay.transform.elements[3],
		textDisplay.transform.elements[7],
		textDisplay.transform.elements[11],
		textDisplay.transform.elements[15]
	];

	const transformArray = reordered.map(v => roundToFloat(v)).join(",");
	const components: Record<string, string> = {
		id: `"minecraft:text_display"`,
		text: `'" "'`,
		transformation: `[${transformArray}]`,
		background: colorCode.toString(),
	}

	if (textDisplay.brightness.sky !== 15 || textDisplay.brightness.block !== 0) {
		components.brightness = `{sky:${textDisplay.brightness.sky},block:${textDisplay.brightness.block}}`;
	}


	return components;
}

function colorToSignedInt(color: THREE.Color, alpha: number = 1): number {
	// Convert color components from 0-1 to 0-255
	const r = Math.round(color.r * 255);
	const g = Math.round(color.g * 255);
	const b = Math.round(color.b * 255);
	const a = Math.round(alpha * 255);

	// Combine into a 32-bit unsigned int (ARGB format: 0xAARRGGBB)
	const unsignedInt = (a << 24) | (r << 16) | (g << 8) | b;

	// Convert to signed 32-bit int (two's complement)
	// JavaScript bitwise operations work on 32-bit signed integers,
	// so this conversion happens automatically when we use the value
	return unsignedInt;
}