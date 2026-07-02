#!/usr/bin/env python3
# Automação de certificados Gupy — Sistema de Vagas de TI em Bauru
# Criado por Daniel Ortega Pereira
# https://github.com/dnlortega/vagas-linkedin
"""
Automação de certificados no Gupy
==================================
Pré-requisitos (rode UMA vez):
    pip install playwright psutil
    python -m playwright install chromium

Como usar:
    1. No app (/perfil), clique em "JSON" para exportar → salve como certificados.json
       na mesma pasta deste script.
    2. Execute: python gupy_certs.py
    3. O script conecta ao Chrome aberto (ou o reabre mantendo sua sessão).

Flags:
    python gupy_certs.py --dry-run       # mostra o que fará, sem preencher nada
    python gupy_certs.py --inicio 10     # começa do certificado nº 10
    python gupy_certs.py --arquivo outro.json
"""

import argparse
import json
import os
import re
import socket
import subprocess
import sys
import time
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
except ImportError:
    print("❌ Playwright não instalado.")
    print("   Rode: pip install playwright && python -m playwright install chromium")
    sys.exit(1)

try:
    import psutil
except ImportError:
    psutil = None

# ─── Configuração ────────────────────────────────────────────────────────────

DEBUG_PORT  = 9222
GUPY_URL    = "https://login.gupy.io/candidates/curriculum"
PROGRESSO   = Path(__file__).parent / "gupy_progresso.json"
TIMEOUT     = 10_000   # ms

MESES = {
    "jan": ("Janeiro",   "01"), "fev": ("Fevereiro", "02"), "mar": ("Março",    "03"),
    "abr": ("Abril",     "04"), "mai": ("Maio",      "05"), "jun": ("Junho",    "06"),
    "jul": ("Julho",     "07"), "ago": ("Agosto",    "08"), "set": ("Setembro", "09"),
    "out": ("Outubro",   "10"), "nov": ("Novembro",  "11"), "dez": ("Dezembro", "12"),
}

# ─── Chrome: conectar / abrir com debug ──────────────────────────────────────

def porta_ativa(porta=DEBUG_PORT):
    try:
        s = socket.create_connection(("localhost", porta), timeout=1)
        s.close()
        return True
    except OSError:
        return False

def caminho_chrome():
    candidatos = [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    ]
    for c in candidatos:
        if os.path.exists(c):
            return c
    return None

def perfil_chrome():
    return os.path.expandvars(r"%LocalAppData%\Google\Chrome\User Data")

# Perfil dedicado à automação (separado do Chrome principal)
PERFIL_AUTO = Path(__file__).parent / ".chrome_gupy_auto"

def abrir_chrome_debug(url=GUPY_URL):
    """
    Abre UMA NOVA janela do Chrome com porta de depuração,
    sem tocar no Chrome já aberto.
    Usa perfil próprio salvo em .chrome_gupy_auto/
    """
    exe = caminho_chrome()
    if not exe:
        print("❌ Chrome não encontrado. Instale o Google Chrome.")
        sys.exit(1)

    primeira_vez = not PERFIL_AUTO.exists()
    PERFIL_AUTO.mkdir(exist_ok=True)

    print(f"  Abrindo nova janela do Chrome com depuração na porta {DEBUG_PORT}...")
    if primeira_vez:
        print("  ⚠  PRIMEIRA VEZ: faça login no Gupy nessa janela e")
        print("     pressione ENTER aqui quando estiver na página de currículo.")

    subprocess.Popen([
        exe,
        f"--remote-debugging-port={DEBUG_PORT}",
        f"--user-data-dir={PERFIL_AUTO}",
        "--no-first-run",
        "--no-default-browser-check",
        url,
    ])

    # Aguarda o Chrome subir
    print("  Aguardando Chrome iniciar", end="", flush=True)
    for _ in range(25):
        time.sleep(1)
        print(".", end="", flush=True)
        if porta_ativa():
            print(" ok")
            return
    print()
    print("❌ Chrome não respondeu. Feche a janela de automação e tente novamente.")
    sys.exit(1)

