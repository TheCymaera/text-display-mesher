import * as THREE from "three";
import { unitSquare, unitTriangle, type TextDisplayEntity } from "./textDisplays";
import { benchmark } from "./misc";

const unitTriangleVertices = [
	new THREE.Vector3(0, 0, 0),
	new THREE.Vector3(1, 0, 0),
	new THREE.Vector3(0, 1, 0)
].map(vertex => 
	vertex.applyMatrix4(unitTriangle[0]!.clone().invert())
);

/**
 * Generates a more optimized mesh for text displays arranged in triangles.
 * @param textDisplays - Text displays arranged in groups of three, each representing a triangle.
 */
export function textDisplayTrianglesToMesh(textDisplays: TextDisplayEntity[]) {
	const positions: number[] = [];
	const colors: number[] = [];

	for (let i = 0; i < textDisplays.length; i += 3) {
		const textDisplay = textDisplays[i]!;

		for (const vertex of unitTriangleVertices) {
			const point = vertex.clone().applyMatrix4(textDisplay.transform);
			positions.push(point.x, point.y, point.z);
			colors.push(textDisplay.color.r, textDisplay.color.g, textDisplay.color.b);
		}
	}

	// Create the geometry
	const geometry = new THREE.BufferGeometry();
	
	// Add attributes
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

	// Create the mesh
	return new THREE.Mesh(geometry, textDisplayMaterial);
}


const textDisplayMaterial = new THREE.ShaderMaterial({
	vertexShader: `
		attribute vec3 color;
		varying vec3 vColor;
		
		void main() {
			vColor = color;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: `
		varying vec3 vColor;
		
		void main() {
			gl_FragColor = vec4(vColor, 1.0);
		}
	`,
});