const allowedOrigins = require("./allowedOrigins");

// Remove for deployment because postman can access the api
const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS`));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
};

module.exports = corsOptions;
