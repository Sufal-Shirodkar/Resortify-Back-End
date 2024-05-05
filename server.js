require("dotenv").config();
const express = require("express");
const http = require("http")
const { Server } = require("socket.io")
const { checkSchema } = require("express-validator");
const multer = require("multer"); //require multer
const cors = require("cors");
const app = express();
const morgan = require('morgan')        //morgan required files
const path = require('path')            //morgan required files
const fs = require('fs')   



app.use(cors());
app.use(express.json());
app.use(express.static("public"));
const port = 3060;
//databaseConfiguration
const configDb = require("./config/db");
configDb();


const server = http.createServer(app)
const adminSocketId = 'admin'; // Fixed socket ID for admin


const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
})

/////=>suraj

//morgan files
app.use(morgan('common'))
let logStream = fs.createWriteStream(path.join('log files','server.log'),{flags:'a'})
app.use(morgan('common',{stream:logStream}))

//authorization and authentication
const { authorizeUser, authenticateUser } = require("./App/middleware/auth");

//validationSchema
const {
  userRegistrationValidation,
  verifyEmailValidationSchema,
  resendOTPEmailValidationSchema,
  loginValidationSchema,
  forgotPasswordValidation,
  userUpdatingDetailsValidationSchema,
  userUpdatingPassword,
} = require("./App/validations/user-validaiton");

//controllers
const userCntrl = require("./App/controllers/user-controller");

//routes users
app.post(
  "/api/users",
  checkSchema(userRegistrationValidation),
  userCntrl.create
);
app.post(
  "/api/users/verifyEmail",
  checkSchema(verifyEmailValidationSchema),
  userCntrl.verifyEmail
);
//for reverification of email while login if not verified and for forgot password mail to verify mail
app.post(
  "/api/users/reVerifiyEmail",
  checkSchema(resendOTPEmailValidationSchema),
  userCntrl.resendOTP
);
//for forgot password -> mail and otp and new password
app.put(
  "/api/users/forgotPassword",
  checkSchema(forgotPasswordValidation),
  userCntrl.forgotPassword
);
app.post(
  "/api/users/login",
  checkSchema(loginValidationSchema),
  userCntrl.login
);
//for update
app.put(
  "/api/users",
  authenticateUser,
  checkSchema(userUpdatingDetailsValidationSchema),
  userCntrl.update
);
//for delete
app.delete("/api/users", authenticateUser, userCntrl.destroy);
//for updating password
app.put(
  "/api/users/updatePassword",
  authenticateUser,
  checkSchema(userUpdatingPassword),
  userCntrl.updatePassword
);
//for all users lists
app.get(
  "/api/users",
  authenticateUser,
  authorizeUser(["admin"]),
  userCntrl.lists
);
//for account
app.get("/api/users/account", authenticateUser, userCntrl.account);

//sufal
//multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./public/images");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// property controlller
const propertyController = require("./App/controllers/property-controller");
//amenity controller
const amenityController = require("./App/controllers/amenities-controller");

// room controller
const roomController = require("./App/controllers/room-controller");
// reviews
const reviewController = require("./App/controllers/reviews-controller");

//booking-controller
const bookingCntrl = require("./App/controllers/booking-controller");

// property validation schema
const {propertyValidationsSchema, generalModelValidationSchema} = require("./App/validations/property-validations");
//amenities validation schema
const amenititiesValidationSchema = require("./App/validations/amenities-validations");

// room validation schema
const roomValidationSchema = require("./App/validations/room-validations");
// review validation schema
const reviewValidationSchema = require("./App/validations/review-validations");

// static data
const dataController = require("./App/controllers/staticData-controller");

//booking validation schema
const {
  bookingValidaton,
  updateStatusValidation,
  updateCheckInOutValidation,
  bookingCancelSchema,
} = require("./App/validations/booking-validation");

//get all the resorts
app.get("/api/users/resorts", propertyController.list);

// get one resort
app.get("/api/users/resorts/:id", propertyController.listOne);

