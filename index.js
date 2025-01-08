require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { OpenAI } = require("openai")
const influencer = require("./models/influencer")
const { connectToMongo } = require("./connections/db")
const axios = require("axios")

const app = express()
const PORT = 8000

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())
connectToMongo(process.env.MONGO_URI)
    .then(console.log("Mongo Connected"))
// .catch(console.log("DB connection failed"))

// const configuration = new configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// })
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

const headers = {
    authority: "i.instagram.com",
    accept: "/",
    "accept-language": "en-US,en;q=0.9,hi;q=0.8",
    "content-type": "application/x-www-form-urlencoded",
    cookie: `ig_did=4F8F57CA-BF49-4B85-8C52-611B0F525ACB; datr=dPE1Zc5Ddn8P6Q-xSRlNIMgG; ig_nrcb=1; ds_user_id=45032874760; ps_n=0; ps_l=0; mid=ZbqF0AAEAAHkroAy-X6KDIIhEDoQ; csrftoken=iBZmKJWoMnM6dEZhsp3JiS6ssjxq5MDQ; shbid="8503\\05445032874760\\0541741773742:01f7031d590a0902f9cc558f4016652ca4375b7b09a433547d9c7639e765399fa2195d60"; shbts="1710237742\\05445032874760\\0541741773742:01f70fb21741748081c033e6c761ef73a7f73432a9cac667babc7c7f35a66fac1b1c22bb"; rur="NAO\\05445032874760\\0541741773914:01f7c8c343f2aac7691a16e0b705b714253744eebe5b8caad15c902cae2dba7fc7fff837"; csrftoken=iBZmKJWoMnM6dEZhsp3JiS6ssjxq5MDQ`,
    // "sec-ch-ua": `"Chromium";v="122", "Not(A↵";v="24", "Google Chrome";v="122"`,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": `"macOS"`,
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "none",
    "user-agent": `'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'`,
    "x-asbd-id": "198387",
    "x-csrftoken": "iBZmKJWoMnM6dEZhsp3JiS6ssjxq5MDQ",
    "x-ig-app-id": "936619743392459",
    "x-ig-www-claim": "hmac.AR1yCz586xi6ZoH24dmvdq_ckLvj3lmcN1JbVTnAPHMcnl73",
    "x-instagram-ajax": "1",
    "x-requested-with": "XMLHttpRequest",
};


