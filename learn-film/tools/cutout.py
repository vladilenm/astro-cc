"""cutout.py : remove the background from assets/raw/<id>.<ext>, trim to the object, save assets/cut/<id>.webp.

  ~/.cache/doodle-rembg/.venv/bin/python tools/cutout.py [id ...]
"""
import sys, pathlib
from PIL import Image
from rembg import remove, new_session

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW, CUT = ROOT / 'assets/raw', ROOT / 'assets/cut'
MAX = 1000
session = new_session('isnet-general-use')
ids = set(sys.argv[1:])
for f in sorted(RAW.iterdir()):
    if f.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff') or (ids and f.stem not in ids):
        continue
    im = Image.open(f).convert('RGB')
    im.thumbnail((2000, 2000))
    out = remove(im, session=session, post_process_mask=True)
    a = out.getchannel('A').point(lambda v: 0 if v < 24 else v)
    out.putalpha(a)
    out = out.crop(a.getbbox())
    out.thumbnail((MAX, MAX), Image.LANCZOS)
    CUT.mkdir(parents=True, exist_ok=True)
    out.save(CUT / (f.stem + '.webp'), 'WEBP', quality=88, method=6)
    print(f.stem, out.size)
