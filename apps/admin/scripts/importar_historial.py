"""Convierte el Excel de ventas en un archivo de importación para el módulo histórico."""
import json
import sys
from datetime import datetime
from pathlib import Path
import openpyxl

source = Path(sys.argv[1])
target = Path(sys.argv[2])
sheet = openpyxl.load_workbook(source, read_only=True, data_only=True).active
rows = []
seen = set()
for line, row in enumerate(sheet.values, 1):
    if line == 1 or not row[1]:
        continue
    detail, sale, date, ticket, quantity, price, subtotal, category, service, _, _, _, customer, customer_id = row[:14]
    if not isinstance(date, datetime) or not all((detail, sale, customer, customer_id)):
        raise ValueError(f'Fila {line}: faltan datos requeridos')
    if detail in seen:
        raise ValueError(f'ID DETALLE repetido en fila {line}: {detail}')
    seen.add(detail)
    rows.append([str(detail), str(sale), date.strftime('%Y-%m-%d'), str(int(ticket)) if ticket is not None else '', float(quantity) if quantity is not None else None, float(price) if price is not None else None, float(subtotal) if subtotal is not None else None, str(category or ''), str(service or ''), str(customer), str(customer_id)])
target.write_text(json.dumps({'version': 1, 'columns': ['detalle','venta','fecha','ticket','cantidad','precio','subtotal','categoria','servicio','cliente','clienteId'], 'rows': rows}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'{len(rows)} detalles, {len({r[1] for r in rows})} ventas, {len({r[10] for r in rows})} clientes -> {target}')
