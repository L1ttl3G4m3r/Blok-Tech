require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const xss = require("xss");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");
const fetch = require("node-fetch");
const multer = require("multer");
const path = require("path");

const app = express();
const port = process.env.PORT || 9000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Controleer of de upload een profielfoto is en sla deze op in de juiste map
    if (file.fieldname === "photo") {
      cb(null, "profile-photos/"); // Profielfoto's gaan naar de 'profile-photos/' map
    } else {
      cb(null, "uploads/"); // Andere bestanden gaan naar de 'uploads/' map
    }
  },
  filename: (req, file, cb) => {
    // Gebruik een unieke naam voor elk bestand, gebaseerd op de timestamp
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs").set("views", "views");
app.use("/uploads", express.static("uploads"));
app.use("/profile-photos", express.static("profile-photos"));
app.use("/static", express.static("static"));
app.use(cors());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.URI,
      dbName: process.env.DB_NAME,
      collectionName: "sessions",
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Database Connection
const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db(process.env.DB_NAME);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to database");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
}

connectToDatabase();

// Authentication Middleware
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect("/log-in");
}

// Helper Functions
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function fetchUnsplashImages(query, count = 30, sortBy = "relevant") {
  try {
    const unsplashApiKey = process.env.UNSPLASH_API_KEY;
    let apiUrl = `https://api.unsplash.com/search/photos?query=${query}&per_page=${count}&orientation=landscape`;

    if (sortBy !== "relevant") {
      apiUrl += `&order_by=${sortBy}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Client-ID ${unsplashApiKey}`,
        "Accept-Version": "v1",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Unsplash API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    const imageUrls = data.results.map((image) => ({
      url: image.urls.regular,
      width: image.width,
      height: image.height,
      alt_description: image.alt_description || "",
    }));

    return imageUrls;
  } catch (error) {
    console.error("Error fetching Unsplash images:", error);
    return [];
  }
}

// Routes
app.get("/", async (req, res) => {
  try {
    const imageUrls = await fetchUnsplashImages("tattoo", 30, "relevant");
    res.render("begin.ejs", {
      imageUrls: imageUrls,
      currentSort: "relevant",
      pageTitle: "Home",
    });
  } catch (error) {
    console.error("Error in home route:", error);
    res
      .status(500)
      .send("Er is een fout opgetreden bij het laden van de startpagina");
  }
});

app.get("/index", isAuthenticated, async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const currentSort = req.query.sort_by || "relevant";
    const usersCollection = db.collection("users");
    const artistsCollection = db.collection("artists");
    const userPreferences = req.session?.userPreferences || {};
    const isArtist = req.session?.user?.isArtist || false;

    if (!db) throw new Error("Database connection is not established");

    let user = null;
    let collectionName = "users";

    try {
      user = await usersCollection.findOne({
        _id: new ObjectId(req.session.userId),
      });
    } catch (error) {
      console.log("Error fetching user from users collection:", error);
    }

    if (!user) {
      try {
        user = await artistsCollection.findOne({
          _id: new ObjectId(req.session.userId),
        });
        collectionName = "artists";
      } catch (error) {
        console.log("Error fetching user from artists collection:", error);
      }
    }

    if (!user) throw new Error("User not found");

    const postsCollection = db.collection("posts");

    // Haal de query parameters van de filters en zoekterm
    const query = req.query.q || ""; // Zoekterm uit de query
    const styles = req.query.styles ? req.query.styles.split(",") : [];
    const colors = req.query.colors || "";
    const tattooPlek = req.query.tattooPlek || "";
    const woonplaats = req.query.woonplaats || "";

    console.log("Query parameters:", {
      query,
      styles,
      colors,
      tattooPlek,
      woonplaats,
    });

    let searchQuery = query ? query : "tattoo";

    if (styles.length > 0) {
      const styleQueries = styles.map((style) => {
        switch (style) {
          case "classic":
            return "classic tattoo";
          case "realistic":
            return "realistic tattoo";
          case "modern":
            return "modern tattoo";
          case "minimalistic":
            return "minimalistic tattoo";
          case "cultural":
            return "cultural tattoo";
          case "cartoon":
            return "cartoon tattoo";
          case "old":
            return "old tattoo";
          default:
            return "tattoo";
        }
      });
      searchQuery += ` ${styleQueries.join(" ")}`;
    }

    // Voeg kleur toe aan de zoekopdracht
    if (colors === "black_and_white") {
      searchQuery += " black and white tattoo";
    } else if (colors === "color") {
      searchQuery += " colorful tattoo";
    }

    // Voeg tattooPlek en woonplaats toe aan de zoekopdracht
    if (tattooPlek) {
      searchQuery += ` ${tattooPlek} tattoo`;
    }
    if (woonplaats) {
      searchQuery += ` ${woonplaats}`;
    }

    console.log("Unsplash query:", searchQuery);

    // Haal Unsplash afbeeldingen op
    const imageUrls = await fetchUnsplashImages(searchQuery, 28, currentSort);
    console.log("Fetched Unsplash images:", imageUrls);

    // Haal de posts op uit de database en filter ze op stijl
    let filteredPosts = await postsCollection.find().toArray();
    if (user?.tattooStijl) {
      filteredPosts = filteredPosts.filter((post) =>
        user.tattooStijl.includes(post.style)
      );
    }

    console.log("Filtered posts:", filteredPosts);

    // Render de pagina met de juiste data
    res.render("index.ejs", {
      pageTitle: query ? `Zoekresultaten voor "${query}"` : "Home", // Als er een zoekterm is, geef een aangepaste titel
      username: req.session.username,
      gridImages: imageUrls, // Hier stuur je de Unsplash afbeeldingen naar de client
      user,
      currentSort,
      isArtist: req.session.isArtist,
      posts: filteredPosts,
      userPreferences: user || {},
      styles,
      colors,
      tattooPlek,
      woonplaats,
    });
  } catch (error) {
    console.error("Error loading index page:", error);
    res.status(500).send("Er is een fout opgetreden.");
  }
});

app.post("/index", isAuthenticated, async (req, res) => {
  try {
    const { tattooStijl, tattooKleur, tattooPlek, woonplaats } = req.body;

    const queryParams = [
      `styles=${tattooStijl ? tattooStijl.join(",") : ""}`,
      `colors=${tattooKleur || ""}`,
      `tattooPlek=${tattooPlek || ""}`,
      `woonplaats=${woonplaats || ""}`,
    ].join("&");

    console.log("Redirecting with query params:", queryParams);
    res.redirect(`/index?${queryParams}`);
  } catch (error) {
    console.error("Error processing form data:", error);
    res
      .status(500)
      .send("Er is een fout opgetreden bij het verwerken van de gegevens");
  }
});

app.get("/register", (req, res) =>
  res.render("register.ejs", { pageTitle: "Registreren" })
);

app.post("/register", async (req, res) => {
  try {
    const collection = db.collection("users");
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).send("Alle velden zijn verplicht");
    }

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return res.status(400).send("Ongeldig formulierformaat");
    }

    if (!validator.isEmail(email)) {
      return res.status(400).send("Ongeldig e-mailadres");
    }

    if (!validator.isLength(password, { min: 8 })) {
      return res
        .status(400)
        .send("Wachtwoord moet minimaal 8 tekens lang zijn");
    }

    if (password !== confirmPassword) {
      return res.status(400).send("Wachtwoorden komen niet overeen");
    }

    const existingUser = await collection.findOne({ email: email });
    if (existingUser) {
      return res.status(400).send("Dit e-mailadres is al in gebruik");
    }

    const hashedPassword = await hashPassword(password);
    const sanitizedUsername = xss(username);
    const newUser = {
      username: sanitizedUsername.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    };

    const result = await collection.insertOne(newUser);

    req.session.userId = result.insertedId.toString();
    req.session.username = sanitizedUsername;
    req.session.email = email;

    return res.redirect("/index");
  } catch (error) {
    console.error("Registratiefout:", error);
    res.status(500).render("error.ejs", {
      message: "Registratiefout",
      error: error.message,
    });
  }
});

app.get("/registerArtists", (req, res) => {
  res.render("registerArtists.ejs", {
    pageTitle: "Registreer artiest",
    mapboxToken: process.env.MAPBOX_TOKEN,
  });
});

app.post("/registerArtists", async (req, res) => {
  try {
    const collection = db.collection("artists");
    const {
      username,
      email,
      password,
      confirmPassword,
      studioName,
      studioAddress,
      studioLat,
      studioLng,
    } = req.body;

    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !studioName ||
      !studioAddress ||
      !studioLat ||
      !studioLng
    ) {
      return res.status(400).send("Alle velden zijn verplicht");
    }

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string" ||
      typeof studioName !== "string" ||
      typeof studioAddress !== "string" ||
      typeof studioLat !== "string" ||
      typeof studioLng !== "string"
    ) {
      return res.status(400).send("Ongeldig formulierformaat");
    }

    if (!validator.isEmail(email)) {
      return res.status(400).send("Ongeldig e-mailadres");
    }

    if (!validator.isLength(password, { min: 8 })) {
      return res
        .status(400)
        .send("Wachtwoord moet minimaal 8 tekens lang zijn");
    }

    if (password !== confirmPassword) {
      return res.status(400).send("Wachtwoorden komen niet overeen");
    }

    const existingUser = await collection.findOne({ email: email });
    if (existingUser) {
      return res.status(400).send("Dit e-mailadres is al in gebruik");
    }

    const hashedPassword = await hashPassword(password);

    const sanitizedUsername = xss(username);
    const sanitizedStudioName = xss(studioName);
    const sanitizedStudioAddress = xss(studioAddress);

    const newArtist = {
      username: sanitizedUsername.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      studioName: sanitizedStudioName.trim(),
      studioAddress: sanitizedStudioAddress.trim(),
      studioLocation: {
        type: "Point",
        coordinates: [parseFloat(studioLng), parseFloat(studioLat)],
      },
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newArtist);

    req.session.userId = result.insertedId.toString();
    req.session.username = sanitizedUsername;
    req.session.email = email;
    req.session.isArtist = true;

    return res.redirect("/index");
  } catch (error) {
    console.error("Registratiefout:", error);
    res.status(500).render("error.ejs", {
      message: "Er is een fout opgetreden bij de registratie",
      error: error.message,
    });
  }
});

app.get("/log-in", (req, res) =>
  res.render("log-in.ejs", { pageTitle: "Inloggen" })
);

app.post("/log-in", async (req, res) => {
  try {
    const { email, password } = req.body;

    const usersCollection = db.collection("users");
    const artistsCollection = db.collection("artists");

    let user = await usersCollection.findOne({ email });
    let isArtist = false;

    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.userId = user._id.toString();
      req.session.username = user.username;
      req.session.email = user.email;
      req.session.isArtist = false;
      return res.redirect("/index");
    }

    user = await artistsCollection.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.userId = user._id.toString();
      req.session.username = user.username;
      req.session.email = user.email;
      req.session.isArtist = true;
      return res.redirect("/index");
    }

    return res.status(400).send("Incorrect e-mail of wachtwoord");
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Er is een fout opgetreden bij het inloggen");
  }
});

