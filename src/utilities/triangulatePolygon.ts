import * as THREE from 'three';
import { MeshVertex, MeshPolygon } from './mesh';
import { benchmark } from './misc';

export class Triangle {
	constructor(
		public first: MeshVertex,
		public second: MeshVertex,
		public third: MeshVertex
	) {}

	normal(): THREE.Vector3 {
		return triangleNormal(
			this.first.position,
			this.second.position,
			this.third.position
		);
	}
}

export function triangulatePolygon(polygon: MeshPolygon): Triangle[] {
	const vertices = polygon.vertices;

	// Implementation of ear-clipping algorithm for triangulation
	// Works for both convex and concave polygons
	if (vertices.length < 3) return [];
	if (vertices.length === 3) return [new Triangle(vertices[0]!, vertices[1]!, vertices[2]!)];

	const result: Triangle[] = [];
	const verticesList = [...vertices];
	const referenceNormal = vertices[0]!.normal;

	// Process until we have a triangle left
	while (verticesList.length > 3) {
		let earFound = false;

		// Look for an ear
		for (let i = 0; i < verticesList.length; i++) {
			const prev = (i + verticesList.length - 1) % verticesList.length;
			const curr = i;
			const next = (i + 1) % verticesList.length;

			const v0 = verticesList[prev]!;
			const v1 = verticesList[curr]!;
			const v2 = verticesList[next]!;

			// Check if this vertex forms an ear
			if (!isEar(
				prev, curr, next, 
				verticesList.map(v => v.position), 
				referenceNormal
			)) continue;

			// We found an ear, add it to our triangles and ensure correct winding order
			result.push(createTriangleWithCorrectWinding(v0, v1, v2, referenceNormal));

			// Remove the ear tip from the polygon
			verticesList.splice(curr, 1);

			earFound = true;
			break;
		}

		// If no ear is found (can happen with degenerate polygons)
		// just use a simple approach as fallback
		if (!earFound) {
			const center = calculateCenter(verticesList);
			for (let i = 0; i < verticesList.length; i++) {
				const next = (i + 1) % verticesList.length;

				// Create triangles with consistent winding order
				result.push(createTriangleWithCorrectWinding(
					center, verticesList[i]!, verticesList[next]!, 
					referenceNormal
				));
			}
			break;
		}
	}

	// Add the final triangle
	if (verticesList.length === 3) {
		result.push(createTriangleWithCorrectWinding(
			verticesList[0]!, verticesList[1]!, verticesList[2]!, 
			referenceNormal
		));
	}

	return result;
}

function calculateCenter(vertices: MeshVertex[]): MeshVertex {
	const position = new THREE.Vector3(0, 0, 0);
	const uv = new THREE.Vector2(0, 0);
	
	for (const vertex of vertices) {
		position.add(vertex.position);
		uv.add(vertex.uv);
	}
	
	position.divideScalar(vertices.length);
	uv.divideScalar(vertices.length);

	return new MeshVertex(position, uv, vertices[0]!.normal);
}

function isEar(
	prev: number, 
	curr: number, 
	next: number, 
	polygon: THREE.Vector3[], 
	referenceNormal: THREE.Vector3
): boolean {
	const a = polygon[prev]!;
	const b = polygon[curr]!;
	const c = polygon[next]!;

	// Check if the vertex is convex
	const isConvex = isConvexVertex(a, b, c, referenceNormal);

	// If it's not convex, it can't be an ear
	if (!isConvex) return false;

	// Check if any other point is inside the potential ear
	for (let i = 0; i < polygon.length; i++) {
		if (i === prev || i === curr || i === next) continue;

		if (pointInTriangle(polygon[i]!, a, b, c)) {
			return false;
		}
	}

	return true;
}

function createTriangleWithCorrectWinding(
	a: MeshVertex, 
	b: MeshVertex, 
	c: MeshVertex, 
	referenceNormal: THREE.Vector3
): Triangle {
	const normal = triangleNormal(a.position, b.position, c.position);
	const dotProduct = normal.dot(referenceNormal);
	
	return dotProduct >= 0 
		? new Triangle(a, b, c) 
		: new Triangle(a, c, b);
}

function pointInTriangle(
	p: THREE.Vector3, 
	a: THREE.Vector3, 
	b: THREE.Vector3, 
	c: THREE.Vector3
): boolean {
	function sign(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
		return (p1.x - p3.x) * (p2.z - p3.z) - (p2.x - p3.x) * (p1.z - p3.z);
	}

	const d1 = sign(p, a, b);
	const d2 = sign(p, b, c);
	const d3 = sign(p, c, a);

	const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
	const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

	// If all signs are the same, point is inside the triangle
	return !(hasNeg && hasPos);
}

function isConvexVertex(
	a: THREE.Vector3, 
	b: THREE.Vector3, 
	c: THREE.Vector3, 
	referenceNormal: THREE.Vector3
): boolean {
	const edge1 = new THREE.Vector3().subVectors(b, a);
	const edge2 = new THREE.Vector3().subVectors(c, b);

	const crossProduct = new THREE.Vector3().crossVectors(edge1, edge2);
	return crossProduct.dot(referenceNormal) > 0;
}

export function triangleNormal(
	a: THREE.Vector3, 
	b: THREE.Vector3, 
	c: THREE.Vector3
): THREE.Vector3 {
	const edge1 = new THREE.Vector3().subVectors(b, a);
	const edge2 = new THREE.Vector3().subVectors(c, a);
	const normal = new THREE.Vector3().crossVectors(edge1, edge2);

	if (normal.lengthSq() !== 0) normal.normalize();
	return normal;
}

export function calculatePolygonNormal(points: THREE.Vector3[]): THREE.Vector3 {
	if (points.length < 3) return new THREE.Vector3(0, 1, 0);

	// Calculate normal using Newell's method for better accuracy with potentially non-planar polygons
	const normal = new THREE.Vector3(0, 0, 0);

	for (let i = 0; i < points.length; i++) {
		const current = points[i]!;
		const next = points[(i + 1) % points.length]!;

		// Accumulate the cross product contributions
		normal.x += (current.y - next.y) * (current.z + next.z);
		normal.y += (current.z - next.z) * (current.x + next.x);
		normal.z += (current.x - next.x) * (current.y + next.y);
	}

	// Normalize the result
	if (normal.lengthSq() > 0) {
		normal.normalize();
	} else {
		// Fallback to first triangle if the polygon is degenerate
		return triangleNormal(points[0]!, points[1]!, points[2]!);
	}

	return normal;
}