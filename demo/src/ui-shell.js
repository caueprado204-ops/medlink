/* ------------------------------------------------------------------ app */
const NAV=[
  {label:'Principal',items:[['inicio','Visão geral','dash',u=>u.role!=='prof'],['meu','Minha área','user',u=>!!u.prof],['notificacoes','Notificações','bell',null]]},
  {label:'Escalas',items:[['escalas','Calendário','cal','shifts.view'],['solicitacoes','Solicitações','inbox','requests.decide'],['gerar','Gerar escala','wand','shifts.manage']]},
  {label:'Clínico',items:[['vacinacao','Vacinação','syringe','vaccines.view'],['calendario','Calendário vacinal','calcheck','vaccines.view'],['prontuario','Prontuário','file','records.view'],['procedimentos','Procedimentos','clip','procedures.verify']]},
  {label:'Serviços',items:[['feridas','Feridas e estomias','activity',['wounds.view']],['estetica','Enfermagem estética','heart','aesthetic.view'],['ilpi','Longa permanência','home','ltc.view']]},
  {label:'Pessoas',items:[['profissionais','Profissionais','users','professionals.view'],['talentos','Banco de talentos','star','talent.manage'],['equipe','Equipe e acessos','shield','members.manage']]},
  {label:'Operação',items:[['estoque','Estoque','box','stock.view'],['temperatura','Temperatura','thermo','coldchain.view'],['homecare','Home care','home','homecare.view']]},
  {label:'Financeiro',items:[['pagar','Contas a pagar','wallet','finance.view'],['receber','Contas a receber','coins','finance.view'],['relatorios','Relatórios','chart','reports.view']]},
  {label:'Sistema',items:[['organizacao','Organização','building',['org.manage','institution.manage']],['auditoria','Auditoria','hist','audit.view'],['manual','Manual de uso','book',null]]}];
const allowed=(S,u,p)=>p==null?true:typeof p==='function'?p(u):Array.isArray(p)?p.some(x=>can(S,u,x)):can(S,u,p);
const isManager=(S,u)=>u.role!=='prof';
function navFor(S,u){return NAV.map(g=>({...g,items:g.items.filter(i=>allowed(S,u,i[3]))})).filter(g=>g.items.length)}
const PAGE_ALIAS={prof:'profissionais',paciente:'prontuario',configuracoes:'organizacao'};
const navItem=page=>{const k=PAGE_ALIAS[page]||page;for(const g of NAV){const i=g.items.find(x=>x[0]===k);if(i)return{g,i}}return null};
/* compatibilidade com a apresentação: lista plana de grupos com itens */
const GROUPS=NAV.map(g=>({id:g.label,label:g.label,items:g.items}));

