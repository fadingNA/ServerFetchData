/*********************************************************************************
 *  WEB322 – Assignment 05
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part of this
 *  assignment has been copied manually or electronically from any other source (including web sites) or
 *  distributed to other students.
 *
 *  Name: NONTHACHAI PLODTHONG Student ID: 152487211 Date: 21/11/2022
 *
 *  Online (Heroku) Link:https://gentle-waters-38058.herokuapp.com/blog
 *
 ********************************************************************************/

const express = require('express');
const blogData = require("./blog-service");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require("express-handlebars");
//const path = require("path");
const stripJs = require('strip-js');

const app = express();


const HTTP_PORT = process.env.PORT || 8080;

cloudinary.config({
    cloud_name: 'dtlhnqkaj',
    api_key: '121322855444831',
    api_secret: 'Cq5h6bY4VkizCFVWlcUhiyTHZbU',
    secure: true
});

const upload = multer();

app.engine(".hbs", exphbs.engine({
    extname: ".hbs",
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url === app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue !== rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function (context) {
            return stripJs(context);
        },
        formatDate: function (dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }


    }
}));

app.set('view engine', '.hbs');

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = (route === "/") ? "/" : "/" + route.replace(/\/(.*)/, "");
    app.locals.viewingCategory = req.query.category;
    next();
});

app.get('/', (req, res) => {
    res.redirect("/blog");
});

app.get('/about', (req, res) => {
    res.render("about");
});

app.get('/blog', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try {

        // declare empty array to hold "post" objects
        let posts;

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await blogData.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0];

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;

    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = await blogData.getCategories();
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})

});

app.get('/posts', (req, res) => {
    //let queryPromise = null;
    if (req.query.category) {
        blogData.getPostsByCategory(req.query.category).then((data) => {
            if (data.length > 0) {
                res.render("posts", {posts: data});
            } else {
                res.render("posts", {message: "no results"});
            }
        }).catch((error) => {
            res.render("posts", {message: "no results"});
        })
    } else if (req.query.minDate) {
        blogData.getPostsByMinDate(req.query.minDate).then((data) => {
            if (data.length > 0) {
                res.render("posts", {posts: data});
            } else {
                res.render("posts", {message: "no results"});
            }
        }).catch((error) => {
            res.render("posts", {message: "no results"});
        })
    } else {
        blogData.getAllPosts().then((data) => {
            if (data.length > 0) {
                res.render("posts", {posts: data});
            } else {
                res.render("posts", {message: "no results"});
            }
        })
            .catch((err) => {
                res.render("posts", {message: "no results"});
            })
    }

});

app.get("/posts/add", function (req, res) {
    blogData.getCategories().then((data) => {
        res.render("addPost", {categories: data})

    }).catch((err) => {
        res.render("addPost", {categories: []});
    })
});

app.post("/posts/add", upload.single("featureImage"), (req, res) => {

    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processPost(uploaded.url);
        });
    } else {
        processPost("");
    }

    function processPost(imageUrl) {
        req.body.featureImage = imageUrl;

        blogData.addPost(req.body).then(post => {
            res.redirect("/posts");
        }).catch(err => {
            res.status(500).send(err);
        })
    }
});


app.get('/post/:id', (req, res) => {
    blogData.getPostById(req.params.val).then((data) => {
        res.render("posts", {posts: data});
    }).catch((err) => {
        res.render("posts", {message: "no results"});
    })
});

app.get("/posts/delete/:id", function (req, res) {
    blogData.deletePostById(req.params.id).then((data) => {
        res.redirect("/posts");
    }).catch((err) => {
        res.status(500).render("Unable to Remove Post / Post not found", {layout: 'main'})
    })
});

app.get('/blog/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try {

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await blogData.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;

    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the post by "id"
        viewData.post = await blogData.getPostById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await blogData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})
});

app.get("/category", function (req, res) {
    blogData.getCategories().then((data) => {
        if (data.length > 0) {
            res.render("categories", {categories: data});
        } else {
            res.render("categories", {message: "no results"});
        }
    })
        .catch((err) => {
            res.render("categories", {message: "no results"});
        });
});
app.get("/category/add", function (req, res) {
    res.render("addCategory", {
        layout: 'main'
    });
});
app.post("/categories/add", function (req, res) {
    blogData.addCategory(req.body).then(() => {
        res.redirect('/category')
    }).catch((error) => {
        res.status(500).send(error);
    });
});

app.get("/categories/delete/:id", function (req, res) {
    blogData.deleteCategoryById(req.params.id).then((data) => {
        res.redirect("/category")

    }).catch((error) => {
        console.log(error)
        res.status(500).send("Unable to Remove Category / Category not found!")
    })
});
app.use((req, res) => {
    res.status(404).render("404");
})

blogData.initialize().then(() => {
    app.listen(HTTP_PORT, () => {
        console.log('server listening on: ' + HTTP_PORT);
    });
}).catch((err) => {
    console.log(err);
})
