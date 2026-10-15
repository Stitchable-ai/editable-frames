import {DataUtils,HalfFloatType} from 'three';

// Average linear HDR radiance before uploading a smaller preview environment.
// Full-resolution rendering remains the default for framework consumers.
export function environmentPreview(image,maxWidth){
 if(image.width<=maxWidth)return image;
 const width=Math.max(1,Math.floor(maxWidth)),height=Math.max(1,Math.round(image.height*width/image.width));
 const data=new image.data.constructor(width*height*4),half=image.type===HalfFloatType;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const left=Math.floor(x*image.width/width),right=Math.floor((x+1)*image.width/width),top=Math.floor(y*image.height/height),bottom=Math.floor((y+1)*image.height/height),count=(right-left)*(bottom-top);
  for(let c=0;c<4;c++){let sum=0;for(let row=top;row<bottom;row++)for(let col=left;col<right;col++){const v=image.data[(row*image.width+col)*4+c];sum+=half?DataUtils.fromHalfFloat(v):v}data[(y*width+x)*4+c]=half?DataUtils.toHalfFloat(sum/count):sum/count}
 }
 return {...image,data,width,height};
}
