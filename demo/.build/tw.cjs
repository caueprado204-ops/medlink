const c=n=>`rgb(var(--c-${n}) / <alpha-value>)`;
module.exports={content:['/home/claude/medlink/demo/.build/content.html'],theme:{extend:{
 colors:Object.fromEntries(['bg','panel','panel2','line','ink','soft','faint','navy','onnavy','lime','onlime','teal','tealsoft','sky','skyink','amber','amberbg','danger','dangerbg','cobalt','cobaltdeep','mint','p1','p2','p3','p4','p5','p6','onp'].map(k=>[k,c(k)])),
 fontFamily:{sans:['Manrope','system-ui','sans-serif']}}}};