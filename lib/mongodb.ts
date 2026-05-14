import dbConnect from "./db";

export async function connectToDatabase() {
    return await dbConnect();
}
