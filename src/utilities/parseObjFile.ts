import * as THREE from 'three';
import { Mesh, MeshPolygonIndex, MeshVertex, MeshPolygon } from './mesh';

export function parseObjFileContents(content: string): Mesh {
	const positions: THREE.Vector3[] = [];
	const uv: THREE.Vector2[] = [];
	const normals: THREE.Vector3[] = [];
	const faceIndices: MeshPolygonIndex[] = [];

	const lines = content.split('\n');
	
	for (const line of lines) {
		const trimmedLine = line.trim();
		
		// Skip empty lines and comments
		if (trimmedLine === '' || trimmedLine.startsWith('#')) {
			continue;
		}

		const parts = trimmedLine.split(/\s+/);
		
		switch (parts[0]) {
			case 'v': // Vertex position
				if (parts.length >= 4) {
					const x = parseFloat(parts[1]!);
					const y = parseFloat(parts[2]!);
					const z = parseFloat(parts[3]!);
					positions.push(new THREE.Vector3(x, y, z));
				}
				break;
			
			case 'vt': // Texture coordinate
				if (parts.length >= 3) {
					const u = parseFloat(parts[1]!);
					const v = parseFloat(parts[2]!);
					uv.push(new THREE.Vector2(u, v));
				}
				break;
			
			case 'vn': // Vertex normal
				if (parts.length >= 4) {
					const x = parseFloat(parts[1]!);
					const y = parseFloat(parts[2]!);
					const z = parseFloat(parts[3]!);
					normals.push(new THREE.Vector3(x, y, z));
				}
				break;
			
			case 'f': // Face
				const vertIndices: number[] = [];
				const texIndices: number[] = [];
				const normIndices: number[] = [];

				// Start from 1 to skip the "f" token
				for (let i = 1; i < parts.length; i++) {
					const faceComponents = parts[i]!.split('/');
					
					if (faceComponents.length > 0) {
						// OBJ indices are 1-based, convert to 0-based
						const vertIndex = parseInt(faceComponents[0]!) - 1;
						if (vertIndex >= 0) {
							vertIndices.push(vertIndex);
						}
						
						if (faceComponents.length > 1 && faceComponents[1] !== '') {
							const uvIndex = parseInt(faceComponents[1]!) - 1;
							if (uvIndex >= 0) {
								texIndices.push(uvIndex);
							}
						}
						
						if (faceComponents.length > 2) {
							const normIndex = parseInt(faceComponents[2]!) - 1;
							if (normIndex >= 0) {
								normIndices.push(normIndex);
							}
						}
					}
				}

				if (vertIndices.length > 0) {
					faceIndices.push(new MeshPolygonIndex(
						vertIndices,
						texIndices,
						normIndices
					));
				}
				break;
		}
	}

	// Create faces from indices
	const faces = faceIndices.map(indices => {
		const vertices = indices.vertexIndex.map((_, i) => {
			const position = positions[indices.vertexIndex[i]!] ?? new THREE.Vector3(0, 0, 0);
			const texture = uv[indices.uvIndex[i]!] ?? new THREE.Vector2(0, 0);
			const normal = normals[indices.normalIndex[i]!] ?? new THREE.Vector3(0, 0, 1);
			
			return new MeshVertex(position, texture, normal);
		});
		
		return new MeshPolygon(vertices);
	});

	return new Mesh(
		positions,
		uv,
		normals,
		faceIndices,
		faces
	);
}
