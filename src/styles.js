const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --cr:#FDF6EE;--cr2:#FAF0E6;--pxs:#FEF3EE;--psm:#FDEEE6;
  --pe:#F2A58E;--ro:#E07B6A;--ro2:#C96150;
  --dp:#7A3A30;--sg:#7BA68A;--sg2:#5A8A6E;
  --mu:#A08880;--tx:#3D2B26;--bd:#EEE0D6;--wh:#FFF;
  --sh:rgba(139,74,60,0.10);--sh2:rgba(139,74,60,0.16);
}
html,body{height:100%;background:var(--ro2);font-family:'Plus Jakarta Sans',sans-serif;touch-action:manipulation;overscroll-behavior:none;}
#root{display:flex;justify-content:center;height:100%;}
.shell{width:100%;max-width:430px;height:100%;background:var(--cr);display:flex;flex-direction:column;margin:0 auto;touch-action:manipulation;overscroll-behavior:none;}
.screen{flex:1;overflow-y:auto;overflow-x:hidden;padding-bottom:calc(80px + env(safe-area-inset-bottom));-webkit-overflow-scrolling:touch;scrollbar-width:none;overscroll-behavior:none;}
.screen::-webkit-scrollbar{display:none;}
/* Nav */
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:var(--wh);border-top:1px solid var(--bd);display:flex;z-index:200;padding:8px 0 0;padding-bottom:max(16px,env(safe-area-inset-bottom));box-shadow:0 -6px 24px var(--sh2);transition:transform .25s ease,opacity .25s ease;}
body.sheet-open .bnav{transform:translateX(-50%) translateY(100%);opacity:0;pointer-events:none;}
.ni{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;border:none;background:none;color:var(--mu);padding:8px 0 6px;transition:color .2s;font-family:'Plus Jakarta Sans',sans-serif;}
.ni.on{color:var(--ro);}
.ni-i{font-size:22px;line-height:1;transition:transform .2s;}
.ni.on .ni-i{transform:scale(1.12);}
.ni-l{font-size:10px;font-weight:700;letter-spacing:.02em;}
/* Header */
.hdr{background:linear-gradient(150deg,var(--ro2) 0%,var(--ro) 45%,var(--pe) 100%);padding:max(52px,calc(env(safe-area-inset-top) + 16px)) 20px 28px;position:relative;overflow:hidden;}
.hdr::before{content:'';position:absolute;top:-50px;right:-50px;width:220px;height:220px;background:rgba(255,255,255,.07);border-radius:50%;}
.hdr::after{content:'';position:absolute;bottom:-70px;left:-40px;width:180px;height:180px;background:rgba(255,255,255,.05);border-radius:50%;}
.hdr-in{position:relative;z-index:1;}
/* Cards */
.card{background:var(--wh);border-radius:20px;padding:18px;box-shadow:0 2px 14px var(--sh);border:1px solid var(--bd);overflow:hidden;}
.csm{background:var(--wh);border-radius:14px;padding:13px 15px;box-shadow:0 2px 10px var(--sh);border:1px solid var(--bd);}
.cpe{background:var(--psm);border-radius:14px;padding:13px 15px;border:1px solid var(--bd);}
/* Buttons */
.btn{display:flex;align-items:center;justify-content:center;gap:8px;border:none;border-radius:14px;padding:13px 18px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:700;width:100%;transition:all .18s;text-decoration:none;}
.br{background:linear-gradient(135deg,var(--ro2),var(--pe));color:white;box-shadow:0 4px 16px rgba(224,123,106,.38);}
.br:active{transform:scale(.97);}
.bs{background:linear-gradient(135deg,var(--sg2),var(--sg));color:white;box-shadow:0 4px 14px rgba(90,138,110,.32);}
.bg{background:var(--psm);color:var(--dp);border:1.5px solid var(--bd);font-size:13px;}
.bd2{background:#FEF2F2;color:#DC2626;border:1.5px solid #FECACA;font-size:13px;}
/* Form */
.lbl{display:block;font-size:11px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px;}
.inp{width:100%;background:var(--pxs);border:1.5px solid var(--bd);border-radius:12px;padding:11px 13px;font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;color:var(--tx);outline:none;transition:border-color .2s;touch-action:manipulation;-webkit-text-size-adjust:100%;}
.inp:focus{border-color:var(--pe);}
textarea.inp{resize:vertical;min-height:76px;}
select.inp{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23A08880' d='M6 8L0 0h12z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center;padding-right:36px;}
input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
input[type=number]{-moz-appearance:textfield;}
input[type=date].inp{min-width:0;width:100%;max-width:100%;-webkit-min-logical-width:0;-webkit-appearance:none;display:block;}
.ig{margin-bottom:14px;width:100%;overflow:hidden;}
/* Sheet */
.ovl{position:fixed;inset:0;background:rgba(61,43,38,.52);z-index:1000;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;touch-action:none;}
.sht{background:var(--cr);border-radius:24px 24px 0 0;width:100%;max-width:430px;max-height:85vh;max-height:85dvh;overflow-y:auto;overflow-x:hidden;padding:0 18px 36px;animation:sU .32s cubic-bezier(.16,1,.3,1) both;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch;}
.sht::-webkit-scrollbar{display:none;}
@keyframes sU{from{transform:translateY(100%);}to{transform:translateY(0);}}
.hndl{width:36px;height:4px;background:var(--bd);border-radius:2px;margin:12px auto 18px;}
/* Tabs */
.tabs{display:flex;background:var(--psm);border-radius:13px;padding:4px;gap:3px;}
.tab{flex:1;padding:9px 4px;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;color:var(--mu);border:none;background:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:5px;}
.tab.on{background:var(--wh);color:var(--dp);box-shadow:0 2px 8px var(--sh);}
/* Chip */
.chip{background:var(--wh);border-radius:13px;padding:11px 7px;text-align:center;border:1px solid var(--bd);flex:1;}
.cv{font-family:'Lora',serif;font-size:17px;font-weight:700;color:var(--dp);display:block;line-height:1;margin-bottom:3px;}
.cl{font-size:9px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.04em;}
/* Tags */
.tag{background:var(--psm);color:var(--dp);border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px;border:1px solid var(--bd);}
.tsg{background:rgba(123,166,138,.14);color:var(--sg2);border-color:rgba(123,166,138,.28);}
.trd{background:#FEF2F2;color:#DC2626;border-color:#FECACA;}
/* Alerts */
.asa{background:rgba(123,166,138,.1);border:1px solid rgba(123,166,138,.3);border-radius:13px;padding:13px;color:var(--sg2);font-size:13px;}
.are{background:#FEF2F2;border:1px solid #FECACA;border-radius:13px;padding:13px;color:#DC2626;font-size:13px;}
.aam{background:#FFFBEB;border:1px solid #FDE68A;border-radius:13px;padding:13px;color:#92400E;font-size:13px;}
/* Visit card */
.vc{background:var(--wh);border-radius:16px;padding:14px 16px;margin-bottom:10px;border:1px solid var(--bd);box-shadow:0 2px 10px var(--sh);cursor:pointer;transition:all .18s;}
.vc:active{transform:scale(.98);}
.badge{background:linear-gradient(135deg,var(--ro),var(--pe));color:white;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:800;display:inline-block;}
/* Ring */
.ring{transform:rotate(-90deg);}
/* Mode toggle */
.mtog{display:flex;gap:8px;margin-bottom:20px;}
.mopt{flex:1;border:2px solid var(--bd);border-radius:14px;padding:14px 10px;cursor:pointer;background:var(--wh);text-align:center;transition:all .2s;font-family:'Plus Jakarta Sans',sans-serif;}
.mopt.on{border-color:var(--ro);background:var(--pxs);}
/* Upload zone */
.drop{border:2.5px dashed var(--pe);border-radius:18px;padding:32px 18px;text-align:center;background:var(--pxs);cursor:pointer;transition:all .2s;}
.drop:active{border-color:var(--ro);background:var(--psm);}
/* AI box */
.aibox{background:linear-gradient(135deg,rgba(123,166,138,.1),rgba(90,138,110,.04));border:1px solid rgba(123,166,138,.3);border-radius:14px;padding:15px;}
/* Loading dots */
@keyframes dot{0%,80%,100%{opacity:.2;transform:scale(.8);}40%{opacity:1;transform:scale(1);}}
.d{display:inline-block;animation:dot 1.4s infinite both;}
.d2{animation-delay:.2s;}.d3{animation-delay:.4s;}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
/* Kick btn */
.kbtn{width:170px;height:170px;border-radius:50%;background:linear-gradient(145deg,var(--ro2),var(--ro),#F5B4A0);border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;box-shadow:0 8px 28px rgba(224,123,106,.42),0 0 0 14px rgba(224,123,106,.09);transition:all .15s;animation:kp 2.5s infinite;}
.kbtn:active{transform:scale(.91);animation:none;}
@keyframes kp{0%,100%{box-shadow:0 8px 28px rgba(224,123,106,.42),0 0 0 14px rgba(224,123,106,.09);}50%{box-shadow:0 8px 28px rgba(224,123,106,.42),0 0 0 22px rgba(224,123,106,.05);}}
/* Checklist */
.ci{display:flex;align-items:center;gap:11px;padding:12px 0;border-bottom:1px solid var(--bd);cursor:pointer;}
.ci:last-child{border-bottom:none;}
.cb{width:21px;height:21px;border-radius:7px;border:2px solid var(--bd);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.cb.on{background:var(--sg);border-color:var(--sg);color:white;font-size:12px;}
/* Hscroll */
.hsc{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;}
.hsc::-webkit-scrollbar{display:none;}
.mc{flex-shrink:0;width:110px;background:var(--wh);border-radius:13px;padding:12px 9px;border:1px solid var(--bd);text-align:center;}
.mc.p{border-color:rgba(123,166,138,.4);background:rgba(123,166,138,.06);}
/* Summary doc */
.doc{background:var(--wh);border-radius:18px;padding:20px;margin-bottom:12px;border:1px solid var(--bd);}
.doc-hdr{border-bottom:2px solid var(--bd);padding-bottom:13px;margin-bottom:14px;}
.doc-sec{border-top:1px solid var(--bd);padding-top:12px;margin-top:12px;}
.doc-row{display:flex;justify-content:space-between;align-items:flex-start;padding:5px 0;border-bottom:1px dashed rgba(238,224,214,.6);}
.doc-row:last-child{border-bottom:none;}
/* Animations */
@keyframes fU{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
.fu{animation:fU .36s ease both;}
.f1{animation-delay:.04s;}.f2{animation-delay:.08s;}.f3{animation-delay:.13s;}.f4{animation-delay:.18s;}.f5{animation-delay:.23s;}
/* Contraction */
.cbtn{width:130px;height:130px;border-radius:50%;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif;}
.cst{background:linear-gradient(145deg,var(--ro2),var(--ro));color:white;box-shadow:0 6px 22px rgba(224,123,106,.4);}
.csp{background:linear-gradient(145deg,var(--sg2),var(--sg));color:white;box-shadow:0 6px 22px rgba(90,138,110,.4);}
.cbtn:active{transform:scale(.92);}
/* Obat tags */
.otag{display:inline-flex;align-items:center;gap:5px;background:var(--psm);border:1px solid var(--bd);border-radius:20px;padding:5px 10px;font-size:12px;font-weight:600;color:var(--dp);margin:3px;}
`;
