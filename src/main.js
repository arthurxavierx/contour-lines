import './lib/modernizr';

import { createCanvas, createShaderProgram } from './webgl';

import SHADER_VERT from './shader/vert';
import SHADER_FRAG from './shader/frag';

//
const ε = 0.00001, SPEED = 10.0, DRAG = 0.98, OFFSET = 1000.0;

const LINES0 = 5, LINES_MIN = 1, LINES_MAX = 12;

//
const $ = document.querySelectorAll.bind(document);
const $$ = document.querySelector.bind(document);

window.addEventListener('load', main, false);

function main() {
  if (!Modernizr.canvas ||
      !Modernizr.webgl ||
      !Modernizr.webglextensions ||
      !Modernizr.webglextensions.OES_standard_derivatives)
    document.body.className += ' incompatible';

  const { canvas, context: gl } = createCanvas('canvas');
  resizeCanvas(gl);

  // initialize WebGL environment
  const Γ = initGL(gl, { canvas });

  introduction(Γ);

  //
  let time0 = 0;
  function loop(time) {
    resizeCanvas(gl);

    const dt = (time - time0) * 0.001;

    if (time0 > 0)
      update(dt, Γ);
    render(gl, dt, Γ);

    time0 = time;
    window.requestAnimationFrame(loop);
  }
  window.requestAnimationFrame(loop);

  document.body.addEventListener('mousewheel', onMouseWheel.bind(null, Γ), false);
  document.body.addEventListener('mousemove', onMouseMove.bind(null, Γ), false);
  document.body.addEventListener('touchmove', onMouseMove.bind(null, Γ), false);
}

function resizeCanvas(gl) {
  if (gl.canvas.width != gl.canvas.clientWidth || gl.canvas.height != gl.canvas.clientHeight) {
    gl.canvas.width = gl.canvas.clientWidth;
    gl.canvas.height = gl.canvas.clientHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }
}


function initGL(gl, Γ) {
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clearDepth(1.0);

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);

  gl.getExtension('OES_standard_derivatives');

  const terrainShader =
    createShaderProgram(gl, [ SHADER_VERT, SHADER_FRAG ], {
      attribs: [ 'a_Position' ],
      uniforms: [ 'u_Pointer', 'u_Offset', 'u_Height', 'u_Lines', 'u_AspectRatio' ],
    });

  const random = () => (Math.random() - 0.5) * OFFSET;

  return {
    ...Γ,
    terrainShader,
    vertexBuffer: gl.createBuffer(),
    offset: [random(), random()],
  };
}

function introduction() {
  const handler = () => {
    document.body.className += ' playing';
    window.setTimeout(() => $$('#introduction').innerHTML = '', 1000);
    document.removeEventListener('mousemove', handler);
    document.removeEventListener('touchmove', handler);
  };
  document.addEventListener('mousemove', handler);
  document.addEventListener('touchmove', handler);
}

const smoothstep = (min, max, t) => {
  const x = Math.max(0, Math.min(1, (t - min) / (max - min)));
  return x*x*(3 - 2*x);
};

const sig = x => x < 0 ? -1 : 1;

let pointer = [0, 0], dpointer = [0, 0], target;
let zoom = LINES0, dzoom = 0;

function onMouseMove({ canvas }, e) {
  target =
    e.touches
    ? [e.touches[0].clientX / canvas.clientWidth, 1 - e.touches[0].clientY / canvas.clientHeight]
    : [e.clientX / canvas.clientWidth, 1 - e.clientY / canvas.clientHeight];
  // target = [e.clientX / canvas.clientWidth, 1 - e.clientY / canvas.clientHeight];
}

function onMouseWheel(Γ, e) {
  e.preventDefault();
  const delta = -e.wheelDelta || e.detail;
  dzoom += Math.max(-1, Math.min(1, delta));
}

let height = 0.0;
function update(dt) {
  if (!target)
    return;

  dpointer = [(target[0] - pointer[0]) * SPEED, (target[1] - pointer[1]) * SPEED];

  pointer[0] += dpointer[0]*dt; pointer[1] += dpointer[1]*dt;
  dpointer[0] *= DRAG; dpointer[1] *= DRAG;

  zoom = Math.max(LINES_MIN, Math.min(LINES_MAX, zoom + dzoom*3*dt));
  dzoom *= DRAG * 0.9;

  if (height >= 1.0 - ε)
    return;

  height =
    height < 1.0 - ε
    ? Math.min(1.0, height + Math.abs(height - 1.0)*dt*3)
    : 1.0
}

function render(gl, dt, { offset, terrainShader, vertexBuffer }) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  // setup uniforms
  gl.useProgram(terrainShader.program);
  gl.uniform2f(terrainShader.uniforms.u_Pointer, ...pointer);
  gl.uniform2f(terrainShader.uniforms.u_Offset, ...offset);
  gl.uniform1f(terrainShader.uniforms.u_Height, height);
  gl.uniform1f(terrainShader.uniforms.u_Lines, zoom);
  gl.uniform1f(terrainShader.uniforms.u_AspectRatio, gl.canvas.width / gl.canvas.height);

  { // draw square
    const points = [ -1, -1, 1, -1, 1, 1, -1, 1 ];

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    gl.vertexAttribPointer(terrainShader.attribs.a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(terrainShader.attribs.a_Position);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }
}
