"""Snapshot real Array query results into a static JS file for the UI mockup (read-only, key never written)."""
import json, urllib.request
from pathlib import Path

cfg = json.load(open('/home/ilumyx/XRU/Xru_Code/XRU_Data/federal_keys/ai/xru_array.json'))
BASE = cfg['base_url']
HDR = {'Authorization': f"Bearer {cfg['api_key']}", 'Content-Type': 'application/json'}
OUT = Path(__file__).resolve().parent.parent / 'data' / 'array_snapshot.js'

QUERIES = ["tank + ussr", "ifv + russia", "Russia tank 125mm", "BTR wheel 30mm", "World War II battle", "tank !Russia",
           "Eastern Front battle", "Leopard 2", "tank + 3bm42", "tank Japan 125mm"]
LIMIT, MAX_LINKS = 30, 10


def call(tool, body):
    req = urllib.request.Request(f"{BASE}/{tool}", data=json.dumps(body).encode(), headers=HDR)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)


health = json.load(urllib.request.urlopen(BASE.rsplit('/v1', 1)[0] + '/health', timeout=10))
names, queries = {}, {}

for q in QUERIES:
    d = call('query', {'q': q, 'limit': LIMIT})
    for r in d['results']:
        names[r['xru_id']] = (r['canonical_name'], r['class'])
        r['links'] = r['links'][:MAX_LINKS]
    queries[q] = {k: d.get(k) for k in ('q', 'total', 'message', 'understood', 'reasons', 'cooccurring_tags', 'results')}
    print(f"{q!r}: total {d['total']}, got {len(d['results'])}")

# resolve linked xru_ids -> names so relations read as words, not ids
wanted = {x for qd in queries.values() for r in qd['results'] for l in r['links']
          for x in (l['subject_xru_id'], l['object_xru_id'])} - set(names)
for xid in sorted(wanted):
    try:
        d = call('lookup_links', {'xru_id': xid, 'limit': 0})
        for e in d.get('entry', []):
            names.setdefault(e['xru_id'], (e['canonical_name'], e['class']))
    except Exception as ex:  # noqa: BLE001
        print('miss', xid, ex)
print('names resolved:', len(names), '/ wanted extra:', len(wanted))

snap = {
    'generation': health.get('generation'),
    'key_rule_version': health.get('key_rule_version'),
    'taken_at': __import__('datetime').datetime.now().isoformat(timespec='minutes'),
    'order': QUERIES,
    'queries': queries,
    'names': {k: {'name': v[0], 'class': v[1]} for k, v in names.items()},
}
OUT.parent.mkdir(exist_ok=True)
OUT.write_text('// Bản chụp thật từ Xru Array (chỉ đọc). Sinh bằng tools/array_snapshot.py — đừng sửa tay.\n'
               'window.ARRAY_SNAPSHOT = ' + json.dumps(snap, ensure_ascii=False) + ';\n', encoding='utf-8')
print('wrote', OUT, OUT.stat().st_size // 1024, 'KB')
