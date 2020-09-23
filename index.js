const Koa = require('koa');
const server = new Koa();
const bodyparser = require('koa-bodyparser');

server.use(bodyparser());


const produtos = [
  {
    id: 1,
    nome: "mouse",
    quantidade: 30,
    valor: 7000,
    deletado: false
  },
  {
    id: 2,
    nome: "fone",
    quantidade: 30,
    valor: 7000,
    deletado: false
  },
  {
    id: 3,
    nome: "teclado",
    quantidade: 30,
    valor: 7000,
    deletado: false
  }
];
//Funções de produtos
const tratarErros = (ctx, mensagem, status = 404) => {
  ctx.status = status;
  ctx.body = {
    status: 'erro',
    dados: {
      mensagem: mensagem,
    },
  };
}

const tratarSucesso = (ctx, entidade, status = 200) => {
  ctx.status = status;  
  ctx.body ={
    status: 'sucesso',
    dados: entidade
  }
}

const verificaID = (ctx, urlQuebrada) => {
  let idValido = false;
  const id = Number(urlQuebrada[2].slice(1, urlQuebrada.length - 1));
  if (urlQuebrada.length === 3) {
    if (!isNaN(id) || id !== 0) {
    idValido = true;
    }
  }
  return idValido;
}

const tratarRequisicaoPOSTProduto = (ctx) => {
  let produtoJaCadastrado = false;
  let indice = 0;
  //verifica se produto ja existe
  for (let i = 0; i < produtos.length; i++) {
    if (ctx.request.body.nome === produtos[i].nome) {
      produtoJaCadastrado = true;
      indice = i;
    }
  } if (produtoJaCadastrado) {
    tratarErros(ctx, 'Produto já cadastrado.', 403);
  } else {
    const produto = {
      id: produtos.length + 1,
      nome: ctx.request.body.nome,
      quantidade: ctx.request.body.quantidade,
      valor: ctx.request.body.valor,
      deletado: false
    }
    produtos.push(produto);
    tratarSucesso(ctx, produtos, 201);
  }
}

const tratarRequisicaoGETProduto= (ctx) => {
  const urlQuebrada = ctx.url.split('/');
  if (urlQuebrada.length === 2) {
    ctx.body = produtos;
  } else if (verificaID(ctx, urlQuebrada)) {
    const id = Number(urlQuebrada[2].slice(1, urlQuebrada.length - 1));
    for (let i = 0; i < produtos.length; i++) {
      if (produtos[i].id === id) {
        ctx.body = produtos[i];
        ctx.status = 200;
        return;
      } else {
        tratarErros(ctx, 'Conteúdo não encontrado.');
      }
    }
  } else {
    tratarErros(ctx, 'Requisição mal-formatada', 400);
  }
}

const tratarRequisicaoPUTProduto= (ctx) => {
  const urlQuebrada = ctx.url.split('/');
  const id = Number(urlQuebrada[2].slice(1, urlQuebrada.length - 1));
  if (verificaID(ctx, urlQuebrada)) {
    if (ctx.request.body.propriedade !== 'deletado' && ctx.request.body.propriedade !== 'id') {
      for (let i = 0; i < produtos.length; i++) {
        if(produtos[i].id === id){
          if(!produtos[i].deletado){
            const propriedade = ctx.request.body.propriedade;
            produtos[i][propriedade] = ctx.request.body.valor; 
            ctx.body = produtos[i];
            return;
          } else{
            tratarErros(ctx, 'Ação não permitida', 403);
          }
        } else {
          tratarErros(ctx, 'Requisição mal-formatada', 400);
        }
      }
    } else{
      tratarErros(ctx, 'Ação não permitida', 403);
    }
  } else {
    tratarErros(ctx, 'Requisição mal-formatada', 400);
  }
}

const tratarRequisicaoDELETEProduto = (ctx) => {
  const urlQuebrada = ctx.url.split('/');
  const id = Number(urlQuebrada[2].slice(1, urlQuebrada.length - 1));
  if(verificaID(ctx, urlQuebrada)){
    for (let i = 0; i < produtos.length; i++) {
      if(produtos[i].id === id){
        produtos[i].deletado = true;
        ctx.body = produtos[i];
        return;
      }
    }
  }
}


