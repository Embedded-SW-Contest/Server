
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;
const data = fs.readFileSync('./database.json');
const conf = JSON.parse(data);
const mysql = require('mysql');
const res = require('express/lib/response');

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

app.get('/', (req,res) => {
    res.send({message : 'tung'});
});

app.get('/hello', (req,res) => {
    connection.query(
        "SELECT * FROM User",
        (err,rows,fileds) => {
            res.send(rows);
        }
    );
   // res.send({message : 'Hello Express!'});
});

app.get('/cars', (req,res) => {
    connection.query(
        "SELECT * FROM Car",
        (err,rows,fileds) => {
            res.send(rows);
        }
    );
});


app.get('/users/:useridx',(req,res) => {
    const userId = req.params.useridx;
    const sql = "SELECT * FROM User WHERE User.user_id = ?"
    connection.query(sql,[userId],(error,results,fields)=>{
        if(error){
            return res.status(500).send('Database error');
        }
        else{
            res.json(results[0]);
        }
    })
})

app.get('/users',(req,res) => {
    const userId = req.params.useridx;
    const sql = "SELECT * FROM User"
    connection.query(sql,(error,results,fields)=>{
        if(error){
            return res.status(500).send('Database error');
        }
        else{
            res.json(results);
        }
    })
})





app.post('/users', (req, res) => {
    const { uni_num, user_x, user_y, user_dist, user_lat, user_lon } = req.body;

    const sql = `
        INSERT INTO User (uni_num, user_x, user_y, user_dist, user_lat, user_lon)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            user_x = VALUES(user_x),
            user_y = VALUES(user_y),
            user_dist = VALUES(user_dist),
            user_lat = VALUES(user_lat),
            user_lon = VALUES(user_lon)
    `;

    connection.query(sql, [uni_num, user_x, user_y, user_dist, user_lat, user_lon], (error, results) => {
        if (error) {
            res.status(500).send(error);
            return;
        }

        if (results.affectedRows === 1) {
            // 새 레코드가 삽입된 경우
            res.status(201).send(`User added with ID: ${results.insertId}`);
        } else {
            // 기존 레코드가 업데이트된 경우
            res.status(200).send(`User with uni_num: ${uni_num} updated`);
        }
    });
});

// app.patch('/users', (req,res)=>{
//     const {uni_num, user_x, user_y, user_dist,user_lat,user_lon} = req.body;
//     let sql = "UPDATE User set ";
//     const parameters = [];

//     sql += 'user_x = ?, ';
//     parameters.push(user_x);
//     sql += 'user_y = ?, ';
//     parameters.push(user_y);
//     sql += 'user_dist = ?, ';
//     parameters.push(user_dist);
//     sql += 'user_lat = ?, ';
//     parameters.push(user_lat);
//     sql += 'user_lon = ?, ';
//     parameters.push(user_lon);

//     sql = sql.slice(0,-2) + ' WHERE uni_num = ?';
//     parameters.push(uni_num);

//     connection.query(sql, parameters, (error,results) => {
//         if(error){
//             res.status(500).send(error);
//             return;
//         }
//         res.status(201).send('User updated successfully : ${results.insertId}');
//     });
// });


app.post('/cars', (req, res) => { // 차량 GPS정보, 값이 없을땐 추가/이미 값이 있으면 업데이트
    const { uni_num, car_lat, car_lon } = req.body;

    const sql = `
        INSERT INTO Car (uni_num, car_lat, car_lon)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            car_lat = VALUES(car_lat), 
            car_lon = VALUES(car_lon)
    `;

    connection.query(sql, [uni_num, car_lat, car_lon], (error, results) => {
        if (error) {
            res.status(500).send(error);
            return;
        }
        if (results.affectedRows === 1) {
            res.status(201).send(`Car added with ID: ${results.insertId}`);
        } else {
            res.status(200).send(`Car with uni_num: ${uni_num} updated`);
        }
    });
});


app.listen(port,()=> console.log(`Listening on port ${port}`));