import {component$} from '@builder.io/qwik';
import {QwikCityProvider, RouterOutlet} from '@builder.io/qwik-city';
import {QwikCdkRoot} from '@angular-community/qwik-cdk';
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/core-prebuilt.css';
import '@angular-community/qwik-material/dialog-prebuilt.css';
import '@angular-community/qwik-material/button-prebuilt.css';
import '@angular-community/qwik-material/card-prebuilt.css';
import '@angular-community/qwik-material/toolbar-prebuilt.css';
import '@angular-community/qwik-material/badge-prebuilt.css';
import '@angular-community/qwik-material/icon-prebuilt.css';
import '@angular-community/qwik-material/progress-bar-prebuilt.css';
import '@angular-community/qwik-material/progress-spinner-prebuilt.css';
import '@angular-community/qwik-material/divider-prebuilt.css';
import '@angular-community/qwik-material/grid-list-prebuilt.css';
import '@angular-community/qwik-material/list-prebuilt.css';
import '@angular-community/qwik-material/button-toggle-prebuilt.css';
import '@angular-community/qwik-material/checkbox-prebuilt.css';

export default component$(() => (
  <QwikCityProvider>
    <head>
      <meta charSet="utf-8" />
      <title>qwik-cdk dev-app</title>
    </head>
    <body>
      <QwikCdkRoot>
        <RouterOutlet />
      </QwikCdkRoot>
    </body>
  </QwikCityProvider>
));