app.post(
  "/submit-post",
  isAuthenticated,
  upload.single("photo"),
  async (req, res) => {
    try {
      const collection = db.collection("posts");
      const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

      if (
        !req.body.description ||
        !req.body.studioName ||
        !req.body.studioAddress
      ) {
        return res.status(400).json({
          success: false,
          message: "Beschrijving, studionaam en adres zijn verplicht.",
        });
      }

      let tags = [];
      try {
        tags = req.body.tags ? req.body.tags.split(",") : [];
        tags = tags.map((tag) => tag.trim()).filter((tag) => tag !== "");
      } catch (error) {
        console.error("Fout bij het verwerken van tags:", error);
        return res
          .status(400)
          .json({ success: false, message: "Ongeldige tags format." });
      }

      const newPost = {
        description: xss(req.body.description),
        tags: tags.map((tag) => xss(tag)),
        studio: {
          name: xss(req.body.studioName),
          address: xss(req.body.studioAddress),
          lat: parseFloat(req.body.studioLat),
          lng: parseFloat(req.body.studioLng),
        },
        photo: photoPath,
        createdAt: new Date(),
        userId: req.session.userId,
      };

      const result = await collection.insertOne(newPost);

      if (result.acknowledged) {
        return res
          .status(200)
          .json({ success: true, message: "Post succesvol toegevoegd" });
      } else {
        console.error("Fout bij het toevoegen van de post aan de database");
        return res.status(500).json({
          success: false,
          message: "Fout bij het toevoegen van de post aan de database",
        });
      }
    } catch (error) {
      console.error("Fout bij het opslaan van de post:", error);
      return res.status(500).json({
        success: false,
        message:
          "Er is een fout opgetreden bij het opslaan van de post: " +
          error.message,
      });
    }
  }
);

app.get("/artiesten", isAuthenticated, async (req, res) => {
  try {
    const collection = db.collection("artists");
    const artists = await collection.find().toArray();
    res.render("artist-search.ejs", {
      pageTitle: "Artiesten",
      artists: artists,
      currentSort: "relevant",
    });
  } catch (error) {
    console.error("Fout bij het ophalen van artiesten:", error);
    res
      .status(500)
      .send("Er is een fout opgetreden bij het laden van de artiestenpagina");
  }
});

app.get("/artiest/:id", isAuthenticated, async (req, res) => {
  try {
    const collection = db.collection("artists");
    const artist = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!artist) {
      return res.status(404).send("Artiest niet gevonden");
    }

    res.render("detailpaginaA.ejs", {
      pageTitle: `Artiest: ${artist.username}`,
      artist: artist,
    });
  } catch (error) {
    console.error("Fout bij het ophalen van artiest details:", error);
    res
      .status(500)
      .send("Er is een fout opgetreden bij het laden van de artiestenpagina");
  }
});

app.get("/questionnaire", isAuthenticated, (req, res) => {
  const styles = req.session.userPreferences
    ? req.session.userPreferences.tattooStijl
    : [];
  const colors = req.session.userPreferences
    ? req.session.userPreferences.tattooKleur
    : "";
  const tattooPlek = req.session.userPreferences
    ? req.session.userPreferences.tattooPlek
    : [];
  const woonplaats = req.session.userPreferences
    ? req.session.userPreferences.woonplaats
    : [];

  res.render("questionnaire.ejs", {
    pageTitle: "Vragenlijst",
    styles: styles,
    colors: colors,
    tattooPlek: tattooPlek,
    woonplaats: woonplaats,
  });
});

app.post("/questionnaire", isAuthenticated, (req, res) => {
  const { tattooStijl, tattooKleur, tattooPlek, woonplaats } = req.body;

  req.session.userPreferences = {
    tattooStijl: Array.isArray(tattooStijl) ? tattooStijl : [tattooStijl],
    tattooKleur: tattooKleur || "",
    tattooPlek: tattooPlek || "",
    woonplaats: woonplaats || "",
  };

  const queryParams = new URLSearchParams({
    styles: req.session.userPreferences.tattooStijl.join(","),
    colors: req.session.userPreferences.tattooKleur,
    tattooPlek: req.session.userPreferences.tattooPlek,
    woonplaats: req.session.userPreferences.woonplaats,
  });

  res.redirect(`/index?${queryParams.toString()}`);
});

