// Renderiza o texto da dica em elementos React, sem injetar HTML cru — assim
// nada que for digitado no painel pode virar código executável na página.
// Formato aceito: linha começando com "## " vira subtítulo, linhas com "- "
// viram lista, "1. " vira lista numerada, e **texto** fica em negrito.

function comNegrito(texto, chaveBase) {
  const partes = String(texto).split(/(\*\*[^*]+\*\*)/g);
  return partes.map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') && parte.length > 4 ? (
      <strong key={`${chaveBase}-${i}`}>{parte.slice(2, -2)}</strong>
    ) : (
      parte
    ),
  );
}

export default function PostBody({ body }) {
  const linhas = String(body || '').split('\n');
  const blocos = [];
  let listaAtual = null;

  const fechaLista = () => {
    if (listaAtual) {
      blocos.push(listaAtual);
      listaAtual = null;
    }
  };

  linhas.forEach((linhaCrua, i) => {
    const linha = linhaCrua.trim();

    if (!linha) {
      fechaLista();
      return;
    }

    if (linha.startsWith('## ')) {
      fechaLista();
      blocos.push(
        <h3 key={`h-${i}`} className="post-h">
          {linha.slice(3)}
        </h3>,
      );
      return;
    }

    const itemLista = linha.match(/^[-•]\s+(.*)$/);
    const itemNumero = linha.match(/^\d+\.\s+(.*)$/);

    if (itemLista || itemNumero) {
      const tipo = itemLista ? 'ul' : 'ol';
      const texto = (itemLista || itemNumero)[1];
      if (!listaAtual || listaAtual.type !== tipo) {
        fechaLista();
        listaAtual = { type: tipo, key: `l-${i}`, itens: [] };
      }
      listaAtual.itens.push(
        <li key={`li-${i}`}>{comNegrito(texto, `li-${i}`)}</li>,
      );
      return;
    }

    fechaLista();
    blocos.push(
      <p key={`p-${i}`}>{comNegrito(linha, `p-${i}`)}</p>,
    );
  });

  fechaLista();

  return (
    <div className="post-body">
      {blocos.map((bloco) =>
        bloco && bloco.itens
          ? bloco.type === 'ul'
            ? (
                <ul key={bloco.key} className="post-list">
                  {bloco.itens}
                </ul>
              )
            : (
                <ol key={bloco.key} className="post-list post-list-num">
                  {bloco.itens}
                </ol>
              )
          : bloco,
      )}
    </div>
  );
}
