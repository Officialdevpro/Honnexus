import { loadBooks, loadUser } from "./script.js";

export function bookTemplate(book) {
  // Calculate how many full and empty stars are needed
  const fullStars = book.stats.avgRating;
  const halfStar = book.stats.avgRatings % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  // Generate star icons based on rating
  const starsHTML =
    '<img src="icons/filledStar.svg" alt="" class="star-icon"/>'.repeat(
      fullStars
    ) +
    (halfStar
      ? '<img src="icons/star-half.svg" alt="" class="star-icon"/>'
      : "") +
    '<img src="icons/star.svg" alt="" class="star-icon"/>'.repeat(emptyStars);

  return `<li class="book-card" data-bookId=${book._id}>
                  <div class="left-portion">
                    <img src="${book.icon}" alt="Book cover" />
                  </div>
                  <div class="right-portion">
                    <p>${book.bookName}</p>
                    <div class="author-details">
                      <small>Edition - ${book.edition}</small>
                      <small>Author : ${book.author}</small>
                    </div>
                    <div class="">
                      <p>Available Books : <b>${book.stock}</b></p>
                    </div>
                    <div class="ratings">
                      <div class="stars">
                        ${starsHTML}
                        <p style="color: darkolivegreen;">(${book.stats.nRating})</p>
                      </div>
                    </div>
                  </div>
                </li>`;
}
export function borrowedBooksTemplate(borrowedBooks) {
  let container = document.getElementById("borrow");
  container.innerHTML = "";

  borrowedBooks.forEach((book, index) => {
    const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

    container.innerHTML += ` 
      <li class="book-card column">
        <div class="star-container">
          <div class="container__items">
            <input type="radio" name="stars-${index}" id="st5-${index}" />
            <label for="st5-${index}">
              <div class="star-stroke">
                <div class="star-fill"></div>
              </div>
            </label>
            <input type="radio" name="stars-${index}" id="st4-${index}" />
            <label for="st4-${index}">
              <div class="star-stroke">
                <div class="star-fill"></div>
              </div>
            </label>
            <input type="radio" name="stars-${index}" id="st3-${index}" />
            <label for="st3-${index}">
              <div class="star-stroke">
                <div class="star-fill"></div>
              </div>
            </label>
            <input type="radio" name="stars-${index}" id="st2-${index}" />
            <label for="st2-${index}">
              <div class="star-stroke">
                <div class="star-fill"></div>
              </div>
            </label>
            <input type="radio" name="stars-${index}" id="st1-${index}" />
            <label for="st1-${index}">
              <div class="star-stroke">
                <div class="star-fill"></div>
              </div>
            </label>
          </div>
        </div>
        <div class="left-portion">
          <b class="label" style="background-color: ${randomColor}; color: white; padding: 5px 10px; border-radius: 5px;">
            ${book.createdAt}
          </b>
          <img src="${book.icon}" alt="Book cover" />
        </div>
        <div class="right-portion">
          <p>${book.bookName}</p>
        </div>
      </li>`;
  });

  // Add event listeners after DOM update
  const bookCards = container.querySelectorAll(".book-card");
  bookCards.forEach((bookCard, index) => {
    const starContainer = bookCard.querySelector(".star-container");
    const starInputs = bookCard.querySelectorAll('input[type="radio"]');

    // Toggle star container on book click
    bookCard.addEventListener("click", (e) => {
      // Don't toggle if clicking on the star rating itself
      if (!e.target.closest(".container__items")) {
        starContainer.classList.toggle("active");
      }
    });

    // Close star container after rating selection
    starInputs.forEach((input) => {
      input.addEventListener("change", () => {
        setTimeout(() => {
          starContainer.classList.remove("active");
        }, 3000); // Close after 2 seconds
        const rating = input.id.split("-")[0].replace("st", "");

        updateRating(borrowedBooks[index]._id, rating); // Call your update function here
        // Add your fetch/POST logic here
      });
    });

    // Prevent star clicks from bubbling to book card
    bookCard.querySelectorAll(".container__items *").forEach((element) => {
      element.addEventListener("click", (e) => e.stopPropagation());
    });
  });
}

function makeBookCard(books) {
  let dataum = "";

  books.forEach((book) => {
    const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    dataum += `   
    <li class="book-card column">
                    <div class="left-portion">
                      <b
                        class="label"
                        style="
                          background-color: ${randomColor};
                          color: white;
                          padding: 5px 10px;
                          border-radius: 5px;
                        "
                      >
                        ${book.createdAt}
                      </b>
                      <img
                        src="${book.icon}"
                        alt="Book cover"
                      />
                    </div>
                    <div class="right-portion">
                      <p>${book.bookName}</p>
                    </div>
                    <button class="clean return-book" data-bookId="${book._id}" data-bookName="${book.bookName}">Return</button>
                  </li>`;
  });

  // Update the dialog content in HTML

  return dataum;
}

export function profileTemplate(books, user) {
  let borrowed = 0;

  let returned = 0;
  let template = `
<div class="profile-top-portion">
               
                <div class="profile-details">
                  <h2>${user.username}</h2>
                  <small>${user.studentId}</small>
                </div>
              </div>
              
              <h3>Borrowed Books</h3>
              <div class="borrowed-book-details">
                
                ${makeBookCard(books)}
               
              </div>`;

  document.querySelector(".scanned-result").innerHTML = template;
  document.querySelectorAll(".return-book").forEach((button) => {
    button.addEventListener("click", (e) => {
      const bookId = e.target.dataset.bookid;

      returnBook(bookId, e.target);
    });
  });
}
async function returnBook(bookId, btn) {
  try {
    const response = await fetch(
      "https://honnexus.onrender.com/api/v1/borrow/return",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Something went wrong while returning the book"
      );
    }
    btn.parentElement.remove();
    loadBooks();
    loadUser(); // Reload the user data to reflect the changes
    // Remove the book card from the UI

    // You can update the UI or show a success message here
  } catch (error) {
    console.error("Error returning book:", error.message);
    // Show error message to the user if needed
  }
}

async function updateRating(bookId, rating) {
  try {
    const response = await fetch(
      `https://honnexus.onrender.com/api/v1/reviews/${bookId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong!");
    }

    // You can also update your UI here based on `data`
  } catch (error) {
    console.error("Error updating rating:", error.message);
  }
}
