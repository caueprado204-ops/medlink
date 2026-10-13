const {useState,useEffect,useMemo,useRef,useContext,createContext,Fragment}=React;
const html=htm.bind(React.createElement);

/* ------------------------------------------------------------------ ícones */
const IP={
 dash:'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z', cal:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
 inbox:'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z', users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
 user:'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
 hist:'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2', gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
 bell:'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0', plus:'M12 5v14M5 12h14', left:'M15 18l-6-6 6-6', right:'M9 18l6-6-6-6', x:'M18 6L6 18M6 6l12 12',
 check:'M20 6L9 17l-5-5', alert:'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01', ban:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM4.9 4.9l14.2 14.2',
 send:'M22 2L11 13M22 2l-7 20-4-9-9-4z', copy:'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
 out:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9', menu:'M3 6h18M3 12h18M3 18h18', search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
 pencil:'M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z', trash:'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
 home:'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', box:'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8', thermo:'M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z',
 syringe:'M18 2l4 4M17 7l3-3M19 9l-8.7 8.7a2 2 0 0 1-1.4.6H5v-3.9a2 2 0 0 1 .6-1.4L14 3M9 11l4 4M5 19l-3 3M14 4l6 6', wallet:'M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7M16 14h.01',
 chart:'M3 3v18h18M7 15v2M11 11v6M15 7v10M19 12v5', wand:'M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5',
 book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM20 17v4H6.5a2.5 2.5 0 0 1 0-5', sun:'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
 moon:'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z', ur:'M7 17L17 7M8 7h9v9', pin:'M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
 clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', star:'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z', down:'M6 9l6 6 6-6'};
const Icon=({n,s=16,className})=>html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className=${className}><path d=${IP[n]}/></svg>`;

const Logo=({onDark})=>html`<span className="inline-flex items-center">
  <span className=${cx('display-n rounded-[10px] px-2.5 py-1 text-[15px] tracking-tight',onDark?'bg-white text-[#0c0d0f]':'bg-navy text-onnavy')}>MED</span>
  <span className="display-n -ml-1 -translate-y-1 rounded-[10px] rounded-bl-none bg-lime px-2 py-0.5 text-[13px] text-onlime">LINK</span></span>`;

/* ------------------------------------------------------------------ primitivas */
const Ctx=createContext(null);
const useApp=()=>useContext(Ctx);
const TONE={neutral:'bg-panel2 text-soft',teal:'bg-tealsoft text-teal',sky:'bg-sky text-skyink',amber:'bg-amberbg text-amber',danger:'bg-dangerbg text-danger',lime:'bg-lime text-onlime',ink:'bg-navy text-onnavy'};
const Badge=({tone='neutral',children,className})=>html`<span className=${cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',TONE[tone],className)}>${children}</span>`;
function Btn({v='soft',size='md',icon,className,children,...rest}){
  const vv={lime:'bg-lime text-onlime hover:brightness-95',ink:'bg-navy text-onnavy hover:opacity-90',soft:'bg-panel2 text-ink hover:brightness-[.97] dark:hover:brightness-110',ghost:'bg-transparent text-soft hover:bg-panel2 hover:text-ink',danger:'bg-dangerbg text-danger hover:brightness-95',glass:'bg-onnavy/15 text-onnavy hover:bg-onnavy/25',line:'border border-line bg-transparent text-ink hover:bg-panel2'}[v];
  return html`<button type="button" ...${rest} className=${cx('inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-45',size==='sm'?'h-8 px-3.5 text-[13px]':size==='lg'?'h-12 px-6 text-[15px]':'h-10 px-5 text-sm',vv,className)}>${icon&&html`<${Icon} n=${icon} s=${size==='sm'?14:16}/>`}${children}</button>`;
}
const IconBtn=({n,label,onClick,badge,className})=>html`<button onClick=${onClick} aria-label=${label} title=${label} className=${cx('relative grid h-10 w-10 place-items-center rounded-full bg-panel2 text-ink transition hover:bg-lime hover:text-onlime',className)}><${Icon} n=${n} s=${18}/>${badge>0&&html`<span className="absolute -right-0.5 -top-0.5 min-w-[1.15rem] rounded-full bg-lime px-1 text-center text-[0.65rem] font-bold leading-[1.15rem] text-onlime ring-2 ring-panel">${badge>9?'9+':badge}</span>`}</button>`;
const selCls='block w-auto max-w-full rounded-2xl border border-transparent bg-panel px-4 text-sm text-ink focus:border-lime focus:outline-none';
const inputCls='block w-full rounded-2xl border border-transparent bg-panel2 px-4 py-2.5 text-[15px] text-ink placeholder:text-faint focus:border-lime focus:outline-none disabled:opacity-60';
const Field=({label,id,hint,children,className})=>html`<div className=${className}><label htmlFor=${id} className="mb-1.5 block text-[13px] font-semibold text-soft">${label}</label>${children}${hint&&html`<p className="mt-1 text-xs text-faint">${hint}</p>`}</div>`;
const Card=({title,action,children,className,pad=true,sub})=>html`<section className=${cx('rounded-[28px] bg-panel shadow-[0_1px_0_rgb(var(--c-line))]',className)}>
  ${title&&html`<div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-2 pt-5"><div><h2 className="text-[17px] font-bold">${title}</h2>${sub&&html`<p className="text-[13px] text-soft">${sub}</p>`}</div>${action}</div>`}
  <div className=${pad?'px-6 pb-6 pt-2':''}>${children}</div></section>`;
const Empty=({title,children,action})=>html`<div className="hatch rounded-[22px] px-5 py-8"><p className="font-bold">${title}</p>${children&&html`<p className="mt-1 max-w-md text-sm text-soft">${children}</p>`}${action&&html`<div className="mt-3">${action}</div>`}</div>`;
const Stat=({label,value,unit,tone,children,onClick})=>html`<button onClick=${onClick} disabled=${!onClick} className="group flex flex-col rounded-[24px] bg-panel2 px-5 py-4 text-left transition enabled:hover:ring-2 enabled:hover:ring-lime disabled:cursor-default">
  <span className="flex items-center justify-between text-[13px] font-semibold text-soft">${label}${onClick&&html`<${Icon} n="ur" s=${14} className="opacity-0 transition group-hover:opacity-100"/>`}</span>
  <span className=${cx('thin mt-1 text-[34px] leading-tight',tone==='danger'?'text-danger':tone==='amber'?'text-amber':tone==='teal'?'text-teal':'')}>${value}${unit&&html`<span className="ml-1 text-base text-faint">${unit}</span>`}</span>${children}</button>`;
function Seg({items,value,onChange,size}){return html`<div className="no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-panel p-1 shadow-[0_1px_0_rgb(var(--c-line))]" role="tablist">
  ${items.map(([k,l,n])=>html`<button key=${k} role="tab" aria-selected=${value===k} onClick=${()=>onChange(k)} className=${cx('inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold transition',size==='sm'?'px-3 py-1.5 text-[13px]':'px-4 py-2 text-sm',value===k?'bg-lime text-onlime':'text-soft hover:text-ink')}>${l}${n!=null&&html`<span className=${cx('grid min-w-[1.25rem] place-items-center rounded-full px-1 text-[11px]',value===k?'bg-onlime text-lime':'bg-panel2 text-ink')}>${n}</span>`}</button>`)}</div>`}
const hue=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return h};
const initials=n=>n.replace(/^(Sr\.|Dona|Dra?\.)\s/,'').split(' ').map(x=>x[0]).slice(0,2).join('');
const Avatar=({name,size=36,ring})=>html`<span title=${name} className=${cx('grid shrink-0 place-items-center rounded-full font-bold text-[#15171a]',ring&&'ring-2 ring-panel')} style=${{width:size,height:size,fontSize:size*.36,background:`hsl(${hue(name)} 72% 80%)`}}>${initials(name)}</span>`;
const Stack=({names,max=5,size=32})=>html`<span className="flex items-center">${names.slice(0,max).map((n,i)=>html`<span key=${i} className=${i?'-ml-2':''}><${Avatar} name=${n} size=${size} ring/></span>`)}${names.length>max&&html`<span className="-ml-2 grid place-items-center rounded-full bg-panel2 text-[11px] font-bold ring-2 ring-panel" style=${{width:size,height:size}}>+${names.length-max}</span>`}</span>`;
const PageHead=({title,desc,actions,back})=>html`<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
  <div className="flex min-w-0 items-center gap-4">${back&&html`<${IconBtn} n="left" label="Voltar" onClick=${back}/>`}<div className="min-w-0"><h1 className="thin text-[40px] leading-[1.05] sm:text-[48px]">${title}</h1>${desc&&html`<p className="mt-1.5 max-w-2xl text-[15px] text-soft">${desc}</p>`}</div></div>
  ${actions&&html`<div className="flex flex-wrap gap-2">${actions}</div>`}</div>`;
function Modal({open,onClose,title,desc,children,footer,wide}){
  const ref=useRef(null);
  useEffect(()=>{const d=ref.current;if(!d)return;if(open&&!d.open)d.showModal();if(!open&&d.open)d.close()},[open]);
  return html`<dialog ref=${ref} onCancel=${e=>{e.preventDefault();onClose()}} onClick=${e=>{if(e.target===ref.current)onClose()}}
    className=${cx('anim m-auto w-[calc(100%-2rem)] rounded-[30px] bg-panel p-0 text-ink shadow-2xl',wide?'max-w-3xl':'max-w-lg')}>
    ${open&&html`<div className="flex max-h-[88vh] flex-col">
      <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-6"><div className="min-w-0"><h2 className="thin text-[26px] leading-tight first-letter:uppercase">${title}</h2>${desc&&html`<p className="mt-1 text-sm text-soft">${desc}</p>`}</div><${IconBtn} n="x" label="Fechar" onClick=${onClose}/></div>
      <div className="overflow-y-auto px-6 pb-5">${children}</div>
      ${footer&&html`<div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">${footer}</div>`}</div>`}</dialog>`;
}
const Checks=({c,compact})=>(!c.blocking.length&&!c.warnings.length)?null:html`<ul className=${compact?'mt-1.5 space-y-0.5':'space-y-1.5'}>
  ${c.blocking.map((b,i)=>html`<li key=${'b'+i} className="flex items-start gap-1.5 text-sm text-danger"><${Icon} n="ban" s=${14} className="mt-0.5 shrink-0"/><span>${b}</span></li>`)}
  ${c.warnings.map((w,i)=>html`<li key=${'w'+i} className="flex items-start gap-1.5 text-sm text-amber"><${Icon} n="alert" s=${14} className="mt-0.5 shrink-0"/><span>${w}</span></li>`)}</ul>`;
const Override=({c,reason,setReason,blocking})=>html`<div className=${cx('rounded-[22px] px-4 py-3.5',blocking?'bg-dangerbg':'bg-amberbg')}>
  <p className="mb-2 text-sm font-bold">${blocking?'Não é possível salvar: há restrições obrigatórias.':'Esta alteração gera alertas.'}</p><${Checks} c=${c}/>
  ${!blocking&&html`<div className="mt-3"><label htmlFor="ovr" className="mb-1 block text-[13px] font-semibold">Justificativa para autorizar a exceção</label>
    <textarea id="ovr" className=${inputCls+' min-h-[64px] bg-panel'} value=${reason} onInput=${e=>setReason(e.target.value)} placeholder="Ex.: cobertura emergencial autorizada pela coordenação"></textarea>
    <p className="mt-1 text-xs opacity-80">A justificativa fica registrada na auditoria.</p></div>`}</div>`;
function Pips({S,s,sm}){
  const act=S.asg.filter(a=>a.shift===s.id&&ACTIVE(a.status)),conf=act.filter(a=>a.status==='confirmado').length,pend=act.length-conf;
  const n=Math.min(s.slots,8),pips=[];for(let i=0;i<n;i++)pips.push(i<conf?'c':i<conf+pend?'p':'o');
  const lbl=`${act.length} de ${s.slots} vagas preenchidas`+(pend?`, ${pend} aguardando`:'');
  return html`<span className="inline-flex items-center gap-[3px]" role="img" aria-label=${lbl} title=${lbl}>${pips.map((k,i)=>html`<span key=${i} className=${cx('rounded-full',sm?'h-1.5 w-1.5':'h-2 w-2',k==='c'&&'bg-teal',k==='p'&&'bg-amber',k==='o'&&(s.status==='rascunho'?'border border-faint':'border-[1.5px] border-danger'))}></span>`)}</span>`;
}
const Table=({cols,rows,empty,minW=640})=>rows.length===0?html`<${Empty} title=${empty||'Nada por aqui ainda'}/>`:html`<div className="-mx-2 overflow-x-auto"><table className="w-full text-sm" style=${{minWidth:minW}}>
  <thead><tr className="text-left text-[12px] text-faint">${cols.map(c=>html`<th key=${c} className="px-2 pb-2 font-semibold">${c}</th>`)}</tr></thead>
  <tbody>${rows}</tbody></table></div>`;
const TD=({children,className})=>html`<td className=${cx('border-t border-line px-2 py-3 align-middle',className)}>${children}</td>`;
function ThemeToggle({className}){
  const {theme,setTheme}=useApp();
  const dark=theme==='dark'||(theme==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  return html`<button onClick=${()=>setTheme(dark?'light':'dark')} aria-label=${dark?'Usar modo claro':'Usar modo escuro'} title=${dark?'Modo claro':'Modo escuro'}
    className=${cx('relative inline-flex h-10 w-[74px] items-center rounded-full p-1 transition',className||'bg-panel2')}>
    <span className=${cx('absolute top-1 grid h-8 w-8 place-items-center rounded-full bg-lime text-onlime transition-all',dark?'left-[38px]':'left-1')}><${Icon} n=${dark?'moon':'sun'} s=${16}/></span>
    <span className="grid w-full grid-cols-2 place-items-center text-faint"><${Icon} n="sun" s=${14}/><${Icon} n="moon" s=${14}/></span></button>`;
}
/* gráficos simples em SVG */
function Spark({vals,min,max,lo,hi,w=220,h=56}){
  if(!vals.length)return null;const a=Math.min(min,...vals),b=Math.max(max,...vals);const y=v=>h-4-(v-a)/(b-a||1)*(h-8);const x=i=>vals.length===1?w/2:i/(vals.length-1)*(w-8)+4;
  return html`<svg viewBox=${`0 0 ${w} ${h}`} className="h-14 w-full" preserveAspectRatio="none" role="img" aria-label="Leituras recentes">
    <rect x="0" y=${y(hi)} width=${w} height=${Math.max(0,y(lo)-y(hi))} fill="rgb(var(--c-lime) / .18)"/>
    <polyline fill="none" stroke="rgb(var(--c-ink))" strokeWidth="2" points=${vals.map((v,i)=>`${x(i)},${y(v)}`).join(' ')} vectorEffect="non-scaling-stroke"/>
    ${vals.map((v,i)=>(v<lo||v>hi)&&html`<circle key=${i} cx=${x(i)} cy=${y(v)} r="4" fill="rgb(var(--c-danger))"/>`)}</svg>`;
}
const BarList=({rows,max,fmt=v=>v,ref_,refLabel})=>html`<ul className="space-y-3">${rows.map(r=>html`<li key=${r.k} className="grid grid-cols-[minmax(0,8.5rem)_1fr_4.2rem] items-center gap-3 text-sm">
  <span className="truncate">${r.k}</span><span className="relative h-3 rounded-full bg-panel2"><span className=${cx('absolute inset-y-0 left-0 rounded-full',r.warn?'bg-amber':'bg-lime')} style=${{width:Math.min(100,r.v/max*100)+'%'}}></span>
  ${ref_&&html`<span className="absolute -inset-y-1 w-0.5 rounded bg-ink/60" style=${{left:Math.min(100,ref_/max*100)+'%'}} title=${refLabel}></span>`}</span><span className="text-right text-soft">${fmt(r.v)}</span></li>`)}</ul>`;
