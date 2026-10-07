import {ticks} from '../core/index.mjs';
const number=(label,min,max,step=.01)=>({type:'number',label,min,max,step}),color=label=>({type:'color',label}),bool=label=>({type:'boolean',label});
const fx=(id,name,category,mode,defaults,schema,limit)=>({id,name,category,mode,defaults:{enabled:true,...defaults},schema:{enabled:bool('Enabled'),...schema},limit});
export const effects=[
fx('ec.blur.gaussian','Gaussian Blur','Blur',1,{radius:8},{radius:number('Radius · pixels',0,32,.5)},'Separable Gaussian kernel; no AE radius calibration or repeat-edge option.'),
fx('ec.blur.directional','Directional Blur','Blur',2,{radius:20,angle:30},{radius:number('Distance · pixels',0,48,.5),angle:number('Angle',-180,180,1)},'33-tap straight blur; no AE kernel calibration.'),
fx('ec.stylize.glow','Glow','Light',3,{radius:14,strength:1.4,threshold:.48},{radius:number('Radius · pixels',1,32,.5),strength:number('Intensity',0,4),threshold:number('Luminance threshold',0,1)},'Threshold + two-pass Gaussian + additive light; subset of 14 upstream controls.'),
fx('ec.color.exposure','Exposure','Color',4,{stops:.7},{stops:number('Exposure · stops',-3,3)},'Linear-light gain only; no gamma/pedestal/offset controls.'),
fx('ec.color.huesaturation','Hue / Saturation','Color',5,{hue:75,saturation:1.3},{hue:number('Hue rotation',-180,180,1),saturation:number('Saturation multiplier',0,2)},'Global hue and saturation; no per-color ranges or 50-parameter parity.'),
fx('ec.color.tint','Tint','Color',6,{dark:'#102a4a',light:'#ffc781',amount:1},{dark:color('Dark tones'),light:color('Light tones'),amount:number('Mix',0,1)},'Luminance-based two-color mapping.'),
fx('ec.channel.invert','Invert','Color',7,{amount:1},{amount:number('Mix',0,1)},'RGB inversion only; not every upstream channel mode.'),
fx('ec.distort.turbulentdisplace','Turbulent Displace','Distort',8,{amount:22,scale:5,speed:.65},{amount:number('Displacement · pixels',0,60,1),scale:number('Noise scale',1,14),speed:number('Evolution speed',0,2)},'Animated noise displacement; no locked pinning or AE noise identity.'),
fx('ec.distort.twirl','Twirl','Distort',9,{angle:130,radius:.65},{angle:number('Twist angle',-360,360,1),radius:number('Influence radius',.1,1)},'Centered inverse UV warp with smooth falloff.'),
fx('ec.distort.wavewarp','Wave Warp','Distort',10,{amount:18,frequency:8,speed:1},{amount:number('Wave height · pixels',0,55,1),frequency:number('Wave count',1,24),speed:number('Phase speed',0,3)},'Sine-wave distortion; one wave family and direction.'),
fx('ec.stylize.mosaic','Mosaic','Stylize',11,{size:16},{size:number('Block size · pixels',1,64,1)},'Nearest cell-center sampling; not exact area averaging.'),
fx('ec.stylize.findedges','Find Edges','Stylize',12,{strength:3},{strength:number('Edge gain',.1,8)},'Sobel luminance edges; no AE reference-image matching.'),
fx('ec.stylize.posterize','Posterize','Stylize',13,{levels:5},{levels:{...number('Color levels',2,24,1),integer:true}},'Quantizes display-space RGB to N levels.'),
fx('ec.noise.noise','Noise','Texture',14,{amount:.14,seed:17},{amount:number('Noise amount',0,.5),seed:{...number('Seed',1,100,1),integer:true}},'Seeded monochrome noise at explicit frame time.'),
fx('ec.generate.gradientramp','Gradient Ramp','Generate',15,{start:'#193d9e',end:'#ffbe88',angle:20},{start:color('Start color'),end:color('End color'),angle:number('Angle',-180,180,1)},'Two-color linear ramp generator.'),
fx('ec.transition.linearwipe','Linear Wipe','Transition',16,{progress:.5,feather:.08},{progress:number('Reveal',0,1),feather:number('Edge feather',.001,.3)},'Horizontal alpha reveal; source motion continues beneath it.'),
fx('ec.transition.radialwipe','Radial Wipe','Transition',17,{progress:.65,feather:.03},{progress:number('Reveal',0,1),feather:number('Edge feather',.001,.15)},'Clockwise angular alpha reveal.'),
fx('ec.transition.venetian','Venetian Blinds','Transition',18,{progress:.55,bands:12},{progress:number('Reveal',0,1),bands:{...number('Bands',2,40,1),integer:true}},'Horizontal repeating wipe; limited controls.'),
fx('ec.time.echo','Echo','Time',19,{count:7,spacing:.10,decay:.73},{count:{...number('Historical samples',1,16,1),integer:true},spacing:number('Sample spacing · seconds',.025,.4),decay:number('Decay',.1,.95)},'Samples original procedural source at earlier times; additive/composite trail, no external MP4 frame host yet.'),
fx('ec.time.posterizetime','Posterize Time','Time',20,{fps:6},{fps:{...number('Source samples per second',2,24,1),integer:true}},'Quantized source time; does not change output video frame rate.'),
fx('ec.channel.setmatte','Set Matte','Composite',21,{radius:.36,softness:.06},{radius:number('Matte radius',.05,.8),softness:number('Matte softness',.005,.2)},'Samples a separate animated grayscale mask texture. Limited to luminance matte.'),
fx('ec.key.colorkey','Color Key','Composite',22,{tolerance:.45,softness:.12},{tolerance:number('Green-screen distance',.05,.9),softness:number('Edge softness',.01,.3)},'Simple green-distance key on synthetic footage; not Keylight, spill suppression or hair-quality proof.'),
fx('ec.stylize.ccvignette','Vignette','Light',23,{amount:.75,radius:.5},{amount:number('Darkening',0,1),radius:number('Clear center',.1,.9)},'Radial falloff, not every CC Vignette mode.'),
fx('ec.generate.beam','Beam','Generate',24,{width:.014,color:'#91dcff',intensity:2},{width:number('Beam width',.002,.08),color:color('Beam color'),intensity:number('Brightness',.1,4)},'Animated analytic beam with a soft envelope; no 3D occlusion.'),
];
export const byId=Object.fromEntries(effects.map(x=>[x.id,x]));
const sourceSchema={title:{type:'text',maxLength:28,label:'Title'},accent:color('Accent'),speed:number('Motion speed',.1,2),style:{type:'enum',label:'Source design',values:['orbital','product','key','type']}};
const source={title:'FORM / MOTION',accent:'#8debda',speed:1,style:'orbital'};
function make(id,title,description,stack,style='orbital'){const nodes=[{id:'source',type:'source',label:'Source artwork',props:{...source,title,style}}];const schemas={source:sourceSchema};stack.forEach((entry,i)=>{const [fxid,props]=Array.isArray(entry)?entry:[entry,{}],e=byId[fxid],type='fx'+i;nodes.push({id:'effect.'+i,type,label:e.name,effect:fxid,props:{...e.defaults,...props}});schemas[type]=e.schema});return {id,title,name:title,description,duration:6,sourceDuration:ticks(6),nodes,schemas,stack:nodes.slice(1).map(n=>({anchor:n.id,effect:n.effect})),defaults:{},payload:{order:nodes.slice(1).map(n=>n.id)},validatePayload(p){if(!p||!Array.isArray(p.order)||p.order.length!==stack.length||new Set(p.order).size!==stack.length||p.order.some(id=>!nodes.some(n=>n.id===id&&n.effect)))throw Error('Invalid effect stack order')}}}
export const studies=[
make('look.aurora','SIGNAL / BLOOM','Luminous motion through a real multipass glow, color grade and vignette.',['ec.stylize.glow',['ec.color.huesaturation',{hue:25,saturation:1.15}],'ec.stylize.ccvignette']),
make('look.ink','LIQUID / TYPE','Typography bends through animated displacement, duotone mapping and seeded texture.',['ec.distort.turbulentdisplace',['ec.color.tint',{dark:'#122643',light:'#d5ebd8'}],['ec.noise.noise',{amount:.035}]],'type'),
make('look.echo','AFTER / IMAGE','Echo requests previous source times. Scrubbing backward gives the same result.',['ec.time.echo',['ec.stylize.glow',{strength:.8,threshold:.7}]],'orbital'),
make('look.reveal','REVEAL / SYSTEM','A product panel is revealed through a separate animated mask texture.',['ec.channel.setmatte',['ec.stylize.glow',{strength:.6}]],'product'),
make('look.print','DIGITAL / PRINT','Color reduction, block sampling and a deliberately stepped source clock.',['ec.time.posterizetime',['ec.stylize.posterize',{levels:4}],['ec.stylize.mosaic',{size:6}]],'orbital'),
make('look.key','KEY / COMPOSITE','A synthetic green-screen source is keyed and composited over a contrasting background.',['ec.key.colorkey'],'key'),
...effects.map((e,i)=>make('effect.'+i,e.name,e.limit,[e.id],e.mode===22?'key':[8,9,10,12,21].includes(e.mode)?'type':'orbital'))
];
export const templates=Object.fromEntries(studies.map(x=>[x.id,x]));
