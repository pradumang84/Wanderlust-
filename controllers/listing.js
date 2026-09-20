const listing = require("../models/listing");
const ExpressError = require("../utils/Expresserror");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({
    accessToken: mapToken
});

// ================= INDEX =================

module.exports.index = async (req, res) => {
    const alllisting = await listing.find({});

    res.render("listing/index.ejs", {
        alllisting
    });
};


// ================= NEW FORM =================

module.exports.renderNewForm = (req, res) => {
    res.render("listing/new.ejs");
};


// ================= CREATE LISTING =================

module.exports.createListing = async (req, res, next) => {

    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    }).send();

    console.log("LOCATION:", req.body.listing.location);
    console.log("MAPBOX RESPONSE:", response.body.features[0]);

    let {
        title,
        description,
        price,
        country,
        location
    } = req.body.listing;

    const newlisting = new listing({
        title,
        description,

        image: {
            filename: req.file.filename,
            url: req.file.path
        },

        price,
        country,
        location
    });

    newlisting.owner = req.user._id;

    newlisting.geometry = {
        type: "Point",
        coordinates: response.body.features[0].geometry.coordinates
    };

    console.log("GEOMETRY BEFORE SAVE:", newlisting.geometry);

    await newlisting.save();

    req.flash("success", "New listing created");

    res.redirect("/listing");
};


// ================= SHOW LISTING =================

module.exports.showListing = async (req, res) => {

    let { id } = req.params;

    const FListing = await listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        })
        .populate("owner");

    if (!FListing) {
        req.flash(
            "error",
            "Listing Does Not Exist!!"
        );

        return res.redirect("/listing");
    }

    // Fix old listings having empty coordinates
    if (
        !FListing.geometry ||
        !FListing.geometry.coordinates ||
        FListing.geometry.coordinates.length === 0
    ) {

        let response = await geocodingClient.forwardGeocode({
            query: FListing.location,
            limit: 1
        }).send();

        if (response.body.features.length > 0) {

            FListing.geometry = {
                type: "Point",
                coordinates: response.body.features[0].geometry.coordinates
            };

            await FListing.save();
        }
    }

    res.render("listing/show.ejs", {
        FListing
    });
};


// ================= EDIT FORM =================

module.exports.editListing = async (req, res) => {

    let { id } = req.params;

    const FListing = await listing.findById(id);

    if (!FListing) {
        req.flash(
            "error",
            "Listing Does Not Exist!!"
        );

        return res.redirect("/listing");
    }

    return res.render("listing/edit.ejs", {
        FListing
    });
};


// ================= UPDATE LISTING =================

module.exports.updateListing = async (req, res) => {

    if (!req.body.listing) {
        throw new ExpressError(
            400,
            "Send valid data for listing"
        );
    }

    let { id } = req.params;

    let updatedListing = await listing.findByIdAndUpdate(
        id,
        {
            ...req.body.listing
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (req.file) {

        let url = req.file.path;
        let filename = req.file.filename;

        updatedListing.image = {
            url,
            filename
        };

        await updatedListing.save();
    }

    req.flash(
        "success",
        "Listing Updated!!"
    );

    res.redirect(`/listing/${id}`);
};


// ================= DELETE LISTING =================

module.exports.deleteListing = async (req, res) => {

    let { id } = req.params;

    await listing.findByIdAndDelete(id);

    req.flash(
        "success",
        "Listing Deleted!!"
    );

    res.redirect("/listing");
};