const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const app = express();
const port = 3000;

 
// TODO: Update PostgreSQL connection credentials before running the server
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'watchguru',
  password: '12345678',
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Set up session
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));


// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});



// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.session.userId) {
    return res.redirect('/dashboard');  // Redirect to dashboard or home page
  }
  next();  // If not logged in, proceed to the signup/login page
}

// TODO: Implement authentication middleware
// Redirect unauthenticated users to the login page
function isAuthenticated(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}


// Route: Home page
app.get('/', async (req, res) => {
  try {
    // Query to get all products
    const result = await pool.query('SELECT * FROM Products');
    
    // Render the 'home-page' template, 
    // passing the retrieved product data to the template 
    // for rendering within the page.
    res.render('home-page', { products: result.rows });
  } catch (error) {
    console.error(error);
    res.send('Server error');
  }
});


// Route: Signup page
app.get('/signup', isLoggedIn, (req, res) => {
  res.render('signup', {error: null});
});

// TODO: Implement user signup logic
app.post('/signup', isLoggedIn, async (req, res) => {
  const {username, email, password, age } = req.body;
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.render('signup', { error: "Error: Email already exists!" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set kid-friendliness based on age (e.g., under 13)
    const isKidFriendly = parseInt(age) < 13;

    const newUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, age, is_kid_friendly)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id`,
      [username, email, hashedPassword, age, isKidFriendly]
    );
    req.session.userId = newUser.rows[0].user_id;

    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.render('signup', {error: "Server error"});
  }
});


// Route: Login page 
app.get('/login', isLoggedIn, (req, res) => {
  res.render('login', {error: null});
});

// TODO: Implement user login logic
app.post('/login', async (req, res) => {
  const {email, password} = req.body;

  try {
    const userQuery = await pool.query('SELECT * FROM Users WHERE email =$1', [email]);

    if (userQuery.rows.length === 0) {
      return res.render('login', {error: "Error: Email not found!"});
    }
    const user = userQuery.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.render('login', {error: "Error: Incorrect password!"});
    }
    req.session.userId = user.user_id;
    req.session.username = user.username;
    req.session.isKidFriendly = user.is_kid_friendly;
    req.session.age = user.age;
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.render('login', {error: "Server error"});
  }
});


// Route: Dashboard page (requires authentication)
// TODO: Render the dashboard page
app.get('/dashboard', isAuthenticated, async (req, res) => {
  res.render('dashboard');
});


// Route: List products
// TODO: Fetch and display all products from the database
app.get('/list-products', isAuthenticated, async (req, res) => {
  try {
    const productsQuery = await pool.query('SELECT * FROM Products ORDER BY product_id');

    res.render('products', {products: productsQuery.rows});
  } catch (error) {
    console.error(error);
    res.send('Server error');
  }
});


// Route: Add product to cart
// TODO: Implement "Add to Cart" functionality
app.get('/add-to-cart', isAuthenticated, async (req, res) => {
  res.render('add-to-cart', {error: null});
});

app.post('/add-to-cart', isAuthenticated, async (req, res) => {
  const {product_id, quantity} = req.body;
  const user_id = req.session.userId;

  try {
    const productQuery = await pool.query('SELECT * FROM Products WHERE product_id = $1', [product_id]);
    if (productQuery.rows.length === 0) { 
      return res.render('add-to-cart', {error: "Product not found!"});
    }
    const product = productQuery.rows[0];

    if (product.stock_quantity < quantity) {
      return res.render('add-to-cart', {error: "Error: Insufficient stock!"});
    }

    const cartQuery = await pool.query(
      'SELECT * FROM Cart WHERE user_id = $1 AND item_id = $2', 
      [user_id, product_id]
    );

    if(cartQuery.rows.length > 0) { 
      const existingitem = cartQuery.rows[0];
      const newquantity = existingitem.quantity + parseInt(quantity);
      if (product.stock_quantity < newquantity) { 
        return res.render('add-to-cart', {error: "Error: Insufficient stock!"});
      }
      await pool.query(
        'UPDATE Cart SET quantity = $1 WHERE user_id = $2 AND item_id = $3',
        [newquantity, user_id, product_id]
      );
      return res.render('add-to-cart', {error: "Product quantity updated in the cart!"});
    } else {
      await pool.query(
        'INSERT INTO Cart (user_id, item_id, quantity) VALUES ($1, $2, $3)',
        [user_id, product_id, quantity]
      );
      return res.render('add-to-cart', {error: "Product added to the cart!"});
    }
  } catch (error) {
    console.error(error);
    res.send('Server error');
  }
});


// Route: Remove product from cart
// TODO: Implement "Remove from Cart" functionality
app.get('/remove-from-cart', isAuthenticated, async (req, res) => {
  res.render('remove-from-cart', {error: null});
});

app.post('/remove-from-cart', isAuthenticated, async (req, res) => {
  const {product_id} = req.body;
  const user_id = req.session.userId;

  try {
    const cartQuery = await pool.query(
      'SELECT * FROM Cart WHERE user_id = $1 AND item_id = $2',
      [user_id, product_id]
    );
    if (cartQuery.rows.length === 0) {
      return res.render('remove-from-cart', {error: "Product not found in your cart!"});
    }
    await pool.query(
      'DELETE FROM Cart WHERE user_id = $1 AND item_id = $2',
      [user_id, product_id]
    );
    res.render('remove-from-cart', {error: "Product successfully removed from your cart!"});
  } catch(error) {
    console.error(error);
    res.send('Server error, unable to remove product.');
  }
});


// Route: Display cart
// TODO: Retrieve and display the user's cart items
app.get('/display-cart', isAuthenticated, async (req, res) => {
  const user_id = req.session.userId;

  try {
    const cartQuery = await pool.query(
      `SELECT c.item_id, c.quantity, p.name, p.price, p.stock_quantity AS stock
      FROM Cart c
      JOIN Products p ON c.item_id = p.product_id
      WHERE c.user_id = $1
      ORDER BY c.item_id`,
      [user_id]
    );
    if (cartQuery.rows.length === 0) {
      return res.render('display-cart', { cartItems: [], totalAmount: 0, error: null});
    }

    const cartItems = cartQuery.rows.map(item => {
      const totalPrice = item.price * item.quantity;
      const stockStatus = item.quantity <= item.stock ? 'In Stock' : 'Out of Stock';
      return {
        product_id: item.item_id,
        name: item.name, 
        quantity: item.quantity,
        price: item.price,
        totalPrice, stockStatus};
    });
    const totalAmount = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);

    res.render('display-cart', {cartItems, totalAmount, error: null});
  } catch (error) {
    console.error(error);
    res.send('Server error');
  }
});


// Route: Place order (clear cart)
// TODO: Implement order placement logic
app.post('/place-order', isAuthenticated, async (req, res) => {
  const user_id = req.session.userId;
  const cartItems = req.session.cart || [];
  try {
    const cartQuery = await pool.query(
      `SELECT c.item_id, c.quantity, p.price, p.stock_quantity
      FROM Cart c
      JOIN Products p ON c.item_id = p.product_id
      WHERE c.user_id = $1`,
      [user_id]
    );
    const totalAmount = cartQuery.rows.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const insufficientitems = cartQuery.rows.filter(item => item.quantity > item.stock_quantity);
    if (insufficientitems.length > 0){
      return res.render('display-cart', {cartItems, totalAmount, error: "Some items in your cart have insufficient stock."});
    }

    const orderDate = new Date();
    const orderInsert = await pool.query(
      `INSERT INTO Orders (user_id, order_date, total_amount)
      VALUES ($1, $2, $3) RETURNING order_id`,
      [user_id, orderDate, totalAmount]
    );
    const orderId = orderInsert.rows[0].order_id;

    for ( let item of cartQuery.rows) { 
      await pool.query(
        `INSERT INTO OrderItems (order_id, product_id, quantity, price) 
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.item_id, item.quantity, item.price]
      );
    }

    for (let item of cartQuery.rows) {
      await pool.query(
        `UPDATE Products 
         SET stock_quantity = stock_quantity - $1 
         WHERE product_id = $2`,
        [item.quantity, item.item_id]
      );
    }

    await pool.query(
      `DELETE FROM Cart WHERE user_id = $1`,
      [user_id]
    );

    res.redirect(`order-confirmation?orderId=${orderId}`);
  } catch (error) {
    console.error(error);
    res.send('Server error while placing order.');
  }
});


// Route: Order confirmation
// TODO: Display order confirmation details
app.get('/order-confirmation', isAuthenticated, async (req, res) => {
  const orderId = req.query.orderId;

  try {
    const orderQuery = await pool.query(
      `SELECT o.order_id, o.order_date, o.total_amount, oi.product_id, oi.quantity, oi.price, p.name
       FROM Orders o
       JOIN OrderItems oi ON o.order_id = oi.order_id
       JOIN Products p ON oi.product_id = p.product_id
       WHERE o.order_id = $1`,
      [orderId]
    );
    if (orderQuery.rows.length === 0) {
      return res.render('order-confirmation', {error: "Order not found."});
    }
    const orderDetails = orderQuery.rows;
    const totalAmount = orderDetails.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    res.render('order-confirmation', { orderDetails, totalAmount });
  } catch (error) {
    console.error(error);
    res.send('Error retrieving order details.');
  }
});


// Route: Logout (destroy session)
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error logging out');
    }
    res.redirect('/login');
  });
});