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

	forEach(callback: (vertex: MeshVertex) => void): void {
		callback(this.first);
		callback(this.second);
		callback(this.third);
	}
}


export function getTrianglesFromGroup(group: THREE.Group): MeshTriangle[] {
	const polygons: MeshTriangle[] = [];
	
	// Iterate through each child in the group
	group.children.forEach(child => {
		if (child instanceof THREE.Mesh) {
			const meshPolygons = getPolygonsFromMesh(child);
			polygons.push(...meshPolygons);
		} else if (child instanceof THREE.Group) {
			const groupPolygons = getTrianglesFromGroup(child);
			polygons.push(...groupPolygons);
		}
	});

	applyTransformations(polygons, group);
	
	return polygons;
}

export function getPolygonsFromMesh(mesh: THREE.Mesh): MeshTriangle[] {
	const polygons: MeshTriangle[] = [];
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
	
	// Process triangles (assuming the geometry consists of triangles)
	for (let i = 0; i < indices.length; i += 3) {
		const firstIndex = indices[i]!;
		const secondIndex = indices[i + 1]!;
		const thirdIndex = indices[i + 2]!;

		const material = mesh.material instanceof Array ? mesh.material[0]! : mesh.material;

		polygons.push(new MeshTriangle(
			getMeshVertex(positionAttribute, uvAttribute, firstIndex, material),
			getMeshVertex(positionAttribute, uvAttribute, secondIndex, material),
			getMeshVertex(positionAttribute, uvAttribute, thirdIndex, material)
		));
	}
	
	applyTransformations(polygons, mesh);
	
	return polygons;
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


function applyTransformations(
	polygons: MeshTriangle[],
	meshOrGroup: THREE.Mesh | THREE.Group
) {
	if (meshOrGroup.matrixWorld) {
		polygons.forEach(polygon => {
			polygon.forEach(vertex => {
				vertex.position.applyMatrix4(meshOrGroup.matrixWorld);
			});
		});
	}

	// apply scale
	if (meshOrGroup.scale) {
		polygons.forEach(polygon => {
			polygon.forEach(vertex => {
				vertex.position.multiply(meshOrGroup.scale);
			});
		});
	}

	// apply translation
	if (meshOrGroup.position) {
		polygons.forEach(polygon => {
			polygon.forEach(vertex => {
				vertex.position.add(meshOrGroup.position);
			});
		});
	}
	
	return polygons;
}