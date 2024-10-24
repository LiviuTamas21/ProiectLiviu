const API_KEY = "JxKDteywaIq0b+D0z/17PA==oceHq6mHfupGJgKv";
const stocks = [
  "NVDA",
  "INTC",
  "AMZN",
  "SNAP",
  "AAPL",
  "AMD",
  "F",
  "TSLA",
  "PLTR",
  "LUMN",
];
const selectedStocks = [];
const stockLogoPlaceholder = "resources/stock_logo_placeholder.png";
let portfolio = [];
let availableStocks = [];
let totalValue = 0;
const body = document.querySelector("body");
const stocksListContainer = document.querySelector(".stocks-list");
const portfolioValue = document.querySelector("#portfolio-value h1");
const container = document.querySelector("#stocks-container .portfolio-stocks");

function loading(state) {
  const loading = document.querySelector(".loading");

  if (state && !loading) {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "loading";

    document.body.append(loadingDiv);
  } else if (!state && loading) {
    loading.remove();
  }
}

function amountModal(stock) {
  return new Promise((resolve) => {
    const existingModal = document.querySelector(".modal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.className = "modal";

    const modalContainer = document.createElement("div");
    modalContainer.className = "modal-container";

    const h3 = document.createElement("h3");
    h3.innerText = `How many ${stock.ticker} shares do you own?`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";

    const btn = document.createElement("input");
    btn.type = "button";
    btn.value = "Confirm";

    const closeModalBtn = document.createElement("span");
    closeModalBtn.className = "close-btn";
    closeModalBtn.innerText = "×"; 

    modalContainer.append(closeModalBtn, h3, input, btn);
    modal.append(modalContainer);
    document.body.append(modal);

    closeModalBtn.addEventListener("click", () => {
      modal.remove();
    });

    btn.addEventListener("click", () => {
      const amount = input.value;
      if (amount && Number(amount) > 0) {
        modal.remove();
        resolve(Number(amount));
      } else {
        alert(`Please enter a valid number of shares.`);
      }
    });

    input.focus();
  });
}

function displayPortfolioValue(portfolio) {
  totalValue = portfolio.reduce(
    (acc, stock) => acc + stock.amount * stock.price,
    0
  );
  portfolioValue.innerText = `$${totalValue.toFixed(2)}`;
}

async function fetchStockDetails(ticker) {
  try {
    loading(true);
    
    const response = await fetch(
      `https://api.api-ninjas.com/v1/stockprice?ticker=${ticker}`,
      {
        method: "GET",
        headers: { "X-Api-Key": API_KEY },
        contentType: "application/json",
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching stock data:", error);
  } finally {
    loading(false);
  }
}

async function fetchStockLogos() {
  try {
    loading(true);

    const logoRequests = stocks.map((stock) => {
      return fetch(`https://api.api-ninjas.com/v1/logo?ticker=${stock}`, {
        method: "GET",
        headers: { "X-Api-Key": API_KEY },
        contentType: "application/json",
      });
    });

    const responses = await Promise.all(logoRequests);
    const logos = await Promise.all(
      responses.map(async (response, index) => {
        if (response.ok) {
          const data = await response.json();

          return {
            ticker: stocks[index],
            image: data[0].image || stockLogoPlaceholder,
          };
        } else {
          console.error(
            `Error fetching logo for ${stocks[index]}: Status ${response.status}`
          );
          return { ticker: stocks[index], image: stockLogoPlaceholder };
        }
      })
    );

    return logos;
  } catch (error) {
    console.error("Error fetching stock logos:", error);
  } finally {
    loading(false);
  }
}

function checkSelectedPortfolio(stock, type) {
  const selectedStock = availableStocks.find(
    (el) => el.ticker === stock.ticker
  );
  for (const el of stocksListContainer.children) {
    if (el.lastElementChild.innerText === selectedStock.ticker) {
      el.classList.remove("selected");
    }
    if (el.lastElementChild.innerText === stock.ticker && type === "add") {
      el.classList.add("selected");
    }

    if (el.lastElementChild.innerText === stock.ticker && type === "remove") {
      el.classList.remove("selected");
    }
  }
}

async function selectStock(stock) {
  const ticker = stock.lastElementChild.innerText;
  const fetchedStock = await fetchStockDetails(ticker);
  const amount = await amountModal(fetchedStock);
  if (!selectedStocks.includes(ticker)) {
    portfolio.push({
      ...fetchedStock,
      logo: `${
        availableStocks.find((el) => el.ticker === fetchedStock.ticker).image
      }`,
      amount: amount,
    });
    selectedStocks.push(ticker);
    displayPortfolioValue(portfolio);
    renderPortfolioStocks(portfolio);
    localStorage.setItem("portfolio", JSON.stringify(portfolio));
  }
}

function renderPortfolioStocks(stocks) {
  container.innerHTML = "";
  stocks.forEach((stock) => {
    const stockElement = document.createElement("article");
    stockElement.className = "card-container";
    const card = document.createElement("div");
    card.className = "card";
    const cardFront = document.createElement("div");
    cardFront.className = "card-front";
    const imageContainer = document.createElement("div");
    imageContainer.className = "image-container";
    imageContainer.innerHTML = `<img src="${
      stock.logo || stockLogoPlaceholder
    }" alt='${stock.name} logo'>`;
    const detailsContainer = document.createElement("div");
    detailsContainer.innerHTML = `
   <h3>${stock.name}</h3>

   <h4>${stock.ticker}</h4>
   <h4>$${stock.price}</h4>
  `;
    const cardBack = document.createElement("div");
    cardBack.className = "card-back";
    cardBack.innerHTML = `
   <h2>${(((stock.price * stock.amount) / totalValue) * 100).toFixed(1)}%</h2>
   <p>of total portfolio value</p>
  `;
    const closeBtn = document.createElement("span");
    closeBtn.className = "close-btn";
    closeBtn.innerText = "close";
    cardFront.append(closeBtn, imageContainer, detailsContainer);
    card.append(cardFront, cardBack);
    stockElement.append(card);
    container.appendChild(stockElement);
    closeBtn.addEventListener("click", () => {
      portfolio = portfolio.filter((el) => el.ticker !== stock.ticker);
      localStorage.setItem("portfolio", JSON.stringify(portfolio));
      renderPortfolioStocks(portfolio);
      displayPortfolioValue(portfolio);
      checkSelectedPortfolio(stock, "remove");
    });
    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
    });
    checkSelectedPortfolio(stock, "add");
  });
}

async function renderAvailableStocks(stocks) {
  stocks.forEach((stock) => {
    const stockDiv = document.createElement("div");
    stockDiv.className = "available-stock";
    stockDiv.innerHTML = `
   <div class='available-stock-logo-container image-container'>
    <img src='${stock.image}' alt='${stock.ticker} logo'>
   </div>
   <p>${stock.ticker}</p>
  `;
    stocksListContainer.append(stockDiv);

    stockDiv.addEventListener("click", () => {
      if (!selectedStocks.includes(stock.ticker)) {
        selectStock(stockDiv);
      } else {
        selectedStocks.splice(selectedStocks.indexOf(stock.ticker), 1);
        checkSelectedPortfolio(stock, "remove");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  portfolio = [];
  availableStocks = await fetchStockLogos();
  renderAvailableStocks(availableStocks);
  displayPortfolioValue(portfolio);
  renderPortfolioStocks(portfolio);
});
