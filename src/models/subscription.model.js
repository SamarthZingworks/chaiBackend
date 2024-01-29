import { Schema, mongoose } from "mongoose";

const subscriptionScheme = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whom subscribing
        ref: "User"
    }
},
    {
        timestamps: true
    }
)


export const Subscription = mongoose.model("Subscription", subscriptionScheme)