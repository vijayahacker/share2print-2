const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require("path");
const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');
const qr = require('qrcode');
const { Socket } = require('dgram');
const socketIO = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const upload = multer({ dest: 'private/' });
const port = process.env.PORT || 3000;
const db = new sqlite3.Database('database.db');


app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/private', express.static(path.join(__dirname, 'private')));

// Initialize the database
db.run(`
    CREATE TABLE IF NOT EXISTS Customers (
        customer_id INTEGER PRIMARY KEY,
        name TEXT,
        unique_code TEXT
    );
`);
db.run(`
    CREATE TABLE IF NOT EXISTS ChoiceCenters (
        center_id INTEGER PRIMARY KEY,
        name TEXT,
        owner TEXT,
        address TEXT,
        password TEXT,
        unique_id TEXT
    );
`)
db.run(`
    CREATE TABLE IF NOT EXISTS Files (
        file_id INTEGER PRIMARY KEY,
        file_name TEXT,
        file_owner TEXT,
        sent_time INTEGER,
        choice_center_id TEXT,
        FOREIGN KEY (file_owner) REFERENCES Customers(unique_code),
        FOREIGN KEY (choice_center_id) REFERENCES ChoiceCenters(center_id)
    );
`)
// randome Alpha-code
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numbers = '0123456789';

function generateRandomString() {
    let randomString = '';
    let randomNumber = '';

    for (let i = 0; i < 4; i++) {
        const randomChar = characters[Math.floor(Math.random() * characters.length)];
        randomString += randomChar;
    }
    for (let i = 0; i < 2; i++) {
        const randomNum = Math.floor(Math.random() * numbers.length);
        randomNumber += randomNum;
    }
    const text = "CUS-" + randomString.slice(0, 2) + '-' + randomNumber + '-' + randomString.slice(2);
    db.get('SELECT * FROM Customers WHERE unique_code = ?', [text], (err, uniCode) => {
        if (err) {
            return res.status(500).send('Error searching');
        }
        if (uniCode) {
            return generateRandomString();
        }
    })
    return text;
}

function generateRandomStringshop() {
    let randomString = '';
    let randomNumber = '';
    for (let i = 0; i < 4; i++) {
        const randomChar = characters[Math.floor(Math.random() * characters.length)];
        randomString += randomChar;
    }
    for (let i = 0; i < 2; i++) {
        const randomNum = Math.floor(Math.random() * numbers.length);
        randomNumber += randomNum;
    }
    const text = 'CH-' + randomString.slice(0, 2) + '-' + randomNumber + '-' + randomString.slice(2);
    db.get('SELECT * FROM ChoiceCenters WHERE unique_id = ?', [text], (err, uniCode) => {
        if (err) {
            return res.status(500).send('Error searching');
        }
        if (uniCode) {
            return generateRandomStringshop();
        }
    })
    return text;
}

app.post("/cookieCustomer", (req, res) => {
    if (req.cookies.customer) {
        res.json({ message: "cookie was already set", status: 1, user: req.cookies.customer.username })
    } else {
        console.log("no cookeis")
        const randomString = generateRandomString();
        let username = "unknown";
        db.run('INSERT INTO Customers (name, unique_code) VALUES (?, ?)', [username, randomString], (err) => {
            if (err) {
                console.log(err);
            }
            console.log("user created");
        });
        const oneMonth = 30.44 * 24 * 60 * 60 * 1000; // 30.44 days in milliseconds
        res.cookie('customer', { username: randomString }, { maxAge: oneMonth });
        res.json({ message: "cookie is set now", status: 2, user: randomString })
    }
})
app.post('/upload', upload.array('file'), (req, res) => {
    console.log("user came")
    const choiceCenter = req.body.choiceCenter;
    const fileOwner = req.cookies.customer.username;
    const fileData = req.files;
    const time = new Date().getTime();
    fileData.map((file) => {
        let newFileName = file.originalname
        let li = file.originalname.lastIndexOf('.');
        if (li !== -1) {
            const fname = file.originalname.slice(0, li);
            const ex = file.originalname.slice(li + 1);
            newFileName = `${fname}-${fileOwner}.${ex}`
        }
        const filePath = `private/${newFileName}`;
        fs.rename(file.path, filePath, (err) => {
            if (err) {
                return res.json({ message: "rename err", status: 0, resData: err })
            }
            db.run('INSERT INTO Files (file_name, file_owner , sent_time, choice_center_id) VALUES (?,?,?, ?)', [newFileName, fileOwner, time, choiceCenter], function (err) {
                if (err) {
                    console.log(err.message);
                    return res.json({ message: "file not saved", status: 0, fileId: "err" })
                }

                const fileId = this.lastID;
                // socket.emit('upload', { dashboardId, documentData: '...' });
                return res.json({ message: "file saved", status: 1, fileId })
            });
        })
    })

})

