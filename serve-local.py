"""Local server: persistent private data, random secret, no demo seeding."""
import os
from pathlib import Path
import secrets
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
data_dir = ROOT / 'data'
data_dir.mkdir(exist_ok=True)
secret_path = data_dir / '.session-secret'
if not secret_path.exists():
    try:
        with secret_path.open('x', encoding='utf-8') as file:
            file.write(secrets.token_urlsafe(48))
    except FileExistsError:
        pass
env = os.environ.copy()
env['PYTHONUTF8'] = '1'
env['PYTHONIOENCODING'] = 'utf-8'
env['LABHUB_SECRET_KEY'] = env.get('LABHUB_SECRET_KEY') or secret_path.read_text(encoding='utf-8').strip()
env['LABHUB_DB_PATH'] = str(data_dir / 'labhub.db')
env['SEED_DEMO_DATA'] = '0'
print('Local website: http://127.0.0.1:8000', flush=True)
raise SystemExit(subprocess.call([sys.executable, '-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', '8000'], cwd=ROOT, env=env))
