/* =====================================================
   🔵 PINTURA.JS — Sistema de IDs + Salvamento Local
   Compatível com Pintando a Palavra (sem alterar script.js)
   ===================================================== */

console.log("%c[PINTURA] pintura.js carregado", "color:#00A8FF; font-weight:bold;");

// LocalStorage seguro
function loadJSON(key, fallback) {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
    } catch (e) {
        console.warn("[PINTURA] Erro ao carregar JSON:", key, e);
        return fallback;
    }
}

function saveJSON(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn("[PINTURA] Erro ao salvar JSON:", key, e);
    }
}

// Banco de cores por página
let PAGE_COLORS = loadJSON("pp_pageColors", {}); 
let SVG_ID_MAP  = loadJSON("pp_svgIdMap", {});   // Para manter IDs estáveis

/* =====================================================
   1. GERAR IDs POR ELEMENTO DO SVG
   ===================================================== */
function generateIdsForSvg(svgRoot, pageNumber) {
    console.log("%c[ID] Gerando IDs para SVG da página " + pageNumber, "color:#8E44AD; font-weight:bold;");

    if (!SVG_ID_MAP[pageNumber]) SVG_ID_MAP[pageNumber] = [];

    let index = 0;

    svgRoot.querySelectorAll("path, rect, circle, polygon, ellipse, polyline").forEach(el => {
        // Se já existe ID salvo → reaplica
        if (SVG_ID_MAP[pageNumber][index]) {
            el.id = SVG_ID_MAP[pageNumber][index];
        } else {
            // Se o elemento já tem ID natural → usa ele
            if (!el.id) {
                el.id = "pp_" + index;
            }
            SVG_ID_MAP[pageNumber][index] = el.id;
        }
        index++;
    });

    saveJSON("pp_svgIdMap", SVG_ID_MAP);
    console.log("[ID] Total de elementos com ID:", index);
}

/* =====================================================
   2. SALVAR COR DA PARTE PINTADA
   ===================================================== */
function saveElementColor(pageNumber, elementId, color) {
    if (!PAGE_COLORS[pageNumber]) PAGE_COLORS[pageNumber] = {};

    PAGE_COLORS[pageNumber][elementId] = color;
    saveJSON("pp_pageColors", PAGE_COLORS);

    console.log("%c[PAINT] Salvo:", "color:#27AE60; font-weight:bold;", 
                "Página:", pageNumber, "| Elemento:", elementId, "| Cor:", color);
}

/* =====================================================
   3. REMOVER COR SALVA (BORRACHA / VOLTAR AO PADRÃO)
   ===================================================== */
function removeElementColor(pageNumber, elementId) {
    if (PAGE_COLORS[pageNumber]) {
        delete PAGE_COLORS[pageNumber][elementId];
        saveJSON("pp_pageColors", PAGE_COLORS);
        console.log("%c[PAINT] Removido registro:", "color:#E67E22; font-weight:bold;", elementId);
    }
}

/* =====================================================
   4. RESTAURAR PINTURA AO ABRIR A PÁGINA
   ===================================================== */
function applySavedColors(svgRoot, pageNumber) {
    console.log("%c[RESTORE] Restaurando pintura da página " + pageNumber,
                "color:#2980B9; font-weight:bold;");

    const saved = PAGE_COLORS[pageNumber];

    if (!saved) {
        console.log("[RESTORE] Nada salvo para esta página.");
        return;
    }

    let restoredCount = 0;

    for (let elementId in saved) {
        const el = svgRoot.querySelector("#" + elementId);
        if (el) {
            el.setAttribute("fill", saved[elementId]);
            restoredCount++;
        }
    }

    console.log("[RESTORE] Total restaurado:", restoredCount, "elementos.");
}

/* =====================================================
   5. DEBUG MANUAL (para você testar)
   ===================================================== */
function debugPaintData(pageNumber) {
    console.log("------ DEBUG PINTURA PAGE " + pageNumber + " ------");
    console.log("IDs:", SVG_ID_MAP[pageNumber]);
    console.log("Cores:", PAGE_COLORS[pageNumber]);
}

/* =====================================================
   6. INTEGRAÇÃO AUTOMÁTICA COM O SCRIPT PRINCIPAL
   ===================================================== */

document.addEventListener("svgLoaded", function (e) {
    const svgRoot = e.detail.svgRoot;
    const page = e.detail.pageNumber;

    console.log("%c[EVENT] svgLoaded → pintura.js ativado", "color:#16A085; font-weight:bold;");

    generateIdsForSvg(svgRoot, page);
    applySavedColors(svgRoot, page);
});

/*
 Agora falta apenas o script.js disparar o evento após carregar o SVG:

    document.dispatchEvent(new CustomEvent("svgLoaded", {
        detail: { svgRoot, pageNumber }
    }));

Se precisar, posso inserir essa linha no seu script.js sem mexer em mais nada.
*/
