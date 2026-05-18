const { createClient } = require('../node_modules/@supabase/supabase-js');
const supabase = createClient(
  'https://rclqjbrwlnrphjerthhv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbHFqYnJ3bG5ycGhqZXJ0aGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxODU4NjUsImV4cCI6MjA1ODc2MTg2NX0.p3BGHx3ne_1Nes3knm9rjThXMMHblWjk0KqZ12HzB7E'
);

async function main() {
  const { data } = await supabase.from('biblioteca').select('*');
  if (!data) { console.log('Nenhum dado encontrado'); return; }
  
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
        const { error } = await supabase.from('biblioteca').delete().eq('id', dup.id);
        if (error) console.error('Erro ao remover ID', dup.id, error.message);
        else { removed++; console.log('  Removido ID', dup.id); }
      }
    }
  }
  
  if (removed === 0) console.log('Nenhuma duplicata encontrada.');
  else console.log('\nTotal de duplicatas removidas: ' + removed);
}

main().catch(console.error);
