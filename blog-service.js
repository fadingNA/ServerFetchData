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
const Sequelize = require('sequelize');
var sequelize = new Sequelize('d9m5ufs2a94li4', 'zembpltnvjqcnq', '5c99aa54c90e6d1b6a8f80c0eaa030e78a5c053c6b73e881f1b21b068aee746d', {
    host: 'ec2-23-23-182-238.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: {rejectUnauthorized: false}
    },
    query: {raw: true}
});

var Post = sequelize.define('Post', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
})

var Category = sequelize.define('Category', {
    category: Sequelize.STRING
})

Post.belongsTo(Category, {as: 'category'});
module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(resolve('Sync Success'))
            .catch(reject('unable to sync the database'))
    });
};


module.exports.getAllPosts = function () {
    return new Promise((resolve, reject) => {
        Post.findAll().then((data) => {
            resolve(data)
        })
            .catch((error) => {
                reject("no result returned")
            })
    })
}

module.exports.getCategories = function () {
    return new Promise((resolve, reject) => {
        Category.findAll().then((data) => {
            resolve(data)
        }).catch((error) => {
            reject("no result returned")
        })
    })
}


module.exports.addPost = (postData) => {
    return new Promise((resolve, reject) => {
        postData.published = (postData.published) ? true : false;
        for (var i in postData) {
            if (postData[i] === "") {
                postData[i] = null;
            }
        }
        postData.postDate = new Date();
        Post.create(postData)
            .then(resolve(data))
            .catch(reject("no results returned"))
    });
};

module.exports.getPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                category: category
            },
        }).then((data) => {
            resolve(data)
        }).catch((error) => {
            reject("no result returned")
        })
    })
};

module.exports.getPostsByMinDate = function (minDateStr) {
    return new Promise((resolve, reject) => {
        const {gte} = Sequelize.Op;
        Post.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        }).then(data => {
            resolve(data)
        }).catch((error) => {
            reject("no result returned")
        })
    });
};


module.exports.getPostById = function (id) {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                id: id
            }
        }).then(data => {
            resolve(data);
        }).catch(err => {
            reject("no results returned");
        });
    });
}

module.exports.getPublishedPosts = function () {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                published: true
            }
        }).then((data) => {
            resolve(data)
        }).catch((error) => {
            reject("no result returned")
        })
    })
};

module.exports.getPublishedPostsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                category: category,
                published: true
            }
        }).then((data) => {
            resolve(data)
        }).catch((error) => {
            reject("no result returned")
        })
    })
};


module.exports.addCategory = function (categoryData) {
    return new Promise((resolve, reject) => {
        for (var i in categoryData) {
            if (categoryData[i] === "") {
                categoryData[i] = null;
            }
        }
        Category.create(categoryData)
            .then(() => {
                resolve();
            }).catch((err) => {
            reject("unable to create category");
        });
    });
}


module.exports.deleteCategoryById = (id) => {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: {
                id: id
            }
        }).then(() => {
            resolve()
        }).catch((error) => {
            reject("error ocurred while deleting")
        })
    })
};


module.exports.deletePostById = (id) => {
    return new Promise((resolve, reject) => {
        Post.destroy({
            where: {
                id: id
            }
        }).then(() => {
            resolve()
        }).catch((error) => {
            reject("error ocurred while deleting")
        })
    })
};