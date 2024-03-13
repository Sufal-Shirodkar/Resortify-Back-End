const { validationResult } = require("express-validator")
const BookingModel = require("../models/booking-model")
const Property = require("../models/property-model")
const User = require("../models/user-model")
const nodemailer = require("nodemailer")


const bookingCntrl = {}

//for sendingMail
const sendMail = (userMail, html) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.mailtrap.io',
        port: 2525,
        auth: {
            user: process.env.STMP_USERNAME,
            pass: process.env.STMP_PASSOWRD
        }
    })

    async function mailSend() {
        // send mail with defined transport object
        const info = await transporter.sendMail({
            from: 'sender@gmail.com', // sender address
            to: userMail, // list of receivers
            subject: "Registration Confirmation", // Subject line
            html: html, // html body
        });
    }
    mailSend().catch(console.error)
}

//for new booking
bookingCntrl.create = async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(404).json({errors:errors.array()})
    }
    const { body } = req
    try {
        const booking1 = new BookingModel(body)
        let str = 'RST'
        let count = await BookingModel.find().countDocuments() + 1
        const user = await User.findById(req.user.id)
        const property = await Property.findById(body.propertyId)
        const owner = await User.findOne({ _id: property.ownerId })
        booking1.bookingId = str + count
        booking1.userId = req.user.id
        booking1.status = "initiated"
        await booking1.save()
        res.send("Booking Initiated")

        const ownerHTMLMsg = `
    <p><b>Hi  <br/> There is booking with id: ${booking1.bookingId} </p>
    `
        const userHTMLMsg = `
    <p><b>Hi ${user.name} <br/> We have inittaed your bookong soon you will receive email once the owner approve your booking </p>
    `
        sendMail(owner.email, ownerHTMLMsg)
        sendMail(user.email, userHTMLMsg)
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' })
        console.log(err)
    }
}

//to changing status of booking
bookingCntrl.changeStatus = async (req, res) => {
    const bookingId = req.params.id
    const status = req.query.status
    try {
        const owner = await User.findOne({_id:req.user.id})
        const property = await Property.findOne({ ownerId: owner._id })
        const booking = await BookingModel.findOneAndUpdate({ _id: bookingId, propertyId: property._id }, { $set: { status: status } }, { new: true })
        const user = await User.findById(booking.userId)
        if (booking.status == 'approved') {
            const userHTMLMsg = `
            <p><b>Hi ${user.name} <br/> Booking gets approved by owner, please use the link to make the payment for your booking on ${String(booking.Date.checkIn).slice(0, 10)} at ${property.propertyName} </p>
            `
            sendMail(user.email, userHTMLMsg)
            res.json('Mail Sent to user')
            setTimeout(async() => {
                const booking = await BookingModel.findOne({ _id: bookingId, propertyId: property._id })
                if (booking.isPaymentDone == 'true') {
                    const ownerHTMLMsg = `
                    <p><b>Hi <br/>Pyament Done Booking Confirmed for ${booking.bookingId}.`
                    sendMail(owner.email, ownerHTMLMsg )
                } else {
                    const userHTMLMsg = `
                    <p><b>Hi ${user.name} <br/> Sorry for the inconvenience, You didn't completed the payment so we are giving priority to another one.`
                    sendMail(user.email, userHTMLMsg)
                    console.log('Mail sent for giving priority to another one')
                }
            }, (1000 * 60))
        } else if (booking.status == 'notApproved') {
            const userHTMLMsg = `
            <p><b>Hi ${user.name} <br/> Sorry for the inconvenience, Booking gets not approved by owner,there are some maintainance work going on.`
            sendMail(user.email, userHTMLMsg)
            res.json('Mail Sent to User')
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'Internal Server Error' })
    }
}

//for updating checkedIn and checkedOut
bookingCntrl.changeCheckInOut = async(req, res)=>{
    const bookingId = req.params.id
    const type = req.query.type
    try{
        const property = await Property.findOne({ownerId:req.user.id})
        if(type == 'isCheckedIn'){
            const booking = await BookingModel.findOneAndUpdate({_id:bookingId,propertyId:property._id,isPaymentDone:'true' }, {$set:{isCheckedIn:'true'}}, {new:true})
            res.json(booking)
        }else if(type == 'isCheckedOut'){
            const booking = await BookingModel.findOneAndUpdate({_id:bookingId,propertyId:property._id,isCheckedIn:'true' }, {$set:{isCheckedOut:'true'}}, {new:true})
            res.json(booking)
        }
    }catch(err){
        console.log(err)
        res.status(500).json({error:'Internal Server Error'})
    }
}

//for listing booking related to particularowner
bookingCntrl.listBookings = async(req, res)=>{
    try{
        const property = await Property.findOne({ownerId:req.user.id})
        const bookings = await BookingModel.find({propertyId:property._id})
        res.json(bookings)
    }catch(err){
        console.log(err)
        res.status(500).json({error:'Internal Server Error'})
    }
}

//for cancellation
bookingCntrl.cancellation = async(req, res)=>{
    const bookingId = req.params.id
    try{
        const booking = await BookingModel.findOneAndUpdate({userId:req.user.id, isPaymentDone:'true', isCancelled:false, _id:bookingId}, 
            {$set:{isCancelled:"true"}}, {new:true})
        res.json(booking)
    }catch(err){
        console.log(err)
        res.status(500).json({error:"Internal Server Error"})
    }
}


module.exports = bookingCntrl;