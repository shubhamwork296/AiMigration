import 'hammerjs';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

const glassboxScript = document.createElement('script');
glassboxScript.id = "_cls_detector";
glassboxScript.src = `${environment.glassboxSrc}`;
glassboxScript.setAttribute("data-clsconfig", `reportURI=https://c2001.report.gbss.io/3q3x1voz/glassbox/reporting/${environment.glassboxScriptID}/cls_report`);
document.head.appendChild(glassboxScript);
const gtagScript = document.createElement('script');
gtagScript.innerHTML = `window.dataLayer = window.dataLayer || [];`;
gtagScript.innerHTML = `function gtag() { dataLayer.push(arguments); }
gtag('consent', 'default', {
'ad_storage': 'denied',
'analytics_storage': 'denied',
'wait_for_update': 500
});
gtag('set', 'ads_data_redaction', true);`;
document.head.appendChild(gtagScript);

const script = document.createElement('script');
script.innerHTML = ` (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','`+ environment.gtmCode + `');`;
document.head.appendChild(script);

// add monetate script to <head>
const monetateScript = document.createElement('script');
monetateScript.src = environment.monetateScriptUrl;
document.head.appendChild(monetateScript);

// add Google Tag Manager Data layer script to <head>
const scriptGTMDataLayer = document.createElement('script');
scriptGTMDataLayer.innerHTML = `window.dataLayer = window.dataLayer || [];`;
document.head.appendChild(scriptGTMDataLayer);


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
