export function createCanvas(id) {
  const canvas = document.getElementById(id);
  const context = canvas.getContext('webgl');
  return { canvas, context };
}

export function createShaderProgram(gl, shaders, { attribs, uniforms }) {
  const program = gl.createProgram();
  shaders.forEach(shader => gl.attachShader(program, shader(gl)));
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
  }

  return {
    program,
    attribs: attribs.reduce((obj, a) => (obj[a] = gl.getAttribLocation(program, a), obj), {}),
    uniforms: uniforms.reduce((obj, u) => (obj[u] = gl.getUniformLocation(program, u), obj), {}),
  };
}

export const vertexShader = src => gl => loadShader(gl, gl.VERTEX_SHADER, src);
export const fragmentShader = src => gl => loadShader(gl, gl.FRAGMENT_SHADER, src);

export function loadShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const shaderLog = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('An error occurred compiling the shaders: ' + shaderLog);
  }

  return shader;
}
