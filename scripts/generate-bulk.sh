#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/generate-bulk.sh [NUM_RECORDS] [NUM_ORDERS] [--docker]
# Defaults: NUM_RECORDS=100000, NUM_ORDERS=100000
# If --docker is provided, runs inside the mongodb container via docker compose.
# Otherwise, requires mongosh installed locally and MONGO_URL in environment or .env

NUM_RECORDS=${1:-100000}
NUM_ORDERS=${2:-100000}
MODE=${3:-local}

# Resolve MONGO_URL from env or .env
if [[ "$MODE" == "--docker" ]]; then
  echo "Running bulk generation inside Docker container 'mongodb'"
  CMD=(docker compose -f ./docker-compose.yml exec -T mongodb mongosh "mongodb://localhost:27017/records")
else
  if [[ -z "${MONGO_URL:-}" ]]; then
    if [[ -f .env ]]; then
      MONGO_URL=$(grep -E '^MONGO_URL=' .env | cut -d= -f2- || true)
    fi
  fi

  if [[ -z "${MONGO_URL:-}" ]]; then
    echo "MONGO_URL is not set. Export MONGO_URL or add it to .env"
    exit 1
  fi

  if ! command -v mongosh >/dev/null 2>&1; then
    echo "mongosh is required. Install MongoDB shell or use Docker compose (npm run mongo:start)"
    exit 1
  fi

  echo "Connecting to: $MONGO_URL"
  echo "Generating $NUM_RECORDS records and $NUM_ORDERS orders..."
  CMD=(mongosh "$MONGO_URL")
fi
"${CMD[@]}" <<JS
const NUM_RECORDS = $NUM_RECORDS;
const NUM_ORDERS = $NUM_ORDERS;
const BATCH = 5000;

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
const formats = ['VINYL','CD','CASSETTE'];
const categories = ['ROCK','POP','JAZZ','INDIE','CLASSICAL'];

print('Cleaning indexes to speed up inserts (they will be rebuilt by the app)...');
try { db.records.dropIndexes(); } catch (e) {}
try { db.orders.dropIndexes(); } catch (e) {}

print('Inserting records...');
let batch = [];
for (let i = 0; i < NUM_RECORDS; i++) {
  batch.push({
    artist: 'Artist ' + i,
    album: 'Album ' + i,
    price: randInt(5, 100),
    qty: randInt(20, 100),
    format: formats[randInt(0, formats.length - 1)],
    category: categories[randInt(0, categories.length - 1)],
    created: new Date(),
    lastModified: new Date(),
    tracklist: [],
  });
  if (batch.length === BATCH) {
    db.records.insertMany(batch, { ordered: false });
    batch = [];
  }
}
if (batch.length) db.records.insertMany(batch, { ordered: false });

const ids = db.records.find({}, { _id: 1, price: 1 }).toArray();
print('Inserted records: ' + ids.length);

print('Inserting orders...');
let obatch = [];
for (let i = 0; i < NUM_ORDERS; i++) {
  const idx = randInt(0, ids.length - 1);
  const rec = ids[idx];
  const qty = randInt(1, 5);
  const unitPrice = rec.price;
  obatch.push({
    recordId: rec._id,
    quantity: qty,
    unitPrice,
    totalPrice: unitPrice * qty,
    createdAt: new Date(),
  });
  if (obatch.length === BATCH) {
    db.orders.insertMany(obatch, { ordered: false });
    obatch = [];
  }
}
if (obatch.length) db.orders.insertMany(obatch, { ordered: false });

print('Orders inserted: ' + db.orders.countDocuments());
JS

echo "Done."