// list of my searches
app.get(
  "/api/users/resorts/:id/recentsearches",
  authenticateUser,
  authorizeUser(["user"]),
  propertyController.listForMySearches
);
app.get("/api/propertyStats", propertyController.Stats);
// create the resort
// app.post(
//   "/api/owners/propertydetails",
//   authenticateUser,
//   authorizeUser(["owner"]),
//   propertyController.create
// );
//update the resort
app.put(
  "/api/owners/propertydetails/:id",
  authenticateUser,
  authorizeUser(["owner"]),
  checkSchema(propertyValidationsSchema),
  propertyController.update
);
//delete the resort
app.delete(
  "/api/owners/propertydetails/:id",
  authenticateUser,
  authorizeUser(["owner"]),
  propertyController.delete
);
// admin approval of the resort
app.put(
  "/api/admin/propertydetails/:id",
  authenticateUser,
  authorizeUser(["admin"]),
  propertyController.adminApprove
);

//to get properties based query - on 04th april by Suraj
app.get("/api/properties/lists", propertyController.lists);

// rooms api
// update a room
app.put(
  "/api/owners/propertydetails/rooms/:id",
  authenticateUser,
  authorizeUser(["owner"]),
  roomController.update
);
// delete a room
app.delete(
  "/api/owners/propertydetails/room/:id",
  authenticateUser,
  authorizeUser(["owner"]),
  roomController.delete
);
// store total room
app.post("/api/propertydetails/addrooms/:id", propertyController.addRooms);
// post amenities
app.post(
  "/api/owners/amenities",
  authenticateUser,
  authorizeUser(["admin"]),
  checkSchema(amenititiesValidationSchema),
  amenityController.create
);
// update amenities
app.put(
  "/api/owners/amenities/:id",
  authenticateUser,
  authorizeUser(["admin"]),
  checkSchema(amenititiesValidationSchema),
  amenityController.update
);
// delete amenities
app.delete(
  "/api/owners/amenities/:id",
  authenticateUser,
  authorizeUser(["admin"]),
  amenityController.destroy
);
//list all amenities
app.get(
  "/api/owners/amenities",
  authenticateUser,
  authorizeUser(["owner", "admin"]),
  amenityController.list
);
//list one amentity
app.get(
  "/api/owners/amenities/:id",
  authenticateUser,
  authorizeUser(["owner", "admin"]),
  amenityController.listOne
);

//get one reviews of one property
app.get("/api/reviews/:id", reviewController.listOne);
// post the review
app.post(
  "/api/users/reviews/:id",
  authenticateUser,
  authorizeUser(["user"]),
  upload.array("files", 5),
  checkSchema(reviewValidationSchema),
  reviewController.create
);
// update the review
app.put(
  "/api/users/reviews/:id",
  authenticateUser,
  authorizeUser(["user"]),
  checkSchema(reviewValidationSchema),
  reviewController.update
);
//  delete a review
app.delete(
  "/api/users/reviews/:id",
  authenticateUser,
  authorizeUser(["user"]),
  reviewController.delete
);

//bookingCntollers
//for booking
app.post(
  "/api/bookings",
  authenticateUser,
  authorizeUser(["user"]),
  checkSchema(bookingValidaton),
  bookingCntrl.create
);
// changes to get the sum of the bookings as per the month
app.get(
  "/api/bookings/calculate",
  authenticateUser,
  authorizeUser(["owner"]),
  bookingCntrl.calculate
);
// controller get the status of the bookings
app.get(
  "/api/bookingStatus",
  authenticateUser,
  authorizeUser(["owner"]),
  bookingCntrl.Stats
);

//for changing booking status have to pass query
app.put(
  "/api/bookings/:id",
  authenticateUser,
  authorizeUser(["owner"]),
  checkSchema(updateStatusValidation),
  bookingCntrl.changeStatus
);
//for changing checkedIn checkedOut
app.put(
  "/api/bookings/in-out/:id",
  authenticateUser,
  authorizeUser(["owner"]),
  checkSchema(updateCheckInOutValidation),
  bookingCntrl.changeCheckInOut
);
//for cancellation
app.put(
  "/api/bookings/cancellation/:id",
  authenticateUser,
  authorizeUser(["user"]),
  checkSchema(bookingCancelSchema),
  bookingCntrl.cancellation
);
//for all today bookings
app.get(
  "/api/today/bookings",
  authenticateUser,
  authorizeUser(["owner"]),
  bookingCntrl.listTodayBookings
);

