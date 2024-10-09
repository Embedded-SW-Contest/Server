const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;
const data = fs.readFileSync('./database.json');
const conf = JSON.parse(data);
const mysql = require('mysql');

const connection = mysql.createConnection({
    host:conf.host,
    user: conf.user,
    password:conf.password,
    port:conf.port,
    database:conf.database

});
connection.connect();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get('/hello', (req,res) => {
    connection.query(
        "SELECT * FROM User",
        (err,rows,fileds) => {
            res.send(rows);
        }
    );
   // res.send({message : 'Hello Express!'});
});


app.get('/', (req,res) => {
    res.send({message : 'tung'});
});



app.listen(port,()=> console.log(`Listening on port ${port}`));