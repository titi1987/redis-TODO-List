// Declarations
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const redis = require('redis');
const { Pool } = require('pg'); // Import the Pool class from the pg module

// PostgreSQL Connection Setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'todo',
  password: 'Reborn1987!',
  port: 5432,
});

// Initialization of express
var app = express();

// Redis Client
const client = redis.createClient();
client.on('connect', () => {
  console.log('Connected to Redis...');
});

// View engine
app.set('views', path.join(__dirname, 'views')); // Fix syntax here
app.set('view engine', 'ejs');

// Normalization of the elements used
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// This is our router
app.get('/', (req, res) => {
  var title = 'Redis TODO List';
  
  // Query tasks from PostgreSQL
  pool.query('SELECT * FROM tasks ORDER BY id DESC', (err, result) => {
    if (err) {
      return res.send(err);
    }

    res.render('index', {
      title: title,
      todo: result.rows, // Updated to use data from PostgreSQL
      counter: result.rowCount
    });
  });
});

// Add tasks to both Redis and PostgreSQL
app.post('/todo/add', (req, res, next) => {
  var todo = req.body.todos;
  
  // Add to Redis
  client.RPUSH('todo', todo, (err, reply) => {
    if (err) {
      return res.send(err);
    }

    // Add to PostgreSQL
    pool.query('INSERT INTO tasks (task) VALUES ($1)', [todo], (err, result) => {
      if (err) {
        return res.send(err);
      }
      res.redirect('/');
    });
  });
});

// Delete messages on redis by index (Modify as needed for PostgreSQL)
app.post('/todo/delete', (req, res, next) => {
  var delTODO = req.body.todo;
  var deleted = '__DELETED__';
  
  client.LRANGE('todo', 0, -1, (err, todo) => {
    for (let i = 0; i < delTODO.length; i++) {
      client.LSET('todo', delTODO[i], deleted);
    }
    client.LREM('todo', 0, deleted);
    
    // Additional logic needed here to delete from PostgreSQL if required
    // This part is left as an exercise depending on how you want to handle deletions in PostgreSQL
    
    res.redirect('/');
  });
});

// Port listen of the app
app.listen(3000, () => {
  console.log('Server Started at port 3000...');
});

module.exports = app;
