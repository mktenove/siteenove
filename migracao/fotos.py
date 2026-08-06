#!/usr/bin/env python3
"""
Baixa as fotos do S3 do Flip e sobe para o Storage do Supabase, trocando a
URL no banco. Enquanto isso não acontece, o site novo aponta para arquivos
que não são nossos e somem no dia em que a Enove sair do Flip.

  python3 fotos.py --medir            quanto ocupa, sem baixar nada
  python3 fotos.py --subir --capas    só a foto de capa de cada imóvel
  python3 fotos.py --subir            todas (ver o aviso de espaço)
  python3 fotos.py --subir --por 8    no máximo 8 por imóvel

Idempotente: pula o que já está no bucket.
"""
import argparse, json, os, ssl, sys, time, urllib.parse, urllib.request, urllib.error

AQUI = os.path.dirname(os.path.abspath(__file__))
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError: CTX = ssl.create_default_context()

def env():
    p = os.path.join(os.path.dirname(AQUI), ".env")
    if not os.path.exists(p): sys.exit("falta o .env")
    d = {}
    for ln in open(p):
        ln = ln.split("#", 1)[0].strip()
        if "=" in ln: k, v = ln.split("=", 1); d[k.strip()] = v.strip()
    return d

E = env()
BUCKET = E.get("SUPABASE_BUCKET", "imoveis")
H = {"apikey": E["SUPABASE_SERVICE_KEY"],
     "Authorization": f"Bearer {E['SUPABASE_SERVICE_KEY']}"}

def rest(caminho, metodo="GET", corpo=None, extra=None):
    h = dict(H); h["Content-Type"] = "application/json"
    if extra: h.update(extra)
    dados = json.dumps(corpo).encode() if corpo is not None else None
    req = urllib.request.Request(f"{E['SUPABASE_URL']}/rest/v1/{caminho}",
                                 data=dados, headers=h, method=metodo)
    with urllib.request.urlopen(req, timeout=60, context=CTX) as r:
        t = r.read().decode()
        return json.loads(t) if t.strip() else []

def tipo_real(dados, url):
    """O S3 do Flip devolve application/octet-stream para tudo, e o bucket
    recusa por tipo inválido. Os bytes iniciais do arquivo é que dizem a
    verdade; a extensão da URL fica só como último recurso."""
    if dados[:3] == b"\xff\xd8\xff":                      return "image/jpeg"
    if dados[:8] == b"\x89PNG\r\n\x1a\n":                 return "image/png"
    if dados[:4] == b"RIFF" and dados[8:12] == b"WEBP":     return "image/webp"
    ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower()
    return {".png": "image/png", ".webp": "image/webp"}.get(ext, "image/jpeg")

def baixar(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60, context=CTX) as r:
        dados = r.read()
    return dados, tipo_real(dados, url)

def subir(caminho, dados, tipo):
    """upsert: se já existe, sobrescreve em vez de falhar"""
    h = dict(H); h["Content-Type"] = tipo; h["x-upsert"] = "true"
    req = urllib.request.Request(
        f"{E['SUPABASE_URL']}/storage/v1/object/{BUCKET}/{caminho}",
        data=dados, headers=h, method="POST")
    with urllib.request.urlopen(req, timeout=120, context=CTX) as r:
        r.read()
    return f"{E['SUPABASE_URL']}/storage/v1/object/public/{BUCKET}/{caminho}"

def rest_tudo(caminho, passo=1000):
    """O PostgREST corta a resposta em 1.000 linhas por padrão, e `limit=` na
    URL não vence esse teto — é preciso paginar por Range. Sem isto, a
    medição enxergava 1.000 das 28.278 fotos e parecia estar tudo pronto."""
    saida, ini = [], 0
    while True:
        parte = rest(caminho, extra={"Range-Unit": "items",
                                     "Range": f"{ini}-{ini+passo-1}"})
        saida.extend(parte)
        if len(parte) < passo: return saida
        ini += passo

def lista(so_capas, por):
    """Fotos ainda apontando para o Flip, na ordem, respeitando os limites."""
    q = ("imovel_foto?select=id,imovel_codigo,url,ordem,capa"
         "&origem_url=not.is.null&url=like.*flip-prod-fotos*"
         "&order=imovel_codigo.asc,ordem.asc")
    todas = rest_tudo(q)
    if so_capas:
        return [f for f in todas if f["capa"]]
    if por:
        cont, saida = {}, []
        for f in todas:
            c = f["imovel_codigo"]
            if cont.get(c, 0) >= por: continue
            cont[c] = cont.get(c, 0) + 1; saida.append(f)
        return saida
    return todas

def medir():
    todas = lista(False, None)
    capas = [f for f in todas if f["capa"]]
    imoveis = len({f["imovel_codigo"] for f in todas})
    MEDIA = 106 * 1024
    print(f"fotos ainda no Flip : {len(todas):,}".replace(",", "."))
    print(f"imóveis             : {imoveis}")
    print(f"peso estimado total : {len(todas)*MEDIA/1e9:.2f} GB")
    print(f"só as capas         : {len(capas)} fotos, {len(capas)*MEDIA/1e6:.0f} MB")
    for n in (4, 8, 12):
        q = len(lista(False, n))
        print(f"até {n:>2} por imóvel     : {q:,} fotos, {q*MEDIA/1e9:.2f} GB".replace(",", "."))

def executar(so_capas, por):
    alvo = lista(so_capas, por)
    print(f"{len(alvo)} fotos a migrar\n")
    ok = falhas = 0
    t0 = time.time()
    for i, f in enumerate(alvo, 1):
        ext = os.path.splitext(urllib.parse.urlparse(f["url"]).path)[1] or ".jpg"
        destino = f"{f['imovel_codigo']}/{f['ordem'] or 0:03d}{ext}"
        try:
            dados, tipo = baixar(f["url"])
            nova = subir(destino, dados, tipo)
            rest(f"imovel_foto?id=eq.{f['id']}", "PATCH", {"url": nova},
                 {"Prefer": "return=minimal"})
            ok += 1
        except Exception as e:
            falhas += 1
            print(f"  ! {f['imovel_codigo']} ordem {f['ordem']}: {str(e)[:80]}")
        if i % 25 == 0 or i == len(alvo):
            vel = i / max(1, time.time() - t0)
            print(f"  {i}/{len(alvo)}  ok {ok}  falhas {falhas}  ({vel:.1f}/s)")
    print(f"\nconcluído: {ok} migradas, {falhas} falharam")

if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("--medir", action="store_true")
    a.add_argument("--subir", action="store_true")
    a.add_argument("--capas", action="store_true")
    a.add_argument("--por", type=int)
    n = a.parse_args()
    if n.medir: medir()
    elif n.subir: executar(n.capas, n.por)
    else: a.print_help()
