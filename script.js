// === Seletores principais ===
const form = document.querySelector('form');
const tbody = document.getElementById('despesas');
const totalEl = document.getElementById('total');
const selectMes = document.getElementById('mes');

// === Modo Dark ===
let trilho = document.getElementById('trilho');
let body = document.body;
let container1 = document.getElementById('container');

// === Modo Dark com salvamento ===
const THEME_KEY = 'controleFinanceiro_tema';

function aplicarTema(tema) {
  const dark = tema === 'dark';
  trilho.classList.toggle('dark', dark);
  body.classList.toggle('dark', dark);
  container1.classList.toggle('dark', dark);

  document.querySelectorAll('input').forEach(el => {
    el.classList.toggle('dark', dark);
  });

  const indicadorTexto = trilho.querySelector('.indicador h6');
  indicadorTexto.textContent = dark ? 'Light' : 'Dark';
}

// 🔄 Carrega tema salvo
(function carregarTema() {
  const temaSalvo = localStorage.getItem(THEME_KEY) || 'dark'; // padrão: dark
  aplicarTema(temaSalvo);
})();

// 🌓 Alterna e salva o tema ao clicar
trilho.addEventListener('click', () => {
  const novoTema = trilho.classList.contains('dark') ? 'light' : 'dark';
  aplicarTema(novoTema);
  localStorage.setItem(THEME_KEY, novoTema);

  // remove foco do elemento ativo
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
});



// === Filtro de categoria ===
const filtroCategoria = document.createElement('select');
filtroCategoria.id = 'filtroCategoria';
filtroCategoria.style.marginBottom = '15px';
filtroCategoria.innerHTML = '<option value="">Todas</option>';
const container = document.querySelector('.container');

// 🔧 Sistema híbrido — insere o filtro antes da tabela, com ou sem wrapper
const wrapper = container.querySelector('.table-wrapper');
if (wrapper) container.insertBefore(filtroCategoria, wrapper);
else container.insertBefore(filtroCategoria, container.querySelector('table'));

// === LocalStorage ===
const STORAGE_KEY = 'controleFinanceiro_v2';

let store = { meses: {}, fixos: [] };

function sanitizarStoreData(obj) {
  if (!obj || typeof obj !== 'object') return;
  const propsParaRemover = ['disabled', 'bloqueado', 'blocked', 'disable'];
  function limpar(item) {
    if (Array.isArray(item)) return item.forEach(limpar);
    if (item && typeof item === 'object') {
      propsParaRemover.forEach(p => delete item[p]);
      if ('valor' in item) item.valor = Number(item.valor) || 0;
      if ('fixo' in item) item.fixo = !!item.fixo;
      if ('pago' in item) item.pago = !!item.pago;
      Object.values(item).forEach(limpar);
    }
  }
  limpar(obj);
}

function carregarStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      store.meses = parsed.meses || {};
      store.fixos = parsed.fixos || [];
      sanitizarStoreData(store.meses);
      sanitizarStoreData(store.fixos);
    } catch {
      store = { meses: {}, fixos: [] };
    }
  }
}

