const https = require('https');

function addFolder(titulo, disciplina, categoria) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      titulo: titulo,
      disciplina: disciplina,
      categoria: categoria,
      url: '',
      tamanho: 0,
      paginas: 0
    });

    const opts = {
      hostname: 'rclqjbrwlnrphjerthhv.supabase.co',
      path: '/rest/v1/biblioteca',
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbHFqYnJ3bG5ycGhqZXJ0aGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzUzODYsImV4cCI6MjA5Mzg1MTM4Nn0.hqMHqWMt4zMEAPmia-eEvFl1d-1K7c7WuC33dGRGUMs',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`${disciplina}: ${res.statusCode}`);
        resolve(res.statusCode);
      });
    });

    req.on('error', (e) => {
      console.error(`${disciplina}: error - ${e.message}`);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  await addFolder('CLPAP - Lingua Portuguesa', 'CLPAP', 'Geral');
  await addFolder('CPJM - Matematica', 'CPJM', 'Geral');
  await addFolder('CLIPM - Informatica', 'CLIPM', 'Geral');
  await addFolder('CP - Conhecimentos Gerais', 'CP', 'Geral');
}

main();