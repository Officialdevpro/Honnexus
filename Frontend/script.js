import { bookTemplate } from "./templates.js";

document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll("main section");
  const footerLinks = document.querySelectorAll("footer ul li");

  footerLinks.forEach((link, index) => {
    link.addEventListener("click", function () {
      sections.forEach((section) => (section.style.display = "none"));
      sections[index].style.display = "flex";
      const nav = document.querySelector("nav");

      if (index != 2) {
        nav.classList.remove("open");
      }

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
  let req = await fetch("https://honnexus.onrender.com/api/v1/books");
  let { data } = await req.json();
  console.log(data);
  let bookContainer = document.querySelector(".books");
  bookContainer.innerHTML = "";
  data.forEach((book) => {
    bookContainer.innerHTML += bookTemplate(book);
  });
}
loadBooks();
async function loadUser() {
  let req = await fetch("https://honnexus.onrender.com/api/v1/users");
  let { data } = await req.json();
  console.log(data);
  let profile = document
    .querySelector(".profile-top-portion img")
    .setAttribute("src", "images/profiles/" + data.profile);
  let name = document.querySelector(".profile-details h2");
  let id = document.querySelector(".profile-details small");
  name.innerHTML = data.username;
  id.innerHTML = data.studentId;
  setSemesterFromData(data.semester);
}

loadUser();

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
// fetchBooks();

async function loadBorrowedBooks() {
  let req = await fetch("./data/books.json");
  let res = await req.json();
  let bookContainer = document.querySelector(".borrowed-books");
  bookContainer.innerHTML = "";
  res.forEach((book) => {
    bookContainer.innerHTML += bookTemplate(book);
  });
}
// loadBorrowedBooks();

const nav = document.querySelector("nav"),
  toggleBtn = nav.querySelector(".toggle-btn");
const navItems = nav.querySelectorAll("span");
// Create an input element dynamically
const loader = document.querySelector(".loader");
toggleBtn.addEventListener("click", () => {
  nav.classList.toggle("open");
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    nav.classList.remove("open");
  });
});

const range = document.getElementById("rangeInput");
const bubble = document.getElementById("bubble");

function updateSlider() {
  const val = Number(range.value);
  const min = Number(range.min);
  const max = Number(range.max);
  const percent = ((val - min) / (max - min)) * 100;

  // Update bubble position
  const rangeWidth = range.offsetWidth;
  const bubbleWidth = bubble.offsetWidth;
  const left = (percent / 100) * rangeWidth - bubbleWidth / 2;
  bubble.style.left = `${left}px`;
  bubble.textContent = val;
  console.log(val);
  updateSemester(val);

  // Update bar fill
  range.style.background = `linear-gradient(to right, #4caf50 0%, #4caf50 ${percent}%, #ccc ${percent}%, #ccc 100%)`;
}

// Update when user moves the slider manually
range.addEventListener("input", updateSlider);

// Initial update from user data (like from API)
function setSemesterFromData(sem) {
  range.value = sem;

  updateSlider(); // reuse the same function for consistency
}

async function updateSemester(semesterValue) {
  try {
    const response = await fetch(`/api/v1/users/update-semester`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ semester: semesterValue }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update semester");
    }

    console.log("Semester updated successfully:", data);
    loadBooks();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

fetchRandomBooks();
async function fetchRandomBooks() {
  try {
    const response = await fetch(
      "https://honnexus.onrender.com/api/v1/books/random"
    ); // adjust path if needed

    if (response.ok) {
      const { data } = await response.json();
      console.log(data);
      let parent = document.querySelector(".top-row");
      function getRandomColor() {
        const colors = [
          "#FF6B6B",
          "#6BCB77",
          "#4D96FF",
          "#FFC75F",
          "#C34A36",
          "#FF9671",
          "#B76EF1",
          "#00C9A7",
          "#FF6F91",
          "#845EC2",
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      data.forEach((book) => {
        const randomColor = getRandomColor();
        parent.innerHTML += `
          <li>
            <img
              src="${book.icon}"
              alt=""
              style="border: 2px solid ${randomColor};"
            />
            <small>${book.bookName.slice(0, 5)}..</small>
          </li>`;
      });

      throw new Error("Failed to fetch random books");
    }
  } catch (error) {
    console.error("Error fetching random books:", error.message);
    return [];
  }
}
