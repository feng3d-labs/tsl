import{a3 as u,a4 as y,Y as B,Z as $}from"./builtins-C5GxhwDd.js";function x(f,e){const s=new g(f),i=B();if(i){const n=$();n?n.statements.push(s):i.statements.push(s),i.dependencies.push(f),u(s),s.beginBody(),e(),s.endBody(),y()}return{else(n){i&&(u(s),s.beginElseBody(),n(),s.endElseBody(),y())}}}class g{constructor(e){this.statements=[],this.elseStatements=[],this.isBodyActive=!1,this.isElseBodyActive=!1,this.condition=e}beginBody(){this.isBodyActive=!0}endBody(){this.isBodyActive=!1}beginElseBody(){this.isElseBodyActive=!0}endElseBody(){this.isElseBodyActive=!1}addStatement(e){this.isBodyActive?this.statements.push(e):this.isElseBodyActive&&this.elseStatements.push(e)}toGLSL(){const e=this.condition.toGLSL(),s=[];for(const n of this.statements){const a=n.toGLSL().split(`
`);for(const r of a)s.push(`    ${r}`)}let i=`if (${e}) {
${s.join(`
`)}
}`;if(this.elseStatements.length>0){const n=[];for(const l of this.elseStatements){const r=l.toGLSL().split(`
`);for(const m of r)n.push(`    ${m}`)}i+=` else {
${n.join(`
`)}
}`}return i}toWGSL(){if(this._wgslCache!==void 0)return this._wgslCache;const e=this.condition.toWGSL(),s=[];for(const t of this.statements)s.push(t.toWGSL());const i=[];for(const t of this.elseStatements)i.push(t.toWGSL());const n=/textureSample\s*\([^)]+\)/g,l=new Map;let a=0;const r=t=>t.replace(n,o=>{if(l.has(o))return l.get(o);const c=`_ts${a++}`;return l.set(o,c),c}),m=s.map(t=>r(t)),p=i.map(t=>r(t));if(l.size>0){const t=Array.from(l.keys()).map(o=>`  - ${o}`).join(`
`);console.warn(`[TSL] WGSL 限制：if 语句中检测到 ${l.size} 个 textureSample 调用，已自动移至 if 语句前。
条件: ${e}
涉及的采样调用:
${t}
建议: 请手动将 texture() 调用移至 if 语句外部，以避免此警告。`)}const h=[];for(const[t,o]of l)h.push(`let ${o} = ${t};`);const S=[];for(const t of m){const o=t.split(`
`);for(const c of o)S.push(`    ${c}`)}let d=`if (${e}) {
${S.join(`
`)}
}`;if(p.length>0){const t=[];for(const o of p){const c=o.split(`
`);for(const L of c)t.push(`    ${L}`)}d+=` else {
${t.join(`
`)}
}`}return h.push(d),this._wgslCache=h.join(`
`),this._wgslCache}}export{x as i};
