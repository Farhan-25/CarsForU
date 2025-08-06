const express = require("express");
const path = require("path");
const fs = require("fs");
const maplibregl = require('maplibre-gl');
const mongoose = require('mongoose');
const bodyparser = require("body-parser");
const session = require('express-session');
const Razorpay = require('razorpay');
const { createCanvas } = require('canvas');
const canvas = createCanvas(300, 150);
const ctx = canvas.getContext('2d');


const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_6kqWVPf3IMLu4N',
    key_secret: 'XSJBY858DEuDZARPhasvisYh',
});


mongoose.connect('mongodb://localhost/carapp', { useNewUrlParser: true });
const app = express();
const port = 3000;

const contactSchema = new mongoose.Schema({
    name: String,
    age: String,
    gender: String,
    phone: String,
    email: String,
    address: String
});

const Contact = mongoose.model('Contact', contactSchema);

const signinSchema = new mongoose.Schema({
    signas: String,
    name: String,
    email: String,
    address: String,
    password: String,
    confirm: String,
    subscribed: Boolean
});

const Signin = mongoose.model('Signin', signinSchema);

const cardetailsSchema = new mongoose.Schema({
    providername: String,
    carnumber: String,
    carcompany: String,
    carmodel: String,
    caryear: String,
    seating: String,
    bags: String,
    fuel: String,
    rate: String
});

const Cardetails = mongoose.model('Cardetails', cardetailsSchema);

const prebookingSchema = new mongoose.Schema({
    email: String,
    pickupLocation: String,
    dropoffLocation: String,
    pickupDate: Date,
    pickupTime: String,
    numberOfDays: String,
    userseats: String
});

const Prebooking = mongoose.model('Prebooking', prebookingSchema);

const bookingSchema = new mongoose.Schema({
    name: String,
    email: String,
    carnumber: String,
    pickupLocation: String,
    dropoffLocation: String,
    pickupDate: Date,
    pickupTime: String,
    numberOfDays: String,
    rate: Number,
    totalPrice: Number
});

const Booking = mongoose.model('Booking', bookingSchema);

app.use('/static', express.static('static'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        res.redirect('/login'); // or your login route
    }
}

app.get("/", (req, res) => {
    const params = {}
    res.status(200).render('home.pug', params);
});

app.post('/prebook', (req, res) => {
    const { pickupLocation, dropoffLocation, pickupDate, pickupTime, numberOfDays, userseats } = req.body;
    const email = req.session?.user?.email;

    if (!email) {
        console.error("No email in session.");
        return res.status(401).redirect('/login');
    }

    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);

    const myPrebooking = new Prebooking({
        email,
        pickupLocation,
        dropoffLocation,
        pickupDate: pickupDateTime.toISOString(),
        pickupTime,
        numberOfDays: parseInt(req.body.numberOfDays),
        userseats: parseInt(userseats)
    });

    myPrebooking.save()
        .then(() => {
            const fs = require('fs');
            const outputToWrite = `Prebooking details:
                Pickup: ${pickupLocation}
                Dropoff: ${dropoffLocation}
                Pickup Date & Time: ${pickupDateTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                Number of Days: ${numberOfDays}
                Number of Seats: ${userseats}`;

            fs.writeFileSync('prebookingForm.txt', outputToWrite);
            res.redirect(`/cars?seats=${userseats}`);
        })
        .catch((err) => {
            console.error(err);
            res.status(400).send("Oops! Please try again. Your booking has not been submitted.");
        });
});


app.get('/contact', (req, res) => {
    const params = {}
    res.status(200).render('contact.pug', params);
});

app.post('/contact', (req, res) => {
    const { name, age, gender, phone, email, address } = req.body;

    const myData = new Contact({ name, age, gender, phone, email, address });
    myData.save()
        .then(() => {
            const outputToWrite = `The name of client is ${name}, ${age} years old, ${gender} residing at ${address}. Client's phone number is ${phone} and email Id is ${email}.`;
            fs.writeFileSync('clientsForm.txt', outputToWrite);

            res.redirect('/thankyou'); // Redirect to a thank you page
        })
        .catch(() => {
            res.status(400).send("Oops! Please try again. Your form has not been submitted.");
        });
});


app.get('/thankyou', (req, res) => {
    res.render('thankyou.pug'); // Render thankyou.pug
});

app.get("/cars", async (req, res) => {
    try {
        const seatFilter = req.query.seats;

        let cars;
        if (seatFilter) {
            cars = await Cardetails.find({ seating: parseInt(seatFilter) }); // <-- change is here
        } else {
            cars = await Cardetails.find();
        }

        res.render('cars.pug', { cars });
    } catch (err) {
        console.error('Error fetching cars:', err);
        res.status(500).send('Internal server error');
    }
});


