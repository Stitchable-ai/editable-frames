import {mount} from '../../packages/runtime/editor.mjs';
import {templates} from '../../examples/films/catalog.mjs';
import {createRenderer as make} from '../../examples/films/renderer.mjs';
import {binding} from './binding.mjs';
await mount({templates,binding,createRenderer(canvas){const r=make(canvas);return {render:({template,time,nodes})=>r.draw(template.scene,time,nodes[0].props)}}});
