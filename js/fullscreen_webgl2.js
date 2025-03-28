/**
 * \file
 * \author Rudy Castan
 * \date 2025 Spring
 * \par CS250 Computer Graphics II
 * \copyright DigiPen Institute of Technology
 */

const gVertexShaderSource = `#version 300 es
precision lowp float;
layout(location = 0) in vec3 aVertexPosition;
void main() {
    gl_Position = vec4(aVertexPosition, 1.0);
}`;

const gDefaultFragmentShaderSource = `#version 300 es
precision mediump float;
out vec4 FragColor;
void main() {
    FragColor = vec4(0.3451, 0.1725, 0.6706, 1.0);
}`;

const LIMIT_FPS      = true;
const SHOW_FPS       = true;
let   gl             = null;
let   gProgram       = null;
let   gVAO           = null;
let   gStartTime     = null;
let   gMouseX        = 0;
let   gMouseY        = 0;
let   gFrameRequest  = null;
let   gLastFrameTime = 0;
const gFrameInterval = 1000 / 32; // Cap at ~30 FPS
let   gFrameCount    = 0;
let   gLastFPSTime   = null;
let   gCurrentFPS    = null;
const gInitialTitle  = document.title;

function init_webgl()
{
    const canvas = document.getElementById("glCanvas");
    gl           = canvas.getContext("webgl2", { powerPreference: "low-power" });
    if (!gl)
    {
        console.error("WebGL2 not supported");
        return false;
    }

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    return true;
}

function setup_buffers()
{
    const positions = new Float32Array([
        // bottom left
        -1.0, -1.0, 0.0,
        // bottom right
        3.0, -1.0, 0.0,
        // top left
        -1.0, 3.0, 0.0
    ]);

    gVAO      = gl.createVertexArray();
    const vbo = gl.createBuffer();
    gl.bindVertexArray(gVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const position_location = 0;
    gl.enableVertexAttribArray(position_location);
    gl.vertexAttribPointer(position_location, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
}

function render(now)
{
    if (LIMIT_FPS && now - gLastFrameTime < gFrameInterval)
    {
        gFrameRequest = requestAnimationFrame(render);
        return;
    }
    gLastFrameTime = now;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const u_time       = gl.getUniformLocation(gProgram, "u_time");
    const u_resolution = gl.getUniformLocation(gProgram, "u_resolution");
    const u_mouse      = gl.getUniformLocation(gProgram, "u_mouse");

    gl.useProgram(gProgram);
    gl.uniform1f(u_time, (performance.now() - gStartTime) / 1000);
    gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(u_mouse, gMouseX, gMouseY);

    gl.bindVertexArray(gVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);

    if (SHOW_FPS)
        update_fps(now);
    gFrameRequest = requestAnimationFrame(render);
}

function create_shader(type, source)
{
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        console.error("Shader compile error: ", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function create_program(vertex_glsl, fragment_glsl)
{
    const vertex_shader   = create_shader(gl.VERTEX_SHADER, vertex_glsl);
    const fragment_shader = create_shader(gl.FRAGMENT_SHADER, fragment_glsl);
    if (!vertex_shader || !fragment_shader)
        return null;

    const prog = gl.createProgram();
    gl.attachShader(prog, vertex_shader);
    gl.attachShader(prog, fragment_shader);
    gl.linkProgram(prog);
    gl.deleteShader(vertex_shader);
    gl.deleteShader(fragment_shader);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    {
        console.error("Program link error: ", gl.getProgramInfoLog(prog));
        return null;
    }
    return prog;
}

async function fetch_shader(shader_path)
{
    try
    {
        const response = await fetch(shader_path);
        if (!response.ok)
            throw new Error("Failed to load shader");
        return await response.text();
    }
    catch (e)
    {
        console.log(`First attempt failed: ${shader_path}, trying modified path.`);
        const base_path   = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        const likely_path = `${base_path}shaders/${shader_path}`;
        console.log(`Attempting: ${likely_path}`);
        try
        {
            const response = await fetch(likely_path);
            if (!response.ok)
                throw new Error("Backup fetch failed");
            return await response.text();
        }
        catch (e)
        {
            console.error("Both attempts failed, using default shader.");
            return gDefaultFragmentShaderSource;
        }
    }
}

function update_fps(now)
{
    gFrameCount++;
    const elapsed = now - gLastFPSTime;

    if (elapsed >= 1000)
    {
        const fps    = Math.round((gFrameCount / elapsed) * 1000);
        gFrameCount  = 0;
        gLastFPSTime = now;
        if (window.self === window.top && fps !== gCurrentFPS)
        {
            gCurrentFPS    = fps;
            document.title = `[${String(fps).padStart(3, ' ')}fps] ${gInitialTitle}`;
        }
    }
}

function resize_canvas()
{
    gl.canvas.width  = window.innerWidth;
    gl.canvas.height = window.innerHeight;
}

function setup_event_listeners()
{
    const canvas = gl.canvas;

    canvas.addEventListener("mousemove", (event) => {
        gMouseX = event.clientX;
        gMouseY = canvas.height - event.clientY;
    });

    canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        console.warn("WebGL context lost, attempting to restore.");
        cancelAnimationFrame(gFrameRequest);
    });

    canvas.addEventListener("webglcontextrestored", () => {
        console.log("WebGL context restored.");
        start_fullscreen_webgl2();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden)
        {
            cancelAnimationFrame(gFrameRequest);
        }
        else
        {
            render(performance.now());
        }
    });

    window.addEventListener("resize", resize_canvas);
}

async function start_fullscreen_webgl2()
{
    if (!init_webgl())
        return;

    setup_event_listeners();

    const url_params           = new URLSearchParams(window.location.search);
    const shader_file          = url_params.get('shader');
    const fragment_shader_glsl = shader_file ? await fetch_shader(shader_file) : gDefaultFragmentShaderSource;

    gProgram = create_program(gVertexShaderSource, fragment_shader_glsl);
    if (!gProgram)
        return;

    setup_buffers();


    gStartTime   = gStartTime || performance.now();
    gLastFPSTime = gStartTime;
    render(performance.now());
}

async function setup_shaders()
{
    const url_params           = new URLSearchParams(window.location.search);
    const shader_file          = url_params.get('shader');
    const fragment_shader_glsl = shader_file ? await fetch_shader(shader_file) : gDefaultFragmentShaderSource;

    gProgram = create_program(gVertexShaderSource, fragment_shader_glsl);
    return gProgram !== null;
}

async function start_fullscreen_webgl2()
{
    if (!init_webgl())
        return;

    setup_event_listeners();

    if (!await setup_shaders())
        return;

    setup_buffers();

    gStartTime   = gStartTime || performance.now();
    gLastFPSTime = gStartTime;
    render(performance.now());
}

start_fullscreen_webgl2();
