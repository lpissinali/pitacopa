# Bolão Copa 2026 — Guia de Setup

## Estrutura de Arquivos

```
bolao2026/
├── index.html          ← Landing page (PT/EN)
├── login.html          ← Login / Registro
├── dashboard.html      ← Meus Bolões
├── bolao.html          ← Página do Bolão (ranking, palpites, convite)
├── join.html           ← Página de convite via link
├── SETUP.md            ← Este arquivo
├── css/
│   └── style.css       ← Todos os estilos
└── js/
    ├── config.js       ← Firebase config (EDITAR AQUI)
    ├── i18n.js         ← Traduções PT/EN
    ├── wc2026.js       ← Dados da Copa 2026 (times, grupos, jogos)
    ├── scoring.js      ← Lógica de pontuação
    └── utils.js        ← Utilitários (toast, clipboard, etc.)
```

---

## 1. Configurar Firebase (OBRIGATÓRIO)

### Passo a passo:

1. Acesse https://console.firebase.google.com/
2. Clique em "Criar Projeto" → nome: `bolao-copa-2026`
3. No projeto, clique em **"Adicionar app"** → escolha **Web** (`</>`)
4. Copie o objeto `firebaseConfig` gerado
5. Cole em `js/config.js` substituindo os valores `"YOUR_..."`:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "bolao-copa-2026.firebaseapp.com",
  projectId: "bolao-copa-2026",
  storageBucket: "bolao-copa-2026.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Habilitar Autenticação:
- Firebase Console → Authentication → Sign-in Method
- Habilite: **Email/senha** e **Google**

### Habilitar Firestore:
- Firebase Console → Firestore Database → Criar banco de dados
- Escolha **Modo de teste** (para começar)
- Após lançar, configure regras de segurança adequadas

---

## 2. Regras do Firestore (Security Rules)

Coloque estas regras em Firebase Console → Firestore → Regras:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: leitura pública, escrita própria
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    // Bolões: qualquer autenticado pode ler
    match /boloes/{bolaoId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    // Participantes
    match /bolao_participants/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    // Palpites: cada um escreve o seu
    match /bolao_predictions/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        docId.matches(request.auth.uid + ".*") ||
        docId.matches(".*_" + request.auth.uid);
    }
    // Resultados: somente leitura para todos (admin escreve pelo console)
    match /results/{gameId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only via Firebase Console
    }
  }
}
```

---

## 3. Hospedagem (Deploy)

### Opção A — Firebase Hosting (Recomendado)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Selecione seu projeto, public dir: "." (raiz do bolao2026)
firebase deploy
```

### Opção B — Netlify (Arrasta e solta)
1. Acesse netlify.com
2. Arraste a pasta `bolao2026` para o deploy
3. Pronto! URL gerada automaticamente

### Opção C — GitHub Pages
1. Suba o projeto para um repo GitHub
2. Settings → Pages → Deploy from branch `main`

---

## 4. Monetização

### AdSense
1. Crie conta em https://adsense.google.com/
2. Aguarde aprovação (site precisa ter conteúdo e tráfego)
3. Substitua os comentários `<!-- AdSense -->` nos HTMLs pelo código real:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossorigin="anonymous"></script>
<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXX" data-ad-slot="XXXXXXXX" data-ad-format="auto" data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

### Afiliados (Casas de Análise/Apostas)
Substitua `https://SEU-LINK-AFILIADO.com` nos arquivos HTML pelo seu link de afiliado.

Programas sugeridos para pesquisar:
- **Bet365 Affiliates** — https://affiliates.bet365.com/
- **Sportingbet** — programa de afiliados próprio
- **Betano** — Betano Partners
- **Amazon** — produtos esportivos (camisetas, etc.)
- **Futfanatics / Netshoes** — artigos esportivos

---

## 5. Como inserir resultados dos jogos

Os resultados são inseridos manualmente no Firestore (por você, o admin):

1. Firebase Console → Firestore → Coleção `results`
2. Crie documento com ID = ID do jogo (ex: `G001`)
3. Campos:
   ```
   home: 2        (gols time da casa)
   away: 1        (gols visitante)
   confirmed: true
   ```

Futuramente, você pode criar uma página `/admin` protegida por senha para inserir resultados via interface.

---

## 6. Próximos passos (roadmap)

- [ ] Página Admin para inserir resultados
- [ ] Palpites na fase eliminatória (oitavas, quartas, semi, final)
- [ ] Notificações por e-mail antes dos jogos
- [ ] Histórico de pontuação jogo a jogo
- [ ] Chat/comentários no bolão
- [ ] Integração com API de resultados (Football-Data.org - gratuito)

---

## Pontuação
| Evento | Pontos |
|--------|--------|
| Placar exato | 3 pts |
| Resultado correto | 1 pt |
| Campeão | 10 pts |
| Vice-campeão | 5 pts |
| Artilheiro | 5 pts |

Desempate: Placares exatos → Resultados corretos → Nome (A-Z)
