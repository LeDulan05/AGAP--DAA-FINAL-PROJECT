const express = require('express');
const router = express.Router();
const {FamilyTable} = require('../models/');

//Get all families
router.get("/", async(req,res) =>{
    const familyList = await FamilyTable.findAll();
    res.json(familyList);
});

//Posts new family record
router.post("/", async (req,res) =>{
    const familyTable = req.body;
    console.log('Received family data:', familyTable);

    const createdFamily = await FamilyTable.create(familyTable);
    res.json(createdFamily);
})


module.exports = router