#extension GL_OES_standard_derivatives: enable

uniform float itt;
uniform float mode;
uniform vec2 window;
uniform float pixelRatio;
uniform vec3 mousePos;
uniform float n;

varying vec3 vColor;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLight;

uniform sampler2D pos;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 fog(float vdist, vec3 I){
  vec3 fogColor = vec3(1.0);
  float b = 0.0004;
  float dens = 1.0-exp(-(vdist*b));
  return mix(I,fogColor,dens);
}

vec3 hsv2rgb(vec3 c){
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 setColor(){

  //vec3 h = texture2D(pos, vColor.xy).xyz;
  //vec3 df = abs(mousePos-h);
  //float t = atan(df.x/df.y) / 3.1415;
  //float t = length(df)

  return hsv2rgb(vec3(0.45+vColor.x*0.4,0.9,0.4));

  //return vec3(0.0,0.0,0.0);
}

void main(){

  float opacity = 1.0;
  float vdist = length(vView);

  vec3 I = setColor();
  //I = fog(vdist, I);

  gl_FragColor = vec4(
    I,
    opacity
  );
}
