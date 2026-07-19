
// ============ CONFIG ============
const SUPABASE_URL = 'https://ywrkqmosjgwbckgfyszb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PRoki6P2Zs-QDrDnyHE0CA_p7QoHnpP';
const LETTERS = ['A','B','C','D','E','F'];

// ============ PORTAL ============
let currentCertificado = null;

// Certificados extra del catálogo Aptuvia (solo visualización, no conectados aún)
// ════════════════════════════════════════════════════════════
// CATÁLOGO COMPLETO · 20 certificados en 5 categorías
// ADGG0508 es la base (no está aquí, se trata aparte como default).
// ════════════════════════════════════════════════════════════
const CERT_CATEGORIAS = [
  { cat:'A · Administración y Gestión', certs:[
    {id:'__adgg0508', codigo:'ADGG0508', nombre:'Operaciones de Grabación y Tratamiento de Datos y Documentos'},
    {id:'__adgg0408', codigo:'ADGG0408', nombre:'Operaciones Auxiliares de Servicios Administrativos y Generales'},
    {id:'__adgd0210', codigo:'ADGD0210', nombre:'Creación y Gestión de Microempresas'},
    {id:'__adgd0308', codigo:'ADGD0308', nombre:'Actividades de Gestión Administrativa'},
    {id:'__adgd0208', codigo:'ADGD0208', nombre:'Gestión Integrada de Recursos Humanos'},
  ]},
  { cat:'B · Comercio y Marketing', certs:[
    {id:'__comt0112', codigo:'COMT0112', nombre:'Actividades de Gestión del Pequeño Comercio'},
    {id:'__comv0108', codigo:'COMV0108', nombre:'Actividades de Venta'},
    {id:'__comt0411', codigo:'COMT0411', nombre:'Gestión Comercial de Ventas'},
    {id:'__coml0110', codigo:'COML0110', nombre:'Actividades Auxiliares de Almacén'},
  ]},
  { cat:'C · Informática y Comunicaciones', certs:[
    {id:'__ifct0109', codigo:'IFCT0109', nombre:'Seguridad Informática'},
    {id:'__ifcd0110', codigo:'IFCD0110', nombre:'Confección y Publicación de Páginas Web'},
    {id:'__ifct0209', codigo:'IFCT0209', nombre:'Sistemas Microinformáticos'},
    {id:'__ifcd0210', codigo:'IFCD0210', nombre:'Desarrollo de Aplicaciones con Tecnologías Web'},
  ]},
  { cat:'D · Servicios Sociales y Sanidad', certs:[
    {id:'__sscs0208', codigo:'SSCS0208', nombre:'Atención Sociosanitaria a Personas Dependientes en Instituciones Sociales'},
    {id:'__sscs0108', codigo:'SSCS0108', nombre:'Atención Sociosanitaria a Personas en el Domicilio'},
    {id:'__ssce0110', codigo:'SSCE0110', nombre:'Habilitación para la Docencia en Grados A, B y C del Sistema de FP'},
    {id:'__sant0108', codigo:'SANT0108', nombre:'Transporte Sanitario'},
  ]},
  { cat:'E · Hostelería y Sectores Industriales', certs:[
    {id:'__hotr0208', codigo:'HOTR0208', nombre:'Operaciones Básicas de Restaurante y Bar'},
    {id:'__hotr0408', codigo:'HOTR0408', nombre:'Cocina'},
    {id:'__tmvg0209', codigo:'TMVG0209', nombre:'Mantenimiento de los Sistemas Eléctricos y Electrónicos de Vehículos'},
  ]},
];

async function loadPortal(){
  $('cr-year-portal').textContent = new Date().getFullYear();
  try{
    const acad = await call('/rest/v1/academia?select=nombre&limit=1', {auth:false});
    if(acad && acad[0]) $('portal-academia-name').textContent = acad[0].nombre;
    else $('portal-academia-name').textContent = '';

    const drop = $('cert-picker-drop');
    if(!drop){ return; }
    drop.innerHTML = '';

    // Aula Abierta va primera en el listado, con el mismo formato que un certificado
    const aulaLabel = 'AULA-ABIERTA · Materias Propias / Exámenes Libres';
    const aulaOpt = document.createElement('div');
    aulaOpt.className = 'cp-option cp-special';
    aulaOpt.textContent = aulaLabel;
    aulaOpt.onclick = ()=>selectCert('__aula_abierta', aulaLabel);
    drop.appendChild(aulaOpt);

    // Las 5 categorías con sus certificados (ADGG0508 va dentro de A)
    CERT_CATEGORIAS.forEach(g=>{
      const head = document.createElement('div');
      head.className = 'cp-cat';
      head.textContent = g.cat;
      drop.appendChild(head);
      g.certs.forEach(c=>{
        const d = document.createElement('div');
        d.className = 'cp-option';
        d.textContent = c.codigo + ' · ' + c.nombre;
        d.onclick = ()=>selectCert(c.id, c.codigo+' · '+c.nombre);
        drop.appendChild(d);
      });
    });
  }catch(e){
    $('portal-academia-name').textContent = '';
  }
}

function _exNum(e){var m=String(e&&e.titulo||'').match(/\d+/);return m?parseInt(m[0],10):9999;}
function _exImp(e){return /^(prof-imp-|aula-imp-)/.test(String(e&&e.id||''))?1:0;}
function _cmpEx(a,b){return _exImp(a)-_exImp(b) || (a.orden||0)-(b.orden||0) || _exNum(a)-_exNum(b);}
function closeCertSoon(e){
  if(!e || e.target===document.getElementById('cert-soon-overlay') || e.target.classList.contains('cert-soon-close')){
    document.getElementById('cert-soon-overlay').classList.remove('visible');
  }
}

function portalEntrar(){
  const val = $('portal-select').value;
  if(!val){ $('portal-msg').textContent = 'Selecciona un certificado para continuar.'; return; }

  currentCertificado = val;
  window._activeCertId = val;

  if(val==='__aula_abierta'){
    window._certCodigo = 'Aula Abierta';
    window._certNombre = 'Materias Propias / Exámenes Libres';
    $('login').classList.add('aula-celeste');
  }else{
    const label = ($('cert-picker-label').textContent||'').trim();
    const parts = label.split(' · ');
    window._certCodigo = parts[0]||'';
    window._certNombre = parts.slice(1).join(' · ')||'';
    $('login').classList.remove('aula-celeste');
  }

  $('portal-msg').textContent = '';
  $('portal').classList.add('hidden');
  $('login').classList.remove('hidden');
  applyAuthLabels();
}

function volverPortal(){
  $('login').classList.add('hidden');
  $('login').classList.remove('aula-celeste');
  $('portal').classList.remove('hidden');
  $('pass').value='';
  $('email').value='';
  showMsg($('loginMsg'),'');
}

// Arrancar el portal al cargar la página (y restaurar sesión si la había)
window.addEventListener('DOMContentLoaded', async ()=>{
  // Si llegan desde la landing con /app.html#demo, abrir la demo directamente.
  // Se pinta ANTES de loadPortal() (que va a la red) para que no se vea el
  // portal de selección de curso parpadear durante un par de segundos.
  const pideDemo = (location.hash||'').toLowerCase().indexOf('demo')>=0;
  let hasSess=false; try{ hasSess=!!JSON.parse(localStorage.getItem(_SESS_KEY)||'null'); }catch(e){}
  if(pideDemo){
    try{ $('cr-year-portal').textContent=new Date().getFullYear(); }catch(e){}
    try{ demoPortal(); }catch(e){}
    return;
  }
  await loadPortal();
  if(hasSess){
    $('portal').classList.add('hidden');
    const ok=await restaurarSesion();
    if(!ok){ $('portal').classList.remove('hidden'); }
  }
});

// ── Aula Abierta · mercado independiente (materias propias / exámenes libres) ──
// Arranca con UNA materia de ejemplo ("aula-materia-1") para que "Crear exámenes"
// tenga un destino real desde el primer momento. El profesor de Aula Abierta puede
// pedir más materias (cada una es una fila en "unidades" con id con prefijo "aula-",
// para que nunca colisione con los códigos oficiales tipo "uf0510").
const MODULOS_AULA_ABIERTA = [
  { id:'aula-mod-1', eye:'Materia 1', code:'AULA-01', title:'Mi primera materia',
    desc:'Materia de ejemplo de Aula Abierta. Crea más materias propias añadiendo filas en "unidades" con prefijo aula-.',
    state:{label:'Activo', cls:'active'}, accent:'navy', unidades:['aula-materia-1'] },
];

// Estructura del certificado (organización; los exámenes vienen del servidor)
const MODULOS = [
  { id:'mf0973_1', eye:'Módulo 1', code:'MF0973_1', title:'Grabación de Datos',
    desc:'Módulo transversal (90 h). No se subdivide en Unidades Formativas.',
    state:{label:'Finalizado', cls:'done'}, accent:'honey', unidades:['mf0973'] },
  { id:'mf0974_1', eye:'Módulo 2', code:'MF0974_1', title:'Tratamiento de Datos, Textos y Documentación',
    desc:'Módulo (150 h). Contiene: UF0510, UF0511 y UF0512.',
    state:{label:'Curso activo', cls:'active'}, accent:'navy', unidades:['uf0510','uf0511','uf0512'] },
  { id:'mf0971_1', eye:'Módulo 3', code:'MF0971_1', title:'Reproducción y Archivo',
    desc:'Módulo (120 h). Contiene: UF0513 y UF0514.',
    state:{label:'Disponible', cls:''}, accent:'honey', unidades:['uf0513','uf0514'] },
];

// ── ADGG0408 · Operaciones Auxiliares de Servicios Administrativos y Generales ──
// Tres módulos formativos. El MF0971_1 es transversal: reutiliza UF0513 y UF0514
// de Supabase. Los otros dos están bloqueados hasta que se cargue su banco de preguntas.
const MODULOS_ADGG0408 = [
  { id:'mf0969_1', eye:'Módulo 1', code:'MF0969_1',
    title:'Técnicas Administrativas Básicas de Oficina',
    desc:'Módulo (120 h). Contiene: UF0517, UF0518 y UF0519.',
    state:{label:'Próximamente', cls:''}, accent:'soon',
    unidades:['uf0517','uf0518','uf0519'],
    locked:true },
  { id:'mf0970_1', eye:'Módulo 2', code:'MF0970_1',
    title:'Operaciones Básicas de Comunicación',
    desc:'Módulo (90 h). Contiene: UF0520 y UF0521.',
    state:{label:'Próximamente', cls:''}, accent:'soon',
    unidades:['uf0520','uf0521'],
    locked:true },
  { id:'mf0971_1', eye:'Módulo 3', code:'MF0971_1',
    title:'Reproducción y Archivo',
    desc:'Módulo transversal (120 h). Contiene: UF0513 y UF0514. ¡Ya disponible!',
    state:{label:'Disponible', cls:''}, accent:'honey',
    unidades:['uf0513','uf0514'],
    locked:false },
];

// Devuelve el array de módulos del certificado activo
function getModulos(){
  if(window._activeCertId==='__aula_abierta'){
    // Profesor: sus propias materias. Alumno: las materias de SU profesor (userProfesorId).
    const miProf = window._saImpersona ? window._saImpersonaProf
                 : ((userRol==='profesor'||userRol==='admin') ? userId : (userProfesorId||userId));
    const propias = Object.values(unidadesById)
      .filter(u=>String(u.id).indexOf('aula-')===0 && (u.profesor_id==null || u.profesor_id===miProf))
      .sort(_cmpEx)
      .map(u=>{
        const pm=partesMateria(u.titulo);
        return {
          id:'mod-'+u.id, eye:pm.etiqueta, code:u.codigo||u.id.toUpperCase(), title:pm.nombre||u.id,
          desc:'Materia creada desde Aula Abierta.',
          state:{label:'Activo', cls:'active'}, accent:'navy', unidades:[u.id],
        };
      });
    return propias.length ? propias : MODULOS_AULA_ABIERTA;
  }
  const cid = window._activeCertId;
  if(CERT_MODULOS[cid]) return CERT_MODULOS[cid];
  if(cid && cid!=='__adgg0508' && cid.indexOf('__')===0){
    // Certificado sin catálogo frontend: sus módulos son sus unidades reales en la BD.
    const cert=certBD();
    return Object.values(unidadesById)
      .filter(u=>u.certificado_id===cert)
      .sort(_cmpEx)
      .map(u=>({ id:'mod-'+u.id, eye:u.codigo||'UF', code:u.codigo||String(u.id).toUpperCase(), title:u.titulo||u.id,
        desc:'Unidad de este certificado.', state:{label:'Activo',cls:'active'}, accent:'navy', unidades:[u.id] }));
  }
  return MODULOS;
}

// ════════════════════════════════════════════════════════════
// CATÁLOGO COMPLETO · 8 certificados nuevos (bloqueados)
// Todos sus módulos van locked:true ("Próximamente"), salvo el
// transversal MF0971_1 si lo compartieran (ninguno lo hace aún).
// ════════════════════════════════════════════════════════════
const _soon = (id,eye,code,title,desc,unidades)=>({
  id, eye, code, title, desc,
  state:{label:'Próximamente', cls:''}, accent:'soon',
  unidades, locked:true
});

const MODULOS_ADGD0210 = [
  _soon('mf1788_3','Módulo 1','MF1788_3','Planificación e Iniciativa Emprendedora','Módulo. Contiene: UF1818, UF1819 y UF1820.',['uf1818','uf1819','uf1820']),
  _soon('mf1789_3','Módulo 2','MF1789_3','Dirección de la Actividad Empresarial de Microempresas','Módulo. Contiene: UF1821 y UF1822.',['uf1821','uf1822']),
  _soon('mf1790_3','Módulo 3','MF1790_3','Comercialización y Venta de Productos en Microempresas','Módulo. Contiene: UF1823 y UF1824.',['uf1823','uf1824']),
  _soon('mf1791_3','Módulo 4','MF1791_3','Gestión Administrativa y Financiera de Microempresas','Módulo. Contiene: UF1825 y UF1826.',['uf1825','uf1826']),
  _soon('mf1792_3','Módulo 5','MF1792_3','Prevención de Riesgos Laborales en Microempresas','Módulo. No se subdivide en Unidades Formativas.',['mf1792']),
];

const MODULOS_COMT0112 = [
  _soon('mf2104_3','Módulo 1','MF2104_3','Organización y Gestión de la Actividad Comercial','Módulo. No se subdivide en Unidades Formativas.',['mf2104']),
  _soon('mf2105_3','Módulo 2','MF2105_3','Gestión de la Venta y la Atención al Cliente','Módulo. Contiene: UF2381 y UF2382.',['uf2381','uf2382']),
  _soon('mf2106_3','Módulo 3','MF2106_3','Gestión de Establecimientos Comerciales','Módulo. Contiene: UF2383 y UF2384.',['uf2383','uf2384']),
];

const MODULOS_COMV0108 = [
  _soon('mf0239_2','Módulo 1','MF0239_2','Operaciones de Venta','Módulo. Contiene: UF0030, UF0031 y UF0032.',['uf0030','uf0031','uf0032']),
  _soon('mf0240_2','Módulo 2','MF0240_2','Operaciones Auxiliares de Venta','Módulo. Contiene: UF0033 y UF0034.',['uf0033','uf0034']),
  _soon('mf0241_2','Módulo 3','MF0241_2','Información y Atención al Cliente','Módulo. Contiene: UF0035 y UF0036.',['uf0035','uf0036']),
];

const MODULOS_IFCT0109 = [
  _soon('mf0486_3','Módulo 1','MF0486_3','Seguridad en Equipos Informáticos','Módulo. Contiene: UF1344 y UF1345.',['uf1344','uf1345']),
  _soon('mf0487_3','Módulo 2','MF0487_3','Seguridad en Redes de Ordenadores','Módulo. Contiene: UF1346 y UF1347.',['uf1346','uf1347']),
  _soon('mf0488_3','Módulo 3','MF0488_3','Auditoría de Seguridad y Normativas','Módulo. Contiene: UF1348 y UF1349.',['uf1348','uf1349']),
  _soon('mf0489_3','Módulo 4','MF0489_3','Gestión de Incidentes de Seguridad Informática','Módulo. Contiene: UF1350.',['uf1350']),
];

const MODULOS_IFCD0110 = [
  _soon('mf0950_2','Módulo 1','MF0950_2','Construcción de Páginas Web','Módulo. Contiene: UF1302, UF1303 y UF1304.',['uf1302','uf1303','uf1304']),
  _soon('mf0951_2','Módulo 2','MF0951_2','Integración de Componentes Software en Páginas Web','Módulo. Contiene: UF1305 y UF1306.',['uf1305','uf1306']),
  _soon('mf0952_2','Módulo 3','MF0952_2','Publicación de Páginas Web','Módulo. Contiene: UF1307 y UF1308.',['uf1307','uf1308']),
];

const MODULOS_SSCS0208 = [
  _soon('mf1016_2','Módulo 1','MF1016_2','Apoyo en la Organización de Intervenciones en el Ámbito Institucional','Módulo. No se subdivide en Unidades Formativas.',['mf1016']),
  _soon('mf1017_2','Módulo 2','MF1017_2','Intervención en la Atención Higiénico-Alimentaria en Instituciones','Módulo. No se subdivide en Unidades Formativas.',['mf1017']),
  _soon('mf1018_2','Módulo 3','MF1018_2','Intervención en la Atención Sociosanitaria en Instituciones','Módulo. Contiene: UF0127 y UF0128.',['uf0127','uf0128']),
  _soon('mf1019_2','Módulo 4','MF1019_2','Apoyo Psicosocial, Atención Relacional y Comunicativa en Instituciones','Módulo. Contiene: UF0129, UF0130 y UF0131.',['uf0129','uf0130','uf0131']),
];

const MODULOS_HOTR0208 = [
  _soon('mf0257_1','Módulo 1','MF0257_1','Servicio de Alimentos y Bebidas en Barra y Mesa','Módulo. Contiene: UF0053, UF0054 y UF0055.',['uf0053','uf0054','uf0055']),
  _soon('mf0258_1','Módulo 2','MF0258_1','Aprovisionamiento, Bebidas y Comidas Rápidas en Bar','Módulo. Contiene: UF0058, UF0059 y UF0060.',['uf0058','uf0059','uf0060']),
];

const MODULOS_SANT0108 = [
  _soon('mf0069_1','Módulo 1','MF0069_1','Operaciones de Mantenimiento Preventivo del Vehículo Sanitario','Módulo. No se subdivide en Unidades Formativas.',['mf0069']),
  _soon('mf0070_2','Módulo 2','MF0070_2','Soporte Vital Básico y Apoyo al Soporte Vital Avanzado','Módulo. Contiene: UF0677 y UF0678.',['uf0677','uf0678']),
  _soon('mf0071_2','Módulo 3','MF0071_2','Traslado del Paciente al Centro Sanitario','Módulo. Contiene: UF0679 y UF0680.',['uf0679','uf0680']),
  _soon('mf0072_2','Módulo 4','MF0072_2','Técnicas de Apoyo Psicológico y Social en Situaciones de Crisis','Módulo. No se subdivide en Unidades Formativas.',['mf0072']),
];

// ── 9 CERTIFICADOS NUEVOS (catálogo a 20) ──
const MODULOS_ADGD0308 = [
  _soon('mf0979_2','Módulo 1','MF0979_2','Gestión Operativa de Tesorería','Módulo. Contiene: UF0522 y UF0523.',['uf0522','uf0523']),
  _soon('mf0980_2','Módulo 2','MF0980_2','Gestión Auxiliar de Personal','Módulo. Contiene: UF0524 y UF0525.',['uf0524','uf0525']),
  _soon('mf0981_2','Módulo 3','MF0981_2','Registros Contables','Módulo. Contiene: UF0526 y UF0527.',['uf0526','uf0527']),
  _soon('mf0973_1_d308','Módulo 4','MF0973_1','Grabación de Datos','Módulo transversal. No se subdivide en Unidades Formativas.',['mf0973']),
  _soon('mf0978_2','Módulo 5','MF0978_2','Gestión de Archivos','Módulo transversal. Contiene: UF0513 y UF0514.',['uf0513','uf0514']),
];

const MODULOS_ADGD0208 = [
  _soon('mf0237_3','Módulo 1','MF0237_3','Gestión Administrativa de las Relaciones Laborales','Módulo. Contiene: UF0341, UF0342 y UF0343.',['uf0341','uf0342','uf0343']),
  _soon('mf0238_3','Módulo 2','MF0238_3','Gestión de Recursos Humanos','Módulo. Contiene: UF0344, UF0345 y UF0346.',['uf0344','uf0345','uf0346']),
  _soon('mf0987_3','Módulo 3','MF0987_3','Gestión de Sistemas de Información y Archivo de Recursos Humanos','Módulo. No se subdivide en Unidades Formativas.',['mf0987']),
];

const MODULOS_COMT0411 = [
  _soon('mf2172_3','Módulo 1','MF2172_3','Comercialización de Productos y Servicios en Pequeños Negocios o Microempresas','Módulo. Contiene: UF2392, UF2393 y UF2394.',['uf2392','uf2393','uf2394']),
  _soon('mf2173_3','Módulo 2','MF2173_3','Gestión de Canales de Venta Online','Módulo. Contiene: UF2395 y UF2396.',['uf2395','uf2396']),
];

const MODULOS_COML0110 = [
  _soon('mf1325_1','Módulo 1','MF1325_1','Operaciones Auxiliares de Almacenaje','Módulo. Contiene: UF0431 y UF0432.',['uf0431','uf0432']),
  _soon('mf1326_1','Módulo 2','MF1326_1','Preparación de Pedidos','Módulo. Contiene: UF0433.',['uf0433']),
  _soon('mf1327_1','Módulo 3','MF1327_1','Manipulación de Cargas con Carretillas Elevadoras','Módulo. Contiene: UF0434.',['uf0434']),
];

const MODULOS_IFCT0209 = [
  _soon('mf0219_2','Módulo 1','MF0219_2','Instalación y Configuración de Sistemas Operativos','Módulo. Contiene: UF0852 y UF0853.',['uf0852','uf0853']),
  _soon('mf0220_2','Módulo 2','MF0220_2','Implantación de los Elementos de la Red Local','Módulo. Contiene: UF0854 y UF0855.',['uf0854','uf0855']),
  _soon('mf0221_2','Módulo 3','MF0221_2','Instalación y Configuración de Aplicaciones Informáticas','Módulo. Contiene: UF0856 y UF0857.',['uf0856','uf0857']),
  _soon('mf0222_2','Módulo 4','MF0222_2','Reparación y Ampliación de Equipos y Componentes Hardware Microinformáticos','Módulo. Contiene: UF0858, UF0859 y UF0860.',['uf0858','uf0859','uf0860']),
];

const MODULOS_IFCD0210 = [
  _soon('mf0491_3','Módulo 1','MF0491_3','Programación Web en el Entorno Cliente','Módulo. Contiene: UF1841, UF1842 y UF1843.',['uf1841','uf1842','uf1843']),
  _soon('mf0492_3','Módulo 2','MF0492_3','Programación Web en el Entorno Servidor','Módulo. Contiene: UF1844, UF1845 y UF1846.',['uf1844','uf1845','uf1846']),
  _soon('mf0493_3','Módulo 3','MF0493_3','Implantación de Aplicaciones Web en Entornos Internet, Intranet y Extranet','Módulo. Contiene: UF1847, UF1848 y UF1849.',['uf1847','uf1848','uf1849']),
];

const MODULOS_SSCS0108 = [
  _soon('mf0249_2','Módulo 1','MF0249_2','Higiene y Atención Sanitaria Domiciliaria','Módulo. Contiene: UF0119, UF0120 y UF0121.',['uf0119','uf0120','uf0121']),
  _soon('mf0250_2','Módulo 2','MF0250_2','Atención y Apoyo Psicosocial Domiciliario','Módulo. Contiene: UF0122, UF0123 y UF0124.',['uf0122','uf0123','uf0124']),
  _soon('mf0251_2','Módulo 3','MF0251_2','Apoyo a la Gestión de la Unidad Convivencial en el Domicilio','Módulo. Contiene: UF0125 y UF0126.',['uf0125','uf0126']),
];

const MODULOS_SSCE0110 = [
  _soon('mf1442_3','Módulo 1','MF1442_3','Programación Didáctica de Acciones Formativas para el Empleo','Módulo. No se subdivide en Unidades Formativas.',['mf1442']),
  _soon('mf1443_3','Módulo 2','MF1443_3','Selección, Elaboración, Adaptación y Utilización de Materiales, Medios y Recursos Didácticos','Módulo. No se subdivide en Unidades Formativas.',['mf1443']),
  _soon('mf1444_3','Módulo 3','MF1444_3','Impartición y Tutorización de Acciones Formativas para el Empleo','Módulo. Contiene: UF1645 y UF1646.',['uf1645','uf1646']),
  _soon('mf1445_3','Módulo 4','MF1445_3','Evaluación del Proceso de Enseñanza-Aprendizaje en Acciones Formativas para el Empleo','Módulo. No se subdivide en Unidades Formativas.',['mf1445']),
  _soon('mf1446_3','Módulo 5','MF1446_3','Orientación Laboral y Promoción de la Calidad en la Formación Profesional para el Empleo','Módulo. No se subdivide en Unidades Formativas.',['mf1446']),
];

const MODULOS_HOTR0408 = [
  _soon('mf0259_2','Módulo 1','MF0259_2','Ofertas Gastronómicas y Sistemas de Aprovisionamiento','Módulo. Contiene: UF0063, UF0064 y UF0065.',['uf0063','uf0064','uf0065']),
  _soon('mf0260_2','Módulo 2','MF0260_2','Preelaboración y Conservación de Alimentos','Módulo. Contiene: UF0066, UF0067, UF0068 y UF0069.',['uf0066','uf0067','uf0068','uf0069']),
  _soon('mf0261_2','Módulo 3','MF0261_2','Elaboración Culinaria Básica','Módulo. Contiene: UF0070, UF0071, UF0072 y UF0073.',['uf0070','uf0071','uf0072','uf0073']),
  _soon('mf0262_2','Módulo 4','MF0262_2','Procesos de Gestión de Calidad en Hostelería y Turismo','Módulo. Contiene: UF0053 y UF0074.',['uf0053','uf0074']),
];

const MODULOS_TMVG0209 = [
  _soon('mf0626_2','Módulo 1','MF0626_2','Sistemas de Carga y Arranque de Vehículos','Módulo. Contiene: UF1111 y UF1112.',['uf1111','uf1112']),
  _soon('mf0627_2','Módulo 2','MF0627_2','Circuitos Eléctricos Auxiliares de Vehículos','Módulo. Contiene: UF1113 y UF1114.',['uf1113','uf1114']),
  _soon('mf0628_2','Módulo 3','MF0628_2','Sistemas de Seguridad y Confortabilidad de Vehículos','Módulo. Contiene: UF1115 y UF1116.',['uf1115','uf1116']),
];

// Mapa: id de portal → array de módulos
const CERT_MODULOS = {
  '__aula_abierta': MODULOS_AULA_ABIERTA,
  '__adgg0408': MODULOS_ADGG0408,
  '__adgd0210': MODULOS_ADGD0210,
  '__adgd0308': MODULOS_ADGD0308,
  '__adgd0208': MODULOS_ADGD0208,
  '__comt0112': MODULOS_COMT0112,
  '__comv0108': MODULOS_COMV0108,
  '__comt0411': MODULOS_COMT0411,
  '__coml0110': MODULOS_COML0110,
  '__ifct0109': MODULOS_IFCT0109,
  '__ifcd0110': MODULOS_IFCD0110,
  '__ifct0209': MODULOS_IFCT0209,
  '__ifcd0210': MODULOS_IFCD0210,
  '__sscs0208': MODULOS_SSCS0208,
  '__sscs0108': MODULOS_SSCS0108,
  '__ssce0110': MODULOS_SSCE0110,
  '__sant0108': MODULOS_SANT0108,
  '__hotr0208': MODULOS_HOTR0208,
  '__hotr0408': MODULOS_HOTR0408,
  '__tmvg0209': MODULOS_TMVG0209,
};

// Mapa: id de portal → certificado_id de la BD (aislamiento estanco)
const CERT_BD = {
  '__aula_abierta':'aula_abierta',
  '__adgg0408':'adgg0408', '__adgd0210':'adgd0210', '__adgd0308':'adgd0308', '__adgd0208':'adgd0208',
  '__comt0112':'comt0112', '__comv0108':'comv0108', '__comt0411':'comt0411', '__coml0110':'coml0110',
  '__ifct0109':'ifct0109', '__ifcd0110':'ifcd0110', '__ifct0209':'ifct0209', '__ifcd0210':'ifcd0210',
  '__sscs0208':'sscs0208', '__sscs0108':'sscs0108', '__ssce0110':'ssce0110', '__sant0108':'sant0108',
  '__hotr0208':'hotr0208', '__hotr0408':'hotr0408', '__tmvg0209':'tmvg0209',
};

// Mapa: id de portal → clase de tema CSS
const CERT_TEMA = {
  '__aula_abierta':'tema-aula-abierta',
  '__adgg0408':'tema-adgg0408', '__adgd0210':'tema-adgd0210', '__adgd0308':'tema-adgd0308', '__adgd0208':'tema-adgd0208',
  '__comt0112':'tema-comt0112', '__comv0108':'tema-comv0108', '__comt0411':'tema-comt0411', '__coml0110':'tema-coml0110',
  '__ifct0109':'tema-ifct0109', '__ifcd0110':'tema-ifcd0110', '__ifct0209':'tema-ifct0209', '__ifcd0210':'tema-ifcd0210',
  '__sscs0208':'tema-sscs0208', '__sscs0108':'tema-sscs0108', '__ssce0110':'tema-ssce0110', '__sant0108':'tema-sant0108',
  '__hotr0208':'tema-hotr0208', '__hotr0408':'tema-hotr0408', '__tmvg0209':'tema-tmvg0209',
};


let token=null, refreshToken=null, userEmail='', userName='', userRol='', userAcademia=null, userProfesorId=null;
let unidadesById={}, examsByUnit={}, attemptsByExam={}, falladasByUnit={}, entregasByExam={}, userId='';
let estadosLocales={};
let current={ module:null, unit:null, exam:null, preguntas:[], respuestas:{}, qIndex:0, mode:'examen', optOrder:{} };
const $ = id => document.getElementById(id);
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
// Baraja el orden de las opciones de cada pregunta (guarda la permutación)
function prepararOpciones(){
  current.optOrder={};
  current.preguntas.forEach(q=>{ const n=(q.opciones||[]).length; current.optOrder[q.id]=shuffle(Array.from({length:n},(_,k)=>k)); });
}

// ============ API ============
// RPCs de solo lectura: en modo demo de Aula Abierta resuelven "sin datos" en vez
// de fallar, para que las pantallas se vean limpias y virgenes (es la verdad: aún
// no hay nada). Cualquier otra llamada (escrituras) lanza un aviso honesto en vez
// de fingir que se ha guardado algo que en realidad no tiene cuenta real detrás.
const AULA_DEMO_READ_RPCS = ['resultados_alumnado','resumen_alumnado','listar_entregas',
  'listar_invitaciones','temas_de_unidad','preguntas_de_unidad','estados_de_certificado','examenes_publicados_academia',
  'obtener_examen','obtener_entrega','obtener_redaccion','resumen_falladas','obtener_examen_profesor','preguntas_banco_profesor'];
async function call(path, {method='GET', body=null, auth=true}={}){
  // DEMO: nada sale a Supabase. Datos falsos y escrituras bloqueadas.
  if(window._demoMode){
    const r=demoResponder(path,{method,body});
    if(r===undefined) throw new Error('Esto es una demo: aquí no se guarda nada. En la plataforma real este botón guardaría el cambio al instante.');
    return r;
  }
  if(window._aulaAbiertaDemo){
    if(method==='GET' || AULA_DEMO_READ_RPCS.some(name=>path.includes(name))) return [];
    throw new Error('Sesión de demostración: esta acción aún no se guarda. Crea las cuentas reales en Supabase (o regístrate desde aquí) para activar el guardado.');
  }
  const headers = { 'apikey':SUPABASE_KEY, 'Content-Type':'application/json' };
  if (auth && token) headers['Authorization']='Bearer '+token;
  let res = await fetch(SUPABASE_URL+path, {method, headers, body: body?JSON.stringify(body):null});
  // Si la sesión ha caducado (exámenes largos: el token de Supabase dura 1 hora),
  // se renueva en silencio con el refresh_token y se reintenta UNA vez. Así un
  // alumno en mitad de un examen largo nunca pierde su entrega por "JWT expired".
  if(res.status===401 && auth && refreshToken && !path.startsWith('/auth/')){
    const ok = await renovarSesion();
    if(ok){
      headers['Authorization']='Bearer '+token;
      res = await fetch(SUPABASE_URL+path, {method, headers, body: body?JSON.stringify(body):null});
    }
  }
  const text = await res.text();
  let data=null; try{ data = text ? JSON.parse(text) : null; }catch(e){ data=text; }
  if(!res.ok){
    const msg=(data && (data.error_description||data.msg||data.message||data.error||data.hint))||('Error '+res.status);
    throw new Error(msg);
  }
  return data;
}
// Renueva la sesión con el refresh_token de Supabase. Devuelve true si lo consigue.
async function renovarSesion(){
  try{
    const r = await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{
      method:'POST',
      headers:{ 'apikey':SUPABASE_KEY, 'Content-Type':'application/json' },
      body: JSON.stringify({refresh_token: refreshToken})
    });
    if(!r.ok) return false;
    const d = await r.json();
    if(d && d.access_token){ token=d.access_token; if(d.refresh_token) refreshToken=d.refresh_token; guardarSesion(); return true; }
    return false;
  }catch(e){ return false; }
}
// ── Sesión persistente: al refrescar la página no se pierde el login ──
const _SESS_KEY='et_sess_v1';
const APTUVIA_LOGO='data:image/png;base64,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';
const APTUVIA_LOGO_RATIO=469/130;
function pdfLogo(doc,x,yTop,w){ try{ doc.addImage(APTUVIA_LOGO,'PNG',x,yTop,w,w/APTUVIA_LOGO_RATIO); }catch(e){} }

function guardarSesion(){
  try{
    if(!refreshToken || window._saImpersona || window._aulaAbiertaDemo) return;
    localStorage.setItem(_SESS_KEY, JSON.stringify({
      rt:refreshToken, email:userEmail,
      cert:window._activeCertId||null, cod:window._certCodigo||'', nom:window._certNombre||'',
      view:window._curView||'', unit:current&&current.unit||null,
      mod:(current&&current.module&&current.module.id)||null
    }));
  }catch(e){}
}
function limpiarSesion(){ try{ localStorage.removeItem(_SESS_KEY); localStorage.removeItem(_PANEL_KEY); }catch(e){} }
// Estado del panel de superadmin (pestaña y subpestaña abiertas): así al refrescar
// la página no te devuelve siempre a la lista de academias.
const _PANEL_KEY='apt_panel_v1';
function guardarPanel(){
  try{
    if(userEmail!=='admin@evaluatest.com' || window._saImpersona) return;
    localStorage.setItem(_PANEL_KEY, JSON.stringify({
      main:saMainTab||'ev', fsub:window._factSub||null, gtab:gxTab||'facturas',
      rsub:window._rsSub||null, rtab:rsTab||'redactor'
    }));
  }catch(e){}
}
function leerPanel(){ try{ return JSON.parse(localStorage.getItem(_PANEL_KEY)||'null'); }catch(e){ return null; } }
async function restaurarSesion(){
  let s=null; try{ s=JSON.parse(localStorage.getItem(_SESS_KEY)||'null'); }catch(e){}
  if(!s || !s.rt) return false;
  refreshToken=s.rt; userEmail=s.email||'';
  window._activeCertId=s.cert||null; window._certCodigo=s.cod||''; window._certNombre=s.nom||'';
  if(window._activeCertId==='__aula_abierta'){ $('login').classList.add('aula-celeste'); }
  const ok=await renovarSesion();
  if(!ok){ refreshToken=null; limpiarSesion(); return false; }
  try{
    await gateAccess();
    $('portal').classList.add('hidden');
    $('login').classList.add('hidden');
    $('app').classList.remove('hidden');
    sbRender();
    await loadData();
    try{ restaurarVista(s); }catch(e){}
    return true;
  }catch(e){ token=null; refreshToken=null; limpiarSesion(); return false; }
}
// Vuelve a abrir la pantalla en la que estaba el usuario antes de refrescar.
function restaurarVista(s){
  if(!s) return;
  const v=s.view||'';
  if(v==='home'||v===''||v==='teacher') return; // loadData ya deja Inicio/Panel
  if(s.mod){ const m=getModulos().find(x=>x.id===s.mod); if(m) current.module=m; }
  if(s.unit && (unidadEnCert(s.unit) || unidadesById[s.unit])){
    if(isStaff()) teacherView='unit';
    openUnit(s.unit);              // 'exam'/'result'/'unit' vuelven a la lista de la UF
  } else if(s.mod){
    const m=getModulos().find(x=>x.id===s.mod);
    if(m) openModule(m.id);
  }
}
function showMsg(el, text, kind='err'){ el.innerHTML = text ? `<div class="banner ${kind}">${text}</div>` : ''; }
function wireEye(eyeId, inputId){
  const e=$(eyeId), i=$(inputId); if(!e||!i) return;
  e.onclick=()=>{ const show=i.type==='password'; i.type=show?'text':'password'; e.textContent=show?'🙈':'👁'; e.setAttribute('aria-label', show?'Ocultar contraseña':'Mostrar contraseña'); };
}

// ============ LOGIN / REGISTRO ============
let authMode='login';
function applyAuthLabels(){
  const aula = window._activeCertId==='__aula_abierta';
  const NV='#2e3163';
  if(aula && authMode==='login'){
    $('authTitle').innerHTML = `<span style="color:${NV}">A</span>ula <span style="color:${NV}">A</span>bierta`;
  } else {
    $('authTitle').textContent = aula
      ? 'Crear cuenta · Aula Abierta'
      : (authMode==='login'?'Acceso':'Crear cuenta');
  }
  $('authLead').textContent  = aula
    ? 'Materias propias y exámenes libres, fuera de los certificados oficiales.'
    : (authMode==='login'
      ? 'Entra con tu correo para acceder a tus exámenes.'
      : 'Tu correo debe estar autorizado por tu profesor. Elige una contraseña.');
  $('loginBtn').textContent  = authMode==='login'?'Entrar':'Crear cuenta';
  $('authToggle').textContent= authMode==='login'?'¿Primera vez? Crea tu cuenta':'¿Ya tienes cuenta? Entrar';
  showMsg($('loginMsg'),'');
}
function toggleAuthMode(){ authMode = authMode==='login'?'signup':'login'; applyAuthLabels(); }

// Comprueba que el correo está autorizado y vincula al alumno con su academia
async function gateAccess(){
  // Mapear el ID interno del portal al certificado_id real de la BD.
  // (antes solo se mapeaba __adgg0408; el resto de certificados, incluido
  // Aula Abierta, caían siempre en 'adgg0508' — bug corregido usando certBD()).
  if(userEmail==='admin@evaluatest.com'){ applyTema(window._activeCertId); return; }
  const certId = certBD();
  try{
    const ok = await call('/rest/v1/rpc/puedo_acceder',{method:'POST',body:{p_cert:certId}});
    if(ok===false){ token=null; refreshToken=null; throw new Error('Tu cuenta no tiene acceso a este apartado. Selecciona el correcto en la pantalla anterior.'); }
  }catch(e){ if(/no tiene acceso/.test(e.message||'')) throw e; }
  let status='ok';
  try{ status = await call('/rest/v1/rpc/vincular_invitacion',{method:'POST',body:{p_certificado_id:certId}}); }
  catch(e){ status='ok'; } // si la función aún no existe, no bloquea
  if(status==='no_autorizado'){
    token=null; refreshToken=null;
    throw new Error('Tu correo no está autorizado para este curso. Pídele a tu profesor que te dé de alta.');
  }
  // Aplicar tema visual del certificado
  applyTema(window._activeCertId);
}

async function doLogin(){
  if(authMode==='signup') return doSignup();
  const email=$('email').value.trim(), pass=$('pass').value, btn=$('loginBtn');
  showMsg($('loginMsg'),'');
  if(!email||!pass){ showMsg($('loginMsg'),'Escribe tu correo y tu contraseña.'); return; }

  btn.disabled=true; btn.innerHTML='<span class="spin"></span>';
  try{
    const data=await call('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email,password:pass}});
    token=data.access_token; refreshToken=data.refresh_token||null; userEmail=email;
    await gateAccess();
    $('login').classList.add('hidden'); $('app').classList.remove('hidden');
    sbRender();
    guardarSesion();
    await loadData();
  }catch(err){
    let m=err.message||'No se pudo entrar.';
    if(/invalid login/i.test(m)) m='Correo o contraseña incorrectos.';
    if(/email not confirmed/i.test(m)) m='Esta cuenta aún no está confirmada.';
    showMsg($('loginMsg'),m);
  }finally{ btn.disabled=false; btn.textContent=authMode==='login'?'Entrar':'Crear cuenta'; }
}

// Aviso, solo en la pantalla de aterrizaje, de que estamos en sesión de demostración
function mostrarAvisoDemoAula(){
  const host = isStaff() ? $('teacher') : $('home');
  if(!host) return;
  host.insertAdjacentHTML('afterbegin', `<div class="t-note" style="background:#eaf9fc;border:1.5px solid #90E0EF;color:#0077B6;margin-bottom:14px">
    Sesión de demostración de Aula Abierta — la navegación es real, pero nada se guarda todavía.
    Crea estas dos cuentas en Supabase (o regístrate desde el login) para que pase a guardar datos reales.
  </div>`);
}

async function doSignup(){
  const email=$('email').value.trim(), pass=$('pass').value, btn=$('loginBtn');
  showMsg($('loginMsg'),'');
  if(!email||!pass){ showMsg($('loginMsg'),'Escribe tu correo y una contraseña.'); return; }
  if(pass.length<6){ showMsg($('loginMsg'),'La contraseña debe tener al menos 6 caracteres.'); return; }
  btn.disabled=true; btn.innerHTML='<span class="spin"></span>';
  try{
    const data=await call('/auth/v1/signup',{method:'POST',auth:false,body:{email,password:pass}});
    if(data && data.access_token){
      token=data.access_token; refreshToken=data.refresh_token||null; userEmail=email;
      await gateAccess();
      $('login').classList.add('hidden'); $('app').classList.remove('hidden');
      sbRender();
      guardarSesion();
      await loadData();
    }else{
      showMsg($('loginMsg'),'Cuenta creada. Revisa tu correo para confirmarla y luego entra.','ok');
      authMode='login'; applyAuthLabels();
    }
  }catch(err){
    let m=err.message||'No se pudo crear la cuenta.';
    if(/already registered|already been registered|user already/i.test(m)) m='Ese correo ya tiene cuenta. Entra con tu contraseña.';
    showMsg($('loginMsg'),m);
  }finally{ btn.disabled=false; btn.textContent=authMode==='login'?'Entrar':'Crear cuenta'; }
}
// Aplica el tema visual del certificado al <body>
// Devuelve el certificado_id que usa la BD según el portal activo
// ── Modales propios (sustituyen alert/confirm/prompt nativos, sin URL en el título) ──
let _mQueue=Promise.resolve();
function _modal(opts){
  const run=()=>new Promise(res=>{
    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:99999;display:flex;align-items:center;justify-content:center;padding:22px;';
    const box=document.createElement('div');
    box.style.cssText='background:#fff;border-radius:16px;max-width:420px;width:100%;padding:20px 18px;box-shadow:0 18px 50px rgba(0,0,0,.25);font-family:inherit;';
    const msg=document.createElement('div');
    msg.style.cssText='font-size:.92rem;color:var(--ink,#1e293b);line-height:1.55;white-space:pre-wrap;word-break:break-word;';
    msg.textContent=String(opts.msg==null?'':opts.msg);
    box.appendChild(msg);
    let input=null;
    if(opts.prompt){
      input=document.createElement('input');
      input.type='text'; input.value=(opts.def==null?'':String(opts.def));
      input.style.cssText='margin-top:12px;width:100%;padding:10px 12px;border:1.5px solid var(--line,#e2e8f0);border-radius:10px;font-size:.9rem;font-family:inherit;box-sizing:border-box;';
      box.appendChild(input);
    }
    const row=document.createElement('div');
    row.style.cssText='display:flex;gap:10px;justify-content:flex-end;margin-top:16px;';
    const mkBtn=(txt,primary)=>{ const b=document.createElement('button'); b.type='button'; b.textContent=txt;
      b.style.cssText='padding:9px 16px;border-radius:10px;font-size:.85rem;font-weight:700;cursor:pointer;font-family:inherit;border:1.5px solid '+(primary?'var(--navy,#1e3a8a);background:var(--navy,#1e3a8a);color:#fff':'var(--line,#cbd5e1);background:#fff;color:var(--ink,#1e293b)');
      return b; };
    const done=v=>{ ov.remove(); res(v); };
    if(opts.cancel){ const c=mkBtn('Cancelar',false); c.onclick=()=>done(opts.prompt?null:false); row.appendChild(c); }
    const ok=mkBtn('Aceptar',true);
    ok.onclick=()=>done(opts.prompt?(input?input.value:''):true);
    row.appendChild(ok);
    box.appendChild(row);
    ov.appendChild(box);
    document.body.appendChild(ov);
    if(input){ input.focus(); input.select(); input.addEventListener('keydown',e=>{ if(e.key==='Enter') ok.click(); }); }
    else ok.focus();
  });
  _mQueue=_mQueue.then(run,run);
  return _mQueue;
}
function appAlert(m){ return _modal({msg:m}); }
function appConfirm(m){ return _modal({msg:m,cancel:true}); }
// Abre Google Drive en otra pestaña para arrastrar allí el PDF recién descargado.
function driveAbrir(){ try{ window.open('https://drive.google.com/drive/my-drive','_blank','noopener'); }catch(e){} }
function appPrompt(m,def){ return _modal({msg:m,cancel:true,prompt:true,def:def}); }

// Selector de certificado tappable (estilo lista de módulos), fuente: catálogo CERT_CATEGORIAS.
// Devuelve {id,codigo,nombre} con id SIN prefijo '__', o null si se cancela.

// ══════════════ TEMARIO (materiales del profesor) ══════════════
let temarioByUnit={};

async function cargarTemario(){
  temarioByUnit={};
  try{
    const rows=await call('/rest/v1/temario?select=*&order=creado_en.desc')||[];
    rows.forEach(r=>{ (temarioByUnit[r.unidad]=temarioByUnit[r.unidad]||[]).push(r); });
  }catch(e){}
}

// Sube un archivo al bucket 'temario' y registra la fila. Devuelve true si ok.
async function temarioSubir(unidad, file, titulo, nota){
  const cert=certBD();
  const miProf = window._saImpersona ? window._saImpersonaProf : userId;
  const ext=(file.name.split('.').pop()||'bin').toLowerCase();
  const safe=(file.name.replace(/[^a-zA-Z0-9._-]/g,'_')).slice(-60);
  const path=cert+'/'+miProf+'/'+Date.now()+'_'+safe;
  // 1) Subir binario a Storage
  const up=await fetch(SUPABASE_URL+'/storage/v1/object/temario/'+encodeURI(path),{
    method:'POST',
    headers:{ 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+token, 'Content-Type':file.type||'application/octet-stream' },
    body:file
  });
  if(!up.ok){ const t=await up.text().catch(()=>''); throw new Error('Subida: '+(t||up.status)); }
  // 2) Registrar en tabla
  await call('/rest/v1/temario',{method:'POST',body:impProf({
    profesor_id:miProf, academia_id:(window._saImpersona?window._saImpersonaAcademia:userAcademia)||null,
    certificado_id:cert, unidad:unidad, titulo:titulo||file.name, nota:nota||null,
    archivo_path:path, archivo_nombre:file.name, mime:file.type||null
  })});
  return true;
}

// Descarga (URL firmada temporal para bucket privado)
async function temarioDescargar(path, nombre){
  try{
    const r=await fetch(SUPABASE_URL+'/storage/v1/object/sign/temario/'+encodeURI(path),{
      method:'POST',
      headers:{ 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+token, 'Content-Type':'application/json' },
      body:JSON.stringify({expiresIn:3600})
    });
    const j=await r.json();
    if(!j.signedURL){ throw new Error('No se pudo generar el enlace.'); }
    const url=SUPABASE_URL+'/storage/v1'+j.signedURL;
    const a=document.createElement('a'); a.href=url; a.download=nombre||''; a.target='_blank'; document.body.appendChild(a); a.click(); a.remove();
  }catch(e){ appAlert('No se pudo descargar: '+(e.message||'')); }
}

async function temarioBorrar(id, path){
  if(!await appConfirm('¿Borrar este material? No se puede deshacer.')) return;
  try{
    await fetch(SUPABASE_URL+'/storage/v1/object/temario/'+encodeURI(path),{ method:'DELETE', headers:{ 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+token } });
    await call('/rest/v1/temario?id=eq.'+id,{method:'DELETE'});
    await cargarTemario();
    if(teacherView==='temario') renderTemarioProfesor(teacherUnidadTem);
  }catch(e){ appAlert('No se pudo borrar: '+(e.message||'')); }
}

// ---- Panel del PROFESOR: gestionar temario por unidad ----
let teacherUnidadTem=null;
function openTemarioProfesor(){
  teacherView='temario';
  const mods=getModulos();
  teacherUnidadTem = teacherUnidadTem || (mods[0] && mods[0].unidades && mods[0].unidades[0]) || null;
  renderTemarioProfesor(teacherUnidadTem);
}

function renderTemarioProfesor(unidad){
  teacherUnidadTem=unidad;
  cargarTemario().then(()=>{
    const mods=getModulos();
    // Selector de unidad
    let opts='';
    mods.forEach(m=>{ (m.unidades||[]).forEach(uid=>{
      const u=unidadesById[uid]; const nom=(u&&(u.codigo||u.titulo))||uid;
      opts+=`<option value="${escAttr(uid)}"${uid===unidad?' selected':''}>${escHtml(nom)}</option>`;
    }); });
    const lista=(temarioByUnit[unidad]||[]);
    let h=`<button class="backbtn" onclick="openTeacher()" style="margin-bottom:12px">← Panel</button>
      <h2 style="font-size:1.1rem;font-weight:800;color:var(--navy);margin:2px 2px 6px">📚 Temario</h2>
      <p style="font-size:.85rem;color:var(--ink-soft);margin-bottom:12px">Sube apuntes, temas o ejercicios. El alumno los verá y descargará dentro de cada unidad.</p>
      <button onclick="driveAbrir()" style="width:100%;background:#fff;border:1.5px solid var(--line);color:var(--navy);font-weight:700;border-radius:12px;padding:10px;margin-bottom:12px;cursor:pointer;font-family:inherit;font-size:.82rem">📁 Abrir Drive (subir/descargar materiales)</button>
      <label style="font-size:.75rem;color:var(--ink-soft)">Unidad</label>
      <select id="tem-unidad" style="width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:10px;margin:4px 0 14px;font-size:.9rem;background:#fff">${opts}</select>
      <div style="border:1.5px solid var(--honey);background:var(--honey-tint);border-radius:14px;padding:14px;margin-bottom:16px">
        <label style="font-size:.75rem;color:var(--ink-soft)">Título</label>
        <input id="tem-tit" placeholder="Ej.: Apuntes tema 1" style="width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:8px;margin:3px 0 8px;box-sizing:border-box">
        <label style="font-size:.75rem;color:var(--ink-soft)">Nota (opcional)</label>
        <input id="tem-nota" placeholder="Breve descripción" style="width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:8px;margin:3px 0 8px;box-sizing:border-box">
        <input type="file" id="tem-file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" style="width:100%;font-size:.82rem;margin:4px 0 10px">
        <button class="btn btn-honey" id="tem-subir" style="width:100%">Subir material</button>
        <div id="tem-status" style="font-size:.8rem;text-align:center;margin-top:8px;min-height:18px"></div>
      </div>
      <h3 style="font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--ink-soft);margin:4px 2px 8px">Materiales de esta unidad (${lista.length})</h3>`;
    if(!lista.length) h+=`<p class="sa-empty" style="font-size:.85rem">Aún no has subido nada a esta unidad.</p>`;
    lista.forEach(t=>{
      h+=`<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div style="min-width:0"><b style="font-size:.9rem">${escHtml(t.titulo||t.archivo_nombre)}</b>${t.nota?`<br><span style="font-size:.78rem;color:var(--ink-soft)">${escHtml(t.nota)}</span>`:''}<br><span style="font-size:.72rem;color:var(--ink-soft)">${escHtml(t.archivo_nombre||'')}</span></div>
          <span style="display:flex;gap:6px;flex:0 0 auto">
            <button onclick="temarioDescargar('${escAttr(t.archivo_path)}','${escAttr(t.archivo_nombre||'')}')" style="background:#eef0fb;border:1px solid #c9cef0;border-radius:8px;padding:5px 8px;cursor:pointer">⬇</button>
            <button onclick="temarioBorrar('${t.id}','${escAttr(t.archivo_path)}')" style="background:#fdeaea;border:1px solid #f3c4c4;border-radius:8px;padding:5px 8px;cursor:pointer">🗑</button>
          </span>
        </div>
      </div>`;
    });
    $('teacher').innerHTML=h;
    $('tem-unidad').onchange=(e)=>renderTemarioProfesor(e.target.value);
    $('tem-subir').onclick=async ()=>{
      const f=$('tem-file').files[0];
      if(!f){ $('tem-status').textContent='Elige un archivo primero.'; return; }
      if(f.size>25*1024*1024){ $('tem-status').textContent='Máximo 25 MB por archivo.'; return; }
      $('tem-status').textContent='Subiendo…'; $('tem-subir').disabled=true;
      try{
        await temarioSubir(unidad, f, $('tem-tit').value.trim(), $('tem-nota').value.trim());
        $('tem-status').textContent='✅ Subido.';
        renderTemarioProfesor(unidad);
      }catch(e){ $('tem-status').textContent='❌ '+(e.message||'Error'); $('tem-subir').disabled=false; }
    };
  });
}


function appCertPicker(){
  return new Promise(res=>{
    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;';
    const box=document.createElement('div');
    box.style.cssText='background:#fff;border-radius:16px;max-width:460px;width:100%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 18px 50px rgba(0,0,0,.25);overflow:hidden;';
    const head=document.createElement('div');
    head.style.cssText='padding:16px 18px 10px;font-size:.95rem;font-weight:700;color:var(--ink,#1e293b);border-bottom:1px solid var(--line,#eef0f4);';
    head.textContent='Acceso del profesor · elige el certificado';
    const listWrap=document.createElement('div');
    listWrap.style.cssText='overflow-y:auto;padding:6px 0;flex:1;';
    const done=v=>{ ov.remove(); res(v); };
    const row=(codigo,nombre,id)=>{
      const r=document.createElement('button'); r.type='button';
      r.style.cssText='display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:13px 18px;border:none;background:#fff;cursor:pointer;font-family:inherit;border-bottom:1px solid var(--line,#f1f3f7);';
      const dot=document.createElement('span');
      dot.style.cssText='flex:0 0 20px;width:20px;height:20px;border:2px solid var(--navy,#2e3163);border-radius:50%;';
      const txt=document.createElement('span');
      txt.style.cssText='font-size:.9rem;color:var(--ink,#1e293b);line-height:1.35;';
      txt.innerHTML='<b>'+codigo+'</b> · '+nombre;
      r.appendChild(dot); r.appendChild(txt);
      r.onclick=()=>done({id:id,codigo:codigo,nombre:nombre});
      return r;
    };
    // Aula Abierta arriba
    listWrap.appendChild(row('AULA','Aula Abierta','aula_abierta'));
    // Catálogo agrupado por familia
    for(const g of CERT_CATEGORIAS){
      const h=document.createElement('div');
      h.style.cssText='padding:10px 18px 4px;font-size:.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink-soft,#6b7280);background:#faf9f6;';
      h.textContent=g.cat;
      listWrap.appendChild(h);
      for(const c of g.certs){
        listWrap.appendChild(row(c.codigo, c.nombre, c.id.replace(/^__/,'')));
      }
    }
    const foot=document.createElement('div');
    foot.style.cssText='padding:12px 18px;border-top:1px solid var(--line,#eef0f4);display:flex;justify-content:flex-end;';
    const cancel=document.createElement('button'); cancel.type='button'; cancel.textContent='Cancelar';
    cancel.style.cssText='padding:9px 16px;border-radius:10px;font-size:.85rem;font-weight:700;cursor:pointer;font-family:inherit;border:1.5px solid var(--line,#cbd5e1);background:#fff;color:var(--ink,#1e293b);';
    cancel.onclick=()=>done(null);
    foot.appendChild(cancel);
    box.appendChild(head); box.appendChild(listWrap); box.appendChild(foot);
    ov.appendChild(box); document.body.appendChild(ov);
  });
}

function certBD(){
  const id = window._activeCertId;
  if(CERT_BD[id]) return CERT_BD[id];
  // Portal dinámico: certificado de la BD sin catálogo frontend (ej. adgn0210)
  if(id && id.indexOf('__')===0 && id!=='__adgg0508') return id.slice(2);
  return 'adgg0508';
}
// En impersonación (admin viendo el panel de un profe) inyecta su id para filtrar lecturas.
function impProf(body){ return window._saImpersonaProf ? {...body, p_como_profesor: window._saImpersonaProf} : body; }

// Set de IDs de unidad que pertenecen al certificado activo (según getModulos)
function unidadesDelCert(){
  const ids = new Set();
  getModulos().forEach(m=>{
    if(m.locked) return;            // módulos "Próximamente" no aportan unidades
    (m.unidades||[]).forEach(u=>ids.add(u));
  });
  return ids;
}

// ¿La unidad uid pertenece al certificado activo?
function unidadEnCert(uid){
  return unidadesDelCert().has(uid);
}
// Unidades que se pueden elegir al crear un examen: las que ya tienen exámenes
// + TODAS las del certificado activo, aunque todavía no tengan ninguno (para
// poder crear el primer examen de una materia recién dada de alta).
function unidadesParaCrearExamen(){
  const conExamenes = Object.keys(examsByUnit).filter(u=>(examsByUnit[u]||[]).length && unidadEnCert(u));
  const delCert = Array.from(unidadesDelCert());
  return Array.from(new Set([...conExamenes, ...delCert])).sort();
}

// Lista de todas las clases de tema para poder limpiarlas
const _TODOS_TEMAS = ['tema-aula-abierta','tema-adgg0408','tema-adgd0210','tema-adgd0308','tema-adgd0208','tema-comt0112','tema-comv0108','tema-comt0411','tema-coml0110','tema-ifct0109','tema-ifcd0110','tema-ifct0209','tema-ifcd0210','tema-sscs0208','tema-sscs0108','tema-ssce0110','tema-sant0108','tema-hotr0208','tema-hotr0408','tema-tmvg0209'];

function applyTema(certId){
  document.body.classList.remove(..._TODOS_TEMAS);
  const tema = CERT_TEMA[certId];
  if(tema) document.body.classList.add(tema);
}

function logout(){
  limpiarSesion();
  token=null; refreshToken=null; userEmail=''; userName=''; userRol=''; userId=''; userAcademia=null; userProfesorId=null; unidadesById={}; examsByUnit={}; attemptsByExam={}; falladasByUnit={}; entregasByExam={};
  window._saImpersona=false; window._saImpersonaProf=null; window._saImpersonaAcademia=null;
  window._activeCertId=null; window._certCodigo=''; window._certNombre=''; window._aulaAbiertaDemo=false;
  document.body.classList.remove(..._TODOS_TEMAS);
  $('app').classList.add('hidden');
  $('login').classList.add('hidden');
  $('login').classList.remove('aula-celeste');
  $('portal').classList.remove('hidden');
  $('pass').value=''; $('email').value='';
  authMode='login'; applyAuthLabels();
  ['home','module','unit','exam','result','teacher'].forEach(id=>$(id).innerHTML='');
}

// ============ CARGA ============
async function loadData(){
  showView('home');
  $('home').innerHTML='<div class="loader"><span class="spin"></span></div>';
  // Modo mantenimiento: si está 'on' y NO eres admin, bloqueo total.
  if(userEmail!=='admin@evaluatest.com'){
    try{
      const m=await call('/rest/v1/config_app?select=valor&clave=eq.mantenimiento',{auth:true});
      if(m&&m[0]&&m[0].valor==='on'){
        showView('home');
        $('home').innerHTML=`<div style="max-width:440px;margin:40px auto;text-align:center;padding:0 20px">
          <div style="font-size:3rem;margin-bottom:12px">🛠️</div>
          <h1 style="font-size:1.3rem;color:var(--navy);margin-bottom:10px">Estamos mejorando la plataforma</h1>
          <p style="color:var(--ink-soft);line-height:1.6">Tu profesor está preparando el material. Vuelve a intentarlo en unos minutos.</p>
          <button class="btn btn-ghost" style="margin-top:18px" onclick="logout()">Volver</button>
        </div>`;
        return;
      }
    }catch(e){}
  }
  try{
    // Función con reintento automático (hasta 3 veces)
    const fetchR = async (path, opts) => {
      for(let i=0; i<3; i++){
        try{ const r=await call(path,opts); if(r!==null) return r; }
        catch(e){ if(i===2) throw e; await new Promise(r=>setTimeout(r,700*(i+1))); }
      }
      return [];
    };

    // ── FASE 1: datos mínimos para mostrar la UI ──
    const [unidades, examenes, perfil] = await Promise.all([
      fetchR('/rest/v1/unidades?select=id,codigo,titulo,modulo,orden,certificado_id,profesor_id&order=orden.asc').catch(()=>fetchR('/rest/v1/unidades?select=id,codigo,titulo,modulo,orden,certificado_id&order=orden.asc')).catch(()=>fetchR('/rest/v1/unidades?select=id,codigo,titulo,modulo,orden&order=orden.asc')),
      fetchR('/rest/v1/examenes?select=id,unidad,numero,titulo,tema,nivel,orden,cuenta_final,academia_id,profesor_id,material_url,material_modo&order=orden.asc').catch(()=>fetchR('/rest/v1/examenes?select=id,unidad,numero,titulo,tema,nivel,orden,cuenta_final,academia_id,material_url,material_modo&order=orden.asc')).catch(()=>fetchR('/rest/v1/examenes?select=id,unidad,numero,titulo,tema,nivel,orden,cuenta_final,academia_id&order=orden.asc')),
      fetchR('/rest/v1/perfiles?select=id,nombre,rol,academia_id,profesor_id').catch(()=>fetchR('/rest/v1/perfiles?select=id,nombre,rol,academia_id')),
    ]);

    userId=(perfil&&perfil[0]&&perfil[0].id)?perfil[0].id:'';
    userName=(perfil&&perfil[0]&&perfil[0].nombre)?perfil[0].nombre:'';
    if(!window._saImpersona){
      userRol=(perfil&&perfil[0]&&perfil[0].rol)?perfil[0].rol:'';
      userAcademia=(perfil&&perfil[0]&&perfil[0].academia_id!=null)?perfil[0].academia_id:null;
      userProfesorId=(perfil&&perfil[0]&&perfil[0].profesor_id)?perfil[0].profesor_id:null;
    }
    // Nombre personalizado de la pastilla en Aula Abierta (columna nombre_aula_abierta)
    window._aulaNombre='';
    if(window._activeCertId==='__aula_abierta'){
      try{
        const acad=await call('/rest/v1/academia?select=nombre_aula_abierta&limit=1');
        if(acad&&acad[0]&&acad[0].nombre_aula_abierta) window._aulaNombre=acad[0].nombre_aula_abierta;
      }catch(e){}
    }
    unidadesById={}; unidades.forEach(u=>{ u.estado='activo'; u.ver_megatest=true; u.ver_falladas=true; unidadesById[u.id]=u; });
    const _certAct=certBD();
    examsByUnit={}; examenes.forEach(e=>{ const id=String(e.id); if(id.startsWith('repaso-')||id.startsWith('falladas-')) return; if(!examVisible(e)) return; const _u=unidadesById[e.unidad]; if(_u && _u.certificado_id && _u.certificado_id!==_certAct) return; e.tipo='test'; e.publicado=true; (examsByUnit[e.unidad]=examsByUnit[e.unidad]||[]).push(e); });
    attemptsByExam={}; entregasByExam={}; falladasByUnit={};
    // Si es profesor/admin, ir directamente al Área Docente (así sus datos
    // de clase empiezan a cargar ya mismo, en vez de esperar a que entre
    // primero en un módulo y una UF). Los alumnos siguen viendo el Home normal.
    if(window._saImpersona){ openTeacher(); } else if(userEmail==='admin@evaluatest.com'){ openSuperadmin(); } else if(isStaff()){ openTeacher(); } else { renderHome(); } // Mostrar UI inmediatamente

    // ── FASE 2: datos de progreso (sin bloquear si fallan) ──
    const [intentos, falladas, estados, tipos, pubAcad, entregas] = await Promise.all([
      fetchR('/rest/v1/intentos?select=id,examen_id,correctas,total,creado_en&order=creado_en.asc'),
      call('/rest/v1/rpc/resumen_falladas',{method:'POST',body:{}}).catch(()=>[]),
      call('/rest/v1/rpc/estados_de_certificado',{method:'POST',body:impProf({p_certificado_id:certBD()})}).catch(()=>null),
      call('/rest/v1/examenes?select=id,tipo').catch(()=>null),
      call('/rest/v1/rpc/examenes_publicados_academia',{method:'POST',body:impProf({})}).catch(()=>[]),
      call('/rest/v1/entregas?select=examen_id,estado,nota,user_id').catch(()=>null),
    ]);

    estadosLocales={};
    if(estados) estados.forEach(r=>{
      estadosLocales[r.unidad_id]=r.estado||'activo';
      const u=unidadesById[r.unidad_id];
      if(u){ u.estado=r.estado||'activo'; if(r.ver_megatest!==undefined) u.ver_megatest=r.ver_megatest; if(r.ver_falladas!==undefined) u.ver_falladas=r.ver_falladas; }
    });
    const tipoMap={}, pubMap={};
    if(tipos) tipos.forEach(r=>{ tipoMap[r.id]=r.tipo||'test'; });
    // Publicación POR ACADEMIA: la fuente de verdad es academia_examen_estado.
    // Si un examen no tiene fila para esta academia => oculto por defecto.
    if(pubAcad) pubAcad.forEach(r=>{ pubMap[r.examen_id]=!!r.publicado; });
    examenes.forEach(e=>{ e.tipo=tipoMap[e.id]||'test'; e.publicado=(pubMap[e.id]===true); });
    entregasByExam={}; if(entregas) entregas.forEach(en=>{ if(!userId||en.user_id===userId) entregasByExam[en.examen_id]={estado:en.estado,nota:en.nota}; });
    attemptsByExam={}; (intentos||[]).forEach(a=>registrarIntento(a.examen_id,a.correctas,a.total,a.id,a.creado_en));
    window._misIntentos=(intentos||[]).filter(a=>!/^(repaso-|falladas-)/.test(String(a.examen_id)));
    falladasByUnit={}; (falladas||[]).forEach(r=>{ falladasByUnit[r.unidad]=r.n; });
    await cargarTemario();
    // Para alumnos, repintar Home con datos completos. Para profesores, NO repintar
    // aquí: openTeacher() ya gestiona su propio repintado cuando sus datos llegan,
    // y si el profesor ya está viendo una UF dentro de "Módulos" no queremos sacarlo de ahí.
    if(!isStaff()){ renderHome(); } // Re-renderizar con datos completos
    else if(current.unit && teacherView==='unit'){ openUnit(current.unit); }
    if(userEmail==='admin@evaluatest.com') gxAvisoInicio();

  }catch(err){
    $('home').innerHTML=`<div class="center-msg">No se pudieron cargar los contenidos.<br><small>${err.message}</small><br><br><button class="btn btn-primary" onclick="loadData()" style="background:var(--navy);border:none;padding:10px 24px;border-radius:10px;cursor:pointer;font-weight:700;color:#fff">🔄 Reintentar</button></div>`;
  }
}
// Registra un intento: guarda la MEJOR nota (por porcentaje) y cuenta intentos
function registrarIntento(examId, correctas, total, id, creado_en){
  const a=attemptsByExam[examId]||{count:0,mejor:0,total:total||0,id:null,creado_en:null};
  a.count++;
  const prev=a.total>0?a.mejor/a.total:-1, now=total>0?correctas/total:-1;
  if(now>=prev){ a.mejor=correctas; a.total=total; a.id=id||null; a.creado_en=creado_en||null; }
  attemptsByExam[examId]=a;
}

// ============ HOME (certificado + módulos) ============
// Cache de estados por unidad (incluye UFs que no están en la tabla unidades)
function unitEstado(uid){
  if(estadosLocales[uid]) return estadosLocales[uid];
  const u=unidadesById[uid];
  if(u && u.estado) return u.estado;
  return 'proximamente';
}
function isStaff(){ return userRol==='profesor'||userRol==='admin'; }
function mediaMisTodos(unitId){
  const ids=new Set((examsByUnit[unitId]||[]).map(e=>String(e.id)));
  const rel=(window._misIntentos||[]).filter(a=>ids.has(String(a.examen_id)) && a.total>0);
  if(!rel.length) return null;
  const notas=rel.map(a=>a.correctas/a.total*10);
  return notas.reduce((x,y)=>x+y,0)/notas.length;
}
function estLabel(s){ return s==='activo'?'Activo':s==='terminado'?'Terminado':'Próximamente'; }
function estCls(s){ return s==='activo'?'active':s==='terminado'?'done':''; }
function moduleEstado(m){
  const ests=m.unidades.map(unitEstado);
  if(ests.some(e=>e==='activo')) return 'activo';
  if(ests.some(e=>e==='terminado')) return 'terminado';
  return 'proximamente';
}
// Genera el HTML de las tarjetas de módulo (reutilizado en renderHome y en la pestaña
// "Módulos" del panel docente, para que profesor y alumno vean exactamente lo mismo).
function renderModulosCardsHtml(conBorrar){
  const mods = getModulos();
  if(!mods.length) return '<div class="center-msg" style="padding:40px 16px">Este certificado aún no tiene módulos ni contenidos.<br><small>Aparecerán aquí cuando se den de alta sus unidades.</small></div>';
  let html='';
  mods.forEach(m=>{
    const esMateriaAA = conBorrar && String(m.id).indexOf('mod-aula-')===0 && m.unidades && m.unidades.length;
    const uidMat = esMateriaAA ? m.unidades[0] : '';
    const wrapIni = esMateriaAA ? '<div class="mat-wrap" style="position:relative">' : '';
    const wrapFin = esMateriaAA ? `<button class="mat-del" data-delmat="${escAttr(uidMat)}" data-mattit="${escAttr(m.title)}" title="Borrar materia" style="position:absolute;top:10px;right:10px;z-index:3;background:#fdeaea;border:1.5px solid #f3c4c4;border-radius:10px;padding:5px 8px;cursor:pointer;font-size:.85rem;line-height:1">🗑</button></div>` : '';
    html+=wrapIni;
    if(m.locked){
      // Módulo en preparación — navegable: se puede entrar a ver sus UF
      html+=`<button class="mod soon" data-mod="${m.id}" type="button">
          <div class="mod-top"><span class="chip eye">${m.eye}</span><span class="chip state">Próximamente</span></div>
          <h2>${m.code} · ${m.title}</h2>
          <p>${m.desc}</p>
          <div class="mod-lock-badge">🔒 Banco de preguntas en preparación</div>
        </button>`;
    } else {
      const est=moduleEstado(m);
      const accent = est==='activo'?'navy':(est==='proximamente'?'soon':'');
      const st=`<span class="chip state ${estCls(est)}"${esMateriaAA?' style="margin-right:46px"':''}>${estLabel(est)}</span>`;
      html+=`<button class="mod ${accent}" data-mod="${m.id}" type="button">
          <div class="mod-top"><span class="chip eye">${m.eye}</span>${st}</div>
          <h2>${m.code} · ${m.title}</h2>
          <p>${m.desc}</p>
        </button>`;
    }
    html+=wrapFin;
  });
  return html;
}

function renderHome(){
  const esAula = window._activeCertId==='__aula_abierta';
  const modsAula = esAula ? getModulos() : null;
  const certNombre = window._certNombre || '';
  let html;
  if(esAula){
    // Nombre de la materia a la izquierda; pastilla "Aula Abierta" a la derecha
    // (con las dos A en azul), igual que en el panel docente.
    const materia = (modsAula && modsAula.length===1) ? modsAula[0].title : 'Materias propias';
    html=`<div class="cert">
        <div class="cert-top">
          <h1>${escHtml(materia)}</h1>
          <div class="cert-code"><span style="color:#2e3163">A</span>ula <span style="color:#2e3163">A</span>bierta</div>
        </div>
        <div class="sub">Materias propias / Exámenes libres</div>
      </div>`;
  }else{
    const certCodigo = window._certCodigo || 'ADGG0508';
    html=`<div class="cert">
        <div class="cert-top">
          <h1>Certificado de Profesionalidad</h1>
          <div class="cert-code">${certCodigo||'ADGG0508'}</div>
        </div>
        <div class="sub">${certNombre||''}</div>
      </div>`;
  }
  html+=renderModulosCardsHtml();
  if(isStaff()) html+=`<div class="dash-teacher-row">
      <button class="admin-card" id="dash-open-teacher" type="button" aria-label="Acceso Docente — entrar al Panel del Profesor">
        <span class="admin-left">
          <span class="admin-title">Acceso Docente</span>
          <span class="admin-sub">Gestión de exámenes, alumnado y resultados</span>
        </span>
        <span class="admin-hex" aria-hidden="true">
          <img class="admin-hex-img" src="data:image/png;base64,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" alt=""/>
        </span>
      </button>
    </div>`;
  $('home').innerHTML=html;
  document.querySelectorAll('.mod[data-mod]').forEach(b=> b.onclick=()=>openModule(b.dataset.mod));
  const teacherBtn=$('dash-open-teacher');
  if(teacherBtn) teacherBtn.onclick=openTeacher;
}

// Acceso Docente — panel del profesor (resultados del alumnado)
function fmtShort(d){const p=n=>String(n).padStart(2,'0');const m=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];return d.getDate()+' '+m[d.getMonth()]+' '+d.getFullYear()+' · '+p(d.getHours())+':'+p(d.getMinutes());}
let teacherRows=[], teacherMode='best', teacherById={};
let resumenRows=null, teacherView='panel', teacherAl=null, alumnosTab='listado', pendientesCount=0, teacherUnidadSel=null, teacherSortBy='mejor';
async function openTeacher(){
  showView('teacher'); window.scrollTo(0,0);
  // Guard de seguridad: si no es profesor/admin, NO pintar el panel.
  if(!isStaff()){
    $('teacher').innerHTML=`<button class="backbtn" onclick="goHome()">← Inicio</button>
      <div class="center-msg">Esta sección es solo para el profesorado.<br><small>Inicia sesión con una cuenta de profesor.</small></div>`;
    return;
  }
  $('teacher').innerHTML='<button class="backbtn" onclick="goHome()">← Inicio</button><div class="loader"><span class="spin"></span></div>';

  const fetchR = async (path, opts) => {
    for(let i=0; i<3; i++){
      try{ const r=await call(path,opts); if(r!==null) return r; }
      catch(e){ if(i===2) throw e; await new Promise(r=>setTimeout(r,800*(i+1))); }
    }
    return [];
  };

  try{
    // Fase 1: mostrar panel inmediatamente con datos mínimos
    const pend = await call('/rest/v1/entregas?select=id&estado=eq.pendiente').catch(()=>null);
    pendientesCount = Array.isArray(pend)?pend.length:0;
    teacherRows=[]; resumenRows=null;
    teacherMode='best'; teacherView='panel';
    pintarTeacher(); // Panel visible de inmediato

    // Fase 2: cargar datos pesados con reintento
    const [det, res] = await Promise.all([
      fetchR('/rest/v1/rpc/resultados_alumnado',{method:'POST',body:impProf({p_certificado_id:certBD()})}),
      call('/rest/v1/rpc/resumen_alumnado',{method:'POST',body:impProf({p_certificado_id:certBD()})}).catch(()=>null),
    ]);
    teacherRows=(det||[]).map(r=>{
      // resultados_alumnado devuelve alumno = "Nombre|email".
      // La clave común con el resumen es el EMAIL (tras el pipe).
      const raw=(r.alumno||'')+'';
      const pipe=raw.lastIndexOf('|');
      const nombre=pipe>=0 ? raw.slice(0,pipe).trim() : '';
      const email=(pipe>=0 ? raw.slice(pipe+1) : raw).toLowerCase().trim();
      return {...r, alumno_email:email, alumno:email, _nombre:nombre};
    })
    // Cinturón de seguridad ESTANCO: por si el RPC no filtra bien en el servidor.
    // 1) sin unidad => fuera (antes se colaban y arrastraban alumnos de otro cert).
    // 2) AA solo admite unidades 'aula-*'; EV nunca admite 'aula-*'.
    // 3) además la unidad debe pertenecer al certificado/materias activas.
    .filter(r=>{
      const u=String(r.unidad||'');
      if(!u) return false;
      const rowEsAula = u.indexOf('aula-')===0;
      const esAA = window._activeCertId==='__aula_abierta';
      if(esAA!==rowEsAula) return false;
      return unidadEnCert(u);
    });
    const emailsDelCert=new Set(teacherRows.map(r=>r.alumno_email));
    resumenRows=(res||[]).map(x=>{
      const email=((x.email||x.alumno||'')+'').toLowerCase().trim();
      return {...x, alumno:email, email, _nombre:((x.nombre||'')+'').trim()};
    })
    // Mismo cinturón de seguridad: solo alumnos con al menos un intento real
    // dentro de este certificado (resumen_alumnado es un agregado sin unidad,
    // así que lo cruzamos contra teacherRows, que sí la tiene).
    .filter(x=>emailsDelCert.has(x.email));
    // Nº de alumnos REALMENTE registrados (cuentas que existen en esta academia),
    // para la tarjeta "Registrados". Es distinto de "con actividad": incluye a los
    // que se registraron pero aún no han hecho ningún examen, y a los colados sin
    // autorizar. Si la RPC aún no existe, la tarjeta cae al conteo anterior.
    try{
      const reg=await call('/rest/v1/rpc/listar_registrados',{method:'POST',body:impProf({})});
      window._nRegistrados = Array.isArray(reg) ? reg.length : null;
    }catch(e){ window._nRegistrados = null; }
    window._teacherDataReady=true;
    pintarTeacher(); // Re-renderizar con datos completos
    // Si el profesor estaba viendo una UF específica, re-renderizarla con datos reales
    if(current.unit && teacherView==='unit') openUnit(current.unit);

  }catch(err){
    const noauth=/docente|denied|permission|policy|not authenticated|no autenticado/i.test(err.message||'');
    $('teacher').innerHTML=`<button class="backbtn" onclick="goHome()">← Inicio</button>
      <div class="center-msg">${noauth
        ?'Esta sección es solo para el profesorado.<br><small>Inicia sesión con una cuenta de profesor.</small>'
        :'No se pudieron cargar los resultados.<br><small>'+(err.message||'')+'</small><br><br><button class="btn btn-primary" onclick="openTeacher()" style="background:var(--navy);border:none;padding:10px 24px;border-radius:10px;cursor:pointer;font-weight:700;color:#fff">🔄 Reintentar</button>'
      }</div>`;
  }
}
function setTeacherMode(m){ teacherMode=m; if(teacherView==='alumno'&&teacherAl){ openAlumnoDetalle(teacherAl); } else { pintarTeacher(); } }
function tRow(r, exLabel, sub){
  const pass=!!r.apto;
  teacherById[r.id]={alumno:r.alumno,alumno_email:r.alumno_email||r.alumno,nombre:r._nombre||r.nombre||'',label:exLabel,porcentaje:r.porcentaje,apto:r.apto};
  return `<button class="t-row" data-int="${r.id}">
      <span class="t-cell ${pass?'ok':'no'}">${r.correctas}/${r.total}</span>
      <span class="t-meta"><span class="t-ex">${exLabel}</span><span class="t-date">${sub}</span></span>
      <span class="t-badge ${pass?'ok':'no'}">${r.porcentaje}%</span>
      <span class="arrow">›</span>
    </button>`;
}
function ufEx(r){
  const uf=(r.unidad&&unidadesById[r.unidad])?unidadesById[r.unidad].codigo:(r.unidad||'').toUpperCase();
  return (uf?uf+' · ':'')+(r.examen||'—');
}

// ── Filtro por unidad + medias por unidad (Opción 1: promedio de notas) ──
// Devuelve las unidades presentes en una lista de intentos, en orden.
function unidadesDeIntentos(list){
  const seen=[]; const set=new Set();
  (list||[]).forEach(r=>{ const u=r.unidad||''; if(u && !set.has(u)){ set.add(u); seen.push(u); } });
  // Ordenar por código legible (UF0510, UF0511...)
  seen.sort((a,b)=>{
    const ca=(unidadesById[a]&&unidadesById[a].codigo)||a, cb=(unidadesById[b]&&unidadesById[b].codigo)||b;
    return (''+ca).localeCompare(''+cb,'es');
  });
  return seen;
}
function codigoUnidad(u){ return (unidadesById[u]&&unidadesById[u].codigo)||(''+u).toUpperCase(); }
// Intentos "fantasma" (mega test de repaso / preguntas falladas): son herramientas
// de estudio, NO exámenes, así que nunca cuentan para las medias.
function esIntentoFantasma(r){
  // Herramientas de repaso: nunca cuentan para medias ni rankings.
  // Se detectan por id (repaso-*/falladas-*, cubre las 2 partes del megatest)
  // y, como red de seguridad, por prefijo del título.
  const id=((r&&r.examen_id)||'')+'';
  if(id.startsWith('repaso-')||id.startsWith('falladas-')) return true;
  const t=((r&&r.examen)||'')+'';
  return t.startsWith('Mega test de repaso') || t.startsWith('Preguntas falladas');
}
// Media = promedio de la NOTA (0-10) del MEJOR intento de cada examen de la unidad.
// Si unidad es null/'', calcula sobre todos los exámenes (todas las unidades).
function mediaPorUnidad(list, unidad){
  const rel=(list||[]).filter(r=> !esIntentoFantasma(r) && (!unidad || r.unidad===unidad));
  if(!rel.length) return null;
  // Mejor intento por examen (clave: unidad|examen)
  const best={};
  rel.forEach(r=>{
    const k=(r.unidad||'')+'|'+(r.examen||'');
    const nota=r.total? (r.correctas/r.total*10) : 0;
    if(best[k]===undefined || nota>best[k]) best[k]=nota;
  });
  const notas=Object.values(best);
  if(!notas.length) return null;
  return notas.reduce((a,b)=>a+b,0)/notas.length;
}
// Averigua qué exámenes cuentan para la nota final (por título), mirando examsByUnit.
// teacherRows no trae cuenta_final, así que lo cruzamos por el título del examen.
function _titulosFinales(){
  const set=new Set();
  Object.values(examsByUnit).forEach(arr=>(arr||[]).forEach(e=>{ if(e.cuenta_final && e.titulo) set.add(e.titulo); }));
  return set;
}
// Media FINAL = igual que mediaPorUnidad pero solo con exámenes que cuentan para nota.
function mediaFinalPorUnidad(list, unidad){
  const finales=_titulosFinales();
  const rel=(list||[]).filter(r=> !esIntentoFantasma(r) && (!unidad || r.unidad===unidad) && finales.has(r.examen));
  if(!rel.length) return null;
  const best={};
  rel.forEach(r=>{
    const k=(r.unidad||'')+'|'+(r.examen||'');
    const nota=r.total? (r.correctas/r.total*10) : 0;
    if(best[k]===undefined || nota>best[k]) best[k]=nota;
  });
  const notas=Object.values(best);
  if(!notas.length) return null;
  return notas.reduce((a,b)=>a+b,0)/notas.length;
}

// Media "todos los intentos": promedio de la nota (0-10) de CADA intento
// realizado (no solo el mejor). Más realista: refleja la constancia.
function mediaTodosIntentos(list, unidad){
  const rel=(list||[]).filter(r=> !esIntentoFantasma(r) && (!unidad || r.unidad===unidad) && r.total>0);
  if(!rel.length) return null;
  const notas=rel.map(r=> r.correctas/r.total*10);
  return notas.reduce((a,b)=>a+b,0)/notas.length;
}

// ---- Alumnos en línea (con intento en los últimos 10 minutos) ----
async function fetchOnlineCount(){
  try{
    const hace10=new Date(Date.now()-5*60*1000).toISOString();
    // Contamos user_id distintos con actividad en intentos recientes
    const rows=await call(
      '/rest/v1/intentos?select=user_id&creado_en=gte.'+encodeURIComponent(hace10),
      {auth:true}
    ).catch(()=>null);
    if(!Array.isArray(rows)) return 0;
    // Deduplicar por user_id
    return new Set(rows.map(r=>r.user_id)).size;
  }catch(e){ return 0; }
}
// ============ PANEL SUPERADMIN (solo admin@evaluatest.com) ============
let saAcademias=[], saSelAcad=null, saUsuarios=[], saExamenes=[], saTab='profes', saMainTab='ev', saProfExp=null, saExamProf={};
async function saToggleProf(profId){
  if(saProfExp===profId){ saProfExp=null; saDetalle(); return; }
  saProfExp=profId;
  if(!saExamProf[profId]){
    try{ saExamProf[profId]=await call('/rest/v1/rpc/sa_examenes_profesor',{method:'POST',body:{p_profesor:profId}})||[]; }
    catch(e){ saExamProf[profId]=[]; }
  }
  saDetalle();
}
function saSetTab(t){ saTab=t; saDetalle(); }
function saSetMain(t){
  if(t==='fact'){ window._factSub=null; pxEdit=null; }
  if(t==='rs'){ window._rsSub=null; window._enPresu=false; pxEdit=null; }
  saMainTab=t; saSelAcad=null; guardarPanel();
  // Si ya tenemos los datos cargados, pintar directo (no re-consultar: evitaba
  // que la vista se quedara colgada en el spinner esperando a Supabase).
  if(saAcademias && saAcademias.length){ showView('teacher'); teacherView='superadmin'; window.scrollTo(0,0); saRenderLista(); return; }
  openSuperadmin();
}
async function openSuperadmin(okMsg,errMsg){
  showView('teacher'); window.scrollTo(0,0);
  teacherView='superadmin';
  // Al recargar la página, volver a la pestaña donde estabas.
  if(!window._panelRestaurado){
    window._panelRestaurado=true;
    const p=leerPanel();
    if(p){
      saMainTab=p.main||'ev'; window._factSub=p.fsub||null;
      gxTab=p.gtab||'facturas'; window._rsSub=p.rsub||null; rsTab=p.rtab||'redactor';
    }
  }
  $('teacher').innerHTML=saShell('<div class="loader"><span class="spin"></span></div>');
  // Comprobar contratos vencidos (revoca automáticamente y avisa una sola vez).
  if(!window._contratosChequeados){
    window._contratosChequeados=true;
    try{
      const vencidos=await call('/rest/v1/rpc/sa_revocar_contratos_vencidos',{method:'POST',body:{}});
      if(vencidos && vencidos.length){
        const lista=vencidos.map(v=>'• '+(v.nombre||'#'+v.academia_id)+' (fin '+v.contrato_fin+')').join('\n');
        appAlert('⚠️ Contrato(s) finalizado(s) — se han revocado automáticamente para no facturar de más:\n\n'+lista);
      }
    }catch(e){}
  }
  try{
    saAcademias=await Promise.race([
      call('/rest/v1/rpc/sa_resumen',{method:'POST',body:{}}),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('El servidor tarda demasiado en responder.')),12000))
    ])||[];
  }catch(e){
    $('teacher').innerHTML=saShell(`<div class="t-note err">${escHtml(e.message||'Error')}</div>
      <button class="btn btn-primary" onclick="openSuperadmin()" style="margin-top:10px">🔄 Reintentar</button>`);
    return;
  }
  saRenderLista(okMsg,errMsg);
}
function avAreaActual(){
  if(saMainTab==='fact') return 'admin';
  if(saMainTab==='rs')   return 'comercial';
  return 'soporte';
}
// Módulo de avisos: campana por departamento. Admin ve TODO en lectura.
let avLista=null, avArch=[], avCargando=false;
async function avCargar(force){
  if(avLista && !force) return;
  if(avCargando) return;
  avCargando=true;
  try{
    const [av,ar]=await Promise.all([
      call('/rest/v1/rpc/sa_avisos',{method:'POST',body:{}}),
      call('/rest/v1/avisos_archivados?select=*&order=archivado_en.desc')
    ]);
    avLista=av||[]; avArch=ar||[];
  }catch(e){ avLista=[]; avArch=[]; }
  avCargando=false;
  avPintarBarra();
}
function avVisibles(area){
  const arch=new Set(avArch.map(a=>a.clave));
  return (avLista||[]).filter(a=>{
    if(arch.has(a.clave)) return false;
    if(area==='soporte') return true;        // Soporte (Ber) ve todo
    return a.area===area;
  });
}
function avPintarBarra(){
  const bar=$('av-bar'); if(!bar) return;
  const area=avAreaActual();
  const vis=avVisibles(area);
  const urgentes=vis.some(a=>a.urgente===true);
  const abierta=window._avAbierta;
  bar.innerHTML=`<button onclick="avToggle()" style="width:100%;display:flex;align-items:center;gap:8px;background:${vis.length?'var(--honey-tint)':'#f4f4f6'};border:1.5px solid ${vis.length?'var(--honey)':'var(--line)'};border-radius:11px;padding:9px 12px;cursor:pointer;font-family:inherit;color:var(--navy);font-weight:700;font-size:.82rem">
      <span style="position:relative">🔔${urgentes?'<span style="position:absolute;top:-3px;right:-5px;width:9px;height:9px;background:#e11d1d;border-radius:50%;border:1.5px solid #fff"></span>':''}</span>
      <span>Avisos</span>
      ${vis.length?`<span style="background:var(--honey);color:#fff;border-radius:9px;padding:0 7px;font-size:.72rem">${vis.length}</span>`:'<span style="color:var(--ink-soft);font-weight:600">al día</span>'}
      <span style="margin-left:auto;color:var(--ink-soft);font-size:.72rem">${abierta?'▲':'▼'}</span>
    </button>`;
  if(abierta) bar.innerHTML+=avPanel(area,vis);
}
function avPanel(area,vis){
  let h=`<div style="border:1.5px solid var(--line);border-top:0;border-radius:0 0 11px 11px;background:#fff;padding:10px 12px;margin-top:-3px">`;
  if(area==='soporte') h+=`<p style="font-size:.68rem;color:var(--ink-soft);margin:0 0 8px">Soporte ve los avisos de todas las áreas.</p>`;
  if(!vis.length){
    h+=`<p style="font-size:.8rem;color:var(--ink-soft);text-align:center;padding:6px 0">Nada pendiente. 👍</p>`;
  }else{
    vis.forEach(a=>{
      const et=area==='soporte'?`<span style="font-size:.6rem;font-weight:800;text-transform:uppercase;color:var(--ink-soft);letter-spacing:.5px;margin-right:5px">${a.area}</span>`:'';
      h+=`<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid var(--line)">
        <span style="flex:1;font-size:.78rem;color:${a.urgente?'#b4232a':'var(--ink)'}">${a.urgente?'⚠️ ':(a.icono||'•')+' '}${et}${escHtml(a.texto)}</span>
        <button onclick="avArchivar('${escAttr(a.clave)}')" title="Cerrar" style="flex:0 0 auto;background:#fff;border:1px solid var(--line);border-radius:6px;width:20px;height:20px;line-height:1;font-size:.72rem;color:var(--ink-soft);cursor:pointer;padding:0">✕</button>
      </div>`;
    });
  }
  const nArch=avArch.length;
  h+=`<button onclick="avVerArchivados()" style="width:100%;margin-top:9px;background:none;border:0;color:var(--ink-soft);font-size:.72rem;cursor:pointer;font-family:inherit;text-decoration:underline">Ver archivados${nArch?' ('+nArch+')':''}</button>`;
  return h+`</div>`;
}
function avToggle(){ window._avAbierta=!window._avAbierta; avPintarBarra(); }
async function avArchivar(clave){
  const a=(avLista||[]).find(x=>x.clave===clave);
  try{
    await call('/rest/v1/avisos_archivados',{method:'POST',body:{clave, texto:a?a.texto:'', tipo:a?a.area:''}});
    avArch.unshift({clave, texto:a?a.texto:'', tipo:a?a.area:'', archivado_en:new Date().toISOString()});
    avPintarBarra();
  }catch(e){ appAlert('No se pudo archivar: '+(e.message||'')); }
}
async function avVerArchivados(){
  let h=`<button class="backbtn" onclick="saSetMain(saMainTab)" style="margin-bottom:10px">← Volver</button>
    <h2 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:2px 2px 4px">🔔 Avisos archivados</h2>
    <p style="font-size:.74rem;color:var(--ink-soft);margin:0 2px 12px">Los avisos cerrados con ✕ se guardan aquí. Mientras estén archivados no reaparecen.</p>`;
  if(!avArch.length){ h+=`<p class="sa-empty">No hay avisos archivados.</p>`; }
  else avArch.forEach(a=>{
    const f=String(a.archivado_en||'').slice(0,10);
    h+=`<div style="border:1px solid var(--line);border-radius:10px;padding:9px 11px;margin-bottom:7px;background:#fff;display:flex;align-items:flex-start;gap:8px">
      <span style="flex:1;font-size:.78rem">${escHtml(a.texto||a.clave)}<br><span style="font-size:.68rem;color:var(--ink-soft)">${a.tipo?a.tipo+' · ':''}archivado el ${escHtml(f)}</span></span>
      <button onclick="avBorrar('${escAttr(String(a.id||a.clave))}','${escAttr(a.clave)}')" class="gx-mini del" style="flex:0 0 auto">🗑</button>
    </div>`;
  });
  $('teacher').innerHTML=saShell(h);
}
async function avBorrar(id,clave){
  if(!await appConfirm('¿Quitar este aviso archivado? Volverá a aparecer si la condición sigue activa.')) return;
  if(!await appConfirm('Se borrará PARA SIEMPRE del archivo. ¿Confirmas?')) return;
  try{
    if(id && id!==clave) await call('/rest/v1/avisos_archivados?id=eq.'+id,{method:'DELETE'});
    else await call('/rest/v1/avisos_archivados?clave=eq.'+encodeURIComponent(clave),{method:'DELETE'});
    avArch=avArch.filter(a=>a.clave!==clave);
    avVerArchivados();
  }catch(e){ appAlert('No se pudo borrar: '+(e.message||'')); }
}
// ── Avisos internos: mensajes directos entre departamentos (Raquel ↔ Ber ↔ Laura) ──
const AI_AREAS={soporte:'Soporte',admin:'Administración',comercial:'Comercial'};
let aiLista=null, aiCargando=false, aiDest='';
function aiArea(){ return avAreaActual(); }
async function aiCargar(force){
  if(aiLista && !force) return;
  if(aiCargando) return;
  aiCargando=true;
  try{ aiLista=await call('/rest/v1/avisos_internos?select=*&order=creado_en.desc')||[]; }
  catch(e){ aiLista=[]; }
  aiCargando=false;
  aiPintarBarra();
}
function aiVisibles(area){
  return (aiLista||[]).filter(a=> area==='soporte' ? true : (a.para_area===area || a.de_area===area));
}
function aiPintarBarra(){
  const bar=$('ai-bar'); if(!bar) return;
  const area=aiArea();
  const vis=aiVisibles(area);
  const nuevos=(aiLista||[]).filter(a=> a.para_area===area && !a.leido).length;
  const abierta=window._aiAbierta;
  bar.innerHTML=`<button onclick="aiToggle()" style="width:100%;display:flex;align-items:center;gap:8px;background:${nuevos?'#eaf3fb':'#f4f4f6'};border:1.5px solid ${nuevos?'#5aa9d6':'var(--line)'};border-radius:11px;padding:9px 12px;cursor:pointer;font-family:inherit;color:var(--navy);font-weight:700;font-size:.82rem">
      <span>✉️</span>
      <span>Avisos internos</span>
      ${nuevos?`<span style="background:#5aa9d6;color:#fff;border-radius:9px;padding:0 7px;font-size:.72rem">${nuevos}</span>`:'<span style="color:var(--ink-soft);font-weight:600">sin nuevos</span>'}
      <span style="margin-left:auto;color:var(--ink-soft);font-size:.72rem">${abierta?'▲':'▼'}</span>
    </button>`;
  if(abierta) bar.innerHTML+=aiPanel(area,vis);
}
function aiPanel(area,vis){
  const otras=Object.keys(AI_AREAS).filter(k=>k!==area);
  if(!otras.includes(aiDest)) aiDest=otras[0];
  let h=`<div style="border:1.5px solid var(--line);border-top:0;border-radius:0 0 11px 11px;background:#fff;padding:10px 12px;margin-top:-3px">`;
  h+=`<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:7px">
      <span style="font-size:.72rem;color:var(--ink-soft)">De <b style="color:var(--navy)">${AI_AREAS[area]}</b> para</span>
      <select id="ai-dest" onchange="aiDest=this.value" style="font-size:.74rem;padding:4px 6px;border:1px solid var(--line);border-radius:7px;font-family:inherit;color:var(--navy)">
        ${otras.map(k=>`<option value="${k}"${k===aiDest?' selected':''}>${AI_AREAS[k]}</option>`).join('')}
      </select></div>
    <textarea id="ai-texto" rows="2" placeholder="Escribe un aviso…" style="width:100%;box-sizing:border-box;font-size:.8rem;padding:7px 9px;border:1px solid var(--line);border-radius:9px;font-family:inherit;resize:vertical"></textarea>
    <button onclick="aiEnviar()" style="margin:6px 0 10px;background:linear-gradient(to right,#5aa9d6,#1d4f78);color:#fff;border:0;border-radius:9px;padding:7px 14px;font-family:inherit;font-weight:700;font-size:.76rem;cursor:pointer">Enviar aviso</button>`;
  if(!vis.length){
    h+=`<p style="font-size:.8rem;color:var(--ink-soft);text-align:center;padding:6px 0">No hay avisos internos.</p>`;
  }else{
    vis.forEach(a=>{
      const entrante=a.para_area===area;
      const nuevo=entrante && !a.leido;
      const f=String(a.creado_en||'').slice(0,16).replace('T',' ');
      h+=`<div style="padding:8px 0;border-top:1px solid var(--line)">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          <span style="font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:${entrante?'#1d4f78':'var(--ink-soft)'}">${AI_AREAS[a.de_area]||a.de_area} → ${AI_AREAS[a.para_area]||a.para_area}</span>
          ${nuevo?'<span style="background:#5aa9d6;color:#fff;border-radius:6px;padding:0 5px;font-size:.6rem;font-weight:800">NUEVO</span>':''}
          <span style="margin-left:auto;font-size:.62rem;color:var(--ink-soft)">${escHtml(f)}</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:8px">
          <span style="flex:1;font-size:.8rem;color:var(--ink)">${escHtml(a.texto)}</span>
          ${nuevo?`<button onclick="aiLeido('${escAttr(String(a.id))}')" title="Marcar leído" style="flex:0 0 auto;background:#eaf3fb;border:1px solid #5aa9d6;border-radius:6px;padding:1px 6px;font-size:.66rem;color:#1d4f78;cursor:pointer">✓</button>`:''}
          <button onclick="aiBorrar('${escAttr(String(a.id))}')" title="Borrar" style="flex:0 0 auto;background:#fff;border:1px solid var(--line);border-radius:6px;width:20px;height:20px;line-height:1;font-size:.72rem;color:var(--ink-soft);cursor:pointer;padding:0">🗑</button>
        </div>
      </div>`;
    });
  }
  return h+`</div>`;
}
function aiToggle(){ window._aiAbierta=!window._aiAbierta; aiPintarBarra(); }
async function aiEnviar(){
  const ta=$('ai-texto'); const txt=ta?ta.value.trim():'';
  if(!txt){ appAlert('Escribe el aviso antes de enviarlo.'); return; }
  const area=aiArea();
  try{
    await call('/rest/v1/avisos_internos',{method:'POST',body:{de_area:area,para_area:aiDest,texto:txt}});
    aiLista=null;
    await aiCargar(true);
  }catch(e){ appAlert('No se pudo enviar: '+(e.message||'')); }
}
async function aiLeido(id){
  try{
    await call('/rest/v1/avisos_internos?id=eq.'+id,{method:'PATCH',body:{leido:true}});
    const a=(aiLista||[]).find(x=>String(x.id)===String(id)); if(a) a.leido=true;
    aiPintarBarra();
  }catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}
async function aiBorrar(id){
  if(!await appConfirm('¿Borrar este aviso interno?')) return;
  try{
    await call('/rest/v1/avisos_internos?id=eq.'+id,{method:'DELETE'});
    aiLista=(aiLista||[]).filter(x=>String(x.id)!==String(id));
    aiPintarBarra();
  }catch(e){ appAlert('No se pudo borrar: '+(e.message||'')); }
}
function saShell(inner){
  const ico=`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/></svg>`;
  const base=`font-size:.66rem;padding:9px 3px;border:1.5px solid var(--honey);background:linear-gradient(to right,#eaf6fd,#7fc3e8);color:var(--navy)`;
  const on=`font-size:.66rem;padding:9px 3px;border:1.5px solid var(--honey);background:linear-gradient(to right,#5aa9d6,#1d4f78);color:#fff`;
  const st=(t)=>saMainTab===t?on:base;
  const enSoporte = (saMainTab==='ev' || saMainTab==='aa');
  const sub=(t)=>saMainTab===t
    ? 'font-size:.7rem;padding:7px 4px;border:1.5px solid var(--honey);background:linear-gradient(to right,#5aa9d6,#1d4f78);color:#fff'
    : 'font-size:.7rem;padding:7px 4px;border:1.5px solid var(--honey);background:linear-gradient(to right,#eaf6fd,#7fc3e8);color:var(--navy)';
  return `<div class="t-toggle" style="margin:8px 0 ${enSoporte?'8px':'16px'};display:flex;gap:5px;flex-wrap:nowrap">
      <button style="${enSoporte?on:base}" onclick="saSetMain('ev')">Soporte</button>
      <button style="${st('fact')}" onclick="saSetMain('fact')">Administración</button>
      <button style="${st('rs')}" onclick="saSetMain('rs')">Comercial</button>
    </div>
    ${window._avRaiz?`<div id="av-bar" style="margin:0 0 ${enSoporte?'8px':'12px'}"></div>`:''}
    ${window._avRaiz?`<div id="ai-bar" style="margin:0 0 ${enSoporte?'8px':'12px'}"></div>`:''}
    ${enSoporte?`<div class="t-toggle" style="margin:0 0 16px;display:flex;gap:5px;flex-wrap:nowrap">
      <button style="${sub('ev')}" onclick="saSetMain('ev')">Aptuvia</button>
      <button style="${sub('aa')}" onclick="saSetMain('aa')">Aula Abierta</button>
    </div>`:''}
    ${inner}`;
}
function saRenderLista(okMsg,errMsg){
  saSelAcad=null;
  window._avAbierta=false;
  window._avRaiz=true;
  setTimeout(()=>{ try{ avCargar(true); }catch(e){} },0);
  setTimeout(()=>{ try{ aiCargar(true); }catch(e){} },0);
  let h='';
  if(okMsg) h+=`<div class="t-note ok">${escHtml(okMsg)}</div>`;
  if(errMsg) h+=`<div class="t-note err">${escHtml(errMsg)}</div>`;
  if(saMainTab==='aa'){
    // Ir directo a la lista de profesores de Aula Abierta (mismo funcionamiento que EV).
    saAbrirAula();
    return;
  }
  if(saMainTab==='fact'){
    saRenderFacturacionLista();
    return;
  }
  if(saMainTab==='rs'){
    rsRender();
    return;
  }
  h+=`<button class="btn btn-honey" id="sa-nueva" style="margin-bottom:14px">Nueva academia</button>`;
  h+=`<div class="sa-cards-grid">`;
  saAcademias.forEach(a=>{
    const rev = a.activa===false;
    h+=`<div class="sa-card${rev?' rev':''}" data-acad="${a.academia_id}" style="background:#fff;padding:9px 12px;margin-bottom:7px;${rev?'opacity:.72':''}">
      <div class="sa-card-top" style="margin-bottom:0"><b style="font-size:.92rem">${escHtml(a.nombre)}${rev?' <span style=\"color:#b4232a;font-size:.7rem;font-weight:800\">🔒 REVOCADA</span>':''}</b><span class="sa-id">#${a.academia_id}</span></div>
      <div class="sa-counts" style="display:none"><span>${a.n_profes} profes</span><span>${a.n_alumnos} alumnos</span><span>${a.n_examenes} exs</span></div>
    </div>`;
  });
  h+=`</div>`;
  h+=`<div id="sa-mant-box" style="margin-top:18px;padding-top:14px;border-top:1px solid var(--line)"></div>`;
  $('teacher').innerHTML=saShell(h);
  if($('sa-nueva')) $('sa-nueva').onclick=saCrearAcademiaUI;
  $('teacher').querySelectorAll('.sa-card[data-acad]').forEach(c=> c.onclick=()=>saAbrirAcademia(+c.dataset.acad));
  saPintarMantenimiento();
}
async function saPintarMantenimiento(){
  const box=$('sa-mant-box'); if(!box) return;
  let on=false;
  try{ const m=await call('/rest/v1/config_app?select=valor&clave=eq.mantenimiento'); on=(m&&m[0]&&m[0].valor==='on'); }catch(e){}
  box.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px;border:1.5px solid ${on?'#f3c4c4':'var(--line)'};border-radius:12px;background:${on?'#fdeaea':'#fff'}">
      <span><b style="color:${on?'#b4232a':'var(--navy)'}">🛠️ Modo mantenimiento</b><br><span style="font-size:.78rem;color:var(--ink-soft)">${on?'ACTIVO: nadie puede entrar salvo tú.':'Apagado: la app funciona con normalidad.'}</span></span>
      <button class="switch${on?' on':''}" id="sa-mant-sw"><span class="knob"></span></button>
    </div>`;
  $('sa-mant-sw').onclick=async ()=>{
    if(!on && !await appConfirm('Activar mantenimiento: NADIE podrá entrar (alumnos y profesores) hasta que lo apagues. ¿Seguro?')) return;
    try{ await call('/rest/v1/rpc/set_mantenimiento',{method:'POST',body:{p_on:!on}}); saPintarMantenimiento(); }
    catch(e){ appAlert('No se pudo: '+(e.message||'')); }
  };
}
async function saAbrirAcademia(id){
  saTab='profes'; saProfExp=null; saExamProf={};
  saSelAcad=saAcademias.find(a=>a.academia_id===id)||{academia_id:id,nombre:'#'+id};
  $('teacher').innerHTML=saShell('<div class="loader"><span class="spin"></span></div>');
  try{
    [saUsuarios,saExamenes]=await Promise.all([
      call('/rest/v1/rpc/sa_academia_usuarios',{method:'POST',body:{p_academia:id}}).then(r=>r||[]),
      call('/rest/v1/rpc/sa_academia_examenes',{method:'POST',body:{p_academia:id}}).then(r=>r||[])
    ]);
  }catch(e){ saDetalle(`<div class="t-note err">${escHtml(e.message||'Error')}</div>`); return; }
  saDetalle();
}
function saDetalle(msg){
  const a=saSelAcad;
  const esAA=!!(a && a._aa);
  const esAulaOnly=(u)=>{ const c=(u.certificados||''); return c!=='' && c.split(',').every(x=>x.trim()==='aula_abierta'); };
  let profes=esAA ? saUsuarios.filter(u=>u.rol==='profesor')
                  : saUsuarios.filter(u=>u.rol==='profesor' && !esAulaOnly(u));
  profes=profes.slice().sort((x,y)=>(x.bloqueado?1:0)-(y.bloqueado?1:0));
  const alumnos=saUsuarios.filter(u=>u.rol==='alumno');
  const filaAlu=(u)=>`<div class="sa-urow">
      <div class="sa-uinfo"><b>${escHtml(u.nombre)}</b><span>${escHtml(u.email)}</span></div>
      <div class="sa-uacts">
        <button class="sa-mover" data-saedalu="${u.id}" data-nombre="${escHtml(u.nombre)}">✎</button>
        <button class="reg-pass" data-sapass="${u.id}" data-email="${escHtml(u.email)}">🔑</button>
        <button class="reg-del" data-sadel="${u.id}" data-email="${escHtml(u.email)}">🗑</button>
      </div>
    </div>`;
  const tarjetaProf=(p)=>{
    const misAlu=alumnos.filter(al=>al.profesor_id===p.id);
    const abierto=saProfExp===p.id;
    let interior='';
    if(abierto){
      interior=`<div class="sa-prof-body">
        <div class="sa-uacts" style="margin-bottom:10px">
          <button class="sa-mover" data-saedit="${p.id}" data-nombre="${escHtml(p.nombre)}">✎ Editar</button>
          <button class="${p.bloqueado?'reg-reauth':'reg-revoke'}" data-sabloq="${p.id}" data-bloq="${p.bloqueado?1:0}" data-email="${escHtml(p.email)}">${p.bloqueado?'Reactivar acceso':'Revocar acceso'}</button>
          <button class="reg-pass" data-sapass="${p.id}" data-email="${escHtml(p.email)}">🔑</button>
          <button class="sa-mini" title="Ver su panel" style="background:var(--honey-tint);border-color:var(--honey)" data-saver="${p.id}" data-nombre="${escHtml(p.nombre)}">👁</button>
          <button class="reg-del" data-sadel="${p.id}" data-email="${escHtml(p.email)}">🗑</button>
        </div>
        ${misAlu.length?`<details style="margin-top:4px"><summary class="sa-sec" style="cursor:pointer;list-style:none">Sus alumnos (${misAlu.length}) ▾</summary><div style="margin-top:8px">${misAlu.map(filaAlu).join('')}</div></details>`:'<h4 class="sa-sec">Sus alumnos (0)</h4><p class="sa-empty">Sin alumnos.</p>'}
      </div>`;
    }
    return `<div class="sa-prof-card ${abierto?'open':''}">
      <button class="sa-prof-head" data-saprof="${p.id}">
        <span><b>${escHtml(p.nombre)}${p.bloqueado?' <span style="color:#b4232a;font-size:.7rem;font-weight:800">🔒 BLOQUEADO</span>':''}</b><span class="sa-prof-mail">${escHtml(p.email)}</span><span class="sa-prof-mail" style="margin-top:2px">${escHtml((p.certificados||'—').split(',')[0])} · ${alumnos.filter(al=>al.profesor_id===p.id).length} alumnos</span></span>
        <span class="sa-prof-arrow">${abierto?'▲':'▼'}</span>
      </button>
      ${interior}
    </div>`;
  };
  let h='';
  if(msg) h+=msg;
  h+=`${esAA?'':'<button class="backbtn" onclick="openSuperadmin()" style="margin-bottom:12px">← Todas las academias</button>'}
    <div class="sa-head-acad">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div><b id="sa-nombre">${escHtml(a.nombre)}</b>${(!esAA && a.activa===false)?' <span style="color:#b4232a;font-size:.72rem;font-weight:800">🔒 REVOCADA</span>':''}
          <div class="sa-counts" style="margin-top:6px"><span>${profes.length} profesores</span><span>${alumnos.length} alumnos</span></div></div>
        ${esAA?`<button class="btn btn-honey" id="sa-nuevo-prof" style="flex:0 0 auto;width:48%;margin:0">Crear profesor</button>`:`<div class="sa-acts-acad">
          <button class="sa-mini" id="sa-ren" title="Renombrar">✎</button>
          <button class="sa-mini danger" id="sa-borr" title="Borrar academia">🗑</button>
          <button class="sa-mini" id="sa-acad-rev" title="${a.activa===false?'Reactivar academia':'Revocar academia'}" style="${a.activa===false?'background:#e7f6ec;color:#15803d;border-color:#bfe3cb':'background:#fff7e6;color:#b26a00;border-color:#f0d9a8'}">${a.activa===false?'↺':'🔒'}</button>
        </div>`}
      </div>
      ${esAA?'':`<button class="btn btn-honey" id="sa-nuevo-prof" style="width:100%;margin-top:6px">Crear profesor</button>`}
    </div>
    ${profes.length?profes.map(tarjetaProf).join(''):'<p class="sa-empty">Sin profesores.</p>'}`;
  $('teacher').innerHTML=saShell(h);
  const g=(id)=>$(id);
  if(g('sa-ren')) g('sa-ren').onclick=()=>saRenombrarUI(a.academia_id);
  if(g('sa-borr')) g('sa-borr').onclick=()=>saBorrarAcademiaUI(a.academia_id,a.nombre);
  if(g('sa-acad-rev')) g('sa-acad-rev').onclick=()=>saRevocarAcademiaUI(a.academia_id, a.activa!==false);
  if(g('sa-nuevo-prof')) g('sa-nuevo-prof').onclick=()=> esAA ? saCrearProfesorUI(1,true) : saCrearProfesorUI(a.academia_id);
  $('teacher').querySelectorAll('[data-saprof]').forEach(b=> b.onclick=()=>saToggleProf(b.dataset.saprof));
  $('teacher').querySelectorAll('[data-saver]').forEach(b=> b.onclick=()=>saVerComoProfesor(b.dataset.saver,b.dataset.nombre));
  $('teacher').querySelectorAll('[data-saedit]').forEach(b=> b.onclick=()=>saEditarProfesorUI(b.dataset.saedit,b.dataset.nombre));
  $('teacher').querySelectorAll('[data-sapass]').forEach(b=> b.onclick=()=>saResetPassUI(b.dataset.sapass,b.dataset.email));
  $('teacher').querySelectorAll('[data-samover]').forEach(b=> b.onclick=()=>saMoverUI(b.dataset.samover,b.dataset.email));
  $('teacher').querySelectorAll('[data-sadel]').forEach(b=> b.onclick=()=>saBorrarUsuarioUI(b.dataset.sadel,b.dataset.email));
  $('teacher').querySelectorAll('[data-saedalu]').forEach(b=> b.onclick=()=>saEditarProfesorUI(b.dataset.saedalu,b.dataset.nombre));
  $('teacher').querySelectorAll('[data-sabloq]').forEach(b=> b.onclick=()=>saBloquearProfesorUI(b.dataset.sabloq,b.dataset.bloq==='1',b.dataset.email));
}
async function saBloquearProfesorUI(userId,estaBloqueado,email){
  const nuevo=!estaBloqueado;
  const msg=nuevo?('¿Revocar el acceso de '+email+'?\nNo podrá entrar hasta que lo reactives. Sus datos y los de sus alumnos se conservan intactos.'):('¿Reactivar el acceso de '+email+'?');
  if(!await appConfirm(msg)) return;
  try{ await call('/rest/v1/rpc/sa_bloquear_profesor',{method:'POST',body:{p_user_id:userId,p_bloquear:nuevo}}); await saRecargarPanelSA(); }
  catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}
async function saRecargarPanelSA(){
  if(saSelAcad && saSelAcad._aa){ await saAbrirAula(); }
  else if(saSelAcad){ await saAbrirAcademia(saSelAcad.academia_id); }
  else { openSuperadmin(); }
}
async function saEditarProfesorUI(userId,nombreActual){
  const nombre=await appPrompt('Nombre del profesor:',nombreActual||''); if(nombre===null) return;
  try{ await call('/rest/v1/rpc/sa_editar_profesor',{method:'POST',body:{p_user_id:userId,p_nombre:nombre}}); await saRecargarPanelSA(); }
  catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}
async function saAbrirAula(){
  saMainTab='aa'; saTab='profes'; saProfExp=null; saExamProf={};
  saSelAcad={academia_id:'__aa', nombre:'Aula Abierta', _aa:true};
  $('teacher').innerHTML=saShell('<div class="loader"><span class="spin"></span></div>');
  try{
    saUsuarios=await call('/rest/v1/rpc/sa_aa_usuarios',{method:'POST',body:{}})||[];
    saExamenes=[];
  }catch(e){ saDetalle(`<div class="t-note err">${escHtml(e.message||'Error')}</div>`); return; }
  saDetalle();
}
async function salirImpersona(){
  window._saImpersona=false; window._saImpersonaProf=null;
  userRol='admin'; userEmail='admin@evaluatest.com'; userAcademia=1;
  const acad=window._saImpersonaAcademia; window._saImpersonaAcademia=null;
  const eraAA=window._saImpersonaAA; window._saImpersonaAA=false;
  showView('teacher'); teacherView='superadmin';
  $('teacher').innerHTML='<div class="loader"><span class="spin"></span></div>';
  try{ saAcademias=await call('/rest/v1/rpc/sa_resumen',{method:'POST',body:{}})||[]; }catch(e){}
  if(eraAA){ saMainTab='aa'; await saAbrirAula(); }
  else if(acad){ saMainTab='ev'; await saAbrirAcademia(acad); }
  else { openSuperadmin(); }
}
async function saVerComoProfesor(profId,nombre){
  if(!await appConfirm('Vas a ver el panel del profesor "'+nombre+'". Solo diagnóstico.')) return;
  let datos;
  try{ datos=(await call('/rest/v1/rpc/sa_datos_profesor',{method:'POST',body:{p_user_id:profId}}))||[]; }
  catch(e){ appAlert('No se pudo: '+(e.message||'')); return; }
  if(!datos.length){ appAlert('Ese profesor no existe.'); return; }
  const certId=datos[0].certificado_id||'adgg0508';
  if(certId==='aula_abierta'){ return saVerComoProfesorAula(profId,datos[0].academia_id); }
  let portalId=null;
  for(const k in CERT_BD){ if(CERT_BD[k]===certId){ portalId=k; break; } }
  if(certId==='adgg0508') portalId='__adgg0508';
  if(!portalId){
    // Certificado sin catálogo frontend (ej. adgn0210): portal dinámico aislado.
    portalId='__'+certId;
    CERT_BD[portalId]=certId;
  }
  // Buscar código y nombre reales del certificado en el catálogo.
  let cod='', nom='';
  for(const g of CERT_CATEGORIAS){ for(const c of g.certs){ if(c.id===portalId){ cod=c.codigo; nom=c.nombre; break; } } }
  // Si no está en el catálogo frontend, tomar código/nombre de la tabla certificados (BD).
  if(!nom){
    try{
      const cRow=await call('/rest/v1/certificados?id=eq.'+encodeURIComponent(certId)+'&select=codigo,nombre');
      if(cRow && cRow[0]){ cod=cod||cRow[0].codigo||''; nom=cRow[0].nombre||''; }
    }catch(e){}
  }
  window._saImpersona=true; window._saImpersonaProf=profId; window._saImpersonaAcademia=datos[0].academia_id;
  window._activeCertId=portalId;
  window._certCodigo=cod||certId.toUpperCase(); window._certNombre=nom||'';
  userRol='profesor'; userAcademia=datos[0].academia_id;
  applyTema(portalId);
  await loadData();
}
async function saVerComoProfesorAula(profId,acad){
  window._saImpersona=true; window._saImpersonaProf=profId||null; window._saImpersonaAcademia=acad||null; window._saImpersonaAA=true;
  window._activeCertId='__aula_abierta';
  userRol='profesor'; if(acad) userAcademia=acad;
  applyTema('__aula_abierta');
  await loadData();
}
async function saCrearAcademiaUI(){
  const n=await appPrompt('Nombre de la nueva academia:'); if(n===null) return;
  try{ await call('/rest/v1/rpc/sa_crear_academia',{method:'POST',body:{p_nombre:n}}); await openSuperadmin('Academia creada.'); }
  catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}
async function saRenombrarUI(id){
  const n=await appPrompt('Nuevo nombre:',saSelAcad.nombre); if(n===null) return;
  try{ await call('/rest/v1/rpc/sa_renombrar_academia',{method:'POST',body:{p_academia:id,p_nombre:n}}); saSelAcad.nombre=n.trim(); await saAbrirAcademia(id); }
  catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}
async function saBorrarAcademiaUI(id,nombre){
  if(!await appConfirm('¿Borrar la academia "'+nombre+'"?\nSolo se puede si no tiene alumnos.')) return;
  try{ await call('/rest/v1/rpc/sa_borrar_academia',{method:'POST',body:{p_academia:id}}); await openSuperadmin('Academia borrada.'); }
  catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}
async function saCrearProfesorUI(academiaId, aaMode){
  const nombre=await appPrompt('Nombre del profesor (aparecerá arriba):')||'';
  const email=await appPrompt('Email del nuevo profesor:'); if(email===null||!email.trim()) return;
  const pass=await appPrompt('Contraseña inicial (mín. 6):'); if(pass===null) return;
  if(pass.length<6){ appAlert('Mínimo 6 caracteres.'); return; }
  let cert='aula_abierta', cod='AULA', nom='Aula Abierta';
  if(!aaMode){
    const sel=await appCertPicker();
    if(sel===null) return;
    cert=sel.id; cod=sel.codigo; nom=sel.nombre;
  }
  try{
    await call('/rest/v1/rpc/sa_crear_profesor',{method:'POST',body:{p_email:email.trim(),p_pass:pass,p_nombre:nombre,p_academia:academiaId,p_cert:cert,p_cert_codigo:cod,p_cert_nombre:nom}});
    if(aaMode){ await saAbrirAula(); } else { await saAbrirAcademia(academiaId); }
  }catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}
async function saResetPassUI(userId,email){
  const nueva=await appPrompt('Nueva contraseña para '+email+' (mín. 6):'); if(nueva===null) return;
  if(nueva.length<6){ appAlert('Mínimo 6 caracteres.'); return; }
  try{ await call('/rest/v1/rpc/sa_reset_password',{method:'POST',body:{p_user_id:userId,p_nueva:nueva}}); appAlert('✅ Contraseña cambiada. Nueva clave: '+nueva); }
  catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}
async function saMoverUI(userId,email){
  const destino=await appPrompt('Mover '+email+' a academia ID:\n'+saAcademias.map(a=>a.academia_id+' = '+a.nombre).join('\n')); if(destino===null) return;
  const idNum=parseInt(destino,10); if(isNaN(idNum)){ appAlert('ID no válido.'); return; }
  try{ await call('/rest/v1/rpc/sa_mover_usuario',{method:'POST',body:{p_user_id:userId,p_academia:idNum}}); await saRecargarPanelSA(); }
  catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}
async function saBorrarUsuarioUI(userId,email){
  const u=(saUsuarios||[]).find(x=>x.id===userId);
  const esProfesor = u && u.rol==='profesor';
  if(esProfesor){
    // Borrado reforzado: los alumnos/exámenes del profesor quedarían sin dueño.
    const nAlu=(saUsuarios||[]).filter(x=>x.rol==='alumno' && x.profesor_id===userId).length;
    await appAlert('⚠️ Vas a borrar al PROFESOR '+email+'.\n\nSe eliminará su cuenta de forma DEFINITIVA. '+
      (nAlu>0?('Sus '+nAlu+' alumno(s) y sus exámenes quedarán SIN PROFESOR asignado.'):'')+
      '\n\nRecomendación: si solo quieres quitarle el acceso, usa "Revocar acceso" en vez de borrar. Si aun así quieres borrarlo, en el siguiente paso deberás escribir su email exacto.');
    const escrito=await appPrompt('Para confirmar el borrado definitivo, escribe el email del profesor:\n'+email);
    if(escrito===null) return;
    if(escrito.trim().toLowerCase()!==email.trim().toLowerCase()){ appAlert('El email no coincide. Borrado cancelado.'); return; }
  } else {
    if(!await appConfirm('BORRADO DEFINITIVO de '+email+'\nSe elimina la cuenta y todos sus datos. Irreversible.')) return;
    if(!await appConfirm('Confirma otra vez: borrar '+email)) return;
  }
  try{ await call('/rest/v1/rpc/sa_borrar_usuario',{method:'POST',body:{p_user_id:userId}}); await saRecargarPanelSA(); }
  catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}

// ══════════════ REVOCAR ACADEMIA ══════════════
async function saRevocarAcademiaUI(academiaId, estaActiva){
  const msg = estaActiva
    ? '¿Marcar esta academia como INACTIVA (revocada)? Aparecerá abajo en las listas. No se borra nada.'
    : '¿Reactivar esta academia?';
  if(!await appConfirm(msg)) return;
  try{
    await call('/rest/v1/rpc/sa_set_activa_academia',{method:'POST',body:{p_academia:academiaId,p_activa:!estaActiva}});
    saAcademias=await call('/rest/v1/rpc/sa_resumen',{method:'POST',body:{}})||[];
    await saAbrirAcademia(academiaId);
  }catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}

// ══════════════ FACTURACIÓN ══════════════
// Tarifas de referencia (editable en cada línea).
const TARIFAS_REC = [
  {k:'acceso', nombre:'Acceso por profesor', precio:14, auto:'profes'},
  {k:'soporte', nombre:'Soporte prioritario', precio:27},
  {k:'multiaula', nombre:'Licencia multiaula', precio:0},
  {k:'aa_individual', nombre:'Aula Abierta · Plan Individual', precio:19},
  {k:'aa_academia', nombre:'Aula Abierta · Plan Academia', precio:49},
  {k:'aa_medida', nombre:'Aula Abierta · A medida', precio:0},
];
const TARIFAS_UNI = [
  {k:'certificado', nombre:'Certificado de profesionalidad', precio:198, auto:'certs'},
  {k:'modulo', nombre:'Módulo / UF adicional', precio:69},
  {k:'banco', nombre:'Banco de preguntas a medida', precio:198},
  {k:'curso', nombre:'Curso o tema personalizado', precio:95},
];

/* ============ REDES SOCIALES ============ */
const RS_REDES=[
  {id:'linkedin', nombre:'LinkedIn',  emoji:'💼', max:3000,  desc:'Prioridad 1 · donde están las academias y los centros de formación',            url:'https://www.linkedin.com/feed/'},
  {id:'instagram',nombre:'Instagram', emoji:'📸', max:2200,  desc:'Marca y alumnado · reels de la plataforma en uso',                                url:'https://www.instagram.com/'},
  {id:'facebook', nombre:'Facebook',  emoji:'👥', max:5000,  desc:'Grupos de academias y formación para el empleo · público 35+',                    url:'https://www.facebook.com/'},
  {id:'youtube',  nombre:'YouTube',   emoji:'▶️', max:5000,  desc:'Demos y tutoriales · el vídeo que enseñas en la llamada de venta',                url:'https://www.youtube.com/'},
  {id:'tiktok',   nombre:'TikTok',    emoji:'🎵', max:2200,  desc:'Opcional · alcance orgánico barato, poca conversión B2B',                         url:'https://www.tiktok.com/'}
];
let rsPosts=[], rsTab='redactor', rsEdit=null;
function rsRed(){ return RS_REDES.find(x=>x.id===window._rsSub)||null; }
function rsSub(v){
  window._rsSub=v; rsTab='redactor'; rsEdit=null; rsPosts=[]; guardarPanel();
  if(v) rsCargar(); else rsRender();
}
function rsSetTab(t){ rsTab=t; rsEdit=null; guardarPanel(); rsPinta(); }
async function rsCargar(){
  const r=rsRed(); if(!r){ rsRender(); return; }
  $('teacher').innerHTML=saShell('<div class="loader"><span class="spin"></span></div>');
  try{
    rsPosts=await call(`/rest/v1/rs_posts?select=*&red=eq.${r.id}&order=creado_en.desc`)||[];
  }catch(e){
    $('teacher').innerHTML=saShell(`<button class="backbtn" onclick="rsSub(null)">← Redes sociales</button>
      <div class="center-msg">No se pudo cargar.<br><small>${escHtml(e.message||'')}</small><br><small>¿Ejecutaste el SQL de la tabla rs_posts?</small></div>`);
    return;
  }
  rsPinta();
}
function rsPinta(){
  const r=rsRed(); if(!r){ rsRender(); return; }
  let h=`<button class="backbtn" onclick="rsSub(null)" style="margin-bottom:10px">← Redes sociales</button>
    <h2 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:2px 2px 10px">${r.emoji} ${escHtml(r.nombre)}</h2>`;
  const tabs=[['redactor','Redactor'],['cal','Calendario'],['hist','Historial'],['met','Métricas']];
  h+=`<div class="t-toggle" style="margin-bottom:14px">${tabs.map(([k,n])=>`<button class="${rsTab===k?'on':''}" onclick="rsSetTab('${k}')">${n}</button>`).join('')}</div>`;
  try{
    if(rsTab==='redactor') h+=rsTabRedactor(r);
    else if(rsTab==='cal') h+=rsTabCal(r);
    else if(rsTab==='hist') h+=rsTabHist(r);
    else h+=rsTabMet(r);
  }catch(e){ h+=`<div class="center-msg">Error al pintar: ${escHtml(e.message||String(e))}</div>`; }
  $('teacher').innerHTML=saShell(h);
  const t=$('rs-txt'); if(t){ t.oninput=rsContar; rsContar(); }
}
function rsContar(){
  const r=rsRed(); const t=$('rs-txt'); const c=$('rs-cont');
  if(!r||!t||!c) return;
  const n=(t.value||'').length;
  c.textContent=n+' / '+r.max+' caracteres';
  c.style.color = n>r.max ? '#b4232a' : 'var(--ink-soft)';
}
/* --- Nivel 1: generador de borradores (prompt listo para pegar en Claude) --- */
const RS_CONTEXTO=`Aptuvia (aptuvia.es) es una plataforma web de exámenes para academias que imparten Certificados de Profesionalidad del SEPE en España.
- Lema: "Las cosas claras y las notas más".
- Cliente que paga: la academia / centro de formación. Usuarios: profesores y alumnos.
- Qué hace: bancos de preguntas por certificado y unidad formativa, creación de exámenes (tipo test y de redacción con PDF adjunto), corrección automática, medias por unidad (mejor intento y todos los intentos), exámenes que cuentan para nota final, reapertura de intentos, informes por alumno y por clase, descarga en PDF, gestión de profesores/alumnos y facturación.
- Módulo aparte "Aula Abierta": formación libre, fuera del marco SEPE.
- La lleva una sola persona: Bernardo Medina Oranto, desarrollador, desde Sevilla. Producto propio, código registrado en propiedad intelectual.
- IMPORTANTE: Bernardo NO es profesor y no da clase. Conoció el sector como ALUMNO de un certificado de profesionalidad, y desde ahí construyó la plataforma.
- Estado real: producto nuevo y terminado, SIN ALUMNOS ACTIVOS ahora mismo (el curso en el que se probó ya acabó) y TODAVÍA SIN CARTERA DE CLIENTES DE PAGO. No digas que hay grupos usándolo.`;
const RS_FORMATO={
  linkedin:'Post de LinkedIn de 1.000-1.600 caracteres. Primera línea = gancho que se lea solo (sin "En este post voy a..."). Párrafos de 1-2 frases separados por línea en blanco. Nada de listas con viñetas de más de 5 puntos. Cierra con una pregunta o una invitación suave, nunca con venta agresiva. Máximo 3 hashtags al final.',
  instagram:'Caption de Instagram de 600-1.200 caracteres. Primera línea = gancho corto. Emojis con moderación (3-6 en total). Si el tema pide vídeo, incluye antes un guion de reel de 30 segundos con los cortes marcados. Termina con 8-10 hashtags en un bloque aparte.',
  facebook:'Post de Facebook de 600-1.200 caracteres, pensado para grupos de formadores y academias. Tono cercano y directo, cero jerga de marketing. Aporta valor primero; la mención a Aptuvia debe ser breve y al final, o ninguna si el grupo prohíbe promoción.',
  youtube:'Devuelve: (1) tres títulos alternativos de menos de 60 caracteres, (2) descripción de 400-800 caracteres con marcas de tiempo si procede, (3) guion hablado de 60-90 segundos en lenguaje natural, sin florituras.',
  tiktok:'Guion de TikTok de 30-45 segundos. Gancho en los 3 primeros segundos. Frases muy cortas, lenguaje hablado. Marca los cortes visuales entre corchetes. Después, el texto del pie con 4-6 hashtags.'
};
const RS_TEMAS={
  linkedin:[
    'Qué es un certificado de profesionalidad y por qué la evaluación es su punto débil',
    'El coste oculto de corregir exámenes a mano en una academia',
    'Cómo documentar la evaluación para una auditoría del SEPE',
    'Trazabilidad: qué papeles te pide el SEPE sobre cada alumno',
    'Errores típicos al diseñar un examen por unidad formativa',
    'Banco de preguntas: por qué reutilizar preguntas no es hacer trampa',
    'Media del mejor intento vs media de todos los intentos: qué nota refleja el aprendizaje',
    'Cómo detectar a tiempo al alumno que va a abandonar',
    'Qué mide de verdad un test de 25 preguntas (y qué no)',
    'Evaluación continua vs examen final en formación para el empleo',
    'Digitalizar una academia sin cambiar de LMS ni migrar nada',
    'Por qué construí Aptuvia: lo que vi desde el pupitre de un certificado',
    'Aula Abierta: formación libre fuera del marco del SEPE',
    'Cuántas horas se van en tareas administrativas en una academia pequeña',
    'Exámenes de redacción con material adjunto: mapas, textos y planos',
    'Cómo dar una segunda oportunidad sin descuadrar las notas del grupo',
    'Protección de datos del alumnado: qué guarda una plataforma de exámenes',
    'Qué preguntarle a un proveedor de software antes de firmar',
    'El profesor como cuello de botella: qué automatizar y qué no',
    'Convertir las notas por unidad en decisiones docentes',
    'Preparar al alumno para el examen oficial sin "enseñarle el test"',
    'Registrar el código en propiedad intelectual: por qué lo hice y cómo fue',
    'Construir un SaaS sin ser una empresa de software',
    'Por qué una academia no necesita una plataforma gigante para evaluar bien'
  ],
  instagram:[
    'Reel: tour de 30 segundos por la plataforma',
    'Antes / después: corregir a mano vs corrección automática',
    'Carrusel: 5 errores al redactar un test de evaluación',
    'Detrás de la cámara: desarrollando Aptuvia desde el móvil',
    'Captura del panel de notas, explicada por partes',
    'Tip rápido: crear un examen en tres toques',
    'Reel: el alumno termina el examen y ve su nota al instante',
    'Carrusel: glosario SEPE sin dolor (CP, MF, UF, RA)',
    'La historia del nombre: por qué Aptuvia',
    'Encuesta en stories: ¿todavía corriges a mano?',
    'Carrusel: qué es un certificado de profesionalidad, en 6 pantallas',
    'Reel: el informe de la clase en 15 segundos',
    'Frase sobre evaluación con fondo de marca',
    'Novedad del mes: qué se ha añadido a la plataforma',
    'Reel: examen de redacción con PDF adjunto',
    'Un día en la vida de un profe de academia',
    'Carrusel: mejor intento vs todos los intentos, explicado con dibujos',
    'Reel: cómo se reabre un examen para dar otra oportunidad'
  ],
  facebook:[
    'Presentación honesta en un grupo de formadores',
    'Pregunta abierta al grupo: ¿cómo evaluáis vosotros las UF?',
    'Post útil: cómo estructurar un examen por unidad formativa',
    'Explicación larga: qué pide exactamente el SEPE en materia de evaluación',
    'Novedades de la plataforma este mes',
    'Caso de uso: una academia con varios profesores y varios certificados',
    'Recursos gratis para formadores de certificados de profesionalidad',
    'Debate: test vs prueba práctica, ¿qué evalúa mejor?',
    'Aviso: demo gratuita para academias',
    'FAQ: ¿sirve para cualquier certificado de profesionalidad?',
    'La historia del proyecto, contada sin humo',
    'Comparativa honesta: Excel vs plataforma (con lo bueno de Excel)',
    'Consejo de gestión de aula que no cuesta dinero',
    'Encuesta: ¿qué tarea te quita más tiempo cada semana?',
    'Cómo llevar el control de notas cuando tienes tres grupos a la vez'
  ],
  youtube:[
    'Demo completa de Aptuvia en 3 minutos',
    'Cómo crear un examen paso a paso',
    'Cómo dar de alta profesores y alumnos',
    'El panel de notas y las medias, explicado',
    'Exámenes de redacción con PDF adjunto',
    'Aula Abierta: qué es y cuándo usarlo',
    'Del informe de clase a la decisión docente',
    'Reabrir un examen y dar una segunda oportunidad',
    'Preguntas frecuentes de las academias, respondidas',
    'Qué es un certificado de profesionalidad (para quien llega de fuera)',
    'Novedades del trimestre',
    'Short: una función explicada en 45 segundos',
    'Cómo se hizo: un SaaS desarrollado desde el móvil',
    'Cómo exportar tus datos y hacer copias de seguridad'
  ],
  tiktok:[
    'Hook: "corriges 30 exámenes a mano y luego los pasas a Excel..."',
    'Crear un examen en 45 segundos',
    'POV: eres profe de academia en junio',
    'Mitos sobre los certificados de profesionalidad',
    'Glosario SEPE en 30 segundos',
    'Detrás: programar una plataforma desde el móvil',
    'Antes / después de digitalizar la evaluación',
    'Tres errores al hacer un test',
    'Captura de la app + sonido en tendencia',
    'Respuesta a un comentario típico',
    'Novedad rápida de producto',
    'La historia del nombre en 20 segundos'
  ]
};
function rsTemas(r){ return RS_TEMAS[r.id]||[]; }
function rsTemaIdx(r){
  if(!window._rsTema) window._rsTema={};
  if(window._rsTema[r.id]==null) window._rsTema[r.id]=rsPosts.length;
  const n=rsTemas(r).length||1;
  return ((window._rsTema[r.id]%n)+n)%n;
}
function rsOtroTema(){ const r=rsRed(); if(!r) return; window._rsTema[r.id]=rsTemaIdx(r)+1; rsPinta(); }
function rsPromptTexto(){
  const r=rsRed(); if(!r) return '';
  const tema=rsTemas(r)[rsTemaIdx(r)]||'';
  return `Escribe una publicación para ${r.nombre}.

CONTEXTO DE LA EMPRESA
${RS_CONTEXTO}

TEMA DE HOY
${tema}

FORMATO
${RS_FORMATO[r.id]||''}
Máximo ${r.max} caracteres.

REGLAS
- Escribe en español de España, en primera persona del singular (lo escribe Bernardo, no una empresa).
- NUNCA mientas ni exageres. El lema de Aptuvia es "las cosas claras y las notas más": aplícalo también a lo que escribes.
- Bernardo NO es profesor: no digas ni insinúes que da clase, que corrige exámenes ni que tiene grupos. Conoce el problema como ALUMNO de un certificado de profesionalidad. Si el tema pide experiencia docente, escríbelo desde la mirada del alumno o desde lo que ha observado, nunca fingiendo ser profesor.
- No inventes datos, cifras, clientes, testimonios ni casos de éxito: Aptuvia todavía no tiene clientes de pago.
- Nada de lenguaje de marketing hueco ("solución integral", "revolucionar", "sinergia", "disruptivo").
- Cero promesas que el producto no cumpla. Si no estás seguro de una función, no la menciones.
- Aporta algo útil aunque el lector no compre nunca.
- Devuelve SOLO el texto listo para publicar, sin explicaciones ni comentarios previos.`;
}
async function rsCopiarPrompt(){
  const t=rsPromptTexto(); if(!t) return;
  try{ await navigator.clipboard.writeText(t); appAlert('Prompt copiado.\n\nPégalo en la app de Claude, revisa lo que te devuelva y trae el texto al redactor.'); }
  catch(e){ appAlert('No se pudo copiar. Usa el botón Compartir o cópialo a mano.'); }
}
async function rsCompartirPrompt(){
  const t=rsPromptTexto(); if(!t) return;
  if(navigator.share){ try{ await navigator.share({text:t}); return; }catch(e){} }
  rsCopiarPrompt();
}

function rsTabRedactor(r){
  const p=rsEdit||{};
  const tema=rsTemas(r)[rsTemaIdx(r)]||'—';
  let h=`<div style="border:1.5px solid var(--honey);background:var(--honey-tint);border-radius:12px;padding:12px;margin-bottom:14px">
    <div style="font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.3px;color:var(--ink-soft);margin-bottom:4px">Tema sugerido (${rsTemaIdx(r)+1} de ${rsTemas(r).length})</div>
    <div style="font-size:.88rem;font-weight:700;color:var(--navy);line-height:1.35;margin-bottom:10px">${escHtml(tema)}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="gx-mini" onclick="rsOtroTema()" style="flex:1;padding:9px">🔄 Otro tema</button>
      <button class="gx-mini" onclick="rsCopiarPrompt()" style="flex:1;padding:9px">🤖 Copiar prompt</button>
      <button class="gx-mini" onclick="rsCompartirPrompt()" style="flex:1;padding:9px">📤 Enviar a Claude</button>
    </div>
    <p style="font-size:.7rem;color:var(--ink-soft);margin:9px 0 0;line-height:1.45">Copia el prompt → pégalo en Claude → revisa el texto → tráelo aquí abajo y guárdalo.</p>
  </div>`;
  h+=`<div class="gx-form">
    <label>Texto de la publicación</label>
    <textarea id="rs-txt" rows="9" style="padding:10px;border:1.5px solid var(--line);border-radius:10px;font-size:.88rem;font-family:inherit;resize:vertical">${escHtml(p.texto||'')}</textarea>
    <div id="rs-cont" style="font-size:.72rem;color:var(--ink-soft);text-align:right;margin-top:-4px"></div>
    <label>Estado</label>
    <select id="rs-est">
      ${[['borrador','Borrador'],['programado','Programado'],['publicado','Publicado']].map(([k,n])=>`<option value="${k}"${(p.estado||'borrador')===k?' selected':''}>${n}</option>`).join('')}
    </select>
    <label>Fecha prevista / de publicación</label><input type="date" id="rs-fecha" value="${p.fecha_prog||''}">
    <label>Enlace al post (opcional)</label><input id="rs-url" value="${escAttr(p.url||'')}" placeholder="https://…">
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
    <button class="btn btn-primary" onclick="rsGuardar()" style="flex:1 1 100%">${p.id?'Guardar cambios':'Guardar'}</button>
    <button class="gx-mini" onclick="rsCopiar()" style="flex:1;padding:10px">📋 Copiar</button>
    <button class="gx-mini" onclick="rsCompartir()" style="flex:1;padding:10px">📤 Compartir</button>
    <a href="${escAttr(r.url)}" target="_blank" rel="noopener" class="gx-mini" style="flex:1;padding:10px;text-align:center;text-decoration:none;line-height:1.6">Abrir ${escHtml(r.nombre)} ↗</a>
  </div>
  ${p.id?`<button class="gx-mini" onclick="rsNuevo()" style="width:100%;margin-top:8px;padding:10px">✚ Nueva publicación</button>`:''}
  <p style="font-size:.72rem;color:var(--ink-soft);margin-top:12px;line-height:1.5">Para publicar: copia o comparte el texto y pégalo en ${escHtml(r.nombre)}. Luego márcalo como publicado y anota las métricas en Historial.</p>`;
  return h;
}
function rsTabCal(r){
  const list=rsPosts.filter(p=>p.estado!=='publicado')
    .sort((a,b)=>String(a.fecha_prog||'9999').localeCompare(String(b.fecha_prog||'9999')));
  if(!list.length) return `<p class="sa-empty">Nada pendiente. Escribe algo en el Redactor.</p>`;
  const hoy=new Date().toISOString().slice(0,10);
  let h='';
  list.forEach(p=>{
    const tarde=p.fecha_prog&&p.fecha_prog<hoy;
    h+=`<div class="gx-card">
      <div><b>${escHtml((p.texto||'').slice(0,60))}${(p.texto||'').length>60?'…':''}</b>
        <span>${p.fecha_prog?escHtml(p.fecha_prog):'sin fecha'} · ${escHtml(p.estado||'borrador')}${tarde?' · <b style="color:#b4232a">¡atrasado!</b>':''}</span></div>
      <div style="white-space:nowrap">
        <button class="gx-mini" onclick="rsEditar('${p.id}')">✏️</button>
        <button class="gx-mini del" onclick="rsBorrar('${p.id}')">🗑</button>
      </div></div>`;
  });
  return h;
}
function rsTabHist(r){
  const list=rsPosts.filter(p=>p.estado==='publicado')
    .sort((a,b)=>String(b.fecha_prog||'').localeCompare(String(a.fecha_prog||'')));
  if(!list.length) return `<p class="sa-empty">Todavía no has marcado nada como publicado.</p>`;
  let h=`<p style="font-size:.72rem;color:var(--ink-soft);margin:0 2px 10px">Anota las métricas a mano desde ${escHtml(r.nombre)}. Se guardan al salir de cada casilla.</p>`;
  list.forEach(p=>{
    h+=`<div style="border:1.5px solid var(--line);border-radius:12px;padding:12px;margin-bottom:8px;background:#fff">
      <div style="font-size:.85rem;color:var(--navy);font-weight:700;margin-bottom:2px">${escHtml((p.texto||'').slice(0,70))}${(p.texto||'').length>70?'…':''}</div>
      <div style="font-size:.72rem;color:var(--ink-soft);margin-bottom:8px">${p.fecha_prog?escHtml(p.fecha_prog):'sin fecha'}${p.url?` · <a href="${escAttr(p.url)}" target="_blank" rel="noopener">ver post ↗</a>`:''}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
        ${[['impresiones','Impres.'],['likes','Likes'],['comentarios','Coment.']].map(([k,n])=>`<div>
          <label style="display:block;font-size:.62rem;font-weight:800;text-transform:uppercase;color:var(--ink-soft);margin:0 0 2px 2px">${n}</label>
          <input type="number" min="0" value="${p[k]!=null?p[k]:''}" onchange="rsMetrica('${p.id}','${k}',this.value)" style="width:100%;padding:7px;border:1px solid var(--line);border-radius:8px;font-size:.8rem;font-family:inherit">
        </div>`).join('')}
      </div>
      <div style="text-align:right;margin-top:8px">
        <button class="gx-mini" onclick="rsEditar('${p.id}')">✏️</button>
        <button class="gx-mini del" onclick="rsBorrar('${p.id}')">🗑</button>
      </div></div>`;
  });
  return h;
}
function rsTabMet(r){
  const pub=rsPosts.filter(p=>p.estado==='publicado');
  if(!pub.length) return `<p class="sa-empty">Sin publicaciones todavía.</p>`;
  const s=(k)=>pub.reduce((t,p)=>t+Number(p[k]||0),0);
  const imp=s('impresiones'), lik=s('likes'), com=s('comentarios');
  const eng=imp>0?Math.round(((lik+com)/imp)*1000)/10:0;
  let h=`<div class="gx-kpis">
    <div class="gx-kpi"><span>Publicados</span><b>${pub.length}</b></div>
    <div class="gx-kpi"><span>Impresiones</span><b>${imp}</b></div>
    <div class="gx-kpi"><span>Interacción</span><b>${eng}%</b></div>
  </div>`;
  h+=`<div class="gx-kpis" style="margin-bottom:12px">
    <div class="gx-kpi"><span>Likes</span><b>${lik}</b></div>
    <div class="gx-kpi"><span>Comentarios</span><b>${com}</b></div>
    <div class="gx-kpi"><span>Media impres.</span><b>${Math.round(imp/pub.length)}</b></div>
  </div>`;
  const top=pub.slice().sort((a,b)=>Number(b.impresiones||0)-Number(a.impresiones||0)).slice(0,5);
  h+=`<div class="gx-tabla-wrap"><table class="gx-tabla"><thead><tr><th>Publicación</th><th style="text-align:right">Impres.</th><th style="text-align:right">Likes</th><th style="text-align:right">Com.</th></tr></thead><tbody>`;
  top.forEach(p=>{
    h+=`<tr><td>${escHtml((p.texto||'').slice(0,40))}${(p.texto||'').length>40?'…':''}</td>
      <td style="text-align:right">${p.impresiones||0}</td>
      <td style="text-align:right">${p.likes||0}</td>
      <td style="text-align:right">${p.comentarios||0}</td></tr>`;
  });
  return h+`</tbody></table></div>`;
}
function rsNuevo(){ rsEdit=null; rsTab='redactor'; rsPinta(); }
function rsEditar(id){ rsEdit=rsPosts.find(p=>String(p.id)===String(id))||null; rsTab='redactor'; rsPinta(); }
function rsTexto(){ const t=$('rs-txt'); return t?t.value.trim():''; }
async function rsCopiar(){
  const t=rsTexto(); if(!t){ appAlert('No hay texto que copiar.'); return; }
  try{ await navigator.clipboard.writeText(t); appAlert('Texto copiado. Pégalo en la red.'); }
  catch(e){ appAlert('Tu navegador no deja copiar automáticamente. Selecciona el texto y cópialo a mano.'); }
}
async function rsCompartir(){
  const t=rsTexto(); if(!t){ appAlert('No hay texto que compartir.'); return; }
  if(navigator.share){ try{ await navigator.share({text:t}); }catch(e){} return; }
  rsCopiar();
}
async function rsGuardar(){
  const r=rsRed(); if(!r) return;
  const texto=rsTexto();
  if(!texto){ appAlert('Escribe el texto de la publicación.'); return; }
  if(texto.length>r.max){ appAlert('El texto supera el límite de '+r.nombre+' ('+r.max+' caracteres).'); return; }
  const body={
    red:r.id, texto,
    estado:($('rs-est')||{}).value||'borrador',
    fecha_prog:(($('rs-fecha')||{}).value||null)||null,
    url:(($('rs-url')||{}).value||'').trim()||null
  };
  try{
    if(rsEdit&&rsEdit.id) await call(`/rest/v1/rs_posts?id=eq.${rsEdit.id}`,{method:'PATCH',body});
    else await call('/rest/v1/rs_posts',{method:'POST',body});
    rsEdit=null; rsTab=body.estado==='publicado'?'hist':'cal';
    await rsCargar();
  }catch(e){ appAlert('No se pudo guardar: '+(e.message||'')); }
}
async function rsBorrar(id){
  if(!await appConfirm('¿Borrar esta publicación?')) return;
  try{ await call(`/rest/v1/rs_posts?id=eq.${id}`,{method:'DELETE'}); await rsCargar(); }
  catch(e){ appAlert('Error: '+(e.message||'')); }
}
async function rsMetrica(id,campo,valor){
  const b={}; b[campo]= valor===''?null:Number(valor);
  try{
    await call(`/rest/v1/rs_posts?id=eq.${id}`,{method:'PATCH',body:b});
    const p=rsPosts.find(x=>String(x.id)===String(id)); if(p) p[campo]=b[campo];
  }catch(e){ appAlert('No se pudo guardar la métrica: '+(e.message||'')); }
}
function rsRender(){
  if(window._enPresu){ pxRender(); return; }
  const sub=window._rsSub||null;
  if(sub){ rsCargar(); return; }
  let h=`<h2 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:4px 2px 4px">Comercial</h2>
    <p style="font-size:.78rem;color:var(--ink-soft);margin:0 2px 14px">Todo lo de captación, desde aquí. Sin salir de Aptuvia.</p>`;
  h+=`<div class="sa-cards-grid">`;
  h+=`<button class="fact-menu" onclick="rsAbrirPresu()" style="background:#eef8fe"><b>📝 Presupuestos</b><span>Preparar, enviar y aceptar presupuestos. El aceptado y firmado es el contrato</span></button>`;
  h+=`</div>`;
  h+=`<h3 style="font-size:.78rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--ink-soft);margin:22px 2px 8px">Redes sociales</h3>`;
  h+=`<div class="sa-cards-grid">`;
  RS_REDES.forEach(r=>{
    h+=`<button class="fact-menu" onclick="rsSub('${r.id}')"><b>${r.emoji} ${escHtml(r.nombre)}</b><span>${escHtml(r.desc)}</span></button>`;
  });
  h+=`</div>`;
  h+=`<h3 style="font-size:.78rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--ink-soft);margin:22px 2px 8px">Medir</h3>`;
  h+=`<div class="sa-cards-grid">
    <button class="fact-menu" onclick="abrirFuera('https://search.google.com/search-console?resource_id=sc-domain%3Aaptuvia.es')"><b>🔎 Google Search Console</b><span>Qué busca la gente para llegar a aptuvia.es, posición y páginas indexadas</span></button>
    <button class="fact-menu" onclick="abrirFuera('https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Aaptuvia.es')"><b>📈 Rendimiento en Google</b><span>Clics, impresiones y consultas de los últimos 3 meses</span></button>
  </div>`;
  h+=`<p style="font-size:.72rem;color:var(--ink-soft);background:#f6f1e6;border:1px solid var(--line);border-radius:10px;padding:9px 11px;margin:12px 2px 0;line-height:1.6">Se abre en otra pestaña y pide la cuenta de Google. La propiedad está a nombre de <b>aptuvia@gmail.com</b>.</p>`;
  $('teacher').innerHTML=saShell(h);
}

function abrirFuera(url){
  try{ window.open(url,'_blank','noopener'); }
  catch(e){ location.href=url; }
}

/* Presupuestos vive en Comercial. pxRender pinta sobre saShell, así que
   funciona igual; solo hay que volver a Comercial al pulsar "← atrás". */
function rsAbrirPresu(){ window._enPresu=true; pxRender(); }

function saRenderFacturacionLista(){
  // Menú principal de Facturación.
  const sub=window._factSub||null;
  if(!sub){
    let h=`<h2 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:4px 2px 14px">Gestión</h2>`;
    h+=`<div class="sa-cards-grid">`;
    h+=`<button class="fact-menu" onclick="saFactSub('academias')"><b>Facturar Aptuvia</b><span>Emitir factura a las academias de la plataforma</span></button>`;
    h+=`<button class="fact-menu" onclick="saFactSub('aa')"><b>Facturar Aula Abierta</b><span>Emitir factura a los clientes de Aula Abierta</span></button>`;
    h+=`<button class="fact-menu" onclick="saFactSub('emitidas')"><b>Facturas emitidas</b><span>Ver, filtrar y sumar todas las facturas</span></button>`;
    h+=`<button class="fact-menu" onclick="saFactSub('gastos')"><b>Gastos y balance</b><span>Facturas de proveedores, gastos previstos y evolución del negocio</span></button>`;
    h+=`<button class="fact-menu" onclick="saFactSub('conta')"><b>🧾 Contabilidad</b><span>Libros, IVA (303), IRPF (130) y resúmenes anuales (390, 347)</span></button>`;
    h+=`</div>`;
    $('teacher').innerHTML=saShell(h);
    return;
  }
  if(sub==='conta'){ ctRender(); return; }
  if(sub==='emitidas'){ saRenderFacturasEmitidas(); return; }
  if(sub==='gastos'){ gxRender(); return; }
  if(sub==='academias'){
    let h=`<button class="backbtn" onclick="saFactSub(null)" style="margin-bottom:10px">← Gestión</button>
      <h2 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:2px 2px 12px">🏫 Facturar Aptuvia</h2>`;
    const acs = (saAcademias||[]).slice().sort((x,y)=>((y.activa!==false)-(x.activa!==false)) || x.academia_id-y.academia_id);
    if(!acs.length) h+=`<p class="sa-empty">No hay academias.</p>`;
    acs.forEach(a=>{
      const rev=a.activa===false;
      h+=`<div class="sa-card${rev?' rev':''}" data-fact="${a.academia_id}" style="${rev?'opacity:.72':''}">
        <div class="sa-card-top"><b>${escHtml(a.nombre)}${rev?' <span style="color:#b4232a;font-size:.7rem;font-weight:800">🔒 REVOCADA</span>':''}</b><span class="sa-id">#${a.academia_id}</span></div>
        <div class="sa-counts"><span>${a.n_certificados||0} certificados</span><span>${a.n_profes||0} profes activos</span></div>
        <span class="sa-open">Facturar →</span>
      </div>`;
    });
    $('teacher').innerHTML=saShell(h);
    $('teacher').querySelectorAll('.sa-card[data-fact]').forEach(c=> c.onclick=()=>saAbrirFacturacion(+c.dataset.fact));
    return;
  }
  if(sub==='aa'){
    let h=`<button class="backbtn" onclick="saFactSub(null)" style="margin-bottom:10px">← Gestión</button>
      <h2 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:2px 2px 12px">🎨 Aula Abierta · clientes</h2>
      <div id="fact-aa-lista"><p class="sa-empty" style="font-size:.82rem">Cargando…</p></div>`;
    $('teacher').innerHTML=saShell(h);
    saCargarClientesAA();
    return;
  }
}

/* ═══════════════ PRESUPUESTOS ═══════════════ */
/* Un presupuesto no tiene requisitos fiscales como la factura: no se registra en
   ningún libro ni se declara. Lo que le da valor jurídico es la ACEPTACIÓN del
   cliente: un presupuesto aceptado y firmado es un contrato (art. 1258 CC).
   Por eso lleva: emisor con NIF, cliente identificado, nº, fecha, validez,
   desglose, condiciones y hueco de firma. */

let pxLista=[], pxEdit=null, pxAA=[];

const PX_ESTADOS={
  borrador:{lab:'Borrador', col:'#6e6e78', bg:'#f1f1f4'},
  enviado:{lab:'Enviado', col:'#2563a8', bg:'#dbeafe'},
  aceptado:{lab:'Aceptado', col:'#15803d', bg:'#dcfce7'},
  rechazado:{lab:'Rechazado', col:'#b4232a', bg:'#fdeaea'},
  caducado:{lab:'Caducado', col:'#92600a', bg:'#fdf0d5'}
};

function pxEstadoReal(p){
  if(p.estado==='aceptado'||p.estado==='rechazado') return p.estado;
  const cad=pxCaducidad(p);
  if(cad && cad < new Date().toISOString().slice(0,10)) return 'caducado';
  return p.estado||'borrador';
}
function pxCaducidad(p){
  if(!p.fecha) return '';
  const d=new Date(p.fecha); d.setDate(d.getDate()+(Number(p.validez_dias)||30));
  return d.toISOString().slice(0,10);
}

function pxNuevoNumero(){
  const y=new Date().getFullYear();
  const n=pxLista.filter(p=>String(p.numero||'').startsWith('P-'+y+'-'))
    .map(p=>parseInt(String(p.numero).split('-')[2],10)||0);
  const sig=(n.length?Math.max(...n):0)+1;
  return 'P-'+y+'-'+String(sig).padStart(4,'0');
}

async function pxRender(){
  window._avRaiz=false;
  $('teacher').innerHTML=saShell('<div class="loader"><span class="spin"></span></div>');
  try{ pxLista=await call('/rest/v1/presupuestos?select=*&order=fecha.desc,creado_en.desc')||[]; }
  catch(e){
    $('teacher').innerHTML=saShell(`<button class="backbtn" onclick="saSetMain('rs')">← Comercial</button>
      <div class="center-msg">No se pudieron cargar los presupuestos.<br><small>${escHtml(e.message||'')}</small><br><small>¿Ejecutaste el SQL de presupuestos?</small></div>`);
    return;
  }
  try{ const all=await call('/rest/v1/rpc/sa_aa_usuarios',{method:'POST',body:{}})||[]; pxAA=all.filter(u=>u.rol==='profesor'); }
  catch(e){ pxAA=[]; }
  try{ pxPintar(); }
  catch(e){
    $('teacher').innerHTML=saShell(`<button class="backbtn" onclick="saSetMain('rs')">← Comercial</button>
      <div class="center-msg">Error al pintar la pantalla.<br><small>${escHtml(e.message||String(e))}</small></div>`);
  }
}

function pxPintar(){
  if(pxEdit){ pxForm(); return; }
  let h=`<button class="backbtn" onclick="saSetMain('rs')" style="margin-bottom:10px">← Comercial</button>
    <h2 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:2px 2px 4px">📝 Presupuestos</h2>
    <p style="font-size:.74rem;color:var(--ink-soft);margin:0 2px 12px">El presupuesto aceptado y firmado por el cliente <b>es el contrato</b>. Sin él, ante un impago no hay nada que reclamar.</p>`;

  h+=`<button class="btn btn-honey" onclick="pxNuevo()" style="margin-bottom:14px">+ Nuevo presupuesto</button>`;

  if(!pxLista.length) return void($('teacher').innerHTML=saShell(h+`<p class="sa-empty">Todavía no hay presupuestos.</p>`));

  const acep=pxLista.filter(p=>pxEstadoReal(p)==='aceptado');
  const pend=pxLista.filter(p=>['borrador','enviado'].includes(pxEstadoReal(p)));
  h+=`<div class="gx-kpis"><div class="gx-kpi"><span>Total</span><b>${pxLista.length}</b></div>
    <div class="gx-kpi"><span>Pendientes</span><b>${pend.length}</b></div>
    <div class="gx-kpi"><span>Aceptados</span><b style="color:#15803d">${gxEur(acep.reduce((t,p)=>t+Number(p.total||0),0))}</b></div></div>`;

  pxLista.forEach(p=>{
    const est=pxEstadoReal(p), e=PX_ESTADOS[est]||PX_ESTADOS.borrador;
    const cli=(p.cliente&&p.cliente.razon_social)||'—';
    h+=`<div style="border:1.5px solid var(--line);border-radius:12px;padding:11px 13px;margin-bottom:9px;background:#fff">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div><b style="font-size:.9rem;color:var(--navy)">${escHtml(p.numero||'—')}</b>
          <span style="font-size:.66rem;font-weight:800;padding:2px 7px;border-radius:10px;margin-left:6px;color:${e.col};background:${e.bg}">${e.lab}</span><br>
          <span style="font-size:.76rem;color:var(--ink-soft)">${escHtml(cli)} · ${escHtml(p.fecha||'')} · válido hasta ${escHtml(pxCaducidad(p))}</span></div>
        <b style="font-size:.95rem;color:var(--navy);white-space:nowrap">${gxEur(p.total)}</b>
      </div>
      <div style="display:flex;gap:5px;margin-top:9px;flex-wrap:wrap">
        <button onclick="pxPDF('${p.id}')" class="gx-mini">📄 PDF</button>
        <button onclick="pxAbrir('${p.id}')" class="gx-mini">✏️ Editar</button>
        <button onclick="pxEnviar('${p.id}')" class="gx-mini">✉️ Enviar</button>
        <select onchange="pxSetEstado('${p.id}',this.value)" class="gx-mini" style="padding:3px 5px">
          ${Object.entries(PX_ESTADOS).filter(([k])=>k!=='caducado').map(([k,v])=>`<option value="${k}"${p.estado===k?' selected':''}>${v.lab}</option>`).join('')}
        </select>
        ${est==='aceptado'?`<button onclick="pxAFactura('${p.id}')" class="gx-mini ok">→ Facturar</button>`:''}
        <button onclick="pxBorrar('${p.id}')" class="gx-mini del" style="margin-left:auto">🗑</button>
      </div>
    </div>`;
  });
  $('teacher').innerHTML=saShell(h);
}

function pxNuevo(){
  pxEdit={
    numero:pxNuevoNumero(),
    fecha:new Date().toISOString().slice(0,10),
    validez_dias:30,
    cliente:{},
    lineas:{rec:[],uni:[]},
    descuento_pct:0, iva_pct:21,
    notas:'Forma de pago: transferencia a 15 días desde la fecha de factura.\nPlazo de puesta en marcha: 7 días laborables desde la aceptación.\nLa cuota mensual se factura por profesor dado de alta.',
    estado:'borrador'
  };
  pxPintar();
}

async function pxAbrir(id){
  const p=pxLista.find(x=>String(x.id)===String(id));
  if(!p){ appAlert('No se encontró el presupuesto.'); return; }
  pxEdit=JSON.parse(JSON.stringify(p));
  pxEdit.lineas=pxEdit.lineas||{rec:[],uni:[]};
  pxEdit.cliente=pxEdit.cliente||{};
  pxPintar();
}

function pxLineHtml(tipo,i,l){
  return `<div style="display:grid;grid-template-columns:auto 1fr auto auto;gap:6px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)">
    <button onclick="pxDelLinea('${tipo}',${i})" title="Quitar" style="background:#fdeaea;border:1px solid #f3c4c4;border-radius:7px;padding:3px 6px;font-size:.75rem;line-height:1;cursor:pointer">🗑</button>
    <input data-pl="${tipo}-${i}-nombre" value="${escAttr(l.nombre||'')}" style="font-size:.82rem;padding:6px 8px;border:1px solid var(--line);border-radius:8px;min-width:0">
    <input data-pl="${tipo}-${i}-precio" type="number" step="0.01" value="${l.precio||0}" style="width:60px;font-size:.82rem;padding:6px;border:1px solid var(--line);border-radius:8px;text-align:right" oninput="pxRecalc()">
    <input data-pl="${tipo}-${i}-cant" type="number" step="1" value="${l.cant||1}" style="width:46px;font-size:.82rem;padding:6px;border:1px solid var(--line);border-radius:8px;text-align:center" oninput="pxRecalc()">
  </div>`;
}

function pxForm(){
  const p=pxEdit; const c=p.cliente||{};
  let h=`<button class="backbtn" onclick="pxCancelar()" style="margin-bottom:10px">← Presupuestos</button>
    <h2 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:2px 2px 12px">${p.id?'Editar':'Nuevo'} presupuesto · ${escHtml(p.numero)}</h2>`;

  h+=`<div style="display:flex;gap:8px;margin-bottom:12px">
    <div style="flex:1"><label style="font-size:.7rem;font-weight:800;text-transform:uppercase;color:var(--ink-soft)">Fecha</label>
      <input data-px="fecha" type="date" value="${escAttr(p.fecha)}" style="width:100%;padding:8px;border:1.5px solid var(--line);border-radius:9px;font-size:.85rem;box-sizing:border-box;font-family:inherit"></div>
    <div style="flex:1"><label style="font-size:.7rem;font-weight:800;text-transform:uppercase;color:var(--ink-soft)">Validez (días)</label>
      <input data-px="validez_dias" type="number" step="1" value="${p.validez_dias||30}" style="width:100%;padding:8px;border:1.5px solid var(--line);border-radius:9px;font-size:.85rem;box-sizing:border-box;font-family:inherit"></div>
  </div>`;

  h+=`<details open style="margin:10px 0;border:1.5px solid var(--honey);border-radius:12px;padding:10px 12px;background:var(--honey-tint)">
    <summary style="font-weight:700;color:var(--navy);cursor:pointer">🏫 Datos del cliente</summary>
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
      ${['razon_social:Razón social *','nif:NIF / CIF *','direccion:Dirección','cp:C.P.','poblacion:Población','provincia:Provincia','email:Email','telefono:Teléfono','contacto:Persona de contacto'].map(par=>{
        const [k,lab]=par.split(':');
        return `<input data-pc="${k}" placeholder="${lab}" value="${escAttr(c[k]||'')}" style="font-size:.85rem;padding:8px 10px;border:1px solid var(--line);border-radius:8px">`;
      }).join('')}
      ${((saAcademias&&saAcademias.length)||pxAA.length)?`<select onchange="pxCargarCliente(this.value)" style="font-size:.82rem;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:#fff">
        <option value="">— O copiar los datos de un cliente ya dado de alta —</option>
        ${(saAcademias&&saAcademias.length)?`<optgroup label="Aptuvia · academias">${saAcademias.map(a=>`<option value="ac:${a.academia_id}">${escHtml(a.nombre)}</option>`).join('')}</optgroup>`:''}
        ${pxAA.length?`<optgroup label="Aula Abierta">${pxAA.map(u=>`<option value="aa:${u.id}">${escHtml(u.nombre||u.email)}</option>`).join('')}</optgroup>`:''}
      </select>`:''}
    </div>
  </details>`;

  h+=`<h3 style="font-size:.82rem;font-weight:800;letter-spacing:.5px;color:var(--navy);margin:16px 2px 8px">Cuota mensual</h3>
    <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:6px;font-size:.68rem;color:var(--ink-soft);padding:0 2px"><span>Concepto</span><span>Precio</span><span>Cant.</span><span></span></div>`;
  (p.lineas.rec||[]).forEach((l,i)=> h+=pxLineHtml('rec',i,l));
  h+=`<details style="margin-top:8px;border:1px solid var(--line);border-radius:10px;padding:8px 12px">
    <summary style="font-size:.8rem;font-weight:700;color:var(--navy);cursor:pointer">Añadir partida mensual</summary>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${TARIFAS_REC.map(t=>`<button onclick="pxAddPreset('rec','${t.k}')" style="font-size:.72rem;padding:5px 9px;border:1px dashed var(--navy);border-radius:16px;background:#fff;color:var(--navy);cursor:pointer;font-family:inherit">+ ${escHtml(t.nombre)} (${t.precio}€)</button>`).join('')}<button onclick="pxAddLibre('rec')" style="font-size:.72rem;padding:5px 9px;border:1px dashed var(--honey);border-radius:16px;background:var(--honey-tint);color:var(--navy);cursor:pointer;font-weight:700;font-family:inherit">✏️ Línea libre</button></div>
  </details>`;

  h+=`<h3 style="font-size:.82rem;font-weight:800;letter-spacing:.5px;color:var(--navy);margin:18px 2px 8px">Pago único</h3>
    <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:6px;font-size:.68rem;color:var(--ink-soft);padding:0 2px"><span>Concepto</span><span>Precio</span><span>Cant.</span><span></span></div>`;
  (p.lineas.uni||[]).forEach((l,i)=> h+=pxLineHtml('uni',i,l));
  h+=`<details style="margin-top:8px;border:1px solid var(--line);border-radius:10px;padding:8px 12px">
    <summary style="font-size:.8rem;font-weight:700;color:var(--navy);cursor:pointer">Añadir pago único</summary>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${TARIFAS_UNI.map(t=>`<button onclick="pxAddPreset('uni','${t.k}')" style="font-size:.72rem;padding:5px 9px;border:1px dashed var(--navy);border-radius:16px;background:#fff;color:var(--navy);cursor:pointer;font-family:inherit">+ ${escHtml(t.nombre)} (${t.precio}€)</button>`).join('')}<button onclick="pxAddLibre('uni')" style="font-size:.72rem;padding:5px 9px;border:1px dashed var(--honey);border-radius:16px;background:var(--honey-tint);color:var(--navy);cursor:pointer;font-weight:700;font-family:inherit">✏️ Línea libre</button></div>
  </details>`;

  h+=`<div style="margin-top:18px;padding-top:12px;border-top:2px solid var(--line)">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <span style="font-size:.85rem">Descuento %</span>
      <input data-px="descuento_pct" type="number" step="0.01" value="${p.descuento_pct||0}" style="width:70px;padding:6px;border:1px solid var(--line);border-radius:8px;text-align:right" oninput="pxRecalc()">
      <span style="font-size:.85rem;margin-left:auto">IVA %</span>
      <input data-px="iva_pct" type="number" step="0.01" value="${p.iva_pct!=null?p.iva_pct:21}" style="width:70px;padding:6px;border:1px solid var(--line);border-radius:8px;text-align:right" oninput="pxRecalc()">
    </div>
    <div id="px-totales" style="font-size:.9rem;line-height:1.9"></div>
  </div>`;

  h+=`<label style="font-size:.7rem;font-weight:800;text-transform:uppercase;color:var(--ink-soft);display:block;margin:14px 2px 4px">Condiciones (salen en el PDF)</label>
    <textarea data-px="notas" rows="4" style="width:100%;font-size:.84rem;padding:9px 10px;border:1.5px solid var(--line);border-radius:10px;font-family:inherit;resize:vertical;box-sizing:border-box">${escHtml(p.notas||'')}</textarea>`;

  h+=`<button class="btn btn-primary" onclick="pxGuardar()" style="margin-top:14px">Guardar presupuesto</button>`;
  h+=`<button onclick="pxGuardarYPDF()" style="margin-top:10px;width:100%;background:var(--honey-tint);border:1.5px solid var(--honey);color:var(--navy);font-weight:700;border-radius:12px;padding:12px;cursor:pointer;font-family:inherit;font-size:.9rem">📄 Descargar PDF</button>`;
  h+=`<button onclick="driveAbrir()" style="margin-top:8px;width:100%;background:#fff;border:1.5px solid var(--line);color:var(--navy);font-weight:700;border-radius:12px;padding:10px;cursor:pointer;font-family:inherit;font-size:.82rem">📁 Abrir Drive para guardarlo</button>`;

  $('teacher').innerHTML=saShell(h);
  pxRecalc();
}

function pxCancelar(){ pxEdit=null; pxPintar(); }

function pxCargarCliente(v){
  if(!v) return;
  pxLeerDOM();
  const [tipo,id]=String(v).split(':');
  const url = tipo==='aa'
    ? '/rest/v1/datos_facturacion?profesor_id=eq.'+id
    : '/rest/v1/datos_facturacion?academia_id=eq.'+id;
  const nomFallback = tipo==='aa'
    ? (()=>{ const u=pxAA.find(x=>String(x.id)===String(id)); return u?(u.nombre||u.email||''):''; })()
    : (()=>{ const a=(saAcademias||[]).find(x=>String(x.academia_id)===String(id)); return a?a.nombre:''; })();
  const mailFallback = tipo==='aa'
    ? (()=>{ const u=pxAA.find(x=>String(x.id)===String(id)); return u?(u.email||''):''; })()
    : '';
  call(url).then(d=>{
    const src=(d&&d[0])||{};
    pxEdit.cliente={
      razon_social:src.razon_social||nomFallback, nif:src.nif||'', direccion:src.direccion||'',
      cp:src.cp||'', poblacion:src.poblacion||'', provincia:src.provincia||'',
      email:src.email||mailFallback, telefono:src.telefono||'', contacto:pxEdit.cliente.contacto||''
    };
    pxForm();
  }).catch(()=>{});
}

function pxLeerDOM(){
  const p=pxEdit; if(!p) return;
  ['rec','uni'].forEach(t=>{
    (p.lineas[t]||[]).forEach((l,i)=>{
      const n=document.querySelector(`[data-pl="${t}-${i}-nombre"]`);
      const pr=document.querySelector(`[data-pl="${t}-${i}-precio"]`);
      const c=document.querySelector(`[data-pl="${t}-${i}-cant"]`);
      if(n) l.nombre=n.value;
      if(pr) l.precio=parseFloat(pr.value)||0;
      if(c) l.cant=parseFloat(c.value)||0;
    });
  });
  document.querySelectorAll('[data-px]').forEach(e=>{
    const k=e.dataset.px;
    p[k]=(k==='validez_dias'||k==='descuento_pct'||k==='iva_pct')?(parseFloat(e.value)||0):e.value;
  });
  p.cliente=p.cliente||{};
  document.querySelectorAll('[data-pc]').forEach(e=>{ p.cliente[e.dataset.pc]=e.value.trim(); });
}

function pxCalc(){
  const p=pxEdit;
  const sum=arr=>(arr||[]).reduce((t,l)=>t+((Number(l.precio)||0)*(Number(l.cant)||0)),0);
  const subtotal=sum(p.lineas.rec)+sum(p.lineas.uni);
  const desc=subtotal*((Number(p.descuento_pct)||0)/100);
  const base=subtotal-desc;
  const iva=base*((Number(p.iva_pct)||0)/100);
  return {subtotal,desc,base,iva,total:base+iva};
}

function pxRecalc(){
  pxLeerDOM();
  const t=pxCalc(), p=pxEdit;
  const box=$('px-totales'); if(!box) return;
  let h=`<div style="display:flex;justify-content:space-between"><span>Subtotal</span><b>${t.subtotal.toFixed(2)} €</b></div>`;
  if((p.descuento_pct||0)>0) h+=`<div style="display:flex;justify-content:space-between;color:#b4232a"><span>Descuento (${p.descuento_pct}%)</span><b>-${t.desc.toFixed(2)} €</b></div>`;
  h+=`<div style="display:flex;justify-content:space-between"><span>IVA (${p.iva_pct||0}%)</span><b>${t.iva.toFixed(2)} €</b></div>`;
  h+=`<div style="display:flex;justify-content:space-between;font-size:1.05rem;border-top:1px solid var(--line);margin-top:4px;padding-top:4px"><span><b>TOTAL</b></span><b style="color:var(--navy)">${t.total.toFixed(2)} €</b></div>`;
  box.innerHTML=h;
}

function pxAddPreset(tipo,k){
  pxLeerDOM();
  const src=(tipo==='rec'?TARIFAS_REC:TARIFAS_UNI).find(t=>t.k===k);
  if(!src) return;
  pxEdit.lineas[tipo]=pxEdit.lineas[tipo]||[];
  pxEdit.lineas[tipo].push({nombre:src.nombre,precio:src.precio,cant:1});
  pxForm();
}
function pxAddLibre(tipo){
  pxLeerDOM();
  pxEdit.lineas[tipo]=pxEdit.lineas[tipo]||[];
  pxEdit.lineas[tipo].push({nombre:'',precio:0,cant:1});
  pxForm();
}
function pxDelLinea(tipo,i){
  pxLeerDOM();
  pxEdit.lineas[tipo].splice(i,1);
  pxForm();
}

async function pxGuardar(silencio){
  pxLeerDOM();
  const p=pxEdit, t=pxCalc();
  if(!p.cliente.razon_social || !p.cliente.nif){ appAlert('La razón social y el NIF del cliente son obligatorios: sin ellos el presupuesto no identifica a quién obliga.'); return null; }
  if(!(p.lineas.rec||[]).length && !(p.lineas.uni||[]).length){ appAlert('Añade al menos una línea al presupuesto.'); return null; }
  const body={
    numero:p.numero, fecha:p.fecha||new Date().toISOString().slice(0,10),
    validez_dias:Number(p.validez_dias)||30,
    cliente:p.cliente, lineas:p.lineas,
    subtotal:+t.subtotal.toFixed(2), descuento_pct:Number(p.descuento_pct)||0,
    iva_pct:Number(p.iva_pct)||0, total:+t.total.toFixed(2),
    notas:p.notas||'', estado:p.estado||'borrador'
  };
  try{
    if(p.id){ await call('/rest/v1/presupuestos?id=eq.'+p.id,{method:'PATCH',body}); }
    else{ await call('/rest/v1/presupuestos',{method:'POST',body}); }
    if(!silencio){ pxEdit=null; await pxRender(); }
    return true;
  }catch(e){ appAlert('No se pudo guardar: '+(e.message||'')); return null; }
}

async function pxGuardarYPDF(){
  const ok=await pxGuardar(true);
  if(!ok) return;
  pxRenderPDF(JSON.parse(JSON.stringify(pxEdit)));
  pxEdit=null;
  await pxRender();
}

async function pxSetEstado(id,v){
  try{
    await call('/rest/v1/presupuestos?id=eq.'+id,{method:'PATCH',body:{estado:v}});
    const p=pxLista.find(x=>String(x.id)===String(id)); if(p) p.estado=v;
    pxPintar();
  }catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}

async function pxBorrar(id){
  if(!await appConfirm('¿Borrar este presupuesto? No se puede deshacer.')) return;
  try{
    await call('/rest/v1/presupuestos?id=eq.'+id,{method:'DELETE'});
    pxLista=pxLista.filter(x=>String(x.id)!==String(id));
    pxPintar();
  }catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}

function pxPDF(id){
  const p=pxLista.find(x=>String(x.id)===String(id));
  if(!p){ appAlert('No se encontró el presupuesto.'); return; }
  pxRenderPDF(p);
}

/* PDF del presupuesto: emisor con NIF, cliente, nº, fecha, validez, desglose,
   condiciones y hueco de aceptación firmada. */
function pxRenderPDF(p){
  if(!window.jspdf){ appAlert('No se pudo cargar el generador de PDF.'); return; }
  const c=p.cliente||{}, lin=p.lineas||{};
  const rec=lin.rec||[], uni=lin.uni||[];
  const sum=a=>a.reduce((t,l)=>t+((Number(l.precio)||0)*(Number(l.cant)||0)),0);
  const subtotal=sum(rec)+sum(uni);
  const desc=subtotal*((Number(p.descuento_pct)||0)/100);
  const base=subtotal-desc;
  const iva=base*((Number(p.iva_pct)||0)/100);
  const total=base+iva;

  const { jsPDF }=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const M=16; let y=20;
  const NAVY=[46,49,99], INK=[30,26,16], SOFT=[110,110,120];

  pdfLogo(doc, M, y-6, 42);
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...INK);
  doc.text('PRESUPUESTO', 210-M, y, {align:'right'});
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...SOFT);
  doc.text('Nº '+(p.numero||''), 210-M, y+5, {align:'right'});
  doc.text('Fecha: '+(p.fecha||''), 210-M, y+10, {align:'right'});
  doc.text('Válido hasta: '+pxCaducidad(p), 210-M, y+15, {align:'right'});
  y+=26;
  doc.setDrawColor(220,220,225); doc.line(M,y,210-M,y); y+=8;

  // Emisor y cliente
  const yIni=y;
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...SOFT); doc.text('DE', M, y);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK);
  let ye=y+5;
  ['Bernardo Medina Oranto','NIF: 28604587Q','Calle Castellar 12, Primero A','41003 Sevilla','contacto@aptuvia.es','aptuvia.es'].forEach(l=>{ doc.text(l, M, ye); ye+=4.6; });
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...SOFT); doc.text('PARA', 112, yIni);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK);
  let yc=yIni+5;
  [c.razon_social||'', c.nif?('NIF: '+c.nif):'', c.direccion||'', [c.cp,c.poblacion,c.provincia].filter(Boolean).join(' '),
   c.contacto?('At.: '+c.contacto):'', c.email||'', c.telefono||''].filter(Boolean).forEach(l=>{ doc.text(l, 112, yc); yc+=4.6; });
  y=Math.max(ye,yc)+8;

  // Líneas
  const drawFila=(c1,c2,c3,c4,bold)=>{
    doc.setFont('helvetica',bold?'bold':'normal'); doc.setFontSize(9);
    doc.text(String(c1), M, y);
    doc.text(String(c2), 128, y, {align:'right'});
    doc.text(String(c3), 150, y, {align:'right'});
    doc.text(String(c4), 210-M, y, {align:'right'});
    y+=6;
  };
  doc.setTextColor(...SOFT); drawFila('Concepto','Precio','Cant.','Importe',true);
  doc.setDrawColor(220,220,225); doc.line(M,y-3,210-M,y-3);
  doc.setTextColor(...INK);
  const seccion=(tit,arr)=>{
    if(!arr.length) return;
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...SOFT);
    doc.text(tit, M, y); y+=5; doc.setTextColor(...INK);
    arr.forEach(l=>{ if(y>250){doc.addPage(); y=20;} drawFila(l.nombre, (Number(l.precio)||0).toFixed(2)+' €', l.cant, ((Number(l.precio)||0)*(Number(l.cant)||0)).toFixed(2)+' €'); });
  };
  seccion('CUOTA MENSUAL', rec);
  seccion('PAGO ÚNICO', uni);

  y+=2; doc.setDrawColor(220,220,225); doc.line(120,y,210-M,y); y+=6;
  const totLinea=(lab,val,bold)=>{ doc.setFont('helvetica',bold?'bold':'normal'); doc.setFontSize(bold?11:9); doc.text(lab,150,y,{align:'right'}); doc.text(val,210-M,y,{align:'right'}); y+=bold?7:5; };
  doc.setTextColor(...INK);
  totLinea('Subtotal', subtotal.toFixed(2)+' €');
  if((Number(p.descuento_pct)||0)>0) totLinea('Descuento ('+p.descuento_pct+'%)', '-'+desc.toFixed(2)+' €');
  totLinea('Base imponible', base.toFixed(2)+' €');
  totLinea('IVA ('+(p.iva_pct||0)+'%)', iva.toFixed(2)+' €');
  doc.setTextColor(...NAVY); totLinea('TOTAL', total.toFixed(2)+' €', true);

  // Condiciones
  y+=6;
  if(y>235){ doc.addPage(); y=20; }
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...SOFT); doc.text('CONDICIONES', M, y); y+=5;
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...INK);
  const cond=String(p.notas||'').split('\n').filter(Boolean);
  cond.forEach(l=>{ doc.splitTextToSize(l, 178).forEach(t=>{ if(y>262){doc.addPage(); y=20;} doc.text(t, M, y); y+=4.4; }); });
  doc.setTextColor(...SOFT); doc.setFontSize(8);
  [ 'Presupuesto válido hasta el '+pxCaducidad(p)+'. Pasada esa fecha, los precios pueden variar.',
    'Los precios no incluyen el IVA salvo indicación expresa en el total.',
    'Aptuvia es una herramienta de apoyo al estudio: no expide títulos ni certificaciones oficiales.'
  ].forEach(l=>{ doc.splitTextToSize(l,178).forEach(t=>{ if(y>262){doc.addPage(); y=20;} doc.text(t, M, y); y+=4.2; }); });

  // Aceptación
  y+=6;
  if(y>240){ doc.addPage(); y=20; }
  doc.setDrawColor(220,220,225); doc.line(M,y,210-M,y); y+=6;
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...INK);
  doc.text('ACEPTACIÓN DEL PRESUPUESTO', M, y); y+=5;
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...SOFT);
  doc.splitTextToSize('La firma de este documento supone la aceptación del presupuesto y de sus condiciones, y da inicio a la prestación del servicio en los términos aquí descritos.',178).forEach(t=>{ doc.text(t,M,y); y+=4.2; });
  y+=10;
  doc.setDrawColor(150,150,160);
  doc.line(M,y,M+70,y); doc.line(120,y,190,y); y+=4;
  doc.setFontSize(8); doc.setTextColor(...SOFT);
  doc.text('Firma y sello del cliente', M, y);
  doc.text('Fecha', 120, y);

  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...SOFT);
  doc.text('contacto@aptuvia.es · aptuvia.es', M, 288);
  doc.save('Presupuesto_'+(p.numero||'')+'_'+String(c.razon_social||'').replace(/[^a-z0-9]/gi,'_')+'.pdf');
}

function pxEnviar(id){
  const p=pxLista.find(x=>String(x.id)===String(id));
  if(!p){ appAlert('No se encontró el presupuesto.'); return; }
  const c=p.cliente||{};
  if(!c.email){ appAlert('Este presupuesto no tiene email del cliente. Edítalo y añádelo.'); return; }
  const asunto='Presupuesto Aptuvia · '+(p.numero||'');
  const cuerpo=
    'Estimado/a '+(c.contacto||c.razon_social||'')+':\n\n'+
    'Le enviamos el presupuesto '+(p.numero||'')+' para los servicios de Aptuvia, por un total de '+Number(p.total||0).toFixed(2)+' € (IVA incluido).\n\n'+
    'El presupuesto es válido hasta el '+pxCaducidad(p)+'. Encontrará el desglose completo y las condiciones en el PDF adjunto.\n\n'+
    'Si le encaja, basta con devolvernos el documento firmado.\n\n'+
    'Quedamos a su disposición para cualquier duda.\n\n'+
    'Un cordial saludo,\nAptuvia\ncontacto@aptuvia.es';
  window._factMail={ email:c.email, asunto, cuerpo };
  factMostrarPlantilla();
}

/* Pasar un presupuesto aceptado a la pantalla de factura */
function pxAFactura(id){
  const p=pxLista.find(x=>String(x.id)===String(id));
  if(!p){ appAlert('No se encontró el presupuesto.'); return; }
  const lin=p.lineas||{};
  window._fact={
    academiaId:null, profesorId:null,
    academiaNombre:(p.cliente&&p.cliente.razon_social)||'cliente',
    datos:p.cliente||{},
    rec:JSON.parse(JSON.stringify(lin.rec||[])),
    uni:JSON.parse(JSON.stringify(lin.uni||[])),
    descuento:Number(p.descuento_pct)||0, iva:Number(p.iva_pct)||21,
    facturas:[]
  };
  saRenderFacturacion();
  appAlert('Presupuesto '+(p.numero||'')+' cargado en la factura. Revisa las líneas antes de generar el PDF.');
}

/* ═══════════════ CONTABILIDAD ═══════════════ */
let ctTab='emitidas';
let ctYear=new Date().getFullYear();
let ctTri=Math.floor(new Date().getMonth()/3)+1;

const CT_UMBRAL_347=3005.06;
const CT_PCT_130=20;

function ctTrimDe(fecha){ const m=+String(fecha||'').slice(5,7); return m?Math.floor((m-1)/3)+1:0; }
function ctAnioDe(fecha){ return +String(fecha||'').slice(0,4)||0; }

/* Facturas emitidas normalizadas: base = subtotal menos descuento; cuota = total - base */
function ctEmitidas(){
  return (window._factTodas||[]).map(f=>{
    const sub=Number(f.subtotal||0);
    const desc=Number(f.descuento_pct||0);
    const base=Math.round((sub-sub*desc/100)*100)/100;
    const total=Number(f.total||0);
    const cuota=Math.round((total-base)*100)/100;
    const cli=(f.cliente&&typeof f.cliente==='object')?f.cliente:{};
    return {
      numero:f.numero||'—', fecha:f.fecha||'',
      cliente:cli.razon_social||f.academia_nombre||'—',
      nif:cli.nif||'', base, iva_pct:Number(f.iva_pct||0), cuota, total,
      anio:ctAnioDe(f.fecha), tri:ctTrimDe(f.fecha)
    };
  }).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
}

/* Facturas recibidas (gastos) normalizadas */
function ctRecibidas(){
  return (gxGastos||[]).map(g=>{
    const base=g.base!=null?Number(g.base):Math.round((Number(g.importe||0)/(1+Number(g.iva_pct||0)/100))*100)/100;
    const cuota=g.iva!=null?Number(g.iva):Math.round((Number(g.importe||0)-base)*100)/100;
    const prov=gxProvs.find(p=>String(p.id)===String(g.proveedor_id));
    return {
      id:g.id, numero:g.numero||'—', fecha:g.fecha||'',
      proveedor:prov?prov.nombre:'—', prov_id:g.proveedor_id||null, nif:prov?(prov.nif||''):'',
      concepto:g.concepto||'', categoria:g.categoria||'Otros',
      base, iva_pct:Number(g.iva_pct||0), cuota, total:Number(g.importe||0),
      deducible:g.deducible!==false, inversion:g.inversion===true,
      anio:ctAnioDe(g.fecha), tri:ctTrimDe(g.fecha)
    };
  }).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
}

function ctAnios(){
  const s=new Set();
  ctEmitidas().forEach(f=>{ if(f.anio) s.add(f.anio); });
  ctRecibidas().forEach(g=>{ if(g.anio) s.add(g.anio); });
  s.add(new Date().getFullYear());
  return [...s].sort((a,b)=>b-a);
}

function ctSet(k,v){
  if(k==='tab') ctTab=v;
  if(k==='year') ctYear=+v;
  if(k==='tri') ctTri=+v;
  ctPintar();
}

async function ctRender(){
  window._avRaiz=false;
  $('teacher').innerHTML=saShell('<div class="loader"><span class="spin"></span></div>');
  try{
    const [p,g]=await Promise.all([
      call('/rest/v1/proveedores?select=*&order=nombre'),
      call('/rest/v1/gastos?select=*&order=fecha.desc')
    ]);
    gxProvs=p||[]; gxGastos=g||[];
    if(!window._factTodas){
      try{ window._factTodas=await call('/rest/v1/rpc/sa_facturas_todas',{method:'POST',body:{}})||[]; }
      catch(e){ window._factTodas=[]; }
    }
  }catch(e){
    $('teacher').innerHTML=saShell(`<button class="backbtn" onclick="saSetMain('fact')">← Gestión</button>
      <div class="center-msg">No se pudieron cargar los datos.<br><small>${escHtml(e.message||'')}</small></div>`);
    return;
  }
  try{ ctPintar(); }
  catch(e){
    $('teacher').innerHTML=saShell(`<button class="backbtn" onclick="saSetMain('fact')">← Gestión</button>
      <div class="center-msg">Error al pintar la pantalla.<br><small>${escHtml(e.message||String(e))}</small></div>`);
  }
}

function ctPintar(){
  let h=`<button class="backbtn" onclick="saSetMain('fact')" style="margin-bottom:10px">← Gestión</button>
    <h2 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:2px 2px 4px">🧾 Contabilidad</h2>
    <p style="font-size:.74rem;color:var(--ink-soft);margin:0 2px 12px">Todo se calcula solo, a partir de las facturas emitidas y de los gastos. Los importes los valida tu gestoría.</p>`;

  h+=`<div class="gx-filtros">
    <select id="ct-year">${ctAnios().map(y=>`<option value="${y}"${y===ctYear?' selected':''}>Ejercicio ${y}</option>`).join('')}</select>
    <select id="ct-tri">${[1,2,3,4].map(t=>`<option value="${t}"${t===ctTri?' selected':''}>${t}T · ${['Ene–Mar','Abr–Jun','Jul–Sep','Oct–Dic'][t-1]}</option>`).join('')}</select>
  </div>`;

  h+=`<div class="t-toggle" style="margin-bottom:14px;flex-wrap:wrap">
    ${[['emitidas','Expedidas'],['recibidas','Recibidas'],['inversion','Inversión'],['303','303 IVA'],['130','130 IRPF'],['anual','Anual']]
      .map(([k,l])=>`<button class="${ctTab===k?'on':''}" onclick="ctSet('tab','${k}')" style="flex:1 1 30%;font-size:.7rem;padding:9px 4px;white-space:nowrap">${l}</button>`).join('')}
  </div>`;

  if(ctTab==='emitidas') h+=ctLibroEmitidas();
  else if(ctTab==='recibidas') h+=ctLibroRecibidas();
  else if(ctTab==='inversion') h+=ctLibroInversion();
  else if(ctTab==='303') h+=ct303();
  else if(ctTab==='130') h+=ct130();
  else h+=ctAnual();

  $('teacher').innerHTML=saShell(h);
  if($('ct-year')) $('ct-year').onchange=(e)=>ctSet('year',e.target.value);
  if($('ct-tri')) $('ct-tri').onchange=(e)=>ctSet('tri',e.target.value);
}

function ctAviso(txt){
  return `<p style="font-size:.72rem;color:var(--ink-soft);background:#f6f1e6;border:1px solid var(--line);border-radius:10px;padding:9px 11px;margin:12px 0 0;line-height:1.6">${txt}</p>`;
}

/* ── Libro registro de facturas expedidas ── */
function ctLibroEmitidas(){
  const list=ctEmitidas().filter(f=>f.anio===ctYear && f.tri===ctTri);
  const tB=list.reduce((t,f)=>t+f.base,0), tC=list.reduce((t,f)=>t+f.cuota,0), tT=list.reduce((t,f)=>t+f.total,0);
  let h=`<h3 style="font-size:.86rem;font-weight:800;color:var(--navy);margin:0 2px 8px">Libro registro de facturas expedidas · ${ctTri}T ${ctYear}</h3>`;
  h+=`<div class="gx-kpis"><div class="gx-kpi"><span>Base</span><b>${gxEur(tB)}</b></div>
    <div class="gx-kpi"><span>IVA repercutido</span><b style="color:#15803d">${gxEur(tC)}</b></div>
    <div class="gx-kpi"><span>Total</span><b>${gxEur(tT)}</b></div></div>`;
  if(!list.length) return h+`<p class="sa-empty">No hay facturas emitidas en este trimestre.</p>`;
  h+=`<div class="gx-tabla-wrap"><table class="gx-tabla"><thead><tr>
    <th>Fecha</th><th>Nº</th><th>Cliente</th><th>NIF</th><th style="text-align:right">Base</th><th style="text-align:right">%</th><th style="text-align:right">Cuota</th><th style="text-align:right">Total</th></tr></thead><tbody>`;
  list.forEach(f=>{
    h+=`<tr><td style="white-space:nowrap">${escHtml(f.fecha)}</td><td>${escHtml(f.numero)}</td>
      <td>${escHtml(f.cliente)}</td><td>${escHtml(f.nif||'—')}</td>
      <td style="text-align:right;white-space:nowrap">${gxEur(f.base)}</td>
      <td style="text-align:right">${f.iva_pct}%</td>
      <td style="text-align:right;white-space:nowrap">${gxEur(f.cuota)}</td>
      <td style="text-align:right;white-space:nowrap"><b>${gxEur(f.total)}</b></td></tr>`;
  });
  h+=`</tbody><tfoot><tr><td colspan="4"><b>TOTAL</b></td>
    <td style="text-align:right"><b>${gxEur(tB)}</b></td><td></td>
    <td style="text-align:right"><b>${gxEur(tC)}</b></td>
    <td style="text-align:right"><b>${gxEur(tT)}</b></td></tr></tfoot></table></div>`;
  h+=`<button onclick="ctCSV('emitidas')" style="width:100%;margin-top:12px;background:var(--honey-tint);border:1.5px solid var(--honey);color:var(--navy);font-weight:700;border-radius:12px;padding:11px;cursor:pointer;font-family:inherit;font-size:.85rem">⬇ Descargar CSV del libro</button>`;
  return h;
}

/* ── Libro registro de facturas recibidas ── */
function ctLibroRecibidas(){
  const list=ctRecibidas().filter(g=>g.anio===ctYear && g.tri===ctTri && !g.inversion);
  const tB=list.reduce((t,g)=>t+g.base,0);
  const tC=list.filter(g=>g.deducible).reduce((t,g)=>t+g.cuota,0);
  const tT=list.reduce((t,g)=>t+g.total,0);
  let h=`<h3 style="font-size:.86rem;font-weight:800;color:var(--navy);margin:0 2px 8px">Libro registro de facturas recibidas · ${ctTri}T ${ctYear}</h3>`;
  h+=`<div class="gx-kpis"><div class="gx-kpi"><span>Base</span><b>${gxEur(tB)}</b></div>
    <div class="gx-kpi"><span>IVA deducible</span><b style="color:#b4232a">${gxEur(tC)}</b></div>
    <div class="gx-kpi"><span>Total</span><b>${gxEur(tT)}</b></div></div>`;
  if(!list.length) return h+`<p class="sa-empty">No hay facturas de gasto en este trimestre.</p>`;
  h+=`<div class="gx-tabla-wrap"><table class="gx-tabla"><thead><tr>
    <th>Fecha</th><th>Nº</th><th>Proveedor</th><th>NIF</th><th>Concepto</th><th style="text-align:right">Base</th><th style="text-align:right">%</th><th style="text-align:right">Cuota</th><th style="text-align:right">Total</th></tr></thead><tbody>`;
  list.forEach(g=>{
    h+=`<tr><td style="white-space:nowrap">${escHtml(g.fecha)}</td><td>${escHtml(g.numero)}</td>
      <td>${escHtml(g.proveedor)}</td><td>${escHtml(g.nif||'—')}</td>
      <td>${escHtml(g.concepto)}${g.deducible?'':' <span class="gx-nod">no ded.</span>'}</td>
      <td style="text-align:right;white-space:nowrap">${gxEur(g.base)}</td>
      <td style="text-align:right">${g.iva_pct}%</td>
      <td style="text-align:right;white-space:nowrap;color:${g.deducible?'#b4232a':'var(--ink-soft)'}">${gxEur(g.cuota)}</td>
      <td style="text-align:right;white-space:nowrap"><b>${gxEur(g.total)}</b></td></tr>`;
  });
  h+=`</tbody><tfoot><tr><td colspan="5"><b>TOTAL</b></td>
    <td style="text-align:right"><b>${gxEur(tB)}</b></td><td></td>
    <td style="text-align:right"><b>${gxEur(tC)}</b></td>
    <td style="text-align:right"><b>${gxEur(tT)}</b></td></tr></tfoot></table></div>`;
  h+=`<button onclick="ctCSV('recibidas')" style="width:100%;margin-top:12px;background:var(--honey-tint);border:1.5px solid var(--honey);color:var(--navy);font-weight:700;border-radius:12px;padding:11px;cursor:pointer;font-family:inherit;font-size:.85rem">⬇ Descargar CSV del libro</button>`;
  h+=ctAviso('Los gastos marcados como <b>bien de inversión</b> no salen aquí: van en su propio libro.');
  return h;
}

/* ── Libro de bienes de inversión ── */
function ctLibroInversion(){
  const list=ctRecibidas().filter(g=>g.inversion && g.anio<=ctYear);
  let h=`<h3 style="font-size:.86rem;font-weight:800;color:var(--navy);margin:0 2px 8px">Libro de bienes de inversión · hasta ${ctYear}</h3>`;
  if(!list.length){
    h+=`<p class="sa-empty">No hay bienes de inversión registrados.</p>`;
    h+=ctAviso('Un <b>bien de inversión</b> es un elemento del inmovilizado que dura más de un año y cuesta 3.005,06 € o más (ordenador, mobiliario…). Se marca con la casilla «Bien de inversión» al crear o editar la factura de gasto.');
    return h;
  }
  const tB=list.reduce((t,g)=>t+g.base,0), tC=list.filter(g=>g.deducible).reduce((t,g)=>t+g.cuota,0);
  h+=`<div class="gx-kpis"><div class="gx-kpi"><span>Bienes</span><b>${list.length}</b></div>
    <div class="gx-kpi"><span>Base total</span><b>${gxEur(tB)}</b></div>
    <div class="gx-kpi"><span>IVA deducido</span><b>${gxEur(tC)}</b></div></div>`;
  h+=`<div class="gx-tabla-wrap"><table class="gx-tabla"><thead><tr>
    <th>Alta</th><th>Nº</th><th>Proveedor</th><th>Descripción</th><th style="text-align:right">Base</th><th style="text-align:right">Cuota</th><th style="text-align:right">Amort. anual</th><th style="text-align:right">Pendiente</th></tr></thead><tbody>`;
  list.forEach(g=>{
    const anual=Math.round((g.base/5)*100)/100;
    const anios=Math.max(0, Math.min(5, ctYear-g.anio+1));
    const pend=Math.max(0, Math.round((g.base-anual*anios)*100)/100);
    h+=`<tr><td style="white-space:nowrap">${escHtml(g.fecha)}</td><td>${escHtml(g.numero)}</td>
      <td>${escHtml(g.proveedor)}</td><td>${escHtml(g.concepto)}</td>
      <td style="text-align:right;white-space:nowrap">${gxEur(g.base)}</td>
      <td style="text-align:right;white-space:nowrap">${gxEur(g.cuota)}</td>
      <td style="text-align:right;white-space:nowrap">${gxEur(anual)}</td>
      <td style="text-align:right;white-space:nowrap"><b>${gxEur(pend)}</b></td></tr>`;
  });
  h+=`</tbody></table></div>`;
  h+=ctAviso('La amortización se muestra a <b>5 años lineales</b> como orientación. El coeficiente real depende del tipo de bien y lo fija la tabla de amortización de Hacienda: confírmalo con tu gestoría.');
  return h;
}

/* ── Modelo 303 (IVA trimestral) ── */
function ct303(){
  const em=ctEmitidas().filter(f=>f.anio===ctYear && f.tri===ctTri);
  const re=ctRecibidas().filter(g=>g.anio===ctYear && g.tri===ctTri && g.deducible);
  const reCorr=re.filter(g=>!g.inversion), reInv=re.filter(g=>g.inversion);
  const baseDev=em.reduce((t,f)=>t+f.base,0), ivaDev=em.reduce((t,f)=>t+f.cuota,0);
  const baseCorr=reCorr.reduce((t,g)=>t+g.base,0), ivaCorr=reCorr.reduce((t,g)=>t+g.cuota,0);
  const baseInv=reInv.reduce((t,g)=>t+g.base,0), ivaInv=reInv.reduce((t,g)=>t+g.cuota,0);
  const ivaSop=ivaCorr+ivaInv;
  const res=Math.round((ivaDev-ivaSop)*100)/100;

  let h=`<h3 style="font-size:.86rem;font-weight:800;color:var(--navy);margin:0 2px 10px">Modelo 303 · IVA ${ctTri}T ${ctYear}</h3>`;
  h+=`<div class="gx-tabla-wrap"><table class="gx-tabla"><thead><tr><th>Casilla</th><th>Concepto</th><th style="text-align:right">Base</th><th style="text-align:right">Cuota</th></tr></thead><tbody>`;
  const fila=(c,txt,b,q)=>`<tr><td style="color:var(--ink-soft)">${c}</td><td>${txt}</td>
    <td style="text-align:right;white-space:nowrap">${b==null?'—':gxEur(b)}</td>
    <td style="text-align:right;white-space:nowrap">${q==null?'—':gxEur(q)}</td></tr>`;
  h+=`<tr><td colspan="4" style="background:#f6f1e6;font-weight:800;color:var(--navy)">IVA devengado</td></tr>`;
  h+=fila('01–03','Régimen general (repercutido)',baseDev,ivaDev);
  h+=fila('27','Total cuota devengada',null,ivaDev);
  h+=`<tr><td colspan="4" style="background:#f6f1e6;font-weight:800;color:var(--navy)">IVA deducible</td></tr>`;
  h+=fila('28–29','Operaciones interiores corrientes',baseCorr,ivaCorr);
  h+=fila('30–31','Operaciones interiores · bienes de inversión',baseInv,ivaInv);
  h+=fila('45','Total a deducir',null,ivaSop);
  h+=`</tbody><tfoot><tr><td>46 / 71</td><td><b>Resultado</b></td><td></td>
    <td style="text-align:right;white-space:nowrap"><b style="color:${res>=0?'#b4232a':'#15803d'};font-size:.95rem">${gxEur(res)}</b></td></tr></tfoot></table></div>`;
  h+=`<div style="background:var(--navy);color:#fff;border-radius:12px;padding:12px 14px;margin-top:12px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:.85rem">${res>=0?'A ingresar en Hacienda':'A compensar / devolver'}</span>
    <b style="font-size:1.1rem">${gxEur(Math.abs(res))}</b></div>`;
  h+=ctAviso('Plazo de presentación: <b>del 1 al 20</b> del mes siguiente al fin del trimestre (el 4T, hasta el 30 de enero). Solo se cuentan los gastos marcados como <b>IVA deducible</b>.');
  return h;
}

/* ── Modelo 130 (IRPF, pago fraccionado) ── */
function ct130(){
  const hastaTri=(x)=>x.anio===ctYear && x.tri>0 && x.tri<=ctTri;
  const em=ctEmitidas().filter(hastaTri);
  const re=ctRecibidas().filter(hastaTri);
  const ing=em.reduce((t,f)=>t+f.base,0);
  const gas=re.filter(g=>!g.inversion).reduce((t,g)=>t+g.base,0);
  const amort=ctRecibidas().filter(g=>g.inversion && g.anio<=ctYear)
    .reduce((t,g)=>t+(g.base/5)*(ctTri/4),0);
  const gastoTot=Math.round((gas+amort)*100)/100;
  const rend=Math.round((ing-gastoTot)*100)/100;
  const pago=Math.round(rend*CT_PCT_130)/100;

  // Lo ya pagado en trimestres anteriores del mismo año (mismo cálculo acumulado)
  let previo=0;
  for(let t=1;t<ctTri;t++){
    const iT=ctEmitidas().filter(x=>x.anio===ctYear&&x.tri>0&&x.tri<=t).reduce((s,f)=>s+f.base,0);
    const gT=ctRecibidas().filter(x=>x.anio===ctYear&&x.tri>0&&x.tri<=t&&!x.inversion).reduce((s,g)=>s+g.base,0);
    const aT=ctRecibidas().filter(x=>x.inversion&&x.anio<=ctYear).reduce((s,g)=>s+(g.base/5)*(t/4),0);
    previo+=Math.max(0, Math.round((iT-gT-aT)*CT_PCT_130)/100);
  }
  previo=Math.round(previo*100)/100;
  const aIngresar=Math.round(Math.max(0,pago-previo)*100)/100;

  let h=`<h3 style="font-size:.86rem;font-weight:800;color:var(--navy);margin:0 2px 10px">Modelo 130 · IRPF ${ctTri}T ${ctYear} <span style="font-weight:600;color:var(--ink-soft);font-size:.74rem">(acumulado del año)</span></h3>`;
  h+=`<div class="gx-tabla-wrap"><table class="gx-tabla"><thead><tr><th>Casilla</th><th>Concepto</th><th style="text-align:right">Importe</th></tr></thead><tbody>`;
  const f=(c,txt,v,col)=>`<tr><td style="color:var(--ink-soft)">${c}</td><td>${txt}</td>
    <td style="text-align:right;white-space:nowrap${col?';color:'+col:''}">${gxEur(v)}</td></tr>`;
  h+=f('01','Ingresos computables (bases facturadas)',ing,'#15803d');
  h+=f('02','Gastos deducibles',gastoTot,'#b4232a');
  h+=`<tr><td style="color:var(--ink-soft)">—</td><td style="padding-left:22px;color:var(--ink-soft);font-size:.74rem">de los cuales, amortizaciones</td>
    <td style="text-align:right;white-space:nowrap;color:var(--ink-soft)">${gxEur(amort)}</td></tr>`;
  h+=f('03','Rendimiento neto',rend);
  h+=f('04',`${CT_PCT_130}% del rendimiento`,pago);
  h+=f('05','Pagos fraccionados de trimestres anteriores',previo);
  h+=`</tbody><tfoot><tr><td>19</td><td><b>A ingresar</b></td>
    <td style="text-align:right;white-space:nowrap"><b style="color:#b4232a;font-size:.95rem">${gxEur(aIngresar)}</b></td></tr></tfoot></table></div>`;
  h+=ctAviso('Cálculo orientativo en <b>estimación directa simplificada</b>, sin retenciones ni el 5% de gastos de difícil justificación. Si el rendimiento es negativo, el 130 se presenta a cero. Plazo: del 1 al 20 del mes siguiente al trimestre (4T, hasta el 30 de enero).');
  return h;
}

/* ── Resumen anual: 390 y 347 ── */
function ctAnual(){
  const em=ctEmitidas().filter(f=>f.anio===ctYear);
  const re=ctRecibidas().filter(g=>g.anio===ctYear);
  let h=`<h3 style="font-size:.86rem;font-weight:800;color:var(--navy);margin:0 2px 8px">Modelo 390 · resumen anual de IVA ${ctYear}</h3>`;
  h+=`<div class="gx-tabla-wrap"><table class="gx-tabla"><thead><tr>
    <th>Trim.</th><th style="text-align:right">Devengado</th><th style="text-align:right">Deducible</th><th style="text-align:right">Resultado</th></tr></thead><tbody>`;
  let tD=0,tS=0;
  [1,2,3,4].forEach(t=>{
    const d=em.filter(f=>f.tri===t).reduce((s,f)=>s+f.cuota,0);
    const s=re.filter(g=>g.tri===t&&g.deducible).reduce((a,g)=>a+g.cuota,0);
    tD+=d; tS+=s;
    const r=Math.round((d-s)*100)/100;
    h+=`<tr><td><b>${t}T</b></td>
      <td style="text-align:right;white-space:nowrap;color:#15803d">${gxEur(d)}</td>
      <td style="text-align:right;white-space:nowrap;color:#b4232a">${gxEur(s)}</td>
      <td style="text-align:right;white-space:nowrap"><b>${gxEur(r)}</b></td></tr>`;
  });
  const tR=Math.round((tD-tS)*100)/100;
  h+=`</tbody><tfoot><tr><td><b>AÑO</b></td>
    <td style="text-align:right"><b>${gxEur(tD)}</b></td>
    <td style="text-align:right"><b>${gxEur(tS)}</b></td>
    <td style="text-align:right"><b>${gxEur(tR)}</b></td></tr></tfoot></table></div>`;
  h+=ctAviso('El 390 se presenta <b>en enero</b>, junto con el 4T. Es informativo: resume los cuatro 303 del año.');

  // 347
  h+=`<h3 style="font-size:.86rem;font-weight:800;color:var(--navy);margin:20px 2px 8px">Modelo 347 · operaciones con terceros ${ctYear}</h3>`;
  const cli={}, prov={};
  em.forEach(f=>{ const k=f.cliente||'—'; cli[k]=cli[k]||{nif:f.nif,total:0}; cli[k].total+=f.total; if(!cli[k].nif&&f.nif) cli[k].nif=f.nif; });
  re.forEach(g=>{ const k=g.proveedor||'—'; prov[k]=prov[k]||{nif:g.nif,total:0}; prov[k].total+=g.total; if(!prov[k].nif&&g.nif) prov[k].nif=g.nif; });
  const supera=(o)=>Object.entries(o).filter(([,v])=>v.total>CT_UMBRAL_347).sort((a,b)=>b[1].total-a[1].total);
  const cl=supera(cli), pr=supera(prov);
  if(!cl.length && !pr.length){
    h+=`<p class="sa-empty">Nadie supera los ${CT_UMBRAL_347.toFixed(2)} € este año. <b>No hay que presentar el 347.</b></p>`;
  }else{
    h+=`<div class="gx-tabla-wrap"><table class="gx-tabla"><thead><tr>
      <th>Clave</th><th>Nombre</th><th>NIF</th><th style="text-align:right">Importe año</th></tr></thead><tbody>`;
    cl.forEach(([n,v])=>{ h+=`<tr><td><span class="gx-cat">B · cliente</span></td><td>${escHtml(n)}</td><td>${escHtml(v.nif||'—')}</td>
      <td style="text-align:right;white-space:nowrap"><b>${gxEur(v.total)}</b></td></tr>`; });
    pr.forEach(([n,v])=>{ h+=`<tr><td><span class="gx-cat">A · proveedor</span></td><td>${escHtml(n)}</td><td>${escHtml(v.nif||'—')}</td>
      <td style="text-align:right;white-space:nowrap"><b>${gxEur(v.total)}</b></td></tr>`; });
    h+=`</tbody></table></div>`;
  }
  h+=ctAviso(`Se declara a quien supere <b>${CT_UMBRAL_347.toFixed(2)} €</b> (IVA incluido) en el año natural. Se presenta <b>en febrero</b> del año siguiente. Necesitas el NIF de cada uno: rellénalo en los datos fiscales del cliente y en la ficha del proveedor.`);
  return h;
}

/* ── Exportar CSV de los libros ── */
function ctCSV(cual){
  const esc=(s)=>'"'+String(s==null?'':s).replace(/"/g,'""')+'"';
  let csv='', nom='';
  if(cual==='emitidas'){
    const list=ctEmitidas().filter(f=>f.anio===ctYear && f.tri===ctTri);
    csv='Fecha;Numero;Cliente;NIF;Base;IVA_pct;Cuota;Total\n';
    list.forEach(f=>{ csv+=[f.fecha,f.numero,f.cliente,f.nif,f.base.toFixed(2),f.iva_pct,f.cuota.toFixed(2),f.total.toFixed(2)].map(esc).join(';')+'\n'; });
    const tB=list.reduce((t,f)=>t+f.base,0), tC=list.reduce((t,f)=>t+f.cuota,0), tT=list.reduce((t,f)=>t+f.total,0);
    csv+=['','','TOTAL','',tB.toFixed(2),'',tC.toFixed(2),tT.toFixed(2)].map(esc).join(';')+'\n';
    nom=`aptuvia_libro_expedidas_${ctYear}_${ctTri}T.csv`;
  }else{
    const list=ctRecibidas().filter(g=>g.anio===ctYear && g.tri===ctTri && !g.inversion);
    csv='Fecha;Numero;Proveedor;NIF;Concepto;Base;IVA_pct;Cuota;Total;Deducible\n';
    list.forEach(g=>{ csv+=[g.fecha,g.numero,g.proveedor,g.nif,g.concepto,g.base.toFixed(2),g.iva_pct,g.cuota.toFixed(2),g.total.toFixed(2),g.deducible?'Si':'No'].map(esc).join(';')+'\n'; });
    const tB=list.reduce((t,g)=>t+g.base,0), tC=list.filter(g=>g.deducible).reduce((t,g)=>t+g.cuota,0), tT=list.reduce((t,g)=>t+g.total,0);
    csv+=['','','TOTAL','','',tB.toFixed(2),'',tC.toFixed(2),tT.toFixed(2),''].map(esc).join(';')+'\n';
    nom=`aptuvia_libro_recibidas_${ctYear}_${ctTri}T.csv`;
  }
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
  a.download=nom; a.click();
}

/* ═══════════════ GASTOS Y BALANCE ═══════════════ */
let gxTab='facturas', gxProvs=[], gxGastos=[], gxRecs=[], gxArch=[], gxEdit=null, gxProvEdit=null, gxRecEdit=null;
let gxFProv='todos', gxFEstado='todos', gxFDesde='', gxFHasta='', gxFCat='todas';

/* mesNombre global (lo usa gxTabFacturas; antes solo existía como const local en facturas emitidas) */
function mesNombre(mk){
  if(!mk || mk==='—' || mk==='sin-fecha') return 'Sin fecha';
  const [y,m]=String(mk).split('-');
  const d=new Date(+y,+m-1,1);
  if(isNaN(d)) return String(mk);
  const nom=d.toLocaleDateString('es-ES',{month:'long',year:'numeric'});
  return nom.charAt(0).toUpperCase()+nom.slice(1);
}

async function gxRender(){
  window._avRaiz=false;
  $('teacher').innerHTML=saShell('<div class="loader"><span class="spin"></span></div>');
  try{
    const [p,g,r]=await Promise.all([
      call('/rest/v1/proveedores?select=*&order=nombre'),
      call('/rest/v1/gastos?select=*&order=fecha.desc'),
      call('/rest/v1/gastos_recurrentes?select=*&order=dia_mes')
    ]);
    gxProvs=p||[]; gxGastos=g||[]; gxRecs=r||[];
    try{ gxArch=await call('/rest/v1/avisos_archivados?select=*&order=archivado_en.desc')||[]; }
    catch(e){ gxArch=[]; }
    // El balance necesita los ingresos: se cargan aquí para no depender de que
    // el usuario haya abierto antes "Facturas emitidas".
    if(!window._factTodas){
      try{ window._factTodas=await call('/rest/v1/rpc/sa_facturas_todas',{method:'POST',body:{}})||[]; }
      catch(e){ window._factTodas=[]; }
    }
  }catch(e){
    $('teacher').innerHTML=saShell(`<button class="backbtn" onclick="saSetMain('fact')">← Gestión</button>
      <div class="center-msg">No se pudo cargar.<br><small>${escHtml(e.message||'')}</small><br><small>¿Ejecutaste el SQL de gastos?</small></div>`);
    return;
  }
  try{
    gxPintar();
  }catch(e){
    $('teacher').innerHTML=saShell(`<button class="backbtn" onclick="saSetMain('fact')">← Gestión</button>
      <div class="center-msg">Error al pintar la pantalla.<br><small>${escHtml(e.message||String(e))}</small></div>`);
  }
}

function gxPintar(){
  if(gxTab==='avisos') gxTab='facturas';
  let h=`<button class="backbtn" onclick="saSetMain('fact')" style="margin-bottom:10px">← Gestión</button>
    <h2 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:2px 2px 12px">Gastos y balance</h2>`;
  h+=`<div class="t-toggle" style="margin-bottom:14px">
    ${[['facturas','Facturas'],['prev','Previstos'],['provs','Proveedores'],['balance','Balance']]
      .map(([k,l])=>`<button class="${gxTab===k?'on':''}" onclick="gxSetTab('${k}')" style="font-size:.62rem;padding:8px 2px">${l}</button>`).join('')}
  </div>`;
  if(gxTab==='facturas') h+=gxTabFacturas();
  else if(gxTab==='prev') h+=gxTabPrev();
  else if(gxTab==='provs') h+=gxTabProvs();
  else if(gxTab==='avisos') h+=gxTabAvisos();
  else h+=gxTabBalance();
  $('teacher').innerHTML=saShell(h);
  gxWire();
}
function gxToggleMes(mk){ window._gxMesAbierto=window._gxMesAbierto||{__init:true}; window._gxMesAbierto[mk]=!window._gxMesAbierto[mk]; gxPintar(); }
function gxSetTab(t){ gxTab=t; gxEdit=null; gxProvEdit=null; gxRecEdit=null; guardarPanel(); gxPintar(); }
function gxProvNombre(id){ const p=gxProvs.find(x=>String(x.id)===String(id)); return p?p.nombre:'—'; }
function gxEur(n){ return (Number(n)||0).toFixed(2)+' €'; }

/* --- Avisos (pagos próximos / contratos que vencen) ---
   Cada aviso lleva una CLAVE ESTABLE que no depende de los días que falten:
   si dependiera, al archivarlo hoy volvería a salir mañana con otro texto. */
function gxCalcAvisos(){
  const out=[]; const hoy=new Date(); const dia=hoy.getDate();
  const mes=hoy.toISOString().slice(0,7);
  gxRecs.filter(r=>r.activo!==false && r.periodicidad==='mensual').forEach(r=>{
    const d=Number(r.dia_mes||1); const falta=d-dia;
    if(falta>=0 && falta<=7) out.push({k:'rec:'+r.id+':'+mes, t:'pago', txt:`${r.concepto} · ${gxEur(r.importe)} · vence el día ${d}${falta===0?' (HOY)':` (en ${falta} d.)`}`});
  });
  gxRecs.filter(r=>r.activo!==false && r.periodicidad==='anual' && r.proxima_fecha).forEach(r=>{
    const f=new Date(r.proxima_fecha); const dd=Math.ceil((f-hoy)/86400000);
    if(dd>=0 && dd<=30) out.push({k:'rec:'+r.id+':'+r.proxima_fecha, t:'pago', txt:`${r.concepto} · ${gxEur(r.importe)} · renovación ${r.proxima_fecha}${dd===0?' (HOY)':` (en ${dd} d.)`}`});
  });
  gxGastos.filter(g=>g.pagada!==true && g.vencimiento).forEach(g=>{
    const f=new Date(g.vencimiento); const dd=Math.ceil((f-hoy)/86400000);
    if(dd<0) out.push({k:'gas:'+g.id+':'+g.vencimiento, t:'vencida', txt:`VENCIDA: ${g.numero||g.concepto} · ${gxEur(g.importe)} · venció ${g.vencimiento}`});
    else if(dd<=7) out.push({k:'gas:'+g.id+':'+g.vencimiento, t:'pago', txt:`${g.numero||g.concepto} · ${gxEur(g.importe)} · vence ${g.vencimiento}${dd===0?' (HOY)':` (en ${dd} d.)`}`});
  });
  (window._saContratos||[]).forEach(c=>{
    if(!c.fin) return; const f=new Date(c.fin); const dd=Math.ceil((f-new Date())/86400000);
    if(dd>=0 && dd<=30) out.push({k:'con:'+String(c.nombre).replace(/\s+/g,'_')+':'+c.fin, t:'contrato', txt:`Contrato de ${c.nombre} finaliza el ${c.fin} (en ${dd} d.)`});
  });
  const archivadas=new Set(gxArch.map(a=>a.clave));
  return out.filter(a=>!archivadas.has(a.k));
}
function gxAvisos(){
  const av=gxCalcAvisos();
  if(!av.length) return '';
  let h=`<div style="border:1.5px solid var(--honey);background:var(--honey-tint);border-radius:12px;padding:12px 14px;margin-bottom:14px">
    <b style="font-size:.82rem;color:var(--honey-deep)">🔔 Avisos (${av.length})</b>`;
  av.forEach(a=>{
    h+=`<div style="font-size:.78rem;margin-top:6px;display:flex;align-items:flex-start;gap:8px;color:${a.t==='vencida'?'#b4232a':'var(--ink)'}">
      <span style="flex:1">${a.t==='vencida'?'⚠️':'•'} ${escHtml(a.txt)}</span>
      <button onclick="gxArchivar('${escAttr(a.k)}','${escAttr(a.txt)}','${a.t}')" title="Cerrar aviso (se guarda en la campanita)"
        style="flex:0 0 auto;background:#fff;border:1px solid var(--line);border-radius:6px;width:20px;height:20px;line-height:1;font-size:.72rem;color:var(--ink-soft);cursor:pointer;padding:0">✕</button>
    </div>`;
  });
  return h+`</div>`;
}

/* --- Avisos archivados --- */
async function gxArchivar(clave,texto,tipo){
  try{
    await call('/rest/v1/avisos_archivados',{method:'POST',body:{clave,texto,tipo}});
    try{ gxArch=await call('/rest/v1/avisos_archivados?select=*&order=archivado_en.desc')||[]; }catch(e){}
    gxPintar();
  }catch(e){ appAlert('No se pudo archivar: '+(e.message||'')+'. ¿Ejecutaste el SQL de avisos?'); }
}
async function gxBorrarAviso(id){
  if(!await appConfirm('¿Borrar este aviso archivado?')) return;
  if(!await appConfirm('Se borrará PARA SIEMPRE y no se podrá recuperar. ¿Confirmas?')) return;
  try{
    await call('/rest/v1/avisos_archivados?id=eq.'+id,{method:'DELETE'});
    gxArch=gxArch.filter(a=>String(a.id)!==String(id));
    gxPintar();
  }catch(e){ appAlert('No se pudo borrar: '+(e.message||'')); }
}
function gxTabAvisos(){
  let h=`<h3 style="font-size:.86rem;font-weight:800;color:var(--navy);margin:0 2px 8px">🔔 Avisos archivados</h3>
    <p style="font-size:.74rem;color:var(--ink-soft);margin:0 2px 12px">Los avisos que cierras con ✕ en la pestaña de facturas se guardan aquí. Mientras estén archivados no vuelven a salir.</p>`;
  if(!gxArch.length) return h+`<p class="sa-empty">No hay avisos archivados.</p>`;
  gxArch.forEach(a=>{
    const f=String(a.archivado_en||'').slice(0,10);
    h+=`<div style="border:1px solid var(--line);border-radius:10px;padding:9px 11px;margin-bottom:7px;background:#fff;display:flex;align-items:flex-start;gap:8px">
      <span style="flex:1;font-size:.78rem;color:${a.tipo==='vencida'?'#b4232a':'var(--ink)'}">${a.tipo==='vencida'?'⚠️':'•'} ${escHtml(a.texto||'')}
        <br><span style="font-size:.68rem;color:var(--ink-soft)">archivado el ${escHtml(f)}</span></span>
      <button onclick="gxBorrarAviso('${a.id}')" class="gx-mini del" style="flex:0 0 auto">🗑</button>
    </div>`;
  });
  return h;
}

/* --- Tabla de facturas de gasto --- */
function gxTabFacturas(){
  let list=gxGastos.slice();
  if(gxFProv!=='todos') list=list.filter(g=>String(g.proveedor_id)===String(gxFProv));
  if(gxFEstado==='pagadas') list=list.filter(g=>g.pagada===true);
  if(gxFEstado==='pendientes') list=list.filter(g=>g.pagada!==true);
  if(gxFDesde) list=list.filter(g=>(g.fecha||'')>=gxFDesde);
  if(gxFHasta) list=list.filter(g=>(g.fecha||'')<=gxFHasta);
  if(gxFCat!=='todas') list=list.filter(g=>(g.categoria||'Otros')===gxFCat);
  const total=list.reduce((t,g)=>t+Number(g.importe||0),0);
  const totBase=list.reduce((t,g)=>t+Number(g.base||0),0);
  const totIvaDed=list.filter(g=>g.deducible!==false).reduce((t,g)=>t+Number(g.iva||0),0);
  const cats=[...new Set(gxGastos.map(g=>g.categoria||'Otros'))].sort();

  let h=`<button class="btn btn-honey" onclick="gxNuevo()" style="margin-bottom:12px">+ Nueva factura de gasto</button>`;
  h+=`<div class="gx-filtros">
    <select id="gx-f-prov"><option value="todos">Todos los proveedores</option>
      ${gxProvs.map(p=>`<option value="${p.id}"${String(gxFProv)===String(p.id)?' selected':''}>${escHtml(p.nombre)}</option>`).join('')}</select>
    <select id="gx-f-est">
      <option value="todos"${gxFEstado==='todos'?' selected':''}>Todas</option>
      <option value="pagadas"${gxFEstado==='pagadas'?' selected':''}>Pagadas</option>
      <option value="pendientes"${gxFEstado==='pendientes'?' selected':''}>Pendientes</option>
    </select>
    <div><label style="display:block;font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.3px;color:var(--ink-soft);margin:0 0 3px 2px">Desde</label><input type="date" id="gx-f-desde" value="${gxFDesde}" style="width:100%"></div>
    <div><label style="display:block;font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.3px;color:var(--ink-soft);margin:0 0 3px 2px">Hasta</label><input type="date" id="gx-f-hasta" value="${gxFHasta}" style="width:100%"></div>
    <select id="gx-f-cat"><option value="todas">Todas las categorías</option>
      ${cats.map(c=>`<option value="${escAttr(c)}"${gxFCat===c?' selected':''}>${escHtml(c)}</option>`).join('')}</select>
  </div>`;
  h+=`<div style="background:var(--navy);color:#fff;border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:.85rem">${list.length} factura${list.length===1?'':'s'} de gasto</span>
    <b style="font-size:1.1rem">${gxEur(total)}</b></div>`;
  h+=`<div class="gx-kpis" style="margin-bottom:10px">
    <div class="gx-kpi"><span>Base imponible</span><b>${gxEur(totBase)}</b></div>
    <div class="gx-kpi"><span>IVA deducible</span><b style="color:#15803d">${gxEur(totIvaDed)}</b></div>
    <div class="gx-kpi"><span>Total con IVA</span><b>${gxEur(total)}</b></div>
  </div>`;
  h+=`<button onclick="gxCSV()" style="width:100%;margin-bottom:12px;background:var(--honey-tint);border:1.5px solid var(--honey);color:var(--navy);font-weight:700;border-radius:12px;padding:11px;cursor:pointer;font-family:inherit;font-size:.88rem">↓ CSV (Excel)</button>`;
  if(!list.length) return h+`<p class="sa-empty">No hay gastos con este filtro.</p>`;
  // Agrupado por meses, plegable
  window._gxMesAbierto = window._gxMesAbierto || {};
  const gmes={};
  list.forEach(g=>{ const mk=(g.fecha||'').slice(0,7)||'sin-fecha'; (gmes[mk]=gmes[mk]||[]).push(g); });
  const mks=Object.keys(gmes).sort().reverse();
  if(window._gxMesAbierto.__init!==true){ window._gxMesAbierto={__init:true}; if(mks[0]) window._gxMesAbierto[mks[0]]=true; }
  mks.forEach(mk=>{
    const arr=gmes[mk];
    const tM=arr.reduce((t,g)=>t+Number(g.importe||0),0);
    const ab=window._gxMesAbierto[mk]===true;
    h+=`<button onclick="gxToggleMes('${mk}')" style="width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;margin:14px 0 6px;background:none;border:none;border-bottom:1px solid var(--line);padding:0 2px 6px;cursor:pointer;font-family:inherit">
      <span style="display:flex;align-items:center;gap:6px">
        <span style="font-size:.7rem;color:var(--ink-soft);transform:rotate(${ab?'90':'0'}deg);display:inline-block">▶</span>
        <span style="font-size:.82rem;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--ink-soft)">${mk==='sin-fecha'?'Sin fecha':mesNombre(mk)}</span>
        <span style="font-size:.7rem;color:var(--ink-soft)">(${arr.length})</span>
      </span>
      <b style="font-size:.85rem;color:var(--navy)">${gxEur(tM)}</b></button>`;
    if(!ab) return;
    h+=`<div class="gx-tabla-wrap" style="margin-bottom:6px"><table class="gx-tabla">
      <thead><tr><th style="text-align:center">PDF</th><th>Fecha</th><th>Proveedor</th><th>Nº factura</th><th>Concepto</th><th>Categoría</th><th style="text-align:right">Base</th><th style="text-align:right">IVA</th><th style="text-align:right">Total</th><th></th></tr></thead><tbody>`;
    arr.forEach(g=>{
      h+=`<tr>
        <td style="text-align:center">${g.pdf_url?`<button class="gx-mini" onclick="gxVerPDF('${escAttr(g.pdf_url)}')" title="Original subido — toca para verlo" style="background:#dcfce7;border:1px solid #15803d;color:#15803d">✔</button>`:`<button class="gx-mini" onclick="gxEditar('${g.id}')" title="Falta subir el original — toca para adjuntarlo" style="background:#fdeaea;border:1px solid #dc2626;color:#dc2626">✕</button>`}</td>
        <td>${escHtml(g.fecha||'')}</td>
        <td>${escHtml(gxProvNombre(g.proveedor_id))}</td>
        <td>${escHtml(g.numero||'—')}</td>
        <td>${escHtml(g.concepto||'')}</td>
        <td><span class="gx-cat">${escHtml(g.categoria||'Otros')}</span>${g.deducible===false?' <span class="gx-nod">no ded.</span>':''}</td>
        <td style="text-align:right;white-space:nowrap">${g.base!=null?gxEur(g.base):'—'}</td>
        <td style="text-align:right;white-space:nowrap;color:${g.deducible===false?'var(--ink-soft)':'#15803d'}">${g.iva!=null?gxEur(g.iva):'—'}</td>
        <td style="text-align:right;font-weight:700;white-space:nowrap">${gxEur(g.importe)}</td>
        <td style="white-space:nowrap;text-align:right">
          <button class="gx-mini ${g.pagada?'ok':''}" onclick="gxTogglePagada('${g.id}',${g.pagada?'false':'true'})">${g.pagada?'✅':'○'}</button>
          <button class="gx-mini" onclick="gxEditar('${g.id}')">✏️</button>
          <button class="gx-mini" onclick="gxDuplicar('${g.id}')" title="Duplicar">⧉</button>
          <button class="gx-mini del" onclick="gxBorrar('${g.id}')">🗑</button>
        </td></tr>`;
    });
    h+=`</tbody></table></div>`;
  });
  return h;
}

/* --- Gastos previstos (recurrentes) --- */
function gxTabPrev(){
  const act=gxRecs.filter(r=>r.activo!==false);
  const mens=act.filter(r=>r.periodicidad==='mensual').reduce((t,r)=>t+Number(r.importe||0),0);
  const anu=act.filter(r=>r.periodicidad==='anual').reduce((t,r)=>t+Number(r.importe||0),0);
  const totalAnual=mens*12+anu;
  let h=`<div class="gx-kpis">
    <div class="gx-kpi"><span>Previsto / mes</span><b>${gxEur(mens)}</b></div>
    <div class="gx-kpi"><span>Anuales</span><b>${gxEur(anu)}</b></div>
    <div class="gx-kpi"><span>Total año</span><b>${gxEur(totalAnual)}</b></div>
  </div>`;
  h+=`<button class="btn btn-honey" onclick="gxRecNuevo()" style="margin-bottom:12px">+ Nuevo gasto previsto</button>`;
  if(!act.length && !gxRecs.length) return h+`<p class="sa-empty">Sin gastos previstos. Añade los fijos (Netlify, dominios, Supabase, Claude…).</p>`;
  gxRecs.forEach(r=>{
    const per = r.periodicidad==='mensual' ? `cada mes · día ${r.dia_mes||1}` : `anual${r.proxima_fecha?' · '+r.proxima_fecha:''}`;
    h+=`<div class="gx-card${r.activo===false?' off':''}">
      <div><b>${escHtml(r.concepto)}</b><span>${escHtml(gxProvNombre(r.proveedor_id))} · ${per}</span></div>
      <div style="text-align:right;white-space:nowrap">
        <b style="color:var(--navy)">${gxEur(r.importe)}</b><br>
        <button class="gx-mini" onclick="gxRecEditar('${r.id}')">✏️</button>
        <button class="gx-mini del" onclick="gxRecBorrar('${r.id}')">🗑</button>
      </div></div>`;
  });
  return h;
}

/* --- Proveedores --- */
function gxTabProvs(){
  let h=`<button class="btn btn-honey" onclick="gxProvNuevo()" style="margin-bottom:12px">+ Nuevo proveedor</button>`;
  if(!gxProvs.length) return h+`<p class="sa-empty">Sin proveedores todavía.</p>`;
  gxProvs.forEach(p=>{
    const n=gxGastos.filter(g=>String(g.proveedor_id)===String(p.id));
    const tot=n.reduce((t,g)=>t+Number(g.importe||0),0);
    h+=`<div class="gx-card">
      <div><b>${escHtml(p.nombre)}</b><span>${n.length} factura${n.length===1?'':'s'} · ${gxEur(tot)}</span></div>
      <div style="white-space:nowrap">
        <button class="gx-mini" onclick="gxProvEditar('${p.id}')">✏️</button>
        <button class="gx-mini del" onclick="gxProvBorrar('${p.id}')">🗑</button>
      </div></div>`;
  });
  return h;
}

/* --- Balance --- */
function gxTabBalance(){
  const ing={}, gas={};
  (window._factTodas||[]).forEach(f=>{ const mk=(f.fecha||'').slice(0,7); if(mk) ing[mk]=(ing[mk]||0)+Number(f.total||0); });
  gxGastos.forEach(g=>{ const mk=(g.fecha||'').slice(0,7); if(mk) gas[mk]=(gas[mk]||0)+Number(g.importe||0); });
  const meses=[...new Set([...Object.keys(ing),...Object.keys(gas)])].sort();
  if(!meses.length) return `<p class="sa-empty">Sin datos todavía: no hay ingresos ni gastos con fecha.</p>`;
  let ai=0, ag=0; const pts=meses.map(mk=>{ ai+=(ing[mk]||0); ag+=(gas[mk]||0); return {mk, i:ai, g:ag, mi:ing[mk]||0, mg:gas[mk]||0}; });
  const last=pts[pts.length-1];
  let h=`<div class="gx-kpis">
    <div class="gx-kpi"><span>Ing. acum.</span><b style="color:#15803d">${gxEur(last.i)}</b></div>
    <div class="gx-kpi"><span>Gastos acum.</span><b style="color:#b4232a">${gxEur(last.g)}</b></div>
    <div class="gx-kpi"><span>Resultado</span><b style="color:${last.i-last.g>=0?'#15803d':'#b4232a'}">${gxEur(last.i-last.g)}</b></div>
  </div>`;
  const maxB=Math.max(...pts.map(p=>Math.max(p.mi,p.mg)),1);
  h+=`<div style="border:1.5px solid var(--line);border-radius:12px;padding:14px;background:#fff;margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <b style="font-size:.8rem;color:var(--ink-soft)">Ingresos y gastos por mes</b>
      <span style="font-size:.72rem"><span style="color:#15803d">■</span> Ingresos &nbsp; <span style="color:#b4232a">■</span> Gastos</span>
    </div>
    <div class="gx-bars">`;
  pts.forEach(p=>{
    const hi=Math.max((p.mi/maxB)*100,p.mi>0?2:0), hg=Math.max((p.mg/maxB)*100,p.mg>0?2:0);
    h+=`<div class="gx-bcol">
      <div class="gx-bwrap">
        <div class="gx-bar ing" style="height:${hi}%" title="Ingresos ${gxEur(p.mi)}"><span>${p.mi?Math.round(p.mi):''}</span></div>
        <div class="gx-bar gas" style="height:${hg}%" title="Gastos ${gxEur(p.mg)}"><span>${p.mg?Math.round(p.mg):''}</span></div>
      </div>
      <div class="gx-blab">${p.mk.slice(5)}/${p.mk.slice(2,4)}</div>
    </div>`;
  });
  h+=`</div></div>`;
  h+=`<div class="gx-tabla-wrap"><table class="gx-tabla"><thead><tr><th>Mes</th>
    <th style="text-align:right">Ingresos</th><th style="text-align:right">Gastos</th><th style="text-align:right">Result.</th></tr></thead><tbody>`;
  pts.slice().reverse().forEach(p=>{
    const r=p.mi-p.mg;
    h+=`<tr><td>${p.mk}</td><td style="text-align:right">${gxEur(p.mi)}</td>
      <td style="text-align:right">${gxEur(p.mg)}</td>
      <td style="text-align:right;font-weight:700;color:${r>=0?'#15803d':'#b4232a'}">${gxEur(r)}</td></tr>`;
  });
  return h+`</tbody></table></div>`;
}

/* --- Wiring de filtros --- */
function gxWire(){
  const s=(id,fn)=>{ const e=$(id); if(e) e.onchange=fn; };
  s('gx-f-prov',(e)=>{ gxFProv=e.target.value; gxPintar(); });
  s('gx-f-est',(e)=>{ gxFEstado=e.target.value; gxPintar(); });
  s('gx-f-desde',(e)=>{ gxFDesde=e.target.value; gxPintar(); });
  s('gx-f-hasta',(e)=>{ gxFHasta=e.target.value; gxPintar(); });
  s('gx-f-cat',(e)=>{ gxFCat=e.target.value; gxPintar(); });
}

/* --- Alta / edición de gasto --- */
function gxNuevo(){ gxEdit={}; gxForm(); }
function gxEditar(id){ gxEdit=gxGastos.find(g=>String(g.id)===String(id))||{}; gxForm(); }
function gxDuplicar(id){
  const o=gxGastos.find(g=>String(g.id)===String(id));
  if(!o){ appAlert('No se encontró la factura.'); return; }
  gxEdit={
    fecha:new Date().toISOString().slice(0,10),
    proveedor_id:o.proveedor_id||null,
    numero:'',
    concepto:o.concepto||'',
    base:o.base,
    iva:o.iva,
    iva_pct:o.iva_pct,
    importe:o.importe,
    categoria:o.categoria||'Otros',
    deducible:o.deducible,
    inversion:o.inversion===true,
    vencimiento:null,
    pagada:false
  };
  gxForm();
}
function gxForm(){
  const g=gxEdit||{};
  const hoy=new Date().toISOString().slice(0,10);
  let h=`<button class="backbtn" onclick="gxSetTab('facturas')" style="margin-bottom:10px">← Gastos</button>
    <h2 style="font-size:1rem;font-weight:800;color:var(--navy);margin:2px 2px 12px">${g.id?'Editar':'Nueva'} factura de gasto</h2>`;
  h+=`<div class="gx-form">
    <label>Fecha</label><input type="date" id="gf-fecha" value="${g.fecha||hoy}">
    <label>Proveedor</label>
    <select id="gf-prov"><option value="">— Selecciona —</option>
      ${gxProvs.map(p=>`<option value="${p.id}"${String(g.proveedor_id)===String(p.id)?' selected':''}>${escHtml(p.nombre)}</option>`).join('')}</select>
    <label>Nº de factura</label><input id="gf-num" value="${escAttr(g.numero||'')}" placeholder="Ej.: A-2026/014">
    <label>Concepto</label><input id="gf-con" value="${escAttr(g.concepto||'')}" placeholder="Ej.: Dominio aptuvia.es">
    <label>Base imponible (€)</label><input type="number" step="0.01" id="gf-base" value="${g.base!=null?g.base:''}" oninput="gxCalcTotal()">
    <label>IVA (%)</label>
    <select id="gf-ivap" onchange="gxCalcTotal()">
      ${[21,10,4,0].map(v=>`<option value="${v}"${Number(g.iva_pct!=null?g.iva_pct:21)===v?' selected':''}>${v}%</option>`).join('')}
    </select>
    <label>Cuota IVA (€)</label><input type="number" step="0.01" id="gf-iva" value="${g.iva!=null?g.iva:''}" readonly style="background:#f6f1e6">
    <label>Total (€) *</label><input type="number" step="0.01" id="gf-imp" value="${g.importe||''}" oninput="gxCalcDesdeTotal()">
    <label>Categoría</label>
    <select id="gf-cat">
      ${['Hosting y dominios','Software y suscripciones','Servicios profesionales','Tasas e impuestos','Marketing','Material','Otros']
        .map(c=>`<option value="${escAttr(c)}"${(g.categoria||'Otros')===c?' selected':''}>${escHtml(c)}</option>`).join('')}
    </select>
    <label class="chk"><input type="checkbox" id="gf-ded" ${g.deducible===false?'':'checked'}> IVA deducible</label>
    <label class="chk"><input type="checkbox" id="gf-inv" ${g.inversion===true?'checked':''}> Bien de inversión (dura más de un año)</label>
    <label>Vencimiento (opcional)</label><input type="date" id="gf-venc" value="${g.vencimiento||''}">
    <label class="chk"><input type="checkbox" id="gf-pag" ${g.pagada?'checked':''}> Pagada</label>
    <label>Factura en PDF (opcional)</label><input type="file" id="gf-pdf" accept="application/pdf" onchange="gxAutoPDF(this)">
    <div id="gf-auto" style="font-size:.75rem;margin-top:4px;color:var(--ink-soft)"></div>
    ${g.pdf_url?`<div style="font-size:.75rem;margin-top:4px;display:flex;gap:14px;align-items:center"><a href="#" onclick="gxVerPDF('${escAttr(g.pdf_url)}');return false;">📄 Ver PDF actual</a><a href="#" style="color:#b4232a" onclick="gxBorrarPDF();return false;">🗑 Eliminar PDF</a></div>`:''}
  </div>
  <button class="btn btn-primary" onclick="gxGuardar()" style="margin-top:14px">Guardar</button>`;
  $('teacher').innerHTML=saShell(h);
}

function gxCalcTotal(){
  const b=parseFloat(($('gf-base')||{}).value)||0;
  const p=parseFloat(($('gf-ivap')||{}).value)||0;
  if(!b){ return; }
  const cuota=Math.round(b*p)/100;
  if($('gf-iva')) $('gf-iva').value=cuota.toFixed(2);
  if($('gf-imp')) $('gf-imp').value=(b+cuota).toFixed(2);
}
function gxCalcDesdeTotal(){
  const t=parseFloat(($('gf-imp')||{}).value)||0;
  const p=parseFloat(($('gf-ivap')||{}).value)||0;
  if(!t) return;
  const base=t/(1+p/100);
  if($('gf-base')) $('gf-base').value=base.toFixed(2);
  if($('gf-iva')) $('gf-iva').value=(t-base).toFixed(2);
}
/* --- Lectura automática de la factura en PDF (pdf.js + patrones por proveedor) --- */
function gxCargarPdfJs(){
  return new Promise((res,rej)=>{
    if(window.pdfjsLib){ res(window.pdfjsLib); return; }
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload=()=>{ try{ window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; }catch(e){} res(window.pdfjsLib); };
    s.onerror=()=>rej(new Error('No se pudo cargar el lector de PDF.'));
    document.head.appendChild(s);
  });
}
async function gxTextoPDF(file){
  const lib=await gxCargarPdfJs();
  const buf=await file.arrayBuffer();
  const doc=await lib.getDocument({data:buf}).promise;
  let out='';
  const n=Math.min(doc.numPages,3);
  for(let i=1;i<=n;i++){
    const pg=await doc.getPage(i);
    const tc=await pg.getTextContent();
    out+=' '+tc.items.map(it=>it.str).join(' ');
  }
  return out;
}
function gxNum(s,dec){
  if(s==null) return null;
  let t=String(s).trim();
  if(dec==='es'){ t=t.replace(/\./g,'').replace(',','.'); } else { t=t.replace(/,/g,''); }
  const n=parseFloat(t); return isNaN(n)?null:n;
}
const GX_MES_ES={ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,oct:10,nov:11,dic:12};
const GX_MES_EN={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
function gxISO(y,m,d){ return String(y)+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'); }
function gxParseFactura(raw){
  const t=String(raw||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  const low=t.toLowerCase();
  const r={ok:false, aviso:''};
  if(low.includes('dondominio')||low.includes('soluciones corporativas ip')){
    r.prov='dondominio'; r.categoria='Hosting y dominios'; r.ok=true;
    let m=t.match(/\b(DD\d{4}-\d{4,})\b/); if(m) r.numero=m[1];
    m=t.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/); if(m) r.fecha=gxISO(m[3],m[2],m[1]);
    m=t.match(/Subtotal\s*([\d.,]+)\s*€/i); if(m) r.base=gxNum(m[1],'es');
    m=t.match(/Cuota IVA\s*\(\s*([\d.,]+)\s*%\s*\)\s*([\d.,]+)\s*€/i); if(m){ r.iva_pct=gxNum(m[1],'es'); r.iva=gxNum(m[2],'es'); }
    m=t.match(/\bTotal\s*([\d.,]+)\s*€/i); if(m) r.importe=gxNum(m[1],'es');
    m=t.match(/CONCEPTO\s+CANTIDAD\s+IMPORTE\s+(.+?)\s+\d+\s*a[nñ]o\/s/i); if(m) r.concepto=m[1].trim().slice(0,70);
    return r;
  }
  if(low.includes('netlify')){
    r.prov='netlify'; r.categoria='Hosting y dominios'; r.ok=true; r.concepto='Suscripción Netlify';
    let m=t.match(/Invoice number\s*([A-Z0-9]+-[0-9]+)/i); if(m) r.numero=m[1];
    m=t.match(/Invoice date\s*([A-Za-z]{3})[a-z]*\s+(\d{1,2}),?\s*(\d{4})/i);
    if(m){ const mm=GX_MES_EN[m[1].toLowerCase()]; if(mm) r.fecha=gxISO(m[3],mm,m[2]); }
    m=t.match(/Amount due\s*\$?\s*([\d.,]+)/i); if(m){ r.importe=gxNum(m[1],'en'); r.base=r.importe; }
    r.iva_pct=0; r.iva=0; r.deducible=false;
    if(/\$/.test(t)) r.aviso='Factura en USD: pon el importe real en € que te cobró el banco.';
    return r;
  }
  if(low.includes('google play')||low.includes('google commerce')){
    r.prov='google'; r.categoria='Software y suscripciones'; r.ok=true;
    let m=t.match(/N[úu]mero de pedido:\s*(\S+)/i); if(m) r.numero=m[1];
    m=t.match(/Fecha del pedido:\s*(\d{1,2})\s+([a-zé]{3})[a-zé]*\.?\s+(\d{4})/i);
    if(m){ const mm=GX_MES_ES[m[2].toLowerCase()]; if(mm) r.fecha=gxISO(m[3],mm,m[1]); }
    m=t.match(/Total:\s*([\d.,]+)\s*€/i); if(m) r.importe=gxNum(m[1],'es');
    m=t.match(/Incluye\s*([\d.,]+)\s*€\s*de IVA/i); if(m) r.iva=gxNum(m[1],'es');
    if(r.importe!=null&&r.iva!=null){
      r.base=Math.round((r.importe-r.iva)*100)/100;
      if(r.base>0){ const p=Math.round((r.iva/r.base)*100); r.iva_pct=[21,10,4,0].indexOf(p)>=0?p:21; }
    }
    m=t.match(/Art[íi]culo\s+Precio\s+(.+?)\s+\d+,\d{2}\s*€/i); if(m) r.concepto=m[1].replace(/\s+/g,' ').trim().slice(0,70);
    return r;
  }
  r.aviso='No reconozco el proveedor de este PDF. Rellena los datos a mano.';
  return r;
}
const GX_PROV_CLAVES={ dondominio:['dondominio','soluciones corporativas'], netlify:['netli'], google:['google'] };
function gxProvIdPorClave(prov){
  const cl=GX_PROV_CLAVES[prov]||[];
  const p=gxProvs.find(x=>cl.some(c=>String(x.nombre||'').toLowerCase().includes(c)));
  return p?p.id:null;
}
async function gxAutoPDF(inp){
  const av=$('gf-auto');
  const file=inp&&inp.files&&inp.files[0];
  if(!file){ if(av) av.textContent=''; return; }
  if(av) av.textContent='Leyendo el PDF…';
  let d;
  try{ d=gxParseFactura(await gxTextoPDF(file)); }
  catch(e){ if(av) av.textContent='No se pudo leer el PDF ('+(e.message||'')+'). Rellena a mano.'; return; }
  if(!d.ok){ if(av) av.textContent='⚠️ '+(d.aviso||'No se pudo interpretar el PDF.'); return; }
  const set=(id,v)=>{ const e=$(id); if(e&&v!=null&&v!=='') e.value=v; };
  set('gf-fecha',d.fecha); set('gf-num',d.numero); set('gf-con',d.concepto);
  set('gf-base',d.base!=null?Number(d.base).toFixed(2):null);
  set('gf-iva',d.iva!=null?Number(d.iva).toFixed(2):null);
  set('gf-imp',d.importe!=null?Number(d.importe).toFixed(2):null);
  if(d.iva_pct!=null&&$('gf-ivap')) $('gf-ivap').value=String(d.iva_pct);
  if(d.categoria&&$('gf-cat')) $('gf-cat').value=d.categoria;
  if(d.deducible===false&&$('gf-ded')) $('gf-ded').checked=false;
  const pid=gxProvIdPorClave(d.prov);
  if(pid&&$('gf-prov')) $('gf-prov').value=String(pid);
  if(av) av.innerHTML='✅ Datos leídos del PDF — <b>revísalos antes de guardar</b>.'+(d.aviso?'<br>⚠️ '+escHtml(d.aviso):'')+(pid?'':'<br>⚠️ El proveedor no está dado de alta: selecciónalo o créalo.');
}

async function gxGuardar(){
  const val=(id)=>{ const e=$(id); return e?e.value.trim():''; };
  const body={
    fecha: val('gf-fecha')||null,
    proveedor_id: val('gf-prov')||null,
    numero: val('gf-num')||null,
    concepto: val('gf-con')||null,
    importe: Number(val('gf-imp')||0),
    base: val('gf-base')!=='' ? Number(val('gf-base')) : null,
    iva: val('gf-iva')!=='' ? Number(val('gf-iva')) : null,
    iva_pct: val('gf-ivap')!=='' ? Number(val('gf-ivap')) : null,
    categoria: val('gf-cat')||'Otros',
    deducible: !!($('gf-ded')&&$('gf-ded').checked),
    inversion: !!($('gf-inv')&&$('gf-inv').checked),
    vencimiento: val('gf-venc')||null,
    pagada: !!($('gf-pag')&&$('gf-pag').checked)
  };
  if(!body.fecha||!body.concepto||!body.importe){ appAlert('Fecha, concepto e importe son obligatorios.'); return; }
  try{
    const f=$('gf-pdf'); const file=f&&f.files&&f.files[0];
    if(file){
      const safe=(file.name||'factura.pdf').replace(/[^a-zA-Z0-9._-]/g,'_').slice(-60);
      const path='gastos/'+Date.now()+'_'+safe;
      const up=await fetch(SUPABASE_URL+'/storage/v1/object/facturas-gastos/'+encodeURI(path),{
        method:'POST',
        headers:{ 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+token, 'Content-Type':file.type||'application/octet-stream' },
        body:file
      });
      if(!up.ok){
        let det=''; try{ const t=await up.text(); const j=JSON.parse(t); det=j.message||j.error||t; }catch(e){}
        throw new Error('Storage '+up.status+': '+(det||'sin detalle'));
      }
      body.pdf_url=path;
    }
    if(gxEdit&&gxEdit.id){
      await call(`/rest/v1/gastos?id=eq.${gxEdit.id}`,{method:'PATCH',body});
    }else{
      await call('/rest/v1/gastos',{method:'POST',body});
    }
    gxEdit=null; gxTab='facturas'; await gxRender();
  }catch(e){ appAlert('No se pudo guardar: '+(e.message||'')); }
}
async function gxTogglePagada(id,v){
  try{ await call(`/rest/v1/gastos?id=eq.${id}`,{method:'PATCH',body:{pagada:v==='true'||v===true}}); await gxRender(); }
  catch(e){ appAlert('Error: '+(e.message||'')); }
}
async function gxBorrar(id){
  if(!await appConfirm('¿Borrar esta factura de gasto?')) return;
  try{ await call(`/rest/v1/gastos?id=eq.${id}`,{method:'DELETE'}); await gxRender(); }
  catch(e){ appAlert('Error: '+(e.message||'')); }
}
async function gxVerPDF(path){
  try{
    const r=await fetch(SUPABASE_URL+'/storage/v1/object/sign/facturas-gastos/'+encodeURI(path),{
      method:'POST', headers:{apikey:SUPABASE_KEY, Authorization:'Bearer '+token, 'Content-Type':'application/json'},
      body:JSON.stringify({expiresIn:3600})});
    const d=await r.json();
    if(d&&d.signedURL) window.open(`${SUPABASE_URL}/storage/v1${d.signedURL}`,'_blank');
    else throw new Error('sin URL');
  }catch(e){ appAlert('No se pudo abrir el PDF.'); }
}
async function gxBorrarPDF(){
  const g=gxEdit||{};
  if(!g.pdf_url){ return; }
  if(!await appConfirm('¿Eliminar el PDF de esta factura de gasto?')) return;
  const path=g.pdf_url;
  try{
    await fetch(SUPABASE_URL+'/storage/v1/object/facturas-gastos/'+encodeURI(path),{
      method:'DELETE', headers:{ 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+token }});
    if(g.id){
      await call(`/rest/v1/gastos?id=eq.${g.id}`,{method:'PATCH',body:{pdf_url:null}});
      const ref=gxGastos.find(x=>String(x.id)===String(g.id)); if(ref) ref.pdf_url=null;
    }
    gxEdit.pdf_url=null;
    gxForm();
  }catch(e){ appAlert('No se pudo eliminar: '+(e.message||'')); }
}
function gxCSV(){
  let list=gxGastos.slice();
  if(gxFProv!=='todos') list=list.filter(g=>String(g.proveedor_id)===String(gxFProv));
  if(gxFEstado==='pagadas') list=list.filter(g=>g.pagada===true);
  if(gxFEstado==='pendientes') list=list.filter(g=>g.pagada!==true);
  if(gxFDesde) list=list.filter(g=>(g.fecha||'')>=gxFDesde);
  if(gxFHasta) list=list.filter(g=>(g.fecha||'')<=gxFHasta);
  if(gxFCat!=='todas') list=list.filter(g=>(g.categoria||'Otros')===gxFCat);
  const esc=(s)=>'"'+String(s==null?'':s).replace(/"/g,'""')+'"';
  let csv='Fecha;Proveedor;Numero;Concepto;Categoria;Base;IVA_pct;IVA;Total;Deducible;Pagada\n';
  list.forEach(g=>{ csv+=[g.fecha||'',gxProvNombre(g.proveedor_id),g.numero||'',g.concepto||'',g.categoria||'Otros',
    (g.base!=null?Number(g.base).toFixed(2):''),(g.iva_pct!=null?g.iva_pct:''),(g.iva!=null?Number(g.iva).toFixed(2):''),
    (Number(g.importe)||0).toFixed(2), g.deducible===false?'No':'Si', g.pagada?'Si':'No'].map(esc).join(';')+'\n'; });
  const tB=list.reduce((t,g)=>t+Number(g.base||0),0), tI=list.filter(g=>g.deducible!==false).reduce((t,g)=>t+Number(g.iva||0),0), tT=list.reduce((t,g)=>t+Number(g.importe||0),0);
  csv+=[ '','','','TOTAL','',tB.toFixed(2),'',tI.toFixed(2),tT.toFixed(2),'',''].map(esc).join(';')+'\n';
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
  a.download='aptuvia_gastos.csv'; a.click();
}

/* --- Proveedores CRUD --- */
function gxProvNuevo(){ gxProvEdit={}; gxProvForm(); }
function gxProvEditar(id){ gxProvEdit=gxProvs.find(p=>String(p.id)===String(id))||{}; gxProvForm(); }
function gxProvForm(){
  const p=gxProvEdit||{};
  let h=`<button class="backbtn" onclick="gxSetTab('provs')" style="margin-bottom:10px">← Proveedores</button>
    <h2 style="font-size:1rem;font-weight:800;color:var(--navy);margin:2px 2px 12px">${p.id?'Editar':'Nuevo'} proveedor</h2>
    <div class="gx-form">
      <label>Nombre *</label><input id="pf-nom" value="${escAttr(p.nombre||'')}">
      <label>NIF / CIF</label><input id="pf-nif" value="${escAttr(p.nif||'')}">
      <label>Email</label><input id="pf-mail" value="${escAttr(p.email||'')}">
      <label>Teléfono</label><input id="pf-tel" value="${escAttr(p.telefono||'')}">
      <label>Dirección</label><input id="pf-dir" value="${escAttr(p.direccion||'')}">
      <label>Notas</label><input id="pf-not" value="${escAttr(p.notas||'')}">
    </div>
    <button class="btn btn-primary" onclick="gxProvGuardar()" style="margin-top:14px">Guardar</button>`;
  $('teacher').innerHTML=saShell(h);
}
async function gxProvGuardar(){
  const v=(id)=>{ const e=$(id); return e?e.value.trim():''; };
  const body={nombre:v('pf-nom'),nif:v('pf-nif')||null,email:v('pf-mail')||null,telefono:v('pf-tel')||null,direccion:v('pf-dir')||null,notas:v('pf-not')||null};
  if(!body.nombre){ appAlert('El nombre es obligatorio.'); return; }
  try{
    if(gxProvEdit&&gxProvEdit.id) await call(`/rest/v1/proveedores?id=eq.${gxProvEdit.id}`,{method:'PATCH',body});
    else await call('/rest/v1/proveedores',{method:'POST',body});
    gxProvEdit=null; gxTab='provs'; await gxRender();
  }catch(e){ appAlert('No se pudo guardar: '+(e.message||'')); }
}
async function gxProvBorrar(id){
  if(!await appConfirm('¿Borrar este proveedor? Sus facturas quedarán sin proveedor asignado.')) return;
  try{ await call(`/rest/v1/proveedores?id=eq.${id}`,{method:'DELETE'}); await gxRender(); }
  catch(e){ appAlert('Error: '+(e.message||'')); }
}

/* --- Gastos previstos CRUD --- */
function gxRecNuevo(){ gxRecEdit={}; gxRecForm(); }
function gxRecEditar(id){ gxRecEdit=gxRecs.find(r=>String(r.id)===String(id))||{}; gxRecForm(); }
function gxRecForm(){
  const r=gxRecEdit||{};
  let h=`<button class="backbtn" onclick="gxSetTab('prev')" style="margin-bottom:10px">← Previstos</button>
    <h2 style="font-size:1rem;font-weight:800;color:var(--navy);margin:2px 2px 12px">${r.id?'Editar':'Nuevo'} gasto previsto</h2>
    <div class="gx-form">
      <label>Concepto *</label><input id="rf-con" value="${escAttr(r.concepto||'')}" placeholder="Ej.: Supabase Pro">
      <label>Proveedor</label>
      <select id="rf-prov"><option value="">— Selecciona —</option>
        ${gxProvs.map(p=>`<option value="${p.id}"${String(r.proveedor_id)===String(p.id)?' selected':''}>${escHtml(p.nombre)}</option>`).join('')}</select>
      <label>Importe (€) *</label><input type="number" step="0.01" id="rf-imp" value="${r.importe||''}">
      <label>Periodicidad</label>
      <select id="rf-per">
        <option value="mensual"${r.periodicidad!=='anual'?' selected':''}>Mensual</option>
        <option value="anual"${r.periodicidad==='anual'?' selected':''}>Anual</option>
      </select>
      <label>Día del mes (si es mensual)</label><input type="number" min="1" max="31" id="rf-dia" value="${r.dia_mes||1}">
      <label>Próxima fecha (si es anual)</label><input type="date" id="rf-prox" value="${r.proxima_fecha||''}">
      <label style="display:flex;align-items:center;gap:8px;margin-top:4px"><input type="checkbox" id="rf-act" ${r.activo===false?'':'checked'}> Activo</label>
    </div>
    <button class="btn btn-primary" onclick="gxRecGuardar()" style="margin-top:14px">Guardar</button>`;
  $('teacher').innerHTML=saShell(h);
}
async function gxRecGuardar(){
  const v=(id)=>{ const e=$(id); return e?e.value.trim():''; };
  const body={concepto:v('rf-con'), proveedor_id:v('rf-prov')||null, importe:Number(v('rf-imp')||0),
    periodicidad:v('rf-per')||'mensual', dia_mes:Number(v('rf-dia')||1), proxima_fecha:v('rf-prox')||null,
    activo: !!($('rf-act')&&$('rf-act').checked)};
  if(!body.concepto||!body.importe){ appAlert('Concepto e importe son obligatorios.'); return; }
  try{
    if(gxRecEdit&&gxRecEdit.id) await call(`/rest/v1/gastos_recurrentes?id=eq.${gxRecEdit.id}`,{method:'PATCH',body});
    else await call('/rest/v1/gastos_recurrentes',{method:'POST',body});
    gxRecEdit=null; gxTab='prev'; await gxRender();
  }catch(e){ appAlert('No se pudo guardar: '+(e.message||'')); }
}
async function gxRecBorrar(id){
  if(!await appConfirm('¿Borrar este gasto previsto?')) return;
  try{ await call(`/rest/v1/gastos_recurrentes?id=eq.${id}`,{method:'DELETE'}); await gxRender(); }
  catch(e){ appAlert('Error: '+(e.message||'')); }
}

/* --- Aviso al abrir la app (solo admin, 1 vez al día) --- */
async function gxAvisoInicio(){
  try{
    const hoy=new Date().toISOString().slice(0,10);
    if(localStorage.getItem('gx_aviso_visto')===hoy) return;
    const [g,r]=await Promise.all([
      call('/rest/v1/gastos?select=id,numero,concepto,importe,vencimiento,pagada'),
      call('/rest/v1/gastos_recurrentes?select=*')
    ]);
    gxGastos=g||[]; gxRecs=r||[];
    const av=gxCalcAvisos();
    if(!av.length) return;
    localStorage.setItem('gx_aviso_visto',hoy);
    appAlert('🔔 Avisos de facturación:\n\n'+av.map(a=>'• '+a.txt).join('\n'));
  }catch(e){}
}

function saToggleMes(mk){
  window._factMesAbierto = window._factMesAbierto || {__init:true};
  window._factMesAbierto[mk] = !window._factMesAbierto[mk];
  saPintarFacturasEmitidas();
}
function saFactSub(v){ window._factSub=v; guardarPanel(); saRenderFacturacionLista(); }

async function saCargarClientesAA(){
  let profs=[];
  try{ const all=await call('/rest/v1/rpc/sa_aa_usuarios',{method:'POST',body:{}})||[]; profs=all.filter(u=>u.rol==='profesor'); }catch(e){}
  const cont=$('fact-aa-lista'); if(!cont) return;
  if(!profs.length){ cont.innerHTML='<p class="sa-empty" style="font-size:.82rem">No hay clientes de Aula Abierta.</p>'; return; }
  let h='';
  profs.forEach(p=>{
    const bloq=p.bloqueado===true;
    h+=`<div class="sa-card" data-factaa="${p.id}" data-factaanom="${escAttr(p.nombre||p.email)}" style="${bloq?'opacity:.72':''}">
      <div class="sa-card-top"><b>${escHtml(p.nombre||p.email)}${bloq?' <span style="color:#b4232a;font-size:.7rem;font-weight:800">🔒</span>':''}</b><span class="sa-id">AA</span></div>
      <div class="sa-counts"><span>${escHtml(p.email)}</span></div>
      <span class="sa-open">Facturar →</span>
    </div>`;
  });
  cont.innerHTML=h;
  cont.querySelectorAll('.sa-card[data-factaa]').forEach(c=> c.onclick=()=>saAbrirFacturacionAA(c.dataset.factaa, c.dataset.factaanom));
}

async function saAbrirFacturacion(academiaId){
  const a=(saAcademias||[]).find(x=>x.academia_id===academiaId)||{academia_id:academiaId,nombre:'#'+academiaId,n_profes:0,n_certificados:0};
  $('teacher').innerHTML=saShell('<div class="loader"><span class="spin"></span></div>');
  let datos={}, facturas=[];
  try{ const d=await call('/rest/v1/datos_facturacion?academia_id=eq.'+academiaId); if(d&&d[0]) datos=d[0]; }catch(e){}
  try{ facturas=await call('/rest/v1/facturas?academia_id=eq.'+academiaId+'&order=creado_en.desc')||[]; }catch(e){}
  window._fact={
    academiaId, profesorId:null, academiaNombre:a.nombre,
    datos,
    rec:[ {nombre:'Acceso por profesor', precio:14, cant:(a.n_profes||0)} ],
    uni:(a.n_certificados||0)>0 ? [ {nombre:'Certificado de profesionalidad', precio:198, cant:(a.n_certificados||0)} ] : [],
    descuento:0, iva:21,
    facturas
  };
  saRenderFacturacion();
}

async function saAbrirFacturacionAA(profesorId, nombre){
  $('teacher').innerHTML=saShell('<div class="loader"><span class="spin"></span></div>');
  let datos={}, facturas=[];
  try{ const d=await call('/rest/v1/datos_facturacion?profesor_id=eq.'+profesorId); if(d&&d[0]) datos=d[0]; }catch(e){}
  try{ facturas=await call('/rest/v1/facturas?profesor_id=eq.'+profesorId+'&order=creado_en.desc')||[]; }catch(e){}
  window._fact={
    academiaId:null, profesorId, academiaNombre:nombre||'Aula Abierta',
    datos,
    rec:[ {nombre:'Aula Abierta · Plan Individual', precio:19, cant:1} ],
    uni:[],
    descuento:0, iva:21,
    facturas
  };
  saRenderFacturacion();
}

function factLineHtml(tipo, i, l){
  return `<div class="fact-line" style="display:grid;grid-template-columns:auto 1fr auto auto;gap:6px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)">
    <button onclick="factDelLinea('${tipo}',${i})" title="Quitar" style="background:#fdeaea;border:1px solid #f3c4c4;border-radius:7px;padding:3px 6px;font-size:.75rem;line-height:1;cursor:pointer">🗑</button>
    <input data-fl="${tipo}-${i}-nombre" value="${escAttr(l.nombre)}" style="font-size:.82rem;padding:6px 8px;border:1px solid var(--line);border-radius:8px;min-width:0">
    <input data-fl="${tipo}-${i}-precio" type="number" step="0.01" value="${l.precio}" style="width:60px;font-size:.82rem;padding:6px 6px;border:1px solid var(--line);border-radius:8px;text-align:right" oninput="factRecalc()">
    <input data-fl="${tipo}-${i}-cant" type="number" step="1" value="${l.cant}" style="width:46px;font-size:.82rem;padding:6px 6px;border:1px solid var(--line);border-radius:8px;text-align:center" oninput="factRecalc()">
  </div>`;
}

function saRenderFacturacion(){
  const f=window._fact; const d=f.datos||{};
  let h=`<button class="backbtn" onclick="saSetMain('fact')" style="margin-bottom:10px">← Gestión</button>
    <h2 style="font-size:1.1rem;font-weight:800;color:var(--navy);margin:2px 2px 4px">Factura · ${escHtml(f.academiaNombre)}</h2>`;

  // Ficha del cliente (desplegable)
  h+=`<details style="margin:10px 0;border:1.5px solid var(--honey);border-radius:12px;padding:10px 12px;background:var(--honey-tint)">
    <summary style="font-weight:700;color:var(--navy);cursor:pointer">🧾 Datos fiscales del cliente</summary>
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
      ${['razon_social:Razón social','nif:NIF / CIF','direccion:Dirección','cp:C.P.','poblacion:Población','provincia:Provincia','email:Email','telefono:Teléfono'].map(par=>{
        const [k,lab]=par.split(':');
        return `<input data-df="${k}" placeholder="${lab}" value="${escAttr(d[k]||'')}" style="font-size:.85rem;padding:8px 10px;border:1px solid var(--line);border-radius:8px">`;
      }).join('')}
      <textarea data-df="observaciones" placeholder="Observaciones (notas internas, condiciones, forma de pago…)" rows="3" style="font-size:.85rem;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-family:inherit;resize:vertical">${escHtml(d.observaciones||'')}</textarea>
      <div style="display:flex;gap:8px">
        <div style="flex:1"><label style="font-size:.72rem;color:var(--ink-soft)">Inicio contrato</label><input data-df="contrato_inicio" type="date" value="${escAttr(d.contrato_inicio||'')}" style="width:100%;font-size:.82rem;padding:7px 8px;border:1px solid var(--line);border-radius:8px;box-sizing:border-box"></div>
        <div style="flex:1"><label style="font-size:.72rem;color:var(--ink-soft)">Fin contrato</label><input data-df="contrato_fin" type="date" value="${escAttr(d.contrato_fin||'')}" style="width:100%;font-size:.82rem;padding:7px 8px;border:1px solid var(--line);border-radius:8px;box-sizing:border-box"></div>
      </div>
      ${d.contrato_fin?`<p style="font-size:.74rem;color:${(d.contrato_fin<new Date().toISOString().slice(0,10))?'#b4232a':'var(--ink-soft)'};margin:2px 0 0">${(d.contrato_fin<new Date().toISOString().slice(0,10))?'⚠️ Contrato finalizado el '+d.contrato_fin:'Contrato vigente hasta '+d.contrato_fin}</p>`:''}
      <button class="btn btn-ghost" onclick="factGuardarDatos()" style="margin-top:4px">Guardar datos del cliente</button>
    </div>
  </details>`;

  // Bloque recurrente (título limpio + presets en desplegable)
  h+=`<h3 style="font-size:.82rem;font-weight:800;letter-spacing:.5px;color:var(--navy);margin:16px 2px 8px">Este mes</h3>`;
  h+=`<div style="display:grid;grid-template-columns:1fr auto auto auto;gap:6px;font-size:.68rem;color:var(--ink-soft);padding:0 2px"><span>Concepto</span><span>Precio</span><span>Cant.</span><span></span></div>`;
  f.rec.forEach((l,i)=> h+=factLineHtml('rec',i,l));
  h+=`<details style="margin-top:8px;border:1px solid var(--line);border-radius:10px;padding:8px 12px">
    <summary style="font-size:.8rem;font-weight:700;color:var(--navy);cursor:pointer">Añadir partida mensual</summary>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${TARIFAS_REC.map(t=>`<button class="fact-add" onclick="factAddPreset('rec','${t.k}')" style="font-size:.72rem;padding:5px 9px;border:1px dashed var(--navy);border-radius:16px;background:#fff;color:var(--navy);cursor:pointer">+ ${escHtml(t.nombre)} (${t.precio}€)</button>`).join('')}<button class="fact-add" onclick="factAddLibre('rec')" style="font-size:.72rem;padding:5px 9px;border:1px dashed var(--honey);border-radius:16px;background:var(--honey-tint);color:var(--honey-ink,#b26a00);cursor:pointer;font-weight:700">✏️ Línea libre</button></div>
  </details>`;

  // Bloque pago único (presets en desplegable)
  h+=`<h3 style="font-size:.82rem;font-weight:800;letter-spacing:.5px;color:var(--navy);margin:18px 2px 8px">Pago único</h3>`;
  h+=`<div style="display:grid;grid-template-columns:1fr auto auto auto;gap:6px;font-size:.68rem;color:var(--ink-soft);padding:0 2px"><span>Concepto</span><span>Precio</span><span>Cant.</span><span></span></div>`;
  f.uni.forEach((l,i)=> h+=factLineHtml('uni',i,l));
  h+=`<details style="margin-top:8px;border:1px solid var(--line);border-radius:10px;padding:8px 12px">
    <summary style="font-size:.8rem;font-weight:700;color:var(--navy);cursor:pointer">Añadir pago único</summary>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${TARIFAS_UNI.map(t=>`<button class="fact-add" onclick="factAddPreset('uni','${t.k}')" style="font-size:.72rem;padding:5px 9px;border:1px dashed var(--navy);border-radius:16px;background:#fff;color:var(--navy);cursor:pointer">+ ${escHtml(t.nombre)} (${t.precio}€)</button>`).join('')}<button class="fact-add" onclick="factAddLibre('uni')" style="font-size:.72rem;padding:5px 9px;border:1px dashed var(--honey);border-radius:16px;background:var(--honey-tint);color:var(--honey-ink,#b26a00);cursor:pointer;font-weight:700">✏️ Línea libre</button></div>
  </details>`;

  // Descuento e IVA + totales
  h+=`<div style="margin-top:18px;padding-top:12px;border-top:2px solid var(--line)">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <span style="font-size:.85rem">Descuento %</span>
      <input data-fx="descuento" type="number" step="0.01" value="${f.descuento}" style="width:70px;padding:6px;border:1px solid var(--line);border-radius:8px;text-align:right" oninput="factRecalc()">
      <span style="font-size:.85rem;margin-left:auto">IVA %</span>
      <input data-fx="iva" type="number" step="0.01" value="${f.iva}" style="width:70px;padding:6px;border:1px solid var(--line);border-radius:8px;text-align:right" oninput="factRecalc()">
    </div>
    <div id="fact-totales" style="font-size:.9rem;line-height:1.9"></div>
  </div>`;

  h+=`<button class="btn btn-honey" onclick="factGenerarPDF()" style="margin-top:14px">📄 Generar factura PDF</button>`;
  h+=`<button onclick="driveAbrir()" style="margin-top:8px;width:100%;background:#fff;border:1.5px solid var(--line);color:var(--navy);font-weight:700;border-radius:12px;padding:10px;cursor:pointer;font-family:inherit;font-size:.82rem">📁 Abrir Drive para guardarla</button>`;
  h+=`<button onclick="factEnviarCliente()" style="margin-top:10px;width:100%;background:var(--honey-tint);border:1.5px solid var(--honey);color:var(--navy);font-weight:700;border-radius:12px;padding:12px;cursor:pointer;font-family:inherit;font-size:.9rem">✉️ Enviar factura al cliente</button>`;

  // Facturas guardadas
  if(f.facturas && f.facturas.length){
    h+=`<h3 style="font-size:.78rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--ink-soft);margin:20px 2px 6px">Facturas guardadas</h3>`;
    f.facturas.forEach(fc=>{
      h+=`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;margin-bottom:6px">
        <span style="font-size:.82rem"><b>${escHtml(fc.numero||'—')}</b> · ${escHtml(fc.fecha||'')} · ${Number(fc.total||0).toFixed(2)}€</span>
        <span style="display:flex;gap:6px">
          <button onclick="factVerFactura('${fc.id}')" title="Ver / descargar" style="background:#eef0fb;border:1px solid #c9cef0;border-radius:8px;padding:5px 8px;cursor:pointer">👁</button>
          <button onclick="factBorrar('${fc.id}')" title="Borrar" style="background:#fdeaea;border:1px solid #f3c4c4;border-radius:8px;padding:5px 8px;cursor:pointer">🗑</button>
        </span>
      </div>`;
    });
  }

  $('teacher').innerHTML=saShell(h);
  factRecalc();
}

function factLeerDOM(){
  const f=window._fact;
  ['rec','uni'].forEach(tipo=>{
    f[tipo].forEach((l,i)=>{
      const nom=document.querySelector(`[data-fl="${tipo}-${i}-nombre"]`);
      const pre=document.querySelector(`[data-fl="${tipo}-${i}-precio"]`);
      const can=document.querySelector(`[data-fl="${tipo}-${i}-cant"]`);
      if(nom) l.nombre=nom.value;
      if(pre) l.precio=parseFloat(pre.value)||0;
      if(can) l.cant=parseFloat(can.value)||0;
    });
  });
  const dd=document.querySelector('[data-fx="descuento"]'); if(dd) f.descuento=parseFloat(dd.value)||0;
  const iv=document.querySelector('[data-fx="iva"]'); if(iv) f.iva=parseFloat(iv.value)||0;
}

function factCalc(){
  const f=window._fact;
  const sum=arr=>arr.reduce((t,l)=>t+(l.precio*l.cant),0);
  const subtotal=sum(f.rec)+sum(f.uni);
  const desc=subtotal*(f.descuento/100);
  const base=subtotal-desc;
  const iva=base*(f.iva/100);
  const total=base+iva;
  return {subtotal,desc,base,iva,total};
}

function factRecalc(){
  factLeerDOM();
  const t=factCalc(); const f=window._fact;
  const box=$('fact-totales'); if(!box) return;
  let h=`<div style="display:flex;justify-content:space-between"><span>Subtotal</span><b>${t.subtotal.toFixed(2)} €</b></div>`;
  if(f.descuento>0) h+=`<div style="display:flex;justify-content:space-between;color:#b4232a"><span>Descuento (${f.descuento}%)</span><b>-${t.desc.toFixed(2)} €</b></div>`;
  h+=`<div style="display:flex;justify-content:space-between"><span>IVA (${f.iva}%)</span><b>${t.iva.toFixed(2)} €</b></div>`;
  h+=`<div style="display:flex;justify-content:space-between;font-size:1.05rem;border-top:1px solid var(--line);margin-top:4px;padding-top:4px"><span><b>TOTAL</b></span><b style="color:var(--navy)">${t.total.toFixed(2)} €</b></div>`;
  box.innerHTML=h;
}

function factAddPreset(tipo,k){
  factLeerDOM();
  const src=(tipo==='rec'?TARIFAS_REC:TARIFAS_UNI).find(t=>t.k===k);
  if(!src) return;
  window._fact[tipo].push({nombre:src.nombre, precio:src.precio, cant:1});
  saRenderFacturacion();
}
function factAddLibre(tipo){
  factLeerDOM();
  window._fact[tipo].push({nombre:'', precio:0, cant:1});
  saRenderFacturacion();
}
function factDelLinea(tipo,i){
  factLeerDOM();
  window._fact[tipo].splice(i,1);
  saRenderFacturacion();
}

async function factGuardarDatos(){
  const f=window._fact; const datos={};
  document.querySelectorAll('[data-df]').forEach(inp=>{ datos[inp.dataset.df]=inp.value.trim(); });
  try{
    await call('/rest/v1/rpc/sa_guardar_datos_fact',{method:'POST',body:{p_academia:f.academiaId,p_datos:datos,p_profesor:f.profesorId||null}});
    f.datos=datos;
    appAlert('✅ Datos del cliente guardados.');
  }catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}

async function factBorrar(id){
  if(await factRealOn()){ appAlert('🔒 Facturación real activada: las facturas emitidas no pueden borrarse. Emite una rectificativa.'); return; }
  if(!await appConfirm('¿Borrar esta factura guardada? No se puede deshacer.')) return;
  try{
    await call('/rest/v1/rpc/sa_borrar_factura',{method:'POST',body:{p_id:id}});
    window._fact.facturas=(window._fact.facturas||[]).filter(x=>x.id!==id);
    saRenderFacturacion();
  }catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}

// Dibuja y descarga el PDF de una factura. data:{numero,fecha,nombreCliente,d(datos fiscales),rec,uni,descuento,iva}
function factRenderPDF(data){
  if(!window.jspdf){ appAlert('No se pudo cargar el generador de PDF. Comprueba tu conexión.'); return; }
  const d=data.d||{}; const rec=data.rec||[]; const uni=data.uni||[];
  const sum=arr=>arr.reduce((tt,l)=>tt+(l.precio*l.cant),0);
  const subtotal=sum(rec)+sum(uni);
  const desc=subtotal*((data.descuento||0)/100);
  const base=subtotal-desc;
  const iva=base*((data.iva||0)/100);
  const total=base+iva;
  const { jsPDF }=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const M=16; let y=20;
  const NAVY=[46,49,99], INK=[30,26,16], SOFT=[110,110,120];
  pdfLogo(doc, M, y-6, 42);
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...INK);
  doc.text('FACTURA', 210-M, y, {align:'right'});
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...SOFT);
  doc.text('Nº '+data.numero, 210-M, y+5, {align:'right'});
  doc.text('Fecha: '+data.fecha, 210-M, y+10, {align:'right'});
  y+=22;
  doc.setDrawColor(220,220,225); doc.line(M,y,210-M,y); y+=8;
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...SOFT); doc.text('FACTURAR A', M, y); y+=5;
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...INK);
  const cliLineas=[ d.razon_social||data.nombreCliente, d.nif?('NIF: '+d.nif):'', d.direccion||'', [d.cp,d.poblacion,d.provincia].filter(Boolean).join(' '), d.email||'', d.telefono||'' ].filter(Boolean);
  cliLineas.forEach(l=>{ doc.text(l, M, y); y+=5; });
  y+=6;
  const drawFila=(c1,c2,c3,c4,bold)=>{
    doc.setFont('helvetica',bold?'bold':'normal'); doc.setFontSize(9);
    doc.text(String(c1), M, y);
    doc.text(String(c2), 128, y, {align:'right'});
    doc.text(String(c3), 150, y, {align:'right'});
    doc.text(String(c4), 210-M, y, {align:'right'});
    y+=6;
  };
  doc.setTextColor(...SOFT); drawFila('Concepto','Precio','Cant.','Importe',true);
  doc.setDrawColor(220,220,225); doc.line(M,y-3,210-M,y-3);
  doc.setTextColor(...INK);
  const pintaSeccion=(titulo,arr)=>{
    if(!arr.length) return;
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...SOFT);
    doc.text(titulo, M, y); y+=5; doc.setTextColor(...INK);
    arr.forEach(l=>{ if(y>270){doc.addPage(); y=20;} drawFila(l.nombre, (l.precio).toFixed(2)+' €', l.cant, (l.precio*l.cant).toFixed(2)+' €'); });
  };
  pintaSeccion('ESTE MES', rec);
  pintaSeccion('PAGO ÚNICO', uni);
  y+=2; doc.setDrawColor(220,220,225); doc.line(120,y,210-M,y); y+=6;
  const totLinea=(lab,val,bold)=>{ doc.setFont('helvetica',bold?'bold':'normal'); doc.setFontSize(bold?11:9); doc.text(lab,150,y,{align:'right'}); doc.text(val,210-M,y,{align:'right'}); y+=bold?7:5; };
  doc.setTextColor(...INK);
  totLinea('Subtotal', subtotal.toFixed(2)+' €');
  if((data.descuento||0)>0) totLinea('Descuento ('+data.descuento+'%)', '-'+desc.toFixed(2)+' €');
  totLinea('IVA ('+(data.iva||0)+'%)', iva.toFixed(2)+' €');
  doc.setTextColor(...NAVY); totLinea('TOTAL', total.toFixed(2)+' €', true);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...SOFT);
  doc.text('contacto@aptuvia.es · aptuvia.es', M, 288);
  doc.save('Factura_'+data.numero+'_'+((data.nombreCliente||'').replace(/[^a-z0-9]/gi,'_'))+'.pdf');
  return {subtotal,desc,iva,total};
}

async function factGenerarPDF(){
  if(!window.jspdf){ appAlert('No se pudo cargar el generador de PDF. Comprueba tu conexión.'); return; }
  factLeerDOM();
  const f=window._fact; const d=f.datos||{};
  const numero='F-'+new Date().getFullYear()+'-'+String(Date.now()).slice(-5);
  const fecha=new Date().toISOString().slice(0,10);
  const r=factRenderPDF({numero,fecha,nombreCliente:f.academiaNombre,d,rec:f.rec,uni:f.uni,descuento:f.descuento,iva:f.iva});
  if(!r) return;
  try{
    const payload={ academia_id:f.academiaId, profesor_id:f.profesorId||null, numero, fecha, cliente:d, lineas:{rec:f.rec,uni:f.uni}, subtotal:+r.subtotal.toFixed(2), descuento_pct:f.descuento, iva_pct:f.iva, total:+r.total.toFixed(2) };
    const id=await call('/rest/v1/rpc/sa_guardar_factura',{method:'POST',body:{p_factura:payload}});
    f.facturas=f.facturas||[]; f.facturas.unshift({id:(typeof id==='string'?id:(id&&id[0])||''), numero, fecha, total:+r.total.toFixed(2)});
    saRenderFacturacion();
  }catch(e){ /* el PDF ya se descargó; si falla el guardado, no bloquea */ }
}

async function factVerFactura(id){
  try{
    const rows=await call('/rest/v1/facturas?id=eq.'+id);
    const fc=rows&&rows[0]; if(!fc){ appAlert('No se encontró la factura.'); return; }
    const lin=fc.lineas||{};
    factRenderPDF({
      numero:fc.numero, fecha:fc.fecha,
      nombreCliente:(fc.cliente&&fc.cliente.razon_social)||window._fact.academiaNombre||'cliente',
      d:fc.cliente||{}, rec:lin.rec||[], uni:lin.uni||[],
      descuento:Number(fc.descuento_pct)||0, iva:Number(fc.iva_pct)||21
    });
  }catch(e){ appAlert('No se pudo abrir: '+(e.message||'')); }
}

async function factEnviarCliente(){
  factLeerDOM();
  const f=window._fact; const d=f.datos||{}; const t=factCalc();
  if(!d.email){
    appAlert('Falta el email del cliente. Rellénalo en "Datos fiscales del cliente" y guárdalo antes de enviar.');
    return;
  }
  const mes = new Date().toLocaleDateString('es-ES',{month:'long',year:'numeric'});
  const cliente = d.razon_social || f.academiaNombre || 'cliente';
  const asunto = 'Factura Aptuvia · '+mes;
  const cuerpo =
    'Estimado/a '+cliente+':\n\n'+
    'Le adjuntamos la factura correspondiente al mes de '+mes+' por los servicios de Aptuvia.\n\n'+
    'Importe total: '+t.total.toFixed(2)+' € (IVA incluido).\n\n'+
    'Si tiene cualquier duda sobre la factura, no dude en responder a este correo.\n\n'+
    'Un cordial saludo,\n'+
    'Aptuvia\n'+
    'contacto@aptuvia.es';
  // Guardar destino para el envío tras confirmar/editar
  window._factMail={ email:d.email, asunto, cuerpo };
  factMostrarPlantilla();
}

function factMostrarPlantilla(){
  const m=window._factMail;
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px';
  const box=document.createElement('div');
  box.style.cssText='background:#fff;border-radius:16px;max-width:460px;width:100%;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.25)';
  box.innerHTML=`<div style="padding:16px 18px 8px;font-weight:800;color:var(--navy)">✉️ Enviar factura al cliente</div>
    <div style="padding:0 18px;overflow-y:auto">
      <label style="font-size:.75rem;color:var(--ink-soft)">Para</label>
      <input id="fm-to" value="${escAttr(m.email)}" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;margin:3px 0 10px;box-sizing:border-box">
      <label style="font-size:.75rem;color:var(--ink-soft)">Asunto</label>
      <input id="fm-sub" value="${escAttr(m.asunto)}" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;margin:3px 0 10px;box-sizing:border-box">
      <label style="font-size:.75rem;color:var(--ink-soft)">Mensaje (editable)</label>
      <textarea id="fm-body" rows="10" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;margin:3px 0 4px;box-sizing:border-box;font-family:inherit;font-size:.85rem;resize:vertical">${escHtml(m.cuerpo)}</textarea>
      <p style="font-size:.72rem;color:var(--ink-soft);margin:4px 0 10px">Recuerda adjuntar el PDF descargado en tu app de correo antes de enviar.</p>
    </div>
    <div style="padding:12px 18px;border-top:1px solid var(--line);display:flex;gap:10px;justify-content:flex-end">
      <button id="fm-cancel" style="padding:9px 16px;border-radius:10px;font-weight:700;border:1.5px solid var(--line);background:#fff;cursor:pointer">Cancelar</button>
      <button id="fm-ok" style="padding:9px 16px;border-radius:10px;font-weight:700;border:1.5px solid var(--navy);background:var(--navy);color:#fff;cursor:pointer">Abrir correo</button>
    </div>`;
  ov.appendChild(box); document.body.appendChild(ov);
  document.getElementById('fm-cancel').onclick=()=>ov.remove();
  document.getElementById('fm-ok').onclick=async ()=>{
    const to=document.getElementById('fm-to').value.trim();
    const sub=document.getElementById('fm-sub').value;
    const body=document.getElementById('fm-body').value;
    ov.remove();
    if(!await appConfirm('¿Abrir tu app de correo para enviar la factura a '+to+'?')) return;
    // Marcar como enviada: si viene del panel, esa factura; si no, la última del editor.
    try{
      const m=window._factMail||{};
      if(m.facturaId){
        await call('/rest/v1/rpc/sa_factura_estado',{method:'POST',body:{p_id:m.facturaId,p_campo:'enviada',p_valor:true}});
        const ff=(window._factTodas||[]).find(x=>x.id===m.facturaId); if(ff) ff.enviada=true;
        if(window._factSub==='emitidas' || teacherView==='superadmin') { try{ saPintarFacturasEmitidas(); }catch(e){} }
      } else {
        const f=window._fact; const ult=(f&&f.facturas||[])[0];
        if(ult && ult.id){ await call('/rest/v1/rpc/sa_factura_estado',{method:'POST',body:{p_id:ult.id,p_campo:'enviada',p_valor:true}}); ult.enviada=true; }
      }
    }catch(e){}
    const link='mailto:'+encodeURIComponent(to)+'?subject='+encodeURIComponent(sub)+'&body='+encodeURIComponent(body);
    window.location.href=link;
  };
}

// ══════════════ PANEL DE FACTURAS EMITIDAS ══════════════
async function saRenderFacturasEmitidas(filtro){
  window._factFiltro = filtro || window._factFiltro || 'todas';
  $('teacher').innerHTML=saShell('<div class="loader"><span class="spin"></span></div>');
  let todas=[];
  try{ todas=await call('/rest/v1/rpc/sa_facturas_todas',{method:'POST',body:{}})||[]; }catch(e){}
  window._factTodas=todas;
  saPintarFacturasEmitidas();
}

function saPintarFacturasEmitidas(){
  const todas=window._factTodas||[];
  const filtro=window._factFiltro||'todas';
  const mesSel=window._factMes||'todos';
  const cliSel=window._factCliente||'todos';
  const pasa=(f)=>{
    if(mesSel!=='todos' && (f.fecha||'').slice(0,7)!==mesSel) return false;
    if(cliSel!=='todos' && (f.academia_nombre||'—')!==cliSel) return false;
    if(filtro==='pagadas') return f.pagada===true;
    if(filtro==='pendientes') return f.pagada!==true;
    if(filtro==='enviadas') return f.enviada===true;
    if(filtro==='no_enviadas') return f.enviada!==true;
    return true;
  };
  const lista=todas.filter(pasa);
  const totalImporte=lista.reduce((t,f)=>t+Number(f.total||0),0);
  // Meses y clientes disponibles (de todas las facturas)
  const mesesDisp=[...new Set(todas.map(f=>(f.fecha||'').slice(0,7)).filter(Boolean))].sort().reverse();
  const clientesDisp=[...new Set(todas.map(f=>f.academia_nombre||'—'))].sort((a,b)=>a.localeCompare(b,'es'));
  const mesNomSel=(mk)=>{ const [y,m]=mk.split('-'); const n=new Date(+y,+m-1,1).toLocaleDateString('es-ES',{month:'long',year:'numeric'}); return n.charAt(0).toUpperCase()+n.slice(1); };

  let h=`<button class="backbtn" onclick="saSetMain('fact')" style="margin-bottom:10px">← Gestión</button>
    <h2 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:2px 2px 10px">📊 Facturas emitidas</h2>
    <div id="fr-box" style="margin:2px 0 12px"></div>`;

  // Filtro por mes
  h+=`<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
    <label style="font-size:.78rem;color:var(--ink-soft)">Mes</label>
    <select id="fe-mes" style="flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:10px;font-size:.85rem;background:#fff">
      <option value="todos"${mesSel==='todos'?' selected':''}>Todos los meses</option>
      ${mesesDisp.map(mk=>`<option value="${mk}"${mesSel===mk?' selected':''}>${mesNomSel(mk)}</option>`).join('')}
    </select>
  </div>`;

  // Filtro por cliente
  h+=`<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
    <label style="font-size:.78rem;color:var(--ink-soft)">Cliente</label>
    <select id="fe-cli" style="flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:10px;font-size:.85rem;background:#fff">
      <option value="todos"${cliSel==='todos'?' selected':''}>Todos los clientes</option>
      ${clientesDisp.map(c=>`<option value="${escAttr(c)}"${cliSel===c?' selected':''}>${escHtml(c)}</option>`).join('')}
    </select>
  </div>`;

  // Filtro de estado (desplegable, como Mes y Cliente)
  const chips=[['todas','Todas'],['pagadas','Pagadas'],['pendientes','Pendientes'],['enviadas','Enviadas'],['no_enviadas','No enviadas']];
  h+=`<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
    <label style="font-size:.78rem;color:var(--ink-soft)">Estado</label>
    <select id="fe-est" style="flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:10px;font-size:.85rem;background:#fff">
      ${chips.map(([k,lab])=>`<option value="${k}"${filtro===k?' selected':''}>${lab}</option>`).join('')}
    </select>
  </div>`;

  // Sumatorio del filtro activo
  h+=`<div style="background:var(--navy);color:#fff;border-radius:12px;padding:12px 14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:.85rem">${lista.length} factura${lista.length===1?'':'s'} · <b>${chips.find(c=>c[0]===filtro)[1]}</b>${mesSel!=='todos'?' · '+mesNomSel(mesSel):''}${cliSel!=='todos'?' · '+escHtml(cliSel):''}</span>
    <b style="font-size:1.1rem">${totalImporte.toFixed(2)} €</b>
  </div>`;

  // Botón PDF de la selección
  h+=`<button onclick="factResumenPDF()" style="width:100%;margin-bottom:14px;background:var(--honey-tint);border:1.5px solid var(--honey);color:var(--navy);font-weight:700;border-radius:12px;padding:11px;cursor:pointer;font-family:inherit;font-size:.88rem">📄 Descargar PDF de esta selección</button>`;
  h+=`<button onclick="driveAbrir()" style="width:100%;margin-bottom:14px;margin-top:-6px;background:#fff;border:1.5px solid var(--line);color:var(--navy);font-weight:700;border-radius:12px;padding:10px;cursor:pointer;font-family:inherit;font-size:.82rem">📁 Abrir Drive para guardarlo</button>`;

  if(!lista.length){ h+=`<p class="sa-empty">No hay facturas para este filtro.</p>`; $('teacher').innerHTML=saShell(h); saPintarFactReal(); return; }

  // Agrupar por mes (YYYY-MM)
  const meses={};
  lista.forEach(f=>{
    const mk=(f.fecha||'').slice(0,7)||'—';
    (meses[mk]=meses[mk]||[]).push(f);
  });
  const mesNombre=(mk)=>{
    if(mk==='—') return 'Sin fecha';
    const [y,m]=mk.split('-');
    const nom=new Date(+y,+m-1,1).toLocaleDateString('es-ES',{month:'long',year:'numeric'});
    return nom.charAt(0).toUpperCase()+nom.slice(1);
  };
  window._factMesAbierto = window._factMesAbierto || {};
  const _mkAll=Object.keys(meses).sort().reverse();
  if(window._factMesAbierto.__init!==true){ window._factMesAbierto={__init:true}; if(_mkAll[0]) window._factMesAbierto[_mkAll[0]]=true; }
  _mkAll.forEach(mk=>{
    const arr=meses[mk];
    const totMes=arr.reduce((t,f)=>t+Number(f.total||0),0);
    const abierto = window._factMesAbierto[mk]===true;
    h+=`<button onclick="saToggleMes('${mk}')" style="width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;margin:14px 0 6px;background:none;border:none;border-bottom:1px solid var(--line);padding:0 2px 6px;cursor:pointer;font-family:inherit">
      <span style="display:flex;align-items:center;gap:6px">
        <span style="font-size:.7rem;color:var(--ink-soft);transform:rotate(${abierto?'90':'0'}deg);display:inline-block;transition:transform .15s">▶</span>
        <span style="font-size:.82rem;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--ink-soft)">${mesNombre(mk)}</span>
        <span style="font-size:.7rem;color:var(--ink-soft)">(${arr.length})</span>
      </span>
      <b style="font-size:.85rem;color:var(--navy)">${totMes.toFixed(2)} €</b>
    </button>`;
    if(!abierto) return;
    arr.forEach(f=>{
      h+=`<div style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div><b style="font-size:.88rem">${escHtml(f.numero||'—')}</b><br>
            <span style="font-size:.76rem;color:var(--ink-soft)">${escHtml(f.academia_nombre||'—')} · ${escHtml(f.fecha||'')}</span></div>
          <b style="font-size:.95rem;color:var(--navy)">${Number(f.total||0).toFixed(2)} €</b>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <button onclick="saToggleFactura('${f.id}','pagada',${f.pagada?'false':'true'})" style="font-size:.72rem;padding:5px 10px;border-radius:14px;cursor:pointer;border:1.5px solid ${f.pagada?'#15803d':'#cbd5e1'};background:${f.pagada?'#dcfce7':'#fff'};color:${f.pagada?'#15803d':'var(--ink-soft)'};font-weight:700">${f.pagada?'✅ Pagada':'○ Pendiente'}</button>
          <button onclick="saToggleFactura('${f.id}','enviada',${f.enviada?'false':'true'})" style="font-size:.72rem;padding:5px 10px;border-radius:14px;cursor:pointer;border:1.5px solid ${f.enviada?'#2563a8':'#cbd5e1'};background:${f.enviada?'#dbeafe':'#fff'};color:${f.enviada?'#2563a8':'var(--ink-soft)'};font-weight:700">${f.enviada?'✉️ Enviada':'○ No enviada'}</button>
          ${f.enviada?'':`<button onclick="factEnviarDesdePanel('${f.id}')" style="font-size:.72rem;padding:5px 10px;border-radius:14px;cursor:pointer;border:1.5px solid var(--honey);background:var(--honey-tint);color:var(--honey-deep);font-weight:700">✉️ Enviar</button>`}
          <button onclick="factRectificar('${f.id}')" style="font-size:.72rem;padding:5px 10px;border-radius:14px;cursor:pointer;border:1.5px solid #cbd5e1;background:#fff;color:var(--ink-soft);font-weight:700">↩️ Rectificar</button>
          <button onclick="saBorrarFacturaPanel('${f.id}')" style="font-size:.72rem;padding:5px 10px;border-radius:14px;cursor:pointer;border:1.5px solid #f3c4c4;background:#fdeaea;margin-left:auto">🗑</button>
        </div>
      </div>`;
    });
  });
  $('teacher').innerHTML=saShell(h);
  saPintarFactReal();
  if($('fe-mes')) $('fe-mes').onchange=(e)=>{ window._factMes=e.target.value; saPintarFacturasEmitidas(); };
  if($('fe-cli')) $('fe-cli').onchange=(e)=>{ window._factCliente=e.target.value; saPintarFacturasEmitidas(); };
  if($('fe-est')) $('fe-est').onchange=(e)=>{ window._factFiltro=e.target.value; saPintarFacturasEmitidas(); };
}

// PDF resumen de las facturas filtradas (mes + estado activos)
function factResumenPDF(){
  if(!window.jspdf){ appAlert('No se pudo cargar el generador de PDF.'); return; }
  const todas=window._factTodas||[];
  const filtro=window._factFiltro||'todas';
  const mesSel=window._factMes||'todos';
  const cliSel=window._factCliente||'todos';
  const pasa=(f)=>{
    if(mesSel!=='todos' && (f.fecha||'').slice(0,7)!==mesSel) return false;
    if(cliSel!=='todos' && (f.academia_nombre||'—')!==cliSel) return false;
    if(filtro==='pagadas') return f.pagada===true;
    if(filtro==='pendientes') return f.pagada!==true;
    if(filtro==='enviadas') return f.enviada===true;
    if(filtro==='no_enviadas') return f.enviada!==true;
    return true;
  };
  const lista=todas.filter(pasa).slice().sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  if(!lista.length){ appAlert('No hay facturas en esta selección.'); return; }
  const total=lista.reduce((t,f)=>t+Number(f.total||0),0);
  const etFiltro={todas:'Todas',pagadas:'Pagadas',pendientes:'Pendientes',enviadas:'Enviadas',no_enviadas:'No enviadas'}[filtro]||'Todas';
  const mesNom=(mk)=>{ if(mk==='todos') return 'Todos los meses'; const [y,m]=mk.split('-'); const n=new Date(+y,+m-1,1).toLocaleDateString('es-ES',{month:'long',year:'numeric'}); return n.charAt(0).toUpperCase()+n.slice(1); };
  const { jsPDF }=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const M=16; let y=20;
  const NAVY=[46,49,99], INK=[30,26,16], SOFT=[110,110,120];
  pdfLogo(doc, M, y-6, 36);
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...INK);
  doc.text('Facturas emitidas', 210-M, y, {align:'right'}); y+=8;
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...SOFT);
  doc.text('Periodo: '+mesNom(mesSel)+'  ·  Estado: '+etFiltro+(cliSel!=='todos'?'  ·  Cliente: '+cliSel:'')+'  ·  Generado: '+new Date().toISOString().slice(0,10), M, y); y+=8;
  doc.setDrawColor(220,220,225); doc.line(M,y,210-M,y); y+=7;
  const fila=(c1,c2,c3,c4,c5,bold)=>{ doc.setFont('helvetica',bold?'bold':'normal'); doc.setFontSize(8.5);
    doc.text(String(c1),M,y); doc.text(String(c2),60,y); doc.text(String(c3),120,y); doc.text(String(c4),150,y); doc.text(String(c5),210-M,y,{align:'right'}); y+=6; };
  doc.setTextColor(...SOFT); fila('Nº','Cliente','Fecha','Estado','Importe',true);
  doc.setDrawColor(230,230,235); doc.line(M,y-3,210-M,y-3); doc.setTextColor(...INK);
  lista.forEach(f=>{ if(y>275){ doc.addPage(); y=20; }
    const est=(f.pagada?'Pagada':'Pendiente')+(f.enviada?'/Env':'');
    fila(f.numero||'—', (f.academia_nombre||'').slice(0,26), f.fecha||'', est, Number(f.total||0).toFixed(2)+' €'); });
  y+=2; doc.setDrawColor(220,220,225); doc.line(120,y,210-M,y); y+=7;
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text(lista.length+' facturas', 120, y); doc.text('TOTAL: '+total.toFixed(2)+' €', 210-M, y, {align:'right'});
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...SOFT);
  doc.text('contacto@aptuvia.es · aptuvia.es', M, 288);
  doc.save('Facturas_'+(mesSel==='todos'?'todas':mesSel)+'_'+filtro+(cliSel!=='todos'?'_'+cliSel.replace(/[^a-z0-9]/gi,'_'):'')+'.pdf');
}

async function saToggleFactura(id,campo,valor){
  try{
    await call('/rest/v1/rpc/sa_factura_estado',{method:'POST',body:{p_id:id,p_campo:campo,p_valor:(valor===true||valor==='true')}});
    const f=(window._factTodas||[]).find(x=>x.id===id);
    if(f){ f[campo]=(valor===true||valor==='true'); }
    saPintarFacturasEmitidas();
  }catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}

async function saBorrarFacturaPanel(id){
  if(await factRealOn()){ appAlert('🔒 Facturación real activada: las facturas emitidas no pueden borrarse. Emite una rectificativa.'); return; }
  if(!await appConfirm('¿Borrar esta factura? No se puede deshacer.')) return;
  try{
    await call('/rest/v1/rpc/sa_borrar_factura',{method:'POST',body:{p_id:id}});
    window._factTodas=(window._factTodas||[]).filter(x=>x.id!==id);
    saPintarFacturasEmitidas();
  }catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}

async function factEnviarDesdePanel(id){
  try{
    const rows=await call('/rest/v1/facturas?id=eq.'+id);
    const fc=rows&&rows[0]; if(!fc){ appAlert('No se encontró la factura.'); return; }
    const d=fc.cliente||{};
    if(!d.email){ appAlert('Esta factura no tiene email de cliente guardado. Añádelo en la ficha del cliente y vuelve a emitirla.'); return; }
    const mes=(fc.fecha||'').slice(0,7);
    const cliente=d.razon_social||'cliente';
    window._factMail={
      email:d.email,
      asunto:'Factura Aptuvia · '+(fc.numero||''),
      cuerpo:'Estimado/a '+cliente+':\n\nLe adjuntamos la factura '+(fc.numero||'')+' por los servicios de Aptuvia.\n\nImporte total: '+Number(fc.total||0).toFixed(2)+' € (IVA incluido).\n\nSi tiene cualquier duda, no dude en responder a este correo.\n\nUn cordial saludo,\nAptuvia\ncontacto@aptuvia.es',
      facturaId:id
    };
    factMostrarPlantilla();
  }catch(e){ appAlert('No se pudo: '+(e.message||'')); }
}



// ── Facturación real (inalterabilidad): interruptor OFF por defecto ──
async function factRealOn(){
  try{ const m=await call('/rest/v1/config_app?select=valor&clave=eq.fact_real'); return !!(m&&m[0]&&m[0].valor==='on'); }catch(e){ return false; }
}
async function saPintarFactReal(){
  const box=$('fr-box'); if(!box) return;
  const on=await factRealOn();
  box.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 13px;border:1.5px solid ${on?'#f3c4c4':'var(--line)'};border-radius:12px;background:${on?'#fdeaea':'#fff'}">
      <span style="flex:1"><b style="color:${on?'#b4232a':'var(--navy)'}">🔒 Facturación real</b><br><span style="font-size:.76rem;color:var(--ink-soft)">${on?'ACTIVA: las facturas emitidas no se borran; corrige con rectificativas.':'Apagada (modo pruebas): puedes borrar facturas. Enciéndelo el día del alta.'}</span></span>
      <button id="fr-sw" style="flex:0 0 auto;width:52px;height:30px;border-radius:16px;border:none;cursor:pointer;background:${on?'#15803d':'#cbd5e1'};position:relative;transition:background .15s"><span style="position:absolute;top:3px;left:${on?'25px':'3px'};width:24px;height:24px;border-radius:50%;background:#fff;transition:left .15s"></span></button>
    </div>`;
  $('fr-sw').onclick=async ()=>{
    if(!on && !await appConfirm('Activar Facturación real: a partir de ahora las facturas emitidas NO se podrán borrar; las correcciones se hacen con rectificativas. Actívalo solo cuando empiece la actividad real. ¿Seguro?')) return;
    try{ await call('/rest/v1/rpc/set_fact_real',{method:'POST',body:{p_on:!on}}); saPintarFactReal(); }
    catch(e){ appAlert('No se pudo: '+(e.message||'')); }
  };
}
async function factRectificar(id){
  let fc; try{ const rows=await call('/rest/v1/facturas?id=eq.'+id); fc=rows&&rows[0]; }catch(e){}
  if(!fc){ appAlert('No se encontró la factura.'); return; }
  if(!await appConfirm('Se emitirá una rectificativa que ANULA la factura '+(fc.numero||'')+' (importes en negativo). Después emite una nueva factura correcta si procede. ¿Continuar?')) return;
  const d=fc.cliente||{}; const L=fc.lineas||{};
  const neg=arr=>(arr||[]).map(l=>({nombre:l.nombre, precio:-Math.abs(Number(l.precio)||0), cant:l.cant}));
  const rec=[{nombre:'RECTIFICA factura '+(fc.numero||'')+' de fecha '+(fc.fecha||''), precio:0, cant:1}, ...neg(L.rec)];
  const uni=neg(L.uni);
  const numero='R-'+new Date().getFullYear()+'-'+String(Date.now()).slice(-5);
  const fecha=new Date().toISOString().slice(0,10);
  const r=factRenderPDF({numero,fecha,nombreCliente:d.razon_social||'',d,rec,uni,descuento:Number(fc.descuento_pct)||0,iva:Number(fc.iva_pct)||0});
  if(!r) return;
  try{
    const payload={ academia_id:fc.academia_id, profesor_id:fc.profesor_id||null, numero, fecha, cliente:d, lineas:{rec,uni}, subtotal:+r.subtotal.toFixed(2), descuento_pct:Number(fc.descuento_pct)||0, iva_pct:Number(fc.iva_pct)||0, total:+r.total.toFixed(2) };
    const nid=await call('/rest/v1/rpc/sa_guardar_factura',{method:'POST',body:{p_factura:payload}});
    window._factTodas=window._factTodas||[];
    window._factTodas.unshift({id:(typeof nid==='string'?nid:(nid&&nid[0])||''), numero, fecha, total:+r.total.toFixed(2), academia_nombre:fc.academia_nombre||d.razon_social||'—', pagada:false, enviada:false});
    saPintarFacturasEmitidas();
  }catch(e){ appAlert('La rectificativa se descargó, pero no se pudo guardar: '+(e.message||'')); }
}

function pintarTeacher(){
  showView('teacher'); window.scrollTo(0,0);
  teacherView='panel';
  let nAl;
  if(window._nRegistrados!=null){ nAl=window._nRegistrados; }
  else if(resumenRows){ nAl=resumenRows.length; }
  else { const s=new Set(); teacherRows.forEach(r=>s.add(r.alumno)); nAl=s.size; }
  const nombre=(userName||'').split(' ')[0]||'profe';
  const esAula = window._activeCertId==='__aula_abierta';
  const certCodigo = window._certCodigo || 'ADGG0508';
  const certNombre = window._certNombre || '';
  let cabecera;
  if(esAula){
    const nombreAula = (window._aulaNombre||'').trim();
    const textoIzq = nombreAula || 'Materias propias';
    cabecera = `<button class="t-course" id="edit-aula-nombre" title="Cambiar este texto" style="background:none;border:none;padding:0;text-align:left;cursor:pointer;font:inherit;color:inherit">${escHtml(textoIzq)} <span style="opacity:.5">✎</span></button><span class="t-cert-code"><span style="color:#2e3163">A</span>ula <span style="color:#2e3163">A</span>bierta</span>`;
  }else{
    cabecera = `<span class="t-course"><span class="t-code-inline">${certCodigo}</span> · ${certNombre}</span>`;
  }
  $('teacher').innerHTML=`${window._saImpersona?`<button class="backbtn" onclick="salirImpersona()" style="margin-bottom:10px;background:var(--honey-tint);border-color:var(--honey)">← Volver a la academia</button>`:''}<div class="t-welcome">
      ${cabecera}
    </div>
    <div class="t-grid">
      <button class="t-tile" onclick="openTemarioProfesor()">
        <span class="ic" style="background:var(--honey-tint)">📚</span><span class="tt">Temario</span><span class="ts">Apuntes para el alumno</span></button>
      <button class="t-tile" onclick="openExamMgmt()">
        <span class="ic" style="background:var(--honey-tint)">⚙️</span><span class="tt">Crear y gestionar exámenes</span></button>
      <button class="t-tile" onclick="openCorrecciones()">
        <span class="ic" style="background:var(--honey-tint)">✍️</span><span class="tt">Correcciones</span><span class="ts">Redacciones por corregir</span>${pendientesCount>0?`<span class="tile-badge">${pendientesCount}</span>`:''}</button>
      <button class="t-tile" onclick="openPublicar()">
        <span class="ic" style="background:var(--honey-tint)">👁️</span><span class="tt">Exámenes visibles</span><span class="ts">Qué ve el alumno</span></button>
      <button class="t-tile" onclick="openEstados()">
        <span class="ic" style="background:var(--navy-tint)">🚦</span><span class="tt">Estados</span><span class="ts">Módulos y UF</span></button>
      <button class="t-tile" onclick="openModulosTeacher()">
        <span class="ic" style="background:var(--navy-tint)">📚</span><span class="tt">Módulos</span><span class="ts">Evolución de la clase</span></button>
      <button class="t-tile" onclick="openAlumnos()">
        <span class="ic-row"><span class="ic" style="background:var(--navy-tint)">👥</span><span class="t-online-pill" id="t-sub-count"><span class="online-dot" style="background:#94a3b8;box-shadow:none;animation:none"></span>… en línea</span></span><span class="tt">Alumnos y notas</span><span class="ts">Registrados: ${nAl}</span></button>
      <button class="t-tile" onclick="openPassword()">
        <span class="ic" style="background:var(--navy-tint)">🔑</span><span class="tt">Cambiar contraseña</span></button>
      ${userEmail==='admin@evaluatest.com'?`<button class="t-tile t-tile-slim" style="grid-column:span 2;border-color:var(--honey);background:var(--honey-tint)" onclick="openSuperadmin()">
        <span class="ic" style="background:var(--navy-tint)">🛰️</span><span class="tt">Torre de control</span><span class="ts">Panel superadmin — todas las academias</span></button>`:''}
    </div>`;
  // Badge de alumnos en línea — pastilla bajo "Matriculados" en la tarjeta Alumnos
  fetchOnlineCount().then(n=>{
    const el=$('t-sub-count'); if(!el) return;
    el.className='t-online-pill'+(n>0?' ok':'');
    el.innerHTML=`<span class="online-dot" style="${n===0?'background:#94a3b8;box-shadow:none;animation:none':''}"></span>${n} en línea`;
  });
  const btnEd=$('edit-aula-nombre'); if(btnEd) btnEd.onclick=editarNombreAula;
}

// Editar y guardar el nombre personalizado del aula (columna nombre_aula_abierta)
async function editarNombreAula(){
  const actual=(window._aulaNombre||'').trim();
  const nuevo=await appPrompt('Texto de la cabecera (ej.: "Historia", "Mis asignaturas"). Déjalo vacío para volver a "Materias propias":', actual);
  if(nuevo===null) return; // canceló
  const valor=nuevo.trim().slice(0,40);
  const H={'apikey':SUPABASE_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'};
  try{
    // 1) Averiguar el id de la fila de academia (PostgREST NO permite un
    //    UPDATE sin filtro: sin ?columna=eq... devuelve 400 por seguridad).
    const rget=await fetch(SUPABASE_URL+'/rest/v1/academia?select=id&limit=1',{headers:H});
    const filas=await rget.json();
    const idFila=(Array.isArray(filas)&&filas[0])?filas[0].id:null;
    if(idFila==null) throw new Error('no se encontró la fila de academia');
    // 2) Actualizar solo esa fila, filtrando por id
    const r=await fetch(SUPABASE_URL+'/rest/v1/academia?id=eq.'+encodeURIComponent(idFila),{
      method:'PATCH',
      headers:{...H,'Prefer':'return=minimal'},
      body:JSON.stringify({nombre_aula_abierta: valor||null})
    });
    if(!r.ok){ let d=''; try{ d=await r.text(); }catch(e){} throw new Error('Error '+r.status+(d?' · '+d.slice(0,120):'')); }
    window._aulaNombre=valor;
    pintarTeacher();
  }catch(err){
    appAlert('No se pudo guardar el nombre: '+(err.message||''));
  }
}

// ---- Pestaña "Módulos" dentro del Área Docente ----
// Reutiliza exactamente las mismas tarjetas que ve el alumno en el Home,
// para que el profesor entre a un módulo/UF con los datos ya precargados
// (la carga arrancó en cuanto entró en el Área Docente tras el login).
function openModulosTeacher(okMsg, errMsg){
  showView('teacher'); window.scrollTo(0,0);
  teacherView='modulos';
  const esAula = window._activeCertId==='__aula_abierta';
  const modsAula = esAula ? getModulos() : null;
  const certCodigo = esAula ? (modsAula.length===1 ? modsAula[0].title : 'Aula Abierta') : (window._certCodigo || 'ADGG0508');
  const certNombre = window._certNombre || '';
  const heroTitulo = esAula ? 'Aula Abierta' : 'Certificado de Profesionalidad';
  let html=`<button class="backbtn" onclick="pintarTeacher()">← Área Docente</button>`;
  if(okMsg) html+=`<div class="t-note ok">${escHtml(okMsg)}</div>`;
  if(errMsg) html+=`<div class="t-note err">${escHtml(errMsg)}</div>`;
  if(esAula){
    if(window._nuevaMateriaOpen){
      html+=`<div class="t-card">
        <label style="margin-top:6px">Nombre de la materia</label>
        <input id="nm-titulo" type="text" placeholder="Ej.: Historia 4º de ESO" value="${escAttr(window._nuevaMateriaTitulo||'')}">
        <label style="margin-top:12px">Etiqueta corta <span style="font-weight:400;color:var(--ink-soft)">(opcional)</span></label>
        <input id="nm-etiqueta" type="text" placeholder="Ej.: Historia" maxlength="18" value="${escAttr(window._nuevaMateriaEtiqueta||'')}">
        <button class="btn btn-honey" id="nm-crear" style="margin-top:16px">Crear materia</button>
        <button class="btn btn-ghost" id="nm-cancelar" style="margin-top:10px">Cancelar</button>
      </div>`;
    }else{
      html+=`<button class="btn btn-honey" id="nm-abrir" style="margin-bottom:16px">+ Nueva materia</button>`;
    }
  }
  html+=renderModulosCardsHtml(esAula);
  html+=`<div class="cert">
      <div class="cert-top">
        <h1>${heroTitulo}</h1>
        <div class="cert-code">${certCodigo||'ADGG0508'}</div>
      </div>
      <div class="sub">${certNombre||''}</div>
    </div>`;
  $('teacher').innerHTML=html;
  document.querySelectorAll('.mod[data-mod]').forEach(b=> b.onclick=()=>openModule(b.dataset.mod));
  document.querySelectorAll('[data-delmat]').forEach(b=> b.onclick=(ev)=>{ ev.stopPropagation(); borrarMateriaUI(b.dataset.delmat, b.dataset.mattit); });
  if(esAula){
    if(window._nuevaMateriaOpen){
      $('nm-crear').onclick=crearMateriaUI;
      $('nm-cancelar').onclick=()=>{ window._nuevaMateriaOpen=false; window._nuevaMateriaTitulo=''; openModulosTeacher(); };
    }else{
      $('nm-abrir').onclick=()=>{ window._nuevaMateriaOpen=true; openModulosTeacher(); };
    }
  }
}
function slugify(s){
  return (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24) || 'materia';
}
async function crearMateriaUI(){
  const input=$('nm-titulo'); const titulo=(input.value||'').trim();
  const etiqueta=($('nm-etiqueta')?($('nm-etiqueta').value||''):'').trim();
  window._nuevaMateriaTitulo=titulo; window._nuevaMateriaEtiqueta=etiqueta;
  if(!titulo){ appAlert('Escribe un nombre para la materia.'); return; }
  const btn=$('nm-crear'); btn.disabled=true; btn.innerHTML='<span class="spin"></span>';
  const n = Object.keys(unidadesById).filter(id=>id.indexOf('aula-')===0).length + 1;
  const id = 'aula-'+slugify(titulo)+'-'+Date.now().toString(36).slice(-4);
  const codigo = 'AULA-'+String(n+1).padStart(2,'0');
  const cert = certBD(); // 'aula_abierta' cuando estamos en Aula Abierta
  // La etiqueta corta se guarda dentro del propio titulo con "|" como separador,
  // para no tocar el esquema de la BD (columna nueva = riesgo en producción).
  const tituloGuardado = etiqueta ? (etiqueta+'|'+titulo) : titulo;
  try{
    const miProf = window._saImpersona ? window._saImpersonaProf : userId;
    await call('/rest/v1/unidades',{method:'POST',body:{id,codigo,titulo:tituloGuardado,modulo:id,orden:9000+n,certificado_id:cert,estado:'activo',profesor_id:miProf}});
    unidadesById[id]={id,codigo,titulo:tituloGuardado,modulo:id,orden:9000+n,certificado_id:cert,estado:'activo',profesor_id:miProf,ver_megatest:true,ver_falladas:true};
    examsByUnit[id]=examsByUnit[id]||[];
    window._nuevaMateriaOpen=false; window._nuevaMateriaTitulo=''; window._nuevaMateriaEtiqueta='';
    openModulosTeacher('Materia "'+titulo+'" creada. Ya puedes crearle su primer examen desde "Crear y gestionar exámenes".');
  }catch(err){
    btn.disabled=false; btn.textContent='Crear materia';
    openModulosTeacher(null, 'No se pudo crear: '+(err.message||''));
  }
}
// Separa "etiqueta|nombre" en sus dos partes. Si no hay "|", la etiqueta es "MATERIA".
function partesMateria(tituloGuardado){
  const s=(tituloGuardado||'')+'';
  const i=s.indexOf('|');
  if(i<0) return {etiqueta:'MATERIA', nombre:s};
  return {etiqueta:s.slice(0,i).trim()||'MATERIA', nombre:s.slice(i+1).trim()};
}

// ---- Cambiar contraseña ----
function openPassword(okMsg, errMsg){
  showView('teacher'); window.scrollTo(0,0);
  const h=[`<button class="backbtn" onclick="pintarTeacher()">← Panel</button>`];
  h.push(`<h1 style="font-size:1.25rem;font-weight:800;letter-spacing:-.4px;margin:6px 0 2px;color:var(--navy)">Cambiar contraseña</h1>`);
  h.push(`<p style="font-size:.8rem;color:var(--ink-soft);margin-bottom:14px">Cuenta: <b>${escHtml(userEmail||'')}</b></p>`);
  if(okMsg) h.push(`<div class="t-note ok">${escHtml(okMsg)}</div>`);
  if(errMsg) h.push(`<div class="t-note err">${escHtml(errMsg)}</div>`);
  h.push(`<div class="t-card">
      <label style="margin-top:6px">Nueva contraseña</label>
      <span class="pwwrap"><input id="pw-1" type="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password"><button type="button" class="pweye" id="pw1Eye" aria-label="Mostrar contraseña">👁</button></span>
      <label>Repite la contraseña</label>
      <span class="pwwrap"><input id="pw-2" type="password" placeholder="Vuelve a escribirla" autocomplete="new-password"><button type="button" class="pweye" id="pw2Eye" aria-label="Mostrar contraseña">👁</button></span>
      <button class="btn btn-honey" id="pw-btn" style="margin-top:16px">Guardar contraseña</button>
    </div>`);
  $('teacher').innerHTML=h.join('');
  $('pw-btn').onclick=cambiarPasswordUI;
  wireEye('pw1Eye','pw-1'); wireEye('pw2Eye','pw-2');
}
async function cambiarPasswordUI(){
  const a=$('pw-1').value, b=$('pw-2').value;
  if(a.length<6){ openPassword(null,'La contraseña debe tener al menos 6 caracteres.'); return; }
  if(a!==b){ openPassword(null,'Las dos contraseñas no coinciden.'); return; }
  const btn=$('pw-btn'); btn.disabled=true; btn.innerHTML='<span class="spin"></span>';
  try{
    await call('/auth/v1/user',{method:'PUT',body:{password:a}});
    openPassword('✅ Contraseña actualizada. Úsala la próxima vez que entres.');
  }catch(err){ openPassword(null,'No se pudo cambiar: '+(err.message||'')); }
}

// ---- Publicar / ocultar exámenes para el alumno ----
function openPublicar(okMsg){
  showView('teacher'); window.scrollTo(0,0);
  const h=[`<button class="backbtn" onclick="pintarTeacher()">← Panel</button>`];
  h.push(`<h1 style="font-size:1.25rem;font-weight:800;letter-spacing:-.4px;margin:6px 0 2px;color:var(--navy)">Exámenes visibles</h1>`);
  h.push(`<p style="font-size:.8rem;color:var(--ink-soft);margin-bottom:14px">Activa solo los exámenes que quieres que vea el alumno. Los apagados no le aparecen.</p>`);
  if(okMsg) h.push(`<div class="t-note ok">${escHtml(okMsg)}</div>`);
  let any=false;
  getModulos().forEach(m=>{
    m.unidades.forEach(uid=>{
      const exs=(examsByUnit[uid]||[]).slice().sort(_cmpEx);
      if(!exs.length) return;
      const u=unidadesById[uid];
      any=true;
      h.push(`<div class="pub-unit">${u?escHtml(u.codigo):uid} · ${u?escHtml(u.titulo):''}</div>`);
      h.push(`<div class="pub-bulk"><button class="pub-allbtn" data-all="${uid}" data-val="1">Activar todas</button><button class="pub-allbtn ghost" data-all="${uid}" data-val="0">Quitar todas</button></div>`);
      exs.forEach(e=>{
        const on=!!e.publicado;
        const badge=e.tipo==='redaccion'?'<span class="rbadge">Redacción</span> ':'';
        h.push(`<div class="pub-row">
            <span class="pub-info"><b>${badge}${escHtml(e.titulo)}</b><span>${escHtml(e.tema||'')}</span></span>
            <button class="switch${on?' on':''}" data-pub="${e.id}" data-on="${on?1:0}" aria-label="${on?'Visible':'Oculto'}"><span class="knob"></span></button>
          </div>`);
      });
      const vMT=(u? u.ver_megatest!==false : true), vFA=(u? u.ver_falladas!==false : true);
      h.push(`<div class="pub-row pub-extra">
          <span class="pub-info"><b>🔁 Mega test de repaso</b><span>2 partes de 50 preguntas al azar de la unidad</span></span>
          <button class="switch${vMT?' on':''}" data-extra="${uid}" data-campo="mt" data-on="${vMT?1:0}" aria-label="${vMT?'Visible':'Oculto'}"><span class="knob"></span></button>
        </div>`);
      h.push(`<div class="pub-row pub-extra">
          <span class="pub-info"><b>🎯 Preguntas falladas</b><span>Repaso de fallos del alumno</span></span>
          <button class="switch${vFA?' on':''}" data-extra="${uid}" data-campo="fa" data-on="${vFA?1:0}" aria-label="${vFA?'Visible':'Oculto'}"><span class="knob"></span></button>
        </div>`);
    });
  });
  if(!any) h.push(`<div class="center-msg" style="padding:18px">No hay exámenes todavía.</div>`);
  $('teacher').innerHTML=h.join('');
  $('teacher').querySelectorAll('[data-pub]').forEach(b=> b.onclick=()=>togglePublicado(b));
  $('teacher').querySelectorAll('[data-extra]').forEach(b=> b.onclick=()=>toggleExtra(b));
  $('teacher').querySelectorAll('[data-all]').forEach(b=> b.onclick=()=>togglePublicadoTodos(b.dataset.all, b.dataset.val==='1'));
}
function setSwitch(btn, on){ if(!btn) return; btn.classList.toggle('on', on); btn.dataset.on = on?'1':'0'; btn.setAttribute('aria-label', on?'Visible':'Oculto'); }
async function togglePublicadoTodos(unitId, nuevo){
  try{
    await call('/rest/v1/rpc/set_examenes_publicado_unidad',{method:'POST',body:impProf({p_unidad:unitId, p_publicado:nuevo})});
    (examsByUnit[unitId]||[]).forEach(e=>{ e.publicado=nuevo; const sw=$('teacher').querySelector('[data-pub="'+e.id+'"]'); setSwitch(sw, nuevo); });
  }catch(err){ appAlert('No se pudo cambiar: '+(err.message||'')); }
}
async function toggleExtra(btn){
  const unitId=btn.dataset.extra, campo=btn.dataset.campo, nuevo=btn.dataset.on==='0';
  const u=unidadesById[unitId]; if(!u) return;
  const mt = campo==='mt' ? nuevo : (u.ver_megatest!==false);
  const fa = campo==='fa' ? nuevo : (u.ver_falladas!==false);
  try{
    await call('/rest/v1/rpc/set_unidad_extras',{method:'POST',body:impProf({p_unidad:unitId, p_megatest:mt, p_falladas:fa, p_certificado_id:certBD()})});
    u.ver_megatest=mt; u.ver_falladas=fa;
    setSwitch(btn, nuevo);
  }catch(err){ appAlert('No se pudo cambiar: '+(err.message||'')); }
}
async function togglePublicado(btn){
  const examId=btn.dataset.pub, nuevo=btn.dataset.on==='0';
  const all=[].concat(...Object.values(examsByUnit));
  const ex=all.find(e=>e.id===examId);
  try{
    await call('/rest/v1/rpc/set_examen_publicado',{method:'POST',body:impProf({p_examen_id:examId, p_publicado:nuevo})});
    if(ex) ex.publicado=nuevo;
    setSwitch(btn, nuevo);
  }catch(err){ appAlert('No se pudo cambiar: '+(err.message||'')); }
}

// Exámenes e intentos de UN alumno
function openAlumnoDetalle(email){
  showView('teacher'); window.scrollTo(0,0);
  email=(email||'').toLowerCase().trim();
  teacherView='alumno'; teacherAl=email; teacherById={};
  // Datos del alumno en el resumen
  const meta=(resumenRows||[]).find(x=>(x.alumno||'').toLowerCase()===email)||{};
  const nombreReal=meta.nombre || meta._nombre || '';
  // Emparejar intentos por email (clave común); nombre como respaldo
  const list=teacherRows.filter(r=>{
    const e=(r.alumno_email||r.alumno||'').toLowerCase();
    if(e && e===email) return true;
    if(nombreReal && r._nombre && r._nombre.toLowerCase()===nombreReal.toLowerCase()) return true;
    return false;
  });
  // Filtro por unidad (Opción 1: promedio de notas de la unidad seleccionada)
  const unidades=unidadesDeIntentos(list);
  if(teacherUnidadSel && !unidades.includes(teacherUnidadSel)) teacherUnidadSel=null;
  const uSel=teacherUnidadSel; // null = todas
  const listF = uSel ? list.filter(r=>r.unidad===uSel) : list;
  const mediaU = mediaPorUnidad(list, uSel);
  const mediaF = mediaFinalPorUnidad(list, uSel);
  const mediaT = mediaTodosIntentos(list, uSel);
  const mc = (mediaU!=null) ? mediaU.toFixed(1) : '—';
  const mf = (mediaF!=null) ? mediaF.toFixed(1) : '—';
  const mtF = (mediaT!=null) ? mediaT.toFixed(1) : '—';
  const rotulo = uSel ? codigoUnidad(uSel) : '½ Mejor int.';

  let html=`<button class="backbtn" onclick="openAlumnos()">← Alumnos</button>
    <h1 style="font-size:1.2rem;font-weight:800;letter-spacing:-.4px;margin:6px 0 2px;color:var(--navy)">${escHtml(nombreReal||email)}</h1>
    <p style="font-size:.78rem;color:var(--ink-soft);margin-bottom:12px">${list.length} intento${list.length!==1?'s':''}</p>`;
  // Selector de unidad (solo si hay más de una unidad con intentos)
  if(unidades.length>1){
    html+=`<div class="unit-filter">
      <button class="uf-chip${!uSel?' on':''}" onclick="setTeacherUnidad('')">Todas</button>
      ${unidades.map(u=>`<button class="uf-chip${uSel===u?' on':''}" onclick="setTeacherUnidad('${u}')">${escHtml(codigoUnidad(u))}</button>`).join('')}
    </div>`;
  }
  html+=`<div class="al-cards">
      <div class="al-card"><span>${escHtml(rotulo)}</span><b>${mc}</b></div>
      <div class="al-card"><span>½ todos int.</span><b>${mtF}</b></div>
      <div class="al-card"><span>½ Ex. Final</span><b>${mf}</b></div>
    </div>
    <button class="btn btn-ghost" style="margin-bottom:12px" onclick="pdfNotasAlumno('${email}')">⬇ Descargar PDF de notas</button>
    <div class="t-toggle"><button class="${teacherMode==='best'?'on':''}" onclick="setTeacherMode('best')">Mejor por examen</button><button class="${teacherMode==='all'?'on':''}" onclick="setTeacherMode('all')">Todos los intentos</button></div>`;
  if(!listF.length){ html+=`<div class="center-msg">${uSel?'No hay exámenes de esta unidad.':'Este alumno aún no ha hecho exámenes.'}</div>`; }
  if(teacherMode==='all'){
    listF.slice().sort((a,b)=>new Date(b.creado_en)-new Date(a.creado_en)).forEach(r=>{ html+=tRow(r,ufEx(r),fmtShort(new Date(r.creado_en))); });
  }else{
    const groups={};
    listF.forEach(r=>{ const k=(r.unidad||'')+'|'+(r.examen||''); (groups[k]=groups[k]||[]).push(r); });
    Object.values(groups).map(g=>{
      let best=g[0]; g.forEach(r=>{ const rr=r.total?r.correctas/r.total:-1, br=best.total?best.correctas/best.total:-1; if(rr>br) best=r; });
      const last=g.reduce((a,b)=> new Date(b.creado_en)>new Date(a.creado_en)?b:a);
      return {best,n:g.length,last,label:ufEx(g[0])};
    }).sort((a,b)=>a.label.localeCompare(b.label,'es')).forEach(o=>{
      const sub=`${o.n} ${o.n===1?'intento':'intentos'} · último ${fmtShort(new Date(o.last.creado_en))}`;
      html+=tRow(o.best,o.label,sub);
    });
  }
  $('teacher').innerHTML=html;
  $('teacher').querySelectorAll('.t-row[data-int]').forEach(b=> b.onclick=()=>abrirIntento(b.dataset.int));
}
function setTeacherUnidad(u){ teacherUnidadSel = u||null; if(teacherAl) openAlumnoDetalle(teacherAl); }
// Detalle de un intento (qué falló el alumno)
async function abrirIntento(id){
  const meta=teacherById[id]||{};
  const back = meta.alumno_email ? `openAlumnoDetalle('${meta.alumno_email}')` : (meta.alumno ? `openAlumnoDetalle('${meta.alumno}')` : 'pintarTeacher()');
  showView('teacher'); window.scrollTo(0,0);
  $('teacher').innerHTML=`<button class="backbtn" onclick="${back}">← Atrás</button><div class="loader"><span class="spin"></span></div>`;
  try{
    const rows=await call('/rest/v1/intentos?id=eq.'+id+'&select=detalle,correctas,incorrectas,en_blanco,total,codigo,creado_en');
    const it=(rows&&rows[0]); if(!it){ throw new Error('No se encontró el intento.'); }
    renderIntentoDetalle(meta,it);
  }catch(err){
    $('teacher').innerHTML=`<button class="backbtn" onclick="${back}">← Atrás</button>
      <div class="center-msg">No se pudo abrir el detalle.<br><small>${err.message||''}</small></div>`;
  }
}
function renderIntentoDetalle(meta,it){
  const back = meta.alumno_email ? `openAlumnoDetalle('${meta.alumno_email}')` : (meta.alumno ? `openAlumnoDetalle('${meta.alumno}')` : 'pintarTeacher()');
  const pct=(meta.porcentaje!=null)?meta.porcentaje:(it.total?Math.round(it.correctas/it.total*100):0);
  const pass=(meta.apto!=null)?meta.apto:(it.total&&it.correctas/it.total>=0.5);
  let html=`<button class="backbtn" onclick="${back}">← Atrás</button>
    <div class="result" style="text-align:left;padding:18px 16px">
      <div style="font-weight:800;color:var(--navy);font-size:1.02rem">${escHtml(meta.nombre||meta.alumno||'Alumno')}</div>
      <div style="font-size:.82rem;color:var(--ink-soft);margin-top:2px">${meta.label||''} · ${fmtShort(new Date(it.creado_en))}</div>
      <div style="display:flex;align-items:center;gap:11px;margin-top:11px;flex-wrap:wrap">
        <span class="score" style="font-size:1.9rem">${it.correctas}/${it.total}</span>
        <span class="verdict ${pass?'ok':'no'}">${pass?'Apto':'No apto'} · ${pct}%</span>
      </div>
      <div style="font-size:.74rem;color:var(--ink-soft);margin-top:9px">Aciertos: ${it.correctas} · Fallos: ${it.incorrectas} · En blanco: ${it.en_blanco}${it.codigo?' · Código: '+it.codigo:''}</div>
    </div>`;
  (it.detalle||[]).forEach((q,i)=>{
    html+=`<div class="qcard"><div class="qnum">Pregunta ${i+1}</div><div class="qtext">${q.enunciado}</div>`;
    (q.opciones||[]).forEach((op,idx)=>{
      let cls='opt';
      if(idx===q.correcta) cls+=' correct'; else if(idx===q.elegida) cls+=' wrong';
      html+=`<div class="${cls}"><span class="mk">${LETTERS[idx]}</span><span class="otext">${op}</span></div>`;
    });
    if(q.elegida<0) html+=`<div class="expl" style="border-color:var(--no);background:var(--no-bg);color:var(--no)">Sin responder.</div>`;
    if(q.explicacion) html+=`<div class="expl">${q.explicacion}</div>`;
    html+=`</div>`;
  });
  html+=`<div class="bar"><button class="btn btn-ghost" onclick="${back}">← Volver</button></div>`;
  $('teacher').innerHTML=html;
}

// ---- Gestión de exámenes (profesor) ----
// Un examen es visible para esta sesión si es global (sin academia) o de MI academia.
// Es el filtro en ORIGEN: sin él, los exámenes de una academia se colaban en las
// tarjetas de unidad de las demás (solo "Mis exámenes" filtraba).
function examDeMiAcademia(e){
  return (e.academia_id==null) || (userAcademia==null) || (e.academia_id===userAcademia);
}
// Visibilidad completa de un examen: academia + profesor propietario.
// Los exámenes con profesor_id pertenecen SOLO a ese profesor (y a sus alumnos).
// Los exámenes sin profesor_id son contenido base compartido.
function examVisible(e){
  if(!examDeMiAcademia(e)) return false;
  if(e.profesor_id==null) return true;
  const pid = window._saImpersona ? window._saImpersonaProf
            : (userRol==='profesor' ? userId : userProfesorId);
  if(!pid) return true; // admin sin impersonar: ve todo
  return e.profesor_id===pid;
}
async function refrescarExamenes(){
  const ex=await call('/rest/v1/examenes?select=id,unidad,numero,titulo,tema,nivel,orden,academia_id,profesor_id&order=orden.asc');
  const _certAct=certBD();
  examsByUnit={}; (ex||[]).forEach(e=>{ const id=String(e.id); if(id.startsWith('repaso-')||id.startsWith('falladas-')) return; if(!examVisible(e)) return; const _u=unidadesById[e.unidad]; if(_u && _u.certificado_id && _u.certificado_id!==_certAct) return; (examsByUnit[e.unidad]=examsByUnit[e.unidad]||[]).push(e); });
}
function escHtml(s){return String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function escAttr(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

let builder={mode:'auto',kind:'test',unidad:'',titulo:'',nivel:'medio',n:15,tema:'',items:[],redItems:[{enun:'',file:null,matName:'',matMode:'inline'}],adding:false,picking:false,bankTema:'',temasCache:{},bankCache:{},cuentaFinal:false,examFile:null,examMatName:'',examMatMode:'inline'};

async function ensureTemas(unidad){
  if(!unidad) return [];
  if(builder.temasCache[unidad]) return builder.temasCache[unidad];
  try{
    const r=await call('/rest/v1/rpc/temas_de_unidad',{method:'POST',body:{p_unidad:unidad}});
    // Ocultar del desplegable los temas técnicos: preguntas de exámenes
    // pegados/importados y fantasmas. Siguen en la BD ligadas a sus exámenes,
    // pero no alimentan el generador automático ni ensucian el selector.
    builder.temasCache[unidad]=(r||[]).filter(t=>!/^(prof-|imp-|aula-imp-|repaso-|falladas-)/i.test((t.tema||'')+''));
  }
  catch(e){ builder.temasCache[unidad]=[]; }
  return builder.temasCache[unidad];
}
async function ensureBank(unidad,tema){
  const k=unidad+'|'+(tema||'');
  if(builder.bankCache[k]) return builder.bankCache[k];
  const body={p_unidad:unidad}; if(tema) body.p_tema=tema;
  try{ const r=await call('/rest/v1/rpc/preguntas_de_unidad',{method:'POST',body}); builder.bankCache[k]=r||[]; }
  catch(e){ builder.bankCache[k]=[]; }
  return builder.bankCache[k];
}
function findBankQ(id){ for(const k in builder.bankCache){ const q=(builder.bankCache[k]||[]).find(x=>x.id===id); if(q) return q; } return null; }

function captureFields(){
  const u=$('ce-unidad'); if(u) builder.unidad=u.value;
  const t=$('ce-titulo'); if(t) builder.titulo=t.value;
  const nv=$('ce-nivel'); if(nv) builder.nivel=nv.value;
  const n=$('ce-n'); if(n) builder.n=Math.max(1,Math.min(100,parseInt(n.value,10)||15));
  const tm=$('ce-tema'); if(tm) builder.tema=tm.value;
  const cf=$('ce-final'); if(cf) builder.cuentaFinal=cf.checked;
}

// Etiqueta de tema reutilizable (global, usada por builder y picker)
function temaLabelGlobal(t){
  const map={};
  Object.values(examsByUnit).forEach(arr=>arr.forEach(e=>{ map[e.id]=e.titulo||e.id; }));
  return map[t.tema]||t.tema;
}

async function openExamMgmt(){
  const units=unidadesParaCrearExamen();
  builder={mode:'auto',kind:'test',unidad:units[0]||'',titulo:'',nivel:'medio',n:15,tema:'',items:[],redItems:[{enun:'',file:null,matName:'',matMode:'inline'}],adding:false,picking:false,bankTema:'',temasCache:{},bankCache:{},cuentaFinal:false,examFile:null,examMatName:'',examMatMode:'inline'};
  showView('teacher'); window.scrollTo(0,0);
  if(builder.unidad) await ensureTemas(builder.unidad);
  renderExamMgmt();
}

function renderExamMgmt(okMsg,errMsg){
  const units=unidadesParaCrearExamen();
  if(!builder.unidad && units.length) builder.unidad=units[0];
  const uOpts=units.map(u=>`<option value="${u}"${u===builder.unidad?' selected':''}>${unidadesById[u]?unidadesById[u].codigo+' · '+unidadesById[u].titulo:u}</option>`).join('');
  const temas=builder.temasCache[builder.unidad]||[];
  const examTitleMap={};
  Object.values(examsByUnit).forEach(arr=>arr.forEach(e=>{ examTitleMap[e.id]=e.titulo||e.id; }));
  function temaLabel(t){ return temaLabelGlobal(t); }
  const h=[];
  h.push(`<button class="backbtn" onclick="pintarTeacher()">← Resultados</button>`);
  h.push(`<h1 style="font-size:1.25rem;font-weight:800;letter-spacing:-.4px;margin:6px 0 2px;color:var(--navy)">Gestión de exámenes</h1>`);
  h.push(`<p style="font-size:.8rem;color:var(--ink-soft);margin-bottom:14px">Genera un examen por tema o monta uno a medida con tus propias preguntas. Aparece para el alumnado al instante.</p>`);
  h.push(`<button onclick="driveAbrir()" style="width:100%;background:#fff;border:1.5px solid var(--line);color:var(--navy);font-weight:700;border-radius:12px;padding:10px;margin-bottom:14px;cursor:pointer;font-family:inherit;font-size:.82rem">📁 Abrir Drive (materiales de exámenes)</button>`);
  if(okMsg) h.push(`<div class="t-note ok">${okMsg}</div>`);
  if(errMsg) h.push(`<div class="t-note err">${errMsg}</div>`);
  h.push(`<div class="t-toggle" style="margin-bottom:14px"><button id="kd-test" class="${builder.kind==='test'?'on':''}">📝 Test</button><button id="kd-red" class="${builder.kind==='redaccion'?'on':''}">✍️ Redacción</button><button id="kd-imp" class="${builder.kind==='importar'?'on':''}">📋 Pegar examen</button></div>`);
  if(builder.kind==='redaccion'){
        h.push('<div class="t-card"><label style="margin-top:6px">Unidad</label><select id="ce-unidad">'+uOpts+'</select><label>Título del examen</label><input id="ce-titulo" type="text" placeholder="Ej.: Examen de redacción" value="'+escAttr(builder.titulo)+'"><label>Nivel</label><select id="ce-nivel"><option value="medio"'+(builder.nivel==='medio'?' selected':'')+'>Medio</option><option value="alto"'+(builder.nivel==='alto'?' selected':'')+'>Alto</option></select><label class="ckrow" style="margin-top:12px"><input type="checkbox" id="ce-final"'+(builder.cuentaFinal?' checked':'')+'>  Cuenta para la nota final</label><label style="margin-top:14px;font-size:.72rem;color:var(--ink-soft)">PDF del examen (opcional, p.ej. un mapa)'+(builder.examMatName?' · <b>📎 '+escHtml(builder.examMatName)+'</b>':'')+'</label><input id="ce-mat-file" type="file" accept="application/pdf" style="font-size:.75rem"><select id="ce-mat-mode" style="font-size:.78rem;padding:6px;border:1.5px solid var(--line);border-radius:8px;margin-top:6px"><option value="inline"'+(builder.examMatMode==='inline'?' selected':'')+'>Mostrar incrustado</option><option value="boton"'+(builder.examMatMode==='boton'?' selected':'')+'>Botón "Ver material"</option></select></div>');
    h.push(renderRedSection());
    h.push(`<h2 style="font-size:.78rem;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:1px;margin:18px 2px 12px">Exámenes creados por el profesorado</h2>`);
    h.push(listaProfHtml(units));
    $('teacher').innerHTML=h.join('');
    const us=$('ce-unidad'); if(us) us.addEventListener('change',onUnidadChange);
    $('kd-test').onclick=()=>setKind('test'); $('kd-red').onclick=()=>setKind('redaccion');
    const ki4=$('kd-imp'); if(ki4) ki4.onclick=()=>setKind('importar');
    wireRed();
    $('teacher').querySelectorAll('[data-del]').forEach(b=> b.onclick=()=>borrarExamenUI(b.dataset.del));
    return;
  }
  // ── Bloque IMPORTAR ──
  if(builder.kind==='importar'){
    h.push(`<div class="t-card">
      <label style="margin-top:6px">Unidad de destino</label>
      <select id="ce-unidad">${uOpts}</select>
      <label>Título del examen</label>
      <input id="ce-titulo" type="text" placeholder="Ej.: Examen Tema 3 · Importado" value="${escAttr(builder.titulo)}">
      <label>Nivel</label>
      <select id="ce-nivel">
        <option value="medio"${builder.nivel==='medio'?' selected':''}>Medio</option>
        <option value="alto"${builder.nivel==='alto'?' selected':''}>Alto</option>
      </select>
      <label class="ckrow" style="margin-top:12px"><input type="checkbox" id="ce-final"${builder.cuentaFinal?' checked':''}> Cuenta para la nota final</label>
    </div>`);
    h.push(`<div class="t-card" style="margin-top:12px">
      <div style="background:#eff6ff;border-left:3px solid var(--navy);border-radius:0 8px 8px 0;padding:10px 12px;font-size:.74rem;color:#1e3a8a;line-height:1.6;margin-bottom:12px;">
        <strong>Formato:</strong> un número por pregunta, letra por opción, <code>*</code> delante de la correcta, <code>&gt;</code> para la explicación.<br>
        <code style="display:block;margin-top:6px;background:rgba(255,255,255,.7);padding:6px 8px;border-radius:5px;font-size:.7rem;white-space:pre-wrap;">1. ¿Pregunta?
*A) Correcta
B) Opción
C) Opción
D) Opción
> Explicación</code>
      </div>
      <textarea id="imp-text" rows="10" placeholder="Pega aquí tu examen con el formato indicado arriba..." style="width:100%;padding:10px;border:1.5px solid var(--line);border-radius:10px;font-size:.82rem;font-family:inherit;resize:vertical;line-height:1.5;"></textarea>
      <div class="pdf-status" id="imp-status" style="margin-top:8px;"></div>
      <div id="imp-preview" style="margin-top:8px;"></div>
      <button class="btn btn-primary" id="imp-analizar-btn" style="margin-top:12px;background:var(--navy);">🔍 Analizar y crear examen</button>
    </div>`);
    h.push(`<h2 style="font-size:.78rem;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:1px;margin:18px 2px 12px">Exámenes creados por el profesorado</h2>`);
    h.push(listaProfHtml(units));
    $('teacher').innerHTML=h.join('');
    const us=$('ce-unidad'); if(us) us.addEventListener('change',onUnidadChange);
    $('kd-test').onclick=()=>setKind('test');
    $('kd-red').onclick=()=>setKind('redaccion');
    const ki3=$('kd-imp'); if(ki3) ki3.onclick=()=>setKind('importar');
    wireImportarKind();
    $('teacher').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>borrarExamenUI(b.dataset.del));
    return;
  }
  h.push(`<div class="t-toggle" style="margin-bottom:14px"><button id="md-auto" class="${builder.mode==='auto'?'on':''}">Automático</button><button id="md-med" class="${builder.mode==='medida'?'on':''}">A medida</button></div>`);
  h.push(`<div class="t-card"><label style="margin-top:6px">Unidad</label><select id="ce-unidad">${uOpts}</select><label>Título del examen</label><input id="ce-titulo" type="text" placeholder="Ej.: Examen sorpresa" value="${escAttr(builder.titulo)}"><div style="display:flex;gap:10px"><div style="flex:1"><label>Nivel</label><select id="ce-nivel"><option value="medio"${builder.nivel==='medio'?' selected':''}>Medio</option><option value="alto"${builder.nivel==='alto'?' selected':''}>Alto</option></select></div>`);
  if(builder.mode==='auto') h.push(`<div style="flex:1"><label>Nº de preguntas</label><input id="ce-n" type="number" min="1" max="100" value="${builder.n}"></div>`);
  h.push(`</div>`);
  h.push(`<label class="ckrow" style="margin-top:12px"><input type="checkbox" id="ce-final"${builder.cuentaFinal?' checked':''}> Cuenta para la nota final</label>`);
  if(builder.mode==='auto'){
    const tOpts=`<option value="">Toda la unidad</option>`+temas.map(t=>`<option value="${escAttr(t.tema)}"${t.tema===builder.tema?' selected':''}>${escHtml(temaLabel(t))} (${t.n})</option>`).join('');
h.push(`<label>Tema</label><select id="ce-tema">${tOpts}</select><button class="btn btn-primary" id="ce-btn" style="margin-top:16px">Crear examen</button>`);
  }
  h.push(`</div>`);
  if(builder.mode==='medida') h.push(renderBuilderSection(temas));
  h.push(`<h2 style="font-size:.78rem;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:1px;margin:18px 2px 12px">Exámenes creados por el profesorado</h2>`);
  h.push(listaProfHtml(units));
  $('teacher').innerHTML=h.join('');
  const us=$('ce-unidad'); if(us) us.addEventListener('change',onUnidadChange);
  $('kd-test').onclick=()=>setKind('test'); $('kd-red').onclick=()=>setKind('redaccion');
  const ki=$('kd-imp'); if(ki) ki.onclick=()=>setKind('importar');
  if(builder.kind==='importar'){ wireImportarKind(); }
  const ma=$('md-auto'); if(ma) ma.onclick=()=>setMode('auto');
  const mm=$('md-med'); if(mm) mm.onclick=()=>setMode('medida');
  const cb=$('ce-btn'); if(cb) cb.onclick=crearAutoUI;
  wireBuilder();
  $('teacher').querySelectorAll('[data-del]').forEach(b=> b.onclick=()=>borrarExamenUI(b.dataset.del));
}
function listaProfHtml(units){
  let any=false, list='';
  units.forEach(u=>{
    const prof=(examsByUnit[u]||[]).filter(e=>{
      const esProf=String(e.id).startsWith('prof-')||String(e.id).startsWith('imp-');
      if(!esProf) return false;
      // Solo los visibles para este profesor (academia + profesor propietario)
      return examVisible(e);
    });
    if(!prof.length) return; any=true;
    list+=`<div class="t-name" style="margin-top:4px">${unidadesById[u]?unidadesById[u].codigo:u}</div>`;
    prof.forEach(e=>{ const badge=e.tipo==='redaccion'?'<span class="rbadge">Redacción</span> ':''; list+=`<div class="ce-row"><span class="ce-info"><b>${badge}${escHtml(e.titulo)}</b><span>Nivel ${e.nivel||'—'}</span></span><button class="ce-del" data-del="${e.id}" data-acad="${e.academia_id==null?'':e.academia_id}" aria-label="Borrar">🗑</button></div>`; });
  });
  return any?list:`<div class="center-msg" style="padding:18px">Aún no has creado exámenes.</div>`;
}

// ---- Redacción: constructor de enunciados ----
function setKind(k){ captureFields(); if(builder.kind==='redaccion') captureRed(); builder.kind=k; renderExamMgmt(); }
function captureRed(){
  const cont=$('teacher'); if(!cont) return;
  // Material a nivel de examen
  const ef=cont.querySelector('#ce-mat-file');
  if(ef && ef.files && ef.files[0]){ builder.examFile=ef.files[0]; builder.examMatName=ef.files[0].name; }
  const em=cont.querySelector('#ce-mat-mode'); if(em) builder.examMatMode=em.value||'inline';
  // Preguntas (enunciado + material por pregunta)
  const blocks=cont.querySelectorAll('.red-q');
  if(blocks.length){
    const arr=[];
    blocks.forEach((b,i)=>{
      const prev=builder.redItems[i]||{enun:'',file:null,matName:'',matMode:'inline'};
      const ta=b.querySelector('.red-q-in');
      const it={enun:ta?ta.value:'', file:prev.file, matName:prev.matName, matMode:prev.matMode};
      const fi=b.querySelector('.red-q-file');
      if(fi && fi.files && fi.files[0]){ it.file=fi.files[0]; it.matName=fi.files[0].name; }
      const md=b.querySelector('.red-q-mode'); if(md) it.matMode=md.value||'inline';
      arr.push(it);
    });
    builder.redItems=arr;
  }
}
function renderRedSection(){
  const h=[`<div class="t-card">`];
  h.push(`<label style="margin-top:6px">Preguntas para redactar (${builder.redItems.length})</label>`);
  builder.redItems.forEach((raw,i)=>{
    const it=(raw&&typeof raw==='object')?raw:{enun:raw||'',file:null,matName:'',matMode:'inline'};
    h.push(`<div class="red-q" style="margin-bottom:14px"><div class="rq-num" style="display:flex;justify-content:space-between;align-items:center">Pregunta ${i+1}${builder.redItems.length>1?`<button class="ce-del" data-rmred="${i}" aria-label="Quitar" style="background:none">✕</button>`:''}</div><textarea class="red-q-in" rows="2" placeholder="Escribe el enunciado a redactar">${escHtml(it.enun)}</textarea><div style="margin-top:6px"><label style="font-size:.72rem;color:var(--ink-soft)">PDF de la pregunta (opcional)${it.matName?` · <b>📎 ${escHtml(it.matName)}</b>`:''}</label><input class="red-q-file" type="file" accept="application/pdf" style="font-size:.75rem;display:block;margin-top:4px"><select class="red-q-mode" style="font-size:.78rem;padding:6px;border:1.5px solid var(--line);border-radius:8px;margin-top:6px"><option value="inline"${it.matMode==='inline'?' selected':''}>Mostrar incrustado</option><option value="boton"${it.matMode==='boton'?' selected':''}>Botón "Ver material"</option></select></div></div>`);
  });
  h.push(`<button class="btn btn-ghost" id="red-add" style="margin-top:6px">Añadir pregunta</button>`);
  h.push(`<button class="btn btn-honey" id="red-create" style="margin-top:12px">Crear examen de redacción</button>`);
  h.push(`</div>`);
  return h.join('');
}
function wireRed(){
  const add=$('red-add'); if(add) add.onclick=()=>{ captureRed(); builder.redItems.push({enun:'',file:null,matName:'',matMode:'inline'}); renderExamMgmt(); };
  const cr=$('red-create'); if(cr) cr.onclick=crearRedUI;
  $('teacher').querySelectorAll('[data-rmred]').forEach(b=> b.onclick=()=>{ captureRed(); builder.redItems.splice(+b.dataset.rmred,1); if(!builder.redItems.length) builder.redItems=[{enun:'',file:null,matName:'',matMode:'inline'}]; renderExamMgmt(); });
}
async function subirMaterialPDF(file, path){
  if(!file) return null;
  const okType=(file.type==='application/pdf')||/\.pdf$/i.test(file.name||'');
  if(!okType) throw new Error('El material debe ser un PDF.');
  const up=await fetch(SUPABASE_URL+'/storage/v1/object/material-examenes/'+encodeURI(path),{
    method:'POST',
    headers:{ 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+token, 'Content-Type':'application/pdf' },
    body:file
  });
  if(!up.ok){ const t=await up.text().catch(()=>''); throw new Error('Subida PDF: '+(t||up.status)); }
  return SUPABASE_URL+'/storage/v1/object/public/material-examenes/'+encodeURI(path);
}
async function crearRedUI(){
  captureFields(); captureRed();
  const items=builder.redItems.map(it=>({enun:((it&&it.enun)||'').trim(), file:(it&&it.file)||null, matMode:(it&&it.matMode)||'inline'})).filter(x=>x.enun);
  if(!items.length){ renderExamMgmt(null,'Añade al menos una pregunta.'); return; }
  const btn=$('red-create'); if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }
  try{
    const folder='red/'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
    let examUrl=null, examMode=null;
    if(builder.examFile){ examUrl=await subirMaterialPDF(builder.examFile, folder+'/examen.pdf'); examMode=builder.examMatMode||'inline'; }
    const preguntas=[];
    for(let i=0;i<items.length;i++){
      const it=items[i]; const q={enunciado:it.enun};
      if(it.file){ q.material_url=await subirMaterialPDF(it.file, folder+'/p'+(i+1)+'.pdf'); q.material_modo=it.matMode||'inline'; }
      preguntas.push(q);
    }
    const id=await call('/rest/v1/rpc/crear_examen_redaccion',{method:'POST',body:impProf({
      p_unidad:builder.unidad, p_titulo:builder.titulo, p_nivel:builder.nivel,
      p_preguntas:preguntas, p_cuenta_final:builder.cuentaFinal,
      p_material_url:examUrl, p_material_modo:examMode
    })});
    const nuevo={id:(typeof id==='string'?id:(id&&id[0])||'prof-x'),unidad:builder.unidad,numero:'R',titulo:builder.titulo||'Examen de redacción',tema:'Redacción',nivel:builder.nivel,orden:8000,tipo:'redaccion',material_url:examUrl,material_modo:examMode};
    (examsByUnit[builder.unidad]=examsByUnit[builder.unidad]||[]).push(nuevo);
    builder.titulo=''; builder.redItems=[{enun:'',file:null,matName:'',matMode:'inline'}]; builder.cuentaFinal=false;
    builder.examFile=null; builder.examMatName=''; builder.examMatMode='inline';
    renderExamMgmt('✅ Examen de redacción creado. Ya aparece para el alumnado.');
  }catch(err){ if(btn){ btn.disabled=false; btn.textContent='Crear examen de redacción'; } renderExamMgmt(null,'No se pudo crear: '+(err.message||'')); }
}

function renderBuilderSection(temas){
  const h=[`<div class="t-card">`];
  h.push(`<label style="margin-top:6px">Preguntas del examen (${builder.items.length})</label>`);
  if(!builder.items.length){
    h.push(`<div class="bld-empty">Aún no hay preguntas. Escribe las tuyas o cógelas del banco.</div>`);
  } else {
    builder.items.forEach((it,i)=>{
      const tag=it.tipo==='nueva'?'Propia':'Banco';
      const txt=it.tipo==='nueva'?it.enunciado:(it._enun||('Pregunta #'+it.id));
      h.push(`<div class="bld-row"><span class="bld-tag${it.tipo==='nueva'?' mine':''}">${tag}</span><span class="bld-txt">${i+1}. ${escHtml(txt)}</span><button class="ce-del" data-rm="${i}" aria-label="Quitar">✕</button></div>`);
    });
  }
  if(builder.adding){
    h.push(`<div class="bld-form"><label style="margin-top:4px">Enunciado</label><textarea id="nq-enun" rows="2" placeholder="Escribe la pregunta"></textarea><label>Opciones (marca la correcta)</label>${[0,1,2,3].map(i=>`<div class="nq-opt"><input type="radio" name="nq-correct" value="${i}"${i===0?' checked':''}><input type="text" id="nq-opt${i}" placeholder="Opción ${LETTERS[i]}"></div>`).join('')}<label>Explicación (opcional)</label><textarea id="nq-expl" rows="2" placeholder="Por qué es correcta"></textarea><div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-ghost" id="nq-cancel" style="flex:1">Cancelar</button><button class="btn btn-primary" id="nq-save" style="flex:1">Guardar pregunta</button></div></div>`);
  } else if(builder.picking){
    const bank=builder.bankCache[builder.unidad+'|'+(builder.bankTema||'')]||[];
    const tOpts=`<option value="">Todos los temas</option>`+temas.map(t=>`<option value="${escAttr(t.tema)}"${t.tema===builder.bankTema?' selected':''}>${escHtml(temaLabelGlobal(t))} (${t.n})</option>`).join('');
    const rows=bank.length?bank.map(q=>{ const already=builder.items.some(it=>it.tipo==='banco'&&it.id===q.id); return `<label class="bk-row"><input type="checkbox" name="bk-pick" value="${q.id}"${already?' checked disabled':''}><span>${escHtml(q.enunciado)}</span></label>`; }).join(''):`<div class="bld-empty">No hay preguntas para ese tema.</div>`;
h.push(`<div class="bld-form"><label style="margin-top:4px">Tema del banco</label><select id="bk-tema">${tOpts}</select><div class="bk-list">${rows}</div><div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-ghost" id="bk-cancel" style="flex:1">Cancelar</button><button class="btn btn-primary" id="bk-add" style="flex:1">Añadir seleccionadas</button></div></div>`);
  } else {
    h.push(`<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-ghost" id="bld-new" style="flex:1">✏️ Pregunta nueva</button><button class="btn btn-ghost" id="bld-bank" style="flex:1">📋 Del banco</button></div>`);
    h.push(`<button class="btn btn-primary" id="cm-btn" style="margin-top:12px"${builder.items.length?'':' disabled'}>Crear examen (${builder.items.length})</button>`);
  }
  h.push(`</div>`);
  return h.join('');
}

function wireBuilder(){
  $('teacher').querySelectorAll('[data-rm]').forEach(b=> b.onclick=()=>removeItem(parseInt(b.dataset.rm,10)));
  const bn=$('bld-new'); if(bn) bn.onclick=openAddNew;
  const bb=$('bld-bank'); if(bb) bb.onclick=openPicker;
  const cm=$('cm-btn'); if(cm) cm.onclick=crearMedidaUI;
  const nc=$('nq-cancel'); if(nc) nc.onclick=()=>{ captureFields(); builder.adding=false; renderExamMgmt(); };
  const ns=$('nq-save'); if(ns) ns.onclick=saveNewQuestion;
  const bkc=$('bk-cancel'); if(bkc) bkc.onclick=()=>{ captureFields(); builder.picking=false; renderExamMgmt(); };
  const bka=$('bk-add'); if(bka) bka.onclick=addBankSelected;
  const bkt=$('bk-tema'); if(bkt) bkt.addEventListener('change',onBankTemaChange);
}

function setMode(m){ captureFields(); builder.mode=m; builder.adding=false; builder.picking=false; renderExamMgmt(); }
async function onUnidadChange(){ captureFields(); if(builder.kind==='redaccion') captureRed(); builder.tema=''; builder.bankTema=''; await ensureTemas(builder.unidad); renderExamMgmt(); }
function openAddNew(){ captureFields(); builder.adding=true; builder.picking=false; renderExamMgmt(); }
async function openPicker(){
  captureFields();
  const sel=$('ce-unidad');
  if(sel && sel.value) builder.unidad=sel.value;
  if(!builder.unidad){ appAlert('Primero selecciona una unidad.'); return; }
  builder.picking=true; builder.adding=false; builder.bankTema='';
  await ensureTemas(builder.unidad);
  await ensureBank(builder.unidad,'');
  renderExamMgmt();
  setTimeout(()=>{ const el=document.querySelector('.bk-list'); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}); },50);
}
function onBankTemaChange(){ const s=$('bk-tema'); builder.bankTema=s?s.value:''; ensureBank(builder.unidad,builder.bankTema).then(()=>renderExamMgmt()); }
function removeItem(i){ captureFields(); builder.items.splice(i,1); renderExamMgmt(); }

function saveNewQuestion(){
  const enun=($('nq-enun').value||'').trim();
  const chosen=document.querySelector('input[name="nq-correct"]:checked');
  const ci=chosen?parseInt(chosen.value,10):0;
  const raw=[0,1,2,3].map(i=>($('nq-opt'+i).value||'').trim());
  const filled=[]; let correctPos=-1;
  raw.forEach((v,i)=>{ if(v){ if(i===ci) correctPos=filled.length; filled.push(v); } });
  if(!enun){ appAlert('Falta el enunciado de la pregunta.'); return; }
  if(filled.length<2){ appAlert('Pon al menos 2 opciones.'); return; }
  if(correctPos<0){ appAlert('Marca cuál es la opción correcta (y que no esté vacía).'); return; }
  const expl=($('nq-expl').value||'').trim();
  builder.items.push({tipo:'nueva',enunciado:enun,opciones:filled,correcta:correctPos,explicacion:expl});
  builder.adding=false; renderExamMgmt();
}
function addBankSelected(){
  const checks=document.querySelectorAll('input[name="bk-pick"]:checked');
  checks.forEach(c=>{ if(c.disabled) return; const id=parseInt(c.value,10);
    if(!builder.items.some(it=>it.tipo==='banco'&&it.id===id)){ const q=findBankQ(id); builder.items.push({tipo:'banco',id,_enun:q?q.enunciado:('Pregunta #'+id)}); }
  });
  builder.picking=false; renderExamMgmt();
}

async function crearAutoUI(){
  captureFields();
  const btn=$('ce-btn'); if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }
  try{
    const body={p_unidad:builder.unidad,p_titulo:builder.titulo||'Examen del profesor',p_nivel:builder.nivel,p_n:builder.n,p_cuenta_final:builder.cuentaFinal};
    if(builder.tema) body.p_tema=builder.tema;
    await call('/rest/v1/rpc/crear_examen',{method:'POST',body:impProf(body)});
    await refrescarExamenes();
    builder.cuentaFinal=false;
    const temaTxt=builder.tema?(' · '+builder.tema):'';
    renderExamMgmt(`Examen creado: "${builder.titulo||'Examen del profesor'}" · ${unidadesById[builder.unidad]?unidadesById[builder.unidad].codigo:builder.unidad}${temaTxt} · ${builder.n} preguntas.`);
  }catch(err){ renderExamMgmt(null,'No se pudo crear: '+(err.message||'')); }
}
async function crearMedidaUI(){
  captureFields();
  if(!builder.items.length){ appAlert('Añade al menos una pregunta.'); return; }
  const payload=builder.items.map(it=> it.tipo==='nueva'
    ? {tipo:'nueva',enunciado:it.enunciado,opciones:it.opciones,correcta:it.correcta,explicacion:it.explicacion||''}
    : {tipo:'banco',id:it.id});
  const btn=$('cm-btn'); if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }
  try{
    await call('/rest/v1/rpc/crear_examen_medida',{method:'POST',body:impProf({p_unidad:builder.unidad,p_titulo:builder.titulo||'Examen del profesor',p_nivel:builder.nivel,p_preguntas:payload,p_cuenta_final:builder.cuentaFinal})});
    await refrescarExamenes();
    const titulo=builder.titulo||'Examen del profesor', nq=builder.items.length;
    builder.items=[]; builder.adding=false; builder.picking=false; builder.cuentaFinal=false;
    renderExamMgmt(`Examen a medida creado: "${titulo}" · ${nq} pregunta${nq!==1?'s':''}.`);
  }catch(err){ if(btn){ btn.disabled=false; } renderExamMgmt(null,'No se pudo crear: '+(err.message||'')); }
}
async function borrarExamenUI(id){
  const btn=document.querySelector('[data-del="'+CSS.escape(id)+'"]');
  if(btn){
    const acad=btn.dataset.acad;
    if(acad!=='' && userAcademia!=null && String(acad)!==String(userAcademia)){
      appAlert('Este examen pertenece a otra academia y no puedes borrarlo.');
      return;
    }
  }
  if(!await appConfirm('¿Borrar este examen y sus preguntas propias? Esta acción no se puede deshacer.')) return;
  try{
    // Borrado seguro en el servidor: la RPC verifica que el examen es tuyo
    // (profesor_id) y borra intentos + examen de forma atómica. El aislamiento
    // real está en RLS, no solo en el frontend.
    await call('/rest/v1/rpc/borrar_examen',{method:'POST',body:{p_examen_id:id}});
    await refrescarExamenes();
    renderExamMgmt('Examen borrado correctamente.');
  }catch(err){ renderExamMgmt(null,'No se pudo borrar: '+(err.message||'')); }
}

async function borrarMateriaUI(unidadId, titulo){
  const pm = partesMateria(titulo||'');
  if(!await appConfirm('¿Borrar la materia "'+(pm.nombre||titulo)+'" y todos sus exámenes y preguntas?\nEsta acción no se puede deshacer.')) return;
  try{
    await call('/rest/v1/rpc/borrar_materia',{method:'POST',body:impProf({p_unidad:unidadId})});
    delete unidadesById[unidadId];
    delete examsByUnit[unidadId];
    openModulosTeacher('Materia borrada correctamente.');
  }catch(err){ openModulosTeacher(null, 'No se pudo borrar: '+(err.message||'')); }
}

// ---- Exportar resultados a CSV ----
function csvCell(v){
  if(v===null||v===undefined) return '';
  let s=String(v);
  if(/[";\n]/.test(s)) s='"'+s.replace(/"/g,'""')+'"';
  return s;
}
function descargarCSV(nombre, filas){
  const txt='\ufeff'+filas.map(r=>r.map(csvCell).join(';')).join('\r\n');
  const blob=new Blob([txt],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=nombre;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },100);
}
const num1=n=>(n===null||n===undefined||n==='')?'':String((+n).toFixed(1)).replace('.',',');
function fechaCSV(ts){ try{ const d=new Date(ts), p=x=>String(x).padStart(2,'0'); return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`; }catch(_){ return ''; } }
function hoyStamp(){ const d=new Date(), p=x=>String(x).padStart(2,'0'); return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}`; }

async function exportNotasCSV(){
  try{
    const rows=await call('/rest/v1/rpc/export_notas',{method:'POST',body:{}})||[];
    const exams=[], examMap={}, byStu={};
    rows.forEach(r=>{
      if(!examMap[r.examen_id]){ examMap[r.examen_id]={titulo:r.examen,unidad:r.unidad,cuenta:r.cuenta_final,orden:r.orden}; exams.push(r.examen_id); }
      (byStu[r.alumno]=byStu[r.alumno]||{})[r.examen_id]=r.nota;
    });
    exams.sort((a,b)=> (examMap[a].orden-examMap[b].orden) || examMap[a].titulo.localeCompare(examMap[b].titulo,'es'));
    const alumnos = resumenRows ? resumenRows.slice() : Object.keys(byStu).map(e=>({alumno:e,nombre:'',media_clase:null,media_final:null}));
    const header=['Nombre','Correo','Media clase','Media final', ...exams.map(id=> examMap[id].titulo + (examMap[id].cuenta?' (final)':''))];
    const filas=[header];
    alumnos.forEach(a=>{
      const fila=[a.nombre||'', a.alumno, num1(a.media_clase), num1(a.media_final)];
      exams.forEach(id=> fila.push(num1((byStu[a.alumno]||{})[id])));
      filas.push(fila);
    });
    descargarCSV(`aptuvia_notas_${hoyStamp()}.csv`, filas);
  }catch(err){ appAlert('No se pudo exportar: '+(err.message||'')); }
}

async function exportIntentosCSV(){
  try{
    const rows=await call('/rest/v1/rpc/export_intentos',{method:'POST',body:{}})||[];
    const header=['Nombre','Correo','Unidad','Examen','Tipo','Aciertos','Total','Porcentaje','Nota (0-10)','Estado','Fecha'];
    const filas=[header];
    rows.forEach(r=>{
      filas.push([
        r.nombre||'', r.alumno, r.unidad||'', r.examen||'', r.tipo||'',
        (r.aciertos==null?'':r.aciertos), (r.total==null?'':r.total),
        (r.porcentaje==null?'':r.porcentaje+'%'), num1(r.nota), r.estado||'', fechaCSV(r.fecha)
      ]);
    });
    descargarCSV(`aptuvia_intentos_${hoyStamp()}.csv`, filas);
  }catch(err){ appAlert('No se pudo exportar: '+(err.message||'')); }
}

// ---- Gestión de alumnos (autorizaciones) ----
// ============ CORRECCIONES (profesor) ============
async function openCorrecciones(okMsg){
  showView('teacher'); window.scrollTo(0,0);
  $('teacher').innerHTML='<button class="backbtn" onclick="pintarTeacher()">← Panel</button><div class="loader"><span class="spin"></span></div>';
  let rows=[], err=null;
  try{ rows=await call('/rest/v1/rpc/listar_entregas',{method:'POST',body:{}})||[]; }
  catch(e){ err=e.message; }
  renderCorrecciones(rows, err, okMsg);
}
function fmtFecha(ts){ try{ return new Date(ts).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}); }catch(_){ return ''; } }
function renderCorrecciones(rows, errMsg, okMsg){
  const h=[`<button class="backbtn" onclick="pintarTeacher()">← Panel</button>`];
  h.push(`<h1 style="font-size:1.25rem;font-weight:800;letter-spacing:-.4px;margin:6px 0 2px;color:var(--navy)">Correcciones</h1>`);
  const pend=rows.filter(r=>r.estado==='pendiente').length;
  h.push(`<p style="font-size:.8rem;color:var(--ink-soft);margin-bottom:14px">${pend} entrega${pend!==1?'s':''} pendiente${pend!==1?'s':''} de corregir.</p>`);
  if(okMsg) h.push(`<div class="t-note ok">${escHtml(okMsg)}</div>`);
  if(errMsg) h.push(`<div class="t-note err">${escHtml(errMsg)}</div>`);
  if(!rows.length){ h.push(`<div class="center-msg" style="padding:18px">Aún no hay entregas de redacción.</div>`); }
  else rows.forEach(r=>{
    let pill;
    if(r.estado==='pendiente'){ pill=`<span class="res pend">⏳ Pendiente</span>`; }
    else if(r.estado==='reabierto'){ pill=`<span class="res pend">↻ Reabierto</span>`; }
    else{ const n=(r.nota!=null)?(+r.nota).toFixed(1):'—', ok=(+r.nota>=5); pill=`<span class="res ${ok?'ok':'no'}">${ok?'✓ '+n:'✗ '+n}</span>`; }
    h.push(`<button class="al-row" data-ent="${escAttr(r.id)}"><span class="al-info"><b>${escHtml(r.nombre||r.alumno)}</b><span>${escHtml(r.examen)} · ${fmtFecha(r.creado_en)}</span></span>${pill}<span class="arrow">›</span></button>`);
  });
  $('teacher').innerHTML=h.join('');
  $('teacher').querySelectorAll('[data-ent]').forEach(b=> b.onclick=()=>openEntrega(b.dataset.ent));
}
async function openEntrega(id){
  showView('teacher'); window.scrollTo(0,0);
  $('teacher').innerHTML='<button class="backbtn" onclick="openCorrecciones()">← Correcciones</button><div class="loader"><span class="spin"></span></div>';
  try{
    const arr=await call('/rest/v1/rpc/obtener_entrega',{method:'POST',body:{p_id:id}});
    const e=arr&&arr[0];
    if(!e){ renderCorrecciones([], 'No se encontró la entrega.'); return; }
    renderEntrega(e);
  }catch(err){
    $('teacher').innerHTML=`<button class="backbtn" onclick="openCorrecciones()">← Correcciones</button><div class="center-msg">No se pudo abrir la entrega.<br><small>${escHtml(err.message||'')}</small></div>`;
  }
}
let crEnt=null, crTab='manual';
function crSetTab(t){ crTab=t; renderEntrega(crEnt); }
function crPromptTexto(){
  const e=crEnt||{}; const resp=Array.isArray(e.respuestas)?e.respuestas:[];
  const crit=(($('cr-crit')||{}).value||'').trim();
  let ex='';
  resp.forEach((r,i)=>{
    ex+='\n--- PREGUNTA '+(i+1)+' ---\n'+String(r.enunciado||'').trim()+
        '\n\nRESPUESTA DEL ALUMNO:\n'+(String(r.texto||'').trim()||'(sin respuesta)')+'\n';
  });
  return `Actúa como el profesor que corrige este examen de redacción.

ADJUNTO
Te adjunto el PDF con el examen resuelto (la plantilla del profesor). Úsalo como referencia de lo que se considera correcto. Si no hay PDF adjunto, dímelo y corrige solo con los criterios de abajo.

CRITERIOS DE CORRECCIÓN DEL PROFESOR
${crit||'(el profesor no ha indicado criterios: corrige por contenido, precisión y expresión)'}

EXAMEN DEL ALUMNO
Alumno: ${e.nombre||e.alumno||''}
Examen: ${e.examen||''}
${ex}
QUÉ TIENES QUE DEVOLVER
1. El texto del alumno tal cual, respetando sus palabras, e intercalando tus correcciones y anotaciones entre dobles corchetes. Ejemplo: "El presupuesto se aprueba en marzo [[abril, no marzo]]". Todo lo que vaya entre [[ ]] se pintará en rojo, como si lo hubiera escrito el profesor a mano en el papel.
2. Marca entre [[ ]] los errores, lo que falta y lo que está bien resuelto. No reescribas la respuesta del alumno.
3. Al final, un párrafo breve de valoración global entre [[ ]].
4. La última línea, exactamente con este formato y nada más: NOTA: X/10

REGLAS
- Corrige contra la plantilla del profesor y los criterios, no contra tu propia opinión.
- Sé exigente pero justo. No inventes errores que no están.
- Si el alumno deja algo en blanco, dilo y puntúa en consecuencia.
- Devuelve solo el texto corregido y la nota, sin explicaciones previas.`;
}
async function crCopiarPrompt(){
  try{ await navigator.clipboard.writeText(crPromptTexto()); appAlert('Prompt copiado.\n\nÁbrelo en Claude o Gemini, ADJUNTA el PDF del examen resuelto y pega el prompt.'); }
  catch(e){ appAlert('No se pudo copiar. Usa Compartir.'); }
}
async function crCompartirPrompt(){
  const t=crPromptTexto();
  if(navigator.share){ try{ await navigator.share({text:t}); return; }catch(e){} }
  crCopiarPrompt();
}
// Pinta una corrección: el texto del alumno en negro y lo que va entre [[ ]]
// en rojo con letra manuscrita. La usan la vista previa del profesor y el alumno.
function pintarCorreccion(txt, nota){
  let t=String(txt||'');
  const m=t.match(/NOTA:\s*([\d.,]+)\s*\/\s*10/i);
  if(m) t=t.replace(m[0],'').trim();
  let html=escHtml(t).replace(/\[\[([\s\S]*?)\]\]/g,'<span class="ia-corr">$1</span>');
  if(nota!=null&&nota!==''&&!isNaN(nota)) html+=`<span class="ia-nota">${nota}/10</span>`;
  return html;
}
function crNotaIA(){
  const t=(($('cr-ia-out')||{}).value||'');
  const m=t.match(/NOTA:\s*([\d.,]+)\s*\/\s*10/i);
  if(!m) return null;
  const n=parseFloat(String(m[1]).replace(',','.'));
  return isNaN(n)?null:n;
}
function crPreview(){
  const out=$('cr-ia-out'); const box=$('cr-ia-prev'); if(!out||!box) return;
  let t=out.value||'';
  const m=t.match(/NOTA:\s*([\d.,]+)\s*\/\s*10/i);
  if(m) t=t.replace(m[0],'').trim();
  // La nota grande en rojo es SIEMPRE la del profesor, no la de la IA.
  const campo=$('cr-ia-notaprof');
  const nv=campo?String(campo.value).replace(',','.').trim():'';
  const nota=nv===''?null:parseFloat(nv);
  const html=pintarCorreccion(out.value||'', nota);
  box.innerHTML=(String(t).trim()?html:'')||'<i style="color:var(--ink-soft)">Pega aquí arriba lo que te devuelva la IA y lo verás corregido.</i>';
  const n=$('cr-ia-nota'); const ia=crNotaIA();
  if(n) n.textContent = ia!=null ? ('La IA propone: '+ia+'/10 — decides tú') : '';
}
function crUsarNotaIA(){
  const ia=crNotaIA();
  if(ia==null){ appAlert('No encuentro ninguna línea "NOTA: X/10" en lo que ha devuelto la IA.'); return; }
  const c=$('cr-ia-notaprof'); if(c){ c.value=ia; crPreview(); }
}
function crPasarANota(){
  const out=(($('cr-ia-out')||{}).value||'').trim();
  if(!out){ appAlert('Primero pega la corrección que te devuelva la IA.'); return; }
  const m=out.match(/NOTA:\s*([\d.,]+)\s*\/\s*10/i);
  let com=out; if(m) com=com.replace(m[0],'').trim();
  // Los [[ ]] se conservan: el alumno los verá en rojo y a mano, igual que aquí.
  const nv=(($('cr-ia-notaprof')||{}).value||'').replace(',','.').trim();
  crTab='manual'; renderEntrega(crEnt);
  if(nv!==''&&$('cr-nota')) $('cr-nota').value=nv;
  if($('cr-com')) $('cr-com').value=com;
  appAlert('Pasado a la pestaña Manual. Revísalo antes de guardar.');
}
function crTabIA(e){
  return `<div class="t-card">
    <label style="margin-top:6px">Criterios de corrección (lo que le dirías tú a la IA)</label>
    <textarea id="cr-crit" rows="3" placeholder="Ej.: valora contenido sobre forma; cada pregunta vale 2,5 puntos; penaliza las faltas de ortografía hasta 1 punto…"></textarea>
    <p style="font-size:.72rem;color:var(--ink-soft);margin:8px 0 10px;line-height:1.5">Copia el prompt, ábrelo en Claude o Gemini, <b>adjunta ahí el PDF del examen resuelto</b> y pega el prompt. Después trae la respuesta aquí abajo.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="gx-mini" onclick="crCopiarPrompt()" style="flex:1;padding:10px">📋 Copiar prompt</button>
      <button class="gx-mini" onclick="crCompartirPrompt()" style="flex:1;padding:10px">📤 Compartir</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
      <a href="https://claude.ai/new" target="_blank" rel="noopener" class="gx-mini" style="flex:1;padding:10px;text-align:center;text-decoration:none;line-height:1.6">Abrir Claude ↗</a>
      <a href="https://gemini.google.com/app" target="_blank" rel="noopener" class="gx-mini" style="flex:1;padding:10px;text-align:center;text-decoration:none;line-height:1.6">Abrir Gemini ↗</a>
    </div>
    <label style="margin-top:16px">Pega aquí la corrección de la IA</label>
    <textarea id="cr-ia-out" rows="7" placeholder="El texto del alumno con las correcciones entre [[ ]] y la última línea NOTA: X/10"></textarea>
    <div id="cr-ia-nota" style="font-size:.75rem;color:var(--ink-soft);text-align:right;margin-top:-2px"></div>
    <label style="margin-top:10px">Nota final — la pones TÚ (0 a 10)</label>
    <div style="display:flex;gap:8px;align-items:center">
      <input id="cr-ia-notaprof" type="number" min="0" max="10" step="0.1" inputmode="decimal" placeholder="Ej.: 7.5" style="flex:1" value="${e.nota!=null?(+e.nota):''}">
      <button class="gx-mini" onclick="crUsarNotaIA()" style="padding:10px;white-space:nowrap">Usar la de la IA</button>
    </div>
    <label style="margin-top:10px">Cómo lo verá el alumno</label>
    <div id="cr-ia-prev" class="ia-prev"></div>
    <button class="btn btn-honey" onclick="crPasarANota()" style="margin-top:16px">Pasar a nota y comentario →</button>
    <p style="font-size:.72rem;color:var(--ink-soft);margin:10px 0 0;line-height:1.5">La nota grande en rojo es la tuya, no la de la IA. La IA solo propone. Nada se guarda desde aquí.</p>
  </div>`;
}
function renderEntrega(e){
  crEnt=e;
  const resp=Array.isArray(e.respuestas)?e.respuestas:[];
  const h=[`<button class="backbtn" onclick="openCorrecciones()">← Correcciones</button>`];
  h.push(`<h1 style="font-size:1.18rem;font-weight:800;letter-spacing:-.3px;margin:6px 0 2px;color:var(--navy)">${escHtml(e.nombre||e.alumno)}</h1>`);
  h.push(`<p style="font-size:.8rem;color:var(--ink-soft);margin-bottom:16px">${escHtml(e.examen)} · ${fmtFecha(e.creado_en)} · ${e.estado==='corregido'?'Ya corregido':'Pendiente'}</p>`);
  resp.forEach((r,i)=>{
    const txt=(r.texto||'').trim();
    h.push(`<div class="red-q"><div class="rq-num">Pregunta ${i+1}</div><div class="rq-txt">${escHtml(r.enunciado||'')}</div><div class="ans-box">${txt?escHtml(txt):'<i style="color:var(--ink-soft)">(sin respuesta)</i>'}</div></div>`);
  });
  h.push(`<div class="t-toggle" style="margin:18px 0 12px">
    <button class="${crTab==='manual'?'on':''}" onclick="crSetTab('manual')">✍️ Corrección manual</button>
    <button class="${crTab==='ia'?'on':''}" onclick="crSetTab('ia')">🤖 Corrección con IA</button>
  </div>`);
  if(crTab==='ia'){ h.push(crTabIA(e)); }
  else{
    h.push(`<div class="t-card"><label style="margin-top:6px">Nota (0 a 10)</label><input id="cr-nota" type="number" min="0" max="10" step="0.1" inputmode="decimal" value="${e.nota!=null?(+e.nota):''}" placeholder="Ej.: 7.5"><label>Comentario para el alumno (opcional)</label><p style="font-size:.7rem;color:var(--ink-soft);margin:0 0 6px">Lo que escribas entre [[ dobles corchetes ]] el alumno lo verá en rojo y con letra manuscrita.</p><textarea id="cr-com" rows="6" placeholder="Observaciones, correcciones…">${escHtml(e.comentario||'')}</textarea><button class="btn btn-honey" id="cr-save" style="margin-top:16px">${e.estado==='corregido'?'Actualizar nota':'Guardar nota'}</button>${e.estado==='reabierto'?'':`<button class="btn btn-ghost" id="cr-reopen" style="margin-top:10px">↻ Permitir repetir al alumno</button>`}</div>`);
  }
  $('teacher').innerHTML=h.join('');
  if($('cr-save')) $('cr-save').onclick=()=>guardarNotaUI(e.id);
  if($('cr-reopen')) $('cr-reopen').onclick=()=>reabrirEntregaUI(e.id);
  if($('cr-ia-out')){ $('cr-ia-out').oninput=crPreview; }
  if($('cr-ia-notaprof')) $('cr-ia-notaprof').oninput=crPreview;
  if($('cr-ia-prev')) crPreview();
}
async function reabrirEntregaUI(id){
  if(!await appConfirm('¿Permitir que el alumno repita este examen? Se borrará la nota actual y podrá volver a entregar.')) return;
  try{
    await call('/rest/v1/rpc/reabrir_entrega',{method:'POST',body:{p_id:id}});
    openCorrecciones('↻ Examen reabierto. El alumno ya puede repetirlo.');
  }catch(err){ appAlert('No se pudo reabrir: '+(err.message||'')); }
}
async function guardarNotaUI(id){
  const nv=$('cr-nota').value; const com=$('cr-com').value;
  const nota=parseFloat(String(nv).replace(',','.'));
  if(isNaN(nota)||nota<0||nota>10){ appAlert('Escribe una nota entre 0 y 10.'); return; }
  const btn=$('cr-save'); btn.disabled=true; btn.innerHTML='<span class="spin"></span>';
  try{
    await call('/rest/v1/rpc/corregir_entrega',{method:'POST',body:{p_id:id, p_nota:nota, p_comentario:com||null}});
    openCorrecciones('✅ Nota guardada. El alumno ya puede verla.');
  }catch(err){ btn.disabled=false; btn.textContent='Guardar nota'; appAlert('No se pudo guardar: '+(err.message||'')); }
}

function openAlumnos(okMsg){ showView('teacher'); window.scrollTo(0,0); renderAlumnosShell(okMsg); }
function setAlumnosTab(t){ alumnosTab=t; openAlumnos(); }
function alumnosHeader(){
  return `<button class="backbtn" onclick="pintarTeacher()">← Panel</button>
    <h1 style="font-size:1.25rem;font-weight:800;letter-spacing:-.4px;margin:6px 0 8px;color:var(--navy)">Alumnos</h1>
    <div class="t-toggle" style="margin-bottom:14px">
      <button class="${alumnosTab==='listado'?'on':''}" onclick="setAlumnosTab('listado')">Listado y notas</button>
      <button class="${alumnosTab==='reg'?'on':''}" onclick="setAlumnosTab('reg')">Registrados</button>
      <button class="${alumnosTab==='auth'?'on':''}" onclick="setAlumnosTab('auth')">Autorización</button>
    </div>`;
}
async function renderAlumnosShell(okMsg){
  if(alumnosTab==='reg'){
    $('teacher').innerHTML=alumnosHeader()+'<div class="loader"><span class="spin"></span></div>';
    let rows=[], err=null;
    try{ rows=await call('/rest/v1/rpc/listar_registrados',{method:'POST',body:impProf({})})||[]; }
    catch(e){ err=e.message; }
    $('teacher').innerHTML=alumnosHeader()+regBody(rows,err,okMsg);
    $('teacher').querySelectorAll('[data-revoke]').forEach(b=> b.onclick=()=>eliminarInvitacionUI(b.dataset.revoke));
    $('teacher').querySelectorAll('[data-reauth]').forEach(b=> b.onclick=()=>reautorizarAlumnoUI(b.dataset.reauth,b.dataset.nombre));
    $('teacher').querySelectorAll('[data-borrar]').forEach(b=> b.onclick=()=>borrarCuentaUI(b.dataset.borrar, b.dataset.email));
    $('teacher').querySelectorAll('[data-pass]').forEach(b=> b.onclick=()=>resetPassAlumnoUI(b.dataset.pass, b.dataset.email));
    return;
  }
  if(alumnosTab==='auth'){
    $('teacher').innerHTML=alumnosHeader()+'<div class="loader"><span class="spin"></span></div>';
    let rows=[], err=null;
    try{ rows=await call('/rest/v1/rpc/listar_invitaciones',{method:'POST',body:impProf({p_certificado_id:certBD()})})||[]; }
    catch(e){ err=e.message; }
    $('teacher').innerHTML=alumnosHeader()+authBody(rows,err,okMsg);
    const ab=$('al-btn'); if(ab) ab.onclick=invitarAlumnoUI;
    $('teacher').querySelectorAll('[data-del]').forEach(b=> b.onclick=()=>eliminarInvitacionUI(b.dataset.del));
  }else{
    $('teacher').innerHTML=alumnosHeader()+listadoBody(okMsg);
    $('teacher').querySelectorAll('.al-row[data-al]').forEach(b=> b.onclick=()=>openAlumnoDetalle(b.dataset.al));
  }
}
function authBody(rows,errMsg,okMsg){
  const h=[];
  h.push(`<p style="font-size:.8rem;color:var(--ink-soft);margin-bottom:14px">Autoriza el correo de cada alumno. Solo podrá registrarse e iniciar sesión si su correo está en esta lista.</p>`);
  if(okMsg) h.push(`<div class="t-note ok">${escHtml(okMsg)}</div>`);
  if(errMsg) h.push(`<div class="t-note err">${escHtml(errMsg)}</div>`);
  h.push(`<div class="t-card">
      <label style="margin-top:6px">Correo del alumno</label>
      <input id="al-email" type="email" inputmode="email" placeholder="alumno@correo.com">
      <label>Nombre (opcional)</label>
      <input id="al-nombre" type="text" placeholder="Nombre y apellidos">
      <button class="btn btn-honey" id="al-btn" style="margin-top:16px">Autorizar alumno</button>
    </div>`);
  h.push(`<h2 style="font-size:.78rem;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:1px;margin:18px 2px 12px">Autorizados (${rows.length})</h2>`);
  if(!rows.length){ h.push(`<div class="center-msg" style="padding:18px">Aún no has autorizado a nadie.</div>`); }
  else rows.forEach(r=>{ const reg=r.registrado; h.push(`<div class="ce-row"><span class="ce-info"><b>${escHtml(r.nombre||r.email)}</b><span>${escHtml(r.email)} · <span style="color:${reg?'var(--ok)':'var(--ink-soft)'};font-weight:700">${reg?'Registrado':'Pendiente'}</span></span></span><button class="ce-del" data-del="${escAttr(r.email)}" aria-label="Quitar">🗑</button></div>`); });
  return h.join('');
}
function listadoBody(okMsg){
  // Filtro por unidad (mismo comportamiento que la ficha del alumno)
  const unidadesAll=unidadesDeIntentos(teacherRows);
  if(teacherUnidadSel && !unidadesAll.includes(teacherUnidadSel)) teacherUnidadSel=null;
  const uSel=teacherUnidadSel; // null = todas

  let alum;
  if(uSel){
    // Con unidad seleccionada, las medias se calculan en frontend con el
    // criterio unificado (mejor intento por examen, fantasmas excluidos).
    const porAlumno={};
    teacherRows.forEach(r=>{
      const e=(r.alumno_email||r.alumno||'').toLowerCase(); if(!e) return;
      (porAlumno[e]=porAlumno[e]||{email:e,nombre:r._nombre||null,rows:[]}).rows.push(r);
      if(r._nombre) porAlumno[e].nombre=r._nombre;
    });
    alum=Object.values(porAlumno).map(a=>{
      const mcv=mediaPorUnidad(a.rows,uSel);
      const mfv=mediaFinalPorUnidad(a.rows,uSel);
      const ni=a.rows.filter(r=>r.unidad===uSel && !esIntentoFantasma(r)).length;
      return {alumno:a.email,nombre:a.nombre,media_clase:mcv,media_final:mfv,media_todos:mediaTodosIntentos(a.rows,uSel),intentos:ni};
    }).filter(a=>a.intentos>0);
  }
  else{
    // "Todas": medias calculadas en cliente desde teacherRows con el criterio
    // unificado (igual que la ficha del alumno y que lo que ve el propio alumno).
    // Así el profesor y el alumno ven lo mismo, y al borrar un examen que contaba
    // para la nota final deja de sumar al instante (ya no está en examsByUnit).
    const porAlumno={};
    teacherRows.forEach(r=>{
      const e=(r.alumno_email||r.alumno||'').toLowerCase(); if(!e) return;
      (porAlumno[e]=porAlumno[e]||{email:e,nombre:r._nombre||null,rows:[]}).rows.push(r);
      if(r._nombre) porAlumno[e].nombre=r._nombre;
    });
    alum=Object.values(porAlumno).map(a=>({
      alumno:a.email, nombre:a.nombre,
      media_clase:mediaPorUnidad(a.rows,null),
      media_final:mediaFinalPorUnidad(a.rows,null),
      media_todos:mediaTodosIntentos(a.rows,null),
      intentos:a.rows.filter(r=>!esIntentoFantasma(r)).length
    })).filter(a=>a.intentos>0);
  }

  // Orden por la métrica elegida (mejor→peor); empates, por nombre.
  const _keyOf=(a)=> teacherSortBy==='todos' ? a.media_todos : teacherSortBy==='final' ? a.media_final : a.media_clase;
  alum.sort((a,b)=>{
    const na=(_keyOf(a)!=null)?+_keyOf(a):-1, nb=(_keyOf(b)!=null)?+_keyOf(b):-1;
    if(nb!==na) return nb-na;
    return (a.nombre||a.alumno||'').localeCompare(b.nombre||b.alumno||'','es');
  });

  const h=[];
  if(okMsg) h.push(`<div class="t-note ok">${escHtml(okMsg)}</div>`);
  h.push(`<div class="dl-row">
    <button class="btn btn-ghost" onclick="pdfNotasGeneral()">⬇ PDF de notas</button>
    <button class="btn btn-ghost" onclick="exportNotasCSV()">⬇ CSV (Excel)</button>
  </div>`);
  if(!alum.length && !uSel){ h.push(`<div class="center-msg">Aún no hay alumnos.</div>`); return h.join(''); }
  // Chips de unidad (como en la ficha del alumno)
  if(unidadesAll.length>1){
    h.push(`<div class="unit-filter">
      <button class="uf-chip${!uSel?' on':''}" onclick="setAlumnosUnidad('')">Todas</button>
      ${unidadesAll.map(u=>`<button class="uf-chip${uSel===u?' on':''}" onclick="setAlumnosUnidad('${u}')">${escHtml(codigoUnidad(u))}</button>`).join('')}
    </div>`);
  }
  if(!alum.length){ h.push(`<div class="center-msg">Ningún alumno tiene intentos en esta unidad todavía.</div>`); return h.join(''); }
  h.push(`<div class="al-sort"><label>Ordenar por</label>
    <select onchange="setAlumnosSort(this.value)">
      <option value="mejor"${teacherSortBy==='mejor'?' selected':''}>Media exámenes con mejor nota</option>
      <option value="todos"${teacherSortBy==='todos'?' selected':''}>Media con todos los intentos</option>
      <option value="final"${teacherSortBy==='final'?' selected':''}>Media de exámenes oficiales</option>
    </select></div>`);
  alum.forEach((a,i)=>{
    const email=(a.alumno||'').toLowerCase().trim();
    const mc=(a.media_clase!=null)?(+a.media_clase).toFixed(1):'—';
    const mf=(a.media_final!=null)?(+a.media_final).toFixed(1):'—';
    const mt=(a.media_todos!=null)?(+a.media_todos).toFixed(1):'—';
    const nombre=a.nombre || email;
    const ni=a.intentos||0;
    // Medalla para el top 3 (solo si tienen nota)
    let pos='';
    if(_keyOf(a)!=null){
      if(i===0) pos='🥇 '; else if(i===1) pos='🥈 '; else if(i===2) pos='🥉 ';
    }
    h.push(`<button class="al-row" data-al="${escAttr(email)}"><span class="al-info"><b>${pos}${escHtml(nombre)}</b><span>${ni} intento${ni!==1?'s':''}</span></span><span class="al-grades"><span class="al-g"><i>½ Mejor int.</i><b>${mc}</b></span><span class="al-g"><i>½ todos int.</i><b>${mt}</b></span><span class="al-g"><i>½ Ex. Final</i><b>${mf}</b></span></span><span class="arrow">›</span></button>`);
  });
  return h.join('');
}
function setAlumnosUnidad(u){ teacherUnidadSel=u||null; openAlumnos(); }
function setAlumnosSort(v){ teacherSortBy=v||'mejor'; openAlumnos(); }
async function invitarAlumnoUI(){
  const email=($('al-email').value||'').trim(), nombre=($('al-nombre').value||'').trim();
  if(!email||email.indexOf('@')<1){ appAlert('Escribe un correo válido.'); return; }
  const btn=$('al-btn'); btn.disabled=true; btn.innerHTML='<span class="spin"></span>';
  try{
    await call('/rest/v1/rpc/invitar_alumno',{method:'POST',body:impProf({p_email:email,p_nombre:nombre||null,p_certificado_id:certBD()})});
    await openAlumnos('Alumno autorizado: '+email);
  }catch(err){ btn.disabled=false; btn.textContent='Autorizar alumno'; appAlert('No se pudo: '+(err.message||'')); }
}
function regBody(rows,errMsg,okMsg){
  let h='';
  if(okMsg) h+=`<div class="t-note ok">${escHtml(okMsg)}</div>`;
  if(errMsg) h+=`<div class="t-note err">No se pudo cargar: ${escHtml(errMsg)}</div>`;
  const n=rows.length, sinAut=rows.filter(r=>!r.autorizado).length;
  h+=`<p style="font-size:.82rem;color:var(--ink-soft);margin:0 0 12px;line-height:1.5">Alumnos: <b>${n}</b>.${sinAut?` <span style="color:#b4232a;font-weight:700">${sinAut} sin autorizar</span> (posibles errores).`:''}</p>`;
  if(!n){ h+=`<p style="font-size:.85rem;color:var(--ink-soft)">Aún no hay alumnos registrados.</p>`; return h; }
  rows.forEach(r=>{
    const badge = r.autorizado
      ? `<span class="reg-tag ok">Autorizado</span>`
      : `<span class="reg-tag warn">⚠️ Sin autorizar</span>`;
    const act = r.con_actividad ? `<span class="reg-tag act">Con actividad</span>` : `<span class="reg-tag none">Sin actividad</span>`;
    const nombre = r.nombre && r.nombre!==r.email ? escHtml(r.nombre) : '';
    h+=`<div class="reg-row">
      <div class="reg-info">
        ${nombre?`<b>${nombre}</b>`:''}
        <span class="reg-mail">${escHtml(r.email)}</span>
        <span class="reg-badges">${badge}${act}</span>
      </div>
      <div class="reg-actions">
        <button class="reg-pass" data-pass="${r.id}" data-email="${escHtml(r.email)}">🔑 Nueva contraseña</button>
        ${r.autorizado
          ? `<button class="reg-revoke" data-revoke="${escHtml(r.email)}">Revocar acceso</button>`
          : `<button class="reg-reauth" data-reauth="${escHtml(r.email)}" data-nombre="${escHtml(r.nombre||'')}">Autorizar de nuevo</button>`}
        <button class="reg-del" data-borrar="${r.id}" data-email="${escHtml(r.email)}">Borrar cuenta</button>
      </div>
    </div>`;
  });
  return h;
}
async function resetPassAlumnoUI(userId,email){
  const nueva=await appPrompt('Nueva contraseña para '+email+'\n(mínimo 6 caracteres). Apúntala y dásela al alumno:');
  if(nueva===null) return;
  if(nueva.length<6){ appAlert('La contraseña debe tener al menos 6 caracteres.'); return; }
  try{
    await call('/rest/v1/rpc/resetear_password_alumno',{method:'POST',body:{p_user_id:userId,p_nueva:nueva}});
    await openAlumnos('✅ Contraseña de '+email+' cambiada. Nueva clave: '+nueva);
  }catch(err){ appAlert('No se pudo: '+(err.message||'')); }
}
async function borrarCuentaUI(userId,email){
  if(!await appConfirm('BORRADO DEFINITIVO de '+email+'.\n\nSe elimina la cuenta y TODAS sus notas e intentos. No se puede deshacer.\n\n¿Continuar?')) return;
  if(!await appConfirm('Confirma otra vez: se borra por completo '+email+'.')) return;
  try{
    await call('/rest/v1/rpc/borrar_alumno_registrado',{method:'POST',body:{p_user_id:userId}});
    window._nRegistrados=null;
    await openAlumnos('Cuenta borrada: '+email);
  }catch(err){ appAlert('No se pudo borrar: '+(err.message||'')); }
}
async function eliminarInvitacionUI(email){
  if(!await appConfirm('¿Quitar la autorización de '+email+'?\nSi ya se había registrado, dejará de tener acceso. Sus datos se conservan y podrás volver a autorizarlo cuando quieras.')) return;
  try{
    await call('/rest/v1/rpc/eliminar_invitacion',{method:'POST',body:impProf({p_email:email,p_certificado_id:certBD()})});
    await openAlumnos('Acceso revocado. Puedes volver a autorizarlo cuando quieras.');
  }catch(err){ appAlert('No se pudo: '+(err.message||'')); openAlumnos(); }
}
async function reautorizarAlumnoUI(email,nombre){
  if(!await appConfirm('¿Volver a autorizar a '+email+'?\nRecuperará el acceso con todos sus datos intactos.')) return;
  try{
    await call('/rest/v1/rpc/invitar_alumno',{method:'POST',body:impProf({p_email:email,p_nombre:nombre||null,p_certificado_id:certBD()})});
    await openAlumnos('Alumno autorizado de nuevo: '+email);
  }catch(err){ appAlert('No se pudo: '+(err.message||'')); openAlumnos(); }
}

// ---- Semáforo de estados (módulos / UF) ----
function openEstados(okMsg){
  showView('teacher'); window.scrollTo(0,0);
  const esAula = window._activeCertId==='__aula_abierta';
  const h=[`<button class="backbtn" onclick="pintarTeacher()">← Panel</button>`];
  h.push(`<h1 style="font-size:1.25rem;font-weight:800;letter-spacing:-.4px;margin:6px 0 2px;color:var(--navy)">${esAula?'Estados de materias':'Estados de módulos y UF'}</h1>`);
  h.push(`<p style="font-size:.8rem;color:var(--ink-soft);margin-bottom:14px"><b>Activo</b> y <b>Terminado</b> los ve el alumno y puede trabajar. <b>Próximamente</b> queda bloqueado: tú vas añadiendo material y se publica cuando lo actives.</p>`);
  if(okMsg) h.push(`<div class="t-note ok">${okMsg}</div>`);
  getModulos().forEach(m=>{
    const me=moduleEstado(m);
    h.push(`<div class="est-mod">${m.code} · ${m.title} <span class="chip state ${estCls(me)}" data-modchip="${m.id}">${estLabel(me)}</span></div>`);
    m.unidades.forEach(uid=>{
      const u=unidadesById[uid];
      const codigo = u ? u.codigo : uid.toUpperCase();
      const titulo = (u&&u.titulo) ? u.titulo : (UF_TITULOS[uid]||'');
      const est=unitEstado(uid);
      h.push(`<div class="est-row"><div class="est-name">${escHtml(codigo)}${titulo?' · '+escHtml(titulo):''}</div><div class="est-seg">${['activo','terminado','proximamente'].map(s=>`<button class="est-b ${s}${est===s?' on':''}" data-uid="${uid}" data-est="${s}">${estLabel(s)}</button>`).join('')}</div></div>`);
    });
  });
  $('teacher').innerHTML=h.join('');
  $('teacher').querySelectorAll('.est-b').forEach(b=> b.onclick=()=>setEstadoUI(b.dataset.uid,b.dataset.est));
}
async function setEstadoUI(uid, est){
  const prev=unitEstado(uid);
  if(prev===est) return;
  estadosLocales[uid]=est;
  if(unidadesById[uid]) unidadesById[uid].estado=est;
  // Actualizar SOLO los botones de esta unidad, sin re-render ni scroll
  pintarBotonesEstado(uid, est);
  try{ await call('/rest/v1/rpc/set_estado_unidad',{method:'POST',body:impProf({p_unidad:uid,p_estado:est,p_certificado_id:certBD()})}); }
  catch(err){ estadosLocales[uid]=prev; if(unidadesById[uid]) unidadesById[uid].estado=prev; pintarBotonesEstado(uid, prev); appAlert('No se pudo cambiar: '+(err.message||'')); }
}
// Marca como activo el botón correcto de la fila de una unidad (sin mover la pantalla)
function pintarBotonesEstado(uid, est){
  document.querySelectorAll(`.est-b[data-uid="${uid}"]`).forEach(b=>{
    b.classList.toggle('on', b.dataset.est===est);
  });
  // Refrescar el chip de estado del módulo que contiene esta UF
  const m=getModulos().find(mm=>mm.unidades.includes(uid));
  if(m){
    const chip=document.querySelector(`.chip[data-modchip="${m.id}"]`);
    if(chip){
      const me=moduleEstado(m);
      chip.className=`chip state ${estCls(me)}`;
      chip.setAttribute('data-modchip', m.id);
      chip.textContent=estLabel(me);
    }
  }
}

// ============ MÓDULO (lista de unidades) ============
// ── Títulos oficiales de las Unidades Formativas (BOE) ──
// Respaldo para UFs que no están en la tabla unidades de Supabase
// (todas las del 408 y los 8 certificados nuevos).
const UF_TITULOS = {
  // Aula Abierta
  'aula-materia-1':'Materia de ejemplo · Aula Abierta',
  // ADGG0508
  uf0510:'Procesadores de textos y presentaciones de información básicos',
  uf0511:'Tratamiento básico de datos y hojas de cálculo',
  uf0512:'Transmisión de información por medios convencionales e informáticos',
  // ADGG0408
  uf0517:'Organización empresarial y de recursos humanos',
  uf0518:'Gestión auxiliar de la correspondencia y de la paquetería en la empresa',
  uf0519:'Gestión auxiliar de documentación administrativa',
  uf0520:'Comunicación empresarial y atención al cliente',
  uf0521:'Gestión auxiliar de reuniones y eventos',
  uf0513:'Gestión auxiliar de archivo en soporte convencional o informático',
  uf0514:'Gestión auxiliar de reproducción en soporte convencional o informático',
  // ADGD0210
  uf1818:'Actitud emprendedora y oportunidades de negocio',
  uf1819:'Proyecto empresarial y de autoempleo',
  uf1820:'Viabilidad de la microempresa',
  uf1821:'Planificación estratégica y gestión comercial',
  uf1822:'Gestión de la actividad diaria y calidad en la microempresa',
  uf1823:'Marketing y promoción en la microempresa',
  uf1824:'Técnicas de venta en la microempresa',
  uf1825:'Gestión administrativa de la microempresa',
  uf1826:'Gestión financiera y presupuestaria de la microempresa',
  // COMT0112
  uf2381:'Gestión de la venta en el pequeño comercio',
  uf2382:'Atención al cliente en el pequeño comercio',
  uf2383:'Animación del punto de venta en el pequeño comercio',
  uf2384:'Gestión de stock y almacén en el pequeño comercio',
  // COMV0108
  uf0030:'Organización de procesos de venta',
  uf0031:'Técnicas de venta',
  uf0032:'Venta online',
  uf0033:'Aprovisionamiento y almacenaje en la venta',
  uf0034:'Animación y presentación del producto en el punto de venta',
  uf0035:'Servicio postventa y gestión de reclamaciones',
  uf0036:'Atención al cliente en la venta',
  // IFCT0109
  uf1344:'Introducción a la seguridad informática y análisis de riesgos',
  uf1345:'Políticas de seguridad y buenas prácticas',
  uf1346:'Configuración y administración de cortafuegos y VPNs',
  uf1347:'Sistemas de detección de intrusos y seguridad perimetral',
  uf1348:'Normativa legal y auditoría de seguridad',
  uf1349:'Estándares de gestión de la seguridad de la información (ISO 27001)',
  uf1350:'Gestión y respuesta ante incidentes de seguridad',
  // IFCD0110
  uf1302:'Creación de páginas web con lenguajes de marcas (HTML5/CSS3)',
  uf1303:'Estilos y maquetación web avanzada',
  uf1304:'Accesibilidad y usabilidad web',
  uf1305:'Programación del lado del cliente (JavaScript básico)',
  uf1306:'Integración de contenido multimedia y efectos visuales',
  uf1307:'Servidores web y publicación de sitios',
  uf1308:'Posicionamiento web y analítica básica (SEO)',
  // SSCS0208
  uf0127:'Apoyo en la recepción y acogida en instituciones de personas dependientes',
  uf0128:'Apoyo en la organización de actividades para personas dependientes',
  uf0129:'Animación social para personas dependientes en instituciones',
  uf0130:'Mantenimiento y mejora de las capacidades cognitivas en instituciones',
  uf0131:'Técnicas de comunicación con personas dependientes en instituciones',
  // HOTR0208
  uf0053:'Aplicación de normas y condiciones higiénico-sanitarias en restauración',
  uf0054:'Uso de la dotación básica del restaurante y asistencia en el preservicio',
  uf0055:'Servicio de alimentos y bebidas en el restaurante y bar',
  uf0058:'Aprovisionamiento y almacenaje de alimentos y bebidas en el bar',
  uf0059:'Preparación y servicio de bebidas y comidas rápidas en el bar',
  uf0060:'Gestión y control de la actividad en el bar',
  // SANT0108
  uf0677:'Soporte vital básico y atención inicial en emergencias',
  uf0678:'Apoyo al soporte vital avanzado en transporte sanitario',
  uf0679:'Acondicionamiento del vehículo y traslado del paciente',
  uf0680:'Logística y comunicaciones en emergencias sanitarias',
  // ADGD0308
  uf0522:'Gestión operativa de tesorería',
  uf0523:'Registro y contratación de operaciones de tesorería',
  uf0524:'Gestión administrativa del personal',
  uf0525:'Gestión administrativa de la contratación y cese de la relación laboral',
  uf0526:'Mantenimiento y actualización de los registros contables',
  uf0527:'Elaboración y archivo de la documentación contable',
  // ADGD0208
  uf0341:'Contratación laboral',
  uf0342:'Cálculo de retribuciones, cotizaciones y retenciones',
  uf0343:'Tramitación de bajas y otras incidencias de personal',
  uf0344:'Aplicaciones informáticas de gestión de recursos humanos',
  uf0345:'Apoyo administrativo a los procesos de selección y formación',
  uf0346:'Evaluación del desempeño del puesto de trabajo',
  // COMT0411
  uf2392:'Plan de marketing digital y comercio electrónico',
  uf2393:'Diseño y desarrollo de la tienda online',
  uf2394:'Logística y medios de pago en el comercio electrónico',
  uf2395:'Publicidad online y analítica web',
  uf2396:'Atención al cliente y fidelización en la venta en red',
  // COML0110
  uf0431:'Recepción y colocación de mercancías en el almacén',
  uf0432:'Control de inventarios y sistemas de etiquetado',
  uf0433:'Operaciones de picking y embalaje de mercancías',
  uf0434:'Conducción segura y mantenimiento de carretillas',
  // IFCT0209
  uf0852:'Componentes físicos y lógicos de sistemas microinformáticos',
  uf0853:'Instalación y actualización de sistemas operativos',
  uf0854:'Arquitectura y componentes de redes locales',
  uf0855:'Configuración y verificación de redes locales',
  uf0856:'Paquetes ofimáticos y herramientas de productividad',
  uf0857:'Configuración de aplicaciones de correo y seguridad',
  uf0858:'Diagnóstico de averías en hardware',
  uf0859:'Reparación y sustitución de bloques funcionales',
  uf0860:'Puesta en marcha y mantenimiento preventivo de equipos',
  // IFCD0210
  uf1841:'Arquitectura web y diseño de interfaces',
  uf1842:'Desarrollo de componentes con JavaScript',
  uf1843:'Frameworks de desarrollo del lado del cliente',
  uf1844:'Lenguajes de script del lado del servidor',
  uf1845:'Acceso a bases de datos y persistencia web',
  uf1846:'Seguridad y servicios web en el servidor',
  uf1847:'Servidores de aplicaciones y despliegue',
  uf1848:'Control de versiones y pruebas de software',
  uf1849:'Optimización y analítica del rendimiento web',
  // SSCS0108
  uf0119:'Características y necesidades de atención higiénico-sanitaria',
  uf0120:'Administración de alimentos y tratamientos en el domicilio',
  uf0121:'Técnicas de movilización, traslado y deambulación',
  uf0122:'Animación social y mantenimiento de la autonomía',
  uf0123:'Técnicas de comunicación y relación social en el domicilio',
  uf0124:'Psicología aplicada a la atención domiciliaria',
  uf0125:'Gestión y mantenimiento de las estancias de la vivienda',
  uf0126:'Técnicas de cocina y plan de alimentación familiar',
  // SSCE0110
  uf1645:'Impartición de sesiones formativas presenciales',
  uf1646:'Tutorización de acciones formativas online',
  // HOTR0408
  uf0063:'Definición y diseño de cartas y menús',
  uf0064:'Gestión de compras y economato de cocina',
  uf0065:'Control de consumos y costes culinarios',
  uf0066:'Técnicas de limpieza y corte de carnes y aves',
  uf0067:'Manipulación y corte de pescados y mariscos',
  uf0068:'Preparación de verduras y hortalizas básicas',
  uf0069:'Sistemas de conservación y envasado en cocina',
  uf0070:'Cocinados básicos y fondos de cocina',
  uf0071:'Platos tradicionales y cocina regional',
  uf0072:'Repostería y postres elementales de restaurante',
  uf0073:'Decoración y presentación de platos de alta cocina',
  uf0074:'Dirección y organización del equipo de cocina',
  // TMVG0209
  uf1111:'Diagnóstico de baterías y alternadores',
  uf1112:'Mantenimiento del motor de arranque y cableado de fuerza',
  uf1113:'Redes de alumbrado, señalización y cuadros de instrumentos',
  uf1114:'Diagnosis de redes de multiplexado y can-bus en automoción',
  uf1115:'Configuración de sistemas de climatización y confort',
  uf1116:'Reparación de sistemas de seguridad activa ABS/ESP y airbags',
};

function openModule(modId){
  const m=getModulos().find(x=>x.id===modId); current.module=m;
  // Si el módulo solo tiene una unidad, vamos directos a sus exámenes:
  // no tiene sentido una pantalla intermedia para elegir entre una sola opción.
  if(m.unidades.length===1){ openUnit(m.unidades[0]); return; }
  showView('module'); window.scrollTo(0,0);
  const backFn = isStaff() ? 'openModulosTeacher()' : 'goHome()';
  let html=`<button class="backbtn" onclick="${backFn}">← Certificado</button>
    <div class="modtitle" style="margin-top:6px">${m.code} · ${m.title}</div>
    <div class="section">`;
  const HORAS={uf0510:60,uf0511:50,uf0512:40,uf0513:60,uf0514:60,mf0973:90};
  m.unidades.forEach(uid=>{
    const u=unidadesById[uid];
    const n=(examsByUnit[uid]||[]).length;
    const codigo=u?u.codigo:uid.toUpperCase();
    // Título: primero la BD (508), si no el diccionario oficial, si no vacío
    const titulo=(u&&u.titulo)?u.titulo:(UF_TITULOS[uid]||'');
    const est=unitEstado(uid);
    const h=HORAS[uid];
    const hPref=h?`${h} horas · `:'';
    const blockedSoon = (est==='proximamente' && !isStaff());
    const exTxt = blockedSoon ? 'Próximamente' : (n>0 ? `${n} ${n===1?'examen':'exámenes'}` : 'Sin exámenes todavía');
    const hint = (isStaff() && est==='proximamente') ? ' · oculto para alumnos' : '';
    const codewrap = `<span class="codewrap"><span class="code">${codigo}</span><span class="ustate u-${est}">${estLabel(est)}</span></span>`;
    const inner = `${codewrap}<span class="meta"><span class="t">${titulo||codigo}</span><span class="s">${hPref}${exTxt}${hint}</span></span>`;
    const soonCls = blockedSoon ? ' soon' : '';
    html+=`<button class="unit st-${est}${soonCls}" data-unit="${uid}">${inner}<span class="arrow">›</span></button>`;
  });
  html+=`</div>`;
  $('module').innerHTML=html;
  document.querySelectorAll('.unit[data-unit]').forEach(b=> b.onclick=()=>openUnit(b.dataset.unit));
}

// ============ UNIDAD (lista de exámenes) ============
// Calcula media y nº de alumnos distintos para un examen a partir de teacherRows
// r.examen contiene el TÍTULO del examen; examId es el id de Supabase
// Buscamos el título correspondiente al examId para hacer el cruce correcto
function getTituloExamen(examId){
  const all=[].concat(...Object.values(examsByUnit));
  const ex=all.find(e=>String(e.id)===String(examId));
  return ex?ex.titulo:null;
}
function statsExamen(examId){
  const all=[].concat(...Object.values(examsByUnit));
  const ex=all.find(e=>String(e.id)===String(examId))||{};
  const titulo=ex.titulo||null, uni=ex.unidad||null;
  const rows=teacherRows.filter(r=>{
    // Prioridad: casar por ID de examen si el RPC lo aporta.
    if(r.examen_id!=null && r.examen_id!=='') return String(r.examen_id)===String(examId);
    // Respaldo por título, SIEMPRE acotado a la misma unidad: "Examen 1"
    // existe en varias unidades y sin este filtro se cruzan los intentos.
    return titulo && r.examen===titulo && (!uni || r.unidad===uni);
  });
  if(!rows.length) return null;
  const alumnos=new Set(rows.map(r=>r.alumno_email||r.alumno));
  const suma=rows.reduce((s,r)=>s+(r.total>0?r.correctas/r.total*100:0),0);
  const media=Math.round(suma/rows.length);
  const total=rows[0]?rows[0].total:0;
  return {media, alumnos:alumnos.size, intentos:rows.length, total};
}


let alumnoResumenMode = 'best';

function openMisResultados(unitId, head){
  showView('unit'); window.scrollTo(0,0);
  window._alumnoHead = head;
  const u = unidadesById[unitId];
  const exsUF = (examsByUnit[unitId]||[]).filter(e=>e.publicado)
                  .sort(_cmpEx);

  // Intentos del alumno para esta UF (de memoria, ya cargados al login)
  const misExams = exsUF.map(e=>({ex:e, a:attemptsByExam[e.id]||null}))
                         .filter(x=>x.a && x.a.count>0);

  // Medias (mismo criterio que el resto de la plataforma):
  // Media = promedio de la nota del mejor intento de cada examen realizado.
  // Media final = igual, pero solo con los exámenes que cuentan para la nota.
  let mSum=0, mN=0, fSum=0, fN=0;
  misExams.forEach(({ex,a})=>{
    if(!a.total) return;
    mSum += a.mejor/a.total; mN++;
    if(ex.cuenta_final){ fSum += a.mejor/a.total; fN++; }
  });
  const mc = mN>0 ? ((mSum/mN)*10).toFixed(1) : '—';
  const mf = fN>0 ? ((fSum/fN)*10).toFixed(1) : '—';

  const uid = unitId.replace(/'/g,"\\'");
  const codU = u?u.codigo:unitId.toUpperCase();
  let html = head;
  html += `<div class="al-cards">
    <div class="al-card"><span>Media · ${escHtml(codU)}</span><b>${mc}</b></div>
    <div class="al-card"><span>Media final</span><b>${mf}</b></div>
  </div>
  <button class="btn btn-ghost" style="margin-bottom:12px" onclick="pdfNotasAlumno('${userEmail}')">⬇ Descargar PDF de notas</button>
  <div class="t-toggle">
    <button class="${alumnoResumenMode==='best'?'on':''}" onclick="alumnoResumenMode='best';openMisResultados('${uid}',_alumnoHead)">Mejor por examen</button>
    <button class="${alumnoResumenMode==='all'?'on':''}" onclick="alumnoResumenMode='all';openMisResultados('${uid}',_alumnoHead)">Todos los intentos</button>
  </div>`;

  if(!misExams.length){
    html += `<div class="center-msg">Aún no has realizado ningún examen de esta unidad.</div>`;
    $('unit').innerHTML = html;
    return;
  }

  if(alumnoResumenMode==='all'){
    // Cargar todos los intentos del servidor para esta UF
    html += `<div id="all-int-ph"><div class="loader"><span class="spin"></span></div></div>`;
    $('unit').innerHTML = html;
    const ids = exsUF.map(e=>e.id).join(',');
    call(`/rest/v1/intentos?examen_id=in.(${ids})&select=id,examen_id,correctas,total,creado_en&order=creado_en.desc`)
      .then(rows=>{
        let rh='';
        (rows||[]).forEach(r=>{
          const ex=exsUF.find(e=>e.id===r.examen_id)||{};
          const ufCod=u?u.codigo:unitId.toUpperCase();
          const label=(ufCod?ufCod+' · ':''+(ex.titulo||'Examen'));
          const pct=r.total?Math.round(r.correctas/r.total*100):0;
          const fakeR={...r, porcentaje:pct, apto:r.total>0&&r.correctas/r.total>=0.5};
          rh+=tRow(fakeR,label,fmtShort(new Date(r.creado_en)));
        });
        const ph=$('unit').querySelector('#all-int-ph');
        if(ph) ph.outerHTML=rh||'<div class="center-msg">Sin intentos registrados.</div>';
        $('unit').querySelectorAll('.t-row[data-int]').forEach(b=>{b.onclick=()=>abrirIntentoAlumno(b.dataset.int,unitId);});
      }).catch(()=>{ const ph=$('unit').querySelector('#all-int-ph'); if(ph) ph.outerHTML='<div class="center-msg">No se pudieron cargar.</div>'; });
  } else {
    // Mejor por examen: datos en memoria
    misExams.forEach(({ex,a})=>{
      const ufCod=u?u.codigo:unitId.toUpperCase();
      const label=(ufCod?ufCod+' · ':''+(ex.titulo||'Examen'));
      const pct=a.total?Math.round(a.mejor/a.total*100):0;
      const sub=`${a.count} ${a.count===1?'intento':'intentos'}${a.creado_en?' · último '+fmtShort(new Date(a.creado_en)):''}`;
      const fakeR={id:a.id, examen_id:ex.id, correctas:a.mejor, total:a.total, porcentaje:pct, apto:a.total>0&&a.mejor/a.total>=0.5};
      html+=tRow(fakeR,label,sub);
    });
    $('unit').innerHTML=html;
    $('unit').querySelectorAll('.t-row[data-int]').forEach(b=>{b.onclick=()=>abrirIntentoAlumno(b.dataset.int,unitId);});
  }
}

function verIntentoAlumno(examId, unitId){
  const at=attemptsByExam[examId];
  const all=[].concat(...Object.values(examsByUnit));
  const ex=all.find(e=>String(e.id)===String(examId));
  if(at && at.id){ abrirIntentoAlumno(at.id, unitId, ex&&ex.titulo); }
  else{ openExam(examId); }
}
function pdfDesdeIntento(it, ex, unitId){
  current.lastR={correctas:it.correctas,total:it.total,incorrectas:it.incorrectas,en_blanco:it.en_blanco,
    porcentaje: it.total?Math.round(it.correctas/it.total*100):0,
    apto: it.total>0 && it.correctas/it.total>=0.5, codigo:it.codigo,
    detalle:(it.detalle||[]).map((q,idx)=>({...q, pregunta_id:'i'+idx}))};
  current.lastFecha=it.creado_en?new Date(it.creado_en):new Date();
  current.optOrder={};
  current.unit=unitId;
  current.exam={titulo:(ex&&ex.titulo)||'Examen', tema:(unidadesById[unitId]&&unidadesById[unitId].codigo)||''};
  generarPDF();
}
async function abrirIntentoAlumno(id,unitId,titulo){
  if(!id){ appAlert('No hay detalle disponible para este intento.'); return; }
  const backFn=`openUnit('${unitId.replace(/'/g,"\\'")}')`;
  showView('unit'); window.scrollTo(0,0);
  $('unit').innerHTML=`<button class="backbtn" onclick="${backFn}">← Volver</button><div class="loader"><span class="spin"></span></div>`;
  try{
    const rows=await call(`/rest/v1/intentos?id=eq.${id}&select=examen_id,detalle,correctas,incorrectas,en_blanco,total,codigo,creado_en`);
    const it=rows&&rows[0]; if(!it) throw new Error('No encontrado.');
    const _all=[].concat(...Object.values(examsByUnit));
    const _ex=_all.find(e=>String(e.id)===String(it.examen_id));
    const _tit=titulo||(_ex&&_ex.titulo)||'Examen';
    window._intActual={it,ex:_ex,unitId};
    const pct=it.total?Math.round(it.correctas/it.total*100):0;
    const pass=it.total>0&&it.correctas/it.total>=0.5;
    let html=`<button class="backbtn" onclick="${backFn}">← Volver</button>
      <h1 style="font-size:1.05rem;font-weight:800;letter-spacing:-.3px;margin:8px 0 4px;color:var(--navy)">${escHtml(_tit)}</h1>
      <p style="font-size:.76rem;color:var(--ink-soft);margin-bottom:10px">Examen corregido</p>
      <div class="result" style="text-align:left;padding:18px 16px">
        <div style="display:flex;align-items:center;gap:11px;margin-top:11px;flex-wrap:wrap">
          <span class="score" style="font-size:1.9rem">${it.correctas}/${it.total}</span>
          <span class="verdict ${pass?'ok':'no'}">${pass?'Apto':'No apto'} · ${pct}%</span>
        </div>
        <div style="font-size:.74rem;color:var(--ink-soft);margin-top:9px">Aciertos: ${it.correctas} · Fallos: ${it.incorrectas} · En blanco: ${it.en_blanco}${it.codigo?' · Código: '+it.codigo:''}</div>
      </div>`;
    (it.detalle||[]).forEach((q,i)=>{
      html+=`<div class="qcard"><div class="qnum">Pregunta ${i+1}</div><div class="qtext">${q.enunciado}</div>`;
      (q.opciones||[]).forEach((op,idx)=>{let cls='opt'; if(idx===q.correcta) cls+=' correct'; else if(idx===q.elegida) cls+=' wrong'; html+=`<div class="${cls}"><span class="mk">${LETTERS[idx]}</span><span class="otext">${op}</span></div>`;});
      if(q.elegida<0) html+=`<div class="expl" style="border-color:var(--no);background:var(--no-bg);color:var(--no)">Sin responder.</div>`;
      if(q.explicacion) html+=`<div class="expl">${q.explicacion}</div>`;
      html+=`</div>`;
    });
    html+=`<div class="bar">
      <button class="btn btn-download" id="int-pdf">⬇ Descargar PDF del examen corregido</button>
      ${(_ex && !_ex.cuenta_final && unitEstado(unitId)!=='terminado')?`<button class="btn btn-primary" style="margin-top:9px" onclick="openExam('${String(it.examen_id).replace(/'/g,"\\'")}')">Repetir examen</button>`:''}
      <button class="btn btn-ghost" style="margin-top:9px" onclick="${backFn}">← Volver a exámenes</button>
    </div>`;
    $('unit').innerHTML=html;
    const _pb=$('int-pdf'); if(_pb) _pb.onclick=()=>pdfDesdeIntento(it,_ex,unitId);
  }catch(err){
    $('unit').innerHTML=`<button class="backbtn" onclick="${backFn}">← Volver</button><div class="center-msg">No se pudo abrir.<br><small>${err.message||''}</small></div>`;
  }
}

function openUnit(unitId){
  current.unit=unitId;
  const u=unidadesById[unitId];
  const staff=isStaff();
  const list=(examsByUnit[unitId]||[]).filter(e=> staff || e.publicado).sort(_cmpEx);
  showView('unit'); window.scrollTo(0,0);
  const est=unitEstado(unitId);
  const terminada = (est==='terminado' && !staff);
  const backLabel = (current.module && current.module.unidades.length>1) ? '← '+current.module.code : (window._activeCertId==='__aula_abierta' ? '← Materias' : '← Módulos');
  const backFn = (current.module && current.module.unidades.length>1) ? `openModule('${current.module.id}')` : (staff ? 'openModulosTeacher()' : 'goHome()');
  const head = `<button class="backbtn" onclick="${backFn}">${backLabel}</button>
    <div class="unit-head"><div class="c">${u?u.codigo:unitId.toUpperCase()}</div><div class="n">${(u&&u.titulo)?u.titulo:(UF_TITULOS[unitId]||'')}</div></div>`;
  const posterProx = `<div class="soon-screen"><div class="soon-emoji">📭</div><div class="soon-title">Aún no hay exámenes</div><div class="soon-text">Tu profesor activará los exámenes a medida que avance el temario.<br>Vuelve pronto.</div></div>`;
  if(est==='proximamente' && !staff){ $('unit').innerHTML=head+posterProx; return; }
  if(!list.length){ $('unit').innerHTML=head+posterProx; return; }

  // ── VISTA PROFESOR: media de clase por examen ──
  if(staff){
    // Si los datos del profesor aún no han cargado, mostrar espera breve
    if(!window._teacherDataReady && !teacherRows.length){
      $('unit').innerHTML=head+`<div class="center-msg" style="padding:40px 0"><span class="spin" style="display:inline-block;width:28px;height:28px;border:3px solid var(--line);border-top-color:var(--navy);border-radius:50%;animation:spin .7s linear infinite"></span><br><br><span style="color:var(--ink-soft);font-size:.85rem">Cargando datos de la clase...</span></div>`;
      return;
    }
    let html=head;
    // Barra de nota (profesor): media de la CLASE en los exámenes que cuentan
    // para la nota final. Da al profesor una visión rápida del rendimiento real.
    let pSum=0, pN=0;
    list.forEach(e=>{
      if(!e.cuenta_final) return;
      const st=statsExamen(e.id);
      if(st && st.intentos>0){ pSum+=st.media; pN++; }
    });
    if(pN>0){
      const mfClase=(pSum/pN/10).toFixed(1);
      html+=`<div class="nota-sticky"><div class="ns-card" style="flex:none;min-width:60%"><span>Media final de la clase</span><b>${mfClase}</b></div></div>`;
    }
    html+=`<div class="section">`;
    list.forEach(e=>{
      const oc=!e.publicado?` <span class="rbadge" style="background:#ececec;color:#8a8a8a">Oculto</span>`:'';
      if(e.tipo==='redaccion'){
        html+=`<button class="exam-row" data-id="${e.id}">
            <span class="cell-avg" style="font-size:1rem">✍️</span>
            <span class="meta"><span class="et">${escHtml(e.titulo)} <span class="rbadge">Redacción</span>${oc}</span>
            <span class="es avg-sub">Examen de redacción</span></span>
            <span class="arrow">›</span></button>`;
        return;
      }
      const st=statsExamen(e.id);
      let cellCls='', avgLabel='—', subTxt='Sin intentos';
      if(st){
        const pct=st.media;
        cellCls = pct>=65?'avg-ok':pct>=50?'avg-mid':'avg-no';
        avgLabel = pct+'%';
        subTxt = `Media clase · ${st.alumnos} alumno${st.alumnos!==1?'s':''} · ${st.intentos} intento${st.intentos!==1?'s':''}`;
      }
      html+=`<button class="exam-row ${cellCls}${e.cuenta_final?' ef':''}" data-id="${e.id}">
          <span class="cell-avg">${avgLabel}</span>
          <span class="meta"><span class="et">${escHtml(e.titulo)}${e.cuenta_final?' <span class="ef-badge">Nota final</span>':''}${oc}</span>
          <span class="es avg-sub">${subTxt}</span></span>
          <span class="arrow">›</span></button>`;
    });
    html+=`</div>`;
    $('unit').innerHTML=html;
    document.querySelectorAll('.exam-row[data-id]').forEach(b=>b.onclick=()=>openExamProfesor(b.dataset.id, unitId));
    return;
  }

  // ── VISTA ALUMNO ──
  // Barra de nota fija (sticky): media de la unidad, visible mientras hace scroll.
  // Media clase = promedio de la nota del mejor intento de cada examen realizado.
  // Media final = igual, pero solo con los exámenes que cuentan para la nota.
  let mSum=0,mN=0, fSum=0,fN=0;
  list.forEach(e=>{
    const at=attemptsByExam[e.id];
    if(!at || !at.count || !at.total) return;
    mSum += (at.mejor/at.total); mN++;
    if(e.cuenta_final){ fSum += (at.mejor/at.total); fN++; }
  });
  const mcA = mN>0 ? ((mSum/mN)*10).toFixed(1) : '—';
  const mfA = fN>0 ? ((fSum/fN)*10).toFixed(1) : '—';
  const mtV = mediaMisTodos(unitId);
  const mtA = mtV!=null ? mtV.toFixed(1) : '—';
  const stickyNota = `<div class="nota-sticky">
      <div class="ns-card"><span>½ Mejor int.</span><b>${mcA}</b></div>
      <div class="ns-card"><span>½ todos int.</span><b>${mtA}</b></div>
      <div class="ns-card"><span>½ Ex. Final</span><b>${mfA}</b></div>
    </div>`;
  let html=head+stickyNota+`<div class="section">`;
  list.forEach(e=>{
    const oc='';
    if(e.tipo==='redaccion'){
      const en=entregasByExam[e.id];
      let cell='✍️', sub='Examen para redactar', res='', cls='';
      if(en && en.estado==='corregido'){
        const n=(en.nota!=null)?(+en.nota).toFixed(1):'—', pass=(+en.nota>=5);
        cell=n; cls=pass?' done':' done fail'; sub='Corregido'; res=`<span class="res ${pass?'ok':'no'}">${pass?'✓ '+n:'✗ '+n}</span>`;
      }else if(en && en.estado==='reabierto'){
        cls=' pend'; sub='Reabierto · puedes repetirlo'; res=`<span class="res pend">↻ Reabierto</span>`;
      }else if(en){
        cls=' pend'; sub='Entregado'; res=`<span class="res pend">⏳ Pendiente</span>`;
      }
      html+=`<button class="exam-row red${cls}" data-red="${e.id}">
          <span class="cell red">${cell}</span>
          <span class="meta"><span class="et">${e.titulo} <span class="rbadge">Redacción</span></span><span class="es">${sub}</span></span>
          ${res||'<span class="arrow">›</span>'}
        </button>`;
      return;
    }
    const at=attemptsByExam[e.id];
    if(at){
      const tot=at.total, pct=Math.round(at.mejor/tot*100), pass=pct>=50;
      const nInt=at.count;
      const temaCorto=(e.tema||'').split(' · ')[0];
      html+=`<button class="exam-row done${pass?'':' fail'}${e.cuenta_final?' ef':''}" data-id="${e.id}"${(!e.cuenta_final && at.id)?' data-done="1"':''}>
          <span class="cell">${at.mejor}/${tot}</span>
          <span class="meta"><span class="et">${e.titulo}${e.cuenta_final?' <span class="ef-badge">Nota final</span>':''}</span><span class="es">${temaCorto?temaCorto+' · ':''}${pct}% · ${nInt} ${nInt===1?'intento':'intentos'}</span></span>
          <span class="res ${pass?'ok':'no'}">${pass?'✓ Apto':'✗ No apto'}</span>
          <span class="arrow">›</span></button>`;
    }else{
      const numCell=e.numero||(((e.titulo||'').match(/\d+/)||[])[0])||'·';
      html+=`<button class="exam-row${e.cuenta_final?' ef':''}" data-id="${e.id}"${terminada?' data-ro="1"':''}>
          <span class="cell">${numCell}</span>
          <span class="meta"><span class="et">${e.titulo}${e.cuenta_final?' <span class="ef-badge">Nota final</span>':''}</span><span class="es">${e.tema||''}</span></span>
          <span class="arrow">›</span></button>`;
    }
  });
  html+=`</div>`;
  if(list.length){
    const verMT = u? u.ver_megatest!==false : true;
    const verFA = u? u.ver_falladas!==false : true;
    // El mega test de 100 se dividió en 2 de 50: el de 100 se hacía muy pesado
    // y casi nadie lo terminaba. Parte 1 conserva el id histórico (repaso-uf),
    // parte 2 usa repaso-uf-b (mismo prefijo: los filtros de fantasmas siguen valiendo).
    const mtScore=(key)=>{ const m=attemptsByExam[key]; if(!m) return '';
      const p=Math.round(m.mejor/m.total*100), ok=p>=50;
      return `<span class="rc-score ${ok?'ok':'no'}">Mejor: ${m.mejor}/${m.total} · ${p}% · ${ok?'✓ Apto':'✗ No apto'} · ${m.count} ${m.count===1?'intento':'intentos'}</span>`; };
    const mt1=attemptsByExam['repaso-'+unitId], mt2=attemptsByExam['repaso-'+unitId+'-b'];
    const nf=falladasByUnit[unitId]||0;
    if((verMT||verFA) && !terminada){
      html+=`<div class="repaso-zone">`;
      if(verMT) html+=`<button class="repaso-card${mt1?' done':''}" id="btn-megatest">
          <span class="rc-badge">🔁 Mega test 1 · 50 preguntas</span>
          <span class="rc-title">Examen de repaso · Parte 1</span>
          <span class="rc-sub">50 preguntas al azar de toda la unidad para practicar.</span>
          ${mtScore('repaso-'+unitId)}
        </button>
        <button class="repaso-card${mt2?' done':''}" id="btn-megatest2">
          <span class="rc-badge">🔁 Mega test 2 · 50 preguntas</span>
          <span class="rc-title">Examen de repaso · Parte 2</span>
          <span class="rc-sub">Otras 50 preguntas al azar.</span>
          ${mtScore('repaso-'+unitId+'-b')}
        </button>`;
      if(verFA) html+=`<button class="failed-card${nf===0?' empty':''}" id="btn-falladas">
          <span class="fc-title">🎯 Test de preguntas falladas${nf>0?` (${nf})`:''}</span>
          <span class="fc-sub">${nf>0?`Repasa las ${nf} ${nf===1?'pregunta':'preguntas'} que has fallado o dejado en blanco en esta unidad.`:'Aún no tienes preguntas falladas. Haz exámenes y aquí podrás repasarlas.'}</span>
        </button>`;
      html+=`</div>`;
    }
  }
  // Temario: materiales que el profesor ha colgado en esta unidad (bajo preguntas falladas).
  const mats=(temarioByUnit[unitId]||[]);
  if(mats.length){
    html+=`<div class="section"><h3 class="sec-h" style="font-size:.82rem;font-weight:800;color:var(--navy);margin:14px 2px 8px">📚 Temario de la unidad</h3>`;
    mats.forEach(t=>{
      html+=`<button class="exam-row" data-mat="${t.id}" data-path="${escAttr(t.archivo_path)}" data-nom="${escAttr(t.archivo_nombre||'')}">
          <span class="cell">⬇</span>
          <span class="meta"><span class="et">${escHtml(t.titulo||t.archivo_nombre)}</span><span class="es">${escHtml(t.nota||t.archivo_nombre||'')}</span></span>
          <span class="arrow">›</span></button>`;
    });
    html+=`</div>`;
  }
  $('unit').innerHTML=html;
  document.querySelectorAll('.exam-row[data-id]').forEach(b=> b.onclick=()=>{
    if(b.dataset.done==='1') return verIntentoAlumno(b.dataset.id, unitId);
    if(b.dataset.ro==='1') return appAlert('Esta unidad está terminada: solo lectura. No puedes volver a hacer los exámenes para no alterar tu nota.');
    openExam(b.dataset.id);
  });
  document.querySelectorAll('.exam-row[data-red]').forEach(b=> b.onclick=()=>openRedaccion(b.dataset.red));
  if($('btn-megatest')) $('btn-megatest').onclick=()=>openMegatest(unitId,1);
  if($('btn-megatest2')) $('btn-megatest2').onclick=()=>openMegatest(unitId,2);
  if($('btn-falladas')) $('btn-falladas').onclick=()=>openFalladas(unitId);
  document.querySelectorAll('.exam-row[data-mat]').forEach(b=> b.onclick=()=>temarioDescargar(b.dataset.path, b.dataset.nom));
}

// ============ VISTA PROFESOR: alumnos por examen ============
function openExamProfesor(examId, unitId){
  showView('unit'); window.scrollTo(0,0);
  const all=[].concat(...Object.values(examsByUnit));
  const ex=all.find(e=>e.id===examId)||{};
  const u=unidadesById[unitId||ex.unidad];
  const backFn=`openUnit('${unitId||ex.unidad||''}')`;

  // Filas de este examen de todos los alumnos.
  // Casar por ID si existe; si no, por título acotado a la unidad del examen.
  const titulo=getTituloExamen(examId);
  const uniEx=ex.unidad||unitId||null;
  const rows=teacherRows.filter(r=>{
    if(r.examen_id!=null && r.examen_id!=='') return String(r.examen_id)===String(examId);
    return titulo && r.examen===titulo && (!uniEx || r.unidad===uniEx);
  });

  // Agrupar por alumno: mejor intento y total intentos
  const byAlumno={};
  rows.forEach(r=>{
    const key=r.alumno_email||r.alumno;
    if(!byAlumno[key]) byAlumno[key]={email:key, nombre:r._nombre||'', intentos:0, mejor:-1, mejorR:null};
    byAlumno[key].intentos++;
    const pct=r.total>0?r.correctas/r.total*100:-1;
    if(pct>byAlumno[key].mejor){ byAlumno[key].mejor=pct; byAlumno[key].mejorR=r; }
  });
  const alumnos=Object.values(byAlumno).sort((a,b)=>b.mejor-a.mejor);

  // Estadísticas globales
  const st=statsExamen(examId);
  const mediaGlobal=st?st.media:null;
  const nAl=alumnos.length;
  const nAptos=alumnos.filter(a=>a.mejor>=50).length;

  let statsHtml='';
  if(st){
    statsHtml=`<div class="peh-stats">
      <div class="peh-stat"><span>Media clase</span><b>${mediaGlobal}%</b></div>
      <div class="peh-stat"><span>Alumnos</span><b>${nAl}</b></div>
      <div class="peh-stat"><span>≥50%</span><b>${nAptos}</b></div>
      <div class="peh-stat"><span>Intentos</span><b>${st.intentos}</b></div>
    </div>`;
  }

  let html=`<button class="backbtn" onclick="${backFn}">← ${u?u.codigo:'Unidad'}</button>
    <div class="prof-exam-head">
      <div class="peh-title">${escHtml(ex.titulo||examId)}</div>
      ${statsHtml}
    </div>
    <button class="btn btn-ghost pv-toggle" id="btn-pv-preguntas">👁 Revisar preguntas del examen</button>
    <div id="pv-preguntas"></div>`;

  if(!alumnos.length){
    html+=`<div class="center-msg">Ningún alumno ha intentado este examen todavía.</div>`;
  } else {
    alumnos.forEach(a=>{
      const pct=Math.round(a.mejor);
      const cls=pct>=65?'ok':pct>=50?'mid':'no';
      const r=a.mejorR;
      const score=r?`${r.correctas}/${r.total}`:'—';
      html+=`<div class="al-exam-row">
        <div class="aer-score ${cls}">${score}</div>
        <div class="aer-info">
          <b>${escHtml(a.nombre||a.email)}</b>
          <span>${a.intentos} intento${a.intentos!==1?'s':''}</span>
        </div>
        <span class="aer-pct ${cls}">${pct}%</span>
        ${ex.cuenta_final?`<button class="sa-mini" data-reab="${escAttr(a.email)}" data-reabn="${escAttr(a.nombre||a.email)}" title="Reabrir: borra su intento y le da otra oportunidad" style="margin-left:8px;background:#fff7e6;color:#b26a00;border:1px solid #f0d9a8">↻</button>`:''}
      </div>`;
    });
  }
  $('unit').innerHTML=html;
  const pvBtn=$('btn-pv-preguntas');
  if(pvBtn) pvBtn.onclick=()=>togglePreviewPreguntas(examId);
  $('unit').querySelectorAll('[data-reab]').forEach(b=> b.onclick=()=>reabrirIntentoAlumnoUI(examId, b.dataset.reab, b.dataset.reabn, unitId));
}
async function reabrirIntentoAlumnoUI(examId, email, nombre, unitId){
  if(!await appConfirm('¿Reabrir el examen para '+(nombre||email)+'?\n\nSe borrarán sus intentos de este examen y podrá volver a hacerlo una vez.')) return;
  try{
    await call('/rest/v1/rpc/reabrir_intento',{method:'POST',body:{p_examen_id:examId, p_alumno_email:email}});
    await openTeacher();
    openExamProfesor(examId, unitId);
    appAlert('Hecho. '+(nombre||email)+' puede repetir el examen.');
  }catch(err){ appAlert('No se pudo reabrir: '+(err.message||'')); }
}

// ---- Vista previa de preguntas del examen (solo profesor) ----
// Usa el RPC obtener_examen_profesor (SECURITY DEFINER, exige rol profesor/admin),
// que devuelve las preguntas CON la respuesta correcta. El RPC del alumno
// (obtener_examen) sigue blindado y sin tocar: el anticopia no cambia.
let _pvAbierto=null;
async function togglePreviewPreguntas(examId){
  const box=$('pv-preguntas'); if(!box) return;
  if(_pvAbierto===examId){ box.innerHTML=''; _pvAbierto=null;
    const b=$('btn-pv-preguntas'); if(b) b.textContent='👁 Revisar preguntas del examen';
    return; }
  _pvAbierto=examId;
  const b=$('btn-pv-preguntas'); if(b) b.textContent='▲ Ocultar preguntas';
  await cargarPreviewPreguntas(examId);
}
async function cargarPreviewPreguntas(examId){
  const box=$('pv-preguntas'); if(!box) return;
  box.innerHTML='<div class="loader"><span class="spin"></span></div>';
  try{
    const qs=await call('/rest/v1/rpc/obtener_examen_profesor',{method:'POST',body:{p_examen_id:examId}})||[];
    if(!qs.length){ box.innerHTML='<div class="center-msg">Este examen no tiene preguntas.</div>'; return; }
    const LET=['A','B','C','D','E','F'];
    let h=`<div class="pvq-count">${qs.length} pregunta${qs.length!==1?'s':''} · la correcta aparece marcada en verde</div>
    <button class="btn btn-ghost pv-toggle" id="btn-pv-add">Reponer pregunta del banco</button>
    <div id="pv-banco"></div>
    <div class="pvq-list">`;
    qs.forEach((q,qi)=>{
      const ops=Array.isArray(q.opciones)?q.opciones:[];
      h+=`<div class="pvq-card">
        <div class="pvq-top"><span class="pvq-num">Pregunta ${qi+1}</span>
        <span class="pvq-nivel ${q.nivel==='alto'?'alto':''}">${escHtml(q.nivel||'medio')}</span></div>
        <div class="pvq-enun">${escHtml(q.enunciado||'')}</div>`;
      ops.forEach((o,i)=>{
        const ok=i===q.respuesta_correcta;
        h+=`<div class="pvq-opt${ok?' ok':''}"><span class="pvq-letra">${LET[i]||i+1}</span><span>${escHtml(o)}${ok?' ✓':''}</span></div>`;
      });
      if(q.explicacion) h+=`<div class="pvq-ex">${escHtml(q.explicacion)}</div>`;
      h+=`<div class="pvq-actions"><button class="pvq-del" onclick="quitarPreguntaExamen('${examId}',${q.pregunta_id})">🗑 Quitar del examen</button></div>
      </div>`;
    });
    h+='</div>';
    box.innerHTML=h;
    const addBtn=$('btn-pv-add');
    if(addBtn) addBtn.onclick=()=>toggleBancoPreguntas(examId);
  }catch(err){
    box.innerHTML=`<div class="center-msg">No se pudieron cargar las preguntas.<br><small>${escHtml(err.message||'')}</small></div>`;
  }
}
async function quitarPreguntaExamen(examId, preguntaId){
  if(!await appConfirm('¿Quitar esta pregunta del examen? La pregunta seguirá en el banco y podrás reutilizarla; el examen tendrá una pregunta menos.')) return;
  try{
    const H={'apikey':SUPABASE_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'};
    const r=await fetch(SUPABASE_URL+'/rest/v1/examen_preguntas?examen_id=eq.'+encodeURIComponent(examId)+'&pregunta_id=eq.'+preguntaId,{method:'DELETE',headers:H});
    if(!r.ok) throw new Error('No se pudo quitar ('+r.status+')');
    await cargarPreviewPreguntas(examId);
  }catch(err){ appAlert('Error: '+(err.message||'')); }
}

// ---- Reponer: elegir una pregunta del banco (mismo tema) y añadirla al examen ----
let _bancoAbierto=false;
async function toggleBancoPreguntas(examId){
  const box=$('pv-banco'); if(!box) return;
  if(_bancoAbierto){ box.innerHTML=''; _bancoAbierto=false;
    const b=$('btn-pv-add'); if(b) b.textContent='Reponer pregunta del banco';
    return; }
  _bancoAbierto=true;
  const b=$('btn-pv-add'); if(b) b.textContent='▲ Cerrar banco de preguntas';
  box.innerHTML='<div class="loader"><span class="spin"></span></div>';
  try{
    const qs=await call('/rest/v1/rpc/preguntas_banco_profesor',{method:'POST',body:{p_examen_id:examId}})||[];
    if(!qs.length){ box.innerHTML='<div class="pvq-count">No quedan preguntas del mismo tema disponibles en el banco.</div>'; return; }
    const LET=['A','B','C','D','E','F'];
    let h=`<div class="pvq-count">${qs.length} disponible${qs.length!==1?'s':''} del mismo tema · toca "Añadir" para incorporarla al final del examen</div>`;
    qs.forEach(q=>{
      const ops=Array.isArray(q.opciones)?q.opciones:[];
      h+=`<div class="pvq-card pvq-banco">
        <div class="pvq-top"><span class="pvq-num">${escHtml(q.tema||'')}</span>
        <span>${q.en_otro_examen?'<span class="pvq-uso">En otro examen</span>':''}
        <span class="pvq-nivel ${q.nivel==='alto'?'alto':''}">${escHtml(q.nivel||'medio')}</span></span></div>
        <div class="pvq-enun">${escHtml(q.enunciado||'')}</div>`;
      ops.forEach((o,i)=>{
        const ok=i===q.respuesta_correcta;
        h+=`<div class="pvq-opt${ok?' ok':''}"><span class="pvq-letra">${LET[i]||i+1}</span><span>${escHtml(o)}${ok?' ✓':''}</span></div>`;
      });
      h+=`<div class="pvq-actions"><button class="pvq-add" onclick="anadirPreguntaExamen('${examId}',${q.pregunta_id})">Añadir al examen</button></div>
      </div>`;
    });
    box.innerHTML=h;
  }catch(err){
    box.innerHTML=`<div class="center-msg">No se pudo cargar el banco.<br><small>${escHtml(err.message||'')}</small></div>`;
  }
}
async function anadirPreguntaExamen(examId, preguntaId){
  try{
    const H={'apikey':SUPABASE_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'};
    // Siguiente posición = máxima actual + 1
    let pos=1;
    try{
      const r=await fetch(SUPABASE_URL+'/rest/v1/examen_preguntas?examen_id=eq.'+encodeURIComponent(examId)+'&select=posicion&order=posicion.desc&limit=1',{headers:H});
      const rows=await r.json();
      if(Array.isArray(rows)&&rows[0]&&rows[0].posicion!=null) pos=rows[0].posicion+1;
    }catch(e){}
    const ins=await fetch(SUPABASE_URL+'/rest/v1/examen_preguntas',{method:'POST',headers:H,
      body:JSON.stringify({examen_id:examId, pregunta_id:preguntaId, posicion:pos})});
    if(!ins.ok) throw new Error('No se pudo añadir ('+ins.status+')');
    _bancoAbierto=false;
    await cargarPreviewPreguntas(examId);
  }catch(err){ appAlert('Error: '+(err.message||'')); }
}

// ============ REDACCIÓN (alumno) ============
let redCurrent=null;
async function openRedaccion(examId){
  const all=[].concat(...Object.values(examsByUnit));
  const ex=all.find(e=>e.id===examId)||{};
  redCurrent={examId, unitId:ex.unidad, titulo:ex.titulo||'Examen de redacción', preguntas:[], material_url:ex.material_url||null, material_modo:ex.material_modo||'inline'};
  current.unit=ex.unidad;
  showView('exam'); window.scrollTo(0,0);
  $('exam').innerHTML='<div class="loader"><span class="spin"></span></div>';
  try{
    const preguntas=await call('/rest/v1/rpc/obtener_redaccion',{method:'POST',body:{p_examen_id:examId}})||[];
    redCurrent.preguntas=preguntas;
    let entrega=null;
    try{
      const flt=userId?`&user_id=eq.${userId}`:'';
      const arr=await call(`/rest/v1/entregas?examen_id=eq.${examId}${flt}&select=respuestas,estado,nota,comentario`);
      if(arr&&arr[0]) entrega=arr[0];
    }catch(_){}
    renderRedaccion(entrega);
  }catch(err){
    $('exam').innerHTML=`<div class="center-msg">No se pudo abrir el examen.<br><small>${err.message}</small></div>
      <div class="bar"><button class="btn btn-ghost" onclick="backToUnit()">← Volver</button></div>`;
  }
}
function materialViewerHtml(url, modo, label){
  if(!url) return '';
  const u=escAttr(url), lbl=escHtml(label||'Ver material');
  if(modo==='boton'){
    return `<div style="margin:8px 0"><a class="btn btn-ghost" href="${u}" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none">📄 ${lbl}</a></div>`;
  }
  return `<div style="margin:8px 0"><iframe src="${u}" style="width:100%;height:420px;border:1px solid var(--line);border-radius:10px;background:#fff"></iframe><div style="margin-top:4px"><a href="${u}" target="_blank" rel="noopener" style="font-size:.78rem">Abrir el PDF en una pestaña nueva</a></div></div>`;
}
function renderRedaccion(entrega){
  const estado = entrega ? entrega.estado : null;
  const corregido = estado==='corregido';
  const editable = !entrega || estado==='reabierto';
  const prev={}; if(entrega&&Array.isArray(entrega.respuestas)) entrega.respuestas.forEach(r=>{ prev[r.pregunta_id]=r.texto||''; });
  const h=[`<button class="backbtn" onclick="backToUnit()">← Volver</button>`];
  h.push(`<h1 style="font-size:1.2rem;font-weight:800;letter-spacing:-.3px;margin:6px 0 2px;color:var(--navy)">${escHtml(redCurrent.titulo)}</h1>`);
  h.push(`<p style="font-size:.8rem;color:var(--ink-soft);margin-bottom:16px">${editable?'Escribe tus respuestas y pulsa <b>Entregar</b>. Solo puedes entregar una vez; tu profesor las corregirá y pondrá la nota.':'Examen de redacción.'}</p>`);
  if(redCurrent.material_url){ h.push(materialViewerHtml(redCurrent.material_url, redCurrent.material_modo, 'Ver material del examen')); }
  if(corregido){
    const n=(entrega.nota!=null)?(+entrega.nota).toFixed(1):'—', pass=(+entrega.nota>=5);
    h.push(`<div class="t-note ${pass?'ok':'err'}" style="font-size:.95rem"><b>Nota: ${n} / 10</b></div>`);
    if(entrega.comentario) h.push(`<div class="ia-prev" style="margin-top:10px">${pintarCorreccion(entrega.comentario, n)}</div>`);
  }else if(estado==='pendiente'){
    h.push(`<div class="t-note" style="background:var(--honey-tint);color:var(--honey-deep);border-color:#f0d9b3">⏳ Entregado. Pendiente de corrección. No puedes volver a entregar hasta que tu profesor lo reabra.</div>`);
  }else if(estado==='reabierto'){
    h.push(`<div class="t-note" style="background:var(--honey-tint);color:var(--honey-deep);border-color:#f0d9b3">↻ Tu profesor ha reabierto este examen. Puedes volver a entregarlo.</div>`);
  }
  redCurrent.preguntas.forEach((q,i)=>{
    h.push(`<div class="red-q">
      <div class="rq-num">Pregunta ${i+1}</div>
      <div class="rq-txt">${escHtml(q.enunciado)}</div>
      ${q.material_url?materialViewerHtml(q.material_url,q.material_modo,'Ver material de la pregunta'):''}
      <textarea class="red-a" data-pid="${q.pregunta_id}" placeholder="Escribe aquí tu respuesta…" ${editable?'':'disabled'}>${escHtml(prev[q.pregunta_id]||'')}</textarea>
    </div>`);
  });
  if(editable){
    h.push(`<div class="bar"><button class="btn btn-honey" id="red-send">Entregar</button></div>`);
  }else{
    h.push(`<div class="bar"><button class="btn btn-ghost" onclick="backToUnit()">← Volver</button></div>`);
  }
  $('exam').innerHTML=h.join('');
  if($('red-send')) $('red-send').onclick=entregarRedaccionUI;
}
async function entregarRedaccionUI(){
  const respuestas=[];
  let vacias=0;
  redCurrent.preguntas.forEach(q=>{
    const ta=document.querySelector(`.red-a[data-pid="${q.pregunta_id}"]`);
    const txt=ta?ta.value.trim():'';
    if(!txt) vacias++;
    respuestas.push({pregunta_id:q.pregunta_id, enunciado:q.enunciado, texto:txt});
  });
  if(vacias===redCurrent.preguntas.length){ appAlert('Escribe al menos una respuesta antes de entregar.'); return; }
  if(vacias>0 && !await appConfirm('Hay '+vacias+' pregunta(s) sin responder. ¿Entregar igualmente?')) return;
  // Doble confirmación: la entrega es única y no se puede deshacer.
  if(!await appConfirm('¿Seguro que quieres ENTREGAR?\n\nSolo se puede entregar una vez. Después ya no podrás cambiar tus respuestas.')) return;
  if(!await appConfirm('Última comprobación: se enviará al profesor tal y como está.\n\n¿Entregar definitivamente?')) return;
  const btn=$('red-send'); btn.disabled=true; btn.innerHTML='<span class="spin"></span>';
  try{
    await call('/rest/v1/rpc/entregar_redaccion',{method:'POST',body:{p_examen_id:redCurrent.examId, p_respuestas:respuestas}});
    entregasByExam[redCurrent.examId]={estado:'pendiente',nota:null};
    appAlert('¡Entregado! Queda pendiente de corrección. Recuerda que solo puedes entregar una vez.');
    backToUnit();
  }catch(err){ btn.disabled=false; btn.textContent='Entregar'; appAlert('No se pudo entregar: '+(err.message||'')); }
}

// ============ EXAMEN ============
async function openExam(examId){
  const all=[].concat(...Object.values(examsByUnit));
  current.exam=all.find(e=>e.id===examId); current.respuestas={}; current.preguntas=[]; current.qIndex=0; current.mode='examen';
  // Bloqueo de repetición: un examen que cuenta para nota solo se hace UNA vez.
  // Si el alumno ya tiene un intento, ve su resultado bloqueado (no el profesor).
  const at=attemptsByExam[examId];
  if(current.exam && current.exam.cuenta_final && at && at.count>0 && !isStaff()){
    renderExamenBloqueado(examId, at);
    return;
  }
  // UF terminada: solo lectura. No se puede (re)hacer ningún examen para no alterar la nota.
  if(current.exam && !isStaff() && unitEstado(current.exam.unidad)==='terminado'){
    if(at && at.id){ verIntentoAlumno(examId, current.exam.unidad); }
    else { appAlert('Esta unidad está terminada: solo lectura. No puedes volver a hacer los exámenes para no alterar tu nota.'); }
    return;
  }
  showView('exam'); window.scrollTo(0,0);
  $('exam').innerHTML='<div class="loader"><span class="spin"></span></div>';
  try{
    current.preguntas=await call('/rest/v1/rpc/obtener_examen',{method:'POST',body:{p_examen_id:examId}});
    current.preguntas=shuffle(current.preguntas);
    prepararOpciones();
    // Examen que cuenta para nota: primero la pantalla de instrucciones.
    // Aquí el alumno AÚN puede volver sin penalización (no hay vigilantes activos).
    if(current.exam && current.exam.cuenta_final){
      renderInstruccionesExamen();
    }else{
      renderExam();
    }
  }catch(err){
    $('exam').innerHTML=`<div class="center-msg">No se pudo abrir el examen.<br><small>${err.message}</small></div>
      <div class="bar"><button class="btn btn-ghost" onclick="backToUnit()">← Volver</button></div>`;
  }
}
// Pantalla de examen oficial YA REALIZADO: muestra la nota y bloquea la repetición.
function renderExamenBloqueado(examId, at){
  showView('exam'); window.scrollTo(0,0);
  const tot=at.total||0, mejor=at.mejor||0;
  const pct=tot>0?Math.round(mejor/tot*100):0;
  const nota=tot>0?((mejor/tot)*10).toFixed(1):'—';
  const pass=pct>=50;
  const cls=pass?'ok':'no';
  $('exam').innerHTML=`
    <button class="backbtn" onclick="backToUnit()">← ${current.unit?(unidadesById[current.unit]?.codigo||'Volver'):'Volver'}</button>
    <h1 style="font-size:1.15rem;font-weight:800;letter-spacing:-.3px;margin:10px 0 4px;color:var(--navy)">${current.exam.titulo}</h1>
    <p style="font-size:.82rem;color:var(--ink-soft);margin-bottom:16px"><b style="color:#92400e">Examen oficial · Ya realizado</b></p>

    <div class="bloq-box">
      <div class="bloq-ic">🔒</div>
      <div class="bloq-h">Este examen ya está entregado</div>
      <p>Los exámenes que cuentan para la nota solo se pueden hacer una vez. Esta es tu calificación:</p>
      <div class="bloq-nota ${cls}">
        <div class="bloq-num">${nota}</div>
        <div class="bloq-sub">${mejor}/${tot} correctas · ${pct}%</div>
        <div class="bloq-badge ${cls}">${pass?'✓ Apto':'✗ No apto'}</div>
      </div>
      <p style="margin-top:14px;font-size:.8rem;color:var(--ink-soft)">Si crees que ha habido un error, habla con tu profesor: solo el profesorado puede reabrir un examen.</p>
    </div>

    <div class="bar">
      ${at && at.id ? `<button class="btn btn-download" onclick="verIntentoAlumno('${String(examId).replace(/'/g,"\\'")}','${current.unit?String(current.unit).replace(/'/g,"\\'"):''}')">⬇ Ver / descargar mi examen corregido</button>` : ''}
      <button class="btn btn-ghost" style="margin-top:9px" onclick="backToUnit()">← Volver a los exámenes</button>
    </div>`;
}
// Pantalla-puerta: instrucciones y "contrato" del examen oficial. El alumno debe
// confirmar que entiende las reglas antes de ver la primera pregunta.
function renderInstruccionesExamen(){
  const n=current.preguntas.length;
  $('exam').innerHTML=`
    <button class="backbtn" onclick="backToUnit()">← ${current.unit?(unidadesById[current.unit]?.codigo||'Volver'):'Volver'}</button>
    <h1 style="font-size:1.15rem;font-weight:800;letter-spacing:-.3px;margin:10px 0 4px;color:var(--navy)">${current.exam.titulo}</h1>
    <p style="font-size:.82rem;color:var(--ink-soft);margin-bottom:16px">${n} preguntas · Aprobado al 50% · <b style="color:#92400e">Cuenta para la nota</b></p>

    <div class="instr-box">
      <div class="instr-h">⚠️ Antes de empezar, lee esto</div>
      <p>Este es un <b>examen oficial</b>. Una vez que empieces, se aplican estas normas para garantizar que la nota sea justa para toda la clase:</p>

      <div class="instr-item">
        <span class="instr-ic">↩️</span>
        <div><b>Si pulsas el botón "atrás" del móvil</b><br>
        Saldrá un aviso preguntándote si quieres salir. Podrás <b>cancelar y seguir</b> con el examen, o confirmar para entregarlo.</div>
      </div>

      <div class="instr-item instr-danger">
        <span class="instr-ic">🚪</span>
        <div><b>Si cambias de aplicación, abres otra pestaña o bloqueas el móvil</b><br>
        El examen se <b>entregará y corregirá automáticamente</b> con las respuestas que lleves hasta ese momento. <b>No podrás continuar.</b> Las preguntas sin responder contarán como falladas.</div>
      </div>

      <p style="margin-top:12px;font-weight:600">Para hacer el examen con tranquilidad: cierra otras apps, silencia notificaciones y no salgas de esta pantalla hasta pulsar "Corregir examen".</p>
    </div>

    <div class="bar">
      <button class="btn btn-primary" id="instr-empezar">Entiendo las normas · Empezar examen</button>
      <button class="btn btn-ghost" style="margin-top:9px" onclick="backToUnit()">← Ahora no, volver</button>
    </div>`;
  $('instr-empezar').onclick=comenzarExamenOficial;
}
// Activa los "vigilantes" y muestra la primera pregunta. A partir de aquí,
// salir de la pantalla tiene consecuencias (ya avisadas y aceptadas).
function comenzarExamenOficial(){
  history.pushState({examBlock:true}, '');
  window._examPopHandler = function(e){
    history.pushState({examBlock:true}, '');
    intentarSalirExamen();
  };
  window.addEventListener('popstate', window._examPopHandler);
  window._examVisHandler = function(){
    if(document.hidden && current.mode==='examen' && current.exam && current.exam.cuenta_final && !window._examEntregado){
      window._examEntregado = true;
      gradeExam(true).then(()=>{ backToUnit(); }).catch(()=>{ backToUnit(); });
    }
  };
  window._examEntregado = false;
  document.addEventListener('visibilitychange', window._examVisHandler);
  renderExam();
  window.scrollTo(0,0);
}
// Mega test de repaso, en 2 partes de 50 preguntas al azar (el de 100 era demasiado largo)
async function openMegatest(unitId, parte){
  parte = parte===2 ? 2 : 1;
  current.unit=unitId; current.respuestas={}; current.preguntas=[]; current.qIndex=0; current.mode='megatest'; current.mtParte=parte;
  const u=unidadesById[unitId];
  current.exam={titulo:'Mega test de repaso · Parte '+parte, tema:(u?u.codigo:'')+' · 50 preguntas', unit:unitId};
  showView('exam'); window.scrollTo(0,0);
  $('exam').innerHTML='<div class="loader"><span class="spin"></span></div>';
  try{
    current.preguntas=await call('/rest/v1/rpc/obtener_megatest',{method:'POST',body:{p_unidad:unitId,p_n:50}});
    if(!current.preguntas.length){ throw new Error('No hay preguntas para el repaso.'); }
    prepararOpciones();
    renderExam();
  }catch(err){
    $('exam').innerHTML=`<div class="center-msg">No se pudo abrir el repaso.<br><small>${err.message}</small></div>
      <div class="bar"><button class="btn btn-ghost" onclick="backToUnit()">← Volver</button></div>`;
  }
}
// Test de preguntas falladas y en blanco del propio alumno (de esta unidad)
async function openFalladas(unitId){
  current.unit=unitId; current.respuestas={}; current.preguntas=[]; current.qIndex=0; current.mode='falladas';
  const u=unidadesById[unitId];
  current.exam={titulo:'Preguntas falladas y en blanco', tema:(u?u.codigo:'')+' · repaso de tus errores', unit:unitId};
  showView('exam'); window.scrollTo(0,0);
  $('exam').innerHTML='<div class="loader"><span class="spin"></span></div>';
  try{
    current.preguntas=await call('/rest/v1/rpc/obtener_falladas',{method:'POST',body:{p_unidad:unitId}});
    if(!current.preguntas.length){
      $('exam').innerHTML=`<div class="center-msg">¡Bien! No tienes preguntas falladas ni en blanco en esta unidad.<br><small>Haz algún examen y las que falles aparecerán aquí para repasar.</small></div>
        <div class="bar"><button class="btn btn-ghost" onclick="backToUnit()">← Volver a exámenes</button></div>`;
      return;
    }
    prepararOpciones();
    renderExam();
  }catch(err){
    $('exam').innerHTML=`<div class="center-msg">No se pudo abrir el repaso de falladas.<br><small>${err.message}</small></div>
      <div class="bar"><button class="btn btn-ghost" onclick="backToUnit()">← Volver</button></div>`;
  }
}
function renderExam(){
  const n=current.preguntas.length;
  if(current.qIndex<0) current.qIndex=0;
  if(current.qIndex>n-1) current.qIndex=n-1;
  const i=current.qIndex, q=current.preguntas[i];
  const temaRaw=(q.tema||'')+''; const tema=(/^prof-|^imp-|^repaso-/i.test(temaRaw)||!temaRaw?'':temaRaw).toUpperCase();
  const esParaNota = !!(current.exam && current.exam.cuenta_final);
  const volverBtn = esParaNota
    ? `<button class="backbtn" onclick="intentarSalirExamen()" style="opacity:.5">← ${current.unit?(unidadesById[current.unit]?.codigo||'Volver'):'Volver'}</button>`
    : `<button class="backbtn" onclick="backToUnit()">← ${current.unit?(unidadesById[current.unit]?.codigo||'Volver'):'Volver'}</button>`;
  let html=`${volverBtn}
    <h1 style="font-size:1.05rem;font-weight:800;letter-spacing:-.3px;margin:8px 0 2px;color:var(--navy)">${current.exam.titulo}</h1>
    ${esParaNota?`<div style="background:#fff4e2;border:1px solid #f0d9b3;border-radius:8px;padding:7px 12px;font-size:.76rem;color:#92400e;margin-bottom:6px;font-weight:600">⚠️ Examen oficial · No salgas de esta pantalla hasta corregir</div>`:''}
    <p style="font-size:.78rem;color:var(--ink-soft);margin-bottom:10px">${n} preguntas · Aprobado al 50%</p>
    <div class="exam-body"><div class="exam-left">
    <div class="qcard">
      ${tema?`<span class="tema-chip">${tema}</span>`:''}
      <div class="qnum">Pregunta ${i+1}</div>
      <div class="qtext">${q.enunciado}</div>
      <div id="opts-${q.id}">`;
  const ordEx=current.optOrder[q.id]||(q.opciones||[]).map((_,k)=>k);
  ordEx.forEach((oi,pos)=>{
    const sel=current.respuestas[q.id]===oi?' sel':'';
    html+=`<div class="opt${sel}" data-q="${q.id}" data-i="${oi}"><span class="mk">${LETTERS[pos]}</span><span class="otext">${q.opciones[oi]}</span></div>`;
  });
  html+=`</div></div>
    <div class="qnav">
      <button class="nav-b" id="prevB" ${i===0?'disabled':''}>← Anterior</button>
      <span class="nav-count">Pregunta ${i+1} de ${n}</span>
      <button class="nav-b" id="nextB" ${i===n-1?'disabled':''}>Siguiente →</button>
    </div>
    </div><div class="exam-right">
    <div class="qgrid">`;
  current.preguntas.forEach((qq,k)=>{
    const ans=current.respuestas[qq.id]!==undefined?' ans':'';
    const cur=k===i?' cur':'';
    html+=`<button class="gc${ans}${cur}" data-jump="${k}">${k+1}</button>`;
  });
  html+=`</div>
    <div class="bar">
      <button class="btn btn-primary" id="gradeBtn">Corregir examen</button>
      ${esParaNota
        ? `<button class="btn btn-ghost" style="margin-top:9px;opacity:.5" onclick="intentarSalirExamen()">← Salir del examen</button>`
        : `<button class="btn btn-ghost" style="margin-top:9px" onclick="backToUnit()">← Volver al menú</button>`}
    </div>
    </div></div>`;
  $('exam').innerHTML=html;
  $('exam').querySelectorAll('.opt').forEach(o=>{
    o.onclick=()=>{ const q=o.dataset.q, i=+o.dataset.i; if(current.respuestas[q]===i){ delete current.respuestas[q]; } else { current.respuestas[q]=i; } renderExam(); };
  });
  const goTo=k=>{ current.qIndex=k; renderExam(); window.scrollTo(0,0); };
  if($('prevB')) $('prevB').onclick=()=>{ if(current.qIndex>0) goTo(current.qIndex-1); };
  if($('nextB')) $('nextB').onclick=()=>{ if(current.qIndex<n-1) goTo(current.qIndex+1); };
  $('exam').querySelectorAll('.gc[data-jump]').forEach(g=>{ g.onclick=()=>goTo(+g.dataset.jump); });
  $('gradeBtn').onclick=gradeExam;
}
async function gradeExam(auto){
  // Confirmación para evitar corregir sin querer a mitad de examen.
  // En modo automático (auto=true, por salir de la pantalla) NO se pregunta:
  // el alumno ya no está delante y el examen se entrega tal cual.
  if(auto!==true){
    const total=current.preguntas.length;
    const respondidas=current.preguntas.filter(q=>current.respuestas[q.id]!==undefined && current.respuestas[q.id]!==-1).length;
    const sinResponder=total-respondidas;
    let msg='¿Corregir el examen ahora? Una vez corregido no podrás cambiar tus respuestas.';
    if(sinResponder>0){
      msg=`Te quedan ${sinResponder} ${sinResponder===1?'pregunta sin responder':'preguntas sin responder'}.\n\n`+msg;
    }
    if(!await appConfirm(msg)) return;
  }
  const btn=$('gradeBtn'); if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }
  const respuestas=current.preguntas.map(q=>({pregunta_id:q.id, opcion:(current.respuestas[q.id]!==undefined?current.respuestas[q.id]:-1)}));
  try{
    let r;
    if(current.mode==='examen'){
      r=await call('/rest/v1/rpc/corregir_examen',{method:'POST',body:{p_examen_id:current.exam.id,p_respuestas:respuestas}});
      registrarIntento(current.exam.id, r.correctas, r.total);
    }else if(current.mode==='megatest'){
      const rid='repaso-'+current.unit+(current.mtParte===2?'-b':'');
      r=await call('/rest/v1/rpc/corregir_preguntas',{method:'POST',body:{p_respuestas:respuestas,p_examen_id:rid}});
      registrarIntento(rid, r.correctas, r.total);
    }else if(current.mode==='falladas'){
      // Guardar el intento del test de falladas con su propio examen_id, igual
      // que el mega-test. Así el ACIERTO queda registrado con fecha posterior al
      // fallo original, y la lógica de "último intento gana" lo saca del contador.
      const fid='falladas-'+current.unit;
      r=await call('/rest/v1/rpc/corregir_preguntas',{method:'POST',body:{p_respuestas:respuestas,p_examen_id:fid}});
    }else{
      r=await call('/rest/v1/rpc/corregir_preguntas',{method:'POST',body:{p_respuestas:respuestas}});
    }
    // Refrescar el contador de falladas tras CUALQUIER corrección, incluido el
    // propio test de falladas: al acertar una pregunta antes fallada, debe salir
    // del contador. (Antes se excluía el modo 'falladas', que era justo el bug.)
    if(current.mode==='falladas'){
      // Guardamos el nº de falladas ANTES para calcular cuántas ha recuperado.
      const antes = falladasByUnit[current.unit]||0;
      await refrescarFalladas();
      const ahora = falladasByUnit[current.unit]||0;
      current.falladasProgreso = { recuperadas: Math.max(0, antes-ahora), quedan: ahora };
    }else{
      refrescarFalladas();
      current.falladasProgreso = null;
    }
    // Limpiar handlers de bloqueo (salir ya no debe entregar de nuevo)
    if(window._examPopHandler){ window.removeEventListener('popstate', window._examPopHandler); window._examPopHandler=null; }
    if(window._examVisHandler){ document.removeEventListener('visibilitychange', window._examVisHandler); window._examVisHandler=null; }
    renderResult(r);
  }catch(err){ if(btn){ btn.disabled=false; btn.textContent='Corregir examen'; } if(auto!==true) appAlert('No se pudo corregir: '+err.message); }
}
// Recalcula el contador de preguntas falladas tras corregir
async function refrescarFalladas(){
  try{ const f=await call('/rest/v1/rpc/resumen_falladas',{method:'POST',body:{}});
    falladasByUnit={}; (f||[]).forEach(r=>{ falladasByUnit[r.unidad]=r.n; });
  }catch(e){}
}

// ============ RESULTADO ============
function renderResult(r){
  showView('result'); window.scrollTo(0,0);
  current.lastR=r; current.lastFecha=new Date();
  let html=`<div class="result">
      <div class="score">${r.correctas}/${r.total}</div>
      <div class="pct">${r.porcentaje}% de aciertos</div>
      <div class="verdict ${r.apto?'ok':'no'}">${r.apto?'Apto':'No apto'}</div>
      ${r.codigo?`<div class="code">Código: ${r.codigo}</div>`:''}
    </div>`;
  // Progreso de recuperación (solo en el test de preguntas falladas)
  const fp=current.falladasProgreso;
  if(fp){
    if(fp.recuperadas>0 && fp.quedan===0){
      html+=`<div class="recup-box done">🎉 <b>¡Enhorabuena!</b> Has recuperado ${fp.recuperadas} ${fp.recuperadas===1?'pregunta':'preguntas'} y ya no te queda ninguna pendiente en esta unidad.</div>`;
    }else if(fp.recuperadas>0){
      html+=`<div class="recup-box"><b>💪 ¡Buen repaso!</b> Has recuperado ${fp.recuperadas} ${fp.recuperadas===1?'pregunta':'preguntas'}. Te ${fp.quedan===1?'queda':'quedan'} <b>${fp.quedan}</b> por repasar en esta unidad.</div>`;
    }else{
      html+=`<div class="recup-box none">Sigue practicando: aún tienes <b>${fp.quedan}</b> ${fp.quedan===1?'pregunta':'preguntas'} por recuperar. Repite el test para volver a intentarlas.</div>`;
    }
  }
  (r.detalle||[]).forEach((q,i)=>{
    html+=`<div class="qcard"><div class="qnum">Pregunta ${i+1}</div><div class="qtext">${q.enunciado}</div>`;
    const ordR=current.optOrder[q.pregunta_id]||(q.opciones||[]).map((_,k)=>k);
    ordR.forEach((oi,pos)=>{
      let cls='opt';
      if(oi===q.correcta) cls+=' correct'; else if(oi===q.elegida) cls+=' wrong';
      html+=`<div class="${cls}"><span class="mk">${LETTERS[pos]}</span><span class="otext">${q.opciones[oi]}</span></div>`;
    });
    if(q.elegida<0) html+=`<div class="expl" style="border-color:var(--no);background:var(--no-bg);color:var(--no)">Sin responder.</div>`;
    if(q.explicacion) html+=`<div class="expl">${q.explicacion}</div>`;
    html+=`</div>`;
  });
  const repeatFn = current.mode==='megatest' ? `openMegatest('${current.unit}',${current.mtParte===2?2:1})`
                 : current.mode==='falladas' ? `openFalladas('${current.unit}')`
                 : `openExam('${current.exam.id}')`;
  const repeatLabel = current.mode==='examen' ? 'Repetir examen' : 'Repetir repaso';
  html+=`<div class="bar">
      <button class="btn btn-download" id="pdfBtn">⬇ Descargar PDF con resultados</button>
      <button class="btn btn-primary" style="margin-top:9px" onclick="${repeatFn}">${repeatLabel}</button>
      <button class="btn btn-ghost" style="margin-top:9px" onclick="backToUnit()">← Volver a exámenes</button>
    </div>`;
  $('result').innerHTML=html;
  $('pdfBtn').onclick=generarPDF;
}

// ============ PDF DEL RESULTADO ============
function fmtFechaES(d){
  const m=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return d.getDate()+' de '+m[d.getMonth()]+' de '+d.getFullYear();
}
function fmtHoraES(d){const p=n=>String(n).padStart(2,'0');return p(d.getHours())+':'+p(d.getMinutes());}
function fmtStamp(d){const p=n=>String(n).padStart(2,'0');return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes());}

function pdfSafe(s){ return String(s==null?'':s)
  .replace(/[\u2192\u21D2\u2794\u27A4\u25B6\u2799\u279C]/g,'>')
  .replace(/[\u2190\u21D0]/g,'<')
  .replace(/\u2022/g,'-')
  .replace(/[\u2018\u2019\u2032]/g,"'")
  .replace(/[\u201C\u201D\u2033]/g,'"')
  .replace(/[\u2013\u2014]/g,'-')
  .replace(/\u2026/g,'...')
  .replace(/\u00A0/g,' ')
  .replace(/[\u2713\u2714]/g,'OK').replace(/[\u2715\u2717\u2718]/g,'X')
  .replace(/[^\x00-\xFF]/g,''); }

function bestPorExamen(email){
  const list=teacherRows.filter(r=>(r.alumno_email||r.alumno)===email);
  const groups={};
  list.forEach(r=>{ const k=(r.unidad||'')+'|'+(r.examen||''); (groups[k]=groups[k]||[]).push(r); });
  return Object.values(groups).map(g=>{
    let best=g[0]; g.forEach(r=>{ const rr=r.total?r.correctas/r.total:-1, br=best.total?best.correctas/best.total:-1; if(rr>br) best=r; });
    return {label:ufEx(g[0]), correctas:best.correctas, total:best.total, pct:best.porcentaje, apto:best.apto, n:g.length};
  }).sort((a,b)=>a.label.localeCompare(b.label,'es'));
}

function pdfNotasGeneral(){
  if(!window.jspdf){ appAlert('No se pudo cargar el generador de PDF. Comprueba tu conexión e inténtalo de nuevo.'); return; }
  const rows = resumenRows || [];
  if(!rows.length){ appAlert('No hay alumnos para listar.'); return; }
  const { jsPDF }=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const PW=210,PH=297,M=16;
  const NAVY=[46,49,99],MUTED=[96,84,70],DARK=[30,26,16],HONEY=(window._activeCertId==='__aula_abierta'?[0,119,182]:[180,89,5]),LIGHT=[224,224,216];
  const fecha=new Date(); let y=M;
  const cAl=M, cCl=M+96, cFi=M+126, cIn=M+158;
  function colHeaders(){
    doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
    doc.text('Alumno',cAl,y);doc.text('Clase',cCl,y);doc.text('Final',cFi,y);doc.text('Intentos',cIn,y);
    y+=2;doc.setDrawColor(LIGHT[0],LIGHT[1],LIGHT[2]);doc.setLineWidth(0.3);doc.line(M,y,PW-M,y);y+=4;
  }
  function header(){
    const _lh=34/APTUVIA_LOGO_RATIO;
    pdfLogo(doc,M,y,34);
    doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
    doc.text(fmtFechaES(fecha),PW-M,y+_lh*0.55,{align:'right'});
    y+=_lh+6;
    doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    doc.text('Listado de notas del alumnado',M,y); y+=4;
    doc.setDrawColor(HONEY[0],HONEY[1],HONEY[2]);doc.setLineWidth(0.6);doc.line(M,y,PW-M,y); y+=6;
    colHeaders();
  }
  function ensure(sp){ if(y+sp>PH-14){ doc.addPage(); y=M; header(); } }
  header();
  rows.forEach(a=>{
    ensure(7);
    const mc=(a.media_clase!=null)?(+a.media_clase).toFixed(1):'-';
    const mf=(a.media_final!=null)?(+a.media_final).toFixed(1):'-';
    doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    doc.text(doc.splitTextToSize(pdfSafe(a.nombre||a.alumno), cCl-cAl-3)[0], cAl, y);
    doc.setFont('helvetica','normal');doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
    doc.text(String(mc),cCl,y); doc.text(String(mf),cFi,y); doc.text(String(a.intentos||0),cIn,y);
    y+=5; doc.setDrawColor(245,243,236);doc.setLineWidth(0.2);doc.line(M,y-1.5,PW-M,y-1.5);
  });
  const pages=doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){ doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(150,150,150);
    doc.text('Aptuvia — Notas del alumnado',M,PH-8);
    doc.text('Página '+i+' de '+pages,PW-M,PH-8,{align:'right'}); }
  doc.save('Aptuvia_notas_alumnado_'+fmtStamp(fecha)+'.pdf');
}

function pdfNotasAlumno(email){
  if(!window.jspdf){ appAlert('No se pudo cargar el generador de PDF. Comprueba tu conexión e inténtalo de nuevo.'); return; }
  const meta=(resumenRows||[]).find(x=>x.alumno===email)||{};
  const exs=bestPorExamen(email);
  const { jsPDF }=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const PW=210,PH=297,M=16;
  const NAVY=[46,49,99],MUTED=[96,84,70],DARK=[30,26,16],HONEY=(window._activeCertId==='__aula_abierta'?[0,119,182]:[180,89,5]),GREEN=[21,128,61],RED=[192,57,43],LIGHT=[224,224,216];
  const fecha=new Date(); let y=M;
  const _lh=34/APTUVIA_LOGO_RATIO;
  pdfLogo(doc,M,y,34);
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
  doc.text(fmtFechaES(fecha),PW-M,y+_lh*0.55,{align:'right'});
  y+=_lh+6;
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
  doc.text(pdfSafe(meta.nombre||email),M,y); y+=4.5;
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
  doc.text(pdfSafe(email),M,y); y+=4;
  doc.setDrawColor(HONEY[0],HONEY[1],HONEY[2]);doc.setLineWidth(0.6);doc.line(M,y,PW-M,y); y+=7;
  const mc=(meta.media_clase!=null)?(+meta.media_clase).toFixed(1):'-';
  const mf=(meta.media_final!=null)?(+meta.media_final).toFixed(1):'-';
  doc.setFont('helvetica','bold');doc.setFontSize(10.5);doc.setTextColor(NAVY[0],NAVY[1],NAVY[2]);
  doc.text('Media de clase: '+mc+' / 10        Media final: '+mf+' / 10',M,y); y+=8;
  const cEx=M, cNo=M+110, cPc=M+140, cAp=M+162;
  function colHeaders(){ doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
    doc.text('Examen',cEx,y);doc.text('Mejor',cNo,y);doc.text('%',cPc,y);doc.text('Estado',cAp,y);
    y+=2;doc.setDrawColor(LIGHT[0],LIGHT[1],LIGHT[2]);doc.setLineWidth(0.3);doc.line(M,y,PW-M,y);y+=4; }
  function ensure(sp){ if(y+sp>PH-14){ doc.addPage(); y=M; colHeaders(); } }
  colHeaders();
  if(!exs.length){ doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]); doc.text('Sin exámenes realizados.',cEx,y+2); y+=6; }
  exs.forEach(o=>{
    ensure(7);
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    doc.text(doc.splitTextToSize(pdfSafe(o.label), cNo-cEx-3)[0], cEx, y);
    doc.setFont('helvetica','normal');doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
    doc.text(o.correctas+'/'+o.total, cNo, y);
    doc.text((o.pct!=null?o.pct:0)+'%', cPc, y);
    const ap=!!o.apto, col=ap?GREEN:RED; doc.setFont('helvetica','bold');doc.setTextColor(col[0],col[1],col[2]);
    doc.text(ap?'Apto':'No apto', cAp, y);
    y+=5; doc.setDrawColor(245,243,236);doc.setLineWidth(0.2);doc.line(M,y-1.5,PW-M,y-1.5);
  });
  const pages=doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){ doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(150,150,150);
    doc.text('Aptuvia — Notas del alumno',M,PH-8);
    doc.text('Página '+i+' de '+pages,PW-M,PH-8,{align:'right'}); }
  const slug=pdfSafe(meta.nombre||email).replace(/[^\w]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');
  doc.save('Aptuvia_notas_'+(slug||'alumno')+'_'+fmtStamp(fecha)+'.pdf');
}

function generarPDF(){
  const r=current.lastR; if(!r) return;
  if(!window.jspdf){ appAlert('No se pudo cargar el generador de PDF. Comprueba tu conexión a internet e inténtalo de nuevo.'); return; }
  const { jsPDF }=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const PW=210,PH=297,M=18,CW=PW-M*2;
  const NAVY=[46,49,99],MUTED=[96,84,70],DARK=[30,26,16],GREEN=[21,128,61],RED=[192,57,43],LIGHT=[236,226,210],HONEY=(window._activeCertId==='__aula_abierta'?[0,119,182]:[180,89,5]);
  let y=M;
  const fecha=current.lastFecha||new Date();
  function ensure(sp){ if(y+sp>PH-16){ doc.addPage(); y=M; } }
  function pdfTxt(s){ return String(s==null?'':s)
      .replace(/[\u2192\u21D2\u2794\u27A4\u25B6\u2799\u279C]/g,'>')
      .replace(/[\u2190\u21D0]/g,'<')
      .replace(/\u2022/g,'-')
      .replace(/[\u2018\u2019\u2032]/g,"'")
      .replace(/[\u201C\u201D\u2033]/g,'"')
      .replace(/[\u2013\u2014]/g,'-')
      .replace(/\u2026/g,'...')
      .replace(/\u00A0/g,' ')
      .replace(/[\u2713\u2714]/g,'OK').replace(/[\u2715\u2717\u2718]/g,'X')
      .replace(/[^\x00-\xFF]/g,''); }
  function lines(arr,x,lh,size,style,color){ doc.setFont('helvetica',style);doc.setFontSize(size);doc.setTextColor(color[0],color[1],color[2]); arr.forEach(l=>{ ensure(lh); doc.text(pdfTxt(l),x,y); y+=lh; }); }

  // Cabecera
  pdfLogo(doc,(PW-40)/2,y,40); y+=40/APTUVIA_LOGO_RATIO+5;
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
  doc.text('Justificante de autoevaluación',PW/2,y,{align:'center'}); y+=4.5;
  doc.setDrawColor(HONEY[0],HONEY[1],HONEY[2]);doc.setLineWidth(0.6);doc.line(M,y,PW-M,y); y+=8;

  // Datos
  function kv(label,val,x){
    doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    doc.text(label,x,y); const lw=doc.getTextWidth(label+' ');
    doc.setFont('helvetica','normal');doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
    doc.text(pdfTxt(val),x+lw,y);
  }
  const titulo=(current.exam&&current.exam.titulo)||'Examen';
  let tema=(current.exam&&current.exam.tema)||'';
  const ufCode=(current.unit&&unidadesById[current.unit])?unidadesById[current.unit].codigo:'';
  if(ufCode && !tema.toUpperCase().startsWith(ufCode.toUpperCase())) tema = tema ? (ufCode+' · '+tema) : ufCode;
  kv('Alumno:', userName||userEmail||'—', M); y+=5.5;
  kv('Examen:',titulo,M); kv('Fecha:',fmtFechaES(fecha),M+98); y+=5.5;
  kv('Unidad:',tema||'—',M); kv('Hora:',fmtHoraES(fecha),M+98); y+=5.5;
  kv('Modalidad:','Test · aprobado al 50%',M); kv('Nº preguntas:',r.total,M+98); y+=8;

  // Caja de nota
  const ratio=r.total>0?r.correctas/r.total:0, nota=ratio*10, pct=r.porcentaje, pass=!!r.apto, boxH=30;
  doc.setDrawColor(HONEY[0],HONEY[1],HONEY[2]);doc.setLineWidth(0.8);doc.roundedRect(M,y,CW,boxH,3,3);
  doc.setFont('helvetica','bold');doc.setFontSize(26);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
  doc.text(nota.toFixed(2)+' / 10',PW/2,y+13,{align:'center'});
  doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
  doc.text('Aciertos: '+r.correctas+'  ·  Fallos: '+r.incorrectas+'  ·  En blanco: '+r.en_blanco,PW/2,y+20,{align:'center'});
  doc.setFont('helvetica','bold');doc.setFontSize(10.5);
  const pc=pass?GREEN:RED;doc.setTextColor(pc[0],pc[1],pc[2]);
  doc.text((pass?'APTO':'NO APTO')+' ('+pct+'%)',PW/2,y+26,{align:'center'});
  y+=boxH+9;

  // Preguntas
  (r.detalle||[]).forEach((q,i)=>{
    ensure(14);
    lines(doc.splitTextToSize(pdfTxt((i+1)+'. '+q.enunciado),CW),M,5,9.8,'bold',DARK); y+=1;
    const order=current.optOrder[q.pregunta_id]||(q.opciones||[]).map((_,k)=>k);
    const correctPos=order.indexOf(q.correcta);
    if(q.elegida<0){
      lines(doc.splitTextToSize('Tu respuesta: en blanco (sin responder)',CW-3),M+3,4.6,9,'normal',RED);
    }else{
      const sp=order.indexOf(q.elegida); const ok=q.elegida===q.correcta;
      lines(doc.splitTextToSize(pdfTxt('Tu respuesta: '+LETTERS[sp]+') '+q.opciones[q.elegida]+(ok?'  [Correcta]':'  [Incorrecta]')),CW-3),M+3,4.6,9,'normal',ok?GREEN:RED);
    }
    lines(doc.splitTextToSize(pdfTxt('Respuesta correcta: '+LETTERS[correctPos]+') '+q.opciones[q.correcta]),CW-3),M+3,4.6,9,'bold',GREEN);
    if(q.explicacion) lines(doc.splitTextToSize(pdfTxt(q.explicacion),CW-3),M+3,4.3,8.5,'italic',MUTED);
    y+=4;
  });

  // Código + copyright
  ensure(16); y+=2;
  doc.setDrawColor(LIGHT[0],LIGHT[1],LIGHT[2]);doc.setLineWidth(0.4);doc.line(M,y,PW-M,y); y+=5;
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(MUTED[0],MUTED[1],MUTED[2]);
  if(r.codigo){ doc.text('Código de verificación: '+r.codigo,PW/2,y,{align:'center'}); y+=4; }
  doc.setFontSize(7.2);doc.setTextColor(150,150,150);
  doc.text('Documento de autoevaluación con fines de práctica. No constituye un certificado oficial; el Certificado de',PW/2,y,{align:'center'}); y+=3.2;
  doc.text('Profesionalidad lo expide únicamente el SEPE a través de centros acreditados.',PW/2,y,{align:'center'}); y+=4;
  doc.text('© '+fecha.getFullYear()+' Bernardo Medina Oranto. Todos los derechos reservados.',PW/2,y,{align:'center'});

  // Pies
  const pages=doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){
    doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(150,150,150);
    doc.text('Aptuvia — Justificante de autoevaluación',M,PH-8);
    doc.text('Página '+i+' de '+pages,PW-M,PH-8,{align:'right'});
  }
  const slug=titulo.replace(/[^\wáéíóúñ]+/gi,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');
  doc.save('Aptuvia_'+slug+'_'+fmtStamp(fecha)+'.pdf');
}

// ============ NAV ============
function showView(v){
  ['home','module','unit','exam','result','teacher'].forEach(id=>$(id).classList.toggle('hidden',id!==v));
  document.body.classList.toggle('teacherview', v==='teacher');
  sbUpdateActive(v);
  window._curView=v; guardarSesion();
}
function goHome(){ if(isStaff()){ pintarTeacher(); } else { showView('home'); window.scrollTo(0,0); } }
async function intentarSalirExamen(){
  const resp = Object.keys(current.respuestas||{}).length;
  const total = (current.preguntas||[]).length;
  const msg = `⚠️ ATENCIÓN: Estás a punto de abandonar un examen oficial.

` +
    `Llevas ${resp} de ${total} preguntas respondidas.

` +
    `Si sales ahora, el examen se dará por entregado con las respuestas que hayas marcado hasta este momento. Las preguntas sin responder contarán como falladas.

` +
    `La única forma de finalizar correctamente el examen es pulsar "Corregir examen".

` +
    `¿Deseas salir igualmente y que el examen quede registrado con tu nota actual?`;
  if(await appConfirm(msg)){
    gradeExam().then(()=>{ backToUnit(); }).catch(()=>{ backToUnit(); });
  }
}
function backToUnit(){
  if(window._examPopHandler){
    window.removeEventListener('popstate', window._examPopHandler);
    window._examPopHandler = null;
  }
  if(window._examVisHandler){
    document.removeEventListener('visibilitychange', window._examVisHandler);
    window._examVisHandler = null;
  }
  if(current.unit){ openUnit(current.unit); } else { goHome(); }
}

// ============ SIDEBAR ============
function sbRender(){
  // La barra lateral ya no lleva enlaces: solo el logo (clic = Inicio) y Salir.
  const mods=$('sb-mods'); if(mods) mods.innerHTML='';
  try{
    const claro=document.querySelector('#login .lh-logo .brand-logo-img');
    const lat=document.querySelector('#sidebar .sb-brand .brand-logo-img');
    if(claro&&lat&&lat.src!==claro.src){ lat.src=claro.src; lat.className='brand-logo-img brand-logo-img--light'; }
  }catch(e){}
}
function sbUpdateActive(v){
  const sbHome=$('sb-home'); if(!sbHome) return;
  sbHome.classList.toggle('active', v==='home');
  document.querySelectorAll('[data-sbmod]').forEach(b=>{
    b.classList.toggle('active', v!=='home' && current.module && b.dataset.sbmod===current.module.id);
  });
}

// ============ EVENTOS ============
$('loginBtn').onclick=doLogin;
$('authToggle').onclick=toggleAuthMode;
$('pass').addEventListener('keydown',e=>{ if(e.key==='Enter') doLogin(); });
wireEye('passEye','pass');

// ============================================================
// IMPORTAR EXAMEN DESDE TEXTO (parser propio, sin API externa)
// ============================================================
function openImportPDF(){
  showView('teacher');
  $('teacher').innerHTML = `
    <button class="backbtn" onclick="pintarTeacher()">← Panel</button>
    <h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;color:var(--navy);font-size:1.1rem;margin:0 0 14px;">📄 Importar examen desde texto</h2>

    <div style="background:#eff6ff;border-left:3px solid var(--navy);border-radius:0 10px 10px 0;padding:12px 14px;margin-bottom:16px;font-size:.78rem;color:#1e3a8a;line-height:1.6;">
      <strong>Formato (una pregunta por bloque):</strong><br>
      <code style="display:block;margin-top:6px;font-size:.72rem;background:rgba(255,255,255,.6);padding:8px;border-radius:6px;white-space:pre-wrap;"># Título del examen
@nivel: medio

1. ¿Texto de la pregunta?
*A) Opción correcta (pon * delante)
B) Otra opción
C) Otra opción
D) Otra opción
> Explicación opcional</code>
    </div>

    <div style="margin-bottom:14px;">
      <p style="font-size:.8rem;font-weight:600;color:var(--navy);margin-bottom:8px;">📚 Examen de destino</p>
      <select id="imp-exam-sel" >
        <option value="">— Selecciona un examen —</option>
      </select>
    </div>

    <textarea id="imp-text" rows="12" placeholder="Pega aquí tu examen con el formato indicado arriba..."
      style="width:100%;padding:12px;border:1.5px solid var(--line);border-radius:12px;font-size:.82rem;font-family:inherit;resize:vertical;line-height:1.5;color:var(--navy);"></textarea>

    <div class="pdf-status" id="imp-status" style="margin:10px 0;"></div>
    <div id="imp-preview" style="margin-top:8px;"></div>

    <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
      <button onclick="parsearImport()" class="btn btn-primary" style="background:var(--navy);">🔍 Analizar texto</button>
      <div id="imp-save-bar" style="display:none;">
        <button onclick="guardarImport()" class="btn btn-primary" style="background:var(--ok);">💾 Guardar en la plataforma</button>
      </div>
      <button onclick="pintarTeacher()" class="btn btn-secondary">Cancelar</button>
    </div>
  `;
  loadExamsForImport();
}

async function loadExamsForImport(){
  try{
    const exams=await call('/rest/v1/examenes?select=id,titulo&order=orden.asc',{auth:true});
    const sel=$('imp-exam-sel'); if(!sel) return;
    (exams||[]).filter(e=>!e.id.startsWith('repaso')).forEach(e=>{
      const o=document.createElement('option'); o.value=e.id; o.textContent=e.titulo; sel.appendChild(o);
    });
  }catch(e){}
}

function parsearImport(){
  const txt=$('imp-text').value.trim();
  const status=$('imp-status'), preview=$('imp-preview');
  $('imp-save-bar').style.display='none';
  preview.innerHTML='';
  if(!txt){ status.className='pdf-status err'; status.textContent='Pega el texto del examen primero.'; return; }

  // Parser
  const qRe=/^(\d+)[.)\-]\s+(.+)/;
  const optRe=/^([*]?)([A-Da-d])[.)\-]\s*(.*)/;
  let title='Examen importado', nivel='medio';
  let qs=[], cur=null;

  txt.split('\n').forEach(line=>{
    line=line.trim();
    if(!line) return;
    if(line.startsWith('#')){ title=line.replace(/^#+\s*/,'').trim(); return; }
    if(/^@nivel:/i.test(line)){ nivel=/alto/i.test(line)?'alto':'medio'; return; }
    let m;
    if((m=line.match(qRe))){ cur={q:m[2].trim(),opts:[],a:-1,ex:''}; qs.push(cur); return; }
    if(cur&&(m=line.match(optRe))){ if(m[1]==='*') cur.a=cur.opts.length; cur.opts.push(m[3].trim()); return; }
    if(cur&&line.startsWith('>')){ cur.ex=(cur.ex?cur.ex+' ':'')+line.replace(/^>+\s*/,'').trim(); return; }
    if(cur&&!cur.opts.length){ cur.q+=' '+line; }
  });

  const clean=qs.filter(q=>q.q.trim()&&q.opts.length>=2).map(q=>({
    enunciado:q.q.trim(),
    opciones:q.opts.slice(0,4),
    respuesta_correcta:q.a>=0?q.a:0,
    explicacion:q.ex.trim(),
    nivel:nivel,
    tipo:'test'
  }));

  if(!clean.length){ status.className='pdf-status err'; status.textContent='No se detectaron preguntas. Revisa el formato: número + pregunta, letra + opción, * en la correcta.'; return; }

  window._importQuestions=clean;
  status.className='pdf-status ok';
  status.textContent='✅ '+clean.length+' preguntas detectadas. Revisa y guarda.';

  preview.innerHTML=clean.map((q,i)=>`
    <div class="q-preview">
      <div class="qp-num">Pregunta ${i+1}</div>
      <div class="qp-q">${escHtml(q.enunciado)}</div>
      ${q.opciones.map((o,oi)=>`<div class="qp-opt${oi===q.respuesta_correcta?' correct':''}">
        ${oi===q.respuesta_correcta?'✓':'○'} ${escHtml(o)}</div>`).join('')}
      ${q.explicacion?`<div class="qp-ex">💡 ${escHtml(q.explicacion)}</div>`:''}
    </div>`).join('');

  $('imp-save-bar').style.display='block';
}

async function guardarImport(){
  const examId=$('imp-exam-sel').value;
  if(!examId){ appAlert('Selecciona el examen de destino.'); return; }
  const questions=window._importQuestions||[];
  if(!questions.length) return;
  const status=$('imp-status');
  status.className='pdf-status'; status.textContent='💾 Guardando...';
  $('imp-save-bar').style.display='none';
  let ok=0,err=0;
  for(let i=0;i<questions.length;i++){
    try{
      const q=questions[i];
      const insRes=await fetch(SUPA_URL+'/rest/v1/preguntas',{
        method:'POST',
        headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+getToken(),'Content-Type':'application/json','Prefer':'return=representation'},
        body:JSON.stringify(Object.assign({tema:examId,enunciado:q.enunciado,opciones:q.opciones,respuesta_correcta:q.respuesta_correcta,explicacion:q.explicacion,nivel:q.nivel,tipo:q.tipo}, window._saImpersona&&window._saImpersonaAcademia?{academia_id:window._saImpersonaAcademia}:{}))
      });
      const inserted=await insRes.json();
      if(inserted&&inserted[0]&&inserted[0].id){
        const maxP=await call('/rest/v1/examen_preguntas?examen_id=eq.'+examId+'&select=posicion&order=posicion.desc&limit=1',{auth:true});
        const pos=(maxP&&maxP[0]?maxP[0].posicion:0)+1;
        await call('/rest/v1/examen_preguntas',{auth:true,method:'POST',body:JSON.stringify({examen_id:examId,pregunta_id:inserted[0].id,posicion:pos})});
        ok++;
      } else err++;
    }catch(e){ err++; }
  }
  status.className=ok>0?'pdf-status ok':'pdf-status err';
  status.textContent=ok>0?`✅ ${ok} preguntas guardadas.${err>0?' ('+err+' con error)':''} ¡Listo!`:`Error al guardar.`;
}


function wireImportarKind(){
  const btn=$('imp-analizar-btn'); if(!btn) return;
  btn.onclick=crearDesdeTexto;
}

async function crearDesdeTexto(){
  // Recoger campos del formulario
  const unidad=$('ce-unidad')?$('ce-unidad').value:builder.unidad;
  const titulo=($('ce-titulo')?$('ce-titulo').value.trim():'')||'Examen importado';
  const nivel=$('ce-nivel')?$('ce-nivel').value:builder.nivel;
  const cuentaFinal=$('ce-final')?$('ce-final').checked:false;
  const txt=$('imp-text')?$('imp-text').value.trim():'';
  const status=$('imp-status');
  const preview=$('imp-preview');

  if(!unidad){ status.className='pdf-status err'; status.textContent='Selecciona la unidad de destino.'; return; }
  if(!txt){ status.className='pdf-status err'; status.textContent='Pega el texto del examen primero.'; return; }

  // Parser
  const qRe=/^(\d+)[.)\-]\s+(.+)/;
  const optRe=/^([*]?)([A-Da-d])[.)\-]\s*(.*)/;
  let nivel2=nivel;
  let qs=[], cur=null;
  txt.split('\n').forEach(line=>{
    line=line.trim(); if(!line) return;
    if(line.startsWith('#')) return;
    if(/^@nivel:/i.test(line)){ nivel2=/alto/i.test(line)?'alto':'medio'; return; }
    let m;
    if((m=line.match(qRe))){ cur={q:m[2].trim(),opts:[],a:-1,ex:''}; qs.push(cur); return; }
    if(cur&&(m=line.match(optRe))){ if(m[1]==='*') cur.a=cur.opts.length; cur.opts.push(m[3].trim()); return; }
    if(cur&&line.startsWith('>')){ cur.ex=(cur.ex?cur.ex+' ':'')+line.replace(/^>+\s*/,'').trim(); return; }
    if(cur&&!cur.opts.length){ cur.q+=' '+line; }
  });

  const clean=qs.filter(q=>q.q.trim()&&q.opts.length>=2).map(q=>({
    enunciado:q.q.trim(),
    opciones:q.opts.slice(0,4),
    respuesta_correcta:q.a>=0?q.a:0,
    explicacion:q.ex.trim(),
    nivel:nivel2,
    tipo:'test'
  }));

  if(!clean.length){ status.className='pdf-status err'; status.textContent='No se detectaron preguntas válidas. Revisa el formato.'; return; }

  status.className='pdf-status'; status.textContent='⏳ Creando examen con '+clean.length+' preguntas...';

  // Preview
  preview.innerHTML=clean.map((q,i)=>`
    <div class="q-preview">
      <div class="qp-num">Pregunta ${i+1}</div>
      <div class="qp-q">${escHtml(q.enunciado)}</div>
      ${q.opciones.map((o,oi)=>`<div class="qp-opt${oi===q.respuesta_correcta?' correct':''}">
        ${oi===q.respuesta_correcta?'✓':'○'} ${escHtml(o)}</div>`).join('')}
      ${q.explicacion?`<div class="qp-ex">💡 ${escHtml(q.explicacion)}</div>`:''}
    </div>`).join('');

  try{
    // 1. Crear el examen en la tabla examenes
    const examId=(window._activeCertId==='__aula_abierta'?'aula-imp-':'prof-imp-')+Date.now().toString(36);
    const examRes=await fetch(SUPABASE_URL+'/rest/v1/examenes',{
      method:'POST',
      headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json','Prefer':'return=representation'},
      body:JSON.stringify(Object.assign({id:examId,titulo:titulo,tema:'Examen importado por el profesor',unidad:unidad,nivel:nivel2,publicado:true,cuenta_final:cuentaFinal,orden:999,barajar:true,numero:null}, window._saImpersona?{profesor_id:window._saImpersonaProf,academia_id:window._saImpersonaAcademia}:{}))
    });
    if(!examRes.ok){ const e=await examRes.json(); throw new Error(JSON.stringify(e)); }

    // 2. Insertar cada pregunta y vincularla en examen_preguntas
    let ok=0,err=0;
    for(let i=0;i<clean.length;i++){
      const q=clean[i];
      const pRes=await fetch(SUPABASE_URL+'/rest/v1/preguntas',{
        method:'POST',
        headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json','Prefer':'return=representation'},
        body:JSON.stringify(Object.assign({tema:examId,enunciado:q.enunciado,opciones:q.opciones,respuesta_correcta:q.respuesta_correcta,explicacion:q.explicacion,nivel:q.nivel,tipo:q.tipo}, window._saImpersona&&window._saImpersonaAcademia?{academia_id:window._saImpersonaAcademia}:{}))
      });
      const pData=await pRes.json();
      if(pData&&pData[0]&&pData[0].id){
        await fetch(SUPABASE_URL+'/rest/v1/examen_preguntas',{
          method:'POST',
          headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
          body:JSON.stringify({examen_id:examId,pregunta_id:pData[0].id,posicion:i+1})
        });
        ok++;
      } else err++;
    }

    status.className='pdf-status ok';
    status.textContent='✅ Examen «'+titulo+'» creado con '+ok+' preguntas.'+(err>0?' ('+err+' errores)':'')+' ¡Ya visible para los alumnos!';
    setTimeout(()=>{ openExamMgmt(); },2500);
  }catch(e){
    status.className='pdf-status err';
    status.textContent='Error al crear el examen: '+e.message;
  }
}


function toggleCertPicker(){
  const drop=$('cert-picker-drop');
  drop.classList.toggle('open');
  // cerrar al clicar fuera
  if(drop.classList.contains('open')){
    setTimeout(()=>document.addEventListener('click', closeCertPickerOut, {once:true}), 0);
  }
}
function closeCertPickerOut(e){
  const picker=$('cert-picker');
  if(picker && !picker.contains(e.target)) $('cert-picker-drop').classList.remove('open');
}
function selectCert(value, label){
  $('portal-select').value=value;
  $('cert-picker-label').textContent=label;
  $('cert-picker-label').style.color='var(--navy)';
  $('cert-picker-drop').classList.remove('open');
  $('portal-msg').textContent='';
}


// ── Picker universal (reemplaza <select> en gestión de exámenes) ──
const _upickState = {};

function upickCreate(id, options, currentVal, onChange){
  const cur = options.find(o=>String(o.value)===String(currentVal))||options[0]||{value:'',label:'— Selecciona —'};
  _upickState[id]={value:cur.value, onChange};
  const opts = options.map(o=>{
    const safeVal = String(o.value).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const active = String(o.value)===String(currentVal)?' active':'';
    return '<div class="upick-opt'+active+'" onclick="upickSelect(\''+id+'\',\''+safeVal+'\',this)">'+escHtml(o.label)+'</div>';
  }).join('');
  return '<div class="upick" id="upick-wrap-'+id+'">'+
    '<button type="button" class="upick-btn" id="upick-btn-'+id+'" onclick="upickToggle(\''+id+'\')">'+escHtml(cur.label)+'</button>'+
    '<div class="upick-drop" id="upick-drop-'+id+'"><div class="upick-handle"></div>'+opts+'</div>'+
    '</div>'+
    '<div class="upick-overlay" id="upick-ov-'+id+'" onclick="upickClose(\''+id+'\')"></div>';
}
function upickToggle(id){
  const drop=document.getElementById('upick-drop-'+id);
  const ov=document.getElementById('upick-ov-'+id);
  if(!drop) return;
  const isOpen=drop.classList.contains('open');
  // cerrar todos los demás
  Object.keys(_upickState).forEach(k=>{
    document.getElementById('upick-drop-'+k)?.classList.remove('open');
    document.getElementById('upick-ov-'+k)?.classList.remove('open');
  });
  if(!isOpen){ drop.classList.add('open'); ov?.classList.add('open'); }
}
function upickClose(id){
  document.getElementById('upick-drop-'+id)?.classList.remove('open');
  document.getElementById('upick-ov-'+id)?.classList.remove('open');
}
function upickSelect(id, value, el){
  const state=_upickState[id]; if(!state) return;
  state.value=value;
  // Actualizar label del botón
  const btn=document.getElementById('upick-btn-'+id);
  if(btn) btn.textContent=el.textContent.trim();
  // Marcar activo
  el.closest('.upick-drop').querySelectorAll('.upick-opt').forEach(o=>o.classList.remove('active'));
  el.classList.add('active');
  upickClose(id);
  if(state.onChange) state.onChange(value);
}
function upickVal(id){ return (_upickState[id]||{}).value||''; }

$('cr-year').textContent=new Date().getFullYear();

// ===== Ventanas legales =====
function openLeg(id){var el=document.getElementById('leg-'+id);if(el)el.classList.add('visible');}
function closeLeg(id){var el=document.getElementById('leg-'+id);if(el)el.classList.remove('visible');}
function legBg(e,id){if(e&&e.target===document.getElementById('leg-'+id))closeLeg(id);}
$('logoutBtn').onclick=logout;
$('sb-logout').onclick=logout;

/* ══════════════════════════════════════════════════════════════════
   DEMO LOCAL · recorrido de solo lectura con datos INVENTADOS
   ------------------------------------------------------------------
   No toca Supabase: se intercepta call() con window._demoMode y se
   devuelven datos falsos. Nada se guarda. Riesgo cero para producción.
   Los datos (academia, profesores, alumnos, preguntas, notas) son
   ficticios. La estructura (módulos/UF) sí es realista.
   ══════════════════════════════════════════════════════════════════ */

const DEMO_CERT_ID   = 'demo0508';                 // certBD() lo devuelve
const DEMO_PORTAL_ID = '__demo0508';               // window._activeCertId
const DEMO_ACADEMIA  = 99;

function _dq(id,enun,ops,corr,expl){ return {id, enunciado:enun, opciones:ops, correcta:corr, explicacion:expl||''}; }

/* ---------- Preguntas inventadas (NUNCA las reales del banco) ---------- */
const DEMO_PREGUNTAS = {
  'demo-ex1':[
    _dq('d1-1','En un teclado de ordenador, ¿qué tecla permite escribir en mayúsculas de forma continua?',['Bloq Mayús','Alt Gr','Control','Tabulador'],0,'Bloq Mayús fija las mayúsculas hasta que se vuelve a pulsar.'),
    _dq('d1-2','¿Qué combinación se usa habitualmente para copiar el texto seleccionado?',['Ctrl + X','Ctrl + C','Ctrl + V','Ctrl + Z'],1,'Ctrl+C copia; Ctrl+X corta y Ctrl+V pega.'),
    _dq('d1-3','La postura correcta ante el ordenador exige que la pantalla esté:',['Muy por encima de los ojos','A la altura de los ojos','Por debajo de la mesa','En diagonal, a un lado'],1,'La parte superior de la pantalla debe quedar a la altura de los ojos.'),
    _dq('d1-4','¿Cuál de estos NO es un periférico de entrada?',['Teclado','Ratón','Escáner','Impresora'],3,'La impresora es de salida: muestra información, no la introduce.'),
    _dq('d1-5','En grabación de datos, la "posición de reposo" de los dedos se sitúa en la fila:',['Superior','Central o guía','Inferior','De números'],1,'La fila central o guía (ASDF - JKLÑ) es la posición de partida.')
  ],
  'demo-ex2':[
    _dq('d2-1','¿Qué extensión corresponde a un documento de texto plano?',['.txt','.exe','.mp3','.jpg'],0,'.txt es texto sin formato.'),
    _dq('d2-2','Una copia de seguridad sirve para:',['Acelerar el ordenador','Recuperar la información si se pierde','Aumentar la memoria RAM','Cambiar el sistema operativo'],1,'Su función es poder restaurar los datos ante una pérdida.'),
    _dq('d2-3','Al organizar archivos, una carpeta puede contener:',['Solo archivos','Solo carpetas','Archivos y otras carpetas','Un único archivo'],2,'Las carpetas admiten archivos y subcarpetas.'),
    _dq('d2-4','¿Qué dato NO debe compartirse por correo sin cifrar?',['El nombre de la empresa','La contraseña de acceso','El horario de apertura','La dirección web'],1,'Las credenciales nunca se envían en claro.')
  ],
  'demo-ex3':[
    _dq('d3-1','En una hoja de cálculo, una fórmula empieza siempre por:',['#','=','+','@'],1,'El signo igual indica al programa que lo que sigue es una fórmula.'),
    _dq('d3-2','¿Qué función suma un rango de celdas?',['PROMEDIO','CONTAR','SUMA','SI'],2,'SUMA(rango) devuelve el total del rango.'),
    _dq('d3-3','La celda situada en la columna B y la fila 4 se identifica como:',['4B','B4','B-4','#B4'],1,'Primero la letra de la columna y después el número de fila.'),
    _dq('d3-4','Ordenar una tabla de la A a la Z es un orden:',['Descendente','Ascendente','Aleatorio','Inverso'],1,'De la A a la Z es ascendente.'),
    _dq('d3-5','¿Qué ocurre al eliminar una fila referenciada por una fórmula?',['No pasa nada','La fórmula puede dar un error de referencia','Se borra la hoja','Se duplica la fórmula'],1,'Suele aparecer un error de referencia (#¡REF!).')
  ],
  'demo-h1':[
    _dq('h1-1','¿En qué año se proclamó la Segunda República española?',['1923','1931','1936','1939'],1,'Se proclamó el 14 de abril de 1931.'),
    _dq('h1-2','La Constitución republicana de 1931 reconoció por primera vez:',['El voto femenino','La monarquía parlamentaria','El sufragio censitario','El voto a partir de los 25 años'],0,'Reconoció el sufragio femenino, defendido por Clara Campoamor.'),
    _dq('h1-3','La Guerra Civil española se desarrolló entre:',['1931 y 1936','1936 y 1939','1939 y 1945','1934 y 1937'],1,'Del golpe de julio de 1936 al final de la guerra en abril de 1939.'),
    _dq('h1-4','La Transición española se sitúa cronológicamente:',['Antes de 1931','Durante la Guerra Civil','Tras la muerte de Franco en 1975','En 1812'],2,'Arranca en 1975 y culmina con la Constitución de 1978.')
  ],
  'demo-h2':[
    _dq('h2-1','La Constitución española vigente se aprobó en:',['1975','1976','1978','1982'],2,'Fue ratificada en referéndum el 6 de diciembre de 1978.'),
    _dq('h2-2','¿Qué ley permitió articular jurídicamente la Transición?',['Ley de Memoria Histórica','Ley para la Reforma Política','Ley de Bases','Ley Sálica'],1,'La Ley para la Reforma Política (1976) abrió el proceso.'),
    _dq('h2-3','El primer presidente del Gobierno elegido en las elecciones de 1977 fue:',['Felipe González','Leopoldo Calvo-Sotelo','Adolfo Suárez','Manuel Fraga'],2,'Adolfo Suárez, con UCD.')
  ]
};

/* ---------- Estructura (realista) y datos ficticios ---------- */
const DEMO_UNIDADES = [
  {id:'demo-u1', codigo:'MF0973_1', titulo:'Grabación de datos', modulo:'MF0973_1 · Grabación de datos', orden:1, estado:'activo', ver_megatest:true, ver_falladas:true, certificado_id:DEMO_CERT_ID, academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof'},
  {id:'demo-u2', codigo:'MF0974_1', titulo:'Tratamiento de datos, textos y documentación', modulo:'MF0974_1 · Tratamiento de datos', orden:2, estado:'activo', ver_megatest:false, ver_falladas:true, certificado_id:DEMO_CERT_ID, academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof'},
  // Aula Abierta · Marta Ruiz (Historia) y Javier Soto (Biología)
  {id:'aula-demo-hist', codigo:'HIST-XX', titulo:'BACHILLERATO|Historia de España · siglo XX', modulo:'Aula Abierta', orden:1, estado:'activo', ver_megatest:true, ver_falladas:true, certificado_id:null, academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof-aa1'},
  {id:'aula-demo-bio',  codigo:'BIO-CEL', titulo:'ESO|Biología · la célula',                  modulo:'Aula Abierta', orden:2, estado:'activo', ver_megatest:false, ver_falladas:false, certificado_id:null, academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof-aa1'}
];

const DEMO_EXAMENES = [
  {id:'demo-ex1', unidad:'demo-u1', numero:'1', titulo:'El puesto de trabajo y el teclado', tema:'Tema 1', nivel:'medio', orden:1, cuenta_final:false, tipo:'test', academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof', material_url:null, material_modo:null},
  {id:'demo-ex2', unidad:'demo-u1', numero:'2', titulo:'Archivos, carpetas y seguridad',    tema:'Tema 2', nivel:'medio', orden:2, cuenta_final:false, tipo:'test', academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof', material_url:null, material_modo:null},
  {id:'demo-ex3', unidad:'demo-u2', numero:'1', titulo:'Hojas de cálculo · examen final',   tema:'Tema 1', nivel:'medio', orden:1, cuenta_final:true,  tipo:'test', academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof', material_url:null, material_modo:null},
  {id:'demo-red', unidad:'demo-u2', numero:'2', titulo:'Informe escrito (redacción)',       tema:'Tema 2', nivel:'medio', orden:2, cuenta_final:false, tipo:'redaccion', academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof', material_url:null, material_modo:null},
  {id:'demo-h1',  unidad:'aula-demo-hist', numero:'1', titulo:'De la República a la Guerra Civil', tema:'Tema 1', nivel:'medio', orden:1, cuenta_final:false, tipo:'test', academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof-aa1', material_url:null, material_modo:null},
  {id:'demo-h2',  unidad:'aula-demo-hist', numero:'2', titulo:'La Transición',                     tema:'Tema 2', nivel:'medio', orden:2, cuenta_final:true,  tipo:'test', academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof-aa1', material_url:null, material_modo:null},
  {id:'demo-b1',  unidad:'aula-demo-bio',  numero:'1', titulo:'La célula · trabajo escrito',       tema:'Tema 1', nivel:'medio', orden:1, cuenta_final:false, tipo:'redaccion', academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof-aa1', material_url:null, material_modo:null}
];

function _dFecha(d){ const x=new Date(); x.setDate(x.getDate()-d); return x.toISOString(); }

const DEMO_INTENTOS = [
  {id:'di1', examen_id:'demo-ex1', correctas:3, total:5, creado_en:_dFecha(12)},
  {id:'di2', examen_id:'demo-ex1', correctas:5, total:5, creado_en:_dFecha(9)},
  {id:'di3', examen_id:'demo-ex2', correctas:3, total:4, creado_en:_dFecha(6)},
  {id:'di4', examen_id:'demo-ex3', correctas:4, total:5, creado_en:_dFecha(2)},
  {id:'di5', examen_id:'demo-h1',  correctas:3, total:4, creado_en:_dFecha(5)}
];

const DEMO_ENTREGAS = [
  {examen_id:'demo-red', estado:'corregido', nota:7.5, user_id:'demo-alumno'}
];

const DEMO_PERFILES = [
  {id:'demo-alumno',  nombre:'Lucía Fernández (demo)', rol:'alumno',   academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof'},
  {id:'demo-alumno2', nombre:'Andrés Vega (demo)',     rol:'alumno',   academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof'},
  {id:'demo-prof',    nombre:'Elena Ortiz (demo)',     rol:'profesor', academia_id:DEMO_ACADEMIA, profesor_id:null},
  {id:'demo-prof-aa1',nombre:'Marta Ruiz (demo)',      rol:'profesor', academia_id:DEMO_ACADEMIA, profesor_id:null},
  {id:'demo-prof-aa2',nombre:'Javier Soto (demo)',     rol:'profesor', academia_id:DEMO_ACADEMIA, profesor_id:null}
];

/* ---------- Interceptor de call() ---------- */
function demoResponder(path, opts){
  const m=(opts&&opts.method)||'GET';
  const body=(opts&&opts.body)||{};
  const p=String(path||'');

  // Escrituras sobre tablas: SIEMPRE bloqueadas. Solo las RPC pueden ir por POST
  // (las de lectura), y esas se resuelven una a una más abajo.
  if(m!=='GET' && p.indexOf('/rest/v1/rpc/')!==0) return undefined;

  if(p.indexOf('/rest/v1/unidades')===0) return DEMO_UNIDADES.map(u=>({...u}));
  if(p.indexOf('/rest/v1/examenes?select=id,tipo')===0) return DEMO_EXAMENES.map(e=>({id:e.id,tipo:e.tipo}));
  if(p.indexOf('/rest/v1/examenes')===0) return DEMO_EXAMENES.map(e=>({...e}));
  if(p.indexOf('/rest/v1/perfiles')===0) return [ {...(window._demoPerfil||DEMO_PERFILES[0])} ];
  if(p.indexOf('/rest/v1/intentos')===0) return DEMO_INTENTOS.map(x=>({...x}));
  if(p.indexOf('/rest/v1/entregas')===0) return DEMO_ENTREGAS.map(x=>({...x}));
  if(p.indexOf('/rest/v1/temario')===0) return [];
  if(p.indexOf('/rest/v1/academia')===0) return [{nombre:'Academia Demo', nombre_aula_abierta:'Aula Abierta Demo'}];
  if(p.indexOf('/rest/v1/certificados')===0) return [{codigo:'DEMO0508', nombre:'Operaciones de grabación y tratamiento de datos y documentos (demostración)'}];

  if(p.indexOf('/rest/v1/rpc/estados_de_certificado')===0)
    return DEMO_UNIDADES.map(u=>({unidad_id:u.id, estado:u.estado, ver_megatest:u.ver_megatest, ver_falladas:u.ver_falladas}));
  if(p.indexOf('/rest/v1/rpc/examenes_publicados_academia')===0)
    return DEMO_EXAMENES.map(e=>({examen_id:e.id, publicado:true}));
  if(p.indexOf('/rest/v1/rpc/resumen_falladas')===0)
    return [{unidad:'demo-u1', n:2}];

  if(p.indexOf('/rest/v1/rpc/obtener_examen')===0){
    const qs=DEMO_PREGUNTAS[body.p_examen_id]||[];
    return qs.map(q=>({id:q.id, enunciado:q.enunciado, opciones:q.opciones.slice(), explicacion:q.explicacion}));
  }
  if(p.indexOf('/rest/v1/rpc/obtener_megatest')===0 || p.indexOf('/rest/v1/rpc/obtener_falladas')===0){
    const todas=[].concat(DEMO_PREGUNTAS['demo-ex1']||[], DEMO_PREGUNTAS['demo-ex2']||[]);
    return todas.map(q=>({id:q.id, enunciado:q.enunciado, opciones:q.opciones.slice(), explicacion:q.explicacion}));
  }
  if(p.indexOf('/rest/v1/rpc/corregir_examen')===0 || p.indexOf('/rest/v1/rpc/corregir_preguntas')===0){
    const resp=body.p_respuestas||{};
    let banco=DEMO_PREGUNTAS[body.p_examen_id];
    if(!banco) banco=[].concat(DEMO_PREGUNTAS['demo-ex1']||[], DEMO_PREGUNTAS['demo-ex2']||[]);
    const usadas=banco.filter(q=>Object.prototype.hasOwnProperty.call(resp,q.id)||true);
    let ok=0, mal=0, blanco=0;
    const detalle=usadas.map(q=>{
      const el=(resp[q.id]!==undefined&&resp[q.id]!==null)?resp[q.id]:-1;
      if(el<0) blanco++; else if(el===q.correcta) ok++; else mal++;
      return {pregunta_id:q.id, enunciado:q.enunciado, opciones:q.opciones.slice(), correcta:q.correcta, elegida:el, explicacion:q.explicacion};
    });
    return {correctas:ok, incorrectas:mal, en_blanco:blanco, total:usadas.length, detalle};
  }
  if(p.indexOf('/rest/v1/rpc/obtener_redaccion')===0)
    return [{id:'dr1', enunciado:'Redacta un informe breve (unas 10 líneas) explicando cómo organizarías los archivos de un departamento y qué copias de seguridad harías.', material_url:null, material_modo:null}];

  if(p.indexOf('/rest/v1/rpc/resumen_alumnado')===0)
    return [
      {user_id:'demo-alumno',  nombre:'Lucía Fernández (demo)',  email:'lucia@demo.local',  n_intentos:4, media:7.8},
      {user_id:'demo-alumno2', nombre:'Andrés Vega (demo)',      email:'andres@demo.local', n_intentos:2, media:5.5}
    ];
  if(p.indexOf('/rest/v1/rpc/resultados_alumnado')===0)
    return DEMO_INTENTOS.map(i=>({user_id:'demo-alumno', nombre:'Lucía Fernández (demo)', examen_id:i.examen_id, correctas:i.correctas, total:i.total, creado_en:i.creado_en}));
  if(p.indexOf('/rest/v1/rpc/listar_entregas')===0)
    return [{id:'de1', examen_id:'demo-red', examen:'Informe escrito (redacción)', user_id:'demo-alumno', alumno:'lucia@demo.local', nombre:'Lucía Fernández (demo)', estado:'corregido', nota:7.5, comentario:'Buen planteamiento. [[Falta concretar cada cuánto se hace la copia]]', creado_en:_dFecha(3), respuestas:[{enunciado:'Redacta un informe breve…', texto:'Organizaría los archivos por departamento y año, con una carpeta por cada proyecto…'}]}];
  if(p.indexOf('/rest/v1/rpc/listar_registrados')===0)
    return DEMO_PERFILES.filter(x=>x.rol==='alumno').map(x=>({...x, email:x.id+'@demo.local'}));
  if(p.indexOf('/rest/v1/rpc/listar_invitaciones')===0) return [];

  // RPC que escriben (entregar_redaccion, reabrir_intento, crear_*, guardar_*…): bloqueadas.
  if(/\/rpc\/(entregar_|reabrir_|crear_|guardar_|borrar_|eliminar_|publicar_|actualizar_|set_|upsert_)/.test(p)) return undefined;

  if(m!=='GET') return undefined;   // cualquier escritura: bloqueada
  return [];                        // lectura desconocida: vacío, sin romper
}

/* ---------- Entrada, banda y salida ---------- */
function demoBanda(){
  let b=document.getElementById('demo-banda');
  if(!b){
    b=document.createElement('div'); b.id='demo-banda';
    b.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#1e2252;color:#fff;'+
      'font-size:.78rem;padding:9px 12px;display:flex;gap:10px;align-items:center;justify-content:center;'+
      'box-shadow:0 -3px 14px rgba(0,0,0,.25);flex-wrap:wrap';
    b.innerHTML='<span><b>DEMO</b> — todos los datos son inventados. Nada se guarda.</span>'+
      '<button onclick="demoSalir()" style="background:var(--honey);color:#fff;border:0;border-radius:8px;padding:6px 12px;font-weight:800;font-size:.75rem;cursor:pointer">Salir de la demo</button>';
    document.body.appendChild(b);
    document.body.style.paddingBottom='52px';
  }
}
function demoSalir(){
  window._demoMode=false;
  const b=document.getElementById('demo-banda'); if(b) b.remove();
  document.body.style.paddingBottom='';
  location.reload();
}
function demoPortal(){
  const h=`<div class="portal-card" style="text-align:left">
    <h2 style="margin-bottom:6px">Demo de Aptuvia</h2>
    <p style="margin-bottom:12px">Vas a ver la plataforma por dentro, sin registrarte y sin dejar ningún dato.</p>
    <div style="border:1.5px solid var(--honey);background:#f4fbf5;border-radius:12px;padding:12px;margin-bottom:14px">
      <p style="margin:0 0 8px;font-size:.85rem"><b>Todo lo que vas a ver es inventado.</b> La academia, los profesores, los alumnos, las preguntas, las respuestas y las notas son ficticios, creados solo para esta demostración. No son contenido real de ningún curso ni de ninguna academia.</p>
      <p style="margin:0;font-size:.85rem">La <b>estructura</b> sí es real: módulos y unidades formativas tal y como los verías el primer día.</p>
    </div>
    <p style="font-size:.85rem;margin-bottom:14px">Es un recorrido de <b>solo lectura</b>: puedes moverte por todas las pantallas, pero nada se guarda.</p>
    <button class="btn btn-portal" onclick="demoEntrar('prof')"      style="background:linear-gradient(to right,#fdf1dd,#f3cf8e);border:1.5px solid var(--honey);color:var(--navy);font-weight:800;margin-bottom:8px">Profesor · Aptuvia</button>
    <button class="btn btn-portal" onclick="demoEntrar('alumno')"    style="background:linear-gradient(to right,#fdf1dd,#f3cf8e);border:1.5px solid var(--honey);color:var(--navy);font-weight:800;margin-bottom:8px">Alumno · Aptuvia</button>
    <button class="btn btn-portal" onclick="demoEntrar('aa-prof')"   style="background:linear-gradient(to right,#eaf6fd,#7fc3e8);border:1.5px solid var(--honey);color:var(--navy);font-weight:800;margin-bottom:8px">Profesor · Aula Abierta</button>
    <button class="btn btn-portal" onclick="demoEntrar('aa-alumno')" style="background:linear-gradient(to right,#eaf6fd,#7fc3e8);border:1.5px solid var(--honey);color:var(--navy);font-weight:800;margin-bottom:8px">Alumno · Aula Abierta</button>
    <button class="btn btn-ghost btn-portal" onclick="location.href='/'">← Volver</button>
    <p style="font-size:.75rem;color:var(--ink-soft);margin-top:12px">¿Prefieres verlo con tu certificado y tus contenidos? Escríbenos a contacto@aptuvia.es</p>
  </div>`;
  const cont=document.querySelector('#portal .portal-card');
  if(cont) cont.outerHTML=h;
}
async function demoEntrar(perfil){
  window._demoMode=true;
  window._saImpersona=false; window._saImpersonaProf=null; window._saImpersonaAA=false;
  token='demo'; refreshToken=null;
  userAcademia=DEMO_ACADEMIA;
  // OJO: loadData() machaca userRol/userId/userProfesorId con perfil[0]. Por eso la
  // demo fija aquí window._demoPerfil y /rest/v1/perfiles devuelve SOLO esa fila.
  if(perfil==='prof'){                 // Profesor · Aptuvia (EV)
    window._demoPerfil={id:'demo-prof', nombre:'Elena Ortiz (demo)', rol:'profesor', academia_id:DEMO_ACADEMIA, profesor_id:null};
    window._activeCertId=DEMO_PORTAL_ID;
  }else if(perfil==='aa-prof'){        // Profesor · Aula Abierta
    window._demoPerfil={id:'demo-prof-aa1', nombre:'Marta Ruiz (demo)', rol:'profesor', academia_id:DEMO_ACADEMIA, profesor_id:null};
    window._activeCertId='__aula_abierta';
  }else if(perfil==='aa-alumno'){      // Alumno · Aula Abierta
    window._demoPerfil={id:'demo-alumno', nombre:'Lucía Fernández (demo)', rol:'alumno', academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof-aa1'};
    window._activeCertId='__aula_abierta';
  }else{                               // Alumno · Aptuvia (EV)
    window._demoPerfil={id:'demo-alumno', nombre:'Lucía Fernández (demo)', rol:'alumno', academia_id:DEMO_ACADEMIA, profesor_id:'demo-prof'};
    window._activeCertId=DEMO_PORTAL_ID;
  }
  userRol=window._demoPerfil.rol; userId=window._demoPerfil.id; userName=window._demoPerfil.nombre;
  userProfesorId=window._demoPerfil.profesor_id;
  userEmail=(userRol==='profesor')?'profesor@demo.local':'alumno@demo.local';
  const esAA = (window._activeCertId==='__aula_abierta');
  window._certCodigo = esAA ? 'AULA ABIERTA' : 'DEMO0508';
  window._certNombre = esAA ? 'Formación libre (demostración)'
                            : 'Operaciones de grabación y tratamiento de datos y documentos (demostración)';
  applyTema(window._activeCertId);
  // Mismo destape de vistas que hace doLogin(): sin esto la app queda en blanco.
  $('portal').classList.add('hidden');
  $('login').classList.add('hidden');
  $('app').classList.remove('hidden');
  sbRender();
  demoBanda();
  try{ await loadData(); }
  catch(e){ appAlert('No se pudo abrir la demo: '+(e.message||'')); }
}

