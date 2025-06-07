import * as THREE from 'three';
import { triangulatePolygon } from './triangulatePolygon';

export class MeshPolygonIndex {
	constructor(
		public vertexIndex: number[],
		public uvIndex: number[],
		public normalIndex: number[]
	) {}
}

export class MeshVertex {
	constructor(
		public position: THREE.Vector3,
		public uv: THREE.Vector2 = new THREE.Vector2(0, 0),
		public normal: THREE.Vector3 = new THREE.Vector3(0, 0, 1)
	) {}
}

export class MeshPolygon {
	constructor(
		public vertices: MeshVertex[]
	) {}
}

export class Mesh {
	constructor(
		public positions: THREE.Vector3[],
		public uvs: THREE.Vector2[],
		public normals: THREE.Vector3[],
		public faceIndices: MeshPolygonIndex[],
		public faces: MeshPolygon[]
	) {}

	xLength(): number {
		if (this.faces.length === 0) return 0;

		const minX = Math.min(...this.positions.map(p => p.x));
		const maxX = Math.max(...this.positions.map(p => p.x));
		return maxX - minX;
	}

	yLength(): number {
		if (this.faces.length === 0) return 0;

		const minY = Math.min(...this.positions.map(p => p.y));
		const maxY = Math.max(...this.positions.map(p => p.y));
		return maxY - minY;
	}

	zLength(): number {
		if (this.faces.length === 0) return 0;

		const minZ = Math.min(...this.positions.map(p => p.z));
		const maxZ = Math.max(...this.positions.map(p => p.z));
		return maxZ - minZ;
	}

	maxAxisLength(): number {
		return Math.max(this.xLength(), this.yLength(), this.zLength());
	}

	translate(x: number, y: number, z: number): Mesh {
		this.positions.forEach(position => {
			position.add(new THREE.Vector3(x, y, z));
		});

		return this;
	}

	scale(scale: number): Mesh {
		this.positions.forEach(position => {
			position.multiplyScalar(scale);
		});

		return this;
	}

	toThreeJS(material: THREE.Material): THREE.Group {
		const group = new THREE.Group();

		const geometry = new THREE.BufferGeometry();

		const triangulatedFaces = this.faces.flatMap(face => triangulatePolygon(face));


		// Prepare arrays for buffer geometry
		const positions: number[] = [];
		const uvs: number[] = [];
		const normals: number[] = [];

		// Fill arrays
		for (const tri of triangulatedFaces) {
			for (const vertex of [tri.first, tri.second, tri.third]) {
				positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
				uvs.push(vertex.uv.x, vertex.uv.y);
				normals.push(vertex.normal.x, vertex.normal.y, vertex.normal.z);
			}
		}

		// Set the attributes
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
		geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

		// Create the mesh and add it to the group
		const mesh = new THREE.Mesh(geometry, material);
		group.add(mesh);

		return group;
	}
}
