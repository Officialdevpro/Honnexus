import { bookTemplate, borrowedBooksTemplate } from "./templates.js";
document.querySelector(".student-data").classList.add("active");
document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll("main section");
  const footerLinks = document.querySelectorAll("footer ul li");

  footerLinks.forEach((link, index) => {
    link.addEventListener("click", function () {
      if (index == 2) {
        sections.forEach((section) => (section.style.display = "none"));
        sections[index].style.display = "flex";
        return;
      }
      sections.forEach((section) => (section.style.display = "none"));
      sections[index].style.display = "flex";
      const nav = document.querySelector("nav");

      if (index != 2) {
        nav.classList.remove("open");
      }

      if (index == 1) {
        document.getElementById("search-box").focus();
      }
      if (index == 0) {
        document.querySelector(".books-container").style.display = "flex";
        if (document.querySelector(".book-details").style.display == "flex") {
          document.querySelector(".book-details").style.display = "none";
          document.querySelector(".books-container").style.display = "flex";
        }
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

export async function loadBooks() {
  let req = await fetch("https://honnexus.onrender.com/api/v1/books");
  let { data } = await req.json();

  let bookContainer = document.querySelector(".books");
  bookContainer.innerHTML = "";
  data.forEach((book) => {
    bookContainer.innerHTML += bookTemplate(book);
  });

  let booksCard = document.querySelectorAll("li.book-card");

  booksCard.forEach((book) => {
    book.addEventListener("click", () => {
      let det = document.querySelector(".book-details");
      if (det.style.display == "flex") {
        document.querySelector(".books-container").style.display = "flex";
      } else {
        document.querySelector(".books-container").style.display = "none";
      }
      document.querySelector(".book-description h2").innerHTML =
        book.lastElementChild.firstElementChild.textContent;
      document
        .querySelector(".book-cover img")
        .setAttribute(
          "src",
          book.firstElementChild.firstElementChild.getAttribute("src")
        );
      document.querySelector(".book-description .edition_des").innerHTML =
        book.lastElementChild.children[1].firstElementChild.textContent
          .split(" ")
          .at(-1);
      document.querySelector(".book-description .author_des").innerHTML =
        book.lastElementChild.children[1].lastElementChild.textContent.replace(
          "Author : ",
          ""
        );

      document.querySelector(".book-description .stock_des").innerHTML =
        book.lastElementChild.children[2].firstElementChild.lastChild.textContent;

      document.querySelector(".book-details").style.display = "flex";
      fetchBookDetails(book.dataset.bookid);
    });
  });
}

async function fetchBookDetails(id) {
  document.querySelector(".book-details").style.display = "flex";
  try {
    const response = await fetch(
      `https://honnexus.onrender.com/api/v1/books/info/${id}`
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const { data, borrowers } = await response.json();
    loadReviews(data.stats, data.stats.percentages, borrowers);

    const book = data;

    document.querySelector(".book-description .semester_des").innerHTML =
      book.semester;
  } catch (error) {
    console.error("Error fetching book data:", error);
    // You can also show a user-friendly error message here
  }
}

loadBooks();
export async function loadUser() {
  let req = await fetch("https://honnexus.onrender.com/api/v1/users/me");
  let { user } = await req.json();

  updateIDCard(
    user.username,
    user.studentId,
    "BE - Electronics & Communication Engg.",
    user.returnCount
  );
  setSemesterFromData(user.semester);
}

function updateIDCard(name, admNo, department, returnCount) {
  document.getElementById("student-name").innerText = name;
  document.getElementById("admission-no").innerText = admNo;
  document.getElementById("department").innerText = department;
  document.getElementById("barcode-text").innerText = admNo;
  document.querySelector(
    ".profile-status"
  ).lastElementChild.lastElementChild.innerText = returnCount;
}

// Example update (you can customize here)

loadUser();

// Fetch books data from JSON
async function fetchBooks() {
  try {
    const req = await fetch(
      "https://honnexus.onrender.com/api/v1/books/get-all"
    );
    const { books } = await req.json();

    document.getElementById("search-box").addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      const results = books.filter(
        (book) =>
          book.bookName.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
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
fetchBooks();
// Display search results dynamically
function displayResults(results) {
  const resultContainer = document.querySelector(".search-results");
  resultContainer.innerHTML = results.length
    ? results.map((book) => bookTemplate(book)).join("")
    : "<li>No books found</li>";
}

// Call the fetch function when the page loads
// fetchBooks();

export default async function loadBorrowedBooks() {
  let req = await fetch("https://honnexus.onrender.com/api/v1/borrow");

  if (req.status == 200) {
    const { books, results } = await req.json();

    document.querySelector(".left-box h1").innerHTML = results;

    borrowedBooksTemplate(books);
  }

  // bookContainer.innerHTML = "poda poda punnaku podatha thappu kanul"
}
loadBorrowedBooks();

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

let wordCount = document.querySelector(".word-count");
let reviewInput = document.getElementById("calculate-word-len");
let reviewId;
let date;
let clickedReview;

reviewInput.addEventListener("input", () => {
  wordCount.innerHTML = `${reviewInput.value.length}/500`;
});

let userFeedBack = document.querySelector(".user-feedback");
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function handleReviewStar(num) {
  let star = ``;
  for (let i = 0; i < 5; i++) {
    if (i < num) {
      star += '<img src="icons/filledstar.svg" alt="" />';
    } else {
      star += '<img class="star-shadow" src="icons/star.svg" alt="" />';
    }
  }
  return star;
}
setTimeout(() => {
  loadReviews();
}, 100);

function isAuthor(review_userId, userId, reviewId) {
  if (review_userId !== userId) {
    return "";
  } else {
    document.querySelector(".write-pen").classList.add("hide");
    return `<div class="review-operations">
           
                    <img class="dot svg rr-dots" src="icons/dot.svg" alt="" />
                    <div class="options rr-options" data-review-id=${reviewId}>
                      <p class="edit-btn-rr">Edit</p>
                      <p class="delete-review">Delete</p>
                    </div>
                </div>  `;
  }
}
let userReview = "";
async function loadReviews(stats, percentages, reviews) {
  document.querySelector(".user-feedback").innerHTML = "";
  document.querySelector(".rating-num-left h1").innerHTML = stats.avgRating;
  document.querySelector(".nRating").innerHTML = `(${stats.nRating})`;

  let barData = percentages;
  loadBars(barData);
  reviews.forEach((data) => {
    let template = ` <li class="review-card">
        <div class="review-card-head">
          <div class="review-left-part">
            <div style="background-color:${getRandomColor()}" class="img review-profile">${data.student.username
      .charAt(0)
      .toLocaleUpperCase()}</div>
            <p>${data.student.username}</p>
          </div>
          
        </div>
        
      </li>`;
    if (false) {
      userReview = template;
      // Prepend the review by adding it to the start of the container
      userFeedBack.innerHTML = template + userFeedBack.innerHTML;
    } else {
      // Append the review by adding it to the end of the container
      userFeedBack.innerHTML += template;
    }

    let deleteButtons = document.querySelectorAll(".delete-review");

    deleteButtons.forEach((btn, index) => {
      btn.addEventListener("click", (event) => {
        document.querySelector(".write-pen").classList.remove("hide");
        deleteReviewFromServer(event.target.parentElement.dataset.reviewId);
        let reviewCard = event.target.closest(".review-card");

        reviewCard.remove(); // Remove the review from DOM
      });
    });
  });
}

attachEditListeners();
document.querySelectorAll(".rr-dots").forEach((dot, index) => {
  dot.addEventListener("click", () => {
    document.querySelectorAll(".rr-options")[index].classList.toggle("active");
  });
});

function attachEditListeners() {
  // Select all edit buttons
  let editBtns = document.querySelectorAll(".edit-btn-rr");

  editBtns.forEach((editBtn) => {
    editBtn.addEventListener("click", () => {
      reviewId = editBtn.parentElement.dataset.reviewId;
      clickedReview = editBtn.closest("li");

      // Find the review text
      let reviewTextElement = editBtn
        .closest(".review-card")
        .querySelector(".review-text");
      let reviewText = reviewTextElement.textContent.trim();

      document.getElementById("calculate-word-len").value = reviewText;

      // Find the star rating
      let filledStarsContainer = editBtn
        .closest(".review-card")
        .querySelector(".reviewed-star");
      let filledStarCount = (
        filledStarsContainer.innerHTML.match(/icons\/filledstar\.svg/g) || []
      ).length;

      // Populate edit modal or input fields
      document.getElementById("rateValue").value = filledStarCount;
      document.getElementById("calculate-word-len").textContent = reviewText;

      // Update stars in the modal
      let stars = document.querySelectorAll(".rating-star-container div.star");
      stars.forEach((star, index) => {
        star.classList.toggle("active", index < filledStarCount);
      });

      // Enable update button and change its text
      let updateBtn = document.querySelector(".review-post-btn");
      updateBtn.disabled = false;
      updateBtn.textContent = "UPDATE";

      // Show the review input container for editing
      document.querySelector(".review-input-container").classList.add("active");

      // Handle update on button click
      updateBtn.addEventListener("click", () => {
        // Get the updated stars and review text
        let updatedStarCount = document.querySelectorAll(
          ".rating-star-container .star.active"
        ).length;
        let updatedReviewText = document
          .getElementById("calculate-word-len")
          .textContent.trim();

        // Update the DOM
        filledStarsContainer.innerHTML = generateStarHTML(updatedStarCount);
        reviewTextElement.textContent = updatedReviewText;

        // Close the modal or editing section
        document
          .querySelector(".review-input-container")
          .classList.remove("active");
        updateBtn.textContent = "POST";
        updateBtn.disabled = true;
      });
    });
  });
}
// Helper function to generate star HTML
function generateStarHTML(count) {
  let starHTML = "";
  for (let i = 0; i < count; i++) {
    starHTML += `<img src="icons/filledstar.svg" alt="star" />`;
  }
  for (let i = count; i < 5; i++) {
    starHTML += `<img src="icons/star.svg" alt="star" />`;
  }
  return starHTML;
}

//Star animation
let stars = document.querySelectorAll(".rating-star-container .star");
let postBtn = document.querySelector(".review-post-btn");
let feedBack = document.getElementById("calculate-word-len");
let reviewBox = document.querySelector(".review-input-container");
let reviewWritePen = document.querySelector(".write-pen");

reviewWritePen.addEventListener("click", () => {
  reviewBox.classList.toggle("active");
});
stars.forEach((star, index) => {
  star.addEventListener("click", () => {
    stars.forEach((s) => s.classList.remove("active"));
    document.getElementById("rateValue").value = index + 1;
    isValidReview();
    for (let i = 0; i <= index; i++) {
      stars[i].classList.add("active");
    }
  });
});

feedBack.addEventListener("input", isValidReview);

function isValidReview() {
  let feedBack = document.getElementById("calculate-word-len");
  let rateValue = document.getElementById("rateValue").value;
  if (feedBack.value.trim().length > 3 && rateValue != 0) {
    postBtn.disabled = false;
  } else {
    postBtn.disabled = true;
  }
}
postBtn.addEventListener("click", async () => {
  const today = new Date();
  document.querySelector(".write-pen").classList.add("hide");

  // Get the day, month, and year
  let day = today.getDate();
  let month = today.getMonth() + 1; // Months are zero-based, so add 1
  const year = today.getFullYear();

  // Add leading zeros if day or month is less than 10
  if (day < 10) {
    day = "0" + day;
  }

  if (month < 10) {
    month = "0" + month;
  }

  let feedBack = document.getElementById("calculate-word-len");

  let rateValue = document.getElementById("rateValue");
  date = `${year}-${month}-${day}`;

  let reviewObj = {
    rating: rateValue.value,
    review: feedBack.value.trim(),
  };

  dynamictemplate(reviewObj);
  if (postBtn.textContent.trim() == "UPDATE") {
    clickedReview.remove();
    updateReviewFromServer(reviewId, reviewObj);
    return;
  }
  let req = await fetch(" https://penny-partner.onrender.com/api/v1/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reviewObj),
  });
  let res = await req.json();
  feedBack.value = "";
  rateValue.vlaue = 0;
  stars.forEach((s) => s.classList.remove("active"));
  reviewBox.classList.remove("active");
  postBtn.disabled = true;
  loadReviews();
});

function loadBars(data) {
  document.querySelector(".bar-rating-5 .child-bar-line").style.width =
    `${data["5"]}` + "%";
  document.querySelector(".bar-rating-4 .child-bar-line").style.width =
    `${data["4"]}` + "%";
  document.querySelector(".bar-rating-3 .child-bar-line").style.width =
    `${data["3"]}` + "%";
  document.querySelector(".bar-rating-2 .child-bar-line").style.width =
    `${data["2"]}` + "%";
  document.querySelector(".bar-rating-1 .child-bar-line").style.width =
    `${data["1"]}` + "%";
}

function dynamictemplate(reviewObj) {
  let userName = document.querySelector(".home-display-username").textContent;
  let template = ` <li class="review-card">
      <div class="review-card-head">
        <div class="review-left-part">
          <div style="background-color:${getRandomColor()}" class="img review-profile">${userName
    .charAt(0)
    .toLocaleUpperCase()}</div>
          <p>${userName}</p>
        </div>
      </div>
      
    </li>`;
  // userFeedBack.innerHTML = template + userFeedBack.innerHTML;
}
async function deleteReviewFromServer(reviewId) {
  try {
    let response = await fetch(
      ` https://penny-partner.onrender.com/api/v1/reviews/${reviewId}`,
      {
        method: "DELETE",
      }
    );
  } catch (error) {
    console.error("Error deleting review:", error);
  }
}

async function updateReviewFromServer(reviewId, data) {
  try {
    let response = await fetch(
      ` https://penny-partner.onrender.com/api/v1/reviews/${reviewId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json", // Fixed syntax
        },
        body: JSON.stringify(data),
      }
    );
    if (response.status === 200) {
      loadReviews();
      let re = await response.json();
    }
  } catch (error) {
    console.error("Error deleting review:", error);
  }
}

setTimeout(() => {}, 1000);

let navBtn = document.querySelectorAll(".nav-content span");
let adminPages = document.querySelectorAll("section.admin > div");

navBtn.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    document.querySelector(".admin").style.display = "flex !important";
    // Hide all pages
    adminPages.forEach((page) => page.classList.add("hidden"));

    // Show the selected one
    if (adminPages[index]) {
      adminPages[index].classList.remove("hidden");
    }
  });
});

const logoutBtn = document.getElementById("logout");
logoutBtn.addEventListener("dblclick", async () => {
  let req = await fetch("https://honnexus.onrender.com/api/v1/users/logout");
  let res = await req.json();
  if (res.status == "success") {
    window.location.reload();
  }
});

const modal = document.getElementById("bookFormModal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");

openBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Form Handling
document
  .getElementById("bookForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      icon: this.icon.value,
      bookName: this.bookName.value,
      author: this.author.value,
      subject: this.subject.value,
      stock: this.stock.value,
      semester: this.semester.value,
      edition: this.edition.value,
      available: this.available.checked,
    };

    try {
      const response = await fetch(
        "https://honnexus.onrender.com/api/v1/books",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add book");
      }

      const result = await response.json();
      console.log("Book added:", result);

      alert("✅ Book added successfully!");
      this.reset();
      modal.style.display = "none";
      document.body.classList.remove("modal-open");
    } catch (error) {
      console.error("Error:", error);
      alert(`❌ Error: ${error.message}`);
    }
  });