const pedidos = [];
//Funções de pedidos
const tratarRequisicaoPOSTPedido = (ctx) =>{
  const idCliente = ctx.request.body.idCliente;
  if(idCliente){
    const novoPedido = {
      id: pedidos.length + 1,
      produtos:[],
      estado: 'Incompleto',
      idCliente: idCliente,
      deletado: false,
      valorTotal: 0,
    }
    pedidos.push(novoPedido);
    tratarSucesso(ctx, pedidos, 201);
    // ctx.body = novoPedido;
    return;
  } else{
    tratarErros(ctx, 'Requisição mal-formatada', 400);
  }
}

const tratarRequisicaoGETPedido = (ctx) =>{
  const urlQuebrada = ctx.url.split('/');
  const id = Number(urlQuebrada[2]);
  const pedidoAtual = pedidos[id - 1];
  if (id || id === 0){
    if (pedidoAtual){
      tratarSucesso(ctx, pedidoAtual);
    } else{
      tratarErros(ctx,'Conteúdo não encontrado');
    }
  } else{
    tratarSucesso(ctx, pedidos);
  }
}

const tratarRequisicaoPUTPedido = (ctx) =>{
  // QUANTIDADE
  const urlQuebrada = ctx.url.split('/');
  const quantidade = ctx.request.body.quantidade;

  const idPedido = Number(urlQuebrada[2]);
  const indicePedido = idPedido -1;
  
  const idProduto = ctx.request.body.novoProduto;
  const produtoEscolhido = produtos[idProduto - 1]

  if(idProduto && idPedido && quantidade){
    const produtoIncluido = {
      id: produtoEscolhido.id,
      nome: produtoEscolhido.nome,
      quantidade: quantidade,
      valor: produtoEscolhido.valor,
      deletado: produtoEscolhido.deletado,
    }
    pedidos[indicePedido].produtos.push(produtoIncluido);
    produtoEscolhido.quantidade -= quantidade;
    console.log(produtoEscolhido);
    tratarSucesso(ctx, pedidos[indicePedido]);
  } else{
    tratarErros(ctx, 'Mensagem mal-formatada', 400);
  }
}

const tratarRequisicaoDELETEPedido = (ctx)=>{
  const urlQuebrada = ctx.url.split('/');
  const id = Number(urlQuebrada[2]);
  const pedidoAtual = pedidos[id - 1];
  if(id && pedidos.length > 0){
    pedidoAtual.deletado = true;
    tratarSucesso(ctx, pedidos)
  } else{
    tratarErros(ctx, 'Conteúdo não encontrado');
  }
}

const rotasProdutos = (ctx)=>{
  if (ctx.method === 'POST') {
    tratarRequisicaoPOSTProduto(ctx);
  } else if (ctx.method === 'GET') {
    tratarRequisicaoGETProduto(ctx);
  } else if (ctx.methodProduto === 'PUT') {
    tratarRequisicaoPUTProduto(ctx);
  } else if (ctx.method === 'DELETE'){
    tratarRequisicaoDELETEProduto(ctx);
  } else {
    tratarErros(ctx,'Conteúdo não encontrado');
  }
}

const rotasPedidos = (ctx)=>{
  if (ctx.method === 'POST') {
    tratarRequisicaoPOSTPedido(ctx);
  } else if (ctx.method === 'GET') {
    tratarRequisicaoGETPedido(ctx);
  } else if (ctx.method === 'PUT') {
    tratarRequisicaoPUTPedido(ctx);
  } else if (ctx.method === 'DELETE'){
    tratarRequisicaoDELETEPedido(ctx);
  } else {
    tratarErros(ctx,'Conteúdo não encontrado');
  }
}

server.use((ctx) => {
  if (ctx.url.includes('/products')) {
    rotasProdutos(ctx);
  } else if(ctx.url.includes('/orders')){
    rotasPedidos(ctx);
  } else {
    tratarErros(ctx,'Conteúdo não encontrado');
  }
});

server.listen(8081, () => {
  console.log('Servidor rodando em 8081');
});