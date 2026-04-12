const { v2: cloudinary } = require("cloudinary");
const url = "https://res.cloudinary.com/test/image/upload/v123/astronix/test.jpg";
let afterUpload = url.slice(url.indexOf("/upload/") + 8);
afterUpload = afterUpload.replace(/^v\d+\//, "");
afterUpload = afterUpload.replace(/\.[^/.]+$/, "");
console.log(afterUpload);
