import { bookTemplate } from "./templates.js";

document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll("main section");
  const footerLinks = document.querySelectorAll("footer ul li");

  footerLinks.forEach((link, index) => {
    link.addEventListener("click", function () {
      sections.forEach((section) => (section.style.display = "none"));
      sections[index].style.display = "flex";

      if (index == 1) {
        document.getElementById("search-box").focus();
      }
    });
  });

  sections[0].style.display = "flex";

  let icon = document.querySelector("svg");
  icon.addEventListener("click", () => {
    document.querySelector(".search-bar").classList.toggle("active");
    if (document.querySelector(".search-bar").classList.contains("active")) {
      document.querySelector("input").focus();
    }
  });
});

async function loadBooks() {
  let req = await fetch("./data/books.json");
  let res = await req.json();
  let bookContainer = document.querySelector(".books");
  bookContainer.innerHTML = "";
  res.forEach((book) => {
    bookContainer.innerHTML += bookTemplate(book);
  });
}
loadBooks();

// Fetch books data from JSON
async function fetchBooks() {
  try {
    const req = await fetch("./data/books.json");
    const books = await req.json();

    // Search functionality
    document.getElementById("search-box").addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      const results = books.filter(
        (book) =>
          book.BookName.toLowerCase().includes(query) ||
          book.AuthorName.toLowerCase().includes(query)
      );

      displayResults(results);
    });

    // Display all books initially
    displayResults(books);
    document.querySelector(".search-results").innerHTML = "";
  } catch (error) {
    console.error("Failed to fetch books:", error);
    document.querySelector(".search-results").innerHTML =
      "<li>Error loading books data.</li>";
  }
}

// Display search results dynamically
function displayResults(results) {
  const resultContainer = document.querySelector(".search-results");
  resultContainer.innerHTML = results.length
    ? results.map((book) => bookTemplate(book)).join("")
    : "<li>No books found</li>";
}

// Call the fetch function when the page loads
fetchBooks();


async function loadBorrowedBooks() {
  let req = await fetch("./data/books.json");
  let res = await req.json();
  let bookContainer = document.querySelector(".borrowed-books");
  bookContainer.innerHTML = "";
  res.forEach((book) => {
    bookContainer.innerHTML += bookTemplate(book);
  });
}
loadBorrowedBooks();