def obter_pagina_gupy(playwright):
    """Conecta ao Chrome de automação via CDP e retorna a página do Gupy."""
    if not porta_ativa():
        print("\n⚠️  Janela de automação não está aberta ainda.")
        print(f"   (O Chrome principal continua intocado)\n")
        abrir_chrome_debug()

        # Se é a primeira vez, aguarda o login manual
        if not (PERFIL_AUTO / "Default" / "Cookies").exists():
            input("\n  Faça login no Gupy e pressione ENTER para continuar...")

    print(f"\n  Conectando ao Chrome de automação (porta {DEBUG_PORT})...")
    browser = playwright.chromium.connect_over_cdp(f"http://localhost:{DEBUG_PORT}")
    ctx     = browser.contexts[0]

    # Procura aba do Gupy
    for page in ctx.pages:
        if "gupy.io" in page.url:
            print(f"  Aba encontrada: {page.url}")
            page.bring_to_front()
            return page

    # Abre nova aba no Gupy
    print(f"  Abrindo {GUPY_URL} ...")
    page = ctx.new_page()
    page.goto(GUPY_URL, wait_until="domcontentloaded", timeout=30_000)
    return page

# ─── Helpers de dados ────────────────────────────────────────────────────────

def parse_data(s):
    if not s:
        return None, None
    m = re.search(r"([a-zA-ZÀ-ú]{3})\.?\s*(?:de\s+)?(\d{4})", s, re.I)
    if m:
        abrev = m.group(1).lower()[:3]
        ano   = m.group(2)
        nome_mes, num_mes = MESES.get(abrev, (None, None))
        return nome_mes, ano
    return None, None

def formatar_data_mmaaaa(s):
    """Converte qualquer formato de data para MM/AAAA."""
    if not s:
        return ""
    # ISO: "2026-07" ou "2026-07-15"
    m = re.match(r"(\d{4})-(\d{2})", s.strip())
    if m:
        return f"{m.group(2)}/{m.group(1)}"
    # Textual: "jun. de 2025" ou "junho de 2025"
    m = re.search(r"([a-zA-ZÀ-ɏ]{3})\.?\s*(?:de\s+)?(\d{4})", s, re.I)
    if m:
        abrev  = m.group(1).lower()[:3]
        ano    = m.group(2)
        _, num = MESES.get(abrev, (None, ""))
        return f"{num}/{ano}" if num else ano
    # Só ano
    m2 = re.search(r"(\d{4})", s)
    return f"01/{m2.group(1)}" if m2 else ""

def sort_key_data(cert):
    mes_nome, ano = parse_data(cert.get("data", ""))
    if ano:
        num = next((v[1] for k, v in MESES.items() if v[0] == mes_nome), "01") if mes_nome else "01"
        return f"{ano}-{num}"
    return "0000-00"

def log(msg, nivel="info"):
    cores = {"ok": "\033[92m✓", "erro": "\033[91m✗", "warn": "\033[93m⚠", "info": "\033[0m "}
    print(f"{cores.get(nivel, ' ')} {msg}\033[0m")

def salvar_progresso(feitos):
    PROGRESSO.write_text(json.dumps(list(feitos)), encoding="utf-8")

def carregar_progresso():
    if PROGRESSO.exists():
        return set(json.loads(PROGRESSO.read_text(encoding="utf-8")))
    return set()

# ─── Interação com o Gupy ────────────────────────────────────────────────────

ESPERA_PASSO = 3  # segundos entre cada passo

def aguardar(page, segundos=ESPERA_PASSO, motivo=""):
    if motivo:
        print(f"  ⏳ Aguardando {segundos}s {motivo}...")
    else:
        print(f"  ⏳ Aguardando {segundos}s...")
    for i in range(segundos, 0, -1):
        print(f"     {i}...", end="\r", flush=True)
        time.sleep(1)
    print(" " * 20, end="\r")  # limpa a linha do contador

def clicar_xpath(page, xpath, descricao="elemento"):
    """Clica num elemento pelo XPath. Se for SVG/path, sobe para o ancestral clicável."""
    print(f"\n  🖱  Localizando: {descricao}")
    print(f"      XPath: {xpath}")
    alvos = [
        f"xpath={xpath}",
        f"xpath={xpath}/../..",
        f"xpath={xpath}/../../..",
    ]
    for sel in alvos:
        try:
            el = page.locator(sel).first
            if el.count():
                el.scroll_into_view_if_needed()
                page.wait_for_timeout(300)
                print(f"      Elemento encontrado — clicando...")
                el.click()
                log(f"Clicou em: {descricao}", "ok")
                aguardar(page, ESPERA_PASSO, "após o clique")
                return True
        except Exception:
            continue
    log(f"Não encontrou: {descricao}", "warn")
    return False

