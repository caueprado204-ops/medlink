/* ------------------------------------------------------------------ organização: editar, organizar e excluir */
const ORG_TABS=[['inst','Instituição','building'],['units','Unidades e setores','home'],['equip','Equipamentos','thermo'],['items','Itens de estoque','box'],['procCat','Procedimentos','clip'],['regras','Regras de escala','shield']];
function OrgRow({x,i,n,onUp,onDown,onEdit,onDel,children,tone,icon}){
  return html`<li className="group flex items-center gap-3 rounded-[18px] border border-line/70 bg-panel px-3 py-2.5 transition hover:shadow-md">
    <span className="flex flex-col"><button className="grid h-6 w-6 place-items-center rounded-md text-faint hover:bg-panel2 hover:text-ink disabled:opacity-30" disabled=${i===0} onClick=${onUp} aria-label=${'Subir '+x.name}><${Icon} n="up" s=${14}/></button>
      <button className="grid h-6 w-6 place-items-center rounded-md text-faint hover:bg-panel2 hover:text-ink disabled:opacity-30" disabled=${i===n-1} onClick=${onDown} aria-label=${'Descer '+x.name}><${Icon} n="down" s=${14}/></button></span>
    <span className=${cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-onp',PASTEL[tone||3])}><${Icon} n=${icon} s=${17}/></span>
    <span className="min-w-0 flex-1"><span className="block truncate font-bold">${x.name}</span><span className="block truncate text-[12.5px] text-soft">${children}</span></span>
    <${Btn} size="sm" v="ghost" icon="pencil" onClick=${onEdit}>Editar<//><button onClick=${onDel} className="grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-dangerbg hover:text-danger" aria-label=${'Excluir '+x.name}><${Icon} n="trash" s=${15}/></button></li>`;
}
function Archived({kind,list,label}){
  const {run}=useApp();const [open,setOpen]=useState(false);if(!list.length)return null;
  return html`<div className="mt-3"><button className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-soft hover:text-ink" onClick=${()=>setOpen(!open)}><${Icon} n="archive" s=${14}/>${list.length} ${label||'arquivado(s)'}<${Icon} n="down" s=${13} className=${open?'rotate-180':''}/></button>
    ${open&&html`<ul className="mt-2 space-y-1.5">${list.map(x=>html`<li key=${x.id} className="flex items-center gap-3 rounded-2xl bg-panel2 px-3 py-2 text-sm"><span className="flex-1 text-soft line-through">${x.name}</span><${Btn} size="sm" onClick=${()=>run((D,U)=>A.orgRestore(D,U,kind,x.id),'Restaurado.')}>Restaurar<//></li>`)}</ul>`}</div>`;
}
function OrgEditor({kind,init,onClose}){
  const {S,run}=useApp();const [f,setF]=useState(init);const set=k=>e=>setF({...f,[k]:e.target.value});
  const F_={units:[['name','Nome'],['addr','Endereço']],services:[['name','Nome do setor'],['unit','Unidade','unit']],equip:[['name','Nome do equipamento'],['unit','Unidade','unit'],['min','Temperatura mínima (°C)','num'],['max','Temperatura máxima (°C)','num']],
    items:[['name','Nome do item'],['cat','Categoria','cat'],['unit','Unidade de medida'],['min','Estoque mínimo','num']].concat(f.cat==='Vacina'?[['vac','Vacina no calendário','vac']]:[]),procCat:[['name','Nome do procedimento']]}[kind];
  return html`<${Modal} open onClose=${onClose} title=${(f.id?'Editar ':'Novo ')+ORGK[kind].toLowerCase()} footer=${html`<${Btn} onClick=${onClose}>Cancelar<//><${Btn} v="lime" onClick=${()=>{const r=run((D,U)=>A.orgSave(D,U,kind,f),'Salvo.');if(r.ok)onClose()}}>Salvar<//>`}>
    <div className="grid gap-4">${F_.map(([k,l,t])=>html`<${Field} key=${k} label=${l} id=${'og-'+k}>${t==='unit'?html`<select id=${'og-'+k} className=${inputCls} value=${f[k]} onChange=${set(k)}>${S.units.filter(x=>!x.archived).map(x=>html`<option key=${x.id} value=${x.id}>${x.name}</option>`)}</select>`
      :t==='cat'?html`<select id=${'og-'+k} className=${inputCls} value=${f[k]} onChange=${set(k)}>${['Vacina','Insumo','EPI','Medicamento'].map(x=>html`<option key=${x}>${x}</option>`)}</select>`
      :t==='vac'?html`<select id=${'og-'+k} className=${inputCls} value=${f[k]||''} onChange=${set(k)}><option value="">Selecione</option>${Object.entries(VAC).map(([vk,v])=>html`<option key=${vk} value=${vk}>${v.full}</option>`)}</select>`
      :html`<input id=${'og-'+k} type=${t==='num'?'number':'text'} step=${t==='num'?'0.1':undefined} className=${inputCls} value=${f[k]} onInput=${set(k)}/>`}<//>`)}</div><//>`;
}
function OrgList({kind,items,icon,tone,detail,filter,newInit,title,sub}){
  const {S,run}=useApp();const [ed,setEd]=useState(null);const [del,setDel]=useState(null);
  const act=items.filter(x=>!x.archived),arch=items.filter(x=>x.archived);
  const uses=del?orgUses(S,kind,del.id):[];
  return html`<${Card} title=${title} sub=${sub} icon=${icon} tone=${tone} action=${html`<${Btn} v="lime" size="sm" icon="plus" onClick=${()=>setEd(newInit)}>Adicionar<//>`}>
    ${act.length===0?html`<${Empty} title="Nada cadastrado"/>`:html`<ul className="space-y-2">${act.map((x,i)=>html`<${OrgRow} key=${x.id} x=${x} i=${i} n=${act.length} icon=${icon} tone=${tone}
      onUp=${()=>run((D,U)=>A.orgMove(D,U,kind,x.id,-1))} onDown=${()=>run((D,U)=>A.orgMove(D,U,kind,x.id,1))} onEdit=${()=>setEd({...x})} onDel=${()=>setDel(x)}>${detail(x)}<//>`)}</ul>`}
    <${Archived} kind=${kind} list=${arch}/>
    ${ed&&html`<${OrgEditor} kind=${kind} init=${ed} onClose=${()=>setEd(null)}/>`}
    <${Confirm} open=${!!del} title=${del?'Excluir '+del.name:''} okLabel=${uses.length?'Arquivar':'Excluir'} desc=${uses.length?`Este cadastro tem histórico (${uses.join(', ')}). Para não perder a rastreabilidade, ele será arquivado: some das listas e pode ser restaurado.`:'Sem histórico ligado a este cadastro. Ele será excluído de vez. A exclusão fica na auditoria.'}
      onClose=${()=>setDel(null)} onOk=${()=>{const r=run((D,U)=>A.orgDelete(D,U,kind,del.id),x=>x==='archived'?'Arquivado. Pode ser restaurado quando quiser.':'Excluído.');if(r.ok||r.kind)setDel(null)}}/><//>`;
}
function Organizacao(){
  const {S,u,run,page}=useApp();const canOrg=can(S,u,'org.manage'),canInst=can(S,u,'institution.manage');
  const tabs=ORG_TABS.filter(([k])=>k==='inst'||k==='regras'?canInst:canOrg);
  const [tab,setTab]=useState(page.page==='configuracoes'?'regras':tabs[0][0]);
  const [inst,setInst]=useState({...S.inst});const [r,setR]=useState(S.rules);
  const unitsAct=S.units.filter(x=>!x.archived);
  return html`<div className="space-y-5"><${PageHead} title="Organização" desc="Edite, organize e exclua o que compõe a instituição. Cadastros com histórico são arquivados em vez de apagados, para manter a rastreabilidade."/>
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">${tabs.map(([k,l,ic],i)=>html`<button key=${k} onClick=${()=>setTab(k)} className=${cx('flex shrink-0 items-center gap-2.5 rounded-[18px] px-4 py-2.5 text-sm font-bold transition',tab===k?'bg-navy text-onnavy':'card-sh bg-panel hover:-translate-y-0.5')}>
      <span className=${cx('grid h-8 w-8 place-items-center rounded-lg text-onp',PASTEL[i%6+1])}><${Icon} n=${ic} s=${15}/></span>${l}</button>`)}</div>
    ${tab==='inst'&&html`<${Card} title="Dados da instituição" icon="building" tone=${1}><div className="grid gap-4 sm:grid-cols-2">${[['name','Nome'],['type','Tipo de serviço'],['city','Cidade/UF'],['cnpj','CNPJ'],['phone','Telefone'],['email','E-mail']].map(([k,l])=>html`<${Field} key=${k} label=${l} id=${'in-'+k}><input id=${'in-'+k} className=${inputCls} value=${inst[k]||''} onInput=${e=>setInst({...inst,[k]:e.target.value})}/><//>`)}</div>
      <div className="mt-4 flex justify-end"><${Btn} v="lime" onClick=${()=>run((D,U)=>A.inst(D,U,inst),'Dados da instituição salvos.')}>Salvar<//></div><//>`}
    ${tab==='units'&&html`<div className="grid gap-5 xl:grid-cols-2"><${OrgList} kind="units" title="Unidades" sub="A ordem aqui é a ordem dos filtros e listas." items=${S.units} icon="home" tone=${3} newInit=${{name:'',addr:''}}
        detail=${x=>`${x.addr||'Sem endereço'} · ${S.services.filter(s=>s.unit===x.id&&!s.archived).length} setores`}/>
      <div className="space-y-5">${unitsAct.map((un,i)=>html`<${OrgList} key=${un.id} kind="services" title=${'Setores: '+un.name} items=${S.services.filter(s=>s.unit===un.id)} icon="dash" tone=${i%2?2:4} newInit=${{name:'',unit:un.id}}
        detail=${x=>`${S.shifts.filter(s=>s.service===x.id&&s.status!=='cancelado').length} plantões`}/>`)}</div></div>`}
    ${tab==='equip'&&html`<${OrgList} kind="equip" title="Equipamentos da rede de frio" sub="Faixa de temperatura usada para abrir ocorrências." items=${S.equip} icon="thermo" tone=${3} newInit=${{name:'',unit:unitsAct[0].id,min:2,max:8}}
      detail=${x=>`${unitOf(S,x.unit).name} · faixa ${x.min} a ${x.max} °C`}/>`}
    ${tab==='items'&&html`<${OrgList} kind="items" title="Itens de estoque" sub="Vacinas ficam ligadas ao calendário para sugerir via e local." items=${S.items} icon="box" tone=${5} newInit=${{name:'',cat:'Insumo',unit:'unidade',min:10,vac:''}}
      detail=${x=>`${x.cat}${x.vac?' · '+VAC[x.vac].n:''} · ${itemQty(S,x.id)} ${x.unit} · mínimo ${x.min}`}/>`}
    ${tab==='procCat'&&html`<${OrgList} kind="procCat" title="Catálogo de procedimentos" sub="Opções que o profissional escolhe ao registrar." items=${S.procCat} icon="clip" tone=${1} newInit=${{name:''}}
      detail=${x=>`${S.procs.filter(p=>p.type===x.name).length} registros`}/>`}
    ${tab==='regras'&&html`<div className="space-y-4"><div className="grid gap-4 md:grid-cols-3">${[['rest','Descanso mínimo entre plantões','h','Abaixo disso, gera alerta e exige justificativa.',0,48,4],['week','Carga semanal de referência','h','O profissional pode informar um limite menor.',1,168,3],['maxShift','Duração máxima de um plantão','h','Restrição obrigatória.',1,36,6]].map(([k,l,un,h,mi,ma,tn])=>html`<div key=${k} className="card-sh rounded-[22px] bg-panel p-5">
        <span className=${cx('grid h-10 w-10 place-items-center rounded-xl text-onp',PASTEL[tn])}><${Icon} n="clock" s=${17}/></span>
        <label htmlFor=${'r-'+k} className="mt-3 block text-[13px] font-semibold text-soft">${l}</label><div className="mt-1 flex items-end gap-2"><input id=${'r-'+k} type="number" min=${mi} max=${ma} className="w-28 bg-transparent text-[44px] font-semibold leading-none tracking-tight focus:outline-none" value=${r[k]} onInput=${e=>setR({...r,[k]:e.target.value})}/><span className="pb-1.5 text-xl text-faint">${un}</span></div>
        <p className="mt-2 text-xs text-faint">${h}</p></div>`)}</div>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-faint">Confirme as regras de jornada dos seus contratos e convenções.</p><${Btn} v="lime" onClick=${()=>run((D,U)=>A.rules(D,U,r),'Regras salvas.')}>Salvar regras<//></div></div>`}
  </div>`;
}
