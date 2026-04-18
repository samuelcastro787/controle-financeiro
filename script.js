// ===============================
// ==== ELEMENTOS DO DOM ====
// ===============================
const btnAdicionar = document.getElementById("btnAdicionar");
const modal = document.getElementById("modal");
const fecharModal = document.getElementById("fecharModal");
const topo = document.getElementById("topo");
const filtroCategoria = document.getElementById("filtroCategoria");
const totalCategoriaSpan = document.getElementById("totalCategoria");

const form = document.getElementById("formDespesa");
const tabela = document.getElementById("despesas");
const totalSpan = document.getElementById("total");
const selectMes = document.getElementById("mes");
const selectCategoria = document.getElementById("categoria");
const modalCategoria = document.getElementById("modalCategoria");

// ===============================
// ==== ESTADO DA APLICAÇÃO ====
// ===============================
let despesas = [];
let categorias = [];
let editandoId = null;
let idParaExcluir = null;
window.remover = remover;

// ===============================
// ==== LISTA DE MESES ====
// ===============================
const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// ===============================
// ==== EVENTOS - MODAL DESPESA ====
// ===============================
btnAdicionar.addEventListener("click", () => {
  modal.classList.add("active");
  topo.classList.remove("active2");
});

fecharModal.addEventListener("click", () => {
  modal.classList.remove("active");
  topo.classList.add("active2");
  editandoId = null;
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
    topo.classList.add("active2");
  }
});

const modalConfirmar = document.getElementById("modalConfirmar");
const btnConfirmar = document.getElementById("confirmarExcluir");
const btnCancelar = document.getElementById("cancelarExcluir");

btnConfirmar.addEventListener("click", () => {
  despesas = despesas.filter((d) => d.id !== idParaExcluir);

  salvarLocalStorage();
  render();

  modalConfirmar.classList.remove("active");
  idParaExcluir = null;
});

btnCancelar.addEventListener("click", () => {
  modalConfirmar.classList.remove("active");
  idParaExcluir = null;
});

// ===============================
// ==== EVENTO - TROCA DE MÊS ====
// ===============================
selectMes.addEventListener("change", () => {
  localStorage.setItem("mesSelecionado", selectMes.value);
  render();
});

// ===============================
// ==== LOCAL STORAGE (DESPESAS) ====
// ===============================
function salvarLocalStorage() {
  localStorage.setItem("despesas", JSON.stringify(despesas));
}

function carregarLocalStorage() {
  const dados = localStorage.getItem("despesas");
  if (dados) {
    despesas = JSON.parse(dados);
  }
}

// ===============================
// ==== LOCAL STORAGE (CATEGORIAS) ====
// ===============================
function salvarCategorias() {
  localStorage.setItem("categorias", JSON.stringify(categorias));
}

function carregarCategorias() {
  const dados = localStorage.getItem("categorias");
  if (dados) {
    categorias = JSON.parse(dados);
  }
}

// ===============================
// ==== SALVAR MÊS SELECIONADO ====
// ===============================
function carregarMesSelecionado() {
  const mesSalvo = localStorage.getItem("mesSelecionado");
  if (mesSalvo) {
    selectMes.value = mesSalvo;
  }
}

// ===============================
// ==== EVENTOS - CATEGORIA ====
// ===============================
selectCategoria.addEventListener("change", () => {
  if (selectCategoria.value === "nova") {
    modalCategoria.classList.add("active");
    renderCategoriasLista();
  }
});

document.getElementById("salvarCategoria").addEventListener("click", () => {
  const nome = document.getElementById("novaCategoriaNome").value;
  const cor = document.getElementById("novaCategoriaCor").value;

  if (!nome) return;

  categorias.push({
    id: Date.now(),
    nome,
    cor,
  });

  salvarCategorias();
  atualizarSelectCategorias();

  modalCategoria.classList.remove("active");
});

const fecharCategoria = document.getElementById("fecharCategoria");

fecharCategoria.addEventListener("click", () => {
  modalCategoria.classList.remove("active");
});

modalCategoria.addEventListener("click", (e) => {
  if (e.target === modalCategoria) {
    modalCategoria.classList.remove("active");
  }
});

// ===============================
// ==== ATUALIZAR SELECTS DE CATEGORIA ====
// ===============================
function atualizarSelectCategorias() {
  selectCategoria.innerHTML = `
    <option value="">Categoria</option>
    <option value="nova">+ Criar nova categoria</option>
  `;

  filtroCategoria.innerHTML = `
    <option value="">Todas categorias</option>
  `;

  categorias.forEach((cat) => {
    const option1 = document.createElement("option");
    option1.value = cat.id;
    option1.textContent = cat.nome;
    selectCategoria.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = cat.id;
    option2.textContent = cat.nome;
    filtroCategoria.appendChild(option2);
  });
}

// ===============================
// ==== LISTA DE CATEGORIAS ====
// ===============================
function renderCategoriasLista() {
  const lista = document.getElementById("listaCategorias");
  lista.innerHTML = "";

  categorias.forEach((cat) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span style="
        background:${cat.cor};
        padding:4px 8px;
        border-radius:15px;
        color:white;
      ">
        ${cat.nome}
      </span>

      <button onclick="removerCategoria(${cat.id})">
        Excluir
      </button>
    `;

    lista.appendChild(li);
  });
}

// ===============================
// ==== REMOVER CATEGORIA ====
// ===============================
function removerCategoria(id) {
  categorias = categorias.filter((c) => c.id !== id);

  despesas.forEach((d) => {
    if (d.categoria && d.categoria.id === id) {
      d.categoria = null;
    }
  });

  salvarCategorias();
  salvarLocalStorage();

  atualizarSelectCategorias();
  renderCategoriasLista();
  carregarMesSelecionado();
  render();
}

// ===============================
// ==== FILTRO DE CATEGORIA ====
// ===============================
filtroCategoria.addEventListener("change", render);

// ===============================
// ==== FORMATAR VALOR ====
// ===============================
function formatarValor(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ===============================
// ==== FORMULÁRIO (ADICIONAR / EDITAR) ====
// ===============================
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const descricao = document.getElementById("descricao").value;
  const valorInput = document.getElementById("valor").value;
  const valor = parseFloat(valorInput.replace(",", "."));
  const parcelas = parseInt(document.getElementById("parcelas").value) || 1;
  const categoriaId = parseInt(selectCategoria.value);
  const categoriaObj = categorias.find((c) => c.id === categoriaId);
  const fixo = document.getElementById("fixo").checked;
  const mesAtual = meses.indexOf(selectMes.value);

  if (editandoId) {
    const d = despesas.find((d) => d.id === editandoId);

    d.descricao = descricao;
    d.valor = valor;
    d.categoria = categoriaObj;
    d.parcelas = parcelas;
    d.fixo = fixo;

    editandoId = null;
  } else {
    despesas.push({
      id: Date.now(),
      descricao,
      valor,
      categoria: categoriaObj,
      parcelas,
      mesInicio: mesAtual,
      fixo,
      pagos: {},
    });
  }

  salvarLocalStorage();

  form.reset();
  modal.classList.remove("active");

  render();
});

// ===============================
// ==== FILTRAR DESPESAS POR MÊS ====
// ===============================
function despesasDoMes(mesIndex) {
  return despesas.filter((d) => {
    if (d.fixo) return true;

    const fim = d.mesInicio + d.parcelas - 1;
    return mesIndex >= d.mesInicio && mesIndex <= fim;
  });
}

// ===============================
// ==== RENDER (CORAÇÃO DO APP) ====
// ===============================
function render() {
  tabela.innerHTML = "";

  const mesIndex = meses.indexOf(selectMes.value);
  let lista = despesasDoMes(mesIndex);

  const filtroId = parseInt(filtroCategoria.value);

  if (filtroId) {
    lista = lista.filter((d) => d.categoria?.id === filtroId);
  }

  let total = 0;
  let totalCategoria = 0;

  lista.forEach((d) => {
    const card = document.createElement("div");
    card.classList.add("card-despesa");

    const parcelaAtual = mesIndex - d.mesInicio + 1;

    total += d.valor;
    totalCategoria += d.valor;

    const chave = `${d.id}-${mesIndex}`;
    const estaPago = d.pagos[chave];

    if (estaPago) {
      card.classList.add("pago");
    }

    card.innerHTML = `
      <div class="linha"><strong>Descrição:</strong> ${d.descricao}</div>
      <div class="linha valor"><strong>Valor:</strong> ${formatarValor(d.valor)}</div>

      <div class="linha">
        <strong>Categoria:</strong> 
        <span class="tag" style="background:${d.categoria?.cor}">
          ${d.categoria?.nome || "Sem categoria"}
        </span>
      </div>

      <div class="linha">
        <strong>Parcelas:</strong> ${d.fixo ? "Fixo" : `${parcelaAtual}/${d.parcelas}`}
      </div>

      <div class="linha pago-linha">
        <strong>Pago:</strong>
        <input type="checkbox"
          ${estaPago ? "checked" : ""}
          onchange="togglePago(${d.id}, ${mesIndex})">
      </div>

      <div class="botoes">
        <button onclick="editar(${d.id})" style="color: White;">Editar</button>
        <button onclick="remover(${d.id})">Excluir</button>
      </div>
    `;

    tabela.appendChild(card);
  });

  totalSpan.textContent = formatarValor(total);

  totalCategoriaSpan.textContent = filtroId
    ? `Total da categoria: ${formatarValor(totalCategoria)}`
    : "";
}

// ===============================
// ==== TOGGLE PAGO ====
// ===============================
function togglePago(id, mesIndex) {
  const despesa = despesas.find((d) => d.id === id);
  const chave = `${id}-${mesIndex}`;

  despesa.pagos[chave] = !despesa.pagos[chave];

  salvarLocalStorage();
  render();
}

// ===============================
// ==== REMOVER DESPESA ====
// ===============================
function remover(id) {
  console.log("clicou em excluir", id);
  idParaExcluir = id;
  modalConfirmar.classList.add("active");
}

// ===============================
// ==== EDITAR DESPESA ====
// ===============================
function editar(id) {
  const d = despesas.find((d) => d.id === id);

  document.getElementById("descricao").value = d.descricao;
  document.getElementById("valor").value = d.valor;
  selectCategoria.value = d.categoria?.id || "";
  document.getElementById("parcelas").value = d.parcelas;
  document.getElementById("fixo").checked = d.fixo;

  editandoId = id;

  modal.classList.add("active");
  topo.classList.remove("active2");
}

// ===============================
// ==== INICIALIZAÇÃO ====
// ===============================
carregarCategorias();
atualizarSelectCategorias();
carregarLocalStorage();
carregarMesSelecionado();
render();

// ===============================
// ==== SERVICE WORKER (PWA) ====
// ===============================
if ("serviceWorker" in navigator) {
  //navigator.serviceWorker
    //.register("service-worker.js")
    .then(() => console.log("Service Worker registrado"))
    .catch((err) => console.log("Erro SW:", err));
}
