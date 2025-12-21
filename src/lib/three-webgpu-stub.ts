// Stub module to prevent "three/webgpu" import errors
// three-render-objects tries to import from three/webgpu which doesn't exist in older three.js versions
// This stub provides empty exports to satisfy the import

export const WebGPURenderer = null;
export default {};
