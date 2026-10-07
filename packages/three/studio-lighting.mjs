import * as T from 'three';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

// Optional Three.js adapter, not a restriction on EditableFrame renderers.
export const revision = 'editableframe.product-lighting/1';
export const presets = {
  studio: {preset:'studio', intensity:1, exposure:1, rotation:25, background:'#e8e7e5', corrections:true, legacy:false},
  contrast: {preset:'contrast', intensity:.72, exposure:1, rotation:110, background:'#24272c', corrections:true, legacy:false},
};
export async function createProductLighting(renderer, scene, {hdrURL, hdrSha256}) {
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.VSMShadowMap;
  const pm=new T.PMREMGenerator(renderer);
  pm.compileEquirectangularShader();
  const response=await fetch(hdrURL);
  if(!response.ok)throw Error('Studio HDR could not be loaded: '+response.status);
  const bytes=await response.arrayBuffer();
  const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
  if(digest!==hdrSha256)throw Error('Studio HDR hash differs from saved rendering profile');
  const hdr=new RGBELoader().parse(bytes);
  const texture=new T.DataTexture(hdr.data,hdr.width,hdr.height,T.RGBAFormat,hdr.type);
  texture.flipY=true;texture.minFilter=texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.colorSpace=T.LinearSRGBColorSpace;texture.mapping=T.EquirectangularReflectionMapping;texture.needsUpdate=true;
  const target=pm.fromEquirectangular(texture);texture.dispose();
  const room=new RoomEnvironment(),old=pm.fromScene(room,.04);room.dispose();pm.dispose();
  const ambient=new T.HemisphereLight(0xffffff,0x596678,0);scene.add(ambient);
  const key=new T.DirectionalLight(0xffffff,.6);key.position.set(3,5,4);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.1,far:20});
  key.shadow.bias=-.0001;key.shadow.normalBias=.006;key.shadow.radius=7;key.shadow.blurSamples=12;scene.add(key);
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({color:'#1b2025',opacity:.14}));
  floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  let current={...presets.studio};
  function apply(config={}) {
    const c={...presets.studio,...config};if(!['studio','contrast'].includes(c.preset)||typeof c.legacy!=='boolean'||typeof c.corrections!=='boolean')throw Error('Invalid lighting preset');
    for(const [k,lo,hi] of [['intensity',.1,3],['exposure',.3,2],['rotation',-180,180]])if(!Number.isFinite(c[k])||c[k]<lo||c[k]>hi)throw Error('Invalid lighting '+k);
    if(!/^#[0-9a-f]{6}$/i.test(c.background))throw Error('Invalid background color');
    renderer.toneMapping=c.legacy?T.ACESFilmicToneMapping:T.NeutralToneMapping;
    renderer.toneMappingExposure=c.legacy?1.2:c.exposure;
    scene.environment=c.legacy?old.texture:target.texture;
    scene.environmentIntensity=c.legacy?1:c.intensity;
    scene.environmentRotation.set(0,c.legacy?0:T.MathUtils.degToRad(c.rotation),0);
    scene.background=new T.Color(c.legacy?'#dde3ea':c.background);
    ambient.intensity=c.legacy?2:0;key.intensity=c.legacy?3:(c.preset==='contrast'?.3:.6);
    key.castShadow=!c.legacy;floor.visible=!c.legacy;current=c;
  }
  apply();
  return {apply, groundAt:y=>{floor.position.y=y-.012},inspect:()=>({revision,threeRevision:T.REVISION,hdrSha256:digest,hdrSize:[hdr.width,hdr.height],toneMapping:current.legacy?'ACESFilmic':'Khronos PBR Neutral',output:'sRGB',...current}),dispose(){target.dispose();old.dispose();floor.geometry.dispose();floor.material.dispose();scene.remove(ambient,key,floor)}};
}

export function prepareMaterials(root, renderer, asset, profiles) {
  const originals=new Map(),profile=profiles[asset.id];
  const compatible=profile?.modelSha256===asset.runtimeSha256;
  const patched=[];
  root.traverse(n=>{if(!n.isMesh)return;n.castShadow=n.receiveShadow=true;
    n.material=Array.isArray(n.material)?n.material.map(m=>m.clone()):n.material.clone();
    for(const m of [n.material].flat()) {
      for(const t of Object.values(m))if(t?.isTexture)t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      originals.set(m,{metalness:m.metalness,roughness:m.roughness,specularIntensity:m.specularIntensity,specularIntensityMap:m.specularIntensityMap});
      const correction=compatible?profile.materials[m.name]:null;if(correction)patched.push({m,correction});
    }
  });
  return {apply(enabled){for(const [m,v]of originals)Object.assign(m,v);if(enabled)for(const {m,correction}of patched){Object.assign(m,correction.values);m.needsUpdate=true}},inspect:()=>({matched:patched.length,profile:compatible?profile:null,warning:profile&&!compatible?'Material profile skipped: different GLB hash':null})};
}
