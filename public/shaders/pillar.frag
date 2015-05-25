#extension GL_OES_standard_derivatives: enable

uniform float itt;
uniform float mode;
uniform vec2 window;
uniform float pixelRatio;
uniform vec2 mouse;

varying vec3 vColor;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLight;

uniform sampler2D tex;


vec3 fog(float vdist, vec3 I){
  vec3 fogColor = vec3(1.0);
  float b = 0.0002;
  float dens = 1.0-exp(-(vdist*b));
  return mix(I,fogColor,dens);
}

vec3 banding(vec3 I, vec3 c, float d){
  if (mod(floor(d),2.0)<0.001){
    return c;
  }
  return I;
}

vec3 hsv2rgb(vec3 c){
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main(){

  float opacity = 1.0;
  float vdist = length(vView);
  vec3 I = vec3(0.0);

  //if (vPosition.z>0.0){
    //I = vec3(0.4,0.0,0.0);
  //}
  //else{
    //I = vec3(0.0,0.0,0.4);
  //}

  //I = texture2D(tex,vPosition.xy/1500.0).xyz;

  //float t = 0.5 + atan(vColor.x/vColor.y)/3.1415*0.5;
  
  //float t = 0.5 + atan(vView.x/vView.y)/3.1415*0.5;
  //I = hsv2rgb(vec3(t,1.0,0.3));
  if (vPosition.z>0.0){
    I = hsv2rgb(vec3(0.5,0.9,0.7));
  }


  I = banding(I,I*0.5,vdist*10.0);
  I = fog(vdist, I);

  gl_FragColor = vec4(
    I,
    opacity
  );
}
