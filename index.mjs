import assert from "assert";
import fs from "fs";
import enhancedResolve from "enhanced-resolve";
import { ResolverFactory as OxcResolverFactory } from "oxc-resolver";
import { Bench } from "tinybench";

const cwd = process.cwd();

const enhancedResolver = enhancedResolve.ResolverFactory.createResolver({
	fileSystem: new enhancedResolve.CachedInputFileSystem(fs, 4000),
});

const oxcResolver = new OxcResolverFactory();

const data = ["./index.mjs", "oxc-resolver", "enhanced-resolve", "tinybench"];

// Check results are valid
for (const path of data) {
	assert(await enhancedResolveAsync(path), oxcResolver.sync(cwd, path).path);
}

async function enhancedResolveAsync(path) {
	return new Promise((resolve) => {
		enhancedResolver.resolve({}, cwd, path, {}, (_err, res) => {
			resolve(res);
		});
	});
}

async function oxcResolveAsync(path) {
	return new Promise((resolve) => {
		resolve(oxcResolver.sync(cwd, path).path);
	});
}

// Create and run benches
const bench = new Bench({ time: 10000 });
bench
	.add("enhanced-resolve", async function testEnhancedResolve() {
		for (const path of data) {
			await enhancedResolveAsync(path);
		}
	})
	.add("oxc-resolver", async function testOxcResolver() {
		for (const path of data) {
			await oxcResolveAsync(path);
		}
	});

await bench.warmup();
await bench.run();

const means = bench.tasks.map((task) => task.result.mean);
const minIndex = means.indexOf(Math.min(...means));
const min = means[minIndex];

const table = [];
for (const task of bench.tasks) {
	table.push({
		name: task.name,
		mean: task.result.mean.toFixed(4) + "ms",
		compare: (task.result.mean / min).toFixed(2),
	});
}

console.log("Node", process.version);
console.table(table);