def clicar_secao(page, nome="Experiência"):
    """Localiza o cabeçalho de seção (ex: 'Experiência ✓') e clica nele."""
    print(f"\n  🔍 Localizando seção: '{nome}'")
    alvos = [
        f"text={nome}",
        f"button:has-text('{nome}')",
        f"[role='button']:has-text('{nome}')",
        f"h2:has-text('{nome}')",
        f"h3:has-text('{nome}')",
        f"div:has-text('{nome}') >> svg",
        f"*:has-text('{nome}') >> nth=-1",
    ]
    for sel in alvos:
        try:
            el = page.locator(sel).first
            if el.count() and el.is_visible():
                el.scroll_into_view_if_needed()
                page.wait_for_timeout(300)
                print(f"      Encontrado com seletor: {sel}")
                print(f"      Clicando em '{nome}'...")
                el.click()
                log(f"Seção '{nome}' clicada", "ok")
                aguardar(page, ESPERA_PASSO, "após abrir a seção")
                return True
        except Exception:
            continue
    log(f"Seção '{nome}' não encontrada", "warn")
    return False

def clicar_adicionar(page):
    """Localiza e clica em 'adicionar uma/outra conquista ou certificado'."""
    print(f"\n  🔍 Localizando botão 'Adicionar conquista ou certificado'...")
    alvos = [
        "text=Adicionar outra conquista ou certificado",
        "text=adicionar outra conquista ou certificado",
        "text=Adicionar uma conquista ou certificado",
        "text=adicionar uma conquista ou certificado",
        "text=conquista ou certificado",
        "section:has-text('conquista') button:has-text('Adicionar')",
        "div:has-text('conquista') >> button:has-text('Adicionar')",
        "button:has-text('Adicionar')",
    ]
    for sel in alvos:
        try:
            el = page.locator(sel).first
            if el.count() > 0:
                el.scroll_into_view_if_needed()
                page.wait_for_timeout(300)
                print(f"      Encontrado: {sel}")
                print(f"      Clicando...")
                el.click()
                log("Botão 'Adicionar' clicado", "ok")
                aguardar(page, ESPERA_PASSO, "para o formulário abrir")
                return True
        except Exception:
            continue
    return False

def aguardar_modal(page):
    page.wait_for_selector(
        "dialog, [role='dialog'], [class*='modal'], [class*='Modal']",
        timeout=TIMEOUT,
    )
    page.wait_for_timeout(600)

def fechar_modal(page):
    for sel in [
        "button[aria-label*='fechar']", "button[aria-label*='close']",
        "button[aria-label*='Fechar']", "button:has-text('Cancelar')",
        "[data-testid*='close']",
    ]:
        try:
            el = page.locator(sel).first
            if el.count() and el.is_visible():
                el.click()
                page.wait_for_timeout(500)
                return
        except Exception:
            pass
    page.keyboard.press("Escape")
    page.wait_for_timeout(400)

LINKEDIN_URL = "https://www.linkedin.com/in/daniel-op/"

def campo_ultimo(page, prefixo):
    """Retorna o último input/select/textarea com id começando em 'prefixo-', ignorando labels."""
    return page.locator(f"input[id^='{prefixo}-'], select[id^='{prefixo}-'], textarea[id^='{prefixo}-']").last

def preencher_id(page, el, valor):
    """Preenche um campo (input ou textarea) pelo locator."""
    el.wait_for(state="visible", timeout=TIMEOUT)
    el.click()
    el.fill(str(valor))
    page.wait_for_timeout(150)

def selecionar_id(page, el, valor):
    """Seleciona opção em <select> ou preenche campo livre."""
    el.wait_for(state="visible", timeout=TIMEOUT)
    tag = el.evaluate("e => e.tagName.toLowerCase()")
    if tag == "select":
        # Tenta por label exato, depois por valor parcial
        try:
            el.select_option(label=valor)
        except Exception:
            opcoes = el.locator("option").all()
            for op in opcoes:
                if valor.lower() in (op.inner_text() or "").lower():
                    el.select_option(label=op.inner_text().strip())
                    break
    else:
        el.fill(valor)
        page.wait_for_timeout(300)
        sugestao = page.locator(
            f"[role='option']:has-text('{valor}'), li:has-text('{valor}')"
        ).first
        if sugestao.count():
            sugestao.click()
    page.wait_for_timeout(200)

