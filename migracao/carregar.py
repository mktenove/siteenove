#!/usr/bin/env python3
"""
Carrega no Supabase as fichas extraídas em fichas/.

  python3 carregar.py --conferir        só mapeia e mostra, não grava
  python3 carregar.py --carregar 20     grava os 20 primeiros
  python3 carregar.py --carregar        grava tudo

Lê as credenciais de ../.env (veja ../.env.exemplo). Usa a service_role,
que ignora o RLS — por isso roda da sua máquina, nunca do site.

É idempotente: usa upsert pela chave `codigo`, então rodar de novo atualiza
em vez de duplicar.
"""
import argparse, json, os, re, ssl, sys, time, urllib.parse, urllib.request

AQUI  = os.path.dirname(os.path.abspath(__file__))
FICHAS = os.path.join(AQUI, "fichas")
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError: CTX = ssl.create_default_context()

# ------------------------------------------------------------------ env
def env():
    caminho = os.path.join(os.path.dirname(AQUI), ".env")
    if not os.path.exists(caminho):
        sys.exit("falta o .env — copie de .env.exemplo e preencha")
    d = {}
    for ln in open(caminho):
        ln = ln.split("#", 1)[0].strip()
        if "=" in ln:
            k, v = ln.split("=", 1); d[k.strip()] = v.strip()
    for k in ("SUPABASE_URL", "SUPABASE_SERVICE_KEY"):
        if not d.get(k): sys.exit(f"falta {k} no .env")
    return d

E = None
def rest(caminho, metodo="GET", corpo=None, cabec=None):
    url = f"{E['SUPABASE_URL']}/rest/v1/{caminho}"
    h = {"apikey": E["SUPABASE_SERVICE_KEY"],
         "Authorization": f"Bearer {E['SUPABASE_SERVICE_KEY']}",
         "Content-Type": "application/json"}
    if cabec: h.update(cabec)
    dados = json.dumps(corpo).encode() if corpo is not None else None
    req = urllib.request.Request(url, data=dados, headers=h, method=metodo)
    try:
        with urllib.request.urlopen(req, timeout=60, context=CTX) as r:
            t = r.read().decode()
            return json.loads(t) if t.strip() else []
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{metodo} {caminho} -> {e.code}: {e.read().decode()[:300]}")

# ---------------------------------------------------------------- mapas
def num(v):
    """Aceita 3495000, '3.495.000,00' e devolve float ou None."""
    if v in (None, "", 0): return None
    if isinstance(v, (int, float)): return float(v)
    s = re.sub(r"[^\d,.-]", "", str(v)).replace(".", "").replace(",", ".")
    try: return float(s)
    except ValueError: return None

def inteiro(v):
    n = num(v); return int(n) if n is not None else None

def finalidade(im):
    if im.get("disponivelParaAluguel") and not im.get("disponivelParaVenda"): return "LOCACAO"
    return "VENDA"

def mapear(im):
    d = im.get("detalhes") or {}
    return {
        "codigo":        im.get("codigoImovel"),
        "tipo":          (im.get("codigoImovel") or "  ")[:2],
        "finalidade":    finalidade(im),
        # tudo entra publicado: são os imóveis que estão no ar hoje
        "situacao":      "PUBLICADO" if im.get("ativo") else "SUSPENSO",
        "titulo":        im.get("titulosPortais"),
        "descricao":     d.get("observacao"),
        "destaque":      bool(im.get("destaque")),
        "cep":           (str(im.get("cep")) if im.get("cep") else None),
        "condominio":    im.get("condominio"),
        "lat":           (im.get("localizacao") or {}).get("lat"),
        "lng":           (im.get("localizacao") or {}).get("lon"),
        "mostrar_endereco": im.get("showAddress") or "SOMENTE_BAIRRO",
        "valor":            num(im.get("valorVenda")),
        "valor_condominio": num(d.get("valorCondominio")),
        "valor_iptu":       num(d.get("valorIptuItr")),
        "aceita_financiamento": d.get("aceitaFinanciamento"),
        "area_util":     num(d.get("areaConstruida")),
        "area_total":    num(d.get("areaTerreno")),
        "dormitorios":   inteiro(d.get("dormitorios")),
        "suites":        inteiro(d.get("suites")),
        "banheiros":     inteiro(d.get("banheiros")),
        "vagas":         inteiro(d.get("vagas")),
        "vagas_cobertas":inteiro(d.get("vagasCobertas")),
        "mobiliado":     d.get("mobiliado"),
        "link_video":    im.get("linkVideo"),
        "tour_virtual":  im.get("tourVirtualMatterport"),
        "origem_flip_id":im.get("idPostgres"),
    }

def slugificar(txt):
    import unicodedata
    t = unicodedata.normalize("NFKD", txt).encode("ascii", "ignore").decode()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", t.lower())).strip("-")

