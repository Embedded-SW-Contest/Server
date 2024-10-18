
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;
const data = fs.readFileSync('./database.json');
const conf = JSON.parse(data);
const mysql = require('mysql');
const res = require('express/lib/response');

// const cors = require('cors');
// app.use(cors());

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
    res.setHeader('Content-Type', 'text/event-stream');  // SSE 형식 설정
    res.setHeader('Cache-Control', 'no-cache');          // 캐시 방지
    res.setHeader('Connection', 'keep-alive');           // 연결 유지
    const intervalId = setInterval(() => {
        connection.query("SELECT * FROM Car", (err, rows) => {
            if (err) {
                console.error('Error fetching data:', err);
                res.write(`event: error\ndata: ${JSON.stringify({ error: 'Database error' })}\n\n`);
                clearInterval(intervalId); // 오류 발생 시 주기적인 쿼리 중단
                res.end();
                return;
            }

            // SSE 형식에 맞게 데이터 전송
            res.write(`data: ${JSON.stringify(rows)}\n\n`);
        });
    }, 500); // 5초마다 데이터 전송

    // 클라이언트가 연결을 끊으면 주기적인 쿼리 중단
    req.on('close', () => {
        console.log('Client disconnected');
        clearInterval(intervalId);
    });
});
//     connection.query(
//         "SELECT * FROM Car",
//         (err,rows,fileds) => {
//             res.send(rows);
//         }
//     );
// });


app.get('/users/:uninum',(req,res) => {
    const uni_num = req.params.uninum;
    const sql = "SELECT * FROM User WHERE User.uni_num = ?"
    connection.query(sql,[uni_num],(error,results,fields)=>{
        if(error){
            return res.status(500).send('Database error');
        }
        else{
            res.json(results);
        }
    })
})

app.get('/users',(req,res) => {
    res.setHeader('Content-Type', 'text/event-stream');  // SSE 형식 설정
    res.setHeader('Cache-Control', 'no-cache');          // 캐시 방지
    res.setHeader('Connection', 'keep-alive');           // 연결 유지
    const intervalId = setInterval(() => {
        const sql = 'SELECT * FROM User';
        connection.query(sql, (error, results) => {
            if (error) {
                console.error('Database error:', error);
                res.write(`event: error\ndata: ${JSON.stringify({ error: 'Database error' })}\n\n`);
                clearInterval(intervalId); // 오류 발생 시 쿼리 중단
                res.end();
                return;
            }

            // SSE 형식으로 데이터를 클라이언트에 전송
            res.write(`data: ${JSON.stringify(results)}\n\n`);
        });
    }, 500); // 5초마다 데이터 전송
});





app.post('/users', (req, res) => {
    const { uni_num, user_x, user_y, user_dist, user_lat, user_lon, user_flag} = req.body;

    const sql = `
        INSERT INTO User (uni_num, user_x, user_y, user_dist, user_lat, user_lon,user_flag)
        VALUES (?, ?, ?, ?, ?, ?,?)
        ON DUPLICATE KEY UPDATE 
            user_x = VALUES(user_x),
            user_y = VALUES(user_y),
            user_dist = VALUES(user_dist),
            user_lat = VALUES(user_lat),
            user_lon = VALUES(user_lon),
            user_flag = VALUES(user_flag)
    `;

    connection.query(sql, [uni_num, user_x, user_y, user_dist, user_lat, user_lon,user_flag], (error, results) => {
        if (error) {
            res.status(500).send(error);
            return;
        }

        if (results.affectedRows === 1) {
            // 새 레코드가 삽입된 경우
            res.status(201).send(`User added with ID: ${uni_num}`);
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
    const { uni_num, car_lat, car_lon,braking_distance } = req.body;

    const sql = `
        INSERT INTO Car (uni_num, car_lat, car_lon,braking_distance)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            car_lat = VALUES(car_lat), 
            car_lon = VALUES(car_lon),
            braking_distance = VALUES(braking_distance)
    `;

    connection.query(sql, [uni_num, car_lat, car_lon,braking_distance], (error, results) => {
        if (error) {
            res.status(500).send(error);
            return;
        }
        if (results.affectedRows === 1) {
            res.status(201).send(`Car added with ID: ${uni_num}`);
        } else {
            res.status(200).send(`Car with uni_num: ${uni_num} updated`);
        }
    });
});


app.listen(port,()=> console.log(`Listening on port ${port}`));



const { WebSocketServer } = require('ws');  // WebSocket 모듈 추가
// WebSocket 서버를 위한 HTTP 서버 생성
const server = require('http').createServer(app);

// WebSocket 서버 생성 및 포트 설정
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected.');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const { uni_num, car_lat, car_lon, braking_distance, car_flag } = data;

            // 기본 INSERT 및 ON DUPLICATE KEY UPDATE 쿼리
            let sql = `
                INSERT INTO Car (uni_num, car_lat, car_lon, braking_distance
            `;

            // car_flag가 메시지에 포함되어 있으면 쿼리에 포함
            if (typeof car_flag !== 'undefined') {
                sql += `, car_flag`;
            }

            sql += `
                ) VALUES (?, ?, ?, ?
            `;

            // car_flag가 메시지에 포함되어 있으면 값도 추가
            let values = [uni_num, car_lat, car_lon, braking_distance];
            if (typeof car_flag !== 'undefined') {
                sql += `, ?`;
                values.push(car_flag);
            }

            sql += `
                ) ON DUPLICATE KEY UPDATE 
                    car_lat = VALUES(car_lat), 
                    car_lon = VALUES(car_lon),
                    braking_distance = VALUES(braking_distance)
            `;

            // car_flag가 메시지에 포함되어 있으면 UPDATE에도 포함
            if (typeof car_flag !== 'undefined') {
                sql += `, car_flag = VALUES(car_flag)`;
            }

            connection.query(sql, values, (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    ws.send(JSON.stringify({ status: 'error', message: 'Database error' }));
                    return;
                }

                if (results.affectedRows === 1) {
                    ws.send(JSON.stringify({ status: 'success', message: `Car added with ID: ${uni_num}` }));
                } else {
                    ws.send(JSON.stringify({ status: 'success', message: `Car with uni_num: ${uni_num} updated` }));
                }
            });
        } catch (error) {
            console.error('Invalid JSON:', error);
            ws.send(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
        }
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected.');
    });
});

// HTTP 및 WebSocket 서버 실행
server.listen(8081, () => {
    console.log(`HTTP and WebSocket server running on http://localhost:${port}`);
});