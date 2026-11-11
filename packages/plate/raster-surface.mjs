/** Rasterize a UV mesh once per output pixel without Canvas clip seams.
 * The inverse barycentric map keeps adjacent triangles from double-blending
 * antialiased clip edges. Output is straight RGBA; interpolation is premultiplied. */
export function rasterizeSurface(pixels,sourceWidth,sourceHeight,mesh,width,height,{wrap=false}={}){
 if(pixels.length!==sourceWidth*sourceHeight*4||![sourceWidth,sourceHeight,width,height].every(n=>Number.isSafeInteger(n)&&n>0)||width*height>4096*4096)throw Error('Invalid surface raster dimensions');
 const out=new Uint8ClampedArray(width*height*4);
 for(const t of mesh.triangles){
  const [a,b,c]=t.map(i=>mesh.vertices[i]),[ua,ub,uc]=t.map(i=>mesh.uv[i]);
  const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<1e-9)continue;
  const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(width,Math.ceil(Math.max(a[0],b[0],c[0]))),y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(height,Math.ceil(Math.max(a[1],b[1],c[1])));
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const aa=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/det,bb=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/det,cc=1-aa-bb;
   if(aa< -1e-8||bb< -1e-8||cc< -1e-8)continue;
   let u=ua[0]*aa+ub[0]*bb+uc[0]*cc,v=ua[1]*aa+ub[1]*bb+uc[1]*cc;
   if(wrap)u=((u%1)+1)%1;else if(u<0||u>1)continue;
   if(v<0||v>1)continue;
   const sx=u*(sourceWidth-1),sy=v*(sourceHeight-1),ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
   const indices=[iy*sourceWidth+ix,iy*sourceWidth+Math.min(ix+1,sourceWidth-1),Math.min(iy+1,sourceHeight-1)*sourceWidth+ix,Math.min(iy+1,sourceHeight-1)*sourceWidth+Math.min(ix+1,sourceWidth-1)],weights=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy];
   let alpha=0;const rgb=[0,0,0];
   for(let i=0;i<4;i++){const j=indices[i]*4,aw=pixels[j+3]/255*weights[i];alpha+=aw;for(let k=0;k<3;k++)rgb[k]+=pixels[j+k]*aw;}
   const dest=(y*width+x)*4;if(alpha>0){for(let k=0;k<3;k++)out[dest+k]=rgb[k]/alpha;out[dest+3]=alpha*255;}
  }
 }
 return out;
}
