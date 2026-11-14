import {sampleMaskCorrections} from './prepared.mjs';

/** A holdout protects one authored DOM/Canvas/WebGL group. It clips the code
 * layer itself, so no screenshot/readback of arbitrary code content is needed.
 * Alpha is treated as linear coverage. Soft edges retain the source plate's
 * observed colors; foreground color decontamination is a separate input. */
export function createForegroundHoldout({root,width,height,document:doc=root.ownerDocument}) {
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1)throw Error('Holdout needs positive raster dimensions');
  const content=doc.createElement('div');
  content.style.cssText='position:absolute;inset:0;overflow:hidden';root.append(content);
  const canvas=doc.createElement('canvas');canvas.width=width;canvas.height=height;
  const c=canvas.getContext('2d',{willReadFrequently:true});
  let disposed=false,directMask=null;
  return {
    root:content,
    diagnosticMask(){
      if(directMask){c.globalCompositeOperation='copy';c.drawImage(directMask,0,0,width,height);}
      const image=c.getImageData(0,0,width,height);
      for(let i=0;i<image.data.length;i+=4){image.data[i]=0;image.data[i+1]=255;image.data[i+2]=120;image.data[i+3]=Math.round((directMask?image.data[i+3]:255-image.data[i+3])*.4);}
      return image;
    },
    update(mask,{channel='luminance',corrections,frame=0,sourceSha256,subject}={}) {
      if(disposed)throw Error('Holdout disposed');
      if(!mask)throw Error(`Required foreground mask missing at source frame ${frame}`);
      if((mask.naturalWidth??mask.width)!==width||(mask.naturalHeight??mask.height)!==height)throw Error('Holdout mask does not match the source raster');
      if(!['luminance','alpha'].includes(channel))throw Error('Unknown foreground channel');
      if(channel==='alpha'&&!corrections&&typeof mask.src==='string'&&globalThis.CSS?.supports?.('mask-composite','exclude')){
        directMask=mask;
        const layers=`linear-gradient(#fff,#fff),url("${mask.src}")`;
        Object.assign(content.style,{maskImage:layers,webkitMaskImage:layers,maskMode:'alpha,alpha',maskComposite:'exclude',webkitMaskComposite:'xor',maskSize:'100% 100%,100% 100%',webkitMaskSize:'100% 100%,100% 100%',maskRepeat:'no-repeat',webkitMaskRepeat:'no-repeat'});
        return;
      }
      directMask=null;
      c.globalCompositeOperation='copy';c.drawImage(mask,0,0,width,height);
      const image=c.getImageData(0,0,width,height),d=image.data;
      for(let i=0;i<d.length;i+=4){const a=channel==='alpha'?d[i+3]:(d[i]*54+d[i+1]*183+d[i+2]*19)>>8;d[i]=d[i+1]=d[i+2]=255;d[i+3]=a;}
      c.putImageData(image,0,0);
      if(corrections){
        if(corrections.sourceSha256!==sourceSha256||corrections.subject!==subject)throw Error('Corrections belong to a different source or subject');
        for(const p of sampleMaskCorrections(corrections,frame)){
          if(p.operation==='replace'){c.clearRect(0,0,width,height);c.globalCompositeOperation='source-over';}
          else c.globalCompositeOperation=p.operation==='subtract'?'destination-out':'source-over';
          c.fillStyle='#fff';c.beginPath();p.points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
        }
      }
      // Invert foreground coverage to visibility for the affected code group.
      const corrected=c.getImageData(0,0,width,height);
      for(let i=3;i<corrected.data.length;i+=4)corrected.data[i]=255-corrected.data[i];
      c.putImageData(corrected,0,0);c.globalCompositeOperation='source-over';
      const url=`url("${canvas.toDataURL('image/png')}")`;
      Object.assign(content.style,{maskComposite:'add',webkitMaskComposite:'source-over',maskMode:'alpha',maskImage:url,webkitMaskImage:url,maskSize:'100% 100%',webkitMaskSize:'100% 100%',maskRepeat:'no-repeat',webkitMaskRepeat:'no-repeat'});
    },
    dispose(){disposed=true;content.remove();canvas.width=canvas.height=0;},
  };
}

/** Preview/export diagnostic: graphics must never cover an annotated opaque
 * foreground interior. Thresholds deliberately exclude fractional hair edges. */
export function foregroundLeakage(source,composite,alpha,{tolerance=1,opaque=254}={}) {
  if(source.length!==composite.length||alpha.length!==source.length||source.length%4)throw Error('Leakage rasters must match');
  let protectedPixels=0,leakedPixels=0,maxError=0;
  for(let i=0;i<source.length;i+=4)if(alpha[i]>=opaque){protectedPixels++;const e=Math.max(...[0,1,2].map(c=>Math.abs(source[i+c]-composite[i+c])));maxError=Math.max(maxError,e);if(e>tolerance)leakedPixels++;}
  return {protectedPixels,leakedPixels,maxError};
}
