// app.js
const express = require('express')
const bodyParser = require('body-parser');
const fs = require('fs')
const ejs = require('ejs')
const session = require('express-session');
const bcrypt = require('bcrypt');
var mysql = require('mysql');

const saltRounds = 10;

// Create Express app
const app = express()

var dbCon = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "OnlineGame"
});

dbCon.connect(function (err) {
    if (err) {
        console.log(err);
    }

    else {
        console.log("Connected to the database!")
    }

})

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(session({ secret: 'ssshhhhh' })); // mandatory

app.get('/', (req, res) => {

    dbCon.query("SHOW TABLES", function (err, result, fields) {

        console.log(result)

        res.render('index.ejs', {
            tabele: result
        })


    })


})

app.get('/selectareTabel', (req, res) => {
    var tabela = req.query.tabela;

    var coloanaSortare = ""
    if (req.query.coloanaSortare) {

        coloanaSortare = " ORDER BY " + req.query.coloanaSortare;

    }

    var tipSortare = ""
    if (coloanaSortare != "") {
        if (req.query.tipSortare == "desc") {
            tipSortare = " desc"
        }
    }
    dbCon.query("SELECT * FROM " + tabela + coloanaSortare + tipSortare, function (err, result, fields) {

        res.render('afisareTabele.ejs', {
            tabela: tabela,
            continut: result,
            coloane: fields
        })

    })

})

app.listen(3000, () => console.log('Server running on port 3000!'))