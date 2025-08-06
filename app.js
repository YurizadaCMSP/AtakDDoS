const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const autocannon = require('autocannon');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para iniciar testes
app.post('/api/test', (req, res) => {
  const { target, rps, duration } = req.body;
  
  if (!target || !rps || !duration) {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }
  
  // Validar URL
  let url = target;
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    url = 'https://' + target;
  }
  
  res.status(200).json({ message: 'Teste iniciado', id: Date.now() });
  
  // Iniciar teste de carga
  startLoadTest(url, parseInt(rps), parseInt(duration));
});

// Socket.IO para comunicação em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado');
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Função para iniciar teste de carga
function startLoadTest(url, rps, duration) {
  console.log(`Iniciando teste para ${url} com ${rps} req/s por ${duration} segundos`);
  
  const instance = autocannon({
    url,
    connections: Math.min(rps, 100), // Número de conexões simultâneas
    duration: duration,
    amount: undefined,
    requests: [
      {
        method: 'GET',
      }
    ],
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  // Emitir atualizações em tempo real
  instance.on('tick', (metrics) => {
    io.emit('testUpdate', {
      timestamp: Date.now(),
      metrics: {
        statusCodeStats: metrics.statusCodeStats,
        rps: metrics.rps,
        latency: metrics.latency,
        throughput: metrics.throughput,
        errors: metrics.errors,
        timeouts: metrics.timeouts,
        mismatches: metrics.mismatches,
        non2xx: metrics.non2xx,
      }
    });
  });

  // Quando o teste terminar
  instance.on('done', (results) => {
    io.emit('testComplete', {
      timestamp: Date.now(),
      results
    });
    console.log('Teste concluído');
  });

  // Tratamento de erros
  instance.on('error', (err) => {
    io.emit('testError', {
      timestamp: Date.now(),
      error: err.message
    });
    console.error('Erro no teste:', err);
  });
}

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Acesse esta URL no navegador do seu dispositivo');
});
