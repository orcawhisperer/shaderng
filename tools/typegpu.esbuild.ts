import typegpu from "unplugin-typegpu/esbuild";

/** Transform TypeGPU `"use gpu"` functions during the Angular esbuild pipeline. */
export default [typegpu()];
