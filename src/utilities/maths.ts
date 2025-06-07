import * as THREE from 'three';

export function lookAlongQuaternion(direction: THREE.Vector3, up: THREE.Vector3): THREE.Quaternion {
	// Normalize direction
	const dir = direction.clone().normalize().negate();
	
	// Calculate left vector (left = up × dir)
	const left = up.clone().cross(dir).normalize();
	
	// Calculate normalized up vector (up = dir × left)
	const upn = dir.clone().cross(left);
	
	// Convert orthonormal basis to quaternion
	const quaternion = new THREE.Quaternion();
	
	const tr = left.x + upn.y + dir.z;
	
	if (tr >= 0.0) {
		const t = Math.sqrt(tr + 1.0);
		const w = t * 0.5;
		const s = 0.5 / t;
		
		quaternion.set(
			(dir.y - upn.z) * s,
			(left.z - dir.x) * s,
			(upn.x - left.y) * s,
			w
		);
	} else {
		if (left.x > upn.y && left.x > dir.z) {
			const t = Math.sqrt(1.0 + left.x - upn.y - dir.z);
			const x = t * 0.5;
			const s = 0.5 / t;
			
			quaternion.set(
				x,
				(left.y + upn.x) * s,
				(dir.x + left.z) * s,
				(dir.y - upn.z) * s
			);
		} else if (upn.y > dir.z) {
			const t = Math.sqrt(1.0 + upn.y - left.x - dir.z);
			const y = t * 0.5;
			const s = 0.5 / t;
			
			quaternion.set(
				(left.y + upn.x) * s,
				y,
				(upn.z + dir.y) * s,
				(left.z - dir.x) * s
			);
		} else {
			const t = Math.sqrt(1.0 + dir.z - left.x - upn.y);
			const z = t * 0.5;
			const s = 0.5 / t;
			
			quaternion.set(
				(dir.x + left.z) * s,
				(upn.z + dir.y) * s,
				z,
				(upn.x - left.y) * s
			);
		}
	}
	
	return quaternion;
}



export function translationMatrix(x: number, y: number, z: number): THREE.Matrix4 {
	return new THREE.Matrix4().makeTranslation(x, y, z);
}

export function shearMatrix({ xy = 0, xz = 0, yx = 0, yz = 0, zx = 0, zy = 0 }) {
	return new THREE.Matrix4().makeShear(
		xy, xz,
		yx, yz,
		zx, zy
	)
}