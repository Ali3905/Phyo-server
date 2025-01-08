const mongooose = require("mongoose")

function connectToMongo (URL) {
     return mongooose.connect(URL)
}


module.exports = {
    connectToMongo
}