app.post("/api/ask", async (req, res) => {
    const { prompt } = req.body
    try {
        const response = await openai.beta.chat.completions.parse({
            model: "gpt-4o-2024-08-06",
            messages: [
                { role: "system", content: "You are a influencer marketer. User will tell you there needs and you will have to note the requirements and if you do not understand what they want for some field so leave it empty string. Do not fill with fillers words like not specified etc. If only male ratio is passed than only pass male ratio and vice versa. and for the age distribution you will have to see the user demand and create a range seeing following ranges that in what range do his required audience fit and if it cover more than one range then create one range out of those two and make sure to return range like this [minage]-[maxage]. These are ranges in my schema 13-17, 18-24, 25-34, 35-44, 45-64, 65+ " },
                { role: "user", content: prompt }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "influencer_requirements",
                    schema: {
                        type: "object",
                        properties: {
                            city: { type: "string" },
                            state: { type: "string" },
                            minFollowers: { type: "number" },
                            maxFollowers: { type: "number" },
                            category: { type: "string" },
                            maleRatio: { type: "number" },
                            femaleRatio: { type: "number" },
                            maleComparison: { type: "string", enum: [">=", "<="] },
                            femaleComparison: { type: "string", enum: [">=", "<="] },
                            country: { type: "string" },
                            countryComparison: { type: "string", enum: [">=", "<="] },
                            countryValue: { type: "number" },
                            ageRange: { type: "string" },
                            ageComparison: { type: "string", enum: [">=", "<="] },
                            ageValue: { type: "number" },
                        },
                        required: ["city", "category", "minFollowers", "maxFollowers", "state", "maleRatio", "femaleRatio", "maleComparison", "femaleComparison", "country", "countryComparison", "countryValue", "ageRange", "ageComparison", "ageValue"],
                        additionalProperties: false,
                    },
                    strict: true,
                }

            }
        })
        const math_reasoning = response.choices[0].message.parsed || {};
        const result = {
            city: math_reasoning.city || "",
            state: math_reasoning.state || "", // Handle optional property
            minFollowers: math_reasoning.minFollowers || 0,
            maxFollowers: math_reasoning.maxFollowers || Infinity, // Handle optional property
            category: math_reasoning.category || "",
            maleRatio: math_reasoning.maleRatio || null,
            femaleRatio: math_reasoning.femaleRatio || null,
            maleComparison: math_reasoning.maleComparison === ">=" ? "$gte" : math_reasoning.maleComparison === "<=" ? "$lte" : "$gte",
            femaleComparison: math_reasoning.femaleComparison === ">=" ? "$gte" : math_reasoning.femaleComparison === "<=" ? "$lte" : "$gte",
            countryComparison: math_reasoning.countryComparison === ">=" ? "$gte" : math_reasoning.countryComparison === "<=" ? "$lte" : "$gte",
            countryValue: math_reasoning.countryValue || null,
            country: math_reasoning.country || null,
            ageRanges: math_reasoning.ageRange || null,
            ageComparison: math_reasoning.ageComparison === ">=" ? "$gte" : math_reasoning.ageComparison === "<=" ? "$lte" : "$gte",
            ageValue: math_reasoning.ageValue || null,
        };

        const query = {
            $and: [
                { $or: [{ city: result.city }, { state: result.state }] },
                { $or: [{ "instagramData.followers": { $gte: result.minFollowers } }, { "youtubeData.followers": { $gte: result.minFollowers } }] },
                { $or: [{ categoryInstagram: result.category }, { categoryYouTube: result.category }] },
            ],
        };

        if (result.maleRatio !== null || result.femaleRatio !== null) {
            const genderQuery = [];

            if (result.maleRatio !== null) {
                genderQuery.push(
                    { "instagramData.genderDistribution": { $elemMatch: { gender: "MALE", distribution: { [result.maleComparison]: result.maleRatio } } } },
                    { "youtubeData.genderDistribution": { $elemMatch: { gender: "MALE", distribution: { [result.maleComparison]: result.maleRatio } } } },
                );
            }

            if (result.femaleRatio !== null) {
                genderQuery.push(
                    { "instagramData.genderDistribution": { $elemMatch: { gender: "FEMALE", distribution: { [result.maleComparison]: result.femaleRatio } } } },
                    { "youtubeData.genderDistribution": { $elemMatch: { gender: "FEMALE", distribution: { [result.maleComparison]: result.femaleRatio } } } },
                );
            }

            query.$and.push({ $or: genderQuery });
        }
        if (result.country && result.countryValue !== null) {
            const countryQuery = [];

            countryQuery.push({
                "instagramData.audienceByCountry": {
                    $elemMatch: { name: result.country, value: { [result.countryComparison]: result.countryValue } }
                }
            });

            // Add country filters for YouTube
            countryQuery.push({
                "youtubeData.audienceByCountry": {
                    $elemMatch: { name: result.country, value: { [result.countryComparison]: result.countryValue } }
                }
            });

            query.$and.push({ $or: countryQuery });
        }

        if (result.ageRanges && result.ageComparison && result.ageValue !== null) {
            // const ageQuery = [];


            // if (result.comparison) {
            //     // For over/under a certain age (e.g., "over 18")
            //     const ageThreshold = result.ageRanges[0].split("-")[0]; // Extract the lower bound (e.g., "18")
            //     ageQuery.push(
            //         { "instagramData.ageDistribution": { $elemMatch: { age: { [result.comparison]: ageThreshold }, value: { $gte: math_reasoning.countryValue } } } },
            //         { "youtubeData.ageDistribution": { $elemMatch: { age: { [result.comparison]: ageThreshold }, value: { $gte: math_reasoning.countryValue } } } }
            //     );
            // } else {
            // For specific ranges (e.g., "25-34")
            // result.ageRanges.forEach((range) => {
            //     ageQuery.push(
            //         { "instagramData.ageDistribution": { $elemMatch: { age: range, value: { $gte: math_reasoning.countryValue } } } },
            //         { "youtubeData.ageDistribution": { $elemMatch: { age: range, value: { $gte: math_reasoning.countryValue } } } }
            //     );
            // });

            // }


            const ageQuery = {
                $expr: {
                    [result.ageComparison]: [
                        {
                            $sum: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: "$instagramData.ageDistribution",
                                            as: "age",
                                            cond: {
                                                $and: [
                                                    {
                                                        $gte: [
                                                            {
                                                                $convert: {
                                                                    input: { $arrayElemAt: [{ $split: ["$$age.age", "-"] }, 0] },
                                                                    to: "int",
                                                                    onError: 0,
                                                                    onNull: 0
                                                                }
                                                            },
                                                            parseInt(result.ageRanges.split("-")[0]) // Lower bound
                                                        ]
                                                    },
                                                    {
                                                        $lte: [
                                                            {
                                                                $convert: {
                                                                    input: { $arrayElemAt: [{ $split: ["$$age.age", "-"] }, 1] },
                                                                    to: "int",
                                                                    onError: 0,
                                                                    onNull: 0
                                                                }
                                                            },
                                                            parseInt(result.ageRanges.split("-")[result.ageRanges.split("-").length - 1]) // Upper bound
                                                        ]
                                                    }
                                                ]
                                            }

                                        }
                                    },
                                    as: "filteredAge",
                                    in: "$$filteredAge.value"
                                }
                            }
                        },
                        result.ageValue
                    ]
                }
            };
            query.$and.push(ageQuery);

        }


        const foundInfluencers = await influencer.find(query);
        // console.log(foundInfluencers.length);

        const results = await Promise.all(
            foundInfluencers.map(async (influencer) => {
                try {
                    // Fetch public Instagram data
                    const response = await axios({
                        method: "get",
                        url: `https://i.instagram.com/api/v1/users/web_profile_info`,
                        params: { username: influencer.user_name },
                        headers,
                    });

                    const data = response.data;
                    // console.log({data});


                    // Extract recent posts
                    const posts = data.data.user.edge_owner_to_timeline_media.edges;

                    // Calculate average likes and views
                    const totalLikes = posts.reduce((sum, post) => sum + post.node.edge_liked_by.count, 0);
                    const totalViews = posts.reduce((sum, post) => sum + (post.node.video_view_count || 0), 0);
                    const totalComments = posts.reduce((sum, post) => sum + post.node.edge_media_to_comment.count, 0);
                    const avgLikes = posts.length > 0 ? totalLikes / posts.length : 0;
                    const avgViews = posts.length > 0 ? totalViews / posts.length : 0;
                    const avgComments = posts.length > 0 ? totalComments / posts.length : 0;
                    const avgEngagement = (avgLikes + avgViews + avgComments) / influencer.instagramData.followers;
                    const image = data.data.user.profile_pic_url;

                    return {
                        ...influencer.toObject(),
                        image,
                        instagramData: {
                            ...influencer.instagramData,
                            averageLikes: Math.round(avgLikes),
                            averageViews: Math.round(avgViews),
                            averageComments: Math.round(avgComments),
                            averageEngagement: avgEngagement.toFixed(2),
                        },
                    };

                } catch (error) {
                    console.error(`Error fetching data for ${influencer.user_name}:`, error.message);
                    return influencer.toObject();
                }
            })
        );

        // return results;
        return res.json({
            result,
            data: results,
            // data: foundInfluencers,
        })
    } catch (error) {
        console.error('Error fetching OpenAI response:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
})

