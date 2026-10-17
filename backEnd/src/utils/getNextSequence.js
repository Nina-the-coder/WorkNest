const Counter = require("../models/Counter");

const getNextSequence = async(name, session) => {
    const query = Counter.findOneAndUpdate(
        {name},
        {$inc: {seq: 1}},
        {new: true, upsert: true}
    );
    const counter = await (session ? query.session(session) : query);
    return counter.seq;
};

module.exports = getNextSequence;
