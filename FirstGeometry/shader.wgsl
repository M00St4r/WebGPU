// Vertex Shader
@vertex
fn vs_main(@location(0) pos: vec2f) -> @builtin(position) vec4f {
    return vec4f(pos, 0, 1);
}

// Fragment Shader
@fragment
fn fs_main() -> @location(0) vec4f {
    return vec4f(1, 0, 0, 1);
}