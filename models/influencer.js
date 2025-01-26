const mongoose = require("mongoose")

const influencerSchema = mongoose.Schema({
    name: String,
    categoryInstagram: String,
    categoryYouTube: String,
    user_name: String,
    city: String,
    state: String,
    language: String,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    instagramData: {
        followers: { type: Number, default: 0 },
        link: String,
        genderDistribution: [
            {
                gender: { type: String },
                distribution: { type: Number },
            }
        ],
        ageDistribution: [
            {
                age: { type: String },
                value: { type: Number },
            }
        ],
        audienceByCountry: [
            {
                category: { type: String },
                name: { type: String },
                value: { type: Number },
            }
        ],
        collaborationCharges: {
            reel: { type: Number },
            story: { type: Number },
            post: { type: Number },
            oneMonthDigitalRights: { type: Number },
        },
    },
    youtubeData: {
        followers: { type: Number, default: 0 },
        link: { type: String },
        genderDistribution: [
            {
                gender: { type: String },
                distribution: { type: Number },
            }
        ],
        ageDistribution: [
            {
                age: { type: String },
                value: { type: Number },
            }
        ],
        audienceByCountry: [
            {
                category: { type: String },
                name: { type: String },
                value: { type: Number },
            }
        ],
        collaborationCharges: {
            reel: { type: Number },
            story: { type: Number },
            post: { type: Number },
            oneMonthDigitalRights: { type: Number },
        },
    },
    averageLikes: Number,
    averageViews: Number,
    averageComments: Number,
    averageEngagement: Number,
    image: String
})

const influencer = mongoose.model("influencer", influencerSchema)
module.exports = influencer