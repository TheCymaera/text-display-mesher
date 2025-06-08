import * as THREE from 'three';

export interface MeshVertex {
	position: THREE.Vector3;
	uv: THREE.Vector2;
	material: THREE.Material;
}

export class MeshTriangle {
	constructor(
		public first: MeshVertex,
		public second: MeshVertex,
		public third: MeshVertex
	) {}
}


export function getTrianglesFromObject(object: THREE.Object3D): MeshTriangle[] {
	const triangles: MeshTriangle[] = [];

	object.children.forEach(child => {
		triangles.push(...getTrianglesFromObject(child));
	});
	
	if (object instanceof THREE.Mesh) {
		triangles.push(...getTrianglesFromMesh(object));
	}

	applyTransformations(triangles, object);

	
	return triangles;
}

function getTrianglesFromMesh(mesh: THREE.Mesh): MeshTriangle[] {
	const triangles: MeshTriangle[] = [];
	const geometry = mesh.geometry;
	
	if (!(geometry instanceof THREE.BufferGeometry)) {
		console.error('Geometry is not a BufferGeometry');
		return [];
	}
	
	// Get attributes
	const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
	const uvAttribute = geometry.getAttribute('uv') as THREE.BufferAttribute | undefined;

	if (!positionAttribute) {
		console.error('Geometry does not have position or UV attributes');
		return [];
	}
	
	const indices = geometry.getIndex()?.array ?? Array.from({ length: positionAttribute.count }, (_, i) => i);
	
	// Process triangles
	for (let i = 0; i < indices.length; i += 3) {
		const firstIndex = indices[i]!;
		const secondIndex = indices[i + 1]!;
		const thirdIndex = indices[i + 2]!;

		const material = mesh.material instanceof Array ? mesh.material[0]! : mesh.material;

		triangles.push(new MeshTriangle(
			getMeshVertex(positionAttribute, uvAttribute, firstIndex, material),
			getMeshVertex(positionAttribute, uvAttribute, secondIndex, material),
			getMeshVertex(positionAttribute, uvAttribute, thirdIndex, material),
		));
	}
	
	return triangles;
}

function getMeshVertex(
	positionAttribute: THREE.BufferAttribute,
	uvAttribute: THREE.BufferAttribute | undefined,
	index: number,
	material: THREE.Material
): MeshVertex {
	return {
		position: getVec3(positionAttribute, index),
		uv: uvAttribute ? getVec2(uvAttribute, index) : new THREE.Vector2(0, 0),
		material: material,
	};
}

function getVec2(attribute: THREE.BufferAttribute, index: number): THREE.Vector2 {
	return new THREE.Vector2(attribute.getX(index), attribute.getY(index));
}

function getVec3(attribute: THREE.BufferAttribute, index: number): THREE.Vector3 {
	return new THREE.Vector3(
		attribute.getX(index),
		attribute.getY(index),
		attribute.getZ(index)
	);
}


function applyTransformations(triangles: MeshTriangle[], object: THREE.Object3D) {
	for (const triangle of triangles) {
		triangle.first.position.applyMatrix4(object.matrix);
		triangle.second.position.applyMatrix4(object.matrix);
		triangle.third.position.applyMatrix4(object.matrix);
	}
	
	return triangles;
}