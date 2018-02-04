// vim: filetype=glsl
import { vertexShader } from '../webgl';
export default vertexShader`

#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 a_Position;
varying vec2 v_UV;

void main() {
  v_UV = (a_Position + 1.0) * 0.5;
  gl_Position = vec4(a_Position, 0.0, 1.0);
}


`;
