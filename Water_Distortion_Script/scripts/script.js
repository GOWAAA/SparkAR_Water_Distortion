import { PFTween, Ease } from './PFTween';

//loading modules
const Shaders = require('Shaders');
const M = require('Materials');
const T = require('Time')
const R = require('Reactive');
const Textures = require('Textures')

export const Diagnostics = require('Diagnostics');

Promise.all([
    //Finding material
    M.findFirst('material0'),
    Textures.findFirst('cameraTexture0'),
    Textures.findFirst('Worley')

]).then(res =>{
    //Assigning objects
    let mat = res[0];
    let cam_tex = res[1];
    let noise = res[2];

    //Declare uv
    const uv = Shaders.vertexAttribute({'variableName':Shaders.VertexAttribute.TEX_COORDS});

    //Declare dummy variables to manipulate uv
    let p_m = uv;
    let p_d = uv;

    //Declare SDF to split screen into 2
    let line = Shaders.sdfLine(0.5,R.pack2(0,0.25),0.1)
    line = Shaders.sdfTranslation(line,R.pack2(0,0.4));
    let step = R.smoothStep(line,0,0.01);

    //changes uv to do the reflection at the bottom screen
    p_m = R.mix(R.sub(1,p_m),p_m,step);
    //repack uv to have u remain as original and v to be manipulated. This makes reflection on in y and not x direction. 
    p_m = R.pack2(uv.x,p_m.y);

    //Get original cameratexture 
    let cameratexture = Shaders.composition(cam_tex.signal, uv);

    //Animate the distortion with pftween
    let run = new PFTween(0,5,1000).setEase(Ease.easeInOutSine).setLoops().scalar;

    //Declare variable to manage the distortion
    let speed = 0.1;
    let magnitude = 2;

    //runtime needs to be between 0 and 1
    let runtime = R.mul(run,speed);
    //Subtract original v with runtime
    p_d = R.sub(p_d, R.pack2(0, runtime));
  
    //Get noise texture and use it with manipulated uv
    let dst_map_val = Shaders.composition(noise.signal, p_d);
    //Swizzle xy out from the noise texture
    let dst_offset = R.pack2(dst_map_val.x,dst_map_val.y);

    //uv manipulations
    dst_offset = R.sub(dst_offset, R.pack2(0.5,0.5));
    dst_offset= R.mul(dst_offset,magnitude);
    dst_offset = R.mul(dst_offset,R.pack2(0.01,0.01));
    dst_offset = R.add(dst_offset,p_m);

    //get final distortion texture with cameratexture with distorted uv
    let distorttexture = Shaders.composition(cam_tex.signal,dst_offset);
    //mix the final output with original camera texture to create the top and bottom split screen
    let finaltexture = R.mix(distorttexture,cameratexture,step);

    //Declare textureslot to put the texture 
    const textureslot = Shaders.DefaultMaterialTextures.DIFFUSE;
    //assign texture to material in the right texture slot
    mat.setTextureSlot(textureslot,finaltexture);
});

