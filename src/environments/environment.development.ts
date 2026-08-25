export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyBvQmd9ZRTczIo_RC_DkTlHNC3MX27Dz3I',
    authDomain: 'conecta-news-cc.firebaseapp.com',
    projectId: 'conecta-news-cc',
    storageBucket: 'conecta-news-cc.firebasestorage.app',
    messagingSenderId: '176718362145',
    appId: '1:176718362145:web:122bd8d9016861f0289560',
  },
  // Cloud Name e upload preset são identificadores públicos do Cloudinary,
  // não o API Secret. O preset precisa estar configurado como "unsigned" no
  // painel do Cloudinary para o upload funcionar direto do navegador.
  cloudinary: {
    cloudName: 'ln0ammb1',
    uploadPreset: 'conecta_news',
  },
};
