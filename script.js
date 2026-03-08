async function startPayment(){

const response = await fetch("/api/create-order", {
method: "POST"
});

const order = await response.json();

const options = {

key: "rzp_test_SOG6lOGhODRvFA",

amount: order.amount,

currency: "INR",

name: "Agentic Wallet",

description: "Test Payment",

order_id: order.id,

handler: async function (response) {

alert("Payment Successful!");

console.log(response);

}

};

const rzp = new Razorpay(options);

rzp.open();

}
