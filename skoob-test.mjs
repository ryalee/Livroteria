
const isbn = "0143109464";

const response = await fetch(
  `https://www.skoob.com.br/pt/search?searchTerm=${isbn}&tab=book`,
  {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      "Next-Action": "40a8165bb14a97b1360dd0e820ce6d5ba794aa2fb5",
    },
    body: JSON.stringify([
      {
        searchType: "book",
        params: {
          page: 1,
          limit: 12,
          searchTerm: isbn,
        },
      },
    ]),
  }
);

console.log("Status:", response.status);
console.log("Content-Type:", response.headers.get("content-type"));
console.log("Resposta:", await response.text());
