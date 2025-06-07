import * as THREE from "three";
import type { TextDisplayEntity } from "./textDisplays";
import { benchmark } from "./misc";


export function textDisplaysToSummonCommands(textDisplays: TextDisplayEntity[], {
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
	const components: Record<string, string> = {
		id: `"minecraft:text_display"`,
		text: `'" "'`,
		transformation: mat4NBT(textDisplay.transform),
		background: colorToSignedInt(textDisplay.color, 1).toString(),
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

function mat4NBT(mat: THREE.Matrix4): string {
	return "[" + 
	floatNBT(mat.elements[0]) + "," +
	floatNBT(mat.elements[4]) + "," +
	floatNBT(mat.elements[8]) + "," +
	floatNBT(mat.elements[12]) + "," +
	floatNBT(mat.elements[1]) + "," +
	floatNBT(mat.elements[5]) + "," +
	floatNBT(mat.elements[9]) + "," +
	floatNBT(mat.elements[13]) + "," +
	floatNBT(mat.elements[2]) + "," +
	floatNBT(mat.elements[6]) + "," +
	floatNBT(mat.elements[10]) + "," +
	floatNBT(mat.elements[14]) + "," +
	floatNBT(mat.elements[3]) + "," +
	floatNBT(mat.elements[7]) + "," +
	floatNBT(mat.elements[11]) + "," +
	floatNBT(mat.elements[15]) + "]";

}

function floatNBT(value: number): string {
	const rounded = Math.round(value * 1_000_000_0) / 1_000_000_0;
	return `${rounded}f`;
}