const isEmployee = (req, res, next) => {
    if(req.user.role !== "employee"){
        return res.status(403).json({message: "Access denied. Employees only."});
    }
    next();
};

module.exports = isEmployee;