app.post('/cars', async (req, res) => {
    const { carnumber } = req.body;

    try {
        const selectedCar = await Cardetails.findOne({ carnumber });

        if (!selectedCar) {
            return res.status(404).send('Car not found');
        }

        res.redirect(`/bookcar/${carnumber}`);
    } catch (err) {
        console.error('Error selecting car:', err);
        res.status(500).send('Server error');
    }
});

app.get('/bookcar/:carnumber', ensureAuthenticated, async (req, res) => {
    try {
        const carnumber = req.params.carnumber;
        const user = req.session.user;

        const car = await Cardetails.findOne({ carnumber });
        if (!car) return res.status(404).send("Car not found");

        const prebooking = await Prebooking.findOne({ email: user.email });

        let numberOfDays = '';
        if (prebooking?.numberOfDays) {
            numberOfDays = prebooking.numberOfDays;
        }

        res.render('bookcar', {
            car,
            user,
            prebooking,
            numberOfDays
        });
    } catch (err) {
        console.error("Error loading booking page:", err);
        res.status(500).send("Server error");
    }
});

app.post("/bookcar/:carnumber", async (req, res) => {
    const {
        name,
        email,
        carnumber,
        pickupLocation,
        dropoffLocation,
        pickupDate,
        pickupTime,
        numberOfDays,
        rate,
        totalPrice
    } = req.body;

    try {
        const newBooking = new Booking({
            name,
            email,
            carnumber,
            pickupLocation,
            dropoffLocation,
            pickupDate,
            pickupTime,
            numberOfDays,
            rate,
            totalPrice
        });
        await newBooking.save();

        // Save to session
        req.session.booking = {
            user: { name, email },
            car: { carnumber, rate },
            pickupLocation,
            dropoffLocation,
            pickupDate,
            pickupTime,
            numberOfDays,
            totalPrice
        };

        // Write to file
        const output = `Booking Entry:
        Name: ${name}
        Email: ${email}
        Car Number: ${carnumber}
        Pickup Location: ${pickupLocation}
        Drop-off Location: ${dropoffLocation}
        Pickup Date: ${pickupDate}
        pickupTime: ${pickupTime}
        numberOfDays: ${numberOfDays}
        Rate: ${rate}
        Total Price: ${totalPrice}
        `;

        fs.writeFileSync('bookingLogs.txt', output);

        res.redirect('/payment');
    } catch (err) {
        console.error('Error during booking:', err);
        res.status(400).send("Booking failed. Please try again.");
    }
});