function salvarStore() {
  sanitizarStoreData(store.meses);
  sanitizarStoreData(store.fixos);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function aplicarFixosNoMes(mes) {
  if (!store.meses[mes]) store.meses[mes] = [];
  const lista = store.meses[mes];
  const meses = Array.from(selectMes.options).map(o => o.value);
  const idxAtual = meses.indexOf(mes);

  store.fixos.forEach(fixo => {
    const existe = lista.some(d => d.descricao === fixo.descricao && d.valor === fixo.valor && d.fixo);
    if (!existe) {
      const vencimentoAjustado = adicionarMeses(fixo.vencimento, idxAtual);
      lista.push({ ...fixo, vencimento: vencimentoAjustado });
    }
  });
}


// === Modal ===
function criarModalConfirmacao(msg) {
  return new Promise(resolve => {
    const fundo = document.createElement('div');
    fundo.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.5);display:flex;
      align-items:center;justify-content:center;z-index:9999;
    `;
    const caixa = document.createElement('div');
    caixa.style.cssText = `
      background:#212121;padding:20px 30px;border-radius:12px;
      box-shadow:0 4px 15px rgba(0,0,0,0.2);text-align:center;
    `;
    caixa.innerHTML = `
      <p style="font-size:16px; margin-bottom:20px;">${msg}</p>
      <button id="modalSim" style="background:#4CAF50;color:#fff;border:none;padding:8px 16px;margin-right:10px;border-radius:6px;cursor:pointer;">Sim</button>
      <button id="modalNao" style="background:#f44336;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">Não</button>
    `;
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    caixa.querySelector('#modalSim').onclick = () => {
      fundo.remove();
      resolve(true);
    };
    caixa.querySelector('#modalNao').onclick = () => {
      fundo.remove();
      resolve(false);
    };
  });
}

// === Atualizar filtro ===
function atualizarFiltroCategorias() {
  const mesAtual = selectMes.value;
  const lista = store.meses[mesAtual] || [];
  const categorias = [...new Set(lista.map(d => d.categoria).filter(c => c))];
  const valorAtual = filtroCategoria.value;
  filtroCategoria.innerHTML = '<option value="">Todas</option>';
  categorias.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    filtroCategoria.appendChild(opt);
  });
  if (valorAtual && categorias.includes(valorAtual)) filtroCategoria.value = valorAtual;
}

// === Renderização ===
function renderizarTabela() {
  const mesAtual = selectMes.value;
  if (!store.meses[mesAtual]) {
    store.meses[mesAtual] = [];
    aplicarFixosNoMes(mesAtual);
  }

  const lista = store.meses[mesAtual];
  const catSel = filtroCategoria.value;
  tbody.innerHTML = '';

  lista.forEach((item, index) => {
    if (catSel && item.categoria !== catSel) return;

    const tr = document.createElement('tr');
    const valorFmt = item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    tr.innerHTML = `
  <td data-label="Descrição" contenteditable="true" data-campo="descricao">${escapeHtml(item.descricao)}</td>
  <td data-label="Valor" contenteditable="true" data-campo="valor">R$${valorFmt}</td>
  <td data-label="Categoria" contenteditable="true" data-campo="categoria">${escapeHtml(item.categoria) || '-'}</td>
  <td data-label="Parcelas" contenteditable="true" data-campo="parcelas">${item.parcelas || '-'}</td>
  <td data-label="Vencimento" contenteditable="true" data-campo="vencimento">${item.vencimento || '-'}</td>
  <td data-label="Pago"><input type="checkbox" class="pago" ${item.pago ? 'checked' : ''}></td>
  <td data-label="excluir"><button type="button" class="excluir" data-index="${index}">Excluir</button></td>
`;

    if (item.fixo) tr.classList.add('fixo');
    if (item.pago) {
      tr.style.textDecoration = 'line-through';
      tr.style.opacity = '0.6';
    }
    tbody.appendChild(tr);
  });

  atualizarTotal();
  atualizarFiltroCategorias();
}

// === Total ===
function atualizarTotal() {
  const mesAtual = selectMes.value;
  const lista = store.meses[mesAtual] || [];
  const catSel = filtroCategoria.value;
  const total = lista
    .filter(d => !catSel || d.categoria === catSel)
    .reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
  totalEl.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// === Funções auxiliares ===
function normalizarValor(v) {
  if (!v) return 0;
  let s = String(v).trim();

  // Remove símbolos e espaços
  s = s.replace(/[R$\s]/g, '');

  // Se tiver vírgula, considera ela como separador decimal
  if (s.includes(',')) {
    s = s.replace(/\./g, ''); // remove pontos de milhar
    s = s.replace(',', '.');  // troca vírgula por ponto
  }

  // Mantém apenas números, ponto e sinal negativo
  s = s.replace(/[^\d.-]/g, '');

  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}


function escapeHtml(txt) {
  if (!txt) return '';
  return String(txt).replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])
  );
}

// === Função para somar meses em uma data ===
function adicionarMeses(dataStr, mesesParaAdicionar) {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const data = new Date(ano, mes - 1 + mesesParaAdicionar, dia);
  const anoNovo = data.getFullYear();
  const mesNovo = String(data.getMonth() + 1).padStart(2, '0');
  const diaNovo = String(data.getDate()).padStart(2, '0');
  return `${anoNovo}-${mesNovo}-${diaNovo}`;
}


// === Submissão do formulário ===
form.addEventListener('submit', e => {
  e.preventDefault();
  const descricao = document.getElementById('descrição').value.trim();
  const valorRaw = document.getElementById('valor').value.trim();
  const categoria = document.getElementById('categoria').value.trim();
  const parcelasInput = parseInt(document.getElementById('parcelas').value.trim()) || 1;
  const vencimento = document.getElementById('vencimento').value;
  const fixo = document.getElementById('fixo').checked;
  const mesAtual = selectMes.value;

  if (!descricao || !valorRaw) return alert('Preencha a descrição e o valor!');
  const valorNum = normalizarValor(valorRaw);
  if (isNaN(valorNum)) return alert('Digite um valor numérico válido.');

  if (!store.meses[mesAtual]) store.meses[mesAtual] = [];

  const meses = Array.from(selectMes.options).map(o => o.value);
  const idxAtual = meses.indexOf(mesAtual);

  for (let i = 0; i < parcelasInput; i++) {
    const mesAlvo = meses[(idxAtual + i) % meses.length];
    if (!store.meses[mesAlvo]) store.meses[mesAlvo] = [];

    // Ajustar vencimento da parcela (somar 1 mês a cada parcela)
    const vencimentoAjustado = adicionarMeses(vencimento, i);

    const obj = {
      descricao,
      valor: valorNum,
      categoria,
      parcelas: parcelasInput > 1 ? `${i + 1}/${parcelasInput}` : '-',
      vencimento: vencimentoAjustado,
      pago: false,
      fixo
    };
    store.meses[mesAlvo].push(obj);

    // Adiciona fixo apenas uma vez
    if (fixo && i === 0) {
      const existe = store.fixos.some(f => f.descricao === descricao && f.valor === valorNum);
      if (!existe) store.fixos.push({ ...obj });
    }
  }


  salvarStore();
  renderizarTabela();
  form.reset();
});

// === Clique e edição direta na tabela ===
tbody.addEventListener('click', async e => {
  const target = e.target;
  const mesAtual = selectMes.value;

  if (target.classList.contains('excluir')) {
    const idx = Number(target.dataset.index);
    if (!isNaN(idx)) {
      const item = store.meses[mesAtual][idx];

      // Confirmação para fixos
      if (item.fixo || (item.parcelas && item.parcelas.includes('/'))) {
        const confirmar = await criarModalConfirmacao(
          'Deseja excluir apenas este gasto deste mês? Os outros meses não serão afetados.'
        );
        if (!confirmar) return;
      }

      // Remove apenas o item do mês atual
      store.meses[mesAtual].splice(idx, 1);

      // Se o item for fixo, remove ele também da lista de fixos apenas se não houver mais ocorrências no store
      if (item.fixo) {
        const aindaExiste = Object.values(store.meses).some(lista =>
          lista.some(d => d.descricao === item.descricao && d.valor === item.valor && d.fixo)
        );
        if (!aindaExiste) {
          store.fixos = store.fixos.filter(f => !(f.descricao === item.descricao && f.valor === item.valor));
        }
      }

      salvarStore();
      renderizarTabela();
    }
  }

  if (target.classList.contains('pago')) {
    const linha = target.closest('tr');
    const idx = Array.from(tbody.children).indexOf(linha);
    if (!isNaN(idx)) {
      store.meses[mesAtual][idx].pago = target.checked;
      salvarStore();
      renderizarTabela();
    }
  }
});

// === Edição manual de células ===
tbody.addEventListener('blur', e => {
  const td = e.target;
  if (!td.matches('[contenteditable]')) return;

  const campo = td.dataset.campo;
  const valor = td.textContent.trim();
  const linha = td.closest('tr');
  const idx = Array.from(tbody.children).indexOf(linha);
  const mesAtual = selectMes.value;
  const item = store.meses[mesAtual][idx];
  if (!item) return;

  if (campo === 'valor') item.valor = normalizarValor(valor);
  else if (campo === 'parcelas') ajustarParcelasAutomaticamente(item, valor, mesAtual);
  else item[campo] = valor;

  salvarStore();
  renderizarTabela();
}, true);

// === Ajuste automático das parcelas ===
function ajustarParcelasAutomaticamente(item, novoValor, mesBase) {
  const match = String(novoValor).match(/^(\d+)(?:\/(\d+))?$/);
  if (!match) return;
  const novaQtd = parseInt(match[2] || match[1]);
  if (!novaQtd || isNaN(novaQtd)) return;

  const meses = Array.from(selectMes.options).map(o => o.value);
  const idxBase = meses.indexOf(mesBase);
  const descricao = item.descricao;

  meses.forEach(m => {
    if (store.meses[m])
      store.meses[m] = store.meses[m].filter(d => d.descricao !== descricao);
  });

  for (let i = 0; i < novaQtd; i++) {
    const mesAlvo = meses[(idxBase + i) % meses.length];
    if (!store.meses[mesAlvo]) store.meses[mesAlvo] = [];
    const novaParcela = { ...item, parcelas: novaQtd > 1 ? `${i + 1}/${novaQtd}` : '-' };
    store.meses[mesAlvo].push(novaParcela);
  }

  salvarStore();
  renderizarTabela();
}

// === Eventos principais ===
filtroCategoria.addEventListener('change', renderizarTabela);
selectMes.addEventListener('change', () => {
  const mes = selectMes.value;
  if (!store.meses[mes]) store.meses[mes] = [];
  aplicarFixosNoMes(mes);
  salvarStore();
  renderizarTabela();
});

// === Inicialização ===
carregarStore();
renderizarTabela();


// === Correção do placeholder do input date (vencimento) ===
(function () {
  const dateInput = document.getElementById('vencimento');
  if (!dateInput) return;

  function atualizarPlaceholder() {
    if (dateInput.value && dateInput.value.trim() !== '') {
      dateInput.classList.add('has-value');
    } else {
      dateInput.classList.remove('has-value');
    }
  }

  // Atualiza ao carregar e quando o valor mudar
  atualizarPlaceholder();
  dateInput.addEventListener('input', atualizarPlaceholder);
  dateInput.addEventListener('change', atualizarPlaceholder);
  dateInput.addEventListener('focus', () => dateInput.classList.add('has-value'));
  dateInput.addEventListener('blur', atualizarPlaceholder);
})();