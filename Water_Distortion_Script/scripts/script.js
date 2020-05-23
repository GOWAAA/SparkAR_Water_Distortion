import { PFTween, Ease } from './PFTween';

// How to load in modules
const Scene = require('Scene');
const Shaders = require('Shaders');
const M = require('Materials');
const T = require('Time')
const R = require('Reactive');
const Textures = require('Textures')

// Use export keyword to make a symbol available in scripting debug console
export const Diagnostics = require('Diagnostics');

Promise.all([
    M.findFirst('material0'),
    Textures.findFirst('cameraTexture0'),
    Textures.findFirst('Worley')

]).then(res =>{
    let mat = res[0];
    let cam_tex = res[1];
    let noise = res[2];

    const uv = Shaders.vertexAttribute({'variableName':Shaders.VertexAttribute.TEX_COORDS});


    let p_m = uv;
    let p_d = uv;

    let line = Shaders.sdfLine(0.5,R.pack2(0,0.25),0.1)
    line = Shaders.sdfTranslation(line,R.pack2(0,0.4));
    let step = R.smoothStep(line,0,0.01);
    p_m = R.mix(R.sub(1,p_m),p_m,step);
    p_m = R.pack2(uv.x,p_m.y);

    let cameratexture = Shaders.composition(cam_tex.signal, uv);

    let run = new PFTween(0,5,1000).setEase(Ease.easeInOutSine).setLoops().scalar;

    let speed = 0.1;
    let magnitude = 2;

    let runtime = R.mul(run,speed);
    p_d = R.sub(p_d, R.pack2(0, runtime));
  
 
    let dst_map_val = Shaders.composition(noise.signal, p_d);
    let dst_offset = R.pack2(dst_map_val.x,dst_map_val.y);

    dst_offset = R.sub(dst_offset, R.pack2(0.5,0.5));
    dst_offset= R.mul(dst_offset,magnitude);
    dst_offset = R.mul(dst_offset,R.pack2(0.01,0.01));
    dst_offset = R.add(dst_offset,p_m);

    let distortcolor = Shaders.composition(cam_tex.signal,dst_offset);
    let finalcolor = R.mix(distortcolor,cameratexture,step);

    const textureslot = Shaders.DefaultMaterialTextures.DIFFUSE;

    mat.setTextureSlot(textureslot,finalcolor);
});

