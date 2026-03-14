const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // URL de base corrigée du Google Site (domaine .com pour l'hébergement Google)
  const BASE_URL = 'https://sites.google.com/indse.be/mathematiques';
  
  // Reconstruire l'URL demandée (pour gérer les sous-pages correctement)
  const targetUrl = `${BASE_URL}${req.url === '/' ? '' : req.url}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        // Transmettre les headers essentiels pour tromper d'éventuels anti-bots
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Accept': req.headers['accept'] || 'text/html',
        'Accept-Language': req.headers['accept-language'] || 'fr-FR,fr;q=0.9'
      }
    });

    const contentType = response.headers.get('content-type') || '';

    // Si la réponse est du HTML, on intercepte et on injecte le code PWA
    if (contentType.includes('text/html')) {
      let html = await response.text();

      const pwaInjection = `
        <link rel="manifest" href="/manifest.json">
        <script>
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(reg) { console.log('Service Worker enregistré. Scope:', reg.scope); })
                .catch(function(err) { console.error('Erreur Service Worker:', err); });
            });
          }
        </script>
      `;

      // Injection juste avant </head>
      html = html.replace('</head>', `${pwaInjection}\n</head>`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(response.status).send(html);
    } else {
      // Si ce n'est pas du HTML (images, scripts internes du Google Site), on proxy le flux brut
      res.setHeader('Content-Type', contentType);
      const buffer = await response.buffer();
      res.status(response.status).send(buffer);
    }
  } catch (error) {
    console.error('Erreur Proxy :', error);
    res.status(500).send('Erreur lors de la récupération du Google Site.');
  }
};
