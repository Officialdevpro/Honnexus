import { borrowedBooksTemplate } from "./templates.js";

export async function getStudentById(studentId) {
    let req = await fetch("./data/students.json");
    let students = await req.json();
    
    let student = students.find(s => s.StudentId === studentId);
    
    if (student) {
        document.querySelector(".scanned-data").innerHTML = `<div class="profile-top-portion">
            <img src="./assets/profile.png" alt="" />
            <div class="profile-details">
              <h2>${student.StudentId}</h2>
              <small>${student.StudentName}</small>
            </div>
          </div>
          <div class="profile-status">
            <div class="left-box">
              <b>Borrowed</b>
              <h1>4</h1>
            </div>
            <div class="right-box">
              <b>Returned</b>
              <h1>1</h1>
            </div>
          </div>`
    
      borrowedBooksTemplate(student.BorrowedBooks)
      

       // Displays student details
      return student;
    } else {
      console.log("Student not found");
      return null;
    }
  }
  


  