#!/usr/bin/env python3
"""
Extrai os imóveis publicados do site atual (Flip) para JSON.

O site é Next.js com renderização no servidor: cada ficha traz o registro
cru do imóvel dentro de __NEXT_DATA__. Isso é lido diretamente, sem
interpretar HTML — os campos vêm do banco de origem, não de texto na tela.

  python3 extrair.py --listar          descobre os códigos e grava codigos.txt
  python3 extrair.py --buscar [N]      baixa as fichas (N = limite, opcional)

É retomável: fichas já baixadas são puladas.
"""
import argparse, json, os, re, ssl, sys, time, urllib.request, urllib.error

# O Python do macOS nao usa o repositorio de CAs do sistema: sem isto, toda
# requisicao https falha com CERTIFICATE_VERIFY_FAILED.
try:
    import certifi
    CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    CTX = ssl.create_default_context()

BASE  = "https://www.enoveimobiliaria.com.br"
# A busca do site nao pagina por querystring: quem pagina e esta API, com
# `start`. Os dois cabeçalhos identificam a imobiliaria — sem eles, 403.
API   = "https://imobiliariasiteapi.eurekalabs.com.br/search-imoveis"
CABEC = {"x-flip-tenant": "156", "x-flip-site": "57",
         "Referer": "https://www.enoveimobiliaria.com.br/"}
UA    = "Mozilla/5.0 (compatible; migracao-enove/1.0)"
PASTA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fichas")
PAUSA = 0.4          # segundos entre requisições — o site é da casa, mas não é motivo para martelar

def pegar(url, tentativas=3, extra=None):
    for i in range(tentativas):
        try:
            h = {"User-Agent": UA}
            if extra: h.update(extra)
            req = urllib.request.Request(url, headers=h)
            with urllib.request.urlopen(req, timeout=45, context=CTX) as r:
                return r.read().decode("utf-8", "replace")
        except (urllib.error.URLError, TimeoutError) as e:
            if i == tentativas - 1:
                print(f"  ! falhou {url}: {e}", file=sys.stderr)
                return None
            time.sleep(1.5 * (i + 1))

def next_data(html):
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.S)
    return json.loads(m.group(1)) if m else None

def listar():
    """Pagina a API e junta os códigos. Guarda tambem o resumo de cada um."""
    codigos, start, total, LOTE = {}, 0, None, 100
    while True:
        url = (f"{API}?limit={LOTE}&start={start}&paginate=true&cidade="
               f"&host=www.enoveimobiliaria.com.br&sort=recentFirst")
        bruto = pegar(url, extra=CABEC)
        if not bruto: break
        d = json.loads(bruto)
        if d.get("code") == 403:
            print("  ! 403 — cabeçalhos de tenant recusados"); break
        itens = d.get("data") or []
        total = d.get("total", total)
        if not itens: break
        for it in itens:
            c = it.get("codigoImovel")
            if c: codigos[c] = it
        print(f"  start {start:>5}: +{len(itens):>3}  acumulado {len(codigos)}/{total}")
        start += LOTE
        if start >= (total or 0): break
        time.sleep(PAUSA)
    json.dump(codigos, open(os.path.join(os.path.dirname(PASTA), "resumo.json"), "w"),
              ensure_ascii=False, indent=1)
    with open(os.path.join(os.path.dirname(PASTA), "codigos.txt"), "w") as f:
        f.write("\n".join(sorted(codigos)))
    print(f"\n{len(codigos)} códigos gravados em codigos.txt")
    return sorted(codigos)

def buscar(limite=None):
    arq = os.path.join(os.path.dirname(PASTA), "codigos.txt")
    if not os.path.exists(arq):
        print("rode --listar primeiro"); return
    codigos = [c for c in open(arq).read().split() if c]
    os.makedirs(PASTA, exist_ok=True)
    if limite: codigos = codigos[:limite]
    novos = falhas = 0
    for i, cod in enumerate(codigos, 1):
        destino = os.path.join(PASTA, f"{cod}.json")
        if os.path.exists(destino):        # retomável
            continue
        html = pegar(f"{BASE}/imoveis/{cod}")
        d = next_data(html) if html else None
        im = (d or {}).get("props", {}).get("pageProps", {}).get("defaultImovel")
        if not im:
            falhas += 1
            print(f"  {i}/{len(codigos)} {cod}  SEM REGISTRO")
        else:
            json.dump(im, open(destino, "w"), ensure_ascii=False, indent=1)
            novos += 1
            if novos % 25 == 0 or novos <= 3:
                print(f"  {i}/{len(codigos)} {cod}  ok ({len(im.get('photos') or [])} fotos)")
        time.sleep(PAUSA)
    print(f"\n{novos} fichas novas, {falhas} sem registro, "
          f"{len(os.listdir(PASTA))} no total em fichas/")

if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("--listar", action="store_true")
    a.add_argument("--buscar", nargs="?", const=0, type=int)
    n = a.parse_args()
    if n.listar: listar()
    elif n.buscar is not None: buscar(n.buscar or None)
    else: a.print_help()
