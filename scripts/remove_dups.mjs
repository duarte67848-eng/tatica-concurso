const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbHFqYnJ3bG5ycGhqZXJ0aGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzUzODYsImV4cCI6MjA5Mzg1MTM4Nn0.hqMHqWMt4zMEAPmia-eEvFl1d-1K7c7WuC33dGRGUMs';

async function main() {
  const url = 'https://rclqjbrwlnrphjerthhv.supabase.co/rest/v1/biblioteca?select=*';
  const headers = { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY };
  
  const res = await fetch(url, { headers });
  const data = await res.json();
  
  if (!Array.isArray(data)) { console.log('Erro:', JSON.stringify(data)); return; }
  
  console.log('Total registros:', data.length);
  
  const groups = {};
  data.forEach(p => {
    const k = p.titulo + '|' + p.disciplina;
    if (!groups[k]) groups[k] = [];
    groups[k].push(p);
  });
  
  let removed = 0;
  for (const [key, items] of Object.entries(groups)) {
    if (items.length > 1) {
      const sorted = items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const keep = sorted[0];
      const toRemove = sorted.slice(1);
      
      console.log('Duplicata: "' + key + '" -> mantendo ID ' + keep.id + ', removendo IDs: ' + toRemove.map(x => x.id).join(', '));
      
      for (const dup of toRemove) {
        const delRes = await fetch('https://rclqjbrwlnrphjerthhv.supabase.co/rest/v1/biblioteca?id=eq.' + dup.id, {
          method: 'DELETE',
          headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json' }
        });
        if (delRes.ok) { removed++; console.log('  Removido ID', dup.id); }
        else { console.error('Erro ao remover ID', dup.id, await delRes.text()); }
      }
    }
  }
  
  if (removed === 0) console.log('Nenhuma duplicata encontrada.');
  else console.log('\nTotal de duplicatas removidas:', removed);
}

main().catch(console.error);
