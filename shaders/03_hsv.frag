#version 300 es
/**
 * \file 03_hsv.frag
 * \author Huiuk Jang
 * \date 2025 Spring
 * \par CS250 Computer Graphics II
 * \copyright DigiPen Institute of Technology
 */
#ifdef GL_ES
precision mediump float;
#endif

out vec4 FragColor;

#define TWO_PI 6.28318530718

uniform vec2 u_resolution;
uniform float u_time;

//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0*0.5,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix( vec3(1.0), rgb, c.z/c.x);
}

void main(){
    vec2 st = gl_FragCoord.xy/u_resolution;
    vec3 color = vec3(0.7922, 0.2353, 0.2353);

    // Use polar coordinates instead of cartesian
    vec2 toCenter = vec2(0.5)-st+tan(u_time)*0.3;
    float angle = atan(toCenter.y,toCenter.x*sin(u_time));
    float radius = length(toCenter)*2.0;

    // Map the angle (-PI to PI) to the Hue (from 0 to 1)
    // and the Saturation to the radius
    color = hsb2rgb(vec3((angle/TWO_PI)+0.5,radius,1.0));

    FragColor = vec4(color,1.0);
}