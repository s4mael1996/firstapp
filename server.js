const express = require('express');
const bodyParser= require('body-parser');
const app = express();
const cors = require('cors');
const crypto = require("crypto");
const path = require("path");
const mongoose = require('mongoose');
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream")
app.use(express.static(path.join(__dirname, 'build')));

if(process.env.NODE_ENV === 'production') {
  app.get('/*', function (req, res) {
   	res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}
app.use(cors())
app.use(bodyParser.json())
mongoose.set('useFindAndModify',false);
app.set("view engine", "ejs");
const uri = "mongodb+srv://s3695304:nhat1996@cluster0-8nx7m.mongodb.net/projectManagement?retryWrites=true&w=majority";
//const MongoClient = require('mongodb').MongoClient;
//const client = new MongoClient(uri, { useNewUrlParser: true , useUnifiedTopology: true });
let conn = mongoose.createConnection(uri,{useNewUrlParser: true,useUnifiedTopology: true});

// Init gfs
let gfs;

conn.once('open',()=>{
  gfs = Grid(conn.db, mongoose.mongo)
  gfs.collection('uploads')
  console.log('Connection Successful')
  });

// create storage
const storage = new GridFsStorage({
  url:uri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});


const upload = multer({ 
  storage
}); 

//Upload file
app.post('/upload', upload.array('img'), (req, res, err) => {
  res.send({file: req.files})
})

app.get('/images', (req, res) => {
  let images ;
  gfs.files.find({}, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists',
      })
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename)
      readstream.on('data', (chunk) => {
        images.append(chunk.toString('base64'))
        
      })
    } else {
      res.status(404).json({
        err: 'Not an image',
      })
    }
  })
  res.send(images);
  });


var ProjectSchema = new mongoose.Schema({
        pID: String,
        sID:String,
        sName:String,
        sYear:Number,
        cID:String,
        cName:String,
        aName:String,
        percentage:Number,
        aDescription:String,
        techUsed:String,
        application:String,
        scope:String,
        description:String,
        photo:String,
        semester:String, 
        
})

var Project = conn.model('projects',ProjectSchema)
app.get('/',function (req,res){
  Project.find({}, function(err, projects){
    res.send(projects)
    
})

      
})
app.get('/projects/:id',(req,res) =>{
    
const {id}=req.params;
  Project.find({pID:id},(err,project)=>{
    res.send(project)
  })
        
      
})
/*
app.post('/:pID/upload',(req,res) =>{
client.once("open", () => {
  // init stream
let gfs = mongodb.GridFSBucket(client.db('photos'), {
    bucketName: "uploads"
  });
});
}) */
app.post('/add/:pID',(req,res) =>{
    const {pID,sID,sName,cID,cName,photo,aName,percentage,aDescription,techUsed,application,scope,description,sYear,semester} = req.body;
    var newProject = new Project({
      pID:pID,
            sID:sID,
            sName:sName,
            sYear:sYear,
            cID:cID,
            cName:cName,
            photo:photo,
            percentage:percentage,
            semester:semester,
            techUsed:techUsed,
            aName: aName,
            aDescription:aDescription,
            description:description,
            scope:scope,
            application: application
    })    
    newProject.save(function (err) {
      if (err) return handleError(err);
      // saved!
      
    });
      res.send('addSuccess')
    
   // res.json.stringify(database.project[database.project.length-1])
})

app.put('/update/:pID',(req,res)=>{
    
    const {sID,sName,cID,cName,photo,aName,percentage,aDescription,techUsed,application,scope,description,sYear,semester} = req.body;
    
        Project.findOneAndUpdate({pID:req.params.pID},{
            sID:sID,
            sName:sName,
            sYear:sYear,
            cID:cID,
            cName:cName,
            photo:photo,
            percentage:percentage,
            semester:semester,
            techUsed:techUsed,
            aName: aName,
            aDescription:aDescription,
            description:description,
            scope:scope,
            application: application
        },function (err) {
          if(err) console.log(err);
          console.log("Successful update");
        });
        res.send('updated')
})


app.delete('/delete',(req,res)=>{
  
    Project.findOneAndRemove({pID:req.body.pID},function (err) {
      if(err) console.log(err);
      console.log("Successful deletion");
    })
    res.send('deleted')
})
app.listen(3000)