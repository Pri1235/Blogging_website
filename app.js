if(process.env.NODE_ENV !=="production"){
    require('dotenv').config();
}


const express = require('express');
const path = require('path');
const Blog = require('./models/blog')
const mongoose = require('mongoose');
const methodOverride = require('method-override');//for put patch delete
const ejsMate = require('ejs-mate');
const multer = require('multer');
const {storage} = require('./cloudinary')
const upload = multer({storage});
const cloudinary = require('cloudinary').v2;

mongoose.connect('mongodb://localhost:27017/my-blog',{
    useNewUrlParser: true
})

const db = mongoose.connection;
db.on("error",console.error.bind(console,"connection error"));
db.once("open",()=>{
    console.log('database connected');
})

const app = express();

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'))
app.use(express.static(path.join(__dirname, 'public')))
app.engine('ejs',ejsMate);
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));

app.get('/',(req,res)=>{
    res.render('home');
})

app.get('/blogs',async(req,res)=>{
    const blogs = await Blog.find({});
    res.render('blogs/index',{blogs})
})
app.get('/makeblog',async(req,res)=>{
    const blog = new Blog({title:'adding image attempt',description:'trying !'})
    await blog.save();
    res.send(blog)
})
app.get('/blogs/new',(req,res)=>{
    res.render('blogs/new')
})
app.post('/blogs',upload.array('image'),async(req,res)=>{
   
   const blog  = new Blog(req.body.blog);
   blog.image = req.files.map(f => ({url:f.path,filename:f.filename}));
  

   await blog.save();
   
   res.redirect('/blogs')
})
app.get('/blogs/:id',async(req,res)=>{
    const blog = await Blog.findById(req.params.id)
    res.render('blogs/show',{blog})
})
app.get('/blogs/:id/edit',upload.array('image'),async(req,res)=>{
    const blog = await Blog.findById(req.params.id);
   
    res.render('blogs/edit',{blog})
})
app.put('/blogs/:id',upload.array('image'),async(req,res)=>{
    const {id}= req.params;
   const blog= await Blog.findByIdAndUpdate(id,{... req.body.blog})
   const imgs = req.files.map(f => ({url:f.path,filename:f.filename}))
   blog.image.push(...imgs);
   await blog.save()
   if(req.body.deleteImages){
    for(let filename of req.body.deleteImages){
     await cloudinary.uploader.destroy(filename);
    }
    await blog.updateOne({$pull:{image:{filename:{$in:req.body.deleteImages}}}})
    console.log(blog)
   }
   res.redirect(`/blogs/${blog._id}`)
})
app.delete('/blogs/:id',async(req,res)=>{
    const{id}=req.params;
    await Blog.findByIdAndDelete(id);
    res.redirect('/blogs');
})

app.listen(3000,()=>{
    console.log("listening on port 3000");
})