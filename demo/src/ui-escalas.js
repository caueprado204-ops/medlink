/* ------------------------------------------------------------------ início */
const greet=()=>{const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'};
const svcTone=(S,s)=>{const i=s.service?S.services.findIndex(x=>x.id===s.service):S.units.findIndex(x=>x.id===s.unit)+3;return (i%6+6)%6+1};
function Inicio(){
  const {S,u,go}=useApp();const [sel,setSel]=useState(null);
  const now=new Date(),T=today(),ws=weekStart(T),we=addDays(ws,7);
  const vis=visibleShifts(S,u);const active=s=>S.asg.filter(a=>a.shift===s.id&&ACTIVE(a.status));
  const week=vis.filter(s=>s.status!=='cancelado'&&s.status!=='rascunho'&&dkey(s.start)>=ws&&dkey(s.start)<we);
  const slots=week.reduce((t,s)=>t+s.slots,0),filled=week.reduce((t,s)=>t+Math.min(s.slots,active(s).length),0);
  const open=vis.filter(s=>s.status==='descoberto'&&new Date(s.end)>now).sort((a,b)=>a.start.localeCompare(b.start));
  const waiting=vis.filter(s=>(s.status==='aguardando_confirmacao'||s.status==='substituicao_solicitada')&&new Date(s.end)>now);
  const drafts=vis.filter(s=>s.status==='rascunho'&&new Date(s.end)>now);
  const days=[...Array(7)].map((_,i)=>addDays(ws,i));
  const perDay=days.map(d=>{const l=week.filter(s=>dkey(s.start)===d);const sl=l.reduce((t,s)=>t+s.slots,0),f=l.reduce((t,s)=>t+Math.min(s.slots,active(s).length),0);return{d,sl,f,p:sl?Math.round(f/sl*100):null}});
  const imToday=S.imm.filter(i=>dkey(i.at)===T&&i.status==='registrado'&&i.origin!=='externa'),imWeek=S.imm.filter(i=>dkey(i.at)>=addDays(T,-6)&&i.status==='registrado'&&i.origin!=='externa');
  const lowItems=S.items.filter(i=>!i.archived&&itemQty(S,i.id)<i.min);const expLots=S.lots.filter(l=>['vencendo','vencido'].includes(lotStatus(S,l))&&l.qty>0);
  const occOpen=S.occ.filter(o=>o.status==='aberta'||o.status==='em_avaliacao');
  const visitsToday=S.visits.filter(v=>v.date===T&&v.status!=='cancelado');
  const toCheck=S.procs.filter(x=>x.status==='realizado'||x.status==='nao_realizado');
  const reqs=S.reqs.filter(r=>r.status==='pendente'&&can(S,u,'requests.decide',shiftOf(S,r.shift).unit));
  const cur=sel?shiftOf(S,sel):open[0];
  const K=[
    can(S,u,'shifts.view')&&{icon:'cal',tone:4,title:'Cobertura',sub:'Semana atual',value:slots?Math.round(filled/slots*100):0,unit:'%',detail:`${filled} de ${slots} vagas preenchidas`,to:{page:'escalas'}},
    can(S,u,'shifts.view')&&{icon:'alert',tone:6,title:'Vagas descobertas',sub:'Próximos plantões',value:open.length,danger:open.length>0,detail:`${waiting.length} aguardando confirmação`,to:{page:'escalas',view:'lista',st:'descoberto'}},
    can(S,u,'vaccines.view')&&{icon:'syringe',tone:3,title:'Vacinação',sub:'Hoje',value:imToday.length,detail:`${imWeek.length} aplicações nos últimos 7 dias`,to:{page:'vacinacao'}},
    can(S,u,'homecare.view')&&{icon:'home',tone:1,title:'Home care',sub:'Hoje',value:visitsToday.length,detail:`${visitsToday.filter(v=>v.status==='concluido').length} concluídos`,to:{page:'homecare'}},
    can(S,u,'procedures.verify')&&{icon:'clip',tone:2,title:'Procedimentos',sub:'Para conferir',value:toCheck.length,detail:`${S.procs.filter(x=>x.status==='agendado'&&x.date===T).length} agendados hoje`,to:{page:'procedimentos'}},
    (can(S,u,'stock.view')||can(S,u,'coldchain.view'))&&{icon:'box',tone:5,title:'Alertas',sub:'Estoque e rede de frio',value:lowItems.length+expLots.length+occOpen.length,detail:`${occOpen.length} ocorrência${occOpen.length===1?'':'s'} de temperatura`,to:{page:can(S,u,'stock.view')?'estoque':'temperatura'}}].filter(Boolean);
  /* agenda de hoje: plantões, visitas e procedimentos */
  const agenda=[...vis.filter(s=>dkey(s.start)===T&&s.status!=='cancelado'&&s.status!=='rascunho').map(s=>{const a=active(s);return{t:hm(s.start),k:'s'+s.id,name:a.length?a.map(x=>profOf(S,x.prof).name.split(' ')[0]).join(', '):'Vaga aberta',sub:`Plantão ${hm(s.start)}–${hm(s.end)}, ${s.service?servOf(S,s.service).name:unitOf(S,s.unit).name}`,av:a[0]?profOf(S,a[0].prof).name:null,st:s.status==='confirmado'?'teal':s.status==='descoberto'?'danger':'amber',to:{page:'escalas',shift:s.id,d:T}}}),
    ...(can(S,u,'homecare.view')?visitsToday.map(v=>({t:v.start,k:v.id,name:patOf(S,v.patient).name,sub:`${v.service}, ${profOf(S,v.prof).name.split(' ')[0]}`,av:patOf(S,v.patient).name,st:v.status==='concluido'?'teal':v.status==='em_andamento'?'amber':'sky',to:{page:'homecare'}})):[]),
    ...(can(S,u,'procedures.verify')?S.procs.filter(x=>x.date===T).map(x=>({t:x.start,k:x.id,name:patOf(S,x.patient).name,sub:`${x.type}, ${profOf(S,x.prof).name.split(' ')[0]}`,av:patOf(S,x.patient).name,st:PST[x.status][1],to:{page:'procedimentos'}})):[])].sort((a,b)=>a.t.localeCompare(b.t));
  const ST_IC={teal:['check','bg-tealsoft text-teal'],amber:['clock','bg-amberbg text-amber'],danger:['alert','bg-dangerbg text-danger'],sky:['clock','bg-sky text-skyink'],neutral:['clock','bg-panel2 text-soft']};
  /* mini calendário do mês */
  const m1=T.slice(0,8)+'01';const mDays=[];{let d=weekStart(m1);const nm=parseKey(m1);nm.setMonth(nm.getMonth()+1);const end=addDays(weekStart(addDays(key(nm),-1)),7);while(d<end){mDays.push(d);d=addDays(d,1)}}
  const dots=d=>{const sh=vis.filter(s=>dkey(s.start)===d&&s.status!=='cancelado');return[sh.some(s=>s.status==='descoberto')&&'bg-danger',sh.length&&'bg-teal',S.visits.some(v=>v.date===d&&v.status!=='cancelado')&&'bg-skyink'].filter(Boolean)};
  const mods=navFor(S,u).flatMap(g=>g.items.map(i=>({id:i[0],label:i[1],group:g.label,icon:i[2]}))).filter(m=>!['inicio','notificacoes','manual','meu'].includes(m.id));
  const metric={escalas:`${open.length} vagas abertas`,solicitacoes:`${reqs.length} pendentes`,gerar:'Proposta automática',profissionais:`${S.profs.filter(p=>p.active).length} ativos`,talentos:`${S.cands.filter(c=>c.status==='disponivel').length} disponíveis`,equipe:`${S.users.length} acessos`,
    vacinacao:`${imToday.length} aplicações hoje`,calendario:'CNV 2026',prontuario:`${S.patients.filter(p=>p.active).length} pacientes`,procedimentos:`${toCheck.length} para conferir`,estoque:`${lowItems.length} abaixo do mínimo`,temperatura:`${occOpen.length} ocorrências abertas`,homecare:`${visitsToday.length} visitas hoje`,
    pagar:BRL0(S.pay.filter(p=>!p.paid&&daysTo(p.due)<=30).reduce((t,p)=>t+p.value,0))+' em 30 dias',receber:BRL0(S.rec.filter(r=>!r.received).reduce((t,r)=>t+r.value,0))+' em aberto',relatorios:'Cobertura, horas e custos',auditoria:`${S.audit.length} registros`,organizacao:`${S.units.filter(x=>!x.archived).length} unidades`};
  return html`<div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[13px] font-semibold text-soft">${cap(F(T,{weekday:'long',day:'numeric',month:'long'}))}</p>
      <h1 className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[38px]">${greet()}, ${u.name.split(' ')[0]}</h1><p className="text-[14.5px] text-soft">${S.inst.name}${u.units?', '+unitOf(S,u.units[0]).name:''}. Semana de ${D2(ws)} a ${D2(addDays(ws,6))}.</p></div>
      <div className="flex flex-wrap gap-2">${can(S,u,'shifts.manage')&&html`<${Btn} v="ink" icon="wand" onClick=${()=>go({page:'gerar'})}>Gerar escala<//>`}${can(S,u,'shifts.view')&&html`<${Btn} v="lime" icon="cal" onClick=${()=>go({page:'escalas'})}>Abrir calendário<//>`}</div></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">${K.map(k=>html`<${Kpi} key=${k.title} ...${k} onClick=${()=>go(k.to)}/>`)}</div>

    <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
      ${can(S,u,'shifts.view')&&html`<${Card} title="Cobertura por dia" sub="Vagas preenchidas sobre o total publicado" icon="chart" tone=${4} action=${drafts.length>0&&html`<${Btn} size="sm" onClick=${()=>go({page:'escalas',view:'lista',st:'rascunho'})}>${drafts.length} rascunhos para publicar<//>`}>
        <div className="flex h-60 items-end gap-2 pt-2 sm:gap-3">${perDay.map((x,i)=>{const c=[4,3,2,1,5,6,4][i];return html`<button key=${x.d} onClick=${()=>go({page:'escalas',d:x.d,view:'dia'})} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
          <span className=${cx('text-[15px] font-semibold',x.d===T&&'text-teal')}>${x.p==null?'—':x.p+'%'}</span>
          <span className="relative flex w-full flex-1 items-end"><span className=${cx('w-full rounded-t-[14px] border-t-[3px] transition group-hover:brightness-95',PASTEL[c])} style=${{height:Math.max(6,x.p||0)+'%',borderColor:'rgb(var(--c-onp) / .55)',backgroundImage:'linear-gradient(180deg,rgb(255 255 255 / .0),rgb(255 255 255 / .55))'}}></span></span>
          <span className=${cx('rounded-full px-2 py-0.5 text-[11px] font-bold',x.d===T?'bg-navy text-onnavy':'bg-panel2 text-soft')}>${F(x.d,{weekday:'short'}).replace('.','')} ${x.sl?x.f+'/'+x.sl:''}</span></button>`})}</div><//>`}
      <${Card} title="Agenda de hoje" sub=${agenda.length+' compromissos'} icon="clock" tone=${3}>
        ${agenda.length===0?html`<${Empty} title="Nada agendado para hoje"/>`:html`<ol className="relative max-h-[290px] space-y-1 overflow-y-auto pr-1">${agenda.map(x=>html`<li key=${x.k}><button onClick=${()=>go(x.to)} className="grid w-full grid-cols-[3rem_auto_1fr_auto] items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-panel2">
          <span className="text-[12.5px] font-semibold text-soft">${x.t}</span>${x.av?html`<${Avatar} name=${x.av} size=${34}/>`:html`<span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-dangerbg text-danger"><${Icon} n="alert" s=${15}/></span>`}
          <span className="min-w-0"><span className="block truncate text-sm font-bold">${x.name}</span><span className="block truncate text-[12px] text-faint">${x.sub}</span></span>
          <span className=${cx('grid h-8 w-8 place-items-center rounded-lg',ST_IC[x.st][1])}><${Icon} n=${ST_IC[x.st][0]} s=${15}/></span></button></li>`)}</ol>`}<//></div>

    <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr] xl:grid-cols-[340px_1fr_1.2fr]">
      ${can(S,u,'shifts.view')&&html`<${Card} title=${cap(F(T,{month:'long',year:'numeric'}))} icon="cal" tone=${1}>
        <div className="grid grid-cols-7 gap-1 text-center">${[1,2,3,4,5,6,0].map(d=>html`<span key=${d} className="pb-1 text-[11px] font-bold uppercase text-faint">${WDS[d].slice(0,3)}</span>`)}
          ${mDays.map(d=>{const inM=d.slice(0,7)===T.slice(0,7),ds=dots(d);return html`<button key=${d} onClick=${()=>go({page:'escalas',d,view:'dia'})} className=${cx('flex aspect-square flex-col items-center justify-center rounded-xl text-[13px] font-semibold transition',d===T?'bg-lime text-onlime':inM?'bg-panel2 hover:ring-2 hover:ring-lime':'text-faint opacity-50')}>
            ${+d.slice(8)}<span className="mt-0.5 flex h-1.5 gap-0.5">${ds.map((c,i)=>html`<span key=${i} className=${cx('h-1.5 w-1.5 rounded-full',c)}></span>`)}</span></button>`})}</div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-soft"><span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-teal"></span>Plantões</span><span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-danger"></span>Vaga aberta</span><span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-skyink"></span>Home care</span></div><//>`}
      ${can(S,u,'shifts.view')&&html`<${Card} title="Vagas em aberto" sub="Toque para ver os detalhes" icon="alert" tone=${6}>
        ${open.length===0?html`<${Empty} title="Nenhuma vaga descoberta">Plantões publicados sem gente suficiente aparecem aqui.<//>`:html`<ul className="space-y-1.5">${open.slice(0,6).map(s=>{const f=s.slots-active(s).length;const on=cur&&cur.id===s.id;return html`<li key=${s.id}>
          <button onClick=${()=>setSel(s.id)} className=${cx('flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition',on?'bg-navy text-onnavy':'hover:bg-panel2')}>
            <span className=${cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-onp',on?'bg-lime':PASTEL[svcTone(S,s)])}><${Icon} n="clock" s=${16}/></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">${cap(F(s.start,{weekday:'short',day:'2-digit',month:'2-digit'}))}, ${hm(s.start)}</span><span className="block truncate text-xs opacity-70">${s.service?servOf(S,s.service).name:''} · ${unitOf(S,s.unit).name}</span></span>
            <span className=${cx('rounded-full px-3 py-1 text-xs font-bold',on?'bg-onnavy text-navy':'bg-dangerbg text-danger')}>${f} ${f===1?'vaga':'vagas'}</span></button></li>`})}</ul>`}<//>`}
      ${can(S,u,'shifts.view')&&(cur?html`<section className="rounded-[24px] bg-navy p-6 text-onnavy lg:col-span-2 xl:col-span-1">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[13px] opacity-70">Detalhes da vaga</p><p className="thin mt-1 text-[38px] leading-none">${hm(cur.start)}–${hm(cur.end)}</p><p className="mt-2 text-sm opacity-80">${cap(F(cur.start,{weekday:'long',day:'numeric',month:'long'}))}</p></div>
          <div className="text-right"><p className="text-[13px] opacity-70">Unidade</p><p className="text-lg font-bold">${unitOf(S,cur.unit).name}</p><p className="text-sm opacity-80">${cur.service?servOf(S,cur.service).name:''}</p></div></div>
        <div className="mt-5 grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">${[['Categoria',cur.cat?CAT[cur.cat]:'Qualquer'],['Vagas',`${cur.slots-active(cur).length} de ${cur.slots} abertas`],['Competências',cur.comps.join(', ')||'Nenhuma']].map(([k,v])=>html`<div key=${k} className="rounded-[18px] bg-onnavy/10 p-3.5"><p className="text-[12px] opacity-70">${k}</p><p className="mt-1 text-sm font-bold">${v}</p></div>`)}</div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[20px] bg-onnavy/10 p-3"><span className="text-[13px] opacity-80">Livres e sem alertas:</span>
          <${Stack} names=${S.profs.filter(p=>p.active&&(!cur.cat||p.cat===cur.cat)).filter(p=>{const c=checks(S,cur,p.id);return !c.blocking.length&&!c.warnings.length}).map(p=>p.name)} size=${30}/>
          <button onClick=${()=>go({page:'escalas',shift:cur.id,d:dkey(cur.start)})} className="ml-auto h-10 rounded-full bg-lime px-5 text-sm font-bold text-onlime">Escalar agora</button></div></section>`
        :html`<section className="rounded-[24px] bg-navy p-6 text-onnavy"><p className="thin text-[30px]">Tudo coberto</p><p className="mt-2 opacity-75">Não há vagas abertas no período.</p></section>`)}
    </div>

    ${reqs.length>0&&html`<${Card} title="Solicitações pendentes" icon="inbox" tone=${5} action=${html`<${Btn} size="sm" onClick=${()=>go({page:'solicitacoes'})}>Ver todas<//>`}>
      <ul className="grid gap-2 md:grid-cols-2">${reqs.map(r=>{const s=shiftOf(S,r.shift);return html`<li key=${r.id} className="flex items-center gap-3 rounded-[18px] bg-panel2 p-3"><${Avatar} name=${profOf(S,r.prof).name}/>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">${profOf(S,r.prof).name}</span><span className="block truncate text-[12px] text-soft">${RK[r.kind]}, ${label(s)}</span></span><${Btn} size="sm" v="lime" onClick=${()=>go({page:'solicitacoes'})}>Analisar<//></li>`})}</ul><//>`}

    <${Card} title="Seus módulos" sub=${mods.length+' funções disponíveis para o seu perfil'} icon="dash" tone=${2}>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">${mods.map((m,i)=>html`<button key=${m.id} onClick=${()=>go({page:m.id})} className="group flex items-center gap-3 rounded-[18px] border border-line/70 bg-panel p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md">
        <span className=${cx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-onp',PASTEL[i%6+1])}><${Icon} n=${m.icon} s=${19}/></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">${m.label}</span><span className="block truncate text-[12px] text-faint">${metric[m.id]||m.group}</span></span><${Icon} n="ur" s=${15} className="text-faint opacity-0 transition group-hover:opacity-100"/></button>`)}</div><//>
  </div>`;
}

/* ------------------------------------------------------------------ calendário */
function Escalas(){
  const {S,u,run,go,page,toast}=useApp();
  const [view,setView]=useState(page.view||(window.innerWidth<700?'dia':'semana'));const [anchor,setAnchor]=useState(page.d||today());
  const [fUnit,setFUnit]=useState(u.units?u.units[0]:'');const [fSt,setFSt]=useState(page.st||'');
  const [openId,setOpenId]=useState(page.shift||null);const [form,setForm]=useState(null);const [drag,setDrag]=useState(null);
  const [pm,setPm]=useState(null);const [pmR,setPmR]=useState('');const canManage=can(S,u,'shifts.manage');
  useEffect(()=>{if(page.shift){setOpenId(page.shift);if(page.d)setAnchor(page.d)}if(page.st!=null)setFSt(page.st);if(page.view)setView(page.view);if(page.d&&!page.shift)setAnchor(page.d);if(page.nw&&canManage)setForm({date:today()})},[page]);
  const T=today();let days=[];
  if(view==='dia')days=[anchor];else if(view==='semana'){const w=weekStart(anchor);for(let i=0;i<7;i++)days.push(addDays(w,i))}
  else if(view==='mes'){const m1=anchor.slice(0,8)+'01';let d=weekStart(m1);const nm=parseKey(m1);nm.setMonth(nm.getMonth()+1);const end=weekStart(addDays(key(nm),6));while(d<end){days.push(d);d=addDays(d,1)}}
  else for(let i=0;i<14;i++)days.push(addDays(anchor,i));
  const from=days[0],to=addDays(days[days.length-1],1);
  const list=visibleShifts(S,u).filter(s=>dkey(s.start)>=from&&dkey(s.start)<to&&(!fUnit||s.unit===fUnit)&&(!fSt||s.status===fSt)).sort((a,b)=>a.start.localeCompare(b.start));
  const byDay={};list.forEach(s=>{(byDay[dkey(s.start)]=byDay[dkey(s.start)]||[]).push(s)});
  const drafts=list.filter(s=>s.status==='rascunho'&&new Date(s.end)>new Date()&&can(S,u,'shifts.publish',s.unit));
  const step=dir=>{if(view==='dia')setAnchor(addDays(anchor,dir));else if(view==='semana')setAnchor(addDays(anchor,7*dir));else if(view==='lista')setAnchor(addDays(anchor,14*dir));else{const d=parseKey(anchor.slice(0,8)+'01');d.setMonth(d.getMonth()+dir);setAnchor(key(d))}};
  const title=view==='dia'?cap(F(anchor,{weekday:'long',day:'numeric',month:'long'})):view==='mes'?cap(F(anchor,{month:'long',year:'numeric'})):`${F(from,{day:'numeric',month:'short'})} – ${F(days[days.length-1],{day:'numeric',month:'short'})}`;
  const doMove=(s,date,reason)=>{if(dkey(s.start)===date)return;const r=run((D,U)=>A.move(D,U,s.id,date,reason),'Plantão movido.');if(r.ok){setPm(null);setPmR('')}else if(r.checks)setPm({s,date,c:r.checks,blocking:r.kind==='blocking'})};
  const dnd=date=>canManage&&view!=='lista'?{onDragOver:e=>{e.preventDefault();setDrag(date)},onDragLeave:()=>setDrag(d=>d===date?null:d),
    onDrop:e=>{e.preventDefault();setDrag(null);const s=shiftOf(S,e.dataTransfer.getData('text/plain'));if(!s)return;if(s.status==='cancelado')return toast('Plantão cancelado não pode ser movido.','error');if(!can(S,u,'shifts.manage',s.unit))return toast('Seu perfil não gerencia esta unidade.','error');doMove(s,date)}}:{};
  const card=(s,compact)=>html`<${ShiftCard} key=${s.id} S=${S} s=${s} compact=${compact} onOpen=${()=>setOpenId(s.id)} draggable=${canManage&&s.status!=='cancelado'&&can(S,u,'shifts.manage',s.unit)}/>`;
  const open=openId&&shiftOf(S,openId);
  return html`<div>
    <${PageHead} title=${title} actions=${html`${drafts.length>0&&html`<${Btn} v="ink" icon="send" onClick=${()=>run((D,U)=>A.publish(D,U,drafts.map(d=>d.id)),n=>`${n} ${n===1?'plantão publicado':'plantões publicados'}. Os escalados foram avisados.`)}>Publicar ${drafts.length}<//>`}
      ${canManage&&html`<${Btn} v="lime" icon="plus" onClick=${()=>setForm({date:view==='dia'?anchor:(T>=from&&T<to?T:from)})}>Novo plantão<//>`}`}/>
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <${Seg} size="sm" items=${[['dia','Dia'],['semana','Semana'],['mes','Mês'],['lista','Lista']]} value=${view} onChange=${setView}/>
      <div className="flex items-center gap-1 rounded-full bg-panel p-1 card-sh"><button className="grid h-8 w-8 place-items-center rounded-full hover:bg-panel2" onClick=${()=>step(-1)} aria-label="Anterior"><${Icon} n="left"/></button>
        <button className="h-8 rounded-full px-3 text-[13px] font-semibold hover:bg-panel2" onClick=${()=>setAnchor(T)}>Hoje</button><button className="grid h-8 w-8 place-items-center rounded-full hover:bg-panel2" onClick=${()=>step(1)} aria-label="Próximo"><${Icon} n="right"/></button></div>
      <div className="ml-auto flex flex-wrap gap-2">
        ${!u.units&&html`<select id="f-unit" aria-label="Unidade" className=${selCls+' h-10'} value=${fUnit} onChange=${e=>setFUnit(e.target.value)}><option value="">Todas as unidades</option>${S.units.map(x=>html`<option key=${x.id} value=${x.id}>${x.name}</option>`)}</select>`}
        <select id="f-st" aria-label="Situação" className=${selCls+' h-10'} value=${fSt} onChange=${e=>setFSt(e.target.value)}><option value="">Todas as situações</option>${Object.entries(SST).map(([k,v])=>html`<option key=${k} value=${k}>${v[0]}</option>`)}</select></div></div>
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-soft">
      ${S.services.filter(x=>!x.archived&&(!fUnit||x.unit===fUnit)).map(x=>html`<span key=${x.id} className="inline-flex items-center gap-1.5"><span className=${cx('h-3 w-3 rounded',PASTEL[svcTone(S,{service:x.id})])}></span>${x.name}${S.units.length>1?html`<span className="text-faint">(${unitOf(S,x.unit).name.replace('Unidade ','')})</span>`:''}</span>`)}
      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger"></span>Vaga aberta</span><span className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded-md border border-dashed border-faint"></span>Rascunho</span>
      ${canManage&&view!=='lista'&&html`<span className="hidden text-faint md:inline">Arraste um plantão para outro dia para movê-lo.</span>`}</div>

    ${(view==='semana'||view==='dia')&&html`<${TimeGrid} S=${S} days=${days} byDay=${byDay} T=${T} onOpen=${setOpenId} dnd=${dnd} drag=${drag} canManage=${canManage} onNew=${(d,h)=>setForm({date:d,start:pad(h)+':00'})}/>`}
    ${view==='mes'&&html`<div className="card-sh overflow-x-auto rounded-[24px] bg-panel p-3"><div className="grid min-w-[760px] grid-cols-7 gap-1.5">
      ${[1,2,3,4,5,6,0].map(d=>html`<div key=${'h'+d} className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-faint">${WDS[d]}</div>`)}
      ${days.map(d=>{const l=byDay[d]||[];const inM=d.slice(0,7)===anchor.slice(0,7);return html`<div key=${d} ...${dnd(d)} className=${cx('min-h-[116px] rounded-[16px] border border-line/60 p-1.5',inM?'bg-panel':'opacity-50',drag===d&&'ring-2 ring-lime')}>
        <button onClick=${()=>{setView('dia');setAnchor(d)}} className=${cx('mb-1 grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold',d===T?'bg-lime text-onlime':'hover:bg-panel')}>${+d.slice(8)}</button>
        <div className="space-y-1">${l.slice(0,3).map(s=>card(s,true))}${l.length>3&&html`<button className="px-1 text-[11px] font-semibold text-teal" onClick=${()=>{setView('dia');setAnchor(d)}}>+${l.length-3} plantões</button>`}</div></div>`})}</div></div>`}
    ${view==='lista'&&html`<${Card} pad=${false} className="p-4"><${Table} cols=${['Data','Horário','Local','Categoria','Escalados','Situação']} empty="Nenhum plantão com estes filtros" minW=${760}
      rows=${list.map(s=>{const act=S.asg.filter(a=>a.shift===s.id&&ACTIVE(a.status));return html`<tr key=${s.id} className="cursor-pointer hover:bg-panel2" onClick=${()=>setOpenId(s.id)}>
        <${TD} className="whitespace-nowrap font-semibold">${cap(F(s.start,{weekday:'short',day:'2-digit',month:'2-digit'}))}<//><${TD}>${hm(s.start)}–${hm(s.end)}<//>
        <${TD}>${unitOf(S,s.unit).name}${s.service&&html`<span className="text-faint"> / ${servOf(S,s.service).name}</span>`}<//><${TD}>${s.cat?CAT[s.cat]:'Qualquer'}<//>
        <${TD}><div className="flex items-center gap-2"><${Pips} S=${S} s=${s}/>${act.length?html`<${Stack} names=${act.map(a=>profOf(S,a.prof).name)} size=${26}/>`:html`<span className="text-faint">Ninguém</span>`}</div><//>
        <${TD}><${Badge} tone=${SST[s.status][1]}>${SST[s.status][0]}<//><//></tr>`})}/><//>`}

    ${open&&html`<${ShiftDetail} key=${open.id} s=${open} onClose=${()=>setOpenId(null)} onEdit=${()=>{setForm({shift:open});setOpenId(null)}}/>`}
    ${form&&html`<${ShiftForm} init=${form} onClose=${()=>setForm(null)} onSaved=${id=>setOpenId(id)}/>`}
    ${pm&&html`<${Modal} open onClose=${()=>{setPm(null);setPmR('')}} title=${pm.blocking?'Não foi possível mover':'Confirmar mudança de data'} desc=${`Plantão das ${hm(pm.s.start)} para ${F(pm.date,{weekday:'long',day:'numeric',month:'long'})}.`}
      footer=${html`<${Btn} onClick=${()=>{setPm(null);setPmR('')}}>${pm.blocking?'Fechar':'Cancelar'}<//>${!pm.blocking&&html`<${Btn} v="lime" disabled=${!pmR.trim()} onClick=${()=>doMove(pm.s,pm.date,pmR)}>Autorizar e mover<//>`}`}>
      <${Override} c=${pm.c} reason=${pmR} setReason=${setPmR} blocking=${pm.blocking}/><//>`}</div>`;
}
/* grade de horários: dias em colunas, plantões posicionados pelo horário, cores por setor */
function TimeGrid({S,days,byDay,T,onOpen,dnd,drag,canManage,onNew}){
  const H=58;const all=days.flatMap(d=>byDay[d]||[]);
  const sh=v=>{const d=new Date(v);return d.getHours()+d.getMinutes()/60};
  let h0=6,h1=20;all.forEach(s=>{h0=Math.min(h0,Math.floor(sh(s.start)));const e=dkey(s.end)!==dkey(s.start)?24:Math.ceil(sh(s.end));h1=Math.max(h1,e)});h1=Math.min(24,h1);
  const hrs=[];for(let h=h0;h<h1;h++)hrs.push(h);
  const [nowT,setNow]=useState(Date.now());useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(t)},[]);
  const nowH=sh(new Date(nowT).toISOString());const one=days.length===1;
  const lay=list=>{const ev=list.map(s=>{const a=sh(s.start),b=dkey(s.end)!==dkey(s.start)?24:sh(s.end);return{s,a,b:Math.max(b,a+.5)}}).sort((x,y)=>x.a-y.a);const ends=[];
    ev.forEach(e=>{let l=ends.findIndex(t=>t<=e.a+.001);if(l<0){l=ends.length;ends.push(0)}ends[l]=e.b;e.l=l});ev.forEach(e=>{e.n=Math.max(1,...ev.filter(o=>o.a<e.b&&o.b>e.a).map(o=>o.l+1))});return ev};
  return html`<div className="card-sh overflow-hidden rounded-[24px] bg-panel"><div className="no-scrollbar overflow-x-auto"><div style=${{minWidth:one?0:days.length*150+64}}>
    <div className="grid border-b border-line/70 bg-panel" style=${{gridTemplateColumns:`64px repeat(${days.length},minmax(0,1fr))`}}>
      <div className="px-2 py-3 text-[11px] font-semibold text-faint">${days.length>1?'GMT-3':''}</div>
      ${days.map(d=>html`<div key=${d} className="p-1.5"><div className=${cx('flex items-center justify-center gap-2 rounded-2xl px-2 py-2.5',d===T?'bg-navy text-onnavy':'bg-panel2')}>
        <span className=${cx('text-[11px] font-bold uppercase',d===T?'opacity-80':'text-faint')}>${F(d,{weekday:'short'}).replace('.','')}</span><span className="text-[22px] font-semibold leading-none">${F(d,{day:'2-digit'})}</span>
        <span className=${cx('text-[11px]',d===T?'opacity-70':'text-faint')}>${(byDay[d]||[]).length||''}</span></div></div>`)}</div>
    <div className="relative grid" style=${{gridTemplateColumns:`64px repeat(${days.length},minmax(0,1fr))`}}>
      <div className="relative">${hrs.map(h=>html`<div key=${h} className="pr-2 text-right text-[11px] font-semibold text-faint" style=${{height:H}}><span className="-translate-y-2 inline-block">${pad(h)}:00</span></div>`)}</div>
      ${days.map(d=>{const ev=lay(byDay[d]||[]);return html`<div key=${d} ...${dnd(d)} className=${cx('hours-bg relative border-l border-line/60 transition',d===T&&'bg-p3/10',drag===d&&'bg-p4/30')} style=${{'--hh':H+'px',height:hrs.length*H}}
          onDoubleClick=${e=>{if(!canManage)return;const r=e.currentTarget.getBoundingClientRect();onNew(d,Math.min(23,h0+Math.floor((e.clientY-r.top)/H)))}}>
        ${d===T&&nowH>=h0&&nowH<=h1&&html`<div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-danger/70" style=${{top:(nowH-h0)*H}}><span className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-danger"></span></div>`}
        ${ev.map(({s,a,b,l,n})=>html`<div key=${s.id} className="absolute px-1" style=${{top:(a-h0)*H+2,height:Math.max(34,(b-a)*H-4),left:`${l/n*100}%`,width:`${100/n}%`}}><${ShiftCard} S=${S} s=${s} grid onOpen=${()=>onOpen(s.id)} draggable=${canManage&&s.status!=='cancelado'&&s.status!=='rascunho'||canManage&&s.status==='rascunho'}/></div>`)}
      </div>`})}</div></div></div>
    ${canManage&&html`<p className="border-t border-line/60 px-4 py-2 text-[12px] text-faint">Arraste um plantão para outro dia para movê-lo. Dê dois cliques em um horário vazio para criar um plantão.</p>`}</div>`;
}
function ShiftCard({S,s,compact,grid,onOpen,draggable}){
  const act=S.asg.filter(a=>a.shift===s.id&&ACTIVE(a.status));const draft=s.status==='rascunho',canc=s.status==='cancelado',flag=act.some(a=>a.reason);
  const dot=canc?'bg-faint':draft?'bg-faint':s.status==='confirmado'?'bg-teal':s.status==='descoberto'?'bg-danger':'bg-amber';
  const ds=e=>{e.dataTransfer.setData('text/plain',s.id);e.dataTransfer.effectAllowed='move'};
  if(compact)return html`<button type="button" onClick=${onOpen} draggable=${draggable} onDragStart=${ds} className=${cx('flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-[11px] text-onp hover:ring-1 hover:ring-ink/30',draft?'border border-dashed border-faint bg-transparent text-ink':PASTEL[svcTone(S,s)],canc&&'line-through opacity-50')}>
    <span className=${cx('h-1.5 w-1.5 shrink-0 rounded-full',dot)}></span><span className="font-bold">${hm(s.start)}</span><span className="min-w-0 flex-1 truncate opacity-75">${s.service?servOf(S,s.service).name:unitOf(S,s.unit).name}</span></button>`;
  const open=s.slots-act.length;
  if(grid)return html`<button type="button" onClick=${onOpen} draggable=${draggable} onDragStart=${ds} className=${cx('group flex h-full w-full flex-col overflow-hidden rounded-[14px] p-2 text-left transition hover:shadow-lg hover:ring-2 hover:ring-ink/20',draft?'border-[1.5px] border-dashed border-faint bg-panel text-ink':PASTEL[svcTone(S,s)]+' text-onp',canc&&'opacity-50',draggable&&'cursor-grab active:cursor-grabbing')}>
    <span className="flex items-center justify-between gap-1"><span className=${cx('text-[11.5px] font-bold',canc&&'line-through')}>${hm(s.start)}–${hm(s.end)}</span>${!draft&&!canc&&open>0?html`<span title=${open+' vaga(s) aberta(s)'} className="grid h-4 min-w-[1rem] shrink-0 place-items-center rounded-full bg-[#d23a2f] px-1 text-[10px] font-bold text-white">${open}</span>`:html`<${Pips} S=${S} s=${s} sm/>`}</span>
    <span className="mt-0.5 truncate text-[12.5px] font-bold leading-tight">${s.service?servOf(S,s.service).name:unitOf(S,s.unit).name}</span>
    <span className="truncate text-[11px] opacity-70">${unitOf(S,s.unit).name}${s.cat?' · '+CAT[s.cat].replace('(a)','').replace(' de enfermagem',''):''}</span>
    <span className="mt-auto flex items-center gap-1.5 pt-1">${act.length?html`<${Stack} names=${act.map(a=>profOf(S,a.prof).name)} size=${22} max=${3}/>`:''}
      ${(draft||canc||s.status==='substituicao_solicitada'||s.status==='aguardando_confirmacao')&&html`<span className="truncate rounded-full bg-white/70 px-1.5 text-[10px] font-bold text-[#3a3c44]">${SST[s.status][0]}</span>`}${flag&&html`<span className="rounded-full bg-white/70 px-1 text-amber" title="Exceção autorizada"><${Icon} n="alert" s=${10}/></span>`}</span></button>`;
  return html`<button type="button" onClick=${onOpen} draggable=${draggable} onDragStart=${ds} className=${cx('group w-full rounded-[18px] p-2.5 text-left transition hover:ring-2 hover:ring-lime',draft?'border border-dashed border-faint bg-transparent':'bg-panel2',canc&&'opacity-50',draggable&&'cursor-grab active:cursor-grabbing')}>
    <div className="flex items-center justify-between gap-2"><span className=${cx('text-[13px] font-bold',canc&&'line-through')}>${hm(s.start)}–${hm(s.end)}</span><${Pips} S=${S} s=${s}/></div>
    <p className="mt-0.5 truncate text-[11px] text-soft">${unitOf(S,s.unit).name}${s.service?' / '+servOf(S,s.service).name:''}</p>
    ${act.length>0?html`<div className="mt-2 flex items-center gap-1.5"><${Stack} names=${act.map(a=>profOf(S,a.prof).name)} size=${24} max=${3}/><span className="truncate text-[11px] font-semibold">${act.length===1?profOf(S,act[0].prof).name.split(' ')[0]:''}</span></div>`:html`<p className="mt-2 text-[11px] font-semibold text-danger">${draft?'Sem ninguém':'Vaga aberta'}</p>`}
    ${(draft||canc||s.status==='substituicao_solicitada'||flag)&&html`<div className="mt-1.5 flex flex-wrap gap-1">${(draft||canc||s.status==='substituicao_solicitada')&&html`<span className="rounded-full bg-panel px-2 py-0.5 text-[10px] font-bold text-soft">${SST[s.status][0]}</span>`}
      ${flag&&html`<span className="inline-flex items-center gap-0.5 rounded-full bg-amberbg px-2 py-0.5 text-[10px] font-bold text-amber"><${Icon} n="alert" s=${10}/>exceção</span>`}</div>`}</button>`;
}
function ShiftForm({init,onClose,onSaved}){
  const {S,u,run}=useApp();const sh=init.shift;const units=S.units.filter(x=>!x.archived&&can(S,u,'shifts.manage',x.id));
  const [f,setF]=useState(()=>sh?{id:sh.id,unit:sh.unit,service:sh.service||'',date:dkey(sh.start),start:hm(sh.start),end:hm(sh.end),brk:sh.brk,cat:sh.cat||'',slots:sh.slots,comps:sh.comps.join(', '),notes:sh.notes||''}
    :{unit:units[0]&&units[0].id,service:'',date:init.date,start:init.start||'07:00',end:init.start?pad((+init.start.slice(0,2)+6)%24)+':00':'13:00',brk:15,cat:'tecnico_enfermagem',slots:1,comps:'Sala de vacinação',notes:''});
  const [c,setC]=useState(null);const [bl,setBl]=useState(false);const [reason,setReason]=useState('');const [err,setErr]=useState(null);
  const set=k=>e=>{setF({...f,[k]:e.target.value});if(bl){setC(null);setBl(false)}};
  const submit=e=>{e.preventDefault();setErr(null);const r=run((D,U)=>A.saveShift(D,U,{...f,comps:f.comps.split(',').map(x=>x.trim()).filter(Boolean),override:reason}),sh?'Plantão atualizado.':'Plantão criado como rascunho.');
    if(r.ok){onSaved&&onSaved(r.data);onClose()}else if(r.checks){setC(r.checks);setBl(r.kind==='blocking')}else setErr(r.msg)};
  return html`<${Modal} open wide onClose=${onClose} title=${sh?'Editar plantão':'Novo plantão'} desc=${sh?'Ao mudar horário, unidade ou categoria, quem está escalado é revalidado.':'Nasce como rascunho. Publique quando a escala estiver pronta.'}
    footer=${html`<${Btn} onClick=${onClose}>Cancelar<//><${Btn} type="submit" form="shift-form" v="lime" disabled=${bl}>${c&&!bl?'Autorizar exceção e salvar':sh?'Salvar':'Criar plantão'}<//>`}>
    <form id="shift-form" onSubmit=${submit} className="grid gap-4 sm:grid-cols-6">
      <${Field} label="Unidade" id="sf-unit" className="sm:col-span-3"><select id="sf-unit" className=${inputCls} value=${f.unit} onChange=${e=>setF({...f,unit:e.target.value,service:''})}>${units.map(x=>html`<option key=${x.id} value=${x.id}>${x.name}</option>`)}</select><//>
      <${Field} label="Serviço ou setor" id="sf-serv" className="sm:col-span-3"><select id="sf-serv" className=${inputCls} value=${f.service} onChange=${set('service')}><option value="">Sem serviço específico</option>${S.services.filter(x=>x.unit===f.unit&&!x.archived).map(x=>html`<option key=${x.id} value=${x.id}>${x.name}</option>`)}</select><//>
      <${Field} label="Data" id="sf-date" className="sm:col-span-2"><input id="sf-date" type="date" required className=${inputCls} value=${f.date} onChange=${set('date')}/><//>
      <${Field} label="Início" id="sf-start" className="sm:col-span-1"><input id="sf-start" type="time" required className=${inputCls} value=${f.start} onChange=${set('start')}/><//>
      <${Field} label="Término" id="sf-end" hint="Antes do início = dia seguinte" className="sm:col-span-1"><input id="sf-end" type="time" required className=${inputCls} value=${f.end} onChange=${set('end')}/><//>
      <${Field} label="Intervalo (min)" id="sf-brk" className="sm:col-span-2"><input id="sf-brk" type="number" min="0" max="240" step="5" className=${inputCls} value=${f.brk} onChange=${set('brk')}/><//>
      <${Field} label="Categoria" id="sf-cat" className="sm:col-span-4"><select id="sf-cat" className=${inputCls} value=${f.cat} onChange=${set('cat')}><option value="">Qualquer categoria</option>${Object.entries(CAT).map(([k,v])=>html`<option key=${k} value=${k}>${v}</option>`)}</select><//>
      <${Field} label="Vagas" id="sf-slots" className="sm:col-span-2"><input id="sf-slots" type="number" min="1" max="50" className=${inputCls} value=${f.slots} onChange=${set('slots')}/><//>
      <${Field} label="Competências exigidas" id="sf-comps" hint="Separe por vírgula." className="sm:col-span-6"><input id="sf-comps" className=${inputCls} value=${f.comps} onChange=${set('comps')}/><//>
      <${Field} label="Observações" id="sf-notes" className="sm:col-span-6"><textarea id="sf-notes" className=${inputCls+' min-h-[64px]'} value=${f.notes} onChange=${set('notes')}></textarea><//>
      ${c&&html`<div className="sm:col-span-6"><${Override} c=${c} reason=${reason} setReason=${setReason} blocking=${bl}/></div>`}
      ${err&&html`<p role="alert" className="rounded-2xl bg-dangerbg px-4 py-2.5 text-sm text-danger sm:col-span-6">${err}</p>`}</form><//>`;
}
function ShiftDetail({s,onClose,onEdit}){
  const {S,u,run}=useApp();const [tab,setTab]=useState('det');const [panel,setPanel]=useState(null);
  const act=S.asg.filter(a=>a.shift===s.id&&ACTIVE(a.status)),past=S.asg.filter(a=>a.shift===s.id&&!ACTIVE(a.status));
  const canc=s.status==='cancelado',manage=can(S,u,'shifts.manage',s.unit)&&!canc;const hist=S.audit.filter(h=>h.ref===s.id);
  return html`<${Modal} open wide onClose=${onClose} title=${`${hm(s.start)}–${hm(s.end)}`} desc=${`${cap(F(s.start,{weekday:'long',day:'numeric',month:'long'}))}${dkey(s.end)!==dkey(s.start)?' (termina no dia seguinte)':''}, ${unitOf(S,s.unit).name}${s.service?' / '+servOf(S,s.service).name:''}`}>
    <div className="mb-4 flex flex-wrap items-center gap-2"><${Badge} tone=${SST[s.status][1]}>${SST[s.status][0]}<//><span className="text-sm text-soft">${fmtH(hours(s.start,s.end,s.brk))} de trabalho${s.brk?`, ${s.brk} min de intervalo`:''}</span>
      ${can(S,u,'audit.view')&&html`<span className="ml-auto"><${Seg} size="sm" items=${[['det','Detalhes'],['hist','Histórico',hist.length]]} value=${tab} onChange=${setTab}/></span>`}</div>
    ${tab==='hist'?(hist.length?html`<ol className="space-y-3">${hist.map(h=>html`<li key=${h.id} className="rounded-[18px] bg-panel2 px-4 py-3"><p className="text-sm"><b>${h.actor}</b> <span className="text-soft">${(ACT[h.action]||h.action).toLowerCase()}</span>${h.detail&&html`<span className="text-faint">: ${h.detail}</span>`}</p><p className="text-xs text-faint">${F(h.at,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}${h.reason?'. Motivo: '+h.reason:''}</p></li>`)}</ol>`:html`<${Empty} title="Sem registros para este plantão"/>`)
    :html`<div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-3">${[['Categoria',s.cat?CAT[s.cat]:'Qualquer'],['Vagas',`${act.length} de ${s.slots} preenchidas`],['Competências',s.comps.join(', ')||'Nenhuma']].map(([k,v])=>html`<div key=${k} className="rounded-[18px] bg-panel2 p-3"><p className="text-[12px] text-faint">${k}</p><p className="mt-0.5 text-sm font-bold">${v}</p></div>`)}</div>
      ${s.notes&&html`<p className="rounded-[18px] bg-panel2 px-4 py-3 text-sm">${s.notes}</p>`}${canc&&html`<p className="rounded-[18px] bg-dangerbg px-4 py-3 text-sm text-danger">Cancelado: ${s.cancelReason}</p>`}
      <section><h3 className="mb-2 text-sm font-bold">Escalados</h3>${act.length===0?html`<p className="text-sm text-soft">Ninguém escalado ainda.</p>`:html`<ul className="space-y-2">${act.map(a=>html`<${Assigned} key=${a.id} a=${a} s=${s} manage=${manage}/>`)}</ul>`}
        ${past.length>0&&html`<p className="mt-2 text-xs text-faint">Saíram da escala: ${past.map(a=>`${profOf(S,a.prof).name} (${AST[a.status][0].toLowerCase()})`).join(', ')}</p>`}</section>
      ${manage&&act.length<s.slots&&html`<${Picker} s=${s}/>`}
      ${manage&&html`<div className="flex flex-wrap gap-2 border-t border-line pt-4"><${Btn} size="sm" icon="pencil" onClick=${onEdit}>Editar<//><${Btn} size="sm" icon="copy" onClick=${()=>setPanel(panel==='dup'?null:'dup')}>Duplicar ou repetir<//>
        ${s.status==='rascunho'&&can(S,u,'shifts.publish',s.unit)&&html`<${Btn} size="sm" v="ink" icon="send" onClick=${()=>run((D,U)=>A.publish(D,U,[s.id]),'Plantão publicado. Os escalados foram avisados.')}>Publicar<//>`}
        ${s.status==='rascunho'?html`<${Btn} size="sm" v="danger" icon="trash" className="ml-auto" onClick=${()=>setPanel(panel==='del'?null:'del')}>Excluir rascunho<//>`:html`<${Btn} size="sm" v="danger" icon="ban" className="ml-auto" onClick=${()=>setPanel(panel==='can'?null:'can')}>Cancelar plantão<//>`}</div>`}
      ${panel==='del'&&html`<div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-dangerbg p-4 text-sm"><span className="flex-1">Rascunho não publicado: será excluído de vez, junto com as atribuições. A exclusão fica na auditoria.</span><${Btn} size="sm" v="danger" className="bg-panel" onClick=${()=>{const x=run((D,U)=>A.shiftDelete(D,U,s.id),'Rascunho excluído.');if(x.ok)onClose()}}>Excluir agora<//></div>`}
      ${panel==='dup'&&html`<${Duplicate} s=${s} onDone=${()=>setPanel(null)}/>`}${panel==='can'&&html`<${CancelPanel} s=${s} onDone=${onClose}/>`}</div>`}<//>`;
}
function Assigned({a,s,manage}){
  const {S,run}=useApp();const [rm,setRm]=useState(false);const [r,setR]=useState('');const p=profOf(S,a.prof);
  return html`<li className="rounded-[20px] bg-panel2 px-3 py-2.5"><div className="flex flex-wrap items-center gap-2.5"><${Avatar} name=${p.name} size=${32}/><span className="min-w-0"><span className="block text-sm font-bold">${p.name}</span><span className="block text-xs text-faint">${CAT[p.cat]}</span></span><${Badge} tone=${AST[a.status][1]}>${AST[a.status][0]}<//>${(a.inAt||a.outAt)&&html`<span className="text-[12px] text-soft">Ponto ${a.inAt?hm(a.inAt):'—'} às ${a.outAt?hm(a.outAt):'—'}</span>`}
    ${manage&&!rm&&html`<button className="ml-auto text-[13px] font-semibold text-soft hover:text-danger" onClick=${()=>setRm(true)}>Remover</button>`}</div>
    ${a.reason&&html`<p className="mt-2 flex items-start gap-1 text-xs text-amber"><${Icon} n="alert" s=${12} className="mt-0.5"/>Exceção autorizada: ${a.reason}</p>`}
    ${rm&&html`<div className="mt-2 flex flex-wrap items-center gap-2">${s.status!=='rascunho'&&html`<input className=${inputCls+' h-9 flex-1 bg-panel py-1'} placeholder="Motivo (obrigatório em escala publicada)" value=${r} onInput=${e=>setR(e.target.value)} aria-label="Motivo"/>`}
      <${Btn} size="sm" onClick=${()=>setRm(false)}>Voltar<//><${Btn} size="sm" v="danger" disabled=${s.status!=='rascunho'&&!r.trim()} onClick=${()=>run((D,U)=>A.unassign(D,U,a.id,r),'Profissional removido do plantão.')}>Remover<//></div>`}</li>`;
}
function Picker({s}){
  const {S,run}=useApp();const [q,setQ]=useState('');const [sel,setSel]=useState(null);const [reason,setReason]=useState('');const [conf,setConf]=useState(false);
  const assigned=new Set(S.asg.filter(a=>a.shift===s.id&&ACTIVE(a.status)).map(a=>a.prof));const rank=c=>c.blocking.length?3:c.warnings.length?2:0;
  const pool=S.profs.filter(p=>p.active&&!assigned.has(p.id)&&(!s.cat||p.cat===s.cat)).map(p=>({p,c:checks(S,s,p.id)})).filter(x=>x.p.name.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>rank(a.c)-rank(b.c)||a.p.name.localeCompare(b.p.name));
  const cur=sel&&pool.find(x=>x.p.id===sel);
  return html`<section className="rounded-[24px] bg-panel2 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2"><h3 className="text-sm font-bold">Escalar profissional</h3><input className=${inputCls+' h-9 w-48 bg-panel py-1 text-sm'} placeholder="Buscar" aria-label="Buscar profissional" value=${q} onInput=${e=>setQ(e.target.value)}/></div>
    ${pool.length===0?html`<p className="px-1 py-3 text-sm text-soft">Nenhum profissional ${s.cat?'da categoria '+CAT[s.cat].toLowerCase():''} disponível.</p>`:html`<ul className="max-h-72 space-y-1 overflow-y-auto">
      ${pool.map(({p,c})=>{const bl=c.blocking.length>0,is=sel===p.id;return html`<li key=${p.id} className=${cx('rounded-[18px] px-2.5 py-2',is?'bg-panel':'')}>
        <div className="flex items-center gap-2.5"><${Avatar} name=${p.name} size=${30}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">${p.name}</p></div>
          ${bl?html`<${Badge} tone="danger">Indisponível<//>`:c.warnings.length?html`<${Badge} tone="amber">${c.warnings.length} ${c.warnings.length===1?'alerta':'alertas'}<//>`:html`<${Badge} tone="teal"><${Icon} n="check" s=${12}/>Livre<//>`}
          <${Btn} size="sm" v=${is?'ink':'soft'} className=${is?'':'bg-panel'} disabled=${bl} onClick=${()=>{setSel(is?null:p.id);setReason('')}}>${is?'Selecionado':'Selecionar'}<//></div>
        ${(bl||is)&&html`<div className="pl-10"><${Checks} c=${c} compact/></div>`}</li>`})}</ul>`}
    ${cur&&html`<div className="mt-2 space-y-3 rounded-[18px] bg-panel p-3">${cur.c.warnings.length>0&&html`<${Override} c=${{blocking:[],warnings:cur.c.warnings}} reason=${reason} setReason=${setReason}/>`}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--c-lime))]" checked=${conf} onChange=${e=>setConf(e.target.checked)}/>Presença já combinada (registrar como confirmado)</label>
      <div className="flex justify-end"><${Btn} size="sm" v="lime" disabled=${cur.c.warnings.length>0&&!reason.trim()} onClick=${()=>{const r=run((D,U)=>A.assign(D,U,s.id,cur.p.id,reason,conf),'Profissional escalado.');if(r.ok){setSel(null);setReason('')}}}>${cur.c.warnings.length?'Autorizar e escalar':'Escalar'}<//></div></div>`}</section>`;
}
function Duplicate({s,onDone}){
  const {run}=useApp();const base=dkey(s.start);const [from,setFrom]=useState(addDays(base,1));const [to,setTo]=useState(addDays(base,7));const [days,setDays]=useState([wdOf(base)]);
  const dates=[];if(from&&to&&to>=from)for(let d=from;d<=to&&dates.length<61;d=addDays(d,1))if(days.includes(wdOf(d))&&d!==base)dates.push(d);
  return html`<div className="rounded-[22px] bg-panel2 p-4"><p className="mb-3 text-sm text-soft">Cria cópias em rascunho, no mesmo horário, sem ninguém escalado.</p>
    <div className="grid gap-3 sm:grid-cols-2"><${Field} label="De" id="dup-from"><input id="dup-from" type="date" className=${inputCls+' bg-panel'} value=${from} onChange=${e=>setFrom(e.target.value)}/><//><${Field} label="Até" id="dup-to"><input id="dup-to" type="date" className=${inputCls+' bg-panel'} value=${to} onChange=${e=>setTo(e.target.value)}/><//></div>
    <div className="mt-3 flex flex-wrap gap-1.5">${[1,2,3,4,5,6,0].map(d=>html`<label key=${d} className=${cx('cursor-pointer rounded-full px-3 py-1.5 text-[13px] font-semibold',days.includes(d)?'bg-lime text-onlime':'bg-panel')}><input type="checkbox" className="sr-only" checked=${days.includes(d)} onChange=${e=>setDays(e.target.checked?[...days,d]:days.filter(x=>x!==d))}/>${WDS[d]}</label>`)}</div>
    <div className="mt-3 flex items-center justify-between gap-2"><span className="text-sm text-soft">${dates.length} ${dates.length===1?'cópia':'cópias'}</span><${Btn} size="sm" v="lime" disabled=${!dates.length} onClick=${()=>{const r=run((D,U)=>A.duplicate(D,U,s.id,dates),n=>`${n} ${n===1?'cópia criada':'cópias criadas'} como rascunho.`);if(r.ok)onDone()}}>Criar cópias<//></div></div>`;
}
function CancelPanel({s,onDone}){
  const {S,run}=useApp();const [r,setR]=useState('');const n=S.asg.filter(a=>a.shift===s.id&&ACTIVE(a.status)).length;
  return html`<div className="rounded-[22px] bg-dangerbg p-4"><p className="text-sm">O plantão fica no histórico como cancelado${n?`, e ${n===1?'quem está escalado é liberado e avisado':`os ${n} escalados são liberados e avisados`}`:''}.</p>
    <${Field} label="Motivo do cancelamento" id="can-r" className="mt-3"><textarea id="can-r" className=${inputCls+' min-h-[60px] bg-panel'} value=${r} onInput=${e=>setR(e.target.value)}></textarea><//>
    <div className="mt-3 flex justify-end"><${Btn} size="sm" v="danger" className="bg-panel" disabled=${!r.trim()} onClick=${()=>{const x=run((D,U)=>A.cancel(D,U,s.id,r),'Plantão cancelado.');if(x.ok)onDone()}}>Confirmar cancelamento<//></div></div>`;
}

/* ------------------------------------------------------------------ gerar escala */
function Gerar(){
  const {S,u,run,go}=useApp();const T=today();const nw=addDays(weekStart(T),7);
  const units=S.units.filter(x=>!x.archived&&can(S,u,'shifts.manage',x.id));
  const [from,setFrom]=useState(T);const [to,setTo]=useState(addDays(nw,6));const [unit,setUnit]=useState(u.units?u.units[0]:'');const [allow,setAllow]=useState(false);
  const [prop,setProp]=useState(null);const [reason,setReason]=useState('');
  const gen=()=>{setProp(proposeSchedule(S,u,from,to,unit,allow));setReason('')};
  const filled=prop?prop.filter(x=>x.prof):[],uncovered=prop?prop.filter(x=>!x.prof):[];
  const withW=filled.filter(x=>x.warnings&&x.warnings.length);
  const hrs={};filled.forEach(x=>{const s=shiftOf(S,x.shift);hrs[x.prof]=(hrs[x.prof]||0)+hours(s.start,s.end,s.brk)});
  return html`<div className="space-y-5"><${PageHead} title="Gerar escala" desc="O motor preenche as vagas abertas com quem não tem nenhuma restrição obrigatória e distribui as horas de forma equilibrada. Você revisa antes de aplicar."/>
    <${Card}><div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
      <${Field} label="De" id="g-from"><input id="g-from" type="date" className=${inputCls} value=${from} onChange=${e=>setFrom(e.target.value)}/><//>
      <${Field} label="Até" id="g-to"><input id="g-to" type="date" className=${inputCls} value=${to} onChange=${e=>setTo(e.target.value)}/><//>
      <${Field} label="Unidade" id="g-unit"><select id="g-unit" className=${inputCls} value=${unit} onChange=${e=>setUnit(e.target.value)} disabled=${!!u.units}>${!u.units&&html`<option value="">Todas que você gerencia</option>`}${units.map(x=>html`<option key=${x.id} value=${x.id}>${x.name}</option>`)}</select><//>
      <${Btn} v="lime" size="lg" icon="wand" onClick=${gen}>Gerar proposta<//></div>
      <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked=${allow} onChange=${e=>setAllow(e.target.checked)}/>Aceitar candidatos com alertas (exige justificativa ao aplicar)</label>
      <p className="mt-2 text-xs text-faint">Critérios: categoria e vagas, sobreposição, férias e afastamentos, descanso mínimo de ${S.rules.rest}h, carga semanal de ${S.rules.week}h, disponibilidade, competências e menor carga na semana.</p><//>
    ${prop&&html`<div className="grid gap-3 sm:grid-cols-3"><${Stat} label="Vagas analisadas" value=${prop.length}/><${Stat} label="Preenchidas na proposta" value=${filled.length} tone="teal"/><${Stat} label="Sem candidato possível" value=${uncovered.length} tone=${uncovered.length?'danger':null}/></div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <${Card} title="Proposta" sub="Nada é salvo até você aplicar.">${filled.length===0?html`<${Empty} title="Nenhuma vaga preenchida">Tente aceitar candidatos com alertas ou ampliar o período.<//>`:html`<ul className="space-y-1.5">${filled.map((x,i)=>{const s=shiftOf(S,x.shift),p=profOf(S,x.prof);return html`<li key=${i} className="flex flex-wrap items-center gap-3 rounded-[20px] bg-panel2 px-3 py-2.5">
          <span className="w-36 text-sm font-bold">${cap(F(s.start,{weekday:'short',day:'2-digit',month:'2-digit'}))} ${hm(s.start)}</span><span className="hidden min-w-0 flex-1 truncate text-[13px] text-soft sm:block">${unitOf(S,s.unit).name}${s.service?' / '+servOf(S,s.service).name:''}</span>
          <span className="flex items-center gap-2"><${Avatar} name=${p.name} size=${28}/><span className="text-sm font-semibold">${p.name}</span></span>${x.warnings.length>0&&html`<${Badge} tone="amber">${x.warnings.length} alerta${x.warnings.length>1?'s':''}<//>`}</li>`})}</ul>`}
          ${filled.length>0&&html`<div className="mt-4 space-y-3">${withW.length>0&&html`<${Override} c=${{blocking:[],warnings:[...new Set(withW.flatMap(x=>x.warnings))].slice(0,5)}} reason=${reason} setReason=${setReason}/>`}
            <div className="flex flex-wrap justify-end gap-2"><${Btn} onClick=${()=>setProp(null)}>Descartar<//><${Btn} v="lime" icon="check" disabled=${withW.length>0&&!reason.trim()} onClick=${()=>{const r=run((D,U)=>A.applyProposal(D,U,prop,reason),n=>`${n} profissionais escalados. Confirmações pendentes até publicar.`);if(r.ok){setProp(null);go({page:'escalas',d:from})}}}>Aplicar proposta<//></div></div>`}<//>
        <div className="space-y-5"><${Card} title="Horas por profissional"><${BarList} rows=${Object.entries(hrs).map(([k,v])=>({k:profOf(S,k).name,v})).sort((a,b)=>b.v-a.v)} max=${Math.max(12,...Object.values(hrs))} fmt=${fmtH}/><//>
          <${Card} title="Por que ficaram descobertas">${uncovered.length===0?html`<p className="text-sm text-soft">Todas as vagas do período têm candidato.</p>`:html`<ul className="space-y-2">${uncovered.map((x,i)=>{const s=shiftOf(S,x.shift);return html`<li key=${i} className="rounded-[18px] bg-dangerbg px-3.5 py-2.5"><p className="text-sm font-bold text-danger">${label(s)}, ${unitOf(S,s.unit).name}</p><ul className="mt-1 text-xs text-ink/80">${x.reasons.map((r,j)=>html`<li key=${j}>${r}</li>`)}</ul></li>`})}</ul>`}<//></div></div>`}
  </div>`;
}

/* ------------------------------------------------------------------ solicitações */
function Solicitacoes(){
  const {S,u}=useApp();const [tab,setTab]=useState('pend');
  const mine=S.reqs.filter(r=>can(S,u,'requests.decide',shiftOf(S,r.shift).unit));
  const pend=mine.filter(r=>r.status==='pendente').sort((a,b)=>a.created.localeCompare(b.created));
  const done=mine.filter(r=>r.status!=='pendente').sort((a,b)=>(b.decided||b.created).localeCompare(a.decided||a.created));
  const list=tab==='pend'?pend:done;
  return html`<div><${PageHead} title="Solicitações" desc="Substituições, cancelamentos e alterações pedidos pelos profissionais, e candidaturas a vagas abertas." actions=${html`<${Seg} size="sm" items=${[['pend','Pendentes',pend.length],['done','Analisadas',done.length]]} value=${tab} onChange=${setTab}/>`}/>
    ${list.length===0?html`<${Empty} title=${tab==='pend'?'Nenhuma solicitação pendente':'Nada analisado ainda'}>Entre como Carla Mendes e peça uma substituição para ver o pedido chegar aqui.<//>`:html`<div className="grid gap-4 lg:grid-cols-2">${list.map(r=>html`<${ReqItem} key=${r.id} r=${r} decide=${tab==='pend'}/>`)}</div>`}</div>`;
}
function ReqItem({r,decide}){
  const {S,run}=useApp();const s=shiftOf(S,r.shift),p=profOf(S,r.prof);
  const [mode,setMode]=useState(null);const [n,setN]=useState('');const [sub,setSub]=useState('');const [c,setC]=useState(null);const [bl,setBl]=useState(false);const [reason,setReason]=useState('');
  const cands=S.profs.filter(x=>x.active&&x.id!==r.prof&&(!s.cat||x.cat===s.cat));
  const freed=useMemo(()=>{if(r.kind==='candidatura'||!r.asg)return S;const D=structuredClone(S);const a=D.asg.find(x=>x.id===r.asg);if(a)a.status='removido';return D},[S,r]);
  const st=pid=>{const k=checks(freed,shiftOf(freed,s.id),pid);return k.blocking.length?'b':k.warnings.length?'w':''};
  const subCheck=sub&&r.kind!=='candidatura'?checks(freed,shiftOf(freed,s.id),sub):null;
  const go=ok=>{const x=run((D,U)=>A.decide(D,U,r.id,ok,n,ok?sub||null:null,reason),ok?'Solicitação aprovada.':'Solicitação recusada.');if(!x.ok&&x.checks){setC(x.checks);setBl(x.kind==='blocking')}};
  return html`<article className="rounded-[28px] bg-panel p-5 card-sh">
    <div className="flex items-start gap-3"><${Avatar} name=${p.name} size=${44}/><div className="min-w-0 flex-1"><p className="font-bold">${p.name}</p><p className="text-[13px] text-soft">pediu ${RK[r.kind].toLowerCase()}</p></div><${Badge} tone=${RST[r.status][1]}>${RST[r.status][0]}<//></div>
    <div className="mt-4 rounded-[20px] bg-navy p-4 text-onnavy"><p className="text-[12px] opacity-70">${cap(F(s.start,{weekday:'long',day:'2-digit',month:'2-digit'}))}</p><p className="thin text-[30px] leading-tight">${hm(s.start)}–${hm(s.end)}</p><p className="text-[13px] opacity-80">${unitOf(S,s.unit).name}${s.service?' / '+servOf(S,s.service).name:''}</p></div>
    ${r.reason&&html`<p className="mt-3 rounded-[18px] bg-panel2 px-4 py-2.5 text-sm">“${r.reason}”</p>`}${r.note&&html`<p className="mt-2 text-sm text-soft">Resposta${r.by?' de '+r.by:''}: ${r.note}</p>`}
    <p className="mt-2 text-xs text-faint">Enviada em ${F(r.created,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</p>
    ${decide&&!mode&&html`<div className="mt-4 flex gap-2"><${Btn} v="lime" onClick=${()=>setMode('ok')}>Aprovar<//><${Btn} onClick=${()=>setMode('no')}>Recusar<//></div>`}
    ${decide&&mode&&html`<div className="mt-4 space-y-3">
      ${mode==='ok'&&(r.kind==='substituicao'||r.kind==='cancelamento')&&html`<${Field} label="Substituto" id=${'sub'+r.id} hint="Passa pelas mesmas regras da escala."><select id=${'sub'+r.id} className=${inputCls} value=${sub} onChange=${e=>{setSub(e.target.value);setC(null);setReason('')}}>
        <option value="">Sem substituto agora (a vaga fica descoberta)</option>${cands.map(x=>{const k=st(x.id);return html`<option key=${x.id} value=${x.id} disabled=${k==='b'}>${x.name}${k==='b'?' (indisponível)':k==='w'?' (com alertas)':''}</option>`})}</select><//>`}
      ${subCheck&&!c&&html`<${Checks} c=${subCheck}/>`}${mode==='ok'&&r.kind==='alteracao'&&html`<p className="text-sm text-soft">Aprovar registra a decisão. Faça a alteração no calendário.</p>`}
      <${Field} label=${mode==='no'?'Motivo da recusa':'Mensagem ao profissional (opcional)'} id=${'n'+r.id}><textarea id=${'n'+r.id} className=${inputCls+' min-h-[56px]'} value=${n} onInput=${e=>setN(e.target.value)}></textarea><//>
      ${c&&html`<${Override} c=${c} reason=${reason} setReason=${setReason} blocking=${bl}/>`}
      <div className="flex justify-end gap-2"><${Btn} onClick=${()=>{setMode(null);setC(null)}}>Voltar<//>${mode==='ok'?html`<${Btn} v="lime" disabled=${bl||(c&&!reason.trim())} onClick=${()=>go(true)}>${c?'Autorizar e aprovar':'Confirmar aprovação'}<//>`:html`<${Btn} v="danger" disabled=${!n.trim()} onClick=${()=>go(false)}>Confirmar recusa<//>`}</div></div>`}</article>`;
}
