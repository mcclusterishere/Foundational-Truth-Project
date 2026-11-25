from pathlib import Path
import json
from base64 import b64encode
from zipfile import ZipFile, ZIP_DEFLATED
d=Path.cwd()
html=(d/'index.html').read_text()
css=(d/'style.css').read_text()
js=(d/'app.js').read_text()
data=[]
for name in ('country-boundaries-110m.json','evidence.json'):
    data.append(json.dumps(json.loads((d/'data'/name).read_text()), ensure_ascii=False).replace('<','\\u003c'))
scan_assets={p.stem:'data:image/jpeg;base64,'+b64encode(p.read_bytes()).decode() for p in (d/'maps').glob('*.jpg')}
init=js[:js.index("const read=async path=>")].replace(js.split('const scanAssets=',1)[1].split(';',1)[0]+';',json.dumps(scan_assets)+';',1)
init += '\ncountries=JSON.parse(document.getElementById("boundary-data").textContent).countries;init(JSON.parse(document.getElementById("evidence-data").textContent));'
html=html.replace('<link rel="stylesheet" href="style.css"><script src="app.js" defer></script>', '<style>'+css+'</style>')
html=html.replace('</body>', '<script type="application/json" id="boundary-data">'+data[0]+'</script><script type="application/json" id="evidence-data">'+data[1]+'</script><script>'+init+'</script></body>')
(d/'The-Real-History-v6.html').write_text(html)
with ZipFile(d/'The-Real-History-v6.zip','w',compression=ZIP_DEFLATED) as z:
    for f in ['README.md','index.html','style.css','app.js','package_offline.py','test_offline.cjs','The-Real-History-v6.html','data/evidence.json','data/country-boundaries-110m.json']:
        z.write(d/f,f)
    for p in (d/'maps').glob('*.jpg'): z.write(p,p.relative_to(d))

