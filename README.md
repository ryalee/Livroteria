# Livroteria

Livroteria é um recomendador de livros que combina as preferências de leitura e o estado emocional do usuário para sugerir títulos. As informações dos livros vêm da API do Google Books, com preferência por edições em português quando disponíveis.

## Funcionalidades

- **Curadoria personalizada:** escolha estilos de leitura, ritmo e humor para receber recomendações.
- **Busca no Google Books:** pesquise livros por título, autor ou gênero e consulte os dados e capas retornados pela API.
- **Estante pessoal:** salve livros para consultar depois e peça recomendações limitadas aos títulos salvos.
- **Descrições em português:** quando uma descrição em português não estiver disponível, o app informa isso e exibe a descrição original em inglês, se houver.
- **Links para leitura:** acesse resultados do livro no Skeelo e no Google Books.
- **Interface responsiva:** navegação adaptada para telas grandes e dispositivos móveis.

Os livros da estante são armazenados no `localStorage` do navegador. Não é necessário criar uma conta, mas os dados ficam apenas naquele navegador e dispositivo; não há sincronização entre usuários ou dispositivos.

## Stack

- [Next.js](https://nextjs.org/) 14 com App Router
- [React](https://react.dev/) 18
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) para animações
- [Lucide](https://lucide.dev/) para ícones
- [Google Books API](https://developers.google.com/books)

Os títulos usam Archivo Black e a interface usa Manrope, com uma paleta inspirada em verde-floresta (`#0A3A23`) e verde-sálvia (`#688763`).


## Como funcionam as recomendações

Na curadoria, os estilos escolhidos, o humor e o ritmo de leitura são associados a categorias literárias. Para recomendações do catálogo, o app busca essas categorias no Google Books, combina os resultados e classifica os títulos. Para recomendações da estante, aplica a mesma seleção de categorias aos gêneros e categorias dos livros salvos.