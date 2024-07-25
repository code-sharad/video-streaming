const express = require("express")
const cors = require("cors")
const multer = require("multer")
const uuidv4  = require("uuid").v4
const path = require("path")
const fs = require("fs")
const {exec} = require("child_process") // watch out
const { stderr, stdout } = require("process")

const app = express()

const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, "./uploads")
  },
  filename: function(req, file, cb){
    cb(null, file.fieldname + "-" + uuidv4() + path.extname(file.originalname))
  }
})

const upload = multer({storage: storage})


app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true
  })
)

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*") // watch it
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next()
})

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use("/uploads", express.static("uploads"))

app.get('/', function(req, res){
  res.json({message: "Hello World"})
})

// console.log(__dirname)
app.post("/upload", upload.single('file'), function(req, res){
  const lessonId = uuidv4()
  const videoPath = req.file.path
  const outputPath = `./uploads/courses/${lessonId}/`
  const hlsPath = `${outputPath}/index.m3u8`
  console.log("hlsPath", hlsPath)
  console.log(outputPath)
  const directoryPath = path.join(outputPath);

  if (!fs.existsSync(outputPath)) {

    fs.mkdirSync(outputPath, {recursive: true})
    
  }

   
  
  const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;
  // no queue because of POC, not to be used in production

    
  
  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`exec error: ${error}`)
    }
    console.log(`stdout: ${stdout}`)
    console.log(`stderr: ${stderr}`)
    const videoUrl = `http://localhost:8080/uploads/courses/${lessonId}/index.m3u8`;
    fs.readdir(directoryPath, function (err, files) {
      //handling error
      if (err) {
          return console.log('Unable to scan directory: ' + err);
      } 
      //listing all files using forEach
      files.forEach(function (file) {
          // Do whatever you want to do with the file
          console.log(file); 
      });
  });
    res.json({
      message: "Video converted to HLS format",
      videoUrl: videoUrl,
      lessonId: lessonId
    })
  })

})

app.listen(8080, function(){
  console.log("App is listening at port 8080...")
})