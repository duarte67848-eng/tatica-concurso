import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-yellow-500 mb-4 tracking-wider">
          TÁTICA CONCURSO
        </h1>
        <p className="text-xl text-gray-400 mb-2">
          Sistema de Simulados Militares
        </p>
        <div className="hud-line w-64 mx-auto my-6"></div>
        <p className="text-gray-500">
          Prepare-se para a promoção e concursos militares
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
        <Link href="/login" className="block">
          <div className="military-card hover:border-yellow-500 transition-all cursor-pointer">
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">
              ENTRAR
            </h2>
            <p className="text-gray-400">
              Acesse sua conta para iniciar simulados
            </p>
          </div>
        </Link>

        <Link href="/dashboard" className="block">
          <div className="military-card hover:border-yellow-500 transition-all cursor-pointer">
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">
              DASHBOARD
            </h2>
            <p className="text-gray-400">
              Verifique seu desempenho e ranking
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-4 gap-4 text-center">
        <div className="p-4 border border-gray-800 rounded">
          <div className="text-2xl font-bold text-yellow-500">4</div>
          <div className="text-sm text-gray-500">Disciplinas</div>
        </div>
        <div className="p-4 border border-gray-800 rounded">
          <div className="text-2xl font-bold text-yellow-500">100+</div>
          <div className="text-sm text-gray-500">Questões</div>
        </div>
        <div className="p-4 border border-gray-800 rounded">
          <div className="text-2xl font-bold text-yellow-500">PF</div>
          <div className="text-sm text-gray-500">Cálculo Automático</div>
        </div>
        <div className="p-4 border border-gray-800 rounded">
          <div className="text-2xl font-bold text-yellow-500">🏆</div>
          <div className="text-sm text-gray-500">Ranking</div>
        </div>
      </div>
    </div>
  );
}