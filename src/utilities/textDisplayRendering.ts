import * as THREE from "three";
import { unitSquare, unitTriangle, type TextDisplayEntity } from "./textDisplays";
import { benchmark } from "./misc";


const textDisplayMesh = new THREE.Mesh(
	new THREE.PlaneGeometry(1, 1)
	.translate(0.5, 0.5, 0)
	.applyMatrix4(unitSquare.clone().invert()),
);


export function textDisplaysToMesh(textDisplays: TextDisplayEntity[]) {
	using _ = benchmark("textDisplaysToMesh");

	const group = new THREE.Group();

	for (const textDisplay of textDisplays) {
		const mesh = textDisplayMesh.clone();
		mesh.matrixAutoUpdate = false;
		mesh.material = textDisplayMaterial(textDisplay);
		mesh.applyMatrix4(textDisplay.transform);
		group.add(mesh);
	}

	return group;
}

const simplifiedUnitTriangleMesh = new THREE.Mesh(
	new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(1, 0, 0),
		new THREE.Vector3(0, 1, 0),
	]).applyMatrix4(unitTriangle[0]!.clone().invert())
);

/**
 * Generates a more optimized mesh
 * @param textDisplays - Text displays arranged in groups of three, each representing a triangle.
 */
export function textDisplayTrianglesToMesh(textDisplays: TextDisplayEntity[]) {

	const group = new THREE.Group();

	for (let i = 0; i < textDisplays.length; i += 3) {
		const textDisplay = textDisplays[i]!;
		const mesh = simplifiedUnitTriangleMesh.clone();
		mesh.matrixAutoUpdate = false;
		mesh.material = textDisplayMaterial(textDisplays[i]!);
		mesh.applyMatrix4(textDisplay.transform);
		group.add(mesh);
	}

	return group;
}

function textDisplayMaterial(textDisplay: TextDisplayEntity): THREE.Material {
	const material = new THREE.MeshStandardMaterial();
	material.color = textDisplay.color;
	material.emissive = textDisplay.color;
	material.emissiveIntensity = textDisplay.brightness.block / 15;
	material.flatShading = true;
	return material;
}