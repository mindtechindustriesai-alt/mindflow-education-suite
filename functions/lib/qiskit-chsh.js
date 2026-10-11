// functions/lib/qiskit-chsh.js
// CHSH circuit execution · Qiskit Runtime · IBM Kingston

const { QiskitRuntimeService, SamplerV2 } = require('@qiskit/ibm-runtime');

async function runCHSH({ token, crn, backend = 'ibm_kingston', shots = 1024 }) {
  if (!token || !crn) throw new Error('Missing IBM Quantum credentials');

  const service = new QiskitRuntimeService({ token, instance: crn });

  // CHSH measurement bases (angles in degrees)
  const bases = [
    { a: 0,   b: 45  },
    { a: 0,   b: -45 },
    { a: 90,  b: 45  },
    { a: 90,  b: -45 }
  ];

  const correlations = [];
  let jobId = null;

  for (const { a, b } of bases) {
    const circuit = buildCHSHCircuit(a, b);
    const sampler = new SamplerV2({ backend });
    const job = await sampler.run([circuit], { shots });
    jobId = job.jobId;
    const result = await job.result();
    correlations.push(computeCorrelation(result));
  }

  // S = E(a,b) - E(a,b') + E(a',b) + E(a',b')
  const S = correlations[0] - correlations[1] + correlations[2] + correlations[3];
  const avgCorr = correlations.reduce((x, y) => x + Math.abs(y), 0) / correlations.length;

  return {
    S: Number(S.toFixed(4)),
    correlation: Number((avgCorr * 100).toFixed(2)),
    backend,
    job_id: jobId,
    shots,
    bases
  };
}

function buildCHSHCircuit(aDeg, bDeg) {
  // This returns a Qiskit circuit in the format expected by the runtime
  // Simplified — the real circuit construction uses the qiskit Python bridge
  // For JS runtime, we send the parameters and the Python bridge builds it
  return {
    name: 'chsh',
    num_qubits: 2,
    parameters: {
      alice_angle: (aDeg * Math.PI) / 180,
      bob_angle: (bDeg * Math.PI) / 180
    }
  };
}

function computeCorrelation(result) {
  // Extract measurement counts for |00>, |01>, |10>, |11>
  const counts = result?.quasi_dists?.[0] || {};
  const total = Object.values(counts).reduce((x, y) => x + y, 0) || 1;
  const e00 = (counts['0'] || 0) / total;
  const e11 = (counts['3'] || 0) / total;
  const e01 = (counts['1'] || 0) / total;
  const e10 = (counts['2'] || 0) / total;
  return e00 + e11 - e01 - e10;
}

module.exports = { runCHSH };