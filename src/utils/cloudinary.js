import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        
        if(!localFilePath) new Error("Couldn't find path");

        // upload file on cloudinary 
       let res = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        // file has been uploaded successfully
        // //console.log("File is uploaded on cloudinary", res.url);
        fs.unlinkSync(localFilePath) // remove the locally Saved Temprory File as the upload operation got failed
        return res
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally Saved Temprory File as the upload operation got failed
        return null
    }
}


export {uploadOnCloudinary}