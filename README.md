Meu aplicativo é um sistema de pintura digital inteligente em SVG. Comecei estudando e desenvolvendo sozinho, usando IA para organizar minha lógica e arquitetura, mas foi no Imersão Dev Alura com Google que consegui evoluir de verdade — entender melhor os conceitos, refinar o código e transformar a ideia em algo funcional.

O diferencial do app está no script que interpreta o SVG.
Ele identifica automaticamente:

áreas pintáveis → preenchimento branco e sem traço

áreas não pintáveis → sem preenchimento, com traço preto


O usuário só toca e pinta exatamente onde é permitido, sem números e sem arrastar o dedo.
Essa lógica combina configuração no Illustrator com interpretação automática em JavaScript.

Além disso, todo o progresso é salvo graças a 5 chaves no localStorage, que eu projetei com apoio da IA para manter tudo organizado:

1️⃣ pp_pageColors – salva as cores aplicadas.
2️⃣ pp_svgIdMap – mantém os IDs estáveis do SVG.
3️⃣ pp_stars_v2 – registra estrelas concluídas.
4️⃣ pp_clicks_v2 – conta os toques (14 = estrela).
5️⃣ pp_uniquecount_v1 – mede o progresso real.

Com isso, o app funciona como um livro digital de colorir inteligente:
interpreta o SVG sozinho, salva tudo automaticamente, libera conquistas, permite exportar em PNG.

Meu objetivo foi criar uma experiência de pintura intuitiva, acessível e totalmente persistente, unindo o que aprendi sozinho, com IA e com o conteúdo do Imersão Dev.

Esse projeto me fez evoluir muito nas áreas de lógica, leitura de SVG e organização de estado.
