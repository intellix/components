import {component$} from '@builder.io/qwik';
import {QwikCityProvider, RouterOutlet} from '@builder.io/qwik-city';
import {QwikCdkRoot} from '@angular-community/qwik-cdk';
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/dialog-prebuilt.css';
import '@angular-community/qwik-material/button-prebuilt.css';
import '@angular-community/qwik-material/card-prebuilt.css';
import '@angular-community/qwik-material/toolbar-prebuilt.css';
import '@angular-community/qwik-material/badge-prebuilt.css';

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