def achar_ou_criar(tabela, filtro, dados):
    q = "&".join(f"{k}=eq.{urllib.parse.quote(str(v))}" for k, v in filtro.items())
    achou = rest(f"{tabela}?{q}&select=id&limit=1")
    if achou: return achou[0]["id"]
    novo = rest(tabela, "POST", dados, {"Prefer": "return=representation"})
    return novo[0]["id"]

# --------------------------------------------------------------- carga
def carregar(limite=None, so_conferir=False):
    arqs = sorted(os.listdir(FICHAS)) if os.path.isdir(FICHAS) else []
    if not arqs: sys.exit("nenhuma ficha em fichas/ — rode extrair.py --buscar")
    if limite: arqs = arqs[:limite]
    cidades, bairros, conds = {}, {}, {}
    lote, fotos_total, sem_codigo = [], 0, 0

    for a in arqs:
        im = json.load(open(os.path.join(FICHAS, a)))
        linha = mapear(im)
        if not linha["codigo"]:
            sem_codigo += 1; continue

        if not so_conferir:
            cid = (im.get("cidade") or "").strip()
            if cid:
                if cid not in cidades:
                    cidades[cid] = achar_ou_criar("cidade", {"nome": cid},
                                                  {"nome": cid, "uf": im.get("estado") or "RS"})
                linha["cidade_id"] = cidades[cid]
                bai = (im.get("bairro") or "").strip()
                if bai:
                    ch = (cid, bai)
                    if ch not in bairros:
                        bairros[ch] = achar_ou_criar(
                            "bairro", {"cidade_id": cidades[cid], "nome": bai},
                            {"cidade_id": cidades[cid], "nome": bai})
                    linha["bairro_id"] = bairros[ch]
            # Condomínio é entidade própria: 45 imóveis do maior deles
            # apontariam para o mesmo registro em vez de repetir os dados.
            cid_flip = im.get("condominioId")
            if im.get("possuiCondominio") and cid_flip:
                if cid_flip not in conds:
                    nome = (im.get("condominio") or f"Condomínio {cid_flip}").strip()
                    conds[cid_flip] = achar_ou_criar(
                        "condominio", {"origem_flip_id": cid_flip},
                        {"origem_flip_id": cid_flip, "nome": nome,
                         "slug": f"{slugificar(nome)}-{cid_flip}",
                         "cidade_id": linha.get("cidade_id"),
                         "bairro_id": linha.get("bairro_id"),
                         "lat": linha.get("lat"), "lng": linha.get("lng"),
                         "publicado": True})
                linha["condominio_id"] = conds[cid_flip]

        lote.append((linha, im.get("photos") or []))
        fotos_total += len(im.get("photos") or [])

    print(f"fichas lidas: {len(arqs)}  |  mapeadas: {len(lote)}  |  sem código: {sem_codigo}")
    if conds: print(f"condomínios criados/reaproveitados: {len(conds)}")
    print(f"fotos referenciadas: {fotos_total}")
    if so_conferir:
        print("\nexemplo do que seria gravado:")
        print(json.dumps(lote[0][0], ensure_ascii=False, indent=1)[:700])
        return

    # imóveis em blocos — upsert pelo código
    B = 50
    linhas = [l for l, _ in lote]
    for i in range(0, len(linhas), B):
        rest("imovel", "POST", linhas[i:i+B],
             {"Prefer": "resolution=merge-duplicates,return=minimal"})
        print(f"  imóveis {min(i+B, len(linhas))}/{len(linhas)}")

    # fotos: apaga as do imóvel e regrava, para não duplicar em recarga
    for linha, photos in lote:
        if not photos: continue
        cod = linha["codigo"]
        rest(f"imovel_foto?imovel_codigo=eq.{cod}", "DELETE", None, {"Prefer": "return=minimal"})
        regs = [{"imovel_codigo": cod, "url": p.get("url"), "thumb_url": p.get("thumbnail"),
                 "legenda": p.get("descricao") or None, "ordem": p.get("ordem") or 0,
                 "capa": str(p.get("principal")) == "1", "origem_url": p.get("url")}
                for p in photos if p.get("url")]
        if regs:
            rest("imovel_foto", "POST", regs, {"Prefer": "return=minimal"})
    print(f"\nfotos gravadas para {sum(1 for _, p in lote if p)} imóveis")
    print("as URLs ainda apontam para o S3 do Flip — rehospedar é o passo seguinte")

if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("--conferir", action="store_true")
    a.add_argument("--carregar", nargs="?", const=0, type=int)
    n = a.parse_args()
    if n.conferir:
        carregar(limite=5, so_conferir=True)
    elif n.carregar is not None:
        E = env(); carregar(n.carregar or None)
    else:
        a.print_help()
