// Original study, MIT; provenance in ATTRIBUTIONS.md. Added companion is demo-specific.
import {drawPaper} from './canvas-scene.mjs';
import {beginObjects,canvasObjects} from './object-controls.mjs';
export function createStudioPaper(canvas){
 canvas.width=1280;canvas.height=720;const context=canvas.getContext('2d');let state;
 if(!context)throw Error('Canvas unavailable');
 const objects=canvasObjects(()=>state,['robot','sprout','friend','watering']);
 return {objects,draw(time,props){
  context.clearRect(0,0,1280,720);state=beginObjects(context,props);drawPaper(context,time,props);
 },dispose(){state=null}};
}
