const canvas = document.querySelector("canvas");

if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();

const ctx = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
ctx.configure({
    device: device,
    format: canvasFormat,
});

const encoder = device.createCommandEncoder();

//create a vertecies array
const vertices = new Float32Array([
    //   X,    Y,
    -0.8, -0.8, // Triangle 1 (Blue)
    0.8, -0.8,
    0.8, 0.8,

    -0.8, -0.8, // Triangle 2 (Red)
    0.8, 0.8,
    -0.8, 0.8,
]);

//create vertex Buffer
const vertexBuffer = device.createBuffer({
    label: "Cell vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

//write buffer to memory
device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

//create vertex buffer Layout
const vertexBufferLayout = {
    arrayStride: 8,
    attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0, // Position, see vertex shader
    }],
};

//link the shader
const shaderModule = device.createShaderModule({
    label: "Shader",
    code: await fetch("shader.wgsl").then(res => res.text())
});

//create a Pipeline
const Pipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: "auto",
    vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
        buffers: [vertexBufferLayout]
    },
    fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [{
            format: canvasFormat
        }]
    }
});

draw();

/*const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);*/

// Finish the command buffer and immediately submit it.
device.queue.submit([encoder.finish()]);

function draw() {
    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: ctx.getCurrentTexture().createView(),
            loadOp: "clear",
            clearValue: /*{ r: 0, g: 0.4, b: 0.4, a: 1 }*/[0, 0.4, 0.4, 1],
            storeOp: "store",
        }]
    });

    pass.setPipeline(Pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(vertices.length / 2); // 6 vertices

    pass.end();
}