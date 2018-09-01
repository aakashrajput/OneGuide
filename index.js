var http = require ('https');
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const { cookieKey } = require("./config/keys");

const app = express();

const port = process.env.PORT || 5000;
// Cookie
app.use(
  cookieSession({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000,
    keys: [cookieKey]
  })
);
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Database Connection (Change accordingly)
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "oneguide"
});
// Connecting with database
connection.connect(err => {
  if (!err) {
    console.log("Database is connected");
  } else {
    console.log("Error in connecting with database");
  }
});
app.get('/',function(req,res){
  res.sendfile("client/index.html");
})
// Post route for registeration of new user
app.post("/user/register", (req, res) => {
  const newUser = req.body.user;
  console.log(user);

  // TABLE NAME IS user_reg (CHANGE THE NAME ACCORDINGLY)
  connection.query(
    "SELECT * FROM user_reg WHERE username=? OR email=?",
    [newUser.username, newUser.email],
    (err, results, fields) => {
      if (err) {
        throw err;
      }
      if (results.length > 0) {
        console.log("User already exists with same username or email");
        res.redirect("/user/new"); // redirect back to the registration form
      }

      // make sure the newUser's keys matches with table's field names OR change the query accordingly
      connection.query(
        "INSERT INTO user_reg SET ?",
        newUser,
        (err, results, fields) => {
          if (err) {
            throw err;
          } else {
            // session.token will help us to check if user is logged in.
            req.session.token = String(newUser.email);
            // user info available in req.session.user for future use.
            req.session.user = {
              name: newUser.name,
              email: newUser.email,
              username: newUser.username
            };
            // redierct back to dashboard after successful registration
            res.redirect("/dashboard");
          }
        }
      );
    }
  );
});

// Post route for login
app.post("/user/login", (req, res) => {
  const username = String(req.body.username);
  const password = String(req.body.password);
  connection.query(
    "SELECT * FROM user_reg WHERE username=?",
    [username],
    (err, results, fields) => {
      if (err) {
        throw err;
      }
      if (results.length === 0) {
        console.log("No User Found with given username");
        res.redirect("/user/login/form"); // redirect back to login form
      } else {
        if (results[0].password !== password) {
          console.log("Wrong password");
          res.redirect("/user/login/form"); // redierct back to login form
        } else {
          console.log("Username and password matches");
          req.session.token = results[0].email;
          req.session.user = {
            name: results[0].name,
            username: results[0].username,
            email: results[0].email
          };
          res.redirect("/dashboard"); // redirect back to dashboard on successful login
        }
      }
    }
  );
});

// Get route for checking if user is logged in
app.get("/get-user", (req, res) => {
  if (req.session.token) {
    res.json({
      status: 200,
      ...req.session.user
    });
  } else {
    console.log("User not signed in");
    res.json({
      status: 404
    });
  }
});

// Post route for logout
app.post("/logout", (req, res) => {
  req.session = null;
  console.log("Successfully logged out");
  res.redirect("/"); // redirect back to root route after log out
});

// Setting up server
app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
