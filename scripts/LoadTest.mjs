const rawTarget = process.argv[2] || 'http://localhost:5173';
const rawUsers = process.argv[3] || '200';
const rawDurationSeconds = process.argv[4] || '60';
const intervalMs = 2_000;
const timeoutMs = 8_000;

let target;
try {
  target = new URL(rawTarget);
} catch {
  console.error('URL invalida. Use http://localhost:5173 ou https://seu-site.vercel.app');
  process.exit(2);
}
if (!['http:', 'https:'].includes(target.protocol)) {
  console.error('Somente URLs HTTP ou HTTPS podem ser testadas.');
  process.exit(2);
}

const users = Number.parseInt(rawUsers, 10);
if (!Number.isInteger(users) || users < 1 || users > 200) {
  console.error('A quantidade deve ser um numero inteiro entre 1 e 200 usuarios.');
  process.exit(2);
}
const durationSeconds = Number.parseInt(rawDurationSeconds, 10);
if (!Number.isInteger(durationSeconds) || durationSeconds < 5 || durationSeconds > 300) {
  console.error('A duracao deve ser um numero inteiro entre 5 e 300 segundos.');
  process.exit(2);
}
const durationMs = durationSeconds * 1_000;
const results = [];

try {
  const preflight = await fetch(target, {
    method: 'GET', cache: 'no-store', redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': 'AYRES-Capacity-Test/3.0 preflight' },
  });
  await preflight.arrayBuffer();
  if (!preflight.ok) throw new Error(`HTTP ${preflight.status}`);
} catch (error) {
  console.error(`O endereco nao respondeu: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
}

const startedAt = Date.now();
async function virtualUser(id) {
  while (Date.now() - startedAt < durationMs) {
    const requestStartedAt = performance.now();
    try {
      const response = await fetch(target, {
        method: 'GET', cache: 'no-store', redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          'User-Agent': `AYRES-Capacity-Test/3.0 user-${id}`,
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      await response.arrayBuffer();
      results.push({ ok: response.ok, status: response.status, duration: performance.now() - requestStartedAt });
    } catch (error) {
      results.push({
        ok: false, status: 0, duration: performance.now() - requestStartedAt,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

console.log('\nAYRES // TESTE DE CAPACIDADE');
console.log(`Alvo: ${target.href}`);
console.log(`Carga: ${users} usuarios simultaneos por ${durationSeconds}s`);
console.log('Operacao: somente leitura (GET)\n');
await Promise.all(Array.from({ length: users }, (_, index) => virtualUser(index + 1)));

const successful = results.filter((result) => result.ok);
const failed = results.length - successful.length;
const durations = successful.map((result) => result.duration).sort((a, b) => a - b);
const average = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 0;
const percentile95 = durations.length ? durations[Math.min(durations.length - 1, Math.ceil(durations.length * 0.95) - 1)] : 0;
const maximum = durations.length ? durations[durations.length - 1] : 0;
const failureRate = results.length ? (failed / results.length) * 100 : 100;
const elapsedSeconds = Math.max((Date.now() - startedAt) / 1_000, 0.001);
const requestsPerSecond = results.length / elapsedSeconds;

console.log('RESULTADO');
console.log(`Requisicoes: ${results.length}`);
console.log(`Sucesso: ${successful.length}`);
console.log(`Falhas: ${failed} (${failureRate.toFixed(1)}%)`);
console.log(`Vazao media: ${requestsPerSecond.toFixed(1)} requisicoes/s`);
console.log(`Tempo medio: ${average.toFixed(0)} ms`);
console.log(`P95: ${percentile95.toFixed(0)} ms`);
console.log(`Pior resposta: ${maximum.toFixed(0)} ms`);

let verdict = 'APROVADO';
let exitCode = 0;
if (failureRate > 2 || percentile95 > 2_000) { verdict = 'FALHOU'; exitCode = 1; }
else if (failureRate > 0 || percentile95 > 1_000) verdict = 'ATENCAO';
console.log(`Diagnostico: ${verdict}`);
if (failed > 0) {
  console.log('Exemplos de falha:');
  for (const result of results.filter((item) => !item.ok).slice(0, 3)) {
    console.log(`- HTTP ${result.status || 'sem resposta'}${result.error ? `: ${result.error}` : ''}`);
  }
}
console.log('\nEste teste mede pagina e hospedagem. Login e gravacoes no Supabase exigem teste funcional separado.');
process.exitCode = exitCode;
