function startPayment(){

const options = {
key: "YOUR_KEY_ID",

amount: 100, // ₹1 = 100 paise

currency: "INR",

name: "Agentic Wallet",

description: "Demo Product",

image: "https://cdn-icons-png.flaticon.com/512/2331/2331970.png",

handler: function (response) {

alert("Payment Successful!");

console.log(response);

},

prefill: {

name: "Test User",

email: "test@example.com",

contact: "9999999999"

},

theme: {

color: "#000000"

}

};

const rzp = new Razorpay(options);

rzp.open();

}