app.post("/save-answers", async (req, res) => {
  if (!req.session.userId) {
    console.log("Geen ingelogde gebruiker gevonden in de sessie.");
    return res
      .status(401)
      .send("Je moet ingelogd zijn om je voorkeuren op te slaan.");
  }

  const { tattooStijl, tattooKleur, tattooPlek, woonplaats } = req.body;

  console.log("Antwoorden ontvangen:", req.body);

  try {
    const usersCollection = db.collection("users");
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(req.session.userId) },
      {
        $set: {
          preferences: {
            tattooStijl: Array.isArray(tattooStijl)
              ? tattooStijl
              : [tattooStijl],
            tattooKleur,
            tattooPlek,
            woonplaats,
          },
        },
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log("Gebruiker geüpdatet met voorkeuren:", updateResult);
      res.redirect("/index");
    } else {
      res.status(404).send("Geen gebruiker gevonden om bij te werken.");
    }
  } catch (err) {
    console.error("Fout bij opslaan:", err);
    res
      .status(500)
      .send("Er is een fout opgetreden bij het opslaan van je voorkeuren.");
  }
});

app.get("/tattoos/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const postsCollection = db.collection("posts");
    const categoryPosts = await postsCollection
      .find({ category: category })
      .toArray();

    res.render("category.ejs", {
      pageTitle: `${
        category.charAt(0).toUpperCase() + category.slice(1)
      } Tattoos`,
      posts: categoryPosts,
    });
  } catch (error) {
    console.error("Error fetching category tattoos:", error);
    res
      .status(500)
      .send(
        "Er is een fout opgetreden bij het ophalen van de tattoo categorie."
      );
  }
});

app.get("/carouselDetail", async (req, res) => {
  try {
    const category = req.query.category;
    if (!category) {
      return res.status(400).send("Categorie niet gespecificeerd");
    }

    console.log("Categorie ontvangen:", category);

    const query = `tattoo ${category}`;
    console.log("Fetching images for:", query);

    const imageUrls = await fetchUnsplashImages(query, 30, "relevant");
    console.log("Fetched Unsplash images:", imageUrls.length);

    res.render("carouselDetail.ejs", {
      pageTitle: `${category} Tattoos`,
      category,
      imageUrls,
    });
  } catch (error) {
    console.error("Fout bij laden van de detailpagina:", error);
    res
      .status(500)
      .send("Er is een fout opgetreden bij het laden van de detailpagina.");
  }
});

app.get("/selfmadeDetail", async (req, res) => {
  try {
    // Haal de posts op uit de 'posts' collectie die de zelfgemaakte tatoeages bevatten
    const postsCollection = db.collection("posts");
    const selfmadePosts = await postsCollection.find().toArray();

    // Geef de posts door aan de view
    res.render("selfmadeDetail.ejs", {
      pageTitle: "Zelfgemaakte Tattoo’s",
      posts: selfmadePosts,  // Zorg ervoor dat de posts beschikbaar zijn in de view
    });
  } catch (error) {
    console.error("Error fetching selfmade posts:", error);
    res.status(500).send("Er is een fout opgetreden bij het laden van de zelfgemaakte tattoo’s.");
  }
});

app.get("/detailpagina", async (req, res) => {
  try {
    // Verkrijg de queryparameters
    const img = req.query.img || null;
    const titel = req.query.title || "Geen titel beschikbaar";
    const userId = req.query.userId || null;
    const postId = req.query.postId || null;
    const description = req.query.description || "Geen beschrijving beschikbaar";
    const tags = req.query.tags ? JSON.parse(req.query.tags) : [];

    // Haal de post op uit de database als postId aanwezig is
    const postsCollection = db.collection("posts");
    let post = null;
    if (postId) {
      post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    }

    if (!post) {
      post = { tags: [], description: "Geen beschrijving beschikbaar" };
    }

    // Controleer of de img beschikbaar is en geef de juiste gegevens door
    res.render("detailpagina", {
      img,
      titel,
      pageTitle: "Detailpagina",
      gridImages: await fetchUnsplashImages(30),  // of andere logica voor afbeeldingen
      userId,
      postId,
      description,
      tags
    });
  } catch (error) {
    console.error("Error loading detailpagina:", error);
    res.status(500).send("Er is een fout opgetreden.");
  }
});

