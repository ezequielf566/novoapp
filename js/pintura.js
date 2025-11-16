/* =====================================================
   🔵 PINTURA.JS — Sistema de IDs + Salvamento em IndexedDB
   Compatível com Pintando a Palavra (sem alterar script.js externamente)
   ===================================================== */

console.log("%c[PINTURA] pintura.js (IndexedDB) carregado", "color:#00A8FF; font-weight:bold;");

/* =====================================================
   0. IndexedDB – Setup básico
   ===================================================== */
(function(){

  const DB_NAME = 'PintandoDB';
  const DB_VERSION = 1;
  const STORE_PAINT = 'paint';
  const STORE_IDS = 'ids';
  const STORE_PROGRESS = 'progress';

  let dbPromise = null;

  function openDB(){
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function(resolve, reject){
      try{
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function(ev){
          const db = ev.target.result;
          // Pinturas por elemento
          if (!db.objectStoreNames.contains(STORE_PAINT)){
            const store = db.createObjectStore(STORE_PAINT, { keyPath: 'key' });
            store.createIndex('by_page', 'page', { unique: false });
          }
          // IDs gerados por página
          if (!db.objectStoreNames.contains(STORE_IDS)){
            db.createObjectStore(STORE_IDS, { keyPath: 'page' });
          }
          // Progresso (estrelas, clicks, unique)
          if (!db.objectStoreNames.contains(STORE_PROGRESS)){
            db.createObjectStore(STORE_PROGRESS, { keyPath: 'page' });
          }
        };
        req.onsuccess = function(ev){
          resolve(ev.target.result);
        };
        req.onerror = function(ev){
          console.warn('[PINTURA][IDB] Erro ao abrir DB:', ev.target.error);
          reject(ev.target.error || new Error('Erro ao abrir IndexedDB'));
        };
      }catch(e){
        console.warn('[PINTURA][IDB] Falha crítica ao abrir DB:', e);
        reject(e);
      }
    });
    return dbPromise;
  }

  // Expor para outros scripts
  window.PPDB_open = openDB;

  /* =====================================================
     1. Utilidades de pintura (store paint)
     ===================================================== */

  function makePaintKey(pageNumber, elementId){
    return String(pageNumber) + '|' + String(elementId);
  }

  function saveElementColor(pageNumber, elementId, color){
    if (!elementId) return;
    const key = makePaintKey(pageNumber, elementId);
    openDB().then(function(db){
      const tx = db.transaction(STORE_PAINT, 'readwrite');
      const store = tx.objectStore(STORE_PAINT);
      store.put({
        key,
        page: String(pageNumber),
        id: String(elementId),
        color: String(color || '')
      });
      tx.oncomplete = function(){ /* ok */ };
      tx.onerror = function(ev){
        console.warn('[PINTURA][IDB] Erro ao salvar cor:', ev.target.error);
      };
    }).catch(function(err){
      console.warn('[PINTURA][IDB] saveElementColor falhou:', err);
    });
  }

  function removeElementColor(pageNumber, elementId){
    if (!elementId) return;
    const key = makePaintKey(pageNumber, elementId);
    openDB().then(function(db){
      const tx = db.transaction(STORE_PAINT, 'readwrite');
      const store = tx.objectStore(STORE_PAINT);
      store.delete(key);
      tx.oncomplete = function(){ /* ok */ };
      tx.onerror = function(ev){
        console.warn('[PINTURA][IDB] Erro ao remover cor:', ev.target.error);
      };
    }).catch(function(err){
      console.warn('[PINTURA][IDB] removeElementColor falhou:', err);
    });
  }

  function applySavedColors(svgRoot, pageNumber){
    if (!svgRoot) return;
    openDB().then(function(db){
      const tx = db.transaction(STORE_PAINT, 'readonly');
      const store = tx.objectStore(STORE_PAINT);
      let index;
      try{
        index = store.index('by_page');
      }catch(e){
        console.warn('[PINTURA][IDB] Índice by_page ausente:', e);
        return;
      }
      const req = index.getAll(String(pageNumber));
      req.onsuccess = function(ev){
        const rows = ev.target.result || [];
        let restored = 0;
        rows.forEach(function(row){
          try{
            const id = row.id;
            const color = row.color;
            if (!id) return;
            var el = svgRoot.querySelector('#' + CSS.escape(id));
            if (el && el.setAttribute){
              el.setAttribute('fill', color);
              restored++;
            }
          }catch(e){}
        });
        console.log('[PINTURA][RESTORE] Página', pageNumber, 'elementos restaurados:', restored);
      };
      req.onerror = function(ev){
        console.warn('[PINTURA][IDB] Erro ao ler cores salvas:', ev.target.error);
      };
    }).catch(function(err){
      console.warn('[PINTURA][IDB] applySavedColors falhou:', err);
    });
  }

  /* =====================================================
     2. IDs estáveis por página (store ids)
     ===================================================== */

  function loadIdsForPage(pageNumber){
    return openDB().then(function(db){
      return new Promise(function(resolve, reject){
        const tx = db.transaction(STORE_IDS, 'readonly');
        const store = tx.objectStore(STORE_IDS);
        const req = store.get(String(pageNumber));
        req.onsuccess = function(ev){
          const row = ev.target.result;
          resolve(row && row.map ? row.map : {});
        };
        req.onerror = function(ev){
          console.warn('[PINTURA][IDB] Erro ao carregar IDs:', ev.target.error);
          resolve({});
        };
      });
    });
  }

  function saveIdsForPage(pageNumber, map){
    openDB().then(function(db){
      const tx = db.transaction(STORE_IDS, 'readwrite');
      const store = tx.objectStore(STORE_IDS);
      store.put({ page: String(pageNumber), map: map || {} });
      tx.oncomplete = function(){ /* ok */ };
      tx.onerror = function(ev){
        console.warn('[PINTURA][IDB] Erro ao salvar IDs:', ev.target.error);
      };
    }).catch(function(err){
      console.warn('[PINTURA][IDB] saveIdsForPage falhou:', err);
    });
  }

  function generateIdsForSvg(svgRoot, pageNumber){
    if (!svgRoot) return;
    const tagSelector = 'path, rect, circle, polygon, ellipse, polyline';

    loadIdsForPage(pageNumber).then(function(savedMap){
      const map = savedMap || {};
      let index = 0;
      const els = svgRoot.querySelectorAll(tagSelector);
      els.forEach(function(el){
        if (!el || !el.tagName) return;
        if (map[index]){
          el.id = map[index];
        } else {
          if (!el.id){
            el.id = 'pp_' + index;
          }
          map[index] = el.id;
        }
        index++;
      });
      saveIdsForPage(pageNumber, map);
    }).catch(function(err){
      console.warn('[PINTURA][IDB] generateIdsForSvg falhou:', err);
    });
  }

  /* =====================================================
     3. Progresso / Estrelas (store progress)
     ===================================================== */

  function PPDB_saveProgress(pageId, data){
    const page = String(pageId);
    const row = {
      page,
      star: !!data.star,
      clicks: Number(data.clicks || 0),
      unique: Number(data.unique || 0)
    };
    openDB().then(function(db){
      const tx = db.transaction(STORE_PROGRESS, 'readwrite');
      const store = tx.objectStore(STORE_PROGRESS);
      store.put(row);
      tx.oncomplete = function(){ /* ok */ };
      tx.onerror = function(ev){
        console.warn('[PINTURA][IDB] Erro ao salvar progresso:', ev.target.error);
      };
    }).catch(function(err){
      console.warn('[PINTURA][IDB] PPDB_saveProgress falhou:', err);
    });
  }

  function PPDB_loadProgress(){
    return openDB().then(function(db){
      return new Promise(function(resolve, reject){
        const tx = db.transaction(STORE_PROGRESS, 'readonly');
        const store = tx.objectStore(STORE_PROGRESS);
        const req = store.getAll();
        req.onsuccess = function(ev){
          const rows = ev.target.result || [];
          const STARS = {};
          const CLICKS = {};
          const UNIQUE = {};
          rows.forEach(function(row){
            const page = String(row.page);
            if (row.star){ STARS[page] = true; }
            if (typeof row.clicks === 'number'){ CLICKS[page] = row.clicks; }
            if (typeof row.unique === 'number'){ UNIQUE[page] = row.unique; }
          });
          resolve({ STARS, CLICKS, UNIQUE });
        };
        req.onerror = function(ev){
          console.warn('[PINTURA][IDB] Erro ao carregar progresso:', ev.target.error);
          resolve({ STARS:{}, CLICKS:{}, UNIQUE:{} });
        };
      });
    });
  }

  // Expor para script.js
  window.PPDB_saveProgress = PPDB_saveProgress;
  window.PPDB_loadProgress = PPDB_loadProgress;

  /* =====================================================
     4. Debug helper (opcional)
     ===================================================== */
  function debugPaintData(pageNumber){
    console.log('[PINTURA][DEBUG] Para ver os dados, use IndexedDB (devtools) – store:', STORE_PAINT, 'page:', pageNumber);
  }
  window.debugPaintData = debugPaintData;

  /* =====================================================
     5. Listener: SVG carregado (chamado a partir de script.js)
     ===================================================== */
  document.addEventListener('svgLoaded', function(e){
    try{
      console.log('%c[PINTURA] svgLoaded recebido', 'color:#16A085; font-weight:bold;');
      const svgRoot = e.detail && e.detail.svgRoot;
      const page = e.detail && e.detail.pageNumber;
      if (svgRoot == null || page == null){
        console.warn('[PINTURA] svgLoaded sem detalhe de página ou svgRoot.');
        return;
      }
      generateIdsForSvg(svgRoot, page);
      applySavedColors(svgRoot, page);
      console.log('%c[PINTURA] Página ' + page + ' processada com sucesso.', 'color:#2ECC71; font-weight:bold;');
    }catch(err){
      console.warn('[PINTURA] Erro no handler svgLoaded:', err);
    }
  });

})();