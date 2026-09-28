const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});const p=await b.newPage();await p.setContent('<canvas id=c></canvas>');
console.log('ok',await p.evaluate(async()=>{const c=document.getElementById('c').getContext('2d');const o=new OfflineAudioContext(2,44100,44100);const osc=o.createOscillator();osc.connect(o.destination);osc.start();const buf=await o.startRendering();return [!!c,buf.length]}));await b.close()})();
