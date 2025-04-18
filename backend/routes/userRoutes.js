const express = require("express");

const {
  getall,
  getUser,
  deleteUser,
  updateMe,
  deleteMe,
  userCount,
  resetApp,
  updateSemester,
  getStudent,
} = require("../controllers/userController");

const {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getAccountsAndCategories,
  homeUpdate,
} = require("../controllers/categoryController");

const {
  createTransaction,
  getAllTransactions,
  updateTransaction,
  deleteTransaction,
  records,
  getAccountsBalance,
  getHeaderInfo,
} = require("../controllers/transactionController");
const {
  product,
  signup,
  getCurrentUser,
  logIn,
  logOut,
} = require("../controllers/authController");
const {
  getAllAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  cumulativeSummary,
  updateBalance,
} = require("../controllers/accountController");
const {
  getBudgets,
  setBudget,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const emailLimiter = rateLimit({
  max: 10,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      status: "fail",
      message: options.message,
    });
  },
});

//MIDDLEWARE
router
  .route("/accounts")
  .get(product, getAllAccounts)
  .post(product, createAccount); //Here id is user id
router
  .route("/accounts/:id")
  .patch(product, updateAccount)
  .delete(product, deleteAccount); //Here id is account id
router.route("/accounts/balance/:id").patch(product, updateBalance); //Here id is account id
router.route("/accounts/balance/").get(product, getAccountsBalance); //Here id is account id

// router.param("id", checkId);
router.post("/signup", signup);
router.post("/login", logIn);
router.get("/users", getall);
router.get("/me",product, getCurrentUser);
router.patch("/update-semester",product, updateSemester);
router.get("/logout", logOut);
router.get("/count", userCount);
router.get("/resetApp", product, resetApp);
router.get("/transactions/summary", product, cumulativeSummary);

//FORGOT PASSWORD
router.patch("/updateMe", product, updateMe);
router.delete("/deleteMe", product, deleteMe);

router.route("/:studentId").get( getStudent);

//CATEGORY ROUTES
router
  .route("/categories")
  .get(product, getAllCategories)
  .post(product, createCategory);
router
  .route("/categories/:id")
  .patch(product, updateCategory)
  .delete(product, deleteCategory);

//BUDGET ROUTES
router.route("/budgets").get(product, getBudgets).post(product, setBudget);
router
  .route("/budgets/:id")
  .patch(product, updateBudget)
  .delete(product, deleteBudget);

//TRANSACTIONS ROUTES
router
  .route("/transactions")
  .get(product, getAllTransactions)
  .post(product, createTransaction);
router
  .route("/transactions/:id")
  .patch(product, updateTransaction)
  .delete(product, deleteTransaction);
router.route("/headerInfo").get(product, getHeaderInfo);
// EXCEL ROUTE
router.route("/report").get(product, records);

router.get("/data", product, getAccountsAndCategories);
router.patch("/budgets/some/:id", homeUpdate);
module.exports = router;