//for all bookings in given range
app.get(
  "/api/bookings",
  authenticateUser,
  authorizeUser(["owner"]),
  bookingCntrl.listBookings
);
//for one booking
app.get("/api/bookings/:id", bookingCntrl.listOne);

//paymentCNtrl
const paymentsCltr = require("./App/controllers/paymentController");

// app.post('/api/create-checkout-session',authenticateUser, authorizeUser(['user']), paymentsCltr.pay)
app.post("/api/create-checkout-session", paymentsCltr.pay);
app.put("/api/payments/:id/success", paymentsCltr.successUpdate);
app.put("/api/payments/:id/failed", paymentsCltr.failedUpdate);

// request for static data
app.get("/api/static-data", dataController.list);

//for testing multer
app.post(
  "/api/propertyphotos",
  upload.array("files"),
  authenticateUser,
  authorizeUser(["owner"]),
  propertyController.photos
);
app.post("/api/roomphotos", upload.array("files"), roomController.photos);
app.post(
  "/api/documentsphotos",
  upload.array("files"),
  propertyController.documents
);

//to check property exist or not
app.get("/api/owners/property",
  authenticateUser,
  authorizeUser(['owner']),
  propertyController.propertyExist
)

/// for step form
app.post(
  "/api/owners/propertydetails",
  authenticateUser,
  authorizeUser(["owner"]),
  checkSchema(propertyValidationsSchema),
  propertyController.propertycreate
);
app.post(
  "/api/owners/propertydetails/generalModel",
  authenticateUser,
  authorizeUser(["owner"]),
  checkSchema(generalModelValidationSchema),
  propertyController.generalModelCreate
);

app.post(
  "/api/owners/propertydetails/roomtypemodel",
  authenticateUser,
  authorizeUser(["owner"]),
  propertyController.roomtypecreate
);

app.post(
  "/api/reviewsphotos",
  authenticateUser,
  authorizeUser(["user"]),
  upload.array("files"),
  reviewController.photos
);
app.get(
  "/api/generalmodel",
  authenticateUser,
  authorizeUser(["admin"]),
  propertyController.generalModeList
);

app.get(
  "/api/bookingstats",
  authenticateUser,
  authorizeUser(["owner"]),
  bookingCntrl.Stats
);

//Chat Support System
// Admin namespace
const adminNamespace = io.of('/admin');

// Event listener for admin connections
adminNamespace.on('connection', (socket) => {
    // Emit event when admin socket connects
    console.log('Admin connected');

    //to join admin to adminSocketId
    socket.join(adminSocketId)

    // Handle admin messages
    socket.on('adminMessage', (message) => {
        console.log('Admin message:', message);
        // Broadcast admin message to all connected users
        io.emit('adminMessage', message);
    });

    socket.on('admin_message', (data) => {
        const { socketId, adminMsg } = data
        console.log(socketId, adminMsg)

        io.to(socketId).emit('admin_response', { socketId, adminMsg })
    })


    socket.on("disconnect", () => {
        console.log("user Disconnected", socket.id)
    })
});


io.on("connection", (socket) => {
    console.log("user connected", socket.id)

    // Store the socket ID in the map
    socket.emit('welcome_msg','Welcome to Resotify...')
    adminNamespace.to(adminSocketId).emit('new_user', socket.id);

    socket.on("disconnect", () => {
        console.log("user Disconnected", socket.id)
        adminNamespace.to(adminSocketId).emit('user_disconnected', socket.id);
    })

    socket.on('user_message', (data) => {
        console.log('User message:', data);
        // Forward user message to admin
        adminNamespace.to(adminSocketId).emit('userMessage', data);
    });
})


server.listen(port, () => {
  console.log("Server runnning on port" + " " + port);
});
