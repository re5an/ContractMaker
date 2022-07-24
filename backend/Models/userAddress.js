const mongoose = require('mongoose');

mongoose.connect(
    'mongodb+srv://resan:resan@boz@cluster0.b0agh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
    {useNewUrlParser: true, useUnifiedTopology: true},
);

// const paymentSchema = new mongoose.Schema({
//   id: String,
//   itemId: String,
//   paid: Boolean
// });
const wallet = new mongoose.Schema({
    // id: {   // userID
    //     type: Number,
    //     unique: true,
    //     required: true
    // },
    ethereum: {
        address: {
            type: String,
        },
        pv: String,
        assets: String,
    },
    binance: {
        address: {
            type: String,
        },
        pv: String,
        assets: String,
    },
    status: {
        type: String,
        default: 'active',
        index: true
    },
});

const Wallet = mongoose.model('wallet', wallet);

module.exports = {
    Wallet
};