app.post('/removeFile', (req, res) => {
    const fileId = req.body.fId; // Assuming you send the file_id to be removed
    console.log(fileId)
    db.get('SELECT file_name FROM Files WHERE file_id = ?', [fileId], (err, row) => {
        if (err) {
            return res.json({ message: "Error getting file name from database", status: 0, resData: "err" });
        }

        const fileName = row && row.file_name; // Check if row is defined before accessing file_name

        if (!fileName) {
            return res.json({ message: "File name not found", status: 0, resData: null });
        }

        db.run('DELETE FROM Files WHERE file_id = ?', [fileId], (err) => {
            if (err) {
                return res.json({ message: "Error deleting file record from database", status: 0, resData: err });
            }

            fs.unlink(`private/${fileName}`, (err) => {
                if (err) {
                    return res.json({ message: "Error removing file", status: 0, resData: err });
                }

                return res.json({ message: "File removed successfully", status: 1, resData: null });
            });
        });
    });
});

app.post('/singup', (req, res) => {
    const { shop, owner, address, password } = req.body;
    try {
        const shopUniCode = generateRandomStringshop();
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.run('INSERT INTO ChoiceCenters (name,owner,address,password, unique_id) VALUES (?,?,?,?,?)', [shop, owner, address, hashedPassword, shopUniCode,], (err) => {
            if (err) {
                console.log(err);
            }
            console.log("choice center created");
            const qrData = `${req.protocol}://${req.get('host')}/upload.html?shopID=${shopUniCode}`;
            const qrOption = {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000',
                    light: '#fff'
                }
            }
            qr.toDataURL(qrData, qrOption, (err, url) => {
                if (err) {
                    console.log(err);
                }
                const base64Data = url.replace(/^data:image\/png;base64,/, '');
                const filePath = `public/qr/${shopUniCode}.png`;
                fs.writeFile(filePath, base64Data, 'base64', (err) => {
                    if (err) throw err;
                    console.log("qr saved")
                })
            })
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="your-private-info.txt"')
            const singupInfo = `Please keep it safe. \n User Name: ${shopUniCode} \n password: ${password} \n shop name: ${shop} \n owner: ${owner} \n address: ${address}`
            res.json({ message: "successfully inserted", status: 1, shopUniCode, addOn: singupInfo })
        });
    } catch (error) {
        res.json({ message: "error", status: 0, error })
    }
})
app.post('/loginCheck', (req, res) => {
    if (req.cookies.shop) {
        console.log("loged in");
        res.json({ message: "aleady logged in", status: 0 })
    } else {
        console.log("not logged in")
        res.json({ message: "not logged in", status: 1 })
    }
})
app.post('/login', (req, res) => {
    const { shopUniCode, password } = req.body;
    console.log("login", shopUniCode, password)
    try {
        db.get('SELECT * FROM ChoiceCenters WHERE unique_id = ?', [shopUniCode], (err, user) => {
            if (err) {
                console.log("db user search error", err)
                return res.status(500).json({ message: "database error", status: 0 });
            }
            if (user && bcrypt.compareSync(password, user.password)) {
                // Set cookie upon successful login
                const oneMonth = 30.44 * 24 * 60 * 60 * 1000; // 30.44 days in milliseconds
                res.cookie('shop', { shopUniCode }, { maxAge: oneMonth });
                res.json({ message: "Login successfull", status: 1 })
            } else {
                res.status(401).json({ message: "error", status: 0 });
            }
        });
    } catch (error) {
        res.status(401).json({ message: "process error", status: 0, error });
    }
})
app.post('/logout', (req, res) => {
    res.clearCookie('shop');
    res.json({ msg: "Shop cookey cleared", status: 1 })
})
app.post('/dashboard', (req, res) => {
    if (req.cookies.shop) {
        console.log(req.cookies.shop.shopUniCode)
        db.get('SELECT * FROM ChoiceCenters WHERE unique_id = ?', [req.cookies.shop.shopUniCode], (err, user) => {
            if (err) {
                console.log("db user search error", err)
                return res.status(500).json({ message: "database error", status: 0 });
            }
            console.log(user)
            if (user) {
                const sql = 'SELECT DISTINCT c.unique_code, c.name as customer_name, f.sent_time FROM Files f INNER JOIN Customers c ON c.unique_code = f.file_owner WHERE f.choice_center_id=?';
                db.all(sql, [req.cookies.shop.shopUniCode], (err, fileOwners) => {
                    if (err) {
                        console.log(err)
                        return res.json({ message: "db error", status: 0 });
                    }
                    console.log("indside db check final")
                    return res.json({ message: "data", status: 1, resData: fileOwners, shopID: req.cookies.shop.shopUniCode });
                })
            } else {
                res.clearCookie('shop');
                return res.json({ message: "invalid cookey", status: -1 });
            }
        });
    } else {
        return res.json({ message: "no cookey", status: -1 });
    }
})