app.get("/detail/:id", isAuthenticated, async (req, res) => {
  try {
    const imageId = req.params.id;
    const imageUrls = await fetchUnsplashImages("tattoo", 30, "relevant");
    const selectedImage = imageUrls.find(
      (image, index) => index.toString() === imageId
    );

    if (!selectedImage) {
      return res.status(404).send("Image not found");
    }
    console.log(selectedImage);

    res.render("detailpagina.ejs", {
      pageTitle: "Detailpagina",
      image: selectedImage,
      artist_username: selectedImage.artist_username,
      artist_name: selectedImage.artist_name,
    });
  } catch (error) {
    console.error("Error fetching image details:", error);
    res.status(500).send("An error occurred while loading the image details");
  }
});

app.get("/detailpagina/:id", async (req, res) => {
  try {
    const postsCollection = db.collection("posts");
    const { ObjectId } = require("mongodb");
    const post = await postsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!post) {
      return res.status(404).send("Post niet gevonden");
    }

    res.render("detailpagina.ejs", { post });
  } catch (error) {
    console.error("Error fetching post:", error);
    res
      .status(500)
      .send("Er is een fout opgetreden bij het laden van de detailpagina.");
  }
});

app.get("/search-artists", isAuthenticated, async (req, res) => {
  try {
    const query = req.query.q || "";

    if (!query) {
      return res.json({ artists: [] });
    }

    const collection = db.collection("artists");
    const artists = await collection
      .find({
        username: { $regex: query, $options: "i" },
      })
      .toArray();

    res.json({ artists: artists });
  } catch (error) {
    console.error("Fout bij het zoeken naar artiesten:", error);
    res.status(500).json({
      error: "Er is een fout opgetreden bij het zoeken naar artiesten",
    });
  }
});

app.get("/microinformation", async (req, res) => {
  try {
    const img = req.query.img || null;
    const titel = req.query.titel || "Geen titel beschikbaar";
    const postId = req.query.postId || null;

    // Verbinding met de juiste MongoDB collecties
    const usersCollection = db.collection("users");  // Of "artists" als de gebruiker daar staat
    const postsCollection = db.collection("posts");
    const artistsCollection = db.collection("artists");

    // Functie om te controleren of een string een geldige ObjectId is
    const isValidObjectId = (id) => {
      return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
    }

    let post = null;
    if (postId && isValidObjectId(postId)) {
      // Zoek post op basis van postId
      post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    }

    if (!post) {
      post = { tags: [], description: "Geen beschrijving beschikbaar" };  // Standaardwaarde als post niet wordt gevonden
    }

    // Tags
    const tags = Array.isArray(post.tags) && post.tags.length > 0 ? post.tags : ["Geen tags gevonden"];

    // Haal de artiesten uit de collectie
    const artists = await artistsCollection.find().toArray();
    if (!artists || artists.length === 0) {
      artists.push({
        name: "Geen artiesten gevonden",
        image: "static/icons/profile/avatar-stock.svg",
      });
    }

    // Render de micro-information.ejs en geef de data door
    res.render("micro-information.ejs", {
      img,
      titel,
      pageTitle: "Micro Information",
      post,       // Voeg de post toe
      tags,       // Voeg tags toe
      artists,    // Voeg artiesten toe
    });
  } catch (error) {
    console.error("Error loading page:", error);
    res.status(500).send("Er is een fout opgetreden.");
  }
});

app.get("/collectie", isAuthenticated, async (req, res) => {
  try {
    const collection = db.collection("users");
    const user = await collection.findOne({
      _id: new ObjectId(req.session.userId),
    });

    let userImages = [];

    if (user && user.userImages && Array.isArray(user.userImages)) {
      userImages = user.userImages;
    } else {
      console.warn(`No userImages array found for user ${req.session.userId}`);
    }

    res.render("collection.ejs", {
      pageTitle: "Collectie Bezoeker",
      username: req.session.username,
      userImages: userImages,
    });
  } catch (error) {
    console.error("Error fetching user's images:", error);
    res.status(500).send("An error occurred while loading the page.");
  }
});

app.get("/collectieArtist", isAuthenticated, async (req, res) => {
  try {
    const collection = db.collection("artists");
    const user = await collection.findOne({
      _id: new ObjectId(req.session.userId),
    });

    let artistImages = [];

    if (user && user.artistImages && Array.isArray(user.artistImages)) {
      artistImages = user.artistImages;
    } else {
      console.warn(`No userImages array found for user ${req.session.userId}`);
    }

    res.render("collectieArtist.ejs", {
      pageTitle: "Collectie Artist",
      username: req.session.username,
      artistImages: artistImages,
    });
  } catch (error) {
    console.error("Error fetching user's images:", error);
    res.status(500).send("An error occurred while loading the page.");
  }
});

app.get("/artist/:id", isAuthenticated, async (req, res) => {
  try {
    const collection = db.collection("artists");
    const artist = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!artist) {
      return res.status(404).send("Artiest niet gevonden");
    }

    // Pass artist and their images to the template
    res.render("detailpaginaA.ejs", {
      pageTitle: `Artiest: ${artist.username}`,
      artist: artist,
      artistImages: artist.artistImages || [], // Ensure an empty array if no images exist
    });
  } catch (error) {
    console.error("Fout bij het ophalen van artiest details:", error);
    res
      .status(500)
      .send("Er is een fout opgetreden bij het laden van de artiestenpagina");
  }
});

app.post("/add-to-collection", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).send("Image URL is required");
    }

    const usersCollection = db.collection("users");
    const artistsCollection = db.collection("artists");
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).send("User not authenticated");
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).send("Invalid user ID");
    }

    let userUpdateSuccess = false;
    let artistUpdateSuccess = false;

    const userResult = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { userImages: imageUrl } }
    );

    if (userResult.modifiedCount > 0) {
      userUpdateSuccess = true;
    }

    const artistResult = await artistsCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { artistImages: imageUrl } }
    );

    if (artistResult.modifiedCount > 0) {
      artistUpdateSuccess = true;
    }

    if (!userUpdateSuccess && !artistUpdateSuccess) {
      return res.status(404).send("No changes made to either collection");
    }

    res.status(200).send("Image added successfully");
  } catch (error) {
    console.error("Error adding to collection:", error);
    res.status(500).send("Internal server error");
  }
});

app.get("/profiel", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  // Haal de meest recente gebruiker op uit de database
  const usersCollection = db.collection("users");
  const user = await usersCollection.findOne({
    _id: new ObjectId(req.session.userId),
  });

  // Zorg dat er een standaard foto wordt gebruikt als er geen profielfoto is
  const profilePhoto =
    user?.profilePhoto || "/static/icons/profile/avatar-stock.svg";

  // Update de sessie met de juiste profielfoto
  req.session.profilePhoto = profilePhoto;

  res.render("profile.ejs", {
    pageTitle: "Profiel",
    user: {
      userId: req.session.userId,
      username: req.session.username || "Gast",
      email: req.session.email || "",
      isArtist: req.session.isArtist || false,
      profilePhoto: req.session.profilePhoto,
    },
  });
});

app.get("/profielArtist", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  // Haal de meest recente gebruiker op uit de database
  const usersCollection = db.collection("artists");
  const user = await usersCollection.findOne({
    _id: new ObjectId(req.session.userId),
  });

  // Zorg dat er een standaard foto wordt gebruikt als er geen profielfoto is
  const profilePhoto =
    user?.profilePhoto || "/static/icons/profile/avatar-stock.svg";

  // Update de sessie met de juiste profielfoto
  req.session.profilePhoto = profilePhoto;

  res.render("profileArtists.ejs", {
    pageTitle: "Profiel Artiesten",
    user: {
      userId: req.session.userId,
      username: req.session.username || "Gast",
      email: req.session.email || "",
      isArtist: req.session.isArtist || false,
      profilePhoto: req.session.profilePhoto,
    },
  });
});

app.get("/post", isAuthenticated, (req, res) => {
  const mapboxToken = process.env.MAPBOX_TOKEN; // Zorg ervoor dat MAPBOX_TOKEN is ingesteld in je .env bestand
  res.render("post.ejs", { pageTitle: "Post", mapboxToken: mapboxToken });
});

app.post(
  "/submit-post",
  isAuthenticated,
  upload.single("photo"),
  async (req, res) => {
    try {
      const collection = db.collection("posts");

      // Controleer of een bestand is geüpload
      const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

      // Valideer de aanwezigheid van verplichte velden
      if (
        !req.body.description ||
        !req.body.studioName ||
        !req.body.studioAddress
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Beschrijving, studionaam en adres zijn verplicht.",
          });
      }

      // Parse de tags, zorg ervoor dat het een array is
      let tags = [];
      try {
        tags = req.body.tags ? req.body.tags.split(",") : [];
        // Verwijder lege strings en trim de tags
        tags = tags.map((tag) => tag.trim()).filter((tag) => tag !== "");
      } catch (error) {
        console.error("Fout bij het verwerken van tags:", error);
        return res
          .status(400)
          .json({ success: false, message: "Ongeldige tags format." });
      }

      // Data opslaan in MongoDB
      const newPost = {
        description: xss(req.body.description),
        tags: tags.map((tag) => xss(tag)),
        studio: {
          name: xss(req.body.studioName),
          address: xss(req.body.studioAddress),
          lat: parseFloat(req.body.studioLat),
          lng: parseFloat(req.body.studioLng),
        },
        photo: photoPath,
        createdAt: new Date(),
        userId: req.session.userId,
      };

      const result = await collection.insertOne(newPost);

      if (result.acknowledged) {
        return res
          .status(200)
          .json({ success: true, message: "Post succesvol toegevoegd" });
      } else {
        console.error("Fout bij het toevoegen van de post aan de database");
        return res
          .status(500)
          .json({
            success: false,
            message: "Fout bij het toevoegen van de post aan de database",
          });
      }
    } catch (error) {
      console.error("Fout bij het opslaan van de post:", error);
      return res
        .status(500)
        .json({
          success: false,
          message:
            "Er is een fout opgetreden bij het opslaan van de post: " +
            error.message,
        });
    }
  }
);

app.post("/upload-photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).send("Niet geautoriseerd");
    }

    const newProfilePhoto = `/profile-photos/${req.file.filename}`;

    // Update de profielfoto in de database
    const usersCollection = db.collection("users");
    await usersCollection.updateOne(
      { _id: new ObjectId(req.session.userId) },
      { $set: { profilePhoto: newProfilePhoto } }
    );

    // Update de sessie met de nieuwe profielfoto
    req.session.profilePhoto = newProfilePhoto;

    res.json({ success: true, photoUrl: newProfilePhoto });
  } catch (error) {
    console.error("Error uploading photo:", error);
    res.status(500).send("Fout bij uploaden van de foto");
  }
});

// Error Handling
app.use((req, res) => {
  res.status(404).send("404 - Pagina niet gevonden");
  console.log(`404 Error: ${req.originalUrl}`);
});

app.use((err, req, res, next) => {
  console.error("Unexpected error:", err);
  res.status(500).render("error.ejs", {
    message: "Serverfout",
    error: err.message,
  });
});

// Start Server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