function App(){
  const [S,setS]=useState(()=>load()||seed());
  const [uidv,setUid]=useState(()=>{const v=lsGet(UKEY);return ['ana','marcos','helena','carla','paulo'].includes(v)?v:null});
  const [route,setRoute]=useState(()=>uidv?'app':'landing');
  const [page,setPage]=useState({page:'inicio'});
  const [picker,setPicker]=useState(false);
  const [theme,setThemeS]=useState(()=>lsGet(TKEY)||'system');
  const [toasts,setToasts]=useState([]);
  const u=S.users.find(x=>x.id===uidv)||null;
  useEffect(()=>save(S),[S]);
  useEffect(()=>{if(u&&page.page==='inicio'&&!isManager(S,u))setPage({page:'meu'})},[uidv]);
  const setTheme=t=>{setThemeS(t);lsSet(TKEY,t);if(t==='system')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',t)};
  const toast=(msg,tone='ok')=>{const id=uid();setToasts(t=>[...t,{id,msg,tone}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),tone==='error'?6000:3400)};
  const run=(fn,msg)=>{try{const D=structuredClone(S);const r=fn(D,u);setS(D);if(msg)toast(typeof msg==='function'?msg(r):msg);return{ok:true,data:r}}
    catch(e){if(e instanceof Stop){if(!e.checks)toast(e.msg,'error');return{ok:false,kind:e.kind,msg:e.msg,checks:e.checks}}console.error(e);toast('Algo deu errado nesta ação.','error');return{ok:false}}};
  const go=p=>{setPage(p);window.scrollTo({top:0,behavior:'smooth'})};
  const login=id=>{lsSet(UKEY,id);setUid(id);const usr=S.users.find(x=>x.id===id);setPage({page:usr.role==='prof'?'meu':'inicio'});setRoute('app');setPicker(false);window.scrollTo(0,0)};
  const logout=()=>{lsSet(UKEY,null);setUid(null);setRoute('landing');window.scrollTo(0,0)};
  const reset=()=>{setS(seed());toast('Demonstração reiniciada com os dados originais.')};
  const value={S,u,run,toast,go,page,login,logout,reset,theme,setTheme,openPicker:()=>setPicker(true),setRoute};
  return html`<${Ctx.Provider} value=${value}>
    ${route==='app'&&u?html`<${Shell}/>`:route==='manual'?html`<${PublicManual}/>`:html`<${Landing}/>`}
    <${ProfilePicker} open=${picker} onClose=${()=>setPicker(false)}/>
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2">
      ${toasts.map(t=>html`<div key=${t.id} role=${t.tone==='error'?'alert':'status'} className="anim pointer-events-auto flex items-start gap-3 rounded-[20px] bg-navy px-4 py-3 text-sm text-onnavy shadow-2xl">
        <span className=${cx('grid h-6 w-6 shrink-0 place-items-center rounded-full',t.tone==='error'?'bg-danger text-white':'bg-lime text-onlime')}><${Icon} n=${t.tone==='error'?'x':'check'} s=${14}/></span><span className="pt-0.5">${t.msg}</span></div>`)}
    </div><//>`;
}

/* ------------------------------------------------------------------ apresentação */
const Squiggle=({className,d})=>html`<svg viewBox="0 0 200 140" className=${className} fill="none" aria-hidden="true"><path className="draw" d=${d} stroke="rgb(var(--c-lime))" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/></svg>`;
const SQ1='M20 110 C 60 20, 120 140, 150 60 S 120 10, 100 40 M150 60 l 26 -8 M150 60 l 4 26';
const SQ2='M10 30 C 60 90, 110 -10, 150 60 C 170 95, 140 120, 120 100 M150 60 l 24 -2 M150 60 l -8 24';
const Arrow=({className})=>html`<svg viewBox="0 0 120 60" className=${className} fill="none" aria-hidden="true"><path d="M8 40 C 30 6, 60 56, 84 22 M84 22 l 18 4 M84 22 l -2 18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg>`;
const MODULES=[
  ['cal','Calendário de escalas','Dia, semana, mês e lista, com arrastar e soltar.'],['wand','Gerar escala','Proposta automática que respeita descanso, férias e categoria.'],
  ['inbox','Solicitações','Substituições e candidaturas com aprovação e substituto validado.'],['user','Área do profissional','Confirmar presença, pedir troca e informar disponibilidade.'],
  ['users','Profissionais','Cadastro, conselho, competências e validação.'],['star','Banco de talentos','Convide profissionais e acompanhe a seleção.'],
  ['syringe','Vacinação','Registro com paciente, vacina, dose, lote, via e local de aplicação.'],['calcheck','Calendário vacinal','Calendário Nacional 2026 por idade, com conferência da caderneta.'],
  ['file','Prontuário eletrônico','Evoluções assinadas, caderneta, procedimentos e acessos registrados.'],['clip','Procedimentos','Registro pelo profissional e conferência pela responsável técnica.'],['box','Estoque','Lotes, validades, entradas, saídas, perdas e alertas.'],
  ['thermo','Temperatura','Leituras da rede de frio e ocorrências com avaliação técnica.'],['activity','Feridas e estomaterapia','Lesões com medidas, tecidos e gráfico de evolução; estomias e orientações.'],
  ['heart','Enfermagem estética','Agenda, anamnese, termo de consentimento, sessões e pacotes.'],['users','Longa permanência','Leitos, medicação aprazada, cuidados por turno e passagem de plantão.'],['home','Home care','Agenda domiciliar por profissional, paciente e região.'],
  ['wallet','Financeiro','Contas a pagar e a receber com vencidos e baixas.'],['chart','Relatórios','Cobertura, horas, custos e aplicações em gráficos.'],
  ['hist','Auditoria','Quem fez o quê, quando e por qual motivo.'],['building','Organização','Edite, organize e exclua unidades, setores e catálogos.'],['shield','Perfis e permissões','Acesso por função e por unidade.'],['bell','Notificações','Avisos de vaga descoberta, trocas e alertas.']];

function LandingNav({dark}){
  const {openPicker,setRoute}=useApp();
  return html`<header className="relative z-20 mx-auto flex max-w-[1240px] flex-wrap items-center gap-3 px-4 py-5 sm:px-8">
    <button onClick=${()=>{setRoute('landing');window.scrollTo(0,0)}} aria-label="Início"><${Logo} onDark=${dark}/></button>
    <nav className="order-3 flex w-full justify-center gap-2 sm:order-none sm:ml-auto sm:mr-auto sm:w-auto">
      ${[['Módulos','#modulos'],['Como funciona','#como'],['Perfis','#perfis']].map(([l,h])=>html`<a key=${l} href=${h} onClick=${()=>setRoute('landing')} className=${cx('rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition',dark?'border-white/50 text-white hover:bg-white hover:text-[#1c3ee4]':'border-line hover:bg-panel2')}>${l}</a>`)}
      <button onClick=${()=>{setRoute('manual');window.scrollTo(0,0)}} className=${cx('rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition',dark?'border-white/50 text-white hover:bg-white hover:text-[#1c3ee4]':'border-line hover:bg-panel2')}>Manual</button></nav>
    <div className="ml-auto flex items-center gap-2 sm:ml-0"><${ThemeToggle} className=${dark?'bg-white/15':'bg-panel2'}/>
      <button onClick=${openPicker} className=${cx('h-10 rounded-full border-2 px-5 text-sm font-bold transition',dark?'border-white text-white hover:bg-white hover:text-[#1c3ee4]':'border-navy hover:bg-navy hover:text-onnavy')}>Entrar na demo</button></div></header>`;
}
function Landing(){
  const {S,openPicker,login}=useApp();
  return html`<div className="min-h-screen bg-panel">
    <section className="relative overflow-hidden rounded-b-[40px] bg-cobalt text-white">
      <div className="grid-bg absolute inset-0"></div>
      <${LandingNav} dark/>
      <div className="relative z-10 mx-auto max-w-[1240px] px-4 pb-24 pt-6 sm:px-8 sm:pb-32">
        <h1 className="display relative text-center text-[17vw] sm:text-[12vw] xl:text-[150px]">
          <span className="block"><span className="text-lime">#</span>ESCALA</span><span className="block">SEM FURO</span><span className="block">NA SAÚDE</span></h1>
        <${Squiggle} d=${SQ1} className="pointer-events-none absolute left-[2%] top-[4%] w-[22%] max-w-[220px] -rotate-12"/>
        <${Squiggle} d=${SQ2} className="pointer-events-none absolute right-[4%] top-[34%] w-[20%] max-w-[200px]"/>
        <div className="floaty glass absolute left-[6%] top-[52%] hidden w-[210px] rounded-[26px] p-4 sm:block" style=${{'--r':'-6deg'}}>
          <div className="flex items-center gap-3"><${Avatar} name="Carla Mendes" size=${44}/><div><p className="font-bold leading-tight">Carla Mendes</p><p className="text-xs text-white/80">Técnica de enfermagem</p></div></div>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-xs font-bold text-onlime"><${Icon} n="check" s=${12}/>Presença confirmada</p></div>
        <div className="floaty glass absolute right-[9%] top-[6%] hidden w-[200px] rounded-[26px] p-4 md:block" style=${{'--r':'7deg',animationDelay:'1.2s'}}>
          <p className="text-xs text-white/80">Vaga de sexta, 07:00</p><p className="display-n mt-1 text-2xl">COBERTA</p><p className="mt-1 text-xs text-white/80">substituta validada pelas regras</p></div>
        <p className="mx-auto mt-8 max-w-xl text-center text-[17px] text-white/90">Escalas, vacinação, prontuário, feridas, estética, longa permanência, home care, estoque e financeiro em um só painel, para clínicas, serviços de enfermagem, ILPIs e empresas de home care.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick=${openPicker} className="h-12 rounded-full bg-lime px-7 font-bold text-onlime transition hover:brightness-95">Experimentar a demonstração</button>
          <a href="#modulos" className="grid h-12 place-items-center rounded-full border-2 border-white px-7 font-bold transition hover:bg-white hover:text-[#1c3ee4]">Ver módulos</a></div>
        <button onClick=${openPicker} aria-label="Entrar na demonstração" className="absolute bottom-6 right-4 grid h-32 w-32 place-items-center rounded-full bg-lime text-onlime transition hover:scale-105 sm:right-10 sm:h-36 sm:w-36">
          <svg viewBox="0 0 100 100" className="spin absolute inset-0 h-full w-full" aria-hidden="true"><defs><path id="circ" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0"/></defs><text fontSize="10.5" fontWeight="800" letterSpacing="2.2" fill="currentColor" style=${{fontFamily:'var(--font-display)'}}><textPath href="#circ">ENTRAR NA DEMO • ENTRAR NA DEMO • </textPath></text></svg>
          <${Arrow} className="h-10 w-12"/></button>
      </div></section>

    <section id="como" className="mx-auto max-w-[1240px] px-4 py-16 sm:px-8">
      <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        ${[['MONTE A ESCALA','arraste, duplique e repita plantões',html`<div className="mt-auto flex items-center gap-2 rounded-[20px] bg-cobalt p-3 text-white"><${Avatar} name="Paulo Santos" size=${34}/><span className="text-sm font-bold">13:00–19:00</span><span className="ml-auto rounded-full bg-lime px-2.5 py-1 text-xs font-bold text-onlime">Publicado</span></div>`],
           ['VALIDE AS REGRAS','descanso, férias, categoria e carga semanal',html`<div className="mt-auto space-y-2"><p className="flex items-center gap-2 rounded-full bg-dangerbg px-3 py-1.5 text-xs font-bold text-danger"><${Icon} n="ban" s=${12}/>Sobrepõe outro plantão</p><p className="flex items-center gap-2 rounded-full bg-amberbg px-3 py-1.5 text-xs font-bold text-amber"><${Icon} n="alert" s=${12}/>Descanso menor que 11h</p></div>`],
           ['ACOMPANHE TUDO','confirmações, trocas, estoque e auditoria',html`<div className="mt-auto rounded-[22px] bg-lime px-4 py-3 text-onlime"><p className="text-xs font-bold">Cobertura da semana</p><p className="thin text-[34px] leading-none">94%</p><p className="text-[11px]">exemplo da demonstração</p></div>`]]
          .map(([t,s,ui],i)=>html`<${Fragment} key=${t}>
            <div className="flex min-h-[260px] flex-col rounded-[30px] bg-panel2 p-6 text-center"><h3 className="display text-[30px]">${t}</h3><p className="mt-2 text-sm text-soft">${s}</p><div className="mt-6 flex flex-1 flex-col">${ui}</div></div>
            ${i<2&&html`<${Arrow} className="mx-auto hidden h-10 w-14 self-center text-ink md:block"/>`}<//>`)}
      </div></section>

    <section id="modulos" className="mx-auto max-w-[1240px] px-4 pb-16 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><h2 className="display text-[44px] sm:text-[64px]">${MODULES.length} MÓDULOS,<br/><span className="text-cobalt">UM PAINEL</span></h2>
        <p className="max-w-md text-soft">Cada função tem sua própria tela. Você ativa os módulos que a instituição usa e cada perfil vê só o que precisa.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">${MODULES.map(([ic,t,d],i)=>html`<button key=${t} onClick=${openPicker} className=${cx('group flex flex-col rounded-[26px] p-5 text-left transition hover:-translate-y-1',i===1?'bg-lime text-onlime':'bg-panel2 hover:bg-navy hover:text-onnavy')}>
        <span className=${cx('grid h-11 w-11 place-items-center rounded-full',i===1?'bg-onlime text-lime':'bg-panel text-ink group-hover:bg-lime group-hover:text-onlime')}><${Icon} n=${ic} s=${20}/></span>
        <span className="mt-5 text-[16px] font-bold">${t}</span><span className=${cx('mt-1 text-[13px]',i===1?'opacity-80':'text-soft group-hover:opacity-80 group-hover:text-current')}>${d}</span></button>`)}</div></section>

    <section id="perfis" className="mx-auto max-w-[1240px] px-4 pb-20 sm:px-8">
      <div className="rounded-[36px] bg-navy p-6 text-onnavy sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4"><h2 className="display text-[40px] sm:text-[56px]">ENTRE COMO<br/><span className="text-lime">QUISER</span></h2>
          <p className="max-w-sm opacity-75">Cinco perfis prontos. O que você faz em um aparece nos outros, como na rotina real de uma clínica.</p></div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">${PROFILES.map(p=>{const usr=S.users.find(x=>x.id===p.id);return html`<button key=${p.id} onClick=${()=>login(p.id)} className="group flex flex-col rounded-[26px] bg-onnavy/10 p-5 text-left ring-1 ring-onnavy/15 transition hover:bg-lime hover:text-onlime">
          <${Avatar} name=${usr.name} size=${48}/><span className="mt-4 font-bold">${usr.name}</span><span className="text-[13px] opacity-75">${ROLE[usr.role]}</span><span className="mt-3 text-[13px] opacity-80">${p.what}</span>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold">Entrar <${Icon} n="ur" s=${14}/></span></button>`})}</div></div></section>

    <footer className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-8 text-sm text-soft sm:px-8"><${Logo}/><span>Demonstração com dados fictícios de ${S.inst.name}. Nada aqui é dado real de paciente.</span></footer>
  </div>`;
}
const PROFILES=[
  {id:'ana',what:'Vê todos os módulos, aprova, configura regras e permissões.'},
  {id:'marcos',what:'Monta e gera escalas da Unidade Taquaral e cuida do estoque.'},
  {id:'helena',what:'Valida cadastros, confere procedimentos, registra vacinas e trata a rede de frio.'},
  {id:'carla',what:'Confirma plantões, registra ponto, vacinas e procedimentos, e consulta o prontuário.'},
  {id:'paulo',what:'Enfermeiro: escala, home care, feridas, estomias e longa permanência.'}];
function ProfilePicker({open,onClose}){
  const {S,login,reset}=useApp();const [confirm,setConfirm]=useState(false);
  return html`<${Modal} open=${open} onClose=${onClose} title="Escolha um perfil" desc="Demonstração com dados fictícios. As alterações ficam salvas só neste navegador.">
    <ul className="space-y-2">${PROFILES.map(p=>{const usr=S.users.find(x=>x.id===p.id);return html`<li key=${p.id}><button onClick=${()=>login(p.id)} className="group flex w-full items-center gap-3 rounded-[22px] bg-panel2 px-4 py-3 text-left transition hover:bg-lime hover:text-onlime">
      <${Avatar} name=${usr.name} size=${44}/><span className="min-w-0 flex-1"><span className="block font-bold">${usr.name}</span><span className="block text-[13px] opacity-75">${ROLE[usr.role]}${usr.units?', Unidade Taquaral':''}</span><span className="mt-0.5 block text-[13px] opacity-75">${p.what}</span></span><${Icon} n="ur" s=${18}/></button></li>`})}</ul>
    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-soft">${confirm?html`<span>Apagar o que foi feito e voltar aos dados originais?</span><${Btn} size="sm" v="danger" onClick=${()=>{reset();setConfirm(false)}}>Reiniciar<//><${Btn} size="sm" onClick=${()=>setConfirm(false)}>Manter<//>`
      :html`<button className="font-semibold text-teal underline-offset-2 hover:underline" onClick=${()=>setConfirm(true)}>Reiniciar demonstração</button>`}</div><//>`;
}