app.post('/getChatData', (req, res) => {
    const customer_id = req.body.unicode;
    const sql = 'SELECT * FROM Files WHERE file_owner =? and  choice_center_id =?';
    db.all(sql, [customer_id, req.cookies.shop.shopUniCode], (err, files) => {
        if (err) {
            console.log(err)
            return res.json({ message: "db error", status: 0 });
        }
        return res.json({ message: "data", status: 1, resData: files });
    })
})
app.post('/deleteChat', (req, res) => {
    if (req.body.customerId && req.cookies.shop.shopUniCode) {
        const customerId = req.body.customerId;
        const shopID = req.cookies.shop.shopUniCode;
        console.log(shopID, customerId);
        db.run('DELETE FROM Files WHERE choice_center_id = ? AND file_owner = ?', [shopID, customerId], (err) => {
            if (err) {
                console.log(err)
                return res.json({ message: "db error", status: 0 });
            }
            console.log("deleted")
            return res.json({ message: "Deleted", status: 1 });
        });
    } else {
        res.json({ message: "error", status: 0 });
    }
})
app.post('/getPrivateFile/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'private', fileName);

    if (req.cookies.shop) {
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.json({ message: "file not found", status: 0, redirect: "https://colorlib.com/wp/wp-content/uploads/sites/2/404-error-page-templates.jpg.webp" })
        }
    } else {
        res.status(403).send('Access Forbidden');
    }
});

app.get('/getPrivateFile/:fileName', async (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'private', fileName);

    if (req.cookies.shop) {
        if (fs.existsSync(filePath)) {
            // For other file types, send the file directly to the client
            console.log("other file", filePath)
            res.sendFile(filePath);
        } else {
            // File not found, send the HTML page
            const notFoundPagePath = path.join(__dirname, 'file_not_found.html');
            console.log(notFoundPagePath)
            // res.sendFile(notFoundPagePath);
            res.json({ v: "v" })
        }
    } else {
        // Access Forbidden
        res.status(403).send('Access Forbidden');
    }
});


function isOfficeDocument(extension) {
    return ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(extension);
}
app.post('/qrID', (req, res) => {
    if (req.cookies.shop) {
        res.json({ qrID: req.cookies.shop.shopUniCode });
    } else { res.send("no-qr") }
})

// Serve the Socket.IO client script
// app.get('/socket.io/socket.io.js', (req, res) => {
//     const filePath = path.resolve(__dirname, 'node_modules/socket.io/client-dist/socket.io.js');
//     res.sendFile(filePath);
// });

// app.get('/socket.io', (req, res) => {
//    res.send("vijay");
// });

// Socket section
io.on('connection', function (client) {
    const username = client.handshake.query.username;

    console.log(`Client connected with ID: ${client.id} and  ${username}  `);
    client.join(username);

    client.on('fileUploaded', function (clientData) {
        let reciver = clientData.reciverid;
        console.log(clientData, reciver,"client msged");

        // Emit the message to the specific receiverId
        io.to(reciver).emit("receiveMsg", {
            msg: clientData.msg,
            senderName: clientData.senderName
        });
    });
});

io.on('reconnect', (client) => {
    console.log(client, "client reconnected");
});


// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});