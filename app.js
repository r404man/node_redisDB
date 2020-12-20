const express = require("express");
const exphbs = require("express-handlebars");
const path = require('path');
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const redis = require("redis");
const morgan = require("morgan");

const PORT = 3000 || process.env.PORT;
// Create redis client
const client = redis.createClient();
client.on('connect', () => {
    console.log('connected to redis');
});

const app = express();
app.use(morgan("dev"));

// Public & view engine
app.use(express.static(__dirname + '/public'));

app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    partialsDir: __dirname + '/views/partials/',
}));
app.set('view engine', 'handlebars');

// body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// methodOverride
app.use(methodOverride('_method'));

// Search page
app.get('/', (req, res) => {
    res.render('searchusers');
});

// Search processing 
app.post('/user/search', (req, res) => {
    const id = req.body.id;

    client.hgetall(id, (err, obj) => {
        if (!obj) {
            res.render('searchusers', {
                error: `User does not exist`
            });
        } else {
            obj.id = id;
            res.render('details', {
                user: obj,
            });
        }
    })
});

// Add user page
app.get('/user/add', (req, res) => {
    res.render('adduser');
});

// Add user processing
app.post('/user/add', (req, res) => {
    const { id, first_name, last_name, email, phone } = req.body;

    client.hmset(id, [
        'first_name', first_name,
        'last_name', last_name,
        'email', email,
        'phone', phone],
        (err, reply) => {
            if (err) {
                console.error(err);
            }
            else {
                console.log(reply);
                res.redirect('/');
            }
        },
    );
});

// Delete user
app.delete('/user/delete/:id', (req, res) => {
    client.del(req.params.id);
    res.redirect('/');
})
app.listen(PORT, console.log(`Server has running on port ${PORT} `))