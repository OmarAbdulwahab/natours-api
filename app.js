const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const appError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const viewRouter = require('./routes/viewRouter');

const app = express();
app.engine('pug', require('pug').__express);
// Telling express that we are using 'pug' as a template engine
app.set('view engine', 'pug');
// Then telling it where the template(views) are located {using (path) feature in nodejs}
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MiddleWares

// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' })); // this just to get mapbox to work
// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limiting the number of request from one IP to 100 request per hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser()); // To parse all cookies that comes with a request

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS (cross-site scripting) attacks
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingQuantity',
      'ratingAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Serving static files
// app.use(express.static(`${__dirname}/public`));
// app.use(express.static(path.join(__dirname, 'public')));

// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👋');
//   next();
// });

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

// app.get('/', (req, res) => {
//   res.status(200).json({
//     message: 'Hello from the server side!',
//     app: 'Natours',
//   });
// });

// app.post('/', (req, res) => {
//   res.send('You can post on this endpoint...');
// });

///// USERS //////////////

// app.get('/api/v1/tours', getAllTours); // GET
// app.get('/api/v1/tours/:id', getTour); // GET
// app.post('/api/v1/tours', createTour); // POST
// app.patch('/api/v1/tours/:id', updateTour); // PATCH
// app.delete('/api/v1/tours/:id', deleteTour); // DELETE

// Routes

// The above 5 lines are not practical so we can write this methods in a better way
// by chaining the methods for the same route:
// app.route('/api/v1/tours').get(getAllTours).post(createTour); // At the route and get method call getAllTours function and at post method call createTour function
// app
//   .route('/api/v1/tours/:id')
//   .get(getTour)
//   .patch(updateTour)
//   .delete(deleteTour);

// app.route('/api/v1/users').get(getAllUsers).post(createUser);
// app
//   .route('/api/v1/users/:id')
//   .get(getUser)
//   .patch(updateUser)
//   .delete(deleteUser);

//////// LET'S NOW DIVIDE OUR ROUTES INTO FILES BY FIRST USING METHODS AS SUB ROUTES

// ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// This middleware will work to show an error for unhandeled routes for all HTTP methods
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  next(new appError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Error handling middleware
app.use(globalErrorHandler);

module.exports = app;
