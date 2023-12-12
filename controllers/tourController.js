const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const factory = require('./handlerFactory');
// const APIFeatures = require('./../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// The aggregation pipeline to get status
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $project: { _id: 0 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/230/center/34.083555, -118.394445/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = distance === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new appError(
        'Please provide a latitude and longitude in a format lan,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371192 : 0.001;

  if (!lat || !lng) {
    next(
      new appError(
        'Please provide a latitude and longitude in a format lan,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

// We don't need this code anymore because we now dealing with mongo database
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// Route Handlers

//////// GET request ////////

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   console.log(req.query);

//   // BUILD QUERY
//   // // 1A) Filtring
//   // const queryObj = { ...req.query };
//   // const execludedFields = ['page', 'sort', 'limit', 'fields'];
//   // execludedFields.forEach((el) => delete queryObj[el]);

//   // // 1B) Advanced Filtring
//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//   // console.log(JSON.parse(queryStr));

//   // // const query = await Tour.find();

//   // let query = Tour.find(JSON.parse(queryStr));

//   // // const query = await Tour.find()
//   // //   .where('duration')
//   // //   .equals(5)
//   // //   .where('difficulty')
//   // //   .equals('easy');

//   // 2) SORTING
//   // sorting by the params they give us else by the created at and the newest one appears first
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');
//   //   // console.log(sortBy);
//   //   query = query.sort(sortBy);
//   //   // sort('price ratingAverage')
//   // } else {
//   //   query = query.sort('-createdAt');
//   // }

//   // 3) Field Limiting
//   // fields=name,duration,difficulty
//   // if you have it then show the fields specified only.
//   // if not show all fields unless '__v' variable which is a variable mongodb uses internally
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select('-__v');
//   //   // if you want to except a variable just put (-) before it
//   // }

//   // 4) Pagination
//   // const page = req.query.page * 1 || 1; // default is 1
//   // const limit = req.query.limit * 1 || 100;
//   // const skip = (page - 1) * limit;
//   // // page=2&limit=10
//   // // page 1 => 1-10 ,, page 2 => 11-20 ,, page 3 => 21-30 ..... etc
//   // query = query.skip(skip).limit(limit);

//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) throw new Error("This page doesn't exist!");
//   // }

//   // EXECUTE QUERY
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     result: tours.length,
//     data: {
//       tours,
//     },
//   });
// });

// exports.getTour=catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   // Tour.findById(req.params.id) ==>>> is the same as ==>>> Tour findOne({_id: req.params.id})

//   if (!tour) {
//     next(new appError('No tour found with this ID!', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

//////// POST request ////////
// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });

// try {
//   // const newTour=new Tour({});
//   // newTour.save()

// } catch (err) {
//   res.status(400).json({
//     status: 'fail',
//     message: err,
//   });
// }
// });

//////// PATCH request ////////

// The old specific one
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     next(new appError('No tour found with this ID!', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

//////// DELETE request ////////

// The old specific one
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     next(new appError('No tour found with this ID!', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

// We no longer need this function because mongodb is already gives us a unique ID
// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour ID is: ${val}`);

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };
