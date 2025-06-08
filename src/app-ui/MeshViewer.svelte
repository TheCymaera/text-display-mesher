<script lang="ts">
import { onMount } from 'svelte';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let { model, maxDistance, lightPosition }: {
	model: THREE.Object3D;
	maxDistance: number;
	lightPosition: THREE.Vector3;
} = $props();

let canvas: HTMLCanvasElement;
const scene = new THREE.Scene();
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let animationFrameId: number;

let clientHeight = $state(1);
let clientWidth = $state(1);

const sceneObjects = $derived.by(()=>{
	const group = new THREE.Group();
	group.add(model);


	const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
	directionalLight.position.set(lightPosition.x, lightPosition.y, lightPosition.z);
	group.add(directionalLight);


	const ambientLight = new THREE.AmbientLight(0xffffff, 1);
	group.add(ambientLight);

	return group;
})

let currentGroup: THREE.Group | null = null;

onMount(() => {
	initScene();
	animate();

	return () => {
		cancelAnimationFrame(animationFrameId);
		renderer.dispose();
	};
});

function initScene() {
	// Helpers
	const gridHelper = new THREE.GridHelper(10, 10);
	gridHelper.position.y = -0.001;
	scene.add(gridHelper);

	const axesHelper = new THREE.AxesHelper(5);
	axesHelper.position.set(0, 0.001, 0);
	scene.add(axesHelper);

	// Camera
	camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000);
	camera.position.z = 5;
	camera.position.x = 4;
	camera.position.y = 3;
	camera.position.normalize().multiplyScalar(10);

	// Renderer
	renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(clientWidth, clientHeight);

	//Orbit controls
	controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;
	controls.screenSpacePanning = false;
	controls.minDistance = 2;
	controls.maxDistance = 10;
}

$effect(() => {
	if (currentGroup) {
		scene.remove(currentGroup);
	}
	
	currentGroup = sceneObjects;
	scene.add(sceneObjects);
	
	controls.maxDistance = maxDistance;
});

function animate() {
	animationFrameId = requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}

$effect(() => {
	camera.aspect = clientWidth / clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(clientWidth, clientHeight);
	renderer.render(scene, camera);
})
</script>

<div
	bind:clientHeight
	bind:clientWidth
	class="absolute inset-0"
>
	<canvas
		bind:this={canvas}
		class="absolute inset-0 min-w-full min-h-full"
	></canvas>
</div>