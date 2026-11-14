# Livroteria

Livroteria é um recomendador de livros que combina as preferências de leitura e o estado emocional do usuário para sugerir títulos. As informações dos livros vêm da API do Google Books, com preferência por edições em português quando disponíveis.

Os estilos escolhidos, o humor e o ritmo de leitura são associados a categorias literárias. Para recomendações do catálogo, o app busca essas categorias no Google Books, combina os resultados e classifica os títulos. Para recomendações da estante, aplica a mesma seleção de categorias aos gêneros e categorias dos livros salvos.

## Funcionalidades

- **Curadoria personalizada:** escolha estilos de leitura, ritmo e humor para receber recomendações.
- **Busca no Google Books:** pesquise livros por título, autor ou gênero e consulte os dados e capas retornados pela API.
- **Estante pessoal:** salve livros para consultar depois e peça recomendações limitadas aos títulos salvos.
- **Descrições em português:** quando uma descrição em português não estiver disponível, o app informa isso e exibe a descrição original em inglês, se houver.
- **Links para leitura:** acesse resultados do livro no Skeelo, Skoob e no Google Books.
- **Interface responsiva:** navegação adaptada para telas grandes e dispositivos móveis.

Os livros da estante são armazenados no `localStorage` do navegador. Não é necessário criar uma conta, mas os dados ficam apenas naquele navegador e dispositivo; **NÃO** há sincronização entre usuários ou dispositivos.

## Stack

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/) 
- [TypeScript](https://www.typescriptlang.org/)
- [PostgreSQL no Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide](https://lucide.dev/)
- [Google Books API](https://developers.google.com/books)
