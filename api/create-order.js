import Razorpay from "razorpay";

export default async function handler(req, res) {

const razorpay = new Razorpay({
key_id: process.env.RAZORPAY_KEY_ID,
key_secret: process.env.RAZORPAY_KEY_SECRET
});

const options = {

amount: 100,

currency: "INR",

receipt: "receipt_1"

};

try {

const order = await razorpay.orders.create(options);

res.status(200).json(order);

} catch (error) {

res.status(500).json({ error: "Order creation failed" });

}

}