def adicionar_cert(page, cert):
    nome = cert.get("nome", "").strip()
    if not nome:
        raise Exception("Certificado sem nome")

    # ── PASSO 5 ───────────────────────────────────────────────────────────────
    print(f"\n  PASSO 5 → Clicar em 'Adicionar uma conquista ou certificado'")
    n_antes = page.locator("select[id^='achievementsOptions-']").count()
    if not clicar_adicionar(page):
        raise Exception("Botão 'Adicionar' não encontrado")
    print(f"  ✓ Botão clicado — aguardando novo formulário aparecer...")
    page.wait_for_function(
        f"document.querySelectorAll('select[id^=\"achievementsOptions-\"]').length > {n_antes}",
        timeout=TIMEOUT,
    )
    page.wait_for_timeout(500)
    print(f"  ✓ Formulário aberto")

    # ── PASSO 6 ───────────────────────────────────────────────────────────────
    print(f"\n  PASSO 6 → Selecionar 'Certificado' no campo tipo")
    el_opcoes = campo_ultimo(page, "achievementsOptions")
    print(f"           Campo: #{el_opcoes.get_attribute('id')}")
    el_opcoes.wait_for(state="visible", timeout=TIMEOUT)
    selecionar_id(page, el_opcoes, "Certificado")
    page.keyboard.press("Tab")
    page.wait_for_timeout(300)
    page.keyboard.press("Tab")
    print(f"  ✓ 'Certificado' selecionado + Tab Tab")
    aguardar(page, ESPERA_PASSO, "aguardando")

    # ── PASSO 7 ───────────────────────────────────────────────────────────────
    emissor = cert.get("emissor", "").strip()
    titulo  = f"{emissor} - {nome}" if emissor else nome
    print(f"\n  PASSO 7 → Preencher título")
    el_titulo = campo_ultimo(page, "achievement-title")
    print(f"           Campo: #{el_titulo.get_attribute('id')}")
    print(f"           Texto: {titulo}")
    el_titulo.wait_for(state="visible", timeout=TIMEOUT)
    el_titulo.click()
    el_titulo.fill(titulo)
    print(f"  ✓ Título preenchido")
    aguardar(page, ESPERA_PASSO, "aguardando")

    # ── PASSO 8 ───────────────────────────────────────────────────────────────
    data_fmt  = formatar_data_mmaaaa(cert.get("data", ""))
    descricao = f"Imagem do certificado esta no linkedin - {data_fmt}" if data_fmt else "Imagem do certificado esta no linkedin"
    print(f"\n  PASSO 8 → Preencher descrição")
    el_desc = campo_ultimo(page, "achievementDescription")
    print(f"           Campo: #{el_desc.get_attribute('id')}")
    print(f"           Texto: {descricao}")
    el_desc.wait_for(state="visible", timeout=TIMEOUT)
    el_desc.click()
    el_desc.fill(descricao)
    print(f"  ✓ Descrição preenchida")
    aguardar(page, ESPERA_PASSO, "aguardando")

# ─── Main ─────────────────────────────────────────────────────────────────────

