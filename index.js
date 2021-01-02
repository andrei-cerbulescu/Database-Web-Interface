const express = require('express')
const bodyParser = require('body-parser');
const fs = require('fs')
const ejs = require('ejs')
const session = require('express-session');
const bcrypt = require('bcrypt');
var mysql = require('mysql');
const { query } = require('express-validator');

const saltRounds = 10;

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({ secret: 'ssshhhhh' }));

app.get('/', (req, res) => {

  dbCon.query("SHOW TABLES", function (err, result, fields) {

    res.render('index.ejs', {
      tabele: result
    })


  })


})

app.get('/cautare', (req, res) => {

  stringQuery = "SELECT cont.idCont, cont.numeCont, SUM(personaj.bani) AS Total FROM cont, personaj WHERE cont.idCont = personaj.idCont GROUP BY cont.idCont HAVING total >="+req.query.value

  dbCon.query(stringQuery, function (err, result, fields) {

    res.render('cautare.ejs', {
      result: result,
      coloane: fields,
      value: req.query.value
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

app.post('/stergeColoanaInTabel', (req, res) => {

  dbCon.query("DELETE FROM " + req.body.tabela + " WHERE " + req.body.numeCheiePrimara + " = " + req.body.valoareCheiePrimara, function (err, result, fields) {

    res.redirect('/selectareTabel?tabela=' + req.body.tabela)

  })

})

app.post('/editeazaElementInTabel', (req, res) => {

  dbCon.query("SELECT * FROM " + req.body.tabela + " WHERE " + req.body.numeCheiePrimara + " = " + req.body.valoareCheiePrimara, function (err, result, fields) {

    res.render('editeazaDate.ejs', {
      tabela: req.body.tabela,
      numeCheiePrimara: req.body.numeCheiePrimara,
      valoareCheiePrimara: req.body.valoareCheiePrimara,
      result: result,
      coloane: fields
    })

  })

})

app.post('/adaugaElement', (req, res) => {

  dbCon.query("SELECT * FROM " + req.body.tabela + " WHERE " + req.body.numeCheiePrimara + " = -1", function (err, result, fields) {

    res.render('adaugaElement.ejs', {
      coloane: fields,
      tabela: req.body.tabela
    })

  })

})

app.post('/postAdaugaElement', (req, res) => {

  queryString = "INSERT INTO " + req.body._tabela + " VALUES ("

  isFirst = 1;

  for (const [key, value] of Object.entries(req.body)) {
    if (key.charAt(0) != "_") {


      if (isFirst == 0) {
        queryString += ","
      }

      queryString += "'" + value + "'"

      isFirst = 0
    }
  }

  queryString += ")"

  dbCon.query(queryString, (err, result, rows)=>{

    res.redirect("/selectareTabel?tabela="+req.body._tabela)

  })

})

app.post('/postActualizareDate', (req, res) => {

  stringQuery = "UPDATE " + req.body._tabela + " SET ";
  isFirst = 0
  Object.keys(req.body).forEach(cheie => {

    if (cheie.charAt(0) != "_") {

      if (req.body[cheie] != '') {

        if (isFirst == 0) {
          isFirst = 1;
        }

        else {

          stringQuery += ", "

        }

        stringQuery += cheie + "=" + "'" + req.body[cheie] + "'";

      }

    }

  });

  stringQuery += " WHERE " + req.body._numeCheiePrimara + " = " + req.body._valoareCheiePrimara
  dbCon.query(stringQuery, (err, result, fields) => {

    res.redirect('/selectareTabel?tabela=' + req.body._tabela)

  })

})

//Partea de utilizator a website-ului

app.get('/login', (req, res) => {
  res.render('login.ejs', {
  })

})

app.post('/creazaContPost', (req, res) => {

  res.redirect('/creazaCont')

})

app.get('/creazaCont', (req, res) => {
  res.render('register.ejs')
})

app.post('/loginRequest', (req, res) => {


  dbCon.query("SELECT * FROM cont WHERE adresaMail = '" + req.body.email + "'", function (err, result, fields) {
    if (err) throw err

    if (result.length > 0) {

      bcrypt.hash(req.body.password, result[0].saltParola, function (err, hash) {

        if (hash == result[0].hashParola) {

          var session = req.session;
          session.user = result[0];
          res.redirect('/post-login')

        }

        else {
          console.log('parola gresita')
        }

      })

    }

  })

})

app.post('/registerRequest', (req, res) => {


  bcrypt.genSalt(saltRounds, function (err, salt) {

    bcrypt.hash(req.body.password, salt, function (err, hash) {

      var datetime = new Date();
      anLunaZi = datetime.getUTCFullYear() + "-" + (datetime.getUTCMonth() + 1) + "-" + datetime.getUTCDate();

      try {
        dbCon.query("INSERT INTO Cont(numeCont, adresaMail, hashParola, saltParola, dataCreare)VALUES('" + req.body.numeCont + "', '" + req.body.email + "', '" + hash + "', '" + salt + "', '" + anLunaZi + "')")

        res.redirect('/login')

      }

      catch (err) {
        console.log(err)
      }

    })

  })

})

app.get('/post-login', (req, res) => {
  var session = req.session;
  if (typeof session.user == undefined) {
    return
  }

  dbCon.query("SELECT * FROM personaj WHERE idCont = " + session.user.idCont, function (err, result, fields) {

    if (err) {
      throw err
    }

    res.render('post-login.ejs',
      {
        pageTitle: "Alege un personaj",
        user: session.user,
        characters: result
      });

  })


})

app.post('/selectarePersonaj', (req, res) => {

  var session = req.session;
  if (typeof session.user == undefined) {
    return
  }

  if (req.body.idPersonaj == undefined) {
    return
  }

  dbCon.query("SELECT * FROM personaj WHERE personaj.idPersonaj = " + req.body.idPersonaj, function (err, datePersonaj, fields) {

    dbCon.query("SELECT * FROM slot JOIN obiect WHERE slot.idObiect = obiect.idObiect AND slot.idPersonaj = " + req.body.idPersonaj, function (err, resultPersonajSlot, fields) {

      if (err) {
        throw err
      }

      dbCon.query("SELECT * FROM clasa WHERE idClasa = " + datePersonaj[0].idClasa, function (err, resultClasa, fields) {

        if (err) {
          throw err
        }

        dbCon.query("SELECT * FROM personaj JOIN abilitati ON personaj.idClasa = abilitati.idClasa WHERE personaj.nivelPersonaj >= abilitati.nivelMinim AND personaj.idPersonaj = " + req.body.idPersonaj, function (err, resultAbilitati, fields) {

          if (err) {
            throw err
          }

          res.render('personaj.ejs',
            {
              user: session.user,
              resultPersonaj: datePersonaj,
              clasa: resultClasa,
              abilitati: resultAbilitati,
              obiecte: resultPersonajSlot
            });

        })
      })
    })
  })
})


app.listen(3000, () => console.log('Server running on port 3000!'))