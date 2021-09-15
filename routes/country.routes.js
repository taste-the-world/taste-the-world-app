/* 
TODO: ADD ROUTES FOR LIST, DETAIL, CREATE, UPDATE AND DELETE
 */

// starter code in both routes/countries.routes.js and routes/countries.routes.js
const router = require("express").Router();
const Yummly = require("../clients/yummly");

const Country = require("../models/Country.model");

// create country form
router.get("/create", (req, res) => {
  res.render("countries/edit-country", {
    action: "/countries/",
    title: "Add New Country",
    submit: "Create",
  });
});

// gets 1 country
router.get("/:id", (req, res) => {
  Country.findById(req.params.id)
    .populate("created_by")
    .populate("updated_by")
    .then(async (country) => {
      // Retrieve an access token
      let playlist;
      try {
        const data = await req.app.spotifyApi.clientCredentialsGrant();
        req.app.spotifyApi.setAccessToken(data.body["access_token"]);
        try {
          playlist = await req.app.spotifyApi.getPlaylist(country.playlistId);
          playlist = playlist.body;
        } catch (error) {
          playlist = undefined;
          console.error("The error while fetching playlist occurred:", error);
        }
      } catch (error) {
        console.error(
          "Something went wrong when retrieving an access token",
          error
        );
      }
      const yummly = new Yummly();
      let recipe;
      try {
        recipe = await yummly.search(country.dishName);
      } catch (error) {
        console.error("The error while fetching recipe occurred:", error);
      }
      let drink;
      try {
        drink = await yummly.search(country.drinkName);
      } catch (error) {
        console.error("The error while fetching playlist occurred:", error);
      }
      res.render("countries/country-details", {
        country,
        recipe,
        drink,
        playlist: playlist,
      });
    })
    .catch((error) => console.log(error));
});

// deletes country
router.get("/:id/delete", (req, res) => {
  Country.findByIdAndDelete(req.params.id)
    .then((deletedCountry) => res.redirect("/countries"))
    .catch((error) => console.log(error));
});

// finds all countries
router.get("/", (req, res) => {
  Country.find().then((allCountries) => {
    res.render("countries/countries", { allCountries });
  });
});

// gets a random country
router.get("/-/show-me-a-random-country", (req, res) => {
  Country.find()
    .then((allCountries) => {
      // TODO: Not sure this works with Mongoose
      const randomCountry =
        allCountries[Math.floor(Math.random() * allCountries.length)];
      res.redirect(`/countries/${randomCountry._id}`);
    })
    .catch((error) => console.log(error));
});

// creates a country NEEDS TO CHANGE TO SUPPORT RECIPES
router.post("/", (req, res) => {
  const { name, description, playlistId, dishName, drinkName, imageUrl } = req.body;
  Country.create({
    name,
    description,
    dishName,
    drinkName,
    imageUrl,
    playlistId: playlistId.replace("https://open.spotify.com/playlist/", ""),
    created_by: req.session.currentUser._id,
    updated_by: req.session.currentUser._id,
  })
    .then((newCountry) => res.redirect("/countries/"))
    .catch((error) => console.log(error));
});

router
  .route("/:id/edit")
  .get((req, res) => {
    Country.findById(req.params.id)
      .then((country) => {
        res.render("countries/edit-country", {
          country,
          action: `/countries/${country._id}/edit`,
          title: "Update Country",
          submit: "Update",
        });
      })
      .catch((error) => console.log(error));
  })
  .post((req, res) => {
    const { name, description, playlistId, dishName, drinkName, imageUrl } = req.body;
    Country.findByIdAndUpdate(req.params.id, {
      name,
      description,
      dishName,
      drinkName,
      imageUrl,
      playlistId: playlistId.replace("https://open.spotify.com/playlist/", ""),
      updated_by: req.session.currentUser,
    })
      .then((updateCountry) => res.redirect(`/countries/${req.params.id}`))
      .catch((error) => console.log(error));
  });

module.exports = router;