def modo_testar(pw):
    """
    Conecta ao Chrome, abre o Gupy e clica no botão de adicionar certificado.
    Não preenche nada — serve para verificar se a conexão e os seletores funcionam.
    """
    print("\n" + "═"*55)
    print("  MODO TESTE — só conecta e clica no botão")
    print("═"*55)

    page = obter_pagina_gupy(pw)

    if GUPY_URL not in page.url:
        log(f"Navegando para {GUPY_URL}...", "info")
        page.goto(GUPY_URL, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(2_000)

    log("Página carregada: " + page.url, "ok")

    # Passo 1: clica na seção "Experiência"
    clicar_secao(page, "Experiência")

    # Passo 2: clica em "Experiência"
    clicar_secao(page, "Experiência")

    # Listar todos os botões visíveis para debug
    print("\n  Botões encontrados na página:")
    try:
        botoes = page.locator("button").all()
        for b in botoes[:20]:
            txt = b.inner_text().strip().replace("\n", " ")
            if txt:
                print(f"    • {txt[:80]}")
    except Exception:
        pass

    print()
    log("Tentando clicar em 'adicionar uma conquista ou certificado'...", "info")

    if clicar_adicionar(page):
        log("Botão encontrado e clicado com sucesso!", "ok")
        page.wait_for_timeout(2_000)

        # Verificar campos específicos do Gupy
        print("\n  Verificando campos esperados:")
        campos_esperados = [
            ("achievementsOptions", "Tipo da conquista (select)"),
            ("achievement-title",   "Título / nome"),
            ("achievementDescription", "Descrição"),
        ]
        for prefixo, descricao in campos_esperados:
            qtd = contar_campos(page, prefixo)
            ultimo_idx = qtd - 1
            el = campo_novo(page, prefixo, ultimo_idx)
            achado = el.count() > 0
            status = "✓" if achado else "✗ NÃO ENCONTRADO"
            id_real = f"#{prefixo}-{ultimo_idx}"
            print(f"    {status}  {id_real:<35}  → {descricao}")

        print()
        print("  Todos os inputs/selects visíveis:")
        try:
            inputs = page.locator("input:visible, select:visible, textarea:visible").all()
            for inp in inputs:
                id_v  = inp.get_attribute("id") or ""
                name  = inp.get_attribute("name") or ""
                ph    = inp.get_attribute("placeholder") or ""
                tipo  = inp.evaluate("e => e.tagName.toLowerCase()")
                print(f"    • {tipo:<8} id={id_v:<35} name={name:<20} placeholder={ph[:30]}")
        except Exception as e:
            print(f"    (erro: {e})")

        print()
        log("Teste concluído! Feche o modal manualmente e rode sem --testar para preencher.", "ok")
        page.wait_for_timeout(3_000)
    else:
        log("Botão NÃO encontrado. Verifique se a página carregou corretamente.", "erro")
        print("\n  Dica: role a página até a seção 'Conquistas ou certificados' e tente novamente.")

    input("\nPressione ENTER para sair...")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inicio",  type=int, default=1,  help="Começa do certificado nº N")
    ap.add_argument("--dry-run", action="store_true",  help="Lista certs sem preencher")
    ap.add_argument("--testar",  action="store_true",  help="Só conecta e clica o botão (sem preencher)")
    args = ap.parse_args()

    # ── Modo teste ────────────────────────────────────────────────────────────
    if args.testar:
        with sync_playwright() as pw:
            modo_testar(pw)
        return

    # ── Carregar certificados.json ────────────────────────────────────────────
    json_path = Path("certificados.json")
    if not json_path.exists():
        log("Arquivo 'certificados.json' não encontrado.", "erro")
        log("Exporte no app: /perfil → botão JSON → salve como certificados.json", "warn")
        sys.exit(1)

    with open(json_path, encoding="utf-8") as f:
        todos = json.load(f)

    certs = [c for i, c in enumerate(todos, 1) if i >= args.inicio]

    print(f"\n{'═'*55}")
    print(f"  Total no arquivo  : {len(todos)}")
    print(f"  A processar agora : {len(certs)}")
    print(f"{'═'*55}\n")

    if args.dry_run:
        log("MODO DRY-RUN — sem preenchimento\n", "warn")
        for i, c in enumerate(certs, 1):
            data_fmt = formatar_data_mmaaaa(c.get("data", ""))
            print(f"  [{i:02d}] {c.get('emissor','?')[:55]:<56} {data_fmt}")
        return

    if not certs:
        log("Nenhum certificado encontrado no arquivo.", "warn")
        return

    erros = []

    with sync_playwright() as pw:
        page = obter_pagina_gupy(pw)

        # ── PASSO 1: entra no link ────────────────────────────────────────────
        print(f"\n{'═'*55}")
        print(f"  ── Passo 1 ──────────────────────────────────────────")
        print(f"  🔗 Verificando página: {page.url}")
        if GUPY_URL not in page.url:
            print(f"  🔗 Navegando para {GUPY_URL}...")
            page.goto(GUPY_URL, wait_until="domcontentloaded", timeout=30_000)
            page.wait_for_timeout(2_000)

        if "login" in page.url or "auth" in page.url:
            log("Você não está logado no Gupy.", "warn")
            log("Faça login no navegador e pressione ENTER para continuar...", "warn")
            input()
            page.goto(GUPY_URL, wait_until="domcontentloaded", timeout=30_000)
            page.wait_for_timeout(2_000)

        print(f"  ✓ Página carregada: {page.url}")

        # ── PASSO 2 ───────────────────────────────────────────────────────────
        print(f"\n{'─'*55}")
        print(f"  PASSO 2 → Subir para o topo da página")
        print(f"{'─'*55}")
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(500)
        print(f"  ✓ Topo alcançado")
        aguardar(page, ESPERA_PASSO, "aguardando")

        # ── PASSO 3 ───────────────────────────────────────────────────────────
        print(f"\n{'─'*55}")
        print(f"  PASSO 3 → Clicar em 'Experiência'")
        print(f"{'─'*55}")
        clicar_secao(page, "Experiência")

        # ── PASSO 4 ───────────────────────────────────────────────────────────
        print(f"\n{'─'*55}")
        print(f"  PASSO 4 → Localizar 'Conquistas ou certificados'")
        print(f"{'─'*55}")
        alvos_conquistas = [
            "text=Conquistas ou certificados",
            "text=conquistas ou certificados",
            "*:has-text('Conquistas ou certificados') >> nth=-1",
        ]
        secao_ok = False
        for sel in alvos_conquistas:
            try:
                el = page.locator(sel).first
                if el.count() and el.is_visible():
                    el.scroll_into_view_if_needed()
                    page.wait_for_timeout(500)
                    print(f"  ✓ Seção encontrada e visível")
                    secao_ok = True
                    break
            except Exception:
                continue
        if not secao_ok:
            print(f"  ⚠ Seção não encontrada — continuando mesmo assim")
        aguardar(page, ESPERA_PASSO, "aguardando")

        print(f"\n{'═'*55}")
        print(f"  Iniciando {len(certs)} certificado(s)...")
        print(f"{'═'*55}")
        t0 = time.time()

        for i, cert in enumerate(certs, 1):
            nome    = cert.get("nome", "?")
            emissor = cert.get("emissor", "")
            data    = formatar_data_mmaaaa(cert.get("data", ""))
            print(f"\n{'═'*55}")
            print(f"  CERTIFICADO {i}/{len(certs)}")
            print(f"  Nome   : {nome}")
            print(f"  Emissor: {emissor}")
            print(f"  Data   : {data}")
            print(f"{'═'*55}")

            try:
                adicionar_cert(page, cert)
                print(f"\n  ✓ Certificado {i}/{len(certs)} concluído!")
                todos.remove(cert)
                json_path.write_text(json.dumps(todos, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"  ✓ Removido do certificados.json ({len(todos)} restantes)")
            except PWTimeout:
                msg = "Timeout — elemento não apareceu"
                log(msg, "erro")
                erros.append({"cert": nome, "erro": msg})
                fechar_modal(page)
                page.wait_for_timeout(1_000)
            except Exception as e:
                log(str(e), "erro")
                erros.append({"cert": nome, "erro": str(e)})
                fechar_modal(page)
                page.wait_for_timeout(1_000)

            if i < len(certs):
                prox = certs[i]
                prox_nome = prox.get("emissor") or prox.get("nome", "?")
                print(f"\n{'─'*55}")
                print(f"  Localizando botão 'Adicionar outra conquista ou certificado'...")
                alvos_add = [
                    "text=Adicionar outra conquista ou certificado",
                    "text=adicionar outra conquista ou certificado",
                    "text=Adicionar uma conquista ou certificado",
                    "text=conquista ou certificado",
                    "button:has-text('Adicionar')",
                ]
                for sel in alvos_add:
                    try:
                        el = page.locator(sel).first
                        if el.count() and el.is_visible():
                            el.scroll_into_view_if_needed()
                            page.wait_for_timeout(400)
                            print(f"  ✓ Botão encontrado e visível")
                            break
                    except Exception:
                        continue
                print(f"\n  Próximo: {prox_nome}")
                input("  → Pressione ENTER para adicionar o próximo...")

        # ── Relatório ────────────────────────────────────────────────────────
        dur = int(time.time() - t0)
        print(f"\n{'═'*55}")
        print(f"  Concluído em {dur//60}m{dur%60:02d}s")
        log(f"Sucesso: {len(certs) - len(erros)}/{len(certs)}", "ok")
        if erros:
            log(f"Erros: {len(erros)}", "erro")
            for e in erros:
                print(f"     • {e['cert'][:50]}: {e['erro']}")
        print(f"{'═'*55}\n")

        input("Pressione ENTER para sair (o Chrome fica aberto)...")

if __name__ == "__main__":
    main()