app.post("/influencer", async (req, res) => {
    await influencer.create({
        name: "Star anonymous"
    })
    res.send("influencer created")
})

app.get("/details", async (req, res) => {
    const { userName } = req.query;

    try {
        // Fetch influencer details from the database
        let influencerDetails = await influencer.findOne({ user_name: userName });

        if (!influencerDetails) {
            return res.status(404).json({
                success: false,
                message: "Influencer not found",
            });
        }

        // Fetch additional data from Instagram API
        const result = await axios({
            method: "get",
            url: `https://i.instagram.com/api/v1/users/web_profile_info`,
            params: { username: userName },
            headers,
        });
        const posts = result.data.data.user.edge_owner_to_timeline_media.edges;

        // Calculate average likes and views
        const totalLikes = posts.reduce((sum, post) => sum + post.node.edge_liked_by.count, 0);
        const totalViews = posts.reduce((sum, post) => sum + (post.node.video_view_count || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + post.node.edge_media_to_comment.count, 0);
        const avgLikes = posts.length > 0 ? totalLikes / posts.length : 0;
        const avgViews = posts.length > 0 ? totalViews / posts.length : 0;
        const avgComments = posts.length > 0 ? totalComments / posts.length : 0;
        const avgEngagement = (avgLikes + avgViews + avgComments) / influencerDetails.instagramData.followers;

        // Add additional details dynamically
        const instagramData = result.data.data.user;
        influencerDetails = {
            ...influencerDetails._doc, // Spread the existing details from the database
            image: instagramData?.profile_pic_url,
            name: instagramData?.full_name,
            userCount: instagramData?.edge_followed_by.count,
            instagramData: {
                ...influencerDetails.instagramData,
                avgLikes,
                avgViews,
                avgComments,
                avgEngagement,
            }
        };

        return res.status(200).json({
            success: true,
            data: influencerDetails,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error?.message || "Internal server error",
        });
    }
});


app.listen(PORT, () => {
    console.log("Server is running on ", PORT);
})
