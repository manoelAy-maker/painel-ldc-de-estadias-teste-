const target = new URL(process.argv[2] || 'http://localhost:5173');
const users = 10;
const durationMs = 15_000;
const intervalMs = 500;
const timeoutMs = 8_000;
const startedAt = Date.now();
const results = [];

async function virtualUser(id) {
  while (Date.now() - startedAt < durationMs) {
    const requestStartedAt = performance.now();
    try {
      const response = await fetch(target, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          'User-Agent': `AYRES-Load-Test/1.0 user-${id}`,
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      await response.arrayBuffer();
      results.push({ ok: response.ok, status: response.status, duration: performance.now() - requestStartedAt });
    } catch (error) {
      results.push({
        ok: false,
        status: 0,
        duration: performance.now() - requestStartedAt,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

console.log('\nAYRES // TESTE DE CAPACIDADE');
console.log(`Alvo: ${target.href}`);
console.log(`Carga: ${users} usuarios simultaneos por ${durationMs / 1000}s\n`);

await Promise.all(Array.from({ length: users }, (_, index) => virtualUser(index + 1)));

const successful = results.filter((result) => result.ok);
const failed = results.length - successful.length;
const durations = successful.map((result) => result.duration).sort((a, b) => a - b);
const average = durations.length ? durations.reduce((total, duration) => total + duration, 0) / durations.length : 0;
const percentile95 = durations.length ? durations[Math.min(durations.length - 1, Math.ceil(durations.length * 0.95) - 1)] : 0;
const maximum = durations.length ? durations[durations.length - 1] : 0;
const failureRate = results.length ? (failed / results.length) * 100 : 100;

console.log('RESULTADO');
console.log(`Requisicoes: ${results.length}`);
console.log(`Sucesso: ${successful.length}`);
console.log(`Falhas: ${failed} (${failureRate.toFixed(1)}%)`);
console.log(`Tempo medio: ${average.toFixed(0)} ms`);
console.log(`P95: ${percentile95.toFixed(0)} ms`);
console.log(`Pior resposta: ${maximum.toFixed(0)} ms`);

let verdict = 'APROVADO';
let exitCode = 0;
if (failureRate > 2 || percentile95 > 2_000) {
  verdict = 'FALHOU';
  exitCode = 1;
} else if (failureRate > 0 || percentile95 > 1_000) {
  verdict = 'ATENCAO';
}
console.log(`Diagnostico: ${verdict}`);

if (failed > 0) {
  console.log('Exemplos de falha:');
  for (const result of results.filter((item) => !item.ok).slice(0, 3)) {
    console.log(`- HTTP ${result.status || 'sem resposta'}${result.error ? `: ${result.error}` : ''}`);
  }
}
process.exitCode = exitCode;
