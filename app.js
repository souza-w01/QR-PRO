const CHAVE = 'qrs_do_zero';

let qrs = JSON.parse(localStorage.getItem(CHAVE)) || [];
let editando = null;

const form = document.getElementById('formQr');
const idEdicao = document.getElementById('idEdicao');
const nome = document.getElementById('nome');
const link = document.getElementById('link');
const cor = document.getElementById('cor');
const fundo = document.getElementById('fundo');
const btnCancelar = document.getElementById('btnCancelar');
const grid = document.getElementById('grid');
const vazio = document.getElementById('vazio');
const total = document.getElementById('total');

function salvar() {
  localStorage.setItem(CHAVE, JSON.stringify(qrs));
  render();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const item = {
    id: editando || Date.now().toString(),
    nome: nome.value.trim(),
    link: link.value.trim(),
    cor: cor.value,
    fundo: fundo.value,
    atualizado: Date.now()
  };
  if (editando) {
    qrs = qrs.map((x) => (x.id === editando ? item : x));
  } else {
    qrs.push(item);
  }
  salvar();
  form.reset();
  idEdicao.value = '';
  editando = null;
  btnCancelar.style.display = 'none';
});

btnCancelar.addEventListener('click', () => {
  form.reset();
  idEdicao.value = '';
  editando = null;
  btnCancelar.style.display = 'none';
});

window.editar = (id) => {
  const item = qrs.find((x) => x.id === id);
  if (!item) return;
  editando = id;
  idEdicao.value = item.id;
  nome.value = item.nome;
  link.value = item.link;
  cor.value = item.cor;
  fundo.value = item.fundo;
  btnCancelar.style.display = 'inline-block';
  form.scrollIntoView({ behavior: 'smooth' });
};

window.excluir = (id) => {
  if (!confirm('Excluir este QR?')) return;
  qrs = qrs.filter((x) => x.id !== id);
  salvar();
};

window.copiar = async (texto) => {
  await navigator.clipboard.writeText(texto);
  alert('Link copiado!');
};

window.baixar = (id) => {
  const preview = document.getElementById('preview-' + id);
  const canvas = preview.querySelector('canvas');
  if (!canvas) return;
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'qr-' + id + '.png';
  a.click();
};

function render() {
  grid.innerHTML = '';
  total.textContent = qrs.length;
  if (qrs.length === 0) {
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';
  const ordenados = [...qrs].sort((a, b) => b.atualizado - a.atualizado);
  ordenados.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div class="preview" id="preview-${item.id}"></div>
      <h3>${escape(item.nome)}</h3>
      <div class="link" title="${escape(item.link)}">${escape(item.link)}</div>
      <div class="acoes">
        <button onclick="editar('${item.id}')">Editar</button>
        <button onclick="copiar('${escape(item.link)}')">Copiar</button>
        <button onclick="baixar('${item.id}')">Baixar</button>
        <button class="btn-excluir" onclick="excluir('${item.id}')">Excluir</button>
      </div>
    `;
    grid.appendChild(div);
    new QRCode('preview-' + item.id, {
      text: item.link,
      width: 150,
      height: 150,
      colorDark: item.cor,
      colorLight: item.fundo,
      correctLevel: QRCode.CorrectLevel.H
    });
  });
}

document.querySelector('.btn-limpar').addEventListener('click', () => {
  if (qrs.length === 0) return;
  if (!confirm('Limpar todos os QRs?')) return;
  qrs = [];
  salvar();
});

document.querySelector('.btn-exportar').addEventListener('click', () => {
  const json = JSON.stringify(qrs, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'backup-qrs.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.querySelector('.btn-importar').addEventListener('click', () => {
  document.getElementById('arquivoImportar').click();
});

document.getElementById('arquivoImportar').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const leitor = new FileReader();
  leitor.onload = (ev) => {
    try {
      const dados = JSON.parse(ev.target.result);
      if (!Array.isArray(dados)) throw new Error();
      qrs.push(...dados);
      salvar();
    } catch (err) {
      alert('Arquivo inválido.');
    }
  };
  leitor.readAsText(file);
});

function escape(texto) {
  const d = document.createElement('div');
  d.textContent = texto;
  return d.innerHTML;
}

render();