/* ------------------------------------------------------------------ estrutura do app */
function Sidebar({open,onClose}){
  const {S,u,page,go,logout}=useApp();const nav=navFor(S,u);const cur=navItem(page.page);
  const unread=S.notifs.filter(n=>n.user===u.id&&!n.read).length;
  const pend=S.reqs.filter(r=>r.status==='pendente'&&can(S,u,'requests.decide',shiftOf(S,r.shift).unit)).length;
  const toCheck=S.procs.filter(x=>x.status==='realizado'||x.status==='nao_realizado').length;
  const mine=u.prof?S.procs.filter(x=>x.prof===u.prof&&(x.status==='agendado'||x.status==='devolvido')).length+S.asg.filter(a=>a.prof===u.prof&&a.status==='aguardando_confirmacao'&&shiftOf(S,a.shift).status!=='rascunho').length:0;
  const counts={notificacoes:unread,solicitacoes:pend,procedimentos:can(S,u,'procedures.verify')?toCheck:0,meu:mine};
  return html`<${Fragment}>
    ${open&&html`<button aria-label="Fechar menu" onClick=${onClose} className="fixed inset-0 z-40 bg-black/40 lg:hidden"></button>`}
    <aside className=${cx('side-glass fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-line/70 transition-transform lg:translate-x-0',open?'translate-x-0':'-translate-x-full')} aria-label="Menu principal">
      <div className="flex items-center justify-between px-5 pb-3 pt-5"><button onClick=${()=>go({page:nav[0].items[0][0]})} aria-label="Início"><${Logo}/></button>
        <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-panel2 lg:hidden" onClick=${onClose} aria-label="Fechar menu"><${Icon} n="x"/></button></div>
      <div className="mx-4 mb-2 flex items-center gap-3 rounded-2xl bg-panel2 px-3 py-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy text-onnavy"><${Icon} n="building" s=${17}/></span>
        <span className="min-w-0"><span className="block truncate text-[13px] font-bold">${S.inst.name}</span><span className="block truncate text-[11px] text-faint">${u.units?unitOf(S,u.units[0]).name:(n=>n+(n===1?' unidade':' unidades'))(S.units.filter(x=>!x.archived).length)}</span></span></div>
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4" aria-label="Módulos">
        ${nav.map(g=>html`<div key=${g.label} className="mt-4"><p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[.09em] text-faint">${g.label}</p>
          <ul className="space-y-0.5">${g.items.map(([k,l,ic])=>{const on=cur&&cur.i[0]===k;return html`<li key=${k}><button onClick=${()=>{go({page:k});onClose()}} aria-current=${on?'page':undefined}
            className=${cx('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[14px] font-semibold transition',on?'bg-lime text-onlime shadow-sm':'text-soft hover:bg-panel2 hover:text-ink')}>
            <${Icon} n=${ic} s=${17}/><span className="min-w-0 flex-1 truncate">${l}</span>${counts[k]>0&&html`<span className=${cx('min-w-[1.3rem] rounded-full px-1.5 text-center text-[11px] font-bold leading-5',on?'bg-onlime text-lime':'bg-p6 text-onp')}>${counts[k]}</span>`}</button></li>`})}</ul></div>`)}</nav>
      <div className="border-t border-line/70 p-3"><div className="flex items-center gap-3 rounded-2xl bg-panel2 p-2.5"><${Avatar} name=${u.name} size=${38}/>
        <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold">${u.name}</span><span className="block truncate text-[11px] text-faint">${ROLE[u.role]}</span></span>
        <button onClick=${logout} className="grid h-9 w-9 place-items-center rounded-full text-soft hover:bg-panel hover:text-ink" aria-label="Trocar perfil" title="Trocar perfil"><${Icon} n="out" s=${17}/></button></div></div>
    </aside><//>`;
}
function GlobalSearch(){
  const {S,u,go}=useApp();const [q,setQ]=useState('');const [open,setOpen]=useState(false);const ref=useRef(null);
  useEffect(()=>{const f=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();ref.current&&ref.current.focus()}};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f)},[]);
  const t=q.trim().toLowerCase();const res=[];
  if(t){navFor(S,u).forEach(g=>g.items.forEach(([k,l,ic])=>{if((l+' '+g.label).toLowerCase().includes(t))res.push({k:'pg'+k,ic,t:l,s:g.label,to:{page:k}})}));
    if(can(S,u,'records.view'))S.patients.filter(p=>p.name.toLowerCase().includes(t)).slice(0,5).forEach(p=>res.push({k:p.id,ic:'file',t:p.name,s:'Paciente, '+ageLabel(p.birth),to:{page:'paciente',id:p.id}}));
    if(can(S,u,'professionals.view'))S.profs.filter(p=>p.name.toLowerCase().includes(t)).slice(0,4).forEach(p=>res.push({k:p.id,ic:'user',t:p.name,s:CAT[p.cat],to:{page:'prof',id:p.id}}));
    if(can(S,u,'vaccines.view'))Object.entries(VAC).filter(([,v])=>v.full.toLowerCase().includes(t)).slice(0,3).forEach(([k,v])=>res.push({k:'v'+k,ic:'calcheck',t:v.full,s:'Calendário vacinal',to:{page:'calendario',vac:k}}));}
  const pick=r=>{go(r.to);setQ('');setOpen(false)};
  return html`<div className="relative min-w-0 flex-1 sm:max-w-md"><label className="card-sh flex h-11 items-center gap-2 rounded-full bg-panel px-4"><${Icon} n="search" s=${17} className="text-faint"/>
    <input ref=${ref} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint" placeholder="Buscar paciente, profissional, vacina…" aria-label="Busca geral" value=${q}
      onInput=${e=>{setQ(e.target.value);setOpen(true)}} onFocus=${()=>setOpen(true)} onBlur=${()=>setTimeout(()=>setOpen(false),150)} onKeyDown=${e=>{if(e.key==='Enter'&&res[0])pick(res[0]);if(e.key==='Escape'){setQ('');e.target.blur()}}}/>
    <kbd className="hidden rounded-md bg-panel2 px-1.5 py-0.5 text-[11px] font-semibold text-faint md:inline">Ctrl K</kbd></label>
    ${open&&t&&html`<div className="anim absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-[20px] border border-line bg-panel p-1.5 shadow-2xl">${res.length?res.slice(0,9).map(r=>html`<button key=${r.k} onMouseDown=${e=>e.preventDefault()} onClick=${()=>pick(r)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-panel2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-panel2"><${Icon} n=${r.ic} s=${15}/></span><span className="min-w-0"><span className="block truncate text-sm font-semibold">${r.t}</span><span className="block truncate text-[12px] text-faint">${r.s}</span></span></button>`)
      :html`<p className="px-3 py-3 text-sm text-soft">Nada encontrado para “${q}”.</p>`}</div>`}</div>`;
}
function Shell(){
  const {S,u,page,go}=useApp();const [side,setSide]=useState(false);
  const unread=S.notifs.filter(n=>n.user===u.id&&!n.read).length;const cur=navItem(page.page);
  const quick=[can(S,u,'vaccines.apply')&&['Registrar vacina','syringe',{page:'vacinacao'}],can(S,u,'shifts.manage')&&['Novo plantão','cal',{page:'escalas',nw:Date.now()}],
    u.prof&&can(S,u,'procedures.register')&&['Registrar procedimento','clip',{page:'meu',tab:'procs',nw:Date.now()}],can(S,u,'records.write')&&['Novo paciente','file',{page:'prontuario',nw:Date.now()}]].filter(Boolean);
  const [qm,setQm]=useState(false);
  return html`<div className="app-bg min-h-screen lg:pl-[264px]">
    <${Sidebar} open=${side} onClose=${()=>setSide(false)}/>
    <header className="sticky top-0 z-30 border-b border-line/50 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <${IconBtn} n="menu" label="Abrir menu" onClick=${()=>setSide(true)} className="bg-panel lg:hidden"/>
        <div className="hidden min-w-0 xl:block xl:w-56"><p className="truncate text-[12px] text-faint">${cur?cur.g.label:'MedLink'}</p><p className="truncate text-[15px] font-bold">${cur?cur.i[1]:''}</p></div>
        <${GlobalSearch}/>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          ${quick.length>0&&html`<div className="relative"><${Btn} v="lime" icon="plus" onClick=${()=>setQm(m=>!m)} className="max-sm:w-10 max-sm:px-0" aria-expanded=${qm}><span className="hidden sm:inline">Novo</span><//>
            ${qm&&html`<div className="anim absolute right-0 z-50 mt-2 w-60 rounded-[20px] border border-line bg-panel p-1.5 shadow-2xl">${quick.map(([l,ic,to])=>html`<button key=${l} onClick=${()=>{setQm(false);go(to)}} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-panel2"><${Icon} n=${ic} s=${16}/>${l}</button>`)}</div>`}</div>`}
          <${ThemeToggle} className="hidden bg-panel card-sh sm:inline-flex"/>
          <${IconBtn} n="bell" label="Notificações" badge=${unread} onClick=${()=>go({page:'notificacoes'})} className="bg-panel"/>
          <button onClick=${()=>go({page:u.prof?'meu':'inicio'})} className="hidden rounded-full ring-2 ring-transparent transition hover:ring-lime sm:block" aria-label="Meu painel"><${Avatar} name=${u.name} size=${40}/></button>
        </div></div></header>
    <main className="mx-auto max-w-[1500px] px-4 pb-16 pt-5 sm:px-6">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2 text-[12.5px] text-soft"><span className="inline-flex items-center gap-1.5 rounded-full bg-p4/70 px-3 py-1 font-semibold text-onp"><${Icon} n="star" s=${12}/>Demonstração com dados fictícios</span>
        <span className="sm:hidden"><${ThemeToggle} className="h-8 w-[66px] bg-panel"/></span></div>
      <${Router}/></main></div>`;
}
function Router(){
  const {page}=useApp();
  const M={inicio:Inicio,escalas:Escalas,solicitacoes:Solicitacoes,gerar:Gerar,profissionais:Profissionais,talentos:Talentos,equipe:Equipe,
    vacinacao:Vacinacao,calendario:CalendarioVacinal,prontuario:Prontuario,procedimentos:Procedimentos,feridas:Feridas,estetica:Estetica,ilpi:ILPI,estoque:Estoque,temperatura:Temperatura,homecare:HomeCare,pagar:Pagar,receber:Receber,relatorios:Relatorios,
    auditoria:Auditoria,organizacao:Organizacao,configuracoes:Organizacao,notificacoes:Notificacoes,meu:MinhaArea,manual:Manual};
  if(page.page==='prof')return html`<${ProfDetail} id=${page.id}/>`;
  if(page.page==='paciente')return html`<${PacienteDetail} key=${page.id} id=${page.id}/>`;
  const C=M[page.page]||Inicio;return html`<${C} key=${page.page}/>`;
}
const visibleShifts=(S,u)=>S.shifts.filter(s=>can(S,u,'shifts.view',s.unit));
