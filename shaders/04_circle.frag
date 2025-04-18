#version 300 es

precision mediump float;

/**
 * \file
 * \author Huiuk Jang
 * \date 2025 Spring
 * \par CS250 Computer Graphics II
 * \copyright DigiPen Institute of Technology
 */

 out vec4 FragColor;

 uniform vec2 u_resolution;
 uniform vec2 u_mouse;
 uniform float u_time;

// Convert pixel coords to normalized coords
 vec2 to_coord(vec2 pixel_point)
 {
    vec2 point = pixel_point / u_resolution;
    if(u_resolution.x > u_resolution.y)
    {
        // wide not tall
        // height is going to between 0-1
        // width is going to be expanded, larger than 0-1
        point.x *= u_resolution.x / u_resolution.y;
        // now to recenter the range
        point.x += (u_resolution.y - u_resolution.x) / (u_resolution.x);
    }
    else
    {
        point.y *= u_resolution.y / u_resolution.x;
        point.y += (u_resolution.x - u_resolution.y) / u_resolution.y;
    }

    return point;
 }

 float sCircle(vec2 point, vec2 center, float radius)
 {
    float d = distance(point, center);
    return d - radius;
 }

 // return 0 not in circle, 1 in circle
 float circle(vec2 point, vec2 center, float radius)
 {
    float sd = sCircle(point, center, radius);
    // return 1.0 - step(0., sd);
    float E = fwidth(sd);
    return 1. - smoothstep(-E, E, sd);
 }

  float circle2(vec2 point, vec2 center, float radius)
 {
    float sd = sCircle(point, center, radius/3.);
    return 1.0 - step(0., sd);
 }

 void main(void)
 {
    vec2 position = to_coord(gl_FragCoord.xy);
    vec2 position2 = to_coord(vec2(gl_FragCoord.x*(sin(u_time)+2.), (gl_FragCoord.y)*(cos(u_time)+2.)));
    vec2 position3 = to_coord(vec2(gl_FragCoord.x*(cos(u_time)+1.), (gl_FragCoord.y)*(tan(u_time)+0.5)));
    vec3 color = vec3(1.-cos(u_time)*0.5, 0.8235, 0.7667);
  
    vec2 p = vec2(cos(u_time), sin(u_time))*0.25+vec2(0.5);
    float t = circle(position, p  ,0.125);
    float t2= circle2(position2, p  ,0.325);
    float t3= circle(position3, p  ,0.025);
    color = mix(color, vec3(0.251, 0.3843, 0.6549), t);
    color = mix(color, vec3(0.8314, 0.0627, 0.0627), t2);
    color = mix(color, vec3(1.0, 0.8588, 0.0627), t3);
    
    FragColor = vec4(color, 1.0);
 }