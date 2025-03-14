export function bookTemplate(book) {
    // Calculate how many full and empty stars are needed
    const fullStars = Math.floor(book.Rating);
    const halfStar = book.Rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
    // Generate star icons based on rating
    const starsHTML =
      '<img src="icons/filledStar.svg" alt="" class="star-icon"/>'.repeat(fullStars) +
      (halfStar ? '<img src="icons/star-half.svg" alt="" class="star-icon"/>' : '') +
      '<img src="icons/star.svg" alt="" class="star-icon"/>'.repeat(emptyStars);
  
    return `<li class="book-card">
                  <div class="left-portion">
                    <img src="./assets/images/image.png" alt="Book cover" />
                  </div>
                  <div class="right-portion">
                    <p>${book.BookName}</p>
                    <div class="author-details">
                      <small>Edition - ${book.Edition}</small>
                      <small>Author : ${book.AuthorName}</small>
                    </div>
                    <div class="">
                      <p>Available Books : <b>${book.BookStock}</b></p>
                    </div>
                    <div class="ratings">
                      <div class="stars">
                        ${starsHTML}
                        <p style="color: darkolivegreen;">(${book.NumberOfRatings})</p>
                      </div>
                    </div>
                  </div>
                </li>`;
  }
  