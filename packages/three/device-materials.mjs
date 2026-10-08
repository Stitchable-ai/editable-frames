import * as T from 'three';

// A finish is a renderer policy, not a restriction on what a clip may draw.
export const deviceFinishes = Object.freeze({
  aluminium: Object.freeze({metalness:1, roughness:.26}),
  authored: null,
});

/** Default for newly generated device chassis. Pass any PBR values to override. */
export function createDeviceMaterial(values={}) {
  return new T.MeshStandardMaterial({color:'#bfc3c7', ...deviceFinishes.aluminium, ...values});
}

function roleOf(mesh, material, roles) {
  const explicit=roles[mesh.name] ?? roles[material.name] ?? material.userData?.deviceRole ?? mesh.userData?.deviceRole;
  if(explicit)return explicit;
  const name=(mesh.name+' '+material.name).toLowerCase();
  // Never turn glass, UI, keys, rubber, or antenna inserts into metal.
  if(/screen|display|oled|glass|lens|camera|plastic|rubber|keycap|keyboard|antenna|antena|logo/.test(name))return 'authored';
  if(/alumin[iu]*m|metal|chassis|housing|enclosure|body|^frame\b| frame\b/.test(name))return 'body';
  return 'authored';
}

// A few source GLBs merge front glass and chassis into one material. Partition
// their triangles using a reviewed local-coordinate region, without changing
// positions, UVs, node names, or the original asset. Only digest-matched profiles
// can opt in; unknown geometry is never guessed from its silhouette.
function separateSurfaces(mesh, regions) {
  if(Array.isArray(mesh.material)||!mesh.geometry.index)return new Map();
  const region=regions?.find(r=>r.mesh===mesh.name);if(!region)return new Map();
  const geometry=mesh.geometry.clone(),position=geometry.getAttribute('position');
  const index=geometry.index,body=[],surface=[];
  const axis={x:0,y:1,z:2}[region.axis];
  for(let i=0;i<index.count;i+=3){
    const triangle=[index.getX(i),index.getX(i+1),index.getX(i+2)];
    const center=triangle.reduce((sum,j)=>sum+position.getComponent(j,axis),0)/3;
    (center>=region.min?surface:body).push(...triangle);
  }
  if(!surface.length||!body.length){geometry.dispose();return new Map();}
  geometry.setIndex([...body,...surface]);geometry.clearGroups();
  geometry.addGroup(0,body.length,0);geometry.addGroup(body.length,surface.length,1);
  const original=mesh.material,front=original.clone();front.name=region.name;
  mesh.geometry=geometry;mesh.material=[original,front];
  return new Map([[front,region.values]]);
}

/** Clone before editing. Unknown/mixed materials stay authored until given a role.
 * A profile is applied only to the asset digest it was reviewed against.
 */
export function prepareMaterials(root, renderer, asset={}, profiles={}, options={}) {
  const profile=profiles[asset.id];
  const compatible=!!profile && profile.modelSha256===asset.runtimeSha256;
  const roles={...(compatible?profile.roles:{}),...options.roles};
  const entries=[];
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    mesh.castShadow=mesh.receiveShadow=true;
    const surfaceValues=compatible&&roles[mesh.name]!=='authored'
      ?separateSurfaces(mesh,profile.surfaceRegions):new Map();
    mesh.material=[mesh.material].flat().map(source=>{
      const material=source.clone();
      for(const texture of Object.values(material))if(texture?.isTexture)texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      const correction=compatible?profile.materials?.[material.name]:null;
      const surface=surfaceValues.get(source);
      const role=surface?'authored':roleOf(mesh,material,roles);
      entries.push({material,original:material.clone(),role,correction,surface});
      return material;
    });
    if(mesh.material.length===1)mesh.material=mesh.material[0];
  });
  let last;
  function apply(value=options.finish??'aluminium') {
    const finish=typeof value==='boolean'?(value?'aluminium':'authored'):value;
    if(!Object.hasOwn(deviceFinishes,finish))throw Error('Unknown device finish: '+finish);
    if(finish===last)return;
    for(const {material,original,role,correction,surface}of entries){
      material.copy(original);
      if(finish==='aluminium' && material.isMeshStandardMaterial){
        if(role==='body'){
          Object.assign(material,deviceFinishes.aluminium,{metalnessMap:null,roughnessMap:null});
          // Source white dielectric bodies need a plausible metal reflectance.
          const peak=Math.max(material.color.r,material.color.g,material.color.b);
          if(peak>.8)material.color.multiplyScalar(.7/peak);
          if('specularIntensity'in material){material.specularIntensity=1;material.specularIntensityMap=null;}
        }
        if(correction&&role==='body')Object.assign(material,correction.values);
        if(surface)material.setValues(surface);
      }
      material.needsUpdate=true;
    }
    last=finish;
  }
  apply();
  return {apply,inspect:()=>({finish:last,matched:entries.filter(e=>e.role==='body'||e.correction).length,preserved:entries.filter(e=>e.role!=='body'&&!e.correction).length,profile:compatible?profile:null,warning:profile&&!compatible?'Material profile skipped: different GLB hash':null}),dispose(){for(const e of entries)e.original.dispose();}};
}