function formatDate(inputDate) {
    const date = new Date(inputDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

app.get("/payment", (req, res) => {
    if (!req.session.booking) {
        return res.status(400).send("No booking data found.");
    }

    const {
        user,
        car,
        pickupLocation,
        dropoffLocation,
        pickupDate,
        pickupTime,
        numberOfDays,
        totalPrice
    } = req.session.booking;

    res.render('payment.pug', {
        user,
        car,
        pickupLocation,
        dropoffLocation,
        pickupDate: formatDate(pickupDate),
        pickupTime,
        numberOfDays,
        totalPrice
    });
});

app.post('/payment', async (req, res) => {
    const { amount } = req.body; // amount in rupees

    const options = {
        amount: amount * 100, // in paise
        currency: "INR",
        receipt: "receipt#1",
        payment_capture: 1
    };

    try {
        const response = await razorpayInstance.orders.create(options);
        res.json({
            id: response.id,
            currency: response.currency,
            amount: response.amount
        });
    } catch (err) {
        console.error("Error creating payment:", err);
        res.status(500).json({ error: "Error creating payment" }); // ✅ FIXED
    }
});

app.get("/about", (req, res) => {
    const params = {}
    res.status(200).render('about.pug', params);
});

app.get("/service", (req, res) => {
    const params = {}
    res.status(200).render('service.pug', params);
});

app.get("/pricingEconomy", (req, res) => {
    const params = {}
    res.status(200).render('pricingEconomy.pug', params);
});

app.get("/pricingBuisness", (req, res) => {
    const params = {}
    res.status(200).render('pricingBuisness.pug', params);
});

app.get("/pricingLuxury", (req, res) => {
    const params = {}
    res.status(200).render('pricingLuxury.pug', params);
});

app.get("/terms", (req, res) => {
    const params = {}
    res.status(200).render('terms.pug', params);
});

app.get("/signin", (req, res) => {
    const params = {}
    res.status(200).render('signin.pug', params);
});

app.post('/signin', (req, res) => {
    const { name, email, address, password, confirm, signas, subscribe } = req.body;

    if (password !== confirm) {
        return res.status(400).send("Inappropriate credentials: Passwords do not match.");
    }

    const newSignin = new Signin({
        signas,
        name,
        email,
        address,
        password,
        confirm,
        subscribed: subscribe === 'yes'
    });

    newSignin.save()
        .then(() => {
            const output = `Signin Entry:
                Role: ${signas}
                Name: ${name}
                Email: ${email}
                Address: ${address}
                Password: ${password}
                Confirm Password: ${confirm}
                Subscribed: ${subscribe === 'yes' ? 'Yes' : 'No'}
                `;
            fs.writeFileSync('signinLogs.txt', output);
            res.redirect('/signsuccess');
        })
        .catch(err => {
            console.error('Error during sign in:', err);
            res.status(400).send("Sign-in failed. Please try again.");
        });
});


app.get("/signsuccess", (req, res) => {
    const params = {}
    res.status(200).render('signsuccess.pug', params);
});

app.get("/login", (req, res) => {
    const params = {}
    res.status(200).render('login.pug', params);
});

app.post("/login", async (req, res) => {
    const { email, password, signas } = req.body;

    const adminEmail = "admincarsforu@gmail.com";
    const adminPassword = "951753";

    if (signas === "admin") {
        if (email === adminEmail && password === adminPassword) {
            // return res.send(`Welcome, Admin!`);
            res.redirect("/admindashboard");
        } else {
            return res.status(401).send("Invalid admin credentials.");
        }
    }

    try {
        const user = await Signin.findOne({ email, signas });

        if (!user) {
            return res.status(401).send("User not found or role mismatch.");
        }

        if (user.password !== password) {
            return res.status(401).send("Incorrect password.");
        }

        req.session.user = {
            name: user.name,
            email: user.email,
            signas: user.signas
        };

        if (signas === "user") {
            res.redirect('/');
        } else if (signas === "provider") {
            res.redirect('/providerdashboard'); // Or whatever your provider route is
        } else {
            res.status(400).send("Unknown user role.");
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send("Server error during login.");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Logout failed");
        }
        res.redirect('/');
    });
});

app.get("/providerdashboard", (req, res) => {
    const params = {}
    res.render('providerdashboard', { query: req.query });
});

app.post('/providerdashboard', async (req, res) => {
    const { providername, carnumber, carcompany, carmodel, caryear, seating, bags, fuel, rate } = req.body;

    try {
        // Check if car already exists
        const existing = await Cardetails.findOne({ carnumber });

        if (existing) {
            // Delete existing before replacing
            await Cardetails.deleteOne({ carnumber });
        }

        // Save the new/updated car
        const myData = new Cardetails({ providername, carnumber, carcompany, carmodel, caryear, seating, bags, fuel, rate });
        await myData.save();

        const output = `Car details:
            providername: ${providername}
            carnumber: ${carnumber}
            carcompany: ${carcompany}
            carmodel: ${carmodel}
            caryear: ${caryear}
            seating: ${seating}
            bags: ${bags}
            fuel: ${fuel}
            rate: ${rate}
            `;
        fs.appendFileSync('carLogs.txt', output);

        if (existing) {
            return res.redirect('/providerdashboard?replaced=1');
        } else {
            return res.redirect('/providerdashboard?added=1');
        }

    } catch (err) {
        console.error(err);
        return res.redirect('/providerdashboard?error=1');
    }
});

app.post('/deletecar', async (req, res) => {
    const { carnumber } = req.body;

    try {
        const result = await Cardetails.deleteOne({ carnumber });
        if (result.deletedCount === 0) {
            return res.redirect('/providerdashboard?notfound=1');
        }
        return res.redirect('/providerdashboard?deleted=1');
    } catch (err) {
        console.error('Error deleting car:', err);
        return res.redirect('/providerdashboard?error=1');
    }
});

app.get("/admindashboard", async (req, res) => {
    try {
        const cars = await Cardetails.find();
        const bookings = await Booking.find();

        res.status(200).render('admindashboard', {
            cars,
            bookings
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).send('Server error');
    }
});


app.post("/admindashboard", async (req, res) => {
    const { carnumber } = req.body;
    try {
        await Cardetails.deleteOne({ carnumber });
        return res.redirect('/admindashboard');
    } catch (err) {
        console.error('Admin delete error:', err);
        return res.status(500).send('Failed to delete car');
    }
});

app.get("/success", (req, res) => {
    const params = {}
    res.status(200).render('paymentsuccess.pug', params);
});

app.get("/towing", (req, res) => {
    const params = {}
    res.status(200).render('towing.pug', params);
});

app.get("/jumpstart", (req, res) => {
    const params = {}
    res.status(200).render('jumpstart.pug', params);
});

app.get("/flattire", (req, res) => {
    const params = {}
    res.status(200).render('flattire.pug', params);
});

app.listen(port, () => {
    console.log(`This app has been started successfully ${port}`)
});