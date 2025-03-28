export async function getStudentById(studentId) {
    let req = await fetch("./data/students.json");
    let students = await req.json();
    
    let student = students.find(s => s.StudentId === studentId);
    
    if (student) {
        document.querySelector(".scanned-data").innerHTML = `<div class="profile-top-portion">
            <img src="./assets/profile.png" alt="" />
            <div class="profile-details">
              <h2>22ECEBE175</h2>
              <small>Naveen V</small>
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
      console.log(student); // Displays student details
      return student;
    } else {
      console.log("Student not found");
      return null;
    }
  }
  
  // Example usage:

  