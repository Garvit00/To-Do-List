require('dotenv').config();
const express = require("express")
const bodyparser = require("body-parser")
const mongoose = require("mongoose")
const _ = require("lodash")
const app = express();
app.use(bodyparser.urlencoded({extended:true}))
app.use(express.static("public"))
app.set("view engine","ejs")

const port = process.env.PORT;
const dbURL = process.env.MONGO_URI;


mongoose.connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: false // Make sure this is set appropriately
})
const itemSchema = {
    name: String
}
const Item = mongoose.model("item",itemSchema);

const item1 = new Item({
    name: "welcome to todolist"
});
const item2 = new Item({
    name: "hit + button to add new item"
})

const item3 = new Item({
    name : "<-- hit this to delete an item"
})
const defaultitems = [item1,item2,item3];

const listSchema = {
    name: String,
    items: [itemSchema]
}
const List = mongoose.model("List",listSchema)


app.get("/",function(req,res){

    Item.find()
    .then(founditems=>{
        if(founditems.length === 0){
            Item.insertMany(defaultitems)
            .then(()=>{
            // console.log("successfully added default items");
            })
            .catch(err =>{
            console.log(err);
            })
        res.redirect("/")
        }
        else{
            res.render("lists",{kindofday:"Today", items:founditems})
        }
    })
    .catch(err =>{
        console.log(err);
    })
})


app.get("/:customelistname",function(req,res){
    const customelistname = _.capitalize(req.params.customelistname);
    List.findOne({name:customelistname})
.then(foundlist=>{
    if(!foundlist){
        //create new list
        const list = new List({
            name: customelistname,
            items: defaultitems
        })
        list.save()
        res.redirect("/" + customelistname)
    }
    else{
        //show exiting list
        res.render("lists",{kindofday:foundlist.name, items:foundlist.items})
    }
})
.catch(err =>{
    console.Console.log(err)
})
})

app.post("/",function(req,res){
    const todoitem = req.body.newitem
    const listname = req.body.list

    const item = new Item({
        name: todoitem
    })
    if(listname === "Today" )
    {
        item.save()
        .then(() => res.redirect("/"))
        .catch(err => console.error('Error saving item:', err));

    } else{
       List.findOne({name:listname})
        .then(foundlist =>{
            if(foundlist){
            foundlist.items.push(item)
            return foundlist.save();
            } else {
                console.error(`List with name ${listname} not found.`);
                res.status(404).send('List not found');
            }
        })
        .then(() => res.redirect("/" + listname))
        .catch(err => console.error('Error finding or saving list:', err));
    }
});

app.post("/delete",function(req,res){
    const deleteitem = req.body.checkbox
    const listName = req.body.listName

    if(listName === "Today"){
    Item.findByIdAndDelete(deleteitem)
    .then(()=> {
        // console.log("successfully deleted!");
    })
    .catch(err => {
        console.log(err);
    })
    res.redirect("/")
    } else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:deleteitem}}})
        .then(() =>{
            res.redirect("/" + listName)
        })
    }
    
})

app.listen(port,function(){
    console.log("server is running at port 3000");
})
