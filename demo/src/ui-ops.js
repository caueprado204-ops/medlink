/* ------------------------------------------------------------------ estoque */
const LST={ok:['Válido','teal'],vencendo:['Vence em breve','amber'],vencido:['Vencido','danger'],em_avaliacao:['Em avaliação','amber'],bloqueado:['Bloqueado','danger']};
const MVT={entrada:['Entrada','teal'],saida:['Saída','neutral'],perda:['Perda','danger'],ajuste:['Ajuste','sky'],estorno:['Estorno','sky']};
function Estoque(){
  const {S,u,run}=useApp();const manage=can(S,u,'stock.manage');const [cat,setCat]=useState('');const [open,setOpen]=useState(null);const [mv,setMv]=useState(null);
  const items=S.items.filter(i=>!i.archived&&(!cat||i.cat===cat));const {go}=useApp();
  return html`<div className="space-y-5"><${PageHead} title="Estoque" desc="Itens, lotes e validades. Toda movimentação registra quem fez, quando e por quê." actions=${html`${can(S,u,'org.manage')&&html`<${Btn} icon="pencil" onClick=${()=>go({page:'organizacao'})}>Editar itens<//>`}${manage&&html`<${Btn} v="lime" icon="plus" onClick=${()=>setMv({type:'entrada',item:S.items[0].id})}>Nova movimentação<//>`}`}/>
    <div className="grid gap-3 sm:grid-cols-4"><${Stat} label="Itens abaixo do mínimo" value=${S.items.filter(i=>!i.archived&&itemQty(S,i.id)<i.min).length} tone="amber"/><${Stat} label="Lotes vencendo em 30 dias" value=${S.lots.filter(l=>lotStatus(S,l)==='vencendo'&&l.qty>0).length} tone="amber"/>
      <${Stat} label="Lotes vencidos com saldo" value=${S.lots.filter(l=>lotStatus(S,l)==='vencido'&&l.qty>0).length} tone="danger"/><${Stat} label="Em avaliação" value=${S.lots.filter(l=>l.status==='em_avaliacao').length} tone="danger"/></div>
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <${Card} title="Itens" action=${html`<${Seg} size="sm" items=${[['','Todos'],['Vacina','Vacinas'],['Insumo','Insumos'],['EPI','EPI']]} value=${cat} onChange=${setCat}/>`}>
        <ul className="space-y-2">${items.map(i=>{const q=itemQty(S,i.id),low=q<i.min,lots=S.lots.filter(l=>l.item===i.id);const isO=open===i.id;return html`<li key=${i.id} className="rounded-[22px] bg-panel2">
          <button onClick=${()=>setOpen(isO?null:i.id)} className="flex w-full items-center gap-3 p-3.5 text-left" aria-expanded=${isO}>
            <span className=${cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-onp',low?'bg-p5':i.vac?PASTEL[VAC[i.vac].c]:'bg-p3')}><${Icon} n=${i.cat==='Vacina'?'syringe':'box'} s=${16}/></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">${i.name}</span><span className="mt-1 block h-1.5 max-w-[220px] rounded-full bg-panel"><span className=${cx('block h-full rounded-full',low?'bg-amber':'bg-lime')} style=${{width:Math.min(100,q/(i.min*2)*100)+'%'}}></span></span></span>
            <span className="text-right"><span className="thin block text-[22px] leading-none">${q}</span><span className="text-[11px] text-faint">${i.unit} · mín. ${i.min}</span></span><${Icon} n="down" className=${cx('text-faint transition',isO&&'rotate-180')}/></button>
          ${isO&&html`<div className="px-3.5 pb-3.5"><ul className="space-y-1">${lots.map(l=>{const st=lotStatus(S,l);return html`<li key=${l.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-panel px-3 py-2 text-[13px]">
            <span className="font-semibold">${i.lotc?'Lote '+l.lot:'Saldo geral'}</span><span className="text-soft">${unitOf(S,l.unit).name}</span><span className="text-soft">val. ${F(l.exp,{day:'2-digit',month:'2-digit',year:'2-digit'})}</span><${Badge} tone=${LST[st][1]}>${LST[st][0]}<//><span className="ml-auto font-bold">${l.qty}</span>
            ${manage&&html`<button className="rounded-full bg-panel2 px-2.5 py-1 text-[12px] font-semibold hover:bg-lime hover:text-onlime" onClick=${()=>setMv({type:'saida',item:i.id,lot:l.id})}>Movimentar</button>`}</li>`})}</ul></div>`}</li>`})}</ul><//>
      <${Card} title="Últimas movimentações"><ul className="space-y-1.5">${S.moves.slice(0,14).map(m=>html`<li key=${m.id} className="flex items-start gap-3 rounded-[18px] px-2 py-2 text-[13px] hover:bg-panel2">
        <${Badge} tone=${MVT[m.type][1]}>${MVT[m.type][0]}<//><span className="min-w-0 flex-1"><span className="block truncate font-semibold">${m.qty} ${itemOf(S,m.item).unit} · ${itemOf(S,m.item).name}</span><span className="block truncate text-faint">${m.reason} · ${m.user}</span></span>
        <span className="shrink-0 text-faint">${D2(m.at)}</span></li>`)}</ul><//></div>
    ${mv&&html`<${MoveForm} init=${mv} onClose=${()=>setMv(null)}/>`}</div>`;
}
function MoveForm({init,onClose}){
  const {S,run}=useApp();const [f,setF]=useState({type:init.type,item:init.item,lot:init.lot||'',newLot:'',exp:'',unit:S.units[0].id,qty:'',reason:''});
  const it=itemOf(S,f.item);const lots=S.lots.filter(l=>l.item===f.item);
  return html`<${Modal} open onClose=${onClose} title="Movimentar estoque" desc="Movimentações não podem ser apagadas. Correções viram um novo ajuste."
    footer=${html`<${Btn} onClick=${onClose}>Cancelar<//><${Btn} v="lime" onClick=${()=>{const r=run((D,U)=>A.stockMove(D,U,f),'Movimentação registrada.');if(r.ok)onClose()}}>Registrar<//>`}>
    <div className="grid gap-4"><${Seg} size="sm" items=${[['entrada','Entrada'],['saida','Saída'],['perda','Perda'],['ajuste','Ajuste']]} value=${f.type} onChange=${t=>setF({...f,type:t})}/>
      <${Field} label="Item" id="mv-i"><select id="mv-i" className=${inputCls} value=${f.item} onChange=${e=>setF({...f,item:e.target.value,lot:''})}>${S.items.filter(i=>!i.archived).map(i=>html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}</select><//>
      ${f.type==='entrada'&&it.lotc?html`<div className="grid gap-4 sm:grid-cols-3"><${Field} label="Novo lote" id="mv-nl"><input id="mv-nl" className=${inputCls} value=${f.newLot} onInput=${e=>setF({...f,newLot:e.target.value})}/><//>
          <${Field} label="Validade" id="mv-ex"><input id="mv-ex" type="date" className=${inputCls} value=${f.exp} onChange=${e=>setF({...f,exp:e.target.value})}/><//>
          <${Field} label="Unidade" id="mv-u"><select id="mv-u" className=${inputCls} value=${f.unit} onChange=${e=>setF({...f,unit:e.target.value})}>${S.units.map(x=>html`<option key=${x.id} value=${x.id}>${x.name}</option>`)}</select><//></div>`
        :html`<${Field} label="Lote" id="mv-l"><select id="mv-l" className=${inputCls} value=${f.lot} onChange=${e=>setF({...f,lot:e.target.value})}><option value="">Selecione</option>${lots.map(l=>html`<option key=${l.id} value=${l.id}>${it.lotc?l.lot+', ':''}${unitOf(S,l.unit).name}, saldo ${l.qty}</option>`)}</select><//>`}
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr]"><${Field} label=${'Quantidade ('+it.unit+')'} id="mv-q"><input id="mv-q" type="number" min="1" className=${inputCls} value=${f.qty} onInput=${e=>setF({...f,qty:e.target.value})}/><//>
        <${Field} label="Motivo ou referência" id="mv-r"><input id="mv-r" className=${inputCls} placeholder=${f.type==='entrada'?'Ex.: nota fiscal 1234':'Ex.: consumo da sala 2'} value=${f.reason} onInput=${e=>setF({...f,reason:e.target.value})}/><//></div></div><//>`;
}

/* ------------------------------------------------------------------ temperatura */
const OST={aberta:['Aberta','danger'],em_avaliacao:['Em avaliação técnica','amber'],liberado:['Lotes liberados','teal'],descartado:['Lotes descartados','neutral']};
function Temperatura(){
  const {S,u,run}=useApp();const manage=can(S,u,'coldchain.manage');const [vals,setVals]=useState({});const [occ,setOcc]=useState(null);const [txt,setTxt]=useState('');
  return html`<div className="space-y-5"><${PageHead} title="Temperatura" desc="Leituras da rede de frio. Fora da faixa configurada, a ocorrência é aberta e os lotes ficam em avaliação. Nada é liberado automaticamente."/>
    <div className="grid gap-4 lg:grid-cols-3">${S.equip.filter(e=>!e.archived).map(e=>{const rs=S.readings.filter(r=>r.eq===e.id).sort((a,b)=>a.at.localeCompare(b.at));const last=rs[rs.length-1];const out=last&&(last.temp<e.min||last.temp>e.max);
      return html`<article key=${e.id} className=${cx('rounded-[24px] p-5',out?'bg-dangerbg':'bg-panel card-sh')}>
        <div className="flex items-start justify-between"><div><p className="font-bold">${e.name}</p><p className="text-[13px] text-soft">${unitOf(S,e.unit).name} · faixa ${e.min} a ${e.max} °C</p></div><span className=${cx('grid h-10 w-10 place-items-center rounded-xl',out?'bg-danger text-white':'bg-p3 text-onp')}><${Icon} n="thermo" s=${18}/></span></div>
        <p className=${cx('thin mt-3 text-[52px] leading-none',out&&'text-danger')}>${last?last.temp.toLocaleString('pt-BR'):'—'}<span className="text-xl text-faint"> °C</span></p>
        <p className="text-[12px] text-faint">${last?`Última leitura ${F(last.at,{day:'2-digit',month:'2-digit'})} ${hm(last.at)}, ${last.user}`:'Sem leituras'}</p>
        <div className="mt-3"><${Spark} vals=${rs.slice(-10).map(r=>r.temp)} min=${e.min-1} max=${e.max+1} lo=${e.min} hi=${e.max}/></div>
        ${manage&&html`<div className="mt-3 flex gap-2"><input className=${inputCls+' h-10 py-1.5'} inputMode="decimal" placeholder="Ex.: 4,5" aria-label=${'Leitura '+e.name} value=${vals[e.id]||''} onInput=${ev=>setVals({...vals,[e.id]:ev.target.value})}/>
          <${Btn} v="lime" disabled=${!vals[e.id]} onClick=${()=>{const r=run((D,U)=>A.reading(D,U,e.id,vals[e.id]),x=>x==='fora'?'Leitura fora da faixa: ocorrência aberta e lotes em avaliação.':'Leitura registrada.');if(r.ok)setVals({...vals,[e.id]:''})}}>Registrar<//></div>`}</article>`})}</div>
    <${Card} title="Ocorrências" sub="A decisão sobre os produtos segue o procedimento técnico da instituição e fica registrada.">
      ${S.occ.length===0?html`<${Empty} title="Nenhuma ocorrência"/>`:html`<ul className="space-y-2">${S.occ.map(o=>{const e=S.equip.find(x=>x.id===o.eq);return html`<li key=${o.id} className="rounded-[22px] bg-panel2 p-4">
        <div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><p className="font-bold">${e.name}: ${o.temp.toLocaleString('pt-BR')} °C</p><p className="text-[13px] text-soft">${F(o.at,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}, faixa ${e.min} a ${e.max} °C</p>
          ${o.action&&html`<p className="mt-2 text-sm">${o.action}</p>`}${o.note&&o.note!==o.action&&html`<p className="mt-1 text-sm text-soft">Parecer: ${o.note}</p>`}
          <p className="mt-2 text-[13px] text-soft">Lotes envolvidos: ${o.lots.map(l=>{const x=lotOf(S,l);return x?`${itemOf(S,x.item).name} ${x.lot}`:''}).join(', ')||'nenhum'}</p></div><${Badge} tone=${OST[o.status][1]}>${OST[o.status][0]}<//></div>
        ${manage&&(o.status==='aberta'||o.status==='em_avaliacao')&&html`<div className="mt-3"><${Btn} size="sm" v="ink" onClick=${()=>{setOcc(o);setTxt('')}}>Registrar avaliação<//></div>`}</li>`})}</ul>`}<//>
    ${occ&&html`<${Modal} open onClose=${()=>setOcc(null)} title="Avaliação da ocorrência" desc="Registre as medidas e o parecer técnico. A escolha fica na auditoria.">
      <${Field} label="Medidas adotadas e parecer" id="oc-t"><textarea id="oc-t" className=${inputCls+' min-h-[90px]'} value=${txt} onInput=${e=>setTxt(e.target.value)} placeholder="Ex.: consultado o fabricante e o procedimento da instituição..."></textarea><//>
      <div className="mt-4 flex flex-wrap justify-end gap-2">${[['em_avaliacao','Manter em avaliação','soft'],['liberado','Liberar lotes','lime'],['descartado','Descartar lotes','danger']].map(([st,l,v])=>html`<${Btn} key=${st} v=${v} disabled=${!txt.trim()} onClick=${()=>{const r=run((D,U)=>A.occurrence(D,U,occ.id,st,txt),'Avaliação registrada.');if(r.ok)setOcc(null)}}>${l}<//>`)}</div><//>`}</div>`;
}

/* ------------------------------------------------------------------ home care */
function HomeCare(){
  const {S,u,run,go}=useApp();const T=today();const manage=can(S,u,'homecare.manage');
  const [day,setDay]=useState(T);const [by,setBy]=useState('hora');const [nw,setNw]=useState(false);
  const [f,setF]=useState({patient:'hp1',prof:'p6',date:T,start:'09:00',end:'10:00',service:'Curativo'});
  const days=[...Array(7)].map((_,i)=>addDays(T,i-1));
  const list=S.visits.filter(v=>v.date===day&&v.status!=='cancelado').sort((a,b)=>a.start.localeCompare(b.start));
  const groups=by==='hora'?[['',list]]:Object.entries(list.reduce((g,v)=>{const k=by==='prof'?profOf(S,v.prof).name:S.patients.find(p=>p.id===v.patient).region;(g[k]=g[k]||[]).push(v);return g},{}));
  return html`<div className="space-y-5"><${PageHead} title="Home care" desc="Atendimentos domiciliares por dia, profissional e região. O profissional inicia e conclui pela Minha área." actions=${manage&&html`<${Btn} v="lime" icon="plus" onClick=${()=>setNw(true)}>Agendar atendimento<//>`}/>
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">${days.map(d=>{const n=S.visits.filter(v=>v.date===d&&v.status!=='cancelado').length;return html`<button key=${d} onClick=${()=>setDay(d)} className=${cx('flex w-20 shrink-0 flex-col items-center rounded-[22px] py-3 transition',d===day?'bg-lime text-onlime':'bg-panel hover:ring-2 hover:ring-lime')}>
      <span className="text-[11px] font-bold uppercase">${F(d,{weekday:'short'}).replace('.','')}</span><span className="thin text-[28px] leading-tight">${F(d,{day:'2-digit'})}</span><span className="text-[11px] font-semibold opacity-75">${n} ${n===1?'visita':'visitas'}</span></button>`})}</div>
    <div className="flex flex-wrap items-center justify-between gap-3"><${Seg} size="sm" items=${[['hora','Por horário'],['prof','Por profissional'],['reg','Por região']]} value=${by} onChange=${setBy}/>
      <span className="text-sm text-soft">${list.filter(v=>v.status==='concluido').length} de ${list.length} concluídas</span></div>
    ${list.length===0?html`<${Empty} title="Nenhum atendimento neste dia" action=${manage&&html`<${Btn} v="lime" size="sm" onClick=${()=>{setF({...f,date:day});setNw(true)}}>Agendar<//>`}/>`:groups.map(([g,vs])=>html`<section key=${g||'all'}>${g&&html`<h3 className="mb-2 mt-2 text-sm font-bold text-soft">${g}</h3>`}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">${vs.map(v=>{const pt=S.patients.find(x=>x.id===v.patient),pr=profOf(S,v.prof);return html`<article key=${v.id} className="rounded-[26px] bg-panel p-5 card-sh">
        <div className="flex items-start justify-between"><p className="thin text-[28px] leading-none">${v.start}<span className="text-base text-faint">–${v.end}</span></p><${Badge} tone=${HVS[v.status][1]}>${HVS[v.status][0]}<//></div>
        <button className="mt-3 block text-left font-bold hover:underline" onClick=${()=>can(S,u,'records.view')&&go({page:'paciente',id:pt.id})}>${pt.name}</button><p className="text-[13px] text-soft">${v.service}</p><p className="mt-1 flex items-center gap-1 text-[13px] text-faint"><${Icon} n="pin" s=${13}/>${pt.addr}, ${pt.region}</p>
        <div className="mt-4 flex items-center gap-2"><${Avatar} name=${pr.name} size=${28}/><span className="text-sm font-semibold">${pr.name}</span>
          ${manage&&v.status==='agendado'&&html`<button className="ml-auto text-[13px] font-semibold text-soft hover:text-danger" onClick=${()=>run((D,U)=>A.visitStatus(D,U,v.id,'cancelado'),'Atendimento cancelado.')}>Cancelar</button>`}</div></article>`})}</div></section>`)}
    ${nw&&html`<${Modal} open onClose=${()=>setNw(false)} title="Agendar atendimento" desc="O sistema impede dois atendimentos do mesmo profissional no mesmo horário."
      footer=${html`<${Btn} onClick=${()=>setNw(false)}>Cancelar<//><${Btn} v="lime" onClick=${()=>{const r=run((D,U)=>A.visit(D,U,f),'Atendimento agendado e profissional avisado.');if(r.ok){setNw(false);setDay(f.date)}}}>Agendar<//>`}>
      <div className="grid gap-4 sm:grid-cols-2"><${Field} label="Paciente" id="hv-p"><select id="hv-p" className=${inputCls} value=${f.patient} onChange=${e=>setF({...f,patient:e.target.value})}>${S.patients.filter(p=>p.active&&p.homecare).map(p=>html`<option key=${p.id} value=${p.id}>${p.name} (${p.region})</option>`)}</select><//>
        <${Field} label="Profissional" id="hv-pr"><select id="hv-pr" className=${inputCls} value=${f.prof} onChange=${e=>setF({...f,prof:e.target.value})}>${S.profs.filter(p=>p.active&&p.cat!=='medico').map(p=>html`<option key=${p.id} value=${p.id}>${p.name}</option>`)}</select><//>
        <${Field} label="Serviço" id="hv-s"><select id="hv-s" className=${inputCls} value=${f.service} onChange=${e=>setF({...f,service:e.target.value})}>${['Curativo','Vacinação domiciliar','Coleta domiciliar','Sinais vitais e orientação','Administração de medicação prescrita'].map(x=>html`<option key=${x}>${x}</option>`)}</select><//>
        <${Field} label="Data" id="hv-d"><input id="hv-d" type="date" className=${inputCls} value=${f.date} onChange=${e=>setF({...f,date:e.target.value})}/><//>
        <${Field} label="Início" id="hv-st"><input id="hv-st" type="time" className=${inputCls} value=${f.start} onChange=${e=>setF({...f,start:e.target.value})}/><//>
        <${Field} label="Término" id="hv-en"><input id="hv-en" type="time" className=${inputCls} value=${f.end} onChange=${e=>setF({...f,end:e.target.value})}/><//></div><//>`}</div>`;
}

/* ------------------------------------------------------------------ financeiro */
const finStatus=(x,kind)=>{const done=kind==='pay'?x.paid:x.received;if(done)return['Pago','teal'];const d=daysTo(x.due);return d<0?['Vencido','danger']:d<=7?['Vence em breve','amber']:['A vencer','neutral']};
function FinPage({kind}){
  const {S,u,run}=useApp();const manage=can(S,u,'finance.manage');const list=(kind==='pay'?S.pay:S.rec).slice().sort((a,b)=>a.due.localeCompare(b.due));
  const [fl,setFl]=useState('aberto');const [nw,setNw]=useState(false);const [del,setDel]=useState(null);const [f,setF]=useState({who:'',what:'',cat:'Vacinas e insumos',value:'',due:addDays(today(),15)});
  const done=x=>kind==='pay'?x.paid:x.received;const T=today();
  const rows=list.filter(x=>fl==='todos'||(fl==='aberto'?!done(x):fl==='vencido'?!done(x)&&x.due<T:done(x)));
  const sum=l=>l.reduce((t,x)=>t+x.value,0);const m0=T.slice(0,7);
  const word=kind==='pay'?{t:'Contas a pagar',who:'Fornecedor',what:'Descrição',done:'Pago no mês',btn:'Baixar pagamento',ok:'Pagamento registrado.'}:{t:'Contas a receber',who:'Cliente ou pagador',what:'Serviço',done:'Recebido no mês',btn:'Registrar recebimento',ok:'Recebimento registrado.'};
  return html`<div className="space-y-5"><${PageHead} title=${word.t} desc="Valores previstos, vencidos e efetivamente pagos ficam separados. Sem simulação de pagamento ou conciliação bancária." actions=${manage&&html`<${Btn} v="lime" icon="plus" onClick=${()=>setNw(true)}>Novo lançamento<//>`}/>
    <section className="grid gap-3 rounded-[24px] bg-navy p-5 text-onnavy sm:grid-cols-3">${[['Em aberto',sum(list.filter(x=>!done(x)))],['Vencido',sum(list.filter(x=>!done(x)&&x.due<T))],[word.done,sum(list.filter(x=>done(x)&&done(x).slice(0,7)===m0))]].map(([l,v],i)=>html`<div key=${l} className=${cx('rounded-[22px] p-4',i===0?'bg-lime text-onlime':'bg-onnavy/10')}>
      <p className="text-[13px] font-semibold opacity-80">${l}</p><p className="thin mt-1 text-[34px] leading-none"><span className="text-base opacity-70">R$ </span>${v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</p></div>`)}</section>
    <${Card} action=${html`<${Seg} size="sm" items=${[['aberto','Em aberto'],['vencido','Vencidos'],['pago',kind==='pay'?'Pagos':'Recebidos'],['todos','Todos']]} value=${fl} onChange=${setFl}/>`} title="Lançamentos">
      <${Table} minW=${680} cols=${[word.who,word.what,'Vencimento','Valor','Situação','']} empty="Nenhum lançamento neste filtro" rows=${rows.map(x=>{const st=finStatus(x,kind);return html`<tr key=${x.id}>
        <${TD} className="font-semibold">${x.supplier||x.payer}<//><${TD}>${x.desc||x.service}${x.cat&&html`<span className="block text-xs text-faint">${x.cat}</span>`}<//><${TD} className="whitespace-nowrap">${F(x.due,{day:'2-digit',month:'2-digit',year:'numeric'})}<//>
        <${TD} className="whitespace-nowrap font-bold">${BRL(x.value)}<//><${TD}><${Badge} tone=${st[1]}>${st[0]}<//><//><${TD} className="text-right">${manage&&!done(x)&&html`<span className="inline-flex items-center gap-1"><${Btn} size="sm" v="lime" onClick=${()=>run((D,U)=>A.pay(D,U,kind,x.id),word.ok)}>${word.btn}<//><button className="grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-dangerbg hover:text-danger" aria-label="Excluir lançamento" onClick=${()=>setDel(x)}><${Icon} n="trash" s=${15}/></button></span>`}<//></tr>`})}/><//>
    <${Confirm} open=${!!del} title="Excluir lançamento" desc=${del?`${del.supplier||del.payer}: ${del.desc||del.service}, ${BRL(del.value)}. Só lançamentos em aberto podem ser excluídos.`:''} needReason onClose=${()=>setDel(null)} onOk=${r=>{const x=run((D,U)=>A.billDelete(D,U,kind,del.id,r),'Lançamento excluído.');if(x.ok)setDel(null)}}/>
    ${nw&&html`<${Modal} open onClose=${()=>setNw(false)} title="Novo lançamento" footer=${html`<${Btn} onClick=${()=>setNw(false)}>Cancelar<//><${Btn} v="lime" onClick=${()=>{const r=run((D,U)=>A.bill(D,U,kind,f),'Lançamento registrado.');if(r.ok)setNw(false)}}>Salvar<//>`}>
      <div className="grid gap-4 sm:grid-cols-2"><${Field} label=${word.who} id="fn-w"><input id="fn-w" className=${inputCls} value=${f.who} onInput=${e=>setF({...f,who:e.target.value})}/><//><${Field} label=${word.what} id="fn-d"><input id="fn-d" className=${inputCls} value=${f.what} onInput=${e=>setF({...f,what:e.target.value})}/><//>
        ${kind==='pay'&&html`<${Field} label="Categoria" id="fn-c"><select id="fn-c" className=${inputCls} value=${f.cat} onChange=${e=>setF({...f,cat:e.target.value})}>${['Vacinas e insumos','Pessoal','Estrutura','Manutenção','Outros'].map(x=>html`<option key=${x}>${x}</option>`)}</select><//>`}
        <${Field} label="Valor (R$)" id="fn-v"><input id="fn-v" inputMode="decimal" className=${inputCls} placeholder="0,00" value=${f.value} onInput=${e=>setF({...f,value:e.target.value})}/><//><${Field} label="Vencimento" id="fn-due"><input id="fn-due" type="date" className=${inputCls} value=${f.due} onChange=${e=>setF({...f,due:e.target.value})}/><//></div><//>`}</div>`;
}
const Pagar=()=>html`<${FinPage} kind="pay"/>`;const Receber=()=>html`<${FinPage} kind="rec"/>`;

/* ------------------------------------------------------------------ relatórios */
function Relatorios(){
  const {S,u}=useApp();const T=today(),ws=weekStart(T);const days=[...Array(7)].map((_,i)=>addDays(ws,i));
  const vis=visibleShifts(S,u).filter(s=>s.status!=='cancelado'&&s.status!=='rascunho');
  const cov=days.map(d=>{const l=vis.filter(s=>dkey(s.start)===d);let c=0,p=0,o=0;l.forEach(s=>{const a=S.asg.filter(x=>x.shift===s.id&&ACTIVE(x.status));const cf=a.filter(x=>x.status==='confirmado').length;c+=Math.min(cf,s.slots);p+=Math.min(a.length-cf,s.slots-cf);o+=Math.max(0,s.slots-a.length)});return{d,c,p,o}});
  const maxC=Math.max(1,...cov.map(x=>x.c+x.p+x.o));
  const hrs={};const cost={};vis.filter(s=>dkey(s.start)>=ws&&dkey(s.start)<addDays(ws,7)).forEach(s=>S.asg.filter(a=>a.shift===s.id&&ACTIVE(a.status)).forEach(a=>{const p=profOf(S,a.prof),h=hours(s.start,s.end,s.brk);hrs[p.name]=(hrs[p.name]||0)+h;cost[p.cat]=(cost[p.cat]||0)+h*(S.rates[p.cat]||0)}));
  const totalCost=Object.values(cost).reduce((t,v)=>t+v,0);
  const byVac={};S.imm.filter(i=>i.status==='registrado').forEach(i=>{const n=itemOf(S,i.item).name.replace('Vacina ','');byVac[n]=(byVac[n]||0)+1});
  const rec=S.rec.reduce((t,x)=>t+x.value,0),pay=S.pay.reduce((t,x)=>t+x.value,0);
  return html`<div className="space-y-5"><${PageHead} title="Relatórios" desc="Indicadores calculados a partir dos dados da demonstração."/>
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <${Card} title="Cobertura de vagas na semana" sub="Confirmadas, aguardando e abertas por dia">
        <div className="flex h-56 items-end gap-3 pt-4">${cov.map(x=>{const h=v=>v/maxC*100+'%';return html`<div key=${x.d} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <div className="flex w-full max-w-[52px] flex-1 flex-col-reverse overflow-hidden rounded-[14px] bg-panel2" title=${`${x.c} confirmadas, ${x.p} aguardando, ${x.o} abertas`}>
            <div className="bg-lime" style=${{height:h(x.c)}}></div><div className="bg-amber" style=${{height:h(x.p)}}></div><div className="bg-danger" style=${{height:h(x.o)}}></div></div>
          <span className=${cx('text-[11px] font-bold uppercase',x.d===T?'text-teal':'text-faint')}>${F(x.d,{weekday:'short'}).replace('.','')}</span></div>`})}</div>
        <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-soft"><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-lime"></span>Confirmadas</span><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber"></span>Aguardando</span><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-danger"></span>Abertas</span></div><//>
      <${Card} title="Custo estimado dos plantões" sub="Horas da semana × valor-hora de referência da demonstração">
        <p className="thin text-[44px] leading-none">${BRL0(totalCost)}</p>
        <ul className="mt-5 space-y-2">${Object.entries(cost).map(([k,v])=>html`<li key=${k} className="flex items-center justify-between rounded-[18px] bg-panel2 px-4 py-2.5 text-sm"><span>${CAT[k]}<span className="block text-xs text-faint">${BRL(S.rates[k])}/h</span></span><b>${BRL0(v)}</b></li>`)}</ul><//></div>
    <div className="grid gap-5 lg:grid-cols-3">
      <${Card} title="Horas por profissional"><${BarList} rows=${Object.entries(hrs).map(([k,v])=>({k,v,warn:v>S.rules.week})).sort((a,b)=>b.v-a.v)} max=${Math.max(S.rules.week,...Object.values(hrs))} fmt=${fmtH} ref_=${S.rules.week} refLabel=${'Referência '+S.rules.week+'h'}/><//>
      <${Card} title="Aplicações por vacina"><${BarList} rows=${Object.entries(byVac).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v)} max=${Math.max(1,...Object.values(byVac))}/><//>
      <${Card} title="Receitas e despesas lançadas"><div className="space-y-4">${[['Receitas',rec,'bg-lime'],['Despesas',pay,'bg-navy']].map(([l,v,c])=>html`<div key=${l}><div className="mb-1 flex justify-between text-sm"><span>${l}</span><b>${BRL0(v)}</b></div><div className="h-4 rounded-full bg-panel2"><div className=${cx('h-full rounded-full',c)} style=${{width:v/Math.max(rec,pay)*100+'%'}}></div></div></div>`)}
        <p className="rounded-[18px] bg-panel2 px-4 py-3 text-sm">Saldo previsto: <b className=${rec-pay<0?'text-danger':'text-teal'}>${BRL0(rec-pay)}</b></p></div><//></div></div>`;
}

/* ------------------------------------------------------------------ sistema */
function Auditoria(){
  const {S}=useApp();const [ent,setEnt]=useState('');const rows=S.audit.filter(a=>!ent||a.entity===ent);
  return html`<div><${PageHead} title="Auditoria" desc="Registro permanente: quem fez, quando, o que mudou e o motivo informado." actions=${html`<select id="aud" aria-label="Tipo" className=${selCls+' h-10'} value=${ent} onChange=${e=>setEnt(e.target.value)}><option value="">Todos os registros</option>${Object.entries(ENT).map(([k,l])=>html`<option key=${k} value=${k}>${l}</option>`)}</select>`}/>
    <${Card} pad=${false} className="p-4"><${Table} minW=${760} cols=${['Quando','Quem','Ação','Área','Detalhes']} empty="Nenhum registro" rows=${rows.slice(0,200).map(a=>html`<tr key=${a.id} className="align-top">
      <${TD} className="whitespace-nowrap">${F(a.at,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}<//><${TD}><span className="flex items-center gap-2"><${Avatar} name=${a.actor} size=${26}/>${a.actor}</span><//><${TD} className="font-semibold">${ACT[a.action]||a.action}<//>
      <${TD}><${Badge}>${ENT[a.entity]||a.entity}<//><//><${TD} className="max-w-md text-soft">${a.reason&&html`<span className="block text-ink">Motivo: ${a.reason}</span>`}${a.detail}<//></tr>`)}/><//></div>`;
}
function Notificacoes(){
  const {S,u,run,go}=useApp();const list=S.notifs.filter(n=>n.user===u.id);const unread=list.filter(n=>!n.read).length;
  return html`<div><${PageHead} title="Notificações" desc="Avisos deste perfil." actions=${unread>0&&html`<${Btn} onClick=${()=>run((D,U)=>A.readAll(D,U),'Notificações marcadas como lidas.')}>Marcar todas como lidas<//>`}/>
    ${list.length===0?html`<${Empty} title="Nenhuma notificação">Avisos de escala, solicitações e alertas aparecem aqui.<//>`:html`<ul className="space-y-2">${list.map(n=>html`<li key=${n.id}><button className="flex w-full items-start gap-3 rounded-[24px] bg-panel p-4 text-left card-sh transition hover:ring-2 hover:ring-lime" onClick=${()=>{run((D,U)=>A.read(D,U,n.id));n.link&&go(n.link)}}>
      <span className=${cx('grid h-10 w-10 shrink-0 place-items-center rounded-full',n.read?'bg-panel2 text-faint':'bg-lime text-onlime')}><${Icon} n="bell" s=${16}/></span>
      <span className="min-w-0 flex-1"><span className=${cx('block',!n.read&&'font-bold')}>${n.title}</span>${n.body&&html`<span className="block text-sm text-soft">${n.body}</span>`}<span className="mt-0.5 block text-xs text-faint">${F(n.at,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span></span></button></li>`)}</ul>`}</div>`;
}
