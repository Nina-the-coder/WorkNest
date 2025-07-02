const Counter = require("../models/Counter");

const getNextSequence = async(name) => {
    const counter = await Counter.findOneAndUpdate(
        {name},
        {$inc: {seq: 1}},
        {new: true, upsert: true}
    );
    return counter.seq;
};

module.exports = getNextSequence;