const mongoose=require("mongoose");
const initdata=require("./data");
const listing=require("../models/listing.js");
main().then((res)=>{
    console.log("connection succesfull");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/Wanderlust');
}
const initdb=async()=>{
    await listing.deleteMany({});
    initdata.data=initdata.data.map((obj)=>({...obj,owner:"6a5478718ec31a3ea00fe055"}));
    await listing.insertMany(initdata.data);
    console.log("data was initialized");
}
initdb();
listing.deleteMany({ price: null })
.then((res) => {
    console.log(res);
})
.catch((err) => {
    console.log(err);
});