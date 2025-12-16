import"./chunks/modulepreload-polyfill-B5Qt9EMX.js";import{s as l}from"./chunks/storage-DOvsNEMd.js";document.addEventListener("DOMContentLoaded",async()=>{const s=document.getElementById("enableToggle"),a=document.getElementById("toggleLabel"),r=document.getElementById("totalWords"),g=document.getElementById("todayWords"),h=document.getElementById("learnedCount"),m=document.getElementById("memorizeCount"),u=document.getElementById("cacheSize"),C=document.getElementById("hitRate"),n=document.getElementById("processBtn"),b=document.getElementById("settingsBtn");async function d(){const o=(await l.getConfig()).enabled!==!1;s.checked=o,a.textContent=o?"已启用":"已禁用",a.className=`toggle-label ${o?"enabled":"disabled"}`,chrome.runtime.sendMessage({action:"getStats"},t=>{if(t){r.textContent=c(t.totalWords),g.textContent=c(t.todayWords),h.textContent=c(t.learnedCount),m.textContent=c(t.memorizeCount);const i=t.cacheHits+t.cacheMisses,v=i>0?Math.round(t.cacheHits/i*100):0;C.textContent=v+"%"}}),chrome.runtime.sendMessage({action:"getCacheStats"},t=>{t&&(u.textContent=`${t.size}/${t.maxSize}`)})}function c(e){return e>=1e4?(e/1e4).toFixed(1)+"万":e>=1e3?(e/1e3).toFixed(1)+"k":e.toString()}s.addEventListener("change",async()=>{const e=s.checked;await l.set({enabled:e}),a.textContent=e?"已启用":"已禁用",a.className=`toggle-label ${e?"enabled":"disabled"}`,chrome.tabs.query({active:!0,currentWindow:!0},o=>{o[0]&&chrome.tabs.sendMessage(o[0].id,{action:e?"processPage":"restorePage"})})}),n.addEventListener("click",async()=>{n.disabled=!0,n.innerHTML=`
      <svg class="spinning" viewBox="0 0 24 24" width="18" height="18">
        <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
      </svg>
      处理中...
    `;try{const[e]=await chrome.tabs.query({active:!0,currentWindow:!0});e&&chrome.tabs.sendMessage(e.id,{action:"processPage"},o=>{setTimeout(()=>{n.disabled=!1,n.innerHTML=`
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
              </svg>
              处理当前页面
            `,d()},1e3)})}catch(e){console.error("Error processing page:",e),n.disabled=!1,n.innerHTML=`
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
        </svg>
        处理当前页面
      `}}),b.addEventListener("click",()=>{chrome.runtime.openOptionsPage()}),d(),setInterval(d,5e3)});
