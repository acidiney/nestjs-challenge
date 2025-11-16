import { sleep } from 'k6';
import http from 'k6/http';

const READ_TOTAL = parseInt(__ENV.READ_TOTAL || '100000', 10);
const WRITE_TOTAL = parseInt(__ENV.WRITE_TOTAL || '50000', 10);
const READ_VUS = parseInt(__ENV.READ_VUS || '128', 10);
const WRITE_VUS = parseInt(__ENV.WRITE_VUS || '64', 10);
const TARGET_RECORD_QTY = Math.min(
  parseInt(__ENV.TARGET_RECORD_QTY || '100', 10),
  100,
);
const RACE_WRITE_TOTAL = parseInt(
  __ENV.RACE_WRITE_TOTAL || String(TARGET_RECORD_QTY),
  10,
);
const BULK_WRITE_TOTAL = Math.max(WRITE_TOTAL - RACE_WRITE_TOTAL, 0);

export const options = {
  scenarios: {
    reads: {
      executor: 'shared-iterations',
      iterations: READ_TOTAL,
      vus: READ_VUS,
      exec: 'reads',
      maxDuration: '60m',
    },
    raceWrites: {
      executor: 'shared-iterations',
      iterations: RACE_WRITE_TOTAL,
      vus: WRITE_VUS,
      startTime: '0s',
      exec: 'raceWrites',
      maxDuration: '60m',
    },
    ...(BULK_WRITE_TOTAL > 0
      ? {
          bulkWrites: {
            executor: 'shared-iterations',
            iterations: BULK_WRITE_TOTAL,
            vus: WRITE_VUS,
            startTime: '0s',
            exec: 'bulkWrites',
            maxDuration: '60m',
          },
        }
      : {}),
  },
  thresholds: {
    http_req_failed: ['rate<0.5'],
  },
};

export function setup() {
  const base = __ENV.API_URL || `http://localhost:${__ENV.PORT || '3000'}`;
  const headers = { 'Content-Type': 'application/json' };
  const artist = `K6 Stress ${Date.now()}`;
  const payload = JSON.stringify({
    artist,
    album: 'Race Album',
    price: 10,
    qty: TARGET_RECORD_QTY,
    format: 'Vinyl',
    category: 'Rock',
  });
  const res = http.post(`${base}/records`, payload, { headers });
  if (res.status !== 201) {
    throw new Error(`Failed to create target record: status=${res.status}`);
  }
  const id = res.json().id || res.json()._id;

  const list = http.get(`${base}/records?pageSize=50&sort=created`);
  let ids = [];
  try {
    const data = list.json().data || [];
    ids = data.map((r) => r.id).filter(Boolean);
  } catch {}

  return { base, targetId: id, artist, ids };
}

export function reads(data) {
  http.get(`${data.base}/records?pageSize=1&sort=created`, {
    tags: { name: 'read' },
  });
  sleep(0);
}

export function raceWrites(data) {
  const payload = JSON.stringify({ recordId: data.targetId, quantity: 1 });
  http.post(`${data.base}/orders`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'write-race' },
  });
  sleep(0);
}

export function bulkWrites(data) {
  const ids = data.ids.length ? data.ids : [data.targetId];
  const idx = Math.floor(Math.random() * ids.length);
  const qty = 1 + Math.floor(Math.random() * 3);
  const payload = JSON.stringify({ recordId: ids[idx], quantity: qty });
  http.post(`${data.base}/orders`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'write-bulk' },
  });
  sleep(0);
}

export function teardown(data) {
  const res = http.get(
    `${data.base}/records?q=${encodeURIComponent(data.artist)}&pageSize=1`,
  );
  try {
    const record = res.json().data?.[0];
    if (record) {
      const qty = record.qty;
      if (RACE_WRITE_TOTAL >= TARGET_RECORD_QTY && qty !== 0) {
        throw new Error(`Race condition suspected: remaining qty=${qty}`);
      }
    }
  } catch {}
}
