import multer from "multer";

const storage = multer.diskStorage({})

export const upload = multer({storage}) //this will parse the images sent in request , and add the images with the prop called files
 