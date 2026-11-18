      $("resultModal").classList.add("hidden");$("nextBtn").disabled=true;
      buildGrid();updateHud();
    }
    return true;
  }catch(error){
    console.error("House game initialization failed:",error);
    const detail=(error?.name?error.name+": ":"")+(error?.message||String(error)||"خطأ غير معروف");
    const loading=document.getElementById("loading");
    if(loading){
      loading.style.display="grid";
      loading.style.zIndex="5";
      loading.style.padding="18px";
      loading.style.textAlign="center";
      loading.style.whiteSpace="normal";
      loading.textContent="تعذر تجهيز اللوحة\n"+detail;
    }
    const diagnostic=document.getElementById("toast");
    if(diagnostic){diagnostic.textContent="تعذر تشغيل اللعبة: "+detail;diagnostic.classList.add("show");}
    return false;
  }
};
window.addEventListener("DOMContentLoaded",()=>{
  const launch=$("startGameBtn"),screen=$("startScreen"),facebookModal=$("facebookModal");
  let launching=false;
  const launchAsGuest=()=>{
    if(launching||!launch||!screen)return;
    launching=true;
    ensureGuestIdentity();
    launch.disabled=true;launch.textContent="جاري فتح المملكة...";
    screen.classList.add("start-screen-leaving");
    setTimeout(()=>{
      screen.remove();
      window.CMRShowWorldMap?.();
      if(!document.getElementById("worldMap")){
        launching=false;launch.disabled=false;launch.textContent="العب كضيف";
        say("الخريطة مش جاهزة، حدّث الصفحة وحاول تاني.");
      }
    },520);
  };
  // Every optional screen control is bound defensively; a missing modal button
  // must never abort the game bootstrap.
  const bindOptional=(id,handler)=>{
    const element=$(id);
    if(element)element.addEventListener("click",handler);
  };
  bindOptional("facebookLoginBtn",()=>{
    if(facebookModal)facebookModal.classList.remove("hidden");
  });
  bindOptional("facebookCloseBtn",()=>{
    if(facebookModal)facebookModal.classList.add("hidden");
  });
  bindOptional("facebookGuestBtn",()=>{
    if(facebookModal)facebookModal.classList.add("hidden");
    launchAsGuest();
  });
});
})();
