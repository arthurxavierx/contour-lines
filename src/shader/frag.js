// vim: filetype=glsl
import { fragmentShader } from '../webgl';
import noise4D from './noise4D.js';

export default fragmentShader(`

#extension GL_OES_standard_derivatives : enable

#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

uniform vec2 u_Pointer;
uniform vec2 u_Offset;
uniform float u_Height;
uniform float u_Lines;
uniform float u_AspectRatio;

varying vec2 v_UV;

${noise4D}

void main() {
  vec2 uv = v_UV * vec2(u_AspectRatio, 1.0);
  vec4 position = vec4(uv + u_Offset, u_Pointer.xy / 5.0);

  float noise =
    snoise(position)
    + 0.5 * snoise(position * vec4(2.0, 2.0, 1.4, 1.4))
    + 0.25 * snoise(position * vec4(4.0, 4.0, 2.0, 2.0));
  noise *= u_Height;

  float f = abs(fract(noise * u_Lines * u_Height) - 0.5);
  float df = fwidth(noise * u_Lines * u_Height);

  const float m = 0.1;
  float z = clamp((f - df*m) / df + m, m, 1.0);

  gl_FragColor = vec4(z, z, z, 1);
}

`);
