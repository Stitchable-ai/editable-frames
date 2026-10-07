// Additive website-only migration: keep existing values, history, cursor and binding.
// This does not change the generic framework's strict schema validation.
export function migrateDeviceSession(raw){
 if(typeof raw!=='string'||raw.length>32*1024*1024)throw Error('Project too large');
 const saved=JSON.parse(raw);
 function visit(value){
  if(!value||typeof value!=='object')return;
  if(value.id==='device.direction'&&value.type==='device'&&value.props){
   if(!Object.hasOwn(value.props,'finish'))value.props.finish='aluminium';
   if(!Object.hasOwn(value.props,'reflections'))value.props.reflections=110;
  }
  for(const child of Object.values(value))visit(child);
 }
 visit(saved.base);visit(saved.history);
 return JSON.stringify(saved);
}
