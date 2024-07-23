const pool = require("../../database");
const argon2 = require("argon2");
const queries = require("./queries");
const stripe = require("stripe")(
  "sk_test_51Oy95WSHgYBnvLvB7djpRYD4fmiT8nCfNEnRkUTvQxxpbiWqlonxw4QtSAmQxs1gpZLEqN9UjVDqjZ3yPx30bx5w00k487s9iS"
);

const getpay = async (req, res) => {
  console.log("get pay");

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.Feeamount * 100,
      currency: "inr",
      automatic_payment_methods: { enabled: true },
    });
    res.json({ paymentIntent: paymentIntent });
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
};
const getstatus = async (req, res) => {
  console.log("get status pay");
  const paymentId = req.body.payid; // Replace with the actual payment ID
  stripe.paymentIntents
    .retrieve(paymentId)
    .then((paymentIntent) => {
      // Verify payment status
      if (paymentIntent.status === "succeeded") {
        console.log(paymentIntent.amount);
        pool.connect();
        pool.query(
          queries.checkroll,
          [req.body.student_id],
          async (err, results) => {
            if (results.rows.length == 0) {
              console.log("wrong pay");
            } else {
              //    const diff = results.rows.fee-paymentIntent.amount;

              const amount = paymentIntent.amount.toFixed(2);
              console.log("hello");
              pool.query(
                queries.feepayment,
                [
                  req.body.student_id,
                  amount / 100,
                 
               paymentId,
                ],
                (err, resul) => {
                  if (!err) {
                    console.log("Sfsfsfs");
                  } else {
                    console.log(err);
                    console.log(paymentId)
                  }
                }
              );
              pool.query(
                queries.statusupdate,
                [req.body.student_id],
                (err, reso) => {
                  if (!err) {
                    console.log("status update");
                  } else {
                    console.log(err);
                  }
                }
              );
              res.status(201).send("succ");
            }
          }
        );
      } else {
        console.error("Payment not succeeded");
        // Handle payment not succeeded
      }
    })
    .catch((error) => {
      console.error("Error retrieving payment:", error);
      // Handle error
    });
};
async function getRecentTransactions(req, res) {
  try {
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 10, // Adjust the number of transactions to retrieve as needed
      expand: ["data.charges"], // Expand the charges associated with each payment intent
    });
    console.log(paymentIntents.data);
    // Process the list of payment intents
    // paymentIntents.data.forEach((paymentIntent) => {
    //   console.log("Payment Intent ID:", paymentIntent.id);
    //   console.log("Amount:", paymentIntent.amount);
    //   console.log("Currency:", paymentIntent.currency);
    //   console.log("Charges:", paymentIntent.charges.data);
    //   console.log("--------------------------------------");
    // });
    res.status(200).json(paymentIntents.data);
  } catch (error) {
    console.error("Error retrieving recent transactions:", error);
  }
}
module.exports = {
  getpay,
  getstatus,
  getRecentTransactions